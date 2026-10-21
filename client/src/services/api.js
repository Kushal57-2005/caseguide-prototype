/**
 * @file api.js
 * @description Centralized HTTP client communicating with the caseGuide backend REST API.
 * @inputs Request payloads, authentication tokens stored in localStorage.
 * @outputs Parsed JSON responses or standardized API error rejections.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal request wrapper managing auth headers and HTTP error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('caseguide_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me')
  },
  chats: {
    list: () => request('/chats'),
    create: (title) => request('/chats', { method: 'POST', body: JSON.stringify({ title }) }),
    rename: (id, title) => request(`/chats/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    delete: (id) => request(`/chats/${id}`, { method: 'DELETE' }),
    getMessages: (id) => request(`/chats/${id}/messages`),
    ask: (id, question) => request(`/chats/${id}/ask`, { method: 'POST', body: JSON.stringify({ question }) })
  },
  health: {
    check: () => request('/health')
  }
};
