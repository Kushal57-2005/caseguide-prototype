/**
 * @file WelcomeScreen.jsx
 * @description Claude-inspired minimalist welcome screen for CaseGuide with refined serif typography,
 * spacious whitespace, and clean suggested legal research prompt cards.
 */

import React from 'react';
import logoImg from '../assets/logo.jpg';
import {
  BookOpen,
  Scale,
  Shield,
  FileSearch,
  ArrowUpRight
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    id: 'laws',
    title: 'Understand Indian Laws',
    desc: 'Explain a legal provision in simple language.',
    icon: BookOpen,
    query: 'Explain the mandatory safety obligations and recall procedures for vehicle manufacturers under the Motor Vehicles Act.'
  },
  {
    id: 'judgments',
    title: 'Explore Court Judgments',
    desc: 'Find and understand relevant Indian court judgments.',
    icon: Scale,
    query: 'What legal precedents govern liability and compensation for consumer product defects and fraudulent transactions in India?'
  },
  {
    id: 'rights',
    title: 'Constitutional Rights',
    desc: 'Explore fundamental rights under the Indian Constitution.',
    icon: Shield,
    query: 'What remedies exist under Article 226 and 32 when an administrative authority violates principles of natural justice?'
  },
  {
    id: 'research',
    title: 'Legal Research',
    desc: 'Research a legal question with supporting sources.',
    icon: FileSearch,
    query: 'What is the statutory limitation period and procedure to file a grievance before the District Consumer Commission?'
  }
];

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="welcome-screen-container">
      {/* Editorial Header */}
      <div className="welcome-header">
        <div className="welcome-logo-badge">
          <img src={logoImg} alt="CaseGuide Emblem" className="welcome-logo-img" />
        </div>
        <h1 className="welcome-title font-serif">Your Legal Research Assistant</h1>
        <p className="welcome-subtitle">
          Understand Indian law, explore judgments, and discover legal insights with AI-powered research.
        </p>
      </div>

      {/* 4 Suggested Prompt Cards */}
      <div className="welcome-suggestions-grid">
        {SUGGESTED_PROMPTS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="suggestion-card"
              onClick={() => onSelectPrompt(item.query)}
            >
              <div className="suggestion-card-top">
                <div className="suggestion-icon-wrap">
                  <Icon size={16} />
                </div>
                <ArrowUpRight size={15} className="suggestion-arrow" />
              </div>

              <div className="suggestion-title">{item.title}</div>
              <p className="suggestion-desc">{item.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
