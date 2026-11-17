/**
 * @file WelcomeScreen.jsx
 * @description Claude-inspired minimalist welcome screen for CaseGuide with refined serif typography,
 * spacious whitespace, and practical sample queries on Indian Motor Vehicle Law.
 */

import React from "react";
import logoImg from "../assets/logo.jpg";
import {
  FileText,
  Scale,
  Shield,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";

const SUGGESTED_PROMPTS = [
  {
    id: "penalties",
    title: "Driving Without Licence or Insurance",
    desc: "What is the penalty for driving without a valid driving licence or insurance under the Motor Vehicles Act?",
    icon: FileText,
    query: "What is the penalty for driving without a valid driving licence or insurance under the Motor Vehicles Act?",
  },
  {
    id: "registration",
    title: "Vehicle Registration & Transfer",
    desc: "What are the legal rules for vehicle registration and transfer under the Motor Vehicles Act?",
    icon: Scale,
    query: "What are the legal rules for vehicle registration and transfer under the Motor Vehicles Act?",
  },
  {
    id: "accident",
    title: "Road Accident Compensation (MACT)",
    desc: "What is the procedure and timeline for claiming compensation in a road accident before the MACT?",
    icon: Shield,
    query: "What is the procedure and timeline for claiming compensation in a road accident before the MACT?",
  },
  {
    id: "licence",
    title: "Expired Driving Licence Renewal",
    desc: "What are the rules and grace period for renewing an expired driving licence under the MV Act?",
    icon: BookOpen,
    query: "What are the rules and grace period for renewing an expired driving licence under the MV Act?",
  },
];

export default function WelcomeScreen({ onSelectPrompt }) {
  return (
    <div className="welcome-screen-container">
      {/* Editorial Header */}
      <div className="welcome-header">
        <div className="welcome-logo-badge">
          <img
            src={logoImg}
            alt="CaseGuide Emblem"
            className="welcome-logo-img"
          />
        </div>
        <h1 className="welcome-title font-serif">How can CaseGuide help you today?</h1>
        <p className="welcome-subtitle">
          Ask questions about Indian Motor Vehicle Law, traffic penalties, accident claims, and driving rules.
        </p>
      </div>

      {/* 4 Sample Query Cards */}
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
