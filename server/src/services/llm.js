/**
 * @file llm.js
 * @description Core LLM abstraction service for caseGuide interfacing with NVIDIA NIM Nemotron-3 Ultra.
 * @inputs User query string, conversation history array, and runtime configuration.
 * @outputs Validated legal answer object, model name, response latency, and error state.
 */

import OpenAI from 'openai';
import { config } from '../config/env.js';
import { parseAndValidateModelOutput, stripFencesAndThinking } from '../utils/parseModelJson.js';
import { getMockLegalAnswer } from './mockLegalAnswers.js';

export const SYSTEM_PROMPT = `You are caseGuide, a legal information assistant for people in India. Explain the law in simple language. Use current Indian law: use BNS (Bharatiya Nyaya Sanhita), BNSS and BSA, and mention the old IPC/CrPC number only as a comparison. Be careful: never invent section numbers, case names or URLs. If you are not sure about a section, set confidence to 'low' and say so. If the question is not a legal problem, set in_scope to false and explain briefly. Give general information, not legal advice. Reply with ONE JSON object only, no markdown, no text outside the JSON.

Required JSON schema:
{
  "in_scope": boolean,
  "problem_summary": string,
  "category": string,
  "legal_match": [
    {
      "type": "Act|Section|Article|Case|Rule",
      "name": string,
      "reference": string,
      "why_it_applies": string,
      "confidence": "high|medium|low"
    }
  ],
  "plain_explanation": string,
  "next_steps": [
    {
      "title": string,
      "detail": string
    }
  ],
  "forum": {
    "office": string,
    "fee": string,
    "likely_time": string
  },
  "documents_needed": [ string ],
  "timeline": [
    {
      "when": string,
      "what": string
    }
  ],
  "warnings": [ string ],
  "disclaimer": string
}`;

/**
 * Initializes OpenAI client targeting NVIDIA NIM
 */
function createOpenAIClient() {
  return new OpenAI({
    apiKey: config.nvidiaApiKey || 'mock-key',
    baseURL: config.nvidiaBaseUrl,
    timeout: 60 * 1000 // 60-second timeout
  });
}

/**
 * Executes a single completion call to NVIDIA NIM
 */
async function callNemotron(client, messages) {
  const completion = await client.chat.completions.create({
    model: config.nvidiaModel,
    messages,
    temperature: 0.2,
    top_p: 0.95,
    max_tokens: 4096,
    chat_template_kwargs: {
      enable_thinking: config.enableThinking
    }
  });

  const choice = completion.choices?.[0];
  const message = choice?.message;

  // Never use reasoning_content in user answer; use content only
  const content = message?.content || '';
  return content;
}

/**
 * Formats past conversation messages into OpenAI message objects
 * Limits to last 6 messages to preserve context without exceeding token window
 */
function buildConversationContext(history = []) {
  const recentHistory = history.slice(-6);
  const contextMessages = [];

  for (const msg of recentHistory) {
    if (msg.role === 'user') {
      contextMessages.push({
        role: 'user',
        content: msg.content
      });
    } else if (msg.role === 'assistant' && msg.answer) {
      // Summarize previous assistant answer as context
      const summary = `Previous legal response for [${msg.answer.category || 'general'}]: ${msg.answer.problem_summary || ''}. Key points: ${msg.answer.plain_explanation || ''}`;
      contextMessages.push({
        role: 'assistant',
        content: summary
      });
    }
  }

  return contextMessages;
}

/**
 * Main LLM call entry point for caseGuide legal querying.
 * Supports MOCK_LLM mode, single retry on invalid JSON, and robust fallback error handling.
 * 
 * @param {object} params
 * @param {string} params.question - The user's plain words legal query
 * @param {Array} params.history - Array of previous messages in this chat
 * @returns {Promise<object>} Structured result object
 */
