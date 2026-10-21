/**
 * @file parseModelJson.js
 * @description Robust parsing and Zod schema validation for NVIDIA Nemotron model responses.
 * @inputs Raw string output from LLM (potentially containing <think> tags, markdown fences, or malformed JSON).
 * @outputs Validated JavaScript object matching legal schema or throws descriptive ParseError.
 */

import { z } from 'zod';

// Zod Schema for caseGuide Legal Answer Structure
export const LegalMatchItemSchema = z.object({
  type: z.string().default('Section'), // 'Act' | 'Section' | 'Article' | 'Case' | 'Rule'
  name: z.string().default(''),
  reference: z.string().default(''),
  why_it_applies: z.string().default(''),
  confidence: z.enum(['high', 'medium', 'low']).default('medium')
});

export const NextStepItemSchema = z.object({
  title: z.string().default(''),
  detail: z.string().default('')
});

export const ForumSchema = z.object({
  office: z.string().default('District Court / Consumer Forum'),
  fee: z.string().default('Nominal / Not specified'),
  likely_time: z.string().default('1 - 3 months')
});

export const TimelineItemSchema = z.object({
  when: z.string().default(''),
  what: z.string().default('')
});

export const LegalAnswerSchema = z.object({
  in_scope: z.boolean().default(true),
  problem_summary: z.string().default('Legal information request'),
  category: z.string().default('general legal'),
  legal_match: z.array(LegalMatchItemSchema).default([]),
  plain_explanation: z.string().default(''),
  next_steps: z.array(NextStepItemSchema).default([]),
  forum: ForumSchema.default({
    office: 'Concerned Authority',
    fee: 'Standard nominal fee',
    likely_time: 'Depends on proceedings'
  }),
  documents_needed: z.array(z.string()).default([]),
  timeline: z.array(TimelineItemSchema).default([]),
  warnings: z.array(z.string()).default([]),
  disclaimer: z.string().default('This is general legal information for Indian jurisdiction, not formal legal advice. Consult an advocate for legal representation.')
});

/**
 * Strips <think>...</think> tags and extraneous markdown code fences from LLM responses.
 * @param {string} rawText 
 * @returns {string} Cleaned text candidate for JSON parsing
 */
export function stripFencesAndThinking(rawText) {
  if (typeof rawText !== 'string') return '';

  let cleaned = rawText;

  // 1. Remove <think>...</think> reasoning blocks (even across multiple lines)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // 2. Remove unclosed <think> tag if model cut off during thinking
  cleaned = cleaned.replace(/<think>[\s\S]*/gi, '');

  // 3. Remove markdown json code fences ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/gi, '$1');

  return cleaned.trim();
}

/**
 * Extracts the first top-level JSON object {...} and parses it.
 * @param {string} rawText 
 * @returns {object} Parsed JSON object
 */
export function extractFirstJsonObject(rawText) {
  const cleaned = stripFencesAndThinking(rawText);

  // Find first '{'
  const firstOpen = cleaned.indexOf('{');
  if (firstOpen === -1) {
    throw new Error('No JSON object found in model output.');
  }

  // Find the matching or last closing '}'
  const lastClose = cleaned.lastIndexOf('}');
  if (lastClose === -1 || lastClose <= firstOpen) {
    throw new Error('Incomplete JSON object in model output.');
  }

  const jsonCandidate = cleaned.substring(firstOpen, lastClose + 1);

  try {
    return JSON.parse(jsonCandidate);
  } catch (err) {
    throw new Error(`Invalid JSON syntax: ${err.message}`);
  }
}

/**
 * Parses raw text from LLM and validates against LegalAnswerSchema.
 * @param {string} rawText 
 * @returns {object} Validated structured answer
 */
export function parseAndValidateModelOutput(rawText) {
  const obj = extractFirstJsonObject(rawText);

  // Validate and apply schema defaults
  const parsed = LegalAnswerSchema.safeParse(obj);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Schema validation failed: ${errorDetails}`);
  }

  return parsed.data;
}
