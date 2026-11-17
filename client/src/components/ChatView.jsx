/**
 * @file ChatView.jsx
 * @description Main conversation viewport for CaseGuide:
 * - Top header with conversation title and sidebar toggle
 * - WelcomeScreen for fresh conversations with suggested prompts
 * - Conversation message stream with clean user bubbles and editorial LegalAnswerCards
 * - Subtle progress indicator during generation
 * - Error alert with instant retry
 * - Claude-inspired bottom ChatComposer with domain selector and research mode toggle
 */

import React, { useState, useEffect, useRef } from 'react';
import LegalAnswerCard from './LegalAnswerCard.jsx';
import WelcomeScreen from './WelcomeScreen.jsx';
import ChatComposer from './ChatComposer.jsx';
import {
  Menu,
  RotateCcw,
  AlertCircle,
  Edit2,
  Check,
  X
} from 'lucide-react';

const PROGRESS_STAGES = [
  'Reviewing your legal question...',
  'Analyzing applicable Indian statutes & provisions...',
  'Cross-referencing verified legal sources...',
  'Formulating structured legal guidance...'
];

export default function ChatView({
  chat,
  messages = [],
  onSendMessage,
  loading = false,
  error = null,
  onRetry,
  onToggleSidebar,
  onRenameChat = () => {},
  researchDomain = 'All Domains',
  setResearchDomain = () => {},
  researchMode = 'Detailed Research',
  setResearchMode = () => {}
}) {
  const [inputText, setInputText] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(chat?.title || '');
  const messagesEndRef = useRef(null);

  // Sync header title when chat prop updates
  useEffect(() => {
    setHeaderTitle(chat?.title || '');
    setIsEditingTitle(false);
  }, [chat?.title]);

  // Auto-scroll on new messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  // Cycle progress ticker while loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % PROGRESS_STAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading || inputText.length > 1000) return;
    const query = inputText.trim();
    setInputText('');
    onSendMessage(query);
  };

  const handleSelectPrompt = (promptText) => {
    if (loading) return;
    onSendMessage(promptText);
  };

  const handleSaveHeaderTitle = async () => {
    if (chat?._id && headerTitle.trim() && headerTitle.trim() !== chat.title) {
      await onRenameChat(chat._id, headerTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleHeaderKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveHeaderTitle();
    } else if (e.key === 'Escape') {
      setHeaderTitle(chat?.title || '');
      setIsEditingTitle(false);
    }
  };

  return (
    <main className="main-content">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button
            type="button"
            className="btn-icon sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
            aria-label="Toggle sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="chat-header-title-wrap">
            {isEditingTitle && chat ? (
              <div className="header-rename-form">
                <input
                  type="text"
                  className="header-rename-input"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  onKeyDown={handleHeaderKeyDown}
                  onBlur={handleSaveHeaderTitle}
                  autoFocus
                  maxLength={150}
                  aria-label="Rename conversation"
                />
                <button
                  type="button"
                  className="btn-header-rename-save"
                  onClick={handleSaveHeaderTitle}
                  title="Save title"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  className="btn-header-rename-cancel"
                  onClick={() => {
                    setHeaderTitle(chat?.title || '');
                    setIsEditingTitle(false);
                  }}
                  title="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="header-title-display">
                <span className="title-text">{chat?.title || 'New Legal Research'}</span>
                {chat && onRenameChat && (
                  <button
                    type="button"
                    className="btn-header-edit-title"
                    onClick={() => {
                      setHeaderTitle(chat.title || '');
                      setIsEditingTitle(true);
                    }}
                    title="Rename conversation"
                    aria-label="Rename conversation"
                  >
                    <Edit2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Stream / Welcome Screen */}
      <div className="messages-scroll-area">
        <div className="messages-inner-container">
          {messages.length === 0 && !loading ? (
            <WelcomeScreen onSelectPrompt={handleSelectPrompt} />
          ) : (
            <div className="messages-thread">
              {messages.map((msg, idx) => {
                if (msg.role === 'user') {
                  return (
                    <div key={msg._id || idx} className="user-message-row">
                      <div className="user-bubble">
                        {msg.content}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg._id || idx} className="assistant-message-row">
                    <LegalAnswerCard
                      answer={msg.structuredResponse || msg.answer}
                      onRegenerate={idx === messages.length - 1 ? onRetry : null}
                      onSelectPrompt={onSendMessage}
                    />
                  </div>
                );
              })}

              {/* Loading State */}
              {loading && (
                <div className="loading-state-row">
                  <div className="loading-pulse-card">
                    <div className="loading-spinner" />
                    <div className="loading-text-wrap">
                      <span className="loading-stage-text">
                        {PROGRESS_STAGES[stageIndex]}
                      </span>
                      <span className="loading-subtext">
                        Referencing Indian laws and legal databases...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State with Retry Button */}
              {error && !loading && (
                <div className="error-state-card">
                  <div className="error-content">
                    <AlertCircle size={18} className="error-icon" />
                    <div className="error-text-block">
                      <div className="error-heading">Unable to generate legal guidance</div>
                      <div className="error-message">{error}</div>
                    </div>
                  </div>
                  {onRetry && (
                    <button
                      type="button"
                      className="btn-retry"
                      onClick={onRetry}
                    >
                      <RotateCcw size={13} />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Composer */}
      <ChatComposer
        inputText={inputText}
        setInputText={setInputText}
        onSubmit={handleSubmit}
        loading={loading}
        researchDomain={researchDomain}
        setResearchDomain={setResearchDomain}
        researchMode={researchMode}
        setResearchMode={setResearchMode}
      />
    </main>
  );
}
