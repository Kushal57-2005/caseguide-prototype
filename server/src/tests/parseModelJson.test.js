/**
 * @file parseModelJson.test.js
 * @description Comprehensive unit tests for parseModelJson utility:
 * tests stripping of <think>...</think> tags, markdown code fences, malformed JSON handling, and schema validation.
 */

import { describe, it, expect } from 'vitest';
import {
  stripFencesAndThinking,
  extractFirstJsonObject,
  parseAndValidateModelOutput
} from '../utils/parseModelJson.js';

describe('parseModelJson Utility Unit Tests', () => {
  it('should strip <think>...</think> blocks cleanly', () => {
    const raw = `<think>
This is an internal reasoning trace from Nemotron.
The user is asking about FIR refusal under BNSS 173.
</think>
{"in_scope": true, "problem_summary": "Police FIR refusal"}`;

    const stripped = stripFencesAndThinking(raw);
    expect(stripped).not.toContain('<think>');
    expect(stripped).not.toContain('reasoning trace');
    expect(stripped).toContain('"problem_summary": "Police FIR refusal"');
  });

  it('should strip unclosed <think> tag if model was truncated during reasoning', () => {
    const raw = `<think>Some incomplete chain of thought...`;
    const stripped = stripFencesAndThinking(raw);
    expect(stripped).toBe('');
  });

  it('should strip markdown code fences with json language tag', () => {
    const raw = `\`\`\`json
{
  "in_scope": true,
  "problem_summary": "UPI Scam"
}
\`\`\``;

    const stripped = stripFencesAndThinking(raw);
    expect(stripped.startsWith('{')).toBe(true);
    expect(stripped.endsWith('}')).toBe(true);
    expect(stripped).not.toContain('```');
  });

  it('should extract first top-level JSON object from text with preamble and postamble', () => {
    const raw = `Here is the legal evaluation you requested:
    {
      "in_scope": true,
      "problem_summary": "Consumer refund dispute",
      "category": "consumer"
    }
    Hope this general information helps your situation!`;

    const parsed = extractFirstJsonObject(raw);
    expect(parsed.in_scope).toBe(true);
    expect(parsed.problem_summary).toBe('Consumer refund dispute');
    expect(parsed.category).toBe('consumer');
  });

  it('should throw an error for malformed or missing JSON', () => {
    expect(() => extractFirstJsonObject('No JSON here at all.')).toThrow('No JSON object found');
    expect(() => extractFirstJsonObject('{ "broken_json": ')).toThrow('Incomplete JSON object');
  });

  it('should parse and apply default schema fields when valid JSON is provided', () => {
    const raw = `{
      "in_scope": true,
      "problem_summary": "RTI Appeal Delay",
      "category": "RTI",
      "legal_match": [
        {
          "type": "Section",
          "name": "RTI Act, 2005",
          "reference": "Section 19(1)",
          "why_it_applies": "First Appeal provision",
          "confidence": "high"
        }
      ],
      "plain_explanation": "You can file an appeal within 30 days.",
      "next_steps": [
        { "title": "Submit Appeal", "detail": "Write to the FAA." }
      ]
    }`;

    const validated = parseAndValidateModelOutput(raw);
    expect(validated.in_scope).toBe(true);
    expect(validated.problem_summary).toBe('RTI Appeal Delay');
    expect(validated.legal_match).toHaveLength(1);
    expect(validated.legal_match[0].confidence).toBe('high');
    expect(validated.next_steps).toHaveLength(1);
    expect(validated.forum.office).toBeDefined(); // Applied schema default
    expect(validated.disclaimer).toBeDefined(); // Applied schema default
  });
});
