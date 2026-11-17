/**
 * @file App.jsx
 * @description Master application shell for CaseGuide.
 * Coordinates user authentication, theme management, chat state,
 * sidebar interactions, and settings modal.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import { api } from './services/api.js';
import logoImg from './assets/logo.jpg';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hasInitializedRef = useRef(false);

  // Legal research configuration
  const [researchDomain, setResearchDomain] = useState(() => {
    try {
      const saved = localStorage.getItem('caseguide_domain');
      return (saved && saved !== 'All Domains') ? saved : 'Motor Vehicle Law';
    } catch {
      return 'Motor Vehicle Law';
    }
  });
  const [researchMode, setResearchMode] = useState('Detailed Research');

  useEffect(() => {
    try {
      if (!researchDomain || researchDomain === 'All Domains') {
        setResearchDomain('Motor Vehicle Law');
        localStorage.setItem('caseguide_domain', 'Motor Vehicle Law');
      } else {
        localStorage.setItem('caseguide_domain', researchDomain);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [researchDomain]);

  // Fetch all user chats on login
  const loadChats = useCallback(async (selectId = null) => {
    try {
      const res = await api.chats.list();
      if (res.success && Array.isArray(res.chats)) {
        setChats(res.chats);
        if (selectId) {
          setCurrentChatId(selectId);
        } else if (!hasInitializedRef.current) {
          hasInitializedRef.current = true;
          if (res.chats.length > 0) {
            setCurrentChatId(res.chats[0]._id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
      hasInitializedRef.current = false;
      setChats([]);
      setCurrentChatId(null);
      setMessages([]);
    }
  }, [user, loadChats]);

  // Load messages whenever active chat changes
  useEffect(() => {
    async function loadChatMessages() {
      if (!currentChatId) {
        setMessages([]);
        return;
      }
      try {
        const res = await api.chats.getMessages(currentChatId);
        if (res.success && res.messages) {
          setMessages(res.messages);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading chat messages:', err);
        setError('Failed to load message history for this chat.');
      }
    }

    if (currentChatId) {
      loadChatMessages();
    }
  }, [currentChatId]);

  // Start a fresh consultation session
  const handleNewChat = useCallback(() => {
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  }, []);

  // Rename a chat
  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const res = await api.chats.rename(chatId, newTitle);
      if (res.success && res.chat) {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, title: res.chat.title || newTitle } : c));
      }
    } catch (err) {
      alert(`Could not rename conversation: ${err.message}`);
    }
  };

  // Delete a chat
  const handleDeleteChat = async (chatId) => {
    try {
      const res = await api.chats.delete(chatId);
      if (res.success) {
        const remaining = chats.filter(c => c._id !== chatId);
        setChats(remaining);
        if (currentChatId === chatId) {
          if (remaining.length > 0) {
            setCurrentChatId(remaining[0]._id);
          } else {
            handleNewChat();
          }
        }
      }
    } catch (err) {
      alert(`Could not delete conversation: ${err.message}`);
    }
  };

  // Submit legal question to current or newly created chat
  const handleSendMessage = async (questionText) => {
    if (!questionText || loadingAnswer) return;

    setError(null);
    setLastQuestion(questionText);
    setLoadingAnswer(true);

    try {
      let chatId = currentChatId;

      // 1. If currently on a blank chat, create a new chat first
      if (!chatId) {
        const createRes = await api.chats.create('New Legal Query');
        if (createRes.success && createRes.chat) {
          chatId = createRes.chat._id;
          setCurrentChatId(chatId);
          setChats(prev => [createRes.chat, ...prev]);
        } else {
          throw new Error('Failed to initiate legal consultation session.');
        }
      }

      // Optimistically append user message to UI
      const optimisticId = `temp-${Date.now()}`;
      const optimisticUserMsg = {
        _id: optimisticId,
        chatId,
        role: 'user',
        content: questionText,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticUserMsg]);

      // 2. Query legal AI microservice via /api/chats/:id/ask
      const askRes = await api.chats.ask(chatId, questionText);

      if (askRes.success && askRes.assistantMessage) {
        setMessages(prev => {
          const filtered = prev.filter(m => m._id !== optimisticId);
          return [
            ...filtered,
            askRes.userMessage || optimisticUserMsg,
            askRes.assistantMessage
          ];
        });

        // Update chat title in sidebar if updated
        if (askRes.chat && askRes.chat.title) {
          setChats(prev => prev.map(c => c._id === chatId ? { ...c, title: askRes.chat.title } : c));
        }
      } else {
        throw new Error(askRes.message || 'Error formulating legal guidance.');
      }
    } catch (err) {
      console.error('Ask error:', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => !String(m._id || '').startsWith('temp-')));
      setError(err.message || 'Unable to contact legal AI assistant. Please try again.');
    } finally {
      setLoadingAnswer(false);
    }
  };

  const handleRetry = () => {
    if (lastQuestion) {
      handleSendMessage(lastQuestion);
    }
  };

  // Loading initial session
  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-emblem">
          <img src={logoImg} alt="CaseGuide" />
        </div>
        <div className="auth-loading-title font-serif">CaseGuide</div>
        <div className="auth-loading-subtitle">Verifying security session...</div>
      </div>
    );
  }

  // Not logged in -> Show Auth Modal
  if (!user) {
    return <AuthModal isOpen={true} />;
  }

  const activeChat = chats.find(c => c._id === currentChatId);

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(id) => {
          setCurrentChatId(id);
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* Main Conversation Area */}
      <ChatView
        key={currentChatId || 'new-chat'}
        chat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loadingAnswer}
        error={error}
        onRetry={handleRetry}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onRenameChat={handleRenameChat}
        researchDomain={researchDomain}
        setResearchDomain={setResearchDomain}
        researchMode={researchMode}
        setResearchMode={setResearchMode}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        researchDomain={researchDomain}
        onDomainChange={setResearchDomain}
        researchMode={researchMode}
        onModeChange={setResearchMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
