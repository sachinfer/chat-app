// App.jsx
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatBox from './components/ChatBox';
import ProfileForm from './components/ProfileForm';
import { io } from 'socket.io-client';
import UserBehavior from './pages/UserBehavior';

const socket = io('http://localhost:5000', { transports: ['websocket'] });

function logUserAction(type, details) {
  const key = 'user_behavior_log';
  const log = JSON.parse(localStorage.getItem(key) || '[]');
  log.push({ type, details, timestamp: Date.now() });
  localStorage.setItem(key, JSON.stringify(log));
}

function Dashboard({ onLogout, token, onShowBehavior }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentMessages, setRecentMessages] = useState([]);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
        } else {
          setError(data.error || 'Failed to fetch user info');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      if (e.detail && e.detail.type === 'chatHistory') {
        setRecentMessages(e.detail.messages.slice(-5));
      }
      if (e.detail && e.detail.type === 'newMessage') {
        setNotification('New message received!');
        setTimeout(() => setNotification(''), 2000);
      }
    };
    window.addEventListener('chatHistoryEvent', handler);
    return () => window.removeEventListener('chatHistoryEvent', handler);
  }, []);

  useEffect(() => {
    logUserAction('Dashboard Visit');
  }, []);

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
    logUserAction('Profile Updated');
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user?.avatar && <img src={user.avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />}
          <h1 style={{ margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {user?.canViewBehavior && (
            <button onClick={() => { logUserAction('User Behavior Clicked'); onShowBehavior(); }} style={{ padding: '6px 16px', borderRadius: 6, background: '#2980b9', color: '#fff', border: 'none' }}>User Behavior</button>
          )}
          <button onClick={() => { logUserAction('Logout Clicked'); onLogout(); }} style={{ padding: '6px 16px', borderRadius: 6, background: '#e74c3c', color: '#fff', border: 'none' }}>Logout</button>
        </div>
      </div>
      {notification && <div style={{ background: '#2ecc40', color: '#fff', padding: 8, borderRadius: 6, marginBottom: 12, textAlign: 'center' }}>{notification}</div>}
      <ProfileForm user={user} token={token} onUpdate={handleProfileUpdate} />
      <div style={{ marginBottom: 24 }}>
        <h3>Recent Chat Messages</h3>
        <div style={{ background: '#f4f4f4', borderRadius: 6, padding: 12, minHeight: 60 }}>
          {recentMessages.length === 0 ? <span>No messages yet.</span> : recentMessages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {msg.avatar && <img src={msg.avatar} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', border: '1px solid #ccc' }} />}
              <b>{msg.user}:</b> {msg.text}
            </div>
          ))}
        </div>
      </div>
      <h3>Chat</h3>
      <ChatBox user={user} logUserAction={logUserAction} />
    </div>
  );
}

function App() {
  const [page, setPage] = useState('login');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = (token, msg) => {
    setToken(token);
    setFeedback(msg || 'Login successful!');
    setError('');
  };

  const handleRegister = (msg) => {
    setFeedback(msg || 'Registration successful!');
    setError('');
    setPage('login');
  };

  const handleError = (msg) => {
    setError(msg);
    setFeedback('');
  };

  useEffect(() => {
    if (token) {
      fetch('/api/users/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [token]);

  if (token) {
    if (page === 'behavior') {
      if (user && user.canViewBehavior) {
        return <UserBehavior onBack={() => setPage('dashboard')} />;
      } else {
        return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>You do not have access to this page.</div>;
      }
    }
    return <Dashboard token={token} onLogout={() => { localStorage.removeItem('token'); setToken(null); setFeedback(''); setError(''); }} onShowBehavior={() => setPage('behavior')} />;
  }

  return (
    <div style={{ maxWidth: 400, margin: '64px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setPage('login')} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc', background: page === 'login' ? '#f0f0f0' : '#fff' }}>Login</button>
        <button onClick={() => setPage('register')} style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc', background: page === 'register' ? '#f0f0f0' : '#fff' }}>Register</button>
      </div>
      {feedback && <div style={{ color: 'green', marginBottom: 8 }}>{feedback}</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {page === 'login' ? (
        <Login onLogin={handleLogin} onError={handleError} />
      ) : (
        <Register onRegister={handleRegister} onError={handleError} />
      )}
    </div>
  );
}

export default App; 