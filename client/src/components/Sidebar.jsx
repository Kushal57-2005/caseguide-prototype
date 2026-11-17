/**
 * @file Sidebar.jsx
 * @description Claude-inspired minimalist left sidebar for CaseGuide:
 * - Logo & CaseGuide Wordmark
 * - Search filter for recent conversations
 * - Clean conversation list with active indicators & contextual menus
 * - User profile, Settings modal trigger (theme switcher), and logout
 */

import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import logoImg from '../assets/logo.jpg';
import {
  SquarePen,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Settings,
  PanelLeftClose,
  Sun,
  Moon,
  Check,
  X
} from 'lucide-react';

export default function Sidebar({
  chats = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  isOpen = false,
  onClose,
  onOpenSettings
}) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Filter chats by search query
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [chats, searchQuery]);

  const startRename = (chat, e) => {
    e.stopPropagation();
    setEditingId(chat._id);
    setEditTitle(chat.title || '');
    setMenuOpenId(null);
  };

  const saveRename = async (chatId, e) => {
    e?.stopPropagation();
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
    setMenuOpenId(null);
    if (window.confirm('Delete this conversation?')) {
      onDeleteChat(chatId);
    }
  };

  const toggleThemeQuick = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <aside className={`claude-sidebar ${isOpen ? 'open' : ''}`}>
      {/* 1. Sidebar Header */}
      <div className="sidebar-header">
        <div className="brand-badge" onClick={onNewChat} style={{ cursor: 'pointer' }}>
          <div className="brand-logo">
            <img src={logoImg} alt="CaseGuide" className="brand-logo-img" />
          </div>
          <span className="brand-wordmark font-serif">CaseGuide</span>
        </div>

        <div className="sidebar-header-actions">
          <button
            type="button"
            className="btn-icon"
            onClick={onNewChat}
            title="New Chat"
            aria-label="New chat"
          >
            <SquarePen size={18} />
          </button>

          {onClose && (
            <button
              type="button"
              className="btn-icon mobile-only"
              onClick={onClose}
              title="Close Sidebar"
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. New Chat Full Button & Search */}
      <div className="sidebar-top-section">
        <button
          type="button"
          className="btn-new-chat"
          onClick={onNewChat}
          title="Start a new legal research session"
        >
          <SquarePen size={16} />
          <span>New Chat</span>
        </button>

        <div className="sidebar-search-wrap">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-search-clear"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Conversation History List */}
      <div className="sidebar-nav-scroll">
        <div className="nav-section-label">Recent Research</div>

        {filteredChats.length === 0 ? (
          <div className="sidebar-empty-state">
            {searchQuery ? 'No matching queries found.' : 'No conversations yet.'}
          </div>
        ) : (
          <div className="conversation-list">
            {filteredChats.map((chat) => {
              const isActive = chat._id === currentChatId;
              const isEditing = editingId === chat._id;
              const isMenuOpen = menuOpenId === chat._id;

              return (
                <div
                  key={chat._id}
                  className={`conversation-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectChat(chat._id)}
                >
                  {isEditing ? (
                    <div className="rename-row" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        className="rename-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(chat._id, e)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn-rename-save"
                        onClick={(e) => saveRename(chat._id, e)}
                        title="Save title"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-rename-cancel"
                        onClick={() => setEditingId(null)}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="conversation-title" title={chat.title}>
                        {chat.title || 'Legal Query'}
                      </span>

                      {/* Three-dot context menu */}
                      <div
                        className="conversation-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-context-menu"
                          onClick={() => setMenuOpenId(isMenuOpen ? null : chat._id)}
                          aria-label="Options"
                        >
                          <MoreHorizontal size={15} />
                        </button>

                        {isMenuOpen && (
                          <div className="context-dropdown">
                            <button
                              type="button"
                              className="dropdown-item"
                              onClick={(e) => startRename(chat, e)}
                            >
                              <Edit2 size={13} />
                              <span>Rename</span>
                            </button>
                            <button
                              type="button"
                              className="dropdown-item danger"
                              onClick={(e) => handleDelete(chat._id, e)}
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Bottom User Profile & Settings Section */}
      <div className="sidebar-bottom-section">
        {user && (
          <div className="user-profile-row">
            <div className="user-avatar-pill">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <div className="user-info-text">
              <span className="user-name">{user.name || 'Citizen User'}</span>
              <span className="user-role">Legal Research</span>
            </div>

            {/* Quick theme switcher button */}
            <button
              type="button"
              className="btn-icon subtle"
              onClick={toggleThemeQuick}
              title={`Switch theme (currently ${theme})`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            {/* Settings button */}
            <button
              type="button"
              className="btn-icon subtle"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
