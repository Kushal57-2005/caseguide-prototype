/**
 * @file Sidebar.jsx
 * @description Sidebar navigation displaying past legal consultations, new chat creation, inline rename, and user logout.
 * @inputs Props { chats, currentChatId, onSelectChat, onNewChat, onRenameChat, onDeleteChat, isOpen, onClose }
 * @outputs Collapsible sidebar container with reactive chat history list.
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Scale,
  Plus,
  MessageSquare,
  Edit2,
  Trash2,
  LogOut,
  X,
  Check
} from 'lucide-react';

export default function Sidebar({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  isOpen = false,
  onClose
}) {
  const { user, logout } = useAuth();
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat._id);
    setEditTitle(chat.title);
  };

  const saveRename = async (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await onRenameChat(chatId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (chatId, e) => {
    if (e.key === 'Enter') {
      saveRename(chatId, e);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleDelete = (chatId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this legal query and all its messages?')) {
      onDeleteChat(chatId);
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-badge">
          <div className="brand-logo">
            <Scale size={20} />
          </div>
          <div className="brand-title">
            case<span>Guide</span>
          </div>
        </div>
        {onClose && (
          <button className="btn-icon" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        )}
      </div>

      {/* New Consultation Button */}
      <div className="sidebar-action-wrap">
        <button
          className="btn-gold"
          onClick={onNewChat}
          style={{ width: '100%', fontSize: '0.9rem' }}
        >
          <Plus size={18} />
          New Consultation
        </button>
      </div>

      {/* Chat History List */}
      <div className="chat-history-list">
        {chats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8899af', fontSize: '0.85rem' }}>
            No previous chats yet.<br />Ask a legal question to begin!
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = chat._id === currentChatId;
            const isEditing = editingId === chat._id;

            return (
              <div
                key={chat._id}
                className={`chat-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectChat(chat._id)}
              >
                <MessageSquare size={16} style={{ flexShrink: 0, marginRight: '8px', opacity: isActive ? 1 : 0.6 }} />

                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }} onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '3px 6px', fontSize: '0.82rem', height: '26px' }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(chat._id, e)}
                      autoFocus
                    />
                    <button
                      className="btn-icon"
                      style={{ padding: '2px' }}
                      onClick={(e) => saveRename(chat._id, e)}
                    >
                      <Check size={14} color="#10b981" />
                    </button>
                    <button
                      className="btn-icon"
                      style={{ padding: '2px' }}
                      onClick={() => setEditingId(null)}
                    >
                      <X size={14} color="#ef4444" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="chat-title-text" title={chat.title}>
                      {chat.title}
                    </span>
                    <div className="chat-item-actions">
                      <button
                        className="btn-icon"
                        title="Rename chat"
                        onClick={(e) => startRename(chat, e)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete chat"
                        onClick={(e) => handleDelete(chat._id, e)}
                      >
                        <Trash2 size={13} color="#f87171" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>
          <div className="user-meta">
            <div className="user-name">{user?.name || 'Citizen'}</div>
            <div className="user-email">{user?.email || ''}</div>
          </div>
        </div>
        <button
          className="btn-icon"
          title="Sign Out"
          onClick={logout}
          style={{ color: '#f87171' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
