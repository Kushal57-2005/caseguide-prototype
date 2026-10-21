/**
 * @file LegalAnswerCard.jsx
 * @description Master structured answer card rendering Indian legal provisions, next steps, forum details,
 * interactive document checklist, timeline, warnings, India Code verification, and export tools (Copy & Print).
 * @inputs Props { answer, latencyMs, model, error }
 * @outputs Fully formatted interactive legal card.
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  Clock,
  Building2,
  Receipt,
  FileCheck2,
  ExternalLink,
  Copy,
  Printer,
  Check,
  AlertTriangle,
  Info,
  CalendarDays
} from 'lucide-react';

export default function LegalAnswerCard({ answer, latencyMs = 0, model = 'Nemotron' }) {
  const [copied, setCopied] = useState(false);
  const [checkedDocs, setCheckedDocs] = useState({});

  if (!answer) return null;

  // Handle Out-Of-Scope Questions
  if (answer.in_scope === false) {
    return (
      <div className="answer-card out-of-scope-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f59e0b', marginBottom: '12px' }}>
          <Info size={24} />
          <h3 className="font-serif" style={{ fontSize: '1.2rem' }}>Not a Legal Issue (Out of Scope)</h3>
        </div>
        <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 16px auto' }}>
          {answer.plain_explanation || 'This question does not appear to involve Indian legal or statutory rights. caseGuide specializes in Indian laws (BNS, BNSS, Consumer Protection, RTI, Cyber Fraud, Tenancy, and Civil/Criminal procedures).'}
        </p>
        <div style={{ fontSize: '0.8rem', color: '#8899af' }}>
          Please try asking about a consumer grievance, banking fraud, police FIR issue, or legal query.
        </div>
      </div>
    );
  }

  // Handle Unstructured Fallback Text
  if (answer.is_fallback_unstructured) {
    return (
      <div className="answer-card">
        <div className="answer-header">
          <div className="category-badge">
            <Info size={12} /> Notice
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8899af' }}>
            Model output delivered as plain text
          </div>
        </div>
        <div className="plain-explanation-box">
          {answer.plain_explanation}
        </div>
        <div className="official-banner">
          <div>⚠️ AI-generated, not verified against official sources. Check the sections on indiacode.nic.in or with a lawyer.</div>
          <a href="https://www.indiacode.nic.in" target="_blank" rel="noreferrer">
            Visit India Code <ExternalLink size={12} style={{ display: 'inline' }} />
          </a>
        </div>
      </div>
    );
  }

  const toggleDoc = (index) => {
    setCheckedDocs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Plain text export for clipboard
  const handleCopyText = () => {
    const lines = [
      `caseGuide Legal Information Summary`,
      `====================================`,
      `Problem: ${answer.problem_summary || ''}`,
      `Category: ${answer.category || 'General'}`,
      ``,
      `LEGAL MATCHES:`,
      ...(answer.legal_match || []).map(m => `- ${m.name} [${m.reference}] (Confidence: ${m.confidence}): ${m.why_it_applies}`),
      ``,
      `IN PLAIN WORDS:`,
      `${answer.plain_explanation || ''}`,
      ``,
      `NEXT STEPS:`,
      ...(answer.next_steps || []).map((s, i) => `${i + 1}. ${s.title}: ${s.detail}`),
      ``,
      `FORUM:`,
      `Office: ${answer.forum?.office || 'N/A'}`,
      `Statutory Fee: ${answer.forum?.fee || 'N/A'}`,
      `Likely Time: ${answer.forum?.likely_time || 'N/A'}`,
      ``,
      `DOCUMENTS NEEDED:`,
      ...(answer.documents_needed || []).map(d => `- [ ] ${d}`),
      ``,
      `TIMELINE:`,
      ...(answer.timeline || []).map(t => `- ${t.when}: ${t.what}`),
      ``,
      `WARNINGS:`,
      ...(answer.warnings || []).map(w => `! ${w}`),
      ``,
      `Disclaimer: ${answer.disclaimer || ''}`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <article className="answer-card" id="legal-answer-card">
      {/* Card Header & Controls */}
      <div className="answer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="category-badge">
            <Scale size={13} />
            {answer.category || 'Indian Law'}
          </span>
          {latencyMs > 0 && (
            <span style={{ fontSize: '0.72rem', color: '#8899af' }}>
              {(latencyMs / 1000).toFixed(1)}s • {model}
            </span>
          )}
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopyText}
            title="Copy legal summary as plain text"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            {copied ? (
              <>
                <Check size={14} color="#10b981" /> Copied!
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Summary
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePrint}
            title="Print or Save as PDF"
            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* 1. Problem in Short */}
      <div>
        <div className="card-section-title">
          <Info size={13} /> Problem in Short
        </div>
        <h3 className="problem-short-text">
          {answer.problem_summary}
        </h3>
      </div>

      {/* 2. Legal Match Chips with Confidence Badges & India Code Link */}
      {answer.legal_match && answer.legal_match.length > 0 && (
        <div>
          <div className="card-section-title">
            <Scale size={13} /> Legal Match & Statutory Provisions
          </div>
          <div className="legal-chips-grid">
            {answer.legal_match.map((item, idx) => {
              const conf = item.confidence?.toLowerCase() || 'medium';
              const confClass = conf === 'high' ? 'confidence-high' : conf === 'low' ? 'confidence-low' : 'confidence-medium';
              const indiaCodeUrl = `https://www.indiacode.nic.in/handle/123456789/1362/simple-search?query=${encodeURIComponent(item.name || item.reference)}`;

              return (
                <div key={idx} className="legal-chip-item">
                  <div className="chip-header">
                    <div className="chip-act-name">
                      <span>{item.name}</span>
                      {item.reference && (
                        <span className="chip-reference">({item.reference})</span>
                      )}
                    </div>
                    <div className="chip-badges-wrap">
                      <span className={`confidence-badge ${confClass}`}>
                        {conf} confidence
                      </span>
                      <a
                        href={indiaCodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="verify-link"
                        title="Verify section on official India Code repository"
                      >
                        Verify on India Code
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  {item.why_it_applies && (
                    <p className="chip-why-text">
                      <strong>Why it applies:</strong> {item.why_it_applies}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. In Plain Words */}
      {answer.plain_explanation && (
        <div>
          <div className="card-section-title">
            <FileCheck2 size={13} /> In Plain Words
          </div>
          <div className="plain-explanation-box">
            {answer.plain_explanation}
          </div>
        </div>
      )}

      {/* 4. What To Do Next (Numbered Steps) */}
      {answer.next_steps && answer.next_steps.length > 0 && (
        <div>
          <div className="card-section-title">
            <Clock size={13} /> What To Do Next (Step-by-Step Action)
          </div>
          <div className="next-steps-list">
            {answer.next_steps.map((step, idx) => (
              <div key={idx} className="step-card">
                <div className="step-number">{idx + 1}</div>
                <div className="step-content">
                  <div className="step-title">{step.title}</div>
                  <div className="step-detail">{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Where To Go (Forum - 3 small boxes) */}
      {answer.forum && (
        <div>
          <div className="card-section-title">
            <Building2 size={13} /> Where To Go (Forum & Costs)
          </div>
          <div className="forum-grid">
            <div className="forum-box">
              <span className="forum-box-label">Concerned Office / Forum</span>
              <span className="forum-box-value">{answer.forum.office || 'Designated Office'}</span>
            </div>
            <div className="forum-box">
              <span className="forum-box-label">Statutory / Court Fee</span>
              <span className="forum-box-value">{answer.forum.fee || 'Nominal / Nil'}</span>
            </div>
            <div className="forum-box">
              <span className="forum-box-label">Likely Timeframe</span>
              <span className="forum-box-value">{answer.forum.likely_time || 'Case dependent'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Papers To Keep Ready (Interactive Checklist) */}
      {answer.documents_needed && answer.documents_needed.length > 0 && (
        <div>
          <div className="card-section-title">
            <Receipt size={13} /> Papers to Keep Ready (Checklist)
          </div>
          <div className="papers-checklist">
            {answer.documents_needed.map((doc, idx) => {
              const isChecked = !!checkedDocs[idx];
              return (
                <div
                  key={idx}
                  className={`checklist-item ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleDoc(idx)}
                >
                  <div className="checklist-checkbox">
                    {isChecked && <Check size={12} />}
                  </div>
                  <span className="checklist-text">{doc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Timeline (Horizontal on desktop) */}
      {answer.timeline && answer.timeline.length > 0 && (
        <div>
          <div className="card-section-title">
            <CalendarDays size={13} /> Expected Timeline
          </div>
          <div className="timeline-horizontal">
            {answer.timeline.map((item, idx) => (
              <div key={idx} className="timeline-step">
                <span className="timeline-when">{item.when}</span>
                <span className="timeline-what">{item.what}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Warnings (Highlighted alert box) */}
      {answer.warnings && answer.warnings.length > 0 && (
        <div className="warnings-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
            <AlertTriangle size={15} /> Crucial Warnings & Limitations
          </div>
          {answer.warnings.map((warning, idx) => (
            <div key={idx} className="warning-item">
              <span style={{ color: '#ef4444' }}>•</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* 9. Disclaimer */}
      {answer.disclaimer && (
        <div className="disclaimer-text">
          {answer.disclaimer}
        </div>
      )}

      {/* 10. Official Verification Banner */}
      <div className="official-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span>AI-generated, not verified against official sources. Check the sections on indiacode.nic.in or with a lawyer.</span>
        </div>
        <a
          href="https://www.indiacode.nic.in"
          target="_blank"
          rel="noreferrer"
          style={{ whiteSpace: 'nowrap' }}
        >
          India Code Portal <ExternalLink size={12} style={{ display: 'inline' }} />
        </a>
      </div>
    </article>
  );
}
