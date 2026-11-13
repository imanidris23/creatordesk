import { useState } from "react";
import { Sparkles, Send, Bot, User } from "lucide-react";
import { sendAIMessage } from "../services/aiService.js";
import "./AIAssistantPage.css";

export default function AIAssistantPage({ samples, content }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const message = input.trim();

    if (!message || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: message }]);

    setInput("");
    setLoading(true);

    try {
      const reply = await sendAIMessage(message);

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${error.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div>
          <div className="ai-title">
            <Sparkles size={24} />
            <h1>CreatorDesk AI</h1>
          </div>
          <p>Your personal TikTok affiliate assistant.</p>
        </div>
      </div>

      <div className="ai-stats">
        <div>
          <span>Samples tracked</span>
          <strong>{samples.length}</strong>
        </div>
        <div>
          <span>Content tracked</span>
          <strong>{content.length}</strong>
        </div>
      </div>

      <div className="ai-chat">
        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <Sparkles size={32} />
              <h2>What can I help you with?</h2>
              <p>
                Ask me about TikTok hooks, content ideas, product promotion or
                affiliate performance.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div className={`ai-message ${message.role}`} key={index}>
                <div className="ai-message-icon">
                  {message.role === "user" ? (
                    <User size={18} />
                  ) : (
                    <Bot size={18} />
                  )}
                </div>
                <div className="ai-message-text">{message.text}</div>
              </div>
            ))
          )}

          {loading && (
            <div className="ai-typing">
              <Bot size={18} />
              Gemini is thinking...
            </div>
          )}
        </div>

        <div className="ai-input-area">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask CreatorDesk AI anything..."
            rows={2}
            disabled={loading}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        <p className="ai-disclaimer">
          AI can make mistakes. Always review its suggestions.
        </p>
      </div>
    </div>
  );
}
