import { useState } from "react";
import { Send, MessageCircle, User, Bot } from "lucide-react";

const Chatbot = ({ user }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const username = user?.email || "guest"; // fallback if not logged in

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Show user message immediately
    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    try {
      // Call Flask backend
      const formData = new FormData();
      formData.append("msg", input);
      formData.append("username", username); // use logged-in username
      formData.append("mode", "friend");    // or "therapist"

      const res = await fetch("http://localhost:8080/get", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const botReply = data.response;

      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error connecting to chatbot." },
      ]);
    }

    setLoading(false);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="flex flex-col max-w-2xl mx-auto mt-8 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden h-[90vh] border border-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Assistant</h2>
              <p className="text-blue-100 text-sm">Always here to help</p>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-800 to-gray-900">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm">Send a message to get started!</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 ${
                  m.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  m.sender === "user" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-700 text-gray-300"
                }`}>
                  {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                {/* Message bubble */}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                  m.sender === "user"
                    ? "bg-blue-500 text-white rounded-tr-sm"
                    : "bg-gray-700 text-gray-100 border border-gray-600 rounded-tl-sm"
                }`}>
                  <p className="text-sm leading-relaxed">{m.text}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 text-gray-300 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-gray-700 border border-gray-600 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-300 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="p-6 bg-gray-900 border-t border-gray-700">
          <div className="flex items-center gap-3 bg-gray-800 rounded-2xl p-2">
            <input
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-gray-100 placeholder-gray-400"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              ➤
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Connected as {username}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;