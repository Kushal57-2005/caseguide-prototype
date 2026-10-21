/**
 * @file App.jsx
 * @description Main application component orchestrating user authentication, chat conversations,
 * sidebar transitions, and error management.
 * @inputs Root React state and AuthContext.
 * @outputs Unified interactive caseGuide application shell.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AuthModal from './components/AuthModal.jsx';
import Sidebar from './components/Sidebar.jsx';
import ChatView from './components/ChatView.jsx';
import { api } from './services/api.js';
import { Scale } from 'lucide-react';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuestion, setLastQuestion] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch all user chats on login
  const loadChats = useCallback(async (selectId = null) => {
    try {
      const res = await api.chats.list();
      if (res.success && Array.isArray(res.chats)) {
        setChats(res.chats);
        if (selectId) {
          setCurrentChatId(selectId);
        } else if (res.chats.length > 0 && !currentChatId) {
          // Default to the most recent conversation
          setCurrentChatId(res.chats[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  }, [currentChatId]);

  useEffect(() => {
    if (user) {
      loadChats();
    } else {
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
  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
    setSidebarOpen(false);
  };

  // Rename a chat
  const handleRenameChat = async (chatId, newTitle) => {
    try {
      const res = await api.chats.rename(chatId, newTitle);
      if (res.success) {
        setChats(prev => prev.map(c => c._id === chatId ? { ...c, title: newTitle } : c));
      }
    } catch (err) {
      alert(`Could not rename chat: ${err.message}`);
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
      alert(`Could not delete chat: ${err.message}`);
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
      const optimisticUserMsg = {
        chatId,
        role: 'user',
        content: questionText,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, optimisticUserMsg]);

      // 2. Query LLM via /api/chats/:id/ask
      const askRes = await api.chats.ask(chatId, questionText);

      if (askRes.success && askRes.assistantMessage) {
        setMessages(prev => {
          // Replace or append assistant response
          return [...prev, askRes.assistantMessage];
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080d16', color: '#f59e0b' }}>
        <div className="brand-logo" style={{ width: '56px', height: '56px', marginBottom: '16px' }}>
          <Scale size={28} />
        </div>
        <div style={{ fontSize: '1.2rem', fontFamily: 'Playfair Display, serif', color: '#ffffff' }}>caseGuide</div>
        <div style={{ fontSize: '0.85rem', color: '#8899af', marginTop: '6px' }}>Verifying security session...</div>
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
      {/* Sidebar with Chat History */}
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
      />

      {/* Main Consultation Area */}
      <ChatView
        chat={activeChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        loading={loadingAnswer}
        error={error}
        onRetry={handleRetry}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
