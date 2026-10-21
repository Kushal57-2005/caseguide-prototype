/**
 * @file ChatView.jsx
 * @description Main consultation chat interface displaying message threads, sample legal questions,
 * multi-step progress indicators, error retry mechanisms, and 1000-character constrained prompt input.
 * @inputs Props { chat, messages, onSendMessage, loading, error, onRetry, onToggleSidebar }
 * @outputs Interactive consultation view.
 */

import React, { useState, useEffect, useRef } from 'react';
import LegalAnswerCard from './LegalAnswerCard.jsx';
import {
  Send,
  Menu,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  CreditCard,
  Shield,
  FileText,
  AlertCircle
} from 'lucide-react';

const SAMPLE_QUESTIONS = [
  {
    category: 'Consumer Grievance',
    icon: ShoppingBag,
    title: 'Defective Product Refund',
    question: 'I bought a laptop online from an e-commerce platform that arrived with a cracked screen. The seller and customer care are refusing to refund or replace the item.'
  },
  {
    category: 'Cyber Banking Scam',
    icon: CreditCard,
    title: 'UPI / OTP Banking Fraud',
    question: 'I received a deceptive courier delivery call and lost ₹45,000 from my savings bank account through an unauthorized UPI transaction link.'
  },
  {
    category: 'Criminal Law & Police',
    icon: Shield,
    title: 'Police Refusing FIR',
    question: 'The local police station Station House Officer (SHO) is refusing to file and register an FIR for housebreaking and theft of jewelry.'
  },
  {
    category: 'Citizen Rights',
    icon: FileText,
    title: 'No Reply to RTI (30 Days)',
    question: 'I submitted a formal RTI application 40 days ago regarding municipal road repair funds and the Public Information Officer has not responded.'
  }
];

const PROGRESS_STAGES = [
  'Understanding your problem...',
  'Finding the law (BNS / BNSS / Statutes)...',
  'Analyzing legal forums & timeline...',
  'Writing next steps and checklist...'
];

export default function ChatView({
  chat,
  messages = [],
  onSendMessage,
  loading = false,
  error = null,
  onRetry,
  onToggleSidebar
}) {
  const [inputText, setInputText] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll on new messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  // Cycle progress ticker while loading
  useEffect(() => {
    if (!loading) {
      setStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStageIndex(prev => (prev + 1) % PROGRESS_STAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || loading || inputText.length > 1000) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSampleClick = (questionText) => {
    if (loading) return;
    onSendMessage(questionText);
  };

  const charsLeft = 1000 - inputText.length;
  const isOverLimit = charsLeft < 0;

  return (
    <main className="main-content">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-left">
          <button
            className="btn-icon"
            onClick={onToggleSidebar}
            title="Toggle Sidebar"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="chat-header-title">
            <span>{chat?.title || 'Legal Consultation'}</span>
          </div>
        </div>

        <div className="model-pill" title="Powered by NVIDIA NIM Nemotron-3 Ultra">
          <Sparkles size={12} color="#f59e0b" />
          <span>Nemotron-3 Ultra (550B)</span>
        </div>
      </header>

      {/* Messages Stream */}
      <div className="messages-container">
        {messages.length === 0 && !loading ? (
          <div className="empty-state-wrap">
            <div className="empty-hero-icon">
              <Sparkles size={32} />
            </div>
            <h1 className="empty-title font-serif">
              Indian Legal Intelligence in Plain Words
            </h1>
            <p className="empty-subtitle">
              Describe your legal grievance or choose a common situation below. caseGuide provides statutory matches, step-by-step action plans, and documentation checklists.
            </p>

            <div className="samples-grid">
              {SAMPLE_QUESTIONS.map((sample, idx) => {
                const IconComponent = sample.icon;
                return (
                  <div
                    key={idx}
                    className="sample-card"
                    onClick={() => handleSampleClick(sample.question)}
                  >
                    <div className="sample-tag">
                      <IconComponent size={14} />
                      {sample.category}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', marginBottom: '4px' }}>
                      {sample.title}
                    </div>
                    <p className="sample-query">
                      "{sample.question}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            if (msg.role === 'user') {
              return (
                <div key={idx} className="user-message-row">
                  <div className="user-bubble">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={idx} style={{ width: '100%' }}>
                <LegalAnswerCard
                  answer={msg.answer}
                  latencyMs={msg.latencyMs}
                  model={msg.model}
                  error={msg.error}
                />
              </div>
            );
          })
        )}

        {/* Loading Progress State */}
        {loading && (
          <div className="waiting-progress-card">
            <div className="spinner-wrap" />
            <div className="progress-steps-ticker">
              {PROGRESS_STAGES[stageIndex]}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#8899af' }}>
              Formulating structured legal guidance under BNS, BNSS, and Indian statutes...
            </div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {error && !loading && (
          <div className="answer-card" style={{ borderLeft: '4px solid #ef4444', borderColor: '#ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171' }}>
              <AlertCircle size={20} />
              <strong style={{ fontSize: '1rem' }}>Consultation Request Failed</strong>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '8px 0 12px 0' }}>
              {error}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-gold" onClick={onRetry} style={{ fontSize: '0.85rem' }}>
                <RotateCcw size={14} /> Retry Query
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Query Input Area */}
      <div className="input-area-wrap">
        <form onSubmit={handleSubmit} className="input-box-container">
          <textarea
            ref={textareaRef}
            className="chat-textarea"
            rows={2}
            placeholder="Describe your legal issue in plain words (e.g. 'Bank deducted money fraudulently', 'Seller won't replace defective TV')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />

          <div className="input-controls-row">
            <div className={`char-counter ${isOverLimit ? 'warning' : ''}`}>
              {charsLeft} / 1000 characters
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading || !inputText.trim() || isOverLimit}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <span>{loading ? 'Consulting...' : 'Ask caseGuide'}</span>
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
