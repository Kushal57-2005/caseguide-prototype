/**
 * @file llm.test.js
 * @description Unit tests for LLM service in mock mode to verify sample question matching and structured responses.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { generateLegalAdvice } from '../services/llm.js';
import { config } from '../config/env.js';

describe('LLM Service (Mock Mode) Tests', () => {
  beforeAll(() => {
    config.mockLlm = true;
  });
  it('should return defective product answer for consumer refund query', async () => {
    const res = await generateLegalAdvice({
      question: 'Seller sent broken laptop and refuses to give my refund.'
    });

    expect(res).toBeDefined();
    expect(res.answer.in_scope).toBe(true);
    expect(res.answer.category).toBe('consumer');
    expect(res.answer.legal_match.some(m => m.name.includes('Consumer Protection Act'))).toBe(true);
    expect(res.answer.next_steps.length).toBeGreaterThan(0);
    expect(res.model).toContain('MOCK_MODE');
  });

  it('should return cyber fraud answer for UPI scam query', async () => {
    const res = await generateLegalAdvice({
      question: 'I received a fake SMS and ₹25,000 was debited via UPI link.'
    });

    expect(res).toBeDefined();
    expect(res.answer.category).toBe('cyber fraud');
    expect(res.answer.legal_match.some(m => m.name.includes('Bharatiya Nyaya Sanhita') || m.reference.includes('318'))).toBe(true);
    expect(res.answer.forum.office).toContain('1930');
  });

  it('should return FIR refusal answer for police refusing FIR query', async () => {
    const res = await generateLegalAdvice({
      question: 'Local police station SHO is refusing to register FIR for my stolen vehicle.'
    });

    expect(res).toBeDefined();
    expect(res.answer.category).toBe('police/FIR');
    expect(res.answer.legal_match.some(m => m.name.includes('BNSS') || m.reference.includes('173'))).toBe(true);
  });

  it('should return RTI answer for RTI no reply query', async () => {
    const res = await generateLegalAdvice({
      question: 'I filed an RTI 40 days ago to the municipal corporation but received no reply.'
    });

    expect(res).toBeDefined();
    expect(res.answer.category).toBe('RTI');
    expect(res.answer.legal_match.some(m => m.reference.includes('Section 7(1)'))).toBe(true);
  });

  it('should return generic valid legal response for an arbitrary legal question', async () => {
    const res = await generateLegalAdvice({
      question: 'My landlord entered my rented apartment without notice and changed locks.'
    });

    expect(res).toBeDefined();
    expect(res.answer.in_scope).toBe(true);
    expect(res.answer.plain_explanation).toBeDefined();
    expect(res.answer.next_steps.length).toBeGreaterThan(0);
  });
});
