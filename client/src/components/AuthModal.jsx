/**
 * @file AuthModal.jsx
 * @description Authentication modal dialog for signing in or registering with caseGuide.
 * @inputs Props { isOpen, onClose (optional if mandatory) } and useAuth context.
 * @outputs Renders interactive login and registration forms with validation.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Scale, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ isOpen = true }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = () => {
    setName('Demo Citizen');
    setEmail('citizen@caseguide.in');
    setPassword('demo123');
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-logo" style={{ width: '48px', height: '48px', margin: '0 auto 12px auto' }}>
            <Scale size={24} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: '1.6rem', color: '#ffffff', marginBottom: '4px' }}>
            case<span>Guide</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            AI Legal Information Assistant for Indian Citizens
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="auth-error-alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Adv. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. citizen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-gold"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {submitting ? 'Authenticating...' : (
              <>
                {isRegister ? 'Register & Continue' : 'Sign In to caseGuide'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #223554', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            <ShieldCheck size={14} color="#f59e0b" /> Fill Quick Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
}
