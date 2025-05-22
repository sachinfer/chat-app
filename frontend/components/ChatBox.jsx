import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', { transports: ['websocket'] });
const notificationSound = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa1c82.mp3');

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBox({ user, logUserAction }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // Added for file input
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loadingBot, setLoadingBot] = useState(false);
  const [botError, setBotError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chatHistory', (history) => setMessages(history));
    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
      notificationSound.play();
    });
    socket.on('deleteMessage', (id) => {
      setMessages((prev) => prev.filter((m) => m._id !== id));
    });
    socket.on('onlineUsers', setOnlineUsers);
    return () => {
      socket.off('chatHistory');
      socket.off('chatMessage');
      socket.off('deleteMessage');
      socket.off('onlineUsers');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    setBotError('');
    if (input.trim() || selectedFile) {
      if (logUserAction) {
        let details = input.trim();
        if (selectedFile) details += ` (file: ${selectedFile.name})`;
        logUserAction('Chat Message Sent', details);
      }
      setLoadingBot(true);
      let filePath = null;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) {
            throw new Error(`File upload failed: ${uploadRes.statusText}`);
          }
          const uploadData = await uploadRes.json();
          filePath = uploadData.filePath;
        } catch (err) {
          console.error('File upload error:', err);
          setBotError(`File upload error: ${err.message}`);
          setLoadingBot(false);
          setSelectedFile(null); // Clear selected file on error
          // Optionally, inform the user about the upload failure in the chat
          const errorMsg = {
            user: 'System',
            text: `Failed to upload file: ${selectedFile.name}. Error: ${err.message}`,
            avatar: '',
            createdAt: new Date().toISOString(),
          };
          socket.emit('chatMessage', errorMsg);
          return;
        }
      }

      const prompt = input.trim();
      const userMsg = {
        user: user.username,
        text: prompt,
        avatar: user.avatar || '',
        filePath: filePath, // Add filePath to message
        createdAt: new Date().toISOString(),
      };

      socket.emit('chatMessage', userMsg);
      setInput('');
      setSelectedFile(null); // Clear selected file after sending

      // If the message was just a file, don't call Ollama
      if (!prompt && filePath) {
         setLoadingBot(false);
         return;
      }
      
      // If there's text, proceed with Ollama call
      if (prompt) {
        try {
          const res = await fetch('/api/ollama', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt }),
          });
          const data = await res.json();
          if (!data.response) throw new Error('No response from AI');
          const botMsg = {
            user: 'Ollama',
            text: data.response,
            avatar: '',
            createdAt: new Date().toISOString(),
          };
          socket.emit('chatMessage', botMsg);
        } catch (err) {
          const errorMsgText = 'Ollama error: ' + (err.message || 'Unknown error');
          setBotError(errorMsgText);
          const botMsg = {
            user: 'Ollama',
            text: errorMsgText,
            avatar: '',
            createdAt: new Date().toISOString(),
          };
          socket.emit('chatMessage', botMsg);
        } finally {
          setLoadingBot(false);
        }
      } else {
        setLoadingBot(false); // Ensure loading is false if only file was sent
      }
    }
  };

  const handleDelete = (id) => {
    socket.emit('deleteMessage', id);
  };

  // Recent chats: all but the last user+bot pair
  const recentChats = messages.slice(0, -2);
  // Current exchange: last user+bot pair
  const currentPair = messages.slice(-2);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-900 to-slate-900">
      {/* Sidebar: Recent Chats */}
      <aside className="w-32 md:w-56 bg-white/10 backdrop-blur-sm p-2 md:p-4 flex flex-col gap-2 overflow-y-auto border-r border-indigo-800">
        <h2 className="text-xs md:text-sm text-indigo-200 font-bold mb-2">Recent</h2>
        {recentChats.length === 0 && <div className="text-xs text-indigo-100">No recent chats</div>}
        {recentChats.map((msg, idx) => (
          <div key={idx} className="mb-1 p-2 rounded bg-indigo-800/60 text-xs text-white truncate">
            <span className="font-semibold">{msg.user}:</span> {msg.text}
            {msg.filePath && <span className="ml-2 text-indigo-300">(file)</span>}
          </div>
        ))}
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-between">
        {/* Focused Current Conversation */}
        <div className="flex-1 flex flex-col justify-center items-center w-full px-2 md:px-8">
          {currentPair.map((msg, idx) => (
            <div
              key={idx}
              className={`w-full max-w-xl my-2 p-6 rounded-2xl shadow-lg text-lg md:text-2xl font-semibold ${msg.user === "You" ? "bg-indigo-600 text-white text-right ml-auto" : "bg-white/90 text-indigo-900 text-left mr-auto"}`}
            >
              <div className="text-xs md:text-sm font-bold mb-1 opacity-70">{msg.user}</div>
              <div>{msg.text}</div>
              {msg.filePath && (
                <div className="mt-2">
                  <a
                    href={`http://localhost:5000${msg.filePath}`} // Assuming backend serves files from root
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-200 underline break-all"
                  >
                    Shared File: {msg.filePath.split('-').slice(1).join('-') || msg.filePath}
                  </a>
                </div>
              )}
              <div className="text-xs mt-2 text-indigo-300 text-right">{msg.createdAt ? formatTime(msg.createdAt) : ''}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="w-full max-w-xl flex flex-col gap-2 p-4 bg-white/10 backdrop-blur sticky bottom-0"
        >
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-full px-4 py-2 text-base md:text-lg bg-white/80 text-indigo-900 placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Type your question or attach a file..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 font-bold text-base md:text-lg shadow"
              disabled={loadingBot || (!input.trim() && !selectedFile)}
            >
              {loadingBot ? 'Sending...' : 'Ask'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="file-upload" className="cursor-pointer text-sm text-indigo-300 hover:text-indigo-100 p-2 rounded-md bg-indigo-700/50 hover:bg-indigo-600/50">
              Attach File
            </label>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            {selectedFile && <span className="text-xs text-indigo-200 truncate max-w-xs">Selected: {selectedFile.name}</span>}
          </div>
        </form>
      </main>
    </div>
  );
}
