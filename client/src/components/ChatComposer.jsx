/**
 * @file ChatComposer.jsx
 * @description Claude-inspired rounded bottom chat composer with auto-expanding multiline textarea,
 * Legal Domain selector, Research Mode toggle, and subtle disclaimer.
 */

import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Paperclip,
  BookOpen,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function ChatComposer({
  inputText,
  setInputText,
  onSubmit,
  loading = false,
  researchDomain = 'All Domains',
  setResearchDomain,
  researchMode = 'Detailed Research',
  setResearchMode
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea up to 220px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading && inputText.trim()) {
        onSubmit(e);
      }
    }
  };

  const domains = [
    'All Domains',
    'Motor Vehicle Law',
    'Constitutional Law',
    'Criminal Law',
    'Consumer Protection',
    'Family Law'
  ];

  const charsLeft = 1000 - inputText.length;
  const isOverLimit = charsLeft < 0;

  return (
    <div className="composer-wrapper">
      <form onSubmit={onSubmit} className="composer-container">
        {/* Multiline Textarea */}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          rows={1}
          placeholder="Ask anything about Indian law..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          aria-label="Ask anything about Indian law"
        />

        {/* Action Toolbar */}
        <div className="composer-toolbar">
          <div className="composer-tools-left">
            {/* Attachment Button */}
            <button
              type="button"
              className="composer-tool-btn"
              title="Attach legal document or PDF (Admin)"
              aria-label="Attach file"
            >
              <Paperclip size={16} />
            </button>

            {/* Legal Domain Selector Pill */}
            <div className="domain-select-pill">
              <select
                value={researchDomain}
                onChange={(e) => setResearchDomain(e.target.value)}
                className="domain-select-native"
                aria-label="Select Legal Domain"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <span className="domain-select-label">{researchDomain}</span>
              <ChevronDown size={13} className="domain-chevron" />
            </div>

            {/* Research Mode Toggle Pill */}
            <button
              type="button"
              className={`mode-toggle-pill ${researchMode === 'Detailed Research' ? 'active' : ''}`}
              onClick={() =>
                setResearchMode(
                  researchMode === 'Detailed Research' ? 'Quick Answer' : 'Detailed Research'
                )
              }
              title="Toggle Research Depth"
            >
              {researchMode === 'Detailed Research' ? (
                <>
                  <BookOpen size={13} />
                  <span>Detailed Research</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Quick Answer</span>
                </>
              )}
            </button>
          </div>

          <div className="composer-tools-right">
            {inputText.length > 700 && (
              <span className={`composer-char-count ${isOverLimit ? 'overlimit' : ''}`}>
                {charsLeft}
              </span>
            )}

            {/* Circular Send Button */}
            <button
              type="submit"
              className="composer-send-btn"
              disabled={loading || !inputText.trim() || isOverLimit}
              aria-label="Send query"
            >
              {loading ? (
                <div className="composer-spinner" />
              ) : (
                <ArrowUp size={16} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Subtle Disclaimer */}
      <div className="composer-disclaimer">
CaseGuide provides AI-powered legal information and research. Our current knowledge base focuses exclusively on the Motor Vehicles Act, 1988, and related traffic and transport regulations. Support for additional areas of Indian law may be introduced in the future.      </div>
    </div>
  );
}
