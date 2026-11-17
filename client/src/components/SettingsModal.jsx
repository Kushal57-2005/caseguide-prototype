/**
 * @file SettingsModal.jsx
 * @description Settings modal providing Theme preference switcher (Light, Dark, System),
 * legal research default configurations, and user profile management.
 */

import React from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  X,
  Sun,
  Moon,
  Laptop,
  Scale,
  BookOpen,
  Sparkles,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  researchDomain = 'Motor Vehicle Law',
  researchMode = 'Detailed Research',
  onModeChange = () => {}
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, logout } = useAuth();

  if (!isOpen) return null;

  const themes = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="settings-header">
          <div className="settings-title-wrap">
            <Scale size={20} className="brand-accent-icon" />
            <h3>Settings</h3>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="settings-body">
          {/* 1. Appearance / Theme */}
          <div className="settings-section">
            <label className="settings-section-label">Appearance</label>
            <p className="settings-section-desc">
              Choose your interface preference. Currently active:{' '}
              <span className="capitalize-tag">{resolvedTheme} mode</span>
            </p>

            <div className="theme-toggle-grid">
              {themes.map((t) => {
                const IconComponent = t.icon;
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-option-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <IconComponent size={18} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Research Preferences */}
          <div className="settings-section">
            <label className="settings-section-label">Research Preferences</label>
            <p className="settings-section-desc">
              Configure default legal domains and depth for analysis.
            </p>

            <div className="settings-field-group">
              <div className="settings-label-row">
                <label className="settings-field-label">Default Domain</label>
                <span className="settings-badge-specialized">Specialized</span>
              </div>
              <select
                className="settings-select"
                value={researchDomain}
                disabled
                title="CaseGuide specializes exclusively in Indian Motor Vehicle Law"
                aria-label={`Default Domain: ${researchDomain} (Specialized)`}
              >
                <option value={researchDomain}>{researchDomain}</option>
              </select>
              <span className="settings-field-hint">
                CaseGuide currently specializes in Indian Motor Vehicle Law. Additional legal domains will be available in upcoming releases.
              </span>
            </div>

            <div className="settings-field-group" style={{ marginTop: '12px' }}>
              <label className="settings-field-label">Research Depth</label>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${researchMode === 'Quick Answer' ? 'active' : ''}`}
                  onClick={() => onModeChange('Quick Answer')}
                >
                  <Sparkles size={14} /> Quick Answer
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${researchMode === 'Detailed Research' ? 'active' : ''}`}
                  onClick={() => onModeChange('Detailed Research')}
                >
                  <BookOpen size={14} /> Detailed Research
                </button>
              </div>
            </div>
          </div>

          {/* 3. Account Details */}
          {user && (
            <div className="settings-section">
              <label className="settings-section-label">Account</label>
              <div className="settings-account-card">
                <div className="settings-user-avatar">
                  <User size={18} />
                </div>
                <div className="settings-user-info">
                  <div className="settings-user-name">{user.name || 'Citizen User'}</div>
                  <div className="settings-user-email">{user.email}</div>
                </div>
                <button
                  type="button"
                  className="btn-danger-subtle"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  title="Sign Out"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}

          {/* 4. About Info */}
          <div className="settings-footer-note">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--primary-brand)" />
              <span>CaseGuide — Indian Legal Research Assistant</span>
            </div>
            <span>v2.0 • Independent AI Microservice</span>
          </div>
        </div>
      </div>
    </div>
  );
}
