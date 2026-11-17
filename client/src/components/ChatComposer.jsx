/**
 * @file ChatComposer.jsx
 * @description Claude-inspired rounded bottom chat composer with auto-expanding multiline textarea,
 * Legal Domain selector, Research Mode toggle, and subtle disclaimer.
 */

import React, { useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  BookOpen,
  ChevronDown,
} from "lucide-react";

export default function ChatComposer({
  inputText,
  setInputText,
  onSubmit,
  loading = false,
  researchDomain = "Motor Vehicle Law",
  researchMode = "Detailed Research",
  setResearchMode: _setResearchMode = () => {},
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea up to 220px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 220);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && inputText.trim()) {
        onSubmit(e);
      }
    }
  };

  const charsLeft = 1000 - inputText.length;
  const isOverLimit = charsLeft < 0;
  const activeDomain =
    !researchDomain || researchDomain === "All Domains"
      ? "Motor Vehicle Law"
      : researchDomain;

  return (
    <div className="composer-wrapper">
      <form onSubmit={onSubmit} className="composer-container">
        {/* Multiline Textarea */}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          rows={1}
          placeholder="Ask anything about Motor Vehicle Law..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          aria-label="Ask anything about Motor Vehicle Law"
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

            {/* Legal Domain Selector Pill (Locked to Motor Vehicle Law) */}
            <div
              className="domain-select-pill disabled"
              title="CaseGuide specializes exclusively in Indian Motor Vehicle Law"
            >
              <select
                value={activeDomain}
                disabled
                className="domain-select-native"
                aria-label={`Legal Domain: ${activeDomain} (Specialized)`}
              >
                <option value={activeDomain}>{activeDomain}</option>
              </select>
              <span className="domain-select-label">{activeDomain}</span>
              <ChevronDown size={13} className="domain-chevron" />
            </div>

            {/* Research Mode Pill (Locked to Detailed Research) */}
            <button
              type="button"
              disabled
              className="mode-toggle-pill active disabled"
              title="Research depth is locked to Detailed Research for comprehensive statutory citations and legal precedents"
              aria-label={`Research Depth: ${researchMode || "Detailed Research"} (Locked)`}
            >
              <BookOpen size={13} />
              <span>{researchMode || "Detailed Research"}</span>
            </button>
          </div>

          <div className="composer-tools-right">
            {inputText.length > 700 && (
              <span
                className={`composer-char-count ${isOverLimit ? "overlimit" : ""}`}
              >
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
        CaseGuide provides AI-powered legal information and research. Our
        current knowledge base focuses exclusively on the Motor Vehicles Act and
        related traffic and transport regulations. Support for additional areas
        of Indian law may be introduced in the future.{" "}
      </div>
    </div>
  );
}