export async function generateLegalAdvice({ question, history = [] }) {
  const startTime = Date.now();

  // 1. Check if Mock Mode is enabled
  if (config.mockLlm) {
    // Simulate brief network latency for realistic UX
    await new Promise(resolve => setTimeout(resolve, 800));
    const mockAnswer = getMockLegalAnswer(question);
    const latencyMs = Date.now() - startTime;

    return {
      answer: mockAnswer,
      model: `${config.nvidiaModel} (MOCK_MODE)`,
      latencyMs,
      error: null,
      rawText: JSON.stringify(mockAnswer, null, 2)
    };
  }

  // 2. Real NVIDIA NIM Invocation
  const client = createOpenAIClient();
  const context = buildConversationContext(history);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...context,
    { role: 'user', content: question }
  ];

  let rawOutput = '';
  try {
    rawOutput = await callNemotron(client, messages);
    
    // Attempt parsing & validation
    try {
      const validated = parseAndValidateModelOutput(rawOutput);
      return {
        answer: validated,
        model: config.nvidiaModel,
        latencyMs: Date.now() - startTime,
        error: null,
        rawText: rawOutput
      };
    } catch (parseError) {
      console.warn(`[caseGuide-LLM] First parse attempt failed: ${parseError.message}. Retrying once...`);

      // Retry once with an explicit reminder message
      const retryMessages = [
        ...messages,
        { role: 'assistant', content: rawOutput },
        {
          role: 'user',
          content: 'Your previous response could not be parsed into the required JSON schema. Return ONLY ONE valid JSON object conforming to the schema, with no markdown code fences and no text outside the JSON.'
        }
      ];

      const retryOutput = await callNemotron(client, retryMessages);
      try {
        const validatedRetry = parseAndValidateModelOutput(retryOutput);
        return {
          answer: validatedRetry,
          model: config.nvidiaModel,
          latencyMs: Date.now() - startTime,
          error: null,
          rawText: retryOutput
        };
      } catch (retryParseError) {
        console.error(`[caseGuide-LLM] Second parse attempt also failed: ${retryParseError.message}. Using fallback answer.`);
        
        // Save the raw text as a fallback answer and show it as plain text with a note
        const fallbackAnswer = {
          in_scope: true,
          problem_summary: question.length > 100 ? question.slice(0, 100) + '...' : question,
          category: 'general legal',
          legal_match: [],
          plain_explanation: stripFencesAndThinking(retryOutput || rawOutput),
          next_steps: [
            {
              title: 'Review Generated Guidance',
              detail: 'The legal model produced unstructured text. Please consult an advocate to verify specific sections.'
            }
          ],
          forum: {
            office: 'Appropriate Legal Authority / Court',
            fee: 'Standard forum fee',
            likely_time: 'Case dependent'
          },
          documents_needed: ['Relevant identity proofs and case documents'],
          timeline: [],
          warnings: ['This response could not be automatically formatted into structured sections.'],
          disclaimer: 'Informational legal summary. Please verify against official gazettes or consult a qualified advocate.',
          is_fallback_unstructured: true
        };

        return {
          answer: fallbackAnswer,
          model: config.nvidiaModel,
          latencyMs: Date.now() - startTime,
          error: 'Formatting notice: Displayed as unstructured text.',
          rawText: retryOutput || rawOutput
        };
      }
    }
  } catch (apiError) {
    const latencyMs = Date.now() - startTime;
    console.error(`[caseGuide-LLM] API Exception:`, apiError);

    let friendlyMessage = 'Unable to contact legal AI assistant. Please try again.';
    let statusCode = 500;

    if (apiError.status === 401 || (apiError.message && apiError.message.includes('401'))) {
      friendlyMessage = 'Authentication failed: Invalid or expired NVIDIA NIM API key. Please check your server/.env configuration.';
      statusCode = 401;
    } else if (apiError.status === 429 || (apiError.message && apiError.message.includes('429'))) {
      friendlyMessage = 'NVIDIA NIM API rate limit reached. Please wait a few seconds before retrying.';
      statusCode = 429;
    } else if (apiError.code === 'ETIMEDOUT' || apiError.message?.includes('timeout')) {
      friendlyMessage = 'Request timed out after 60 seconds. The NVIDIA Nemotron model took too long to reply.';
      statusCode = 504;
    } else if (apiError.status >= 500) {
      friendlyMessage = 'NVIDIA NIM service currently experiencing issues (5xx). Please try again shortly.';
      statusCode = 502;
    }

    const errorObj = new Error(friendlyMessage);
    errorObj.statusCode = statusCode;
    errorObj.original = apiError.message;
    errorObj.latencyMs = latencyMs;
    throw errorObj;
  }
}
