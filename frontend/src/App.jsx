import { useEffect, useState } from 'react';
import { io } from "socket.io-client";

const socket = io("http://localhost:5000"); // change if your backend runs elsewhere

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("send_message", { text: message });
      setMessage("");
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setChat(prev => [...prev, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-lg">
        <h1 className="text-2xl mb-4">⚡ Real-time Chat</h1>
        <div className="h-64 overflow-y-auto border rounded p-2 mb-4 bg-gray-700">
          {chat.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="text-green-400">User:</span> {msg.text}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 p-2 rounded bg-gray-600 text-white"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
