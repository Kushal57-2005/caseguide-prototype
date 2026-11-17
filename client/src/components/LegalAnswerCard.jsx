/**
 * @file LegalAnswerCard.jsx
 * @description Claude-inspired editorial legal response component:
 * - Editorial typography with Markdown rendering (headings, paragraphs, lists, tables, code blocks)
 * - Expandable Legal Sources & Statutory Citations (Act, Section, verbatim excerpt, official India Code link)
 * - Judgment Presentation Cards (Case title, Court name, Judgment date, Case number, Paragraph references, View PDF/Record)
 * - What to Do Next (Step-by-step action plan)
 * - Important Warnings & Limitations callout
 * - Subtle response actions (Copy, Regenerate, Thumbs Up/Down feedback, Share/Print)
 */

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Scale,
  Clock,
  ExternalLink,
  Copy,
  Printer,
  Check,
  AlertTriangle,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Share2,
  Info
} from 'lucide-react';

export default function LegalAnswerCard({
  answer,
  onRegenerate = null
}) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'helpful' | 'unhelpful' | null
  const [sourcesExpanded, setSourcesExpanded] = useState(true);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null);

  if (!answer) return null;

  // Extract structured response or fallback to legacy answer structure
  const rag = answer?.structuredResponse || answer || {};
  const problemSummary = rag.problem_summary || {};
  const answerDetails = rag.answer || {};
  const citations = Array.isArray(rag.citations) ? rag.citations : [];
  const nextStepsActions = Array.isArray(rag.next_steps?.actions)
    ? rag.next_steps.actions
    : Array.isArray(rag.next_steps)
    ? rag.next_steps
    : [];
  const warningsList = Array.isArray(rag.warnings) ? rag.warnings : [];
  const limitationsList = Array.isArray(rag.limitations) ? rag.limitations : [];

  // Plain explanation / summary
  const summaryText =
    (typeof answerDetails === 'object' ? answerDetails.summary : null) ||
    answer?.plain_explanation ||
    '';

  const explanationPoints =
    typeof answerDetails === 'object' && Array.isArray(answerDetails.explanation)
      ? answerDetails.explanation
      : [];

  const problemTitle =
    (typeof problemSummary === 'object' ? problemSummary.title : null) ||
    (typeof answer?.problem_summary === 'string' ? answer.problem_summary : null) ||
    '';

  const category =
    (typeof problemSummary === 'object' ? problemSummary.category : null) ||
    answer?.category ||
    'Indian Law';

  // Handle Out-Of-Scope Questions
  if (rag.in_scope === false || answer?.in_scope === false) {
    return (
      <article className="claude-answer-container">
        <div className="out-of-scope-notice">
          <div className="notice-header">
            <Info size={16} className="inline-icon" />
            <h3 className="section-subheading">Non-Legal Query</h3>
          </div>
          <p className="notice-body">
            {summaryText ||
              'This question does not appear to involve Indian legal rights or statutory procedures. CaseGuide specializes in Indian laws (BNS, BNSS, Consumer Protection, RTI, Motor Vehicles, Tenancy, and Civil/Criminal procedures).'}
          </p>
        </div>
      </article>
    );
  }

  // Extract judgments if present in citations or structured response
  const rawJudgments = Array.isArray(rag.judgments)
    ? rag.judgments
    : citations.filter(
        (c) =>
          c.act?.toLowerCase().includes('court') ||
          c.title?.toLowerCase().includes(' v. ') ||
          c.title?.toLowerCase().includes(' vs ') ||
          c.section?.toLowerCase().includes('judgment') ||
          c.court
      );

  const judgments = rawJudgments.map((j) => {
    return {
      title: j.title || j.case_title || j.act || 'Court Precedent',
      court: j.court || j.court_name || (j.act?.includes('Court') ? j.act : 'Supreme Court of India'),
      date: j.date || j.judgment_date || j.year || 'Reported Judgment',
      caseNumber: j.case_number || j.case_no || (j.section?.includes('Writ') || j.section?.includes('Appeal') ? j.section : 'Writ Petition / Appeal'),
      paragraphRef: j.paragraphs || j.paragraph_ref || (j.supporting_text ? `Key Excerpt: "${j.supporting_text}"` : null),
      pdfUrl: j.url || j.pdf_url || `https://indiankanoon.org/search/?formInput=${encodeURIComponent(j.title || j.act || 'Supreme Court')}`
    };
  });

  const statutoryCitations = citations.filter(
    (c) => !rawJudgments.some((j) => j.citation_id === c.citation_id || j.title === c.title)
  );

  // Plain text export for clipboard / share
  const getFormattedPlainText = () => {
    const lines = [];
    if (problemTitle) lines.push(`CaseGuide Legal Research: ${problemTitle}`, ``);
    if (category) lines.push(`Category: ${category}`, ``);
    if (summaryText) lines.push(`Summary:`, summaryText, ``);
    if (explanationPoints.length > 0) {
      lines.push(`Legal Explanation:`);
      explanationPoints.forEach((p, i) => lines.push(`${i + 1}. ${p}`));
      lines.push(``);
    }
    if (statutoryCitations.length > 0) {
      lines.push(`Sources & Provisions:`);
      statutoryCitations.forEach((c) => {
        lines.push(`- ${c.act} (${c.section || ''}): ${c.title || ''}`);
        if (c.supporting_text) lines.push(`  "${c.supporting_text}"`);
      });
      lines.push(``);
    }
    if (judgments.length > 0) {
      lines.push(`Relevant Precedents:`);
      judgments.forEach((j) => {
        lines.push(`- ${j.title} (${j.court}, ${j.date}) - ${j.caseNumber}`);
      });
      lines.push(``);
    }
    if (nextStepsActions.length > 0) {
      lines.push(`Next Steps:`);
      nextStepsActions.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.title || ''}: ${s.description || s.detail || ''}`);
      });
      lines.push(``);
    }
    lines.push(`Generated by CaseGuide AI — Indian Legal Research Assistant.`);
    return lines.join('\n');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getFormattedPlainText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = getFormattedPlainText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `CaseGuide: ${problemTitle || 'Legal Research'}`,
          text
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // Share cancelled or unavailable
      }
    } else {
      handleCopyText();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFeedback = (val) => {
    setFeedback((prev) => (prev === val ? null : val));
  };

  const isFallback =
    Boolean(
      rag.metadata?.is_fallback ||
      rag.metadata?.status === 'FALLBACK' ||
      rag.status === 'fallback' ||
      answer?.is_fallback ||
      answer?.status === 'fallback'
    );

  // Render Fallback response directly in clean editorial prose
  if (isFallback) {
    return (
      <article className="claude-answer-container" id="legal-answer-card">
        <div className="editorial-summary-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
        </div>

        {/* Subtle Response Actions Bar */}
        <div className="response-actions-bar">
          <div className="actions-group-left">
            <button
              type="button"
              className="action-pill-btn"
              onClick={handleCopyText}
              title="Copy response to clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} color="var(--primary-brand)" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onRegenerate && (
              <button
                type="button"
                className="action-pill-btn"
                onClick={onRegenerate}
                title="Regenerate this response"
              >
                <RotateCcw size={14} />
                <span>Retry</span>
              </button>
            )}

            <button
              type="button"
              className="action-pill-btn"
              onClick={handleShare}
              title="Share response"
            >
              {shared ? (
                <>
                  <Check size={14} color="var(--primary-brand)" />
                  <span>Shared</span>
                </>
              ) : (
                <>
                  <Share2 size={14} />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>

          <div className="actions-group-right">
            <button
              type="button"
              className={`feedback-btn ${feedback === 'helpful' ? 'active-good' : ''}`}
              onClick={() => handleFeedback('helpful')}
              title="Helpful response"
              aria-label="Thumbs up"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              type="button"
              className={`feedback-btn ${feedback === 'unhelpful' ? 'active-bad' : ''}`}
              onClick={() => handleFeedback('unhelpful')}
              title="Needs improvement"
              aria-label="Thumbs down"
            >
              <ThumbsDown size={14} />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="claude-answer-container" id="legal-answer-card">
      {/* Category Tag & Problem Title */}
      {problemTitle && (
        <div className="answer-topic-header">
          <span className="topic-category-badge">{category}</span>
          <h2 className="topic-title font-serif">{problemTitle}</h2>
        </div>
      )}

      {/* 1. In Plain Words (Executive Editorial Summary) */}
      {summaryText && (
        <div className="editorial-summary-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
        </div>
      )}

      {/* 2. Structured Legal Explanation Points */}
      {explanationPoints.length > 0 && (
        <div className="editorial-explanation-section">
          <h3 className="section-subheading">Legal Analysis</h3>
          <ul className="explanation-bullet-list">
            {explanationPoints.map((point, idx) => (
              <li key={idx} className="explanation-bullet-item">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{point}</ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Expandable Legal Source References (Statutory Citations) */}
      {statutoryCitations.length > 0 && (
        <div className="sources-collapsible-block">
          <button
            type="button"
            className="sources-header-toggle"
            onClick={() => setSourcesExpanded((prev) => !prev)}
            aria-expanded={sourcesExpanded}
          >
            <div className="sources-header-left">
              <BookOpen size={16} className="sources-icon" />
              <span className="sources-header-title">
                Sources & Statutory Provisions ({statutoryCitations.length})
              </span>
            </div>
            {sourcesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {sourcesExpanded && (
            <div className="sources-content-list">
              {statutoryCitations.map((item, idx) => {
                const queryParam = encodeURIComponent(`${item.act || ''} ${item.section || ''}`);
                const indiaCodeUrl = `https://www.indiacode.nic.in/handle/123456789/1362/simple-search?query=${queryParam}`;
                const isQuoteOpen = expandedCitationIndex === idx;

                return (
                  <div key={idx} className="source-reference-card">
                    <div className="source-card-main">
                      <div className="source-title-row">
                        <span className="source-act-name">{item.act}</span>
                        {item.section && <span className="source-section-pill">{item.section}</span>}
                      </div>

                      {item.title && <div className="source-section-title">{item.title}</div>}

                      {item.supporting_text && (
                        <div>
                          <button
                            type="button"
                            className="btn-toggle-quote"
                            onClick={() =>
                              setExpandedCitationIndex(isQuoteOpen ? null : idx)
                            }
                          >
                            <span>{isQuoteOpen ? 'Hide statutory excerpt' : 'View statutory excerpt'}</span>
                            {isQuoteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          </button>

                          {isQuoteOpen && (
                            <blockquote className="source-verbatim-quote">
                              "{item.supporting_text}"
                            </blockquote>
                          )}
                        </div>
                      )}
                    </div>

                    <a
                      href={indiaCodeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="source-verify-link"
                      title="Verify on official India Code repository"
                    >
                      <span>Verify on India Code</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Judgment Presentation Cards */}
      {judgments.length > 0 && (
        <div className="judgment-section">
          <h3 className="section-subheading">
            <Scale size={16} className="inline-icon" /> Relevant Court Precedents
          </h3>
          <div className="judgments-grid">
            {judgments.map((j, idx) => (
              <div key={idx} className="judgment-card">
                <div className="judgment-card-header">
                  <div className="judgment-title">{j.title}</div>
                  <span className="judgment-badge">Precedent</span>
                </div>

                <div className="judgment-meta-row">
                  <span className="judgment-court">{j.court}</span>
                  <span className="judgment-dot">•</span>
                  <span className="judgment-case-no">{j.caseNumber}</span>
                  {j.date && (
                    <>
                      <span className="judgment-dot">•</span>
                      <span className="judgment-date">
                        <Calendar size={12} className="meta-icon" /> {j.date}
                      </span>
                    </>
                  )}
                </div>

                {j.paragraphRef && (
                  <p className="judgment-excerpt">
                    {j.paragraphRef}
                  </p>
                )}

                <div className="judgment-card-footer">
                  <span className="judgment-ref-tag">
                    <FileText size={12} /> Indian Case Law
                  </span>
                  <a
                    href={j.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="judgment-link"
                    title="View judgment document and record"
                  >
                    <span>View Judgment Record / PDF</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. What To Do Next (Step-by-Step Action Plan) */}
      {nextStepsActions.length > 0 && (
        <div className="action-plan-section">
          <h3 className="section-subheading">
            <Clock size={16} className="inline-icon" /> What To Do Next
          </h3>
          <div className="action-steps-list">
            {nextStepsActions.map((step, idx) => {
              const stepNumber = step.step || idx + 1;
              const title = step.title || `Step ${stepNumber}`;
              const description = step.description || step.detail || '';

              return (
                <div key={idx} className="action-step-item">
                  <div className="action-step-num">{stepNumber}</div>
                  <div className="action-step-body">
                    <div className="action-step-title">{title}</div>
                    <div className="action-step-desc">{description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Crucial Warnings & Legal Notes */}
      {(warningsList.length > 0 || limitationsList.length > 0) && (
        <div className="editorial-callout-warning">
          <div className="callout-header">
            <AlertTriangle size={15} />
            <span>Important Warnings & Limitations</span>
          </div>

          <div className="callout-body">
            {warningsList.map((warning, idx) => {
              const msg = typeof warning === 'string' ? warning : warning.message || '';
              return (
                <div key={`w-${idx}`} className="callout-item">
                  <span className="callout-bullet">•</span>
                  <span>{msg}</span>
                </div>
              );
            })}

            {limitationsList.map((limitation, idx) => (
              <div key={`l-${idx}`} className="callout-item limitation">
                <span className="callout-bullet">*</span>
                <span>{limitation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Subtle Response Actions Bar (Claude Style) */}
      <div className="response-actions-bar">
        <div className="actions-group-left">
          {/* Copy Response */}
          <button
            type="button"
            className="action-pill-btn"
            onClick={handleCopyText}
            title="Copy response to clipboard"
          >
            {copied ? (
              <>
                <Check size={14} color="var(--primary-brand)" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Regenerate Response */}
          {onRegenerate && (
            <button
              type="button"
              className="action-pill-btn"
              onClick={onRegenerate}
              title="Regenerate this response"
            >
              <RotateCcw size={14} />
              <span>Retry</span>
            </button>
          )}

          {/* Share Response */}
          <button
            type="button"
            className="action-pill-btn"
            onClick={handleShare}
            title="Share response"
          >
            {shared ? (
              <>
                <Check size={14} color="var(--primary-brand)" />
                <span>Shared</span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span>Share</span>
              </>
            )}
          </button>

          {/* Print / PDF */}
          <button
            type="button"
            className="action-pill-btn"
            onClick={handlePrint}
            title="Print or export as PDF"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>

        <div className="actions-group-right">
          {/* Helpful Feedback */}
          <button
            type="button"
            className={`feedback-btn ${feedback === 'helpful' ? 'active-good' : ''}`}
            onClick={() => handleFeedback('helpful')}
            title="Helpful response"
            aria-label="Thumbs up"
          >
            <ThumbsUp size={14} />
          </button>

          {/* Not Helpful Feedback */}
          <button
            type="button"
            className={`feedback-btn ${feedback === 'unhelpful' ? 'active-bad' : ''}`}
            onClick={() => handleFeedback('unhelpful')}
            title="Needs improvement"
            aria-label="Thumbs down"
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
