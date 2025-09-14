import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// Placeholders for API keys
// const FRIEND_API_KEY = "YOUR_FRIEND_API_KEY_HERE";
// const PSYCHIATRIST_API_KEY = "YOUR_PSYCHIATRIST_API_KEY_HERE";

const Chatbot = () => {
  const [version, setVersion] = useState('friend');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [threads, setThreads] = useState([
    { id: 1, name: 'Session 1', messages: [] },
    // Add more threads as needed
  ]);
  const [activeThread, setActiveThread] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle sending a message (placeholder logic)
  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    // TODO: Call API here using the correct key:
    // const apiKey = version === 'friend' ? FRIEND_API_KEY : PSYCHIATRIST_API_KEY;
  };

  // UI
  return (
    <div className="flex min-h-screen bg-[#181a1b] text-white relative">
      {/* Sidebar for chat threads with slide animation */}
      <aside
        className={`fixed md:static top-0 left-0 h-full z-30 bg-[#23272e] border-r border-white/10 flex flex-col p-4 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-64 w-0 md:w-16'
        }`}
        style={{ minWidth: sidebarOpen ? 256 : 0, maxWidth: 256 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold text-white/90 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>Conversations</h2>
          <button
            className="ml-2 p-1 rounded-full bg-[#181a1b] hover:bg-[#23272e] border border-white/10 text-white transition"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            type="button"
          >
            {sidebarOpen ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
          </button>
        </div>
        <div className={`flex-1 space-y-2 overflow-y-auto transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => { setActiveThread(thread.id); setMessages(thread.messages); }}
              className={`w-full text-left px-4 py-2 rounded-lg transition font-medium ${
                activeThread === thread.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow'
                  : 'bg-white/5 text-white/80 hover:bg-white/10'
              }`}
            >
              {thread.name}
            </button>
          ))}
        </div>
        <button
          className={`mt-6 w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-semibold ${sidebarOpen ? '' : 'opacity-0 pointer-events-none'}`}
          onClick={() => {
            const newId = threads.length + 1;
            const newThread = { id: newId, name: `Session ${newId}`, messages: [] };
            setThreads([...threads, newThread]);
            setActiveThread(newId);
            setMessages([]);
          }}
        >
          + New Chat
        </button>
      </aside>

      {/* Show sidebar button when sidebar is hidden */}
      {!sidebarOpen && (
        <button
          className="fixed top-6 left-2 z-40 p-2 rounded-full bg-[#23272e] border border-white/10 text-white shadow-lg hover:bg-[#181a1b] transition"
          onClick={() => setSidebarOpen(true)}
          aria-label="Show sidebar"
          type="button"
        >
          <FiChevronRight size={22} />
        </button>
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col relative ml-0 md:ml-64 transition-all duration-300" style={{ marginLeft: sidebarOpen ? 256 : 0 }}>
        {/* Top bar with version toggle */}
        <div className="flex justify-end items-center p-6 border-b border-white/10 bg-[#1a1d1f]">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-white/70">Advice as:</span>
            <div className="flex gap-2 bg-[#23272e] rounded-lg p-1">
              <button
                className={`px-4 py-1 rounded-lg font-semibold transition ${version === 'friend' ? 'bg-indigo-600 text-white' : 'text-white/70 hover:bg-indigo-700/30'}`}
                onClick={() => setVersion('friend')}
              >
                Friend
              </button>
              <button
                className={`px-4 py-1 rounded-lg font-semibold transition ${version === 'psychiatrist' ? 'bg-purple-600 text-white' : 'text-white/70 hover:bg-purple-700/30'}`}
                onClick={() => setVersion('psychiatrist')}
              >
                Psychiatrist
              </button>
            </div>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gradient-to-b from-[#23272e] to-[#181a1b]">
          {messages.length === 0 ? (
            <div className="text-center text-white/50 mt-24 text-lg">Start a conversation about your mental health…</div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-xl mx-${msg.role === 'user' ? 'auto ml-auto' : 'auto mr-auto'} px-6 py-4 rounded-2xl shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white self-end'
                    : 'bg-white/10 text-white self-start'
                }`}
              >
                {msg.text}
              </div>
            ))
          )}
        </div>

        {/* Chat input */}
        <form
          onSubmit={handleSend}
          className="flex items-center gap-4 p-6 border-t border-white/10 bg-[#1a1d1f]"
        >
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-xl bg-[#23272e] text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 shadow-inner"
            placeholder="Type your message…"
            value={input}
            onChange={e => setInput(e.target.value)}
            required
          />
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
};

export default Chatbot;