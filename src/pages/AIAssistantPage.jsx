import { useEffect, useState } from "react";
import { Sparkles, Send, Bot, User, Plus } from "lucide-react";

import { sendAIMessage } from "../services/aiService.js";

import {
  createConversation,
  saveChatMessage,
  getChatMessages,
  deleteConversation,
} from "../services/aiChatService.js";

import { useAuth } from "../context/AuthContext.jsx";

import "./AIAssistantPage.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIAssistantPage({ samples, content }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [conversationId, setConversationId] = useState(null);

  // Load previous conversation after login
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadChat() {
      setLoadingHistory(true);

      try {
        const storageKey = `creatordesk-ai-chat-${user.uid}`;
        const savedConversationId = localStorage.getItem(storageKey);

        if (savedConversationId) {
          const history = await getChatMessages(user.uid, savedConversationId);

          if (!cancelled) {
            setConversationId(savedConversationId);
            setMessages(history.map(({ role, text }) => ({ role, text })));
          }
        } else {
          if (!cancelled) {
            setConversationId(null);
            setMessages([]);
          }
        }
      } catch (error) {
        console.error("Unable to load chat history:", error);

        if (!cancelled) {
          setMessages([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadChat();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Send a message
  async function handleSend() {
    const message = input.trim();

    if (!message || loading || !user) return;

    const userMessage = {
      role: "user",
      text: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      let currentConversationId = conversationId;

      // Create a conversation if this is the first message
      if (!currentConversationId) {
        currentConversationId = await createConversation(user.uid);

        setConversationId(currentConversationId);

        localStorage.setItem(
          `creatordesk-ai-chat-${user.uid}`,
          currentConversationId,
        );
      }

      // Save user's message
      await saveChatMessage(user.uid, currentConversationId, userMessage);

      // Get Gemini's response
      const reply = await sendAIMessage(message);

      console.log("RAW GEMINI RESPONSE:", JSON.stringify(reply));

      const assistantMessage = {
        role: "assistant",
        text: reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save Gemini's response
      await saveChatMessage(user.uid, currentConversationId, assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // Start a new chat
  async function handleNewChat() {
    if (loading || !user) return;

    try {
      if (conversationId) {
        await deleteConversation(user.uid, conversationId);
      }

      localStorage.removeItem(`creatordesk-ai-chat-${user.uid}`);

      setConversationId(null);
      setMessages([]);
      setInput("");
    } catch (error) {
      console.error("Unable to start a new chat:", error);
      alert("Unable to clear the current chat. Please try again.");
    }
  }

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div>
          <div className="ai-title">
            <Sparkles size={24} />
            <h1>CreatorDesk AI</h1>
          </div>

          <p>Your personal TikTok affiliate assistant.</p>
        </div>

        <button
          className="ai-new-chat"
          onClick={handleNewChat}
          disabled={loading || loadingHistory}
        >
          <Plus size={17} />
          New Chat
        </button>
      </div>

      {/* Statistics */}
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

      {/* Chat container */}
      <div
        className={`ai-chat ${
          messages.length > 0 ? "has-messages" : "empty-chat"
        }`}
      >
        {/* Messages */}
        <div className="ai-messages">
          {loadingHistory ? (
            <div className="ai-welcome">Loading your chat history...</div>
          ) : messages.length === 0 ? (
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

                <div className="ai-message-text">
                  {message.role === "assistant" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  ) : (
                    message.text
                  )}
                </div>
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

        {/* Message input */}
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
            disabled={loading || loadingHistory}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || loadingHistory}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="ai-disclaimer">
          AI can make mistakes. Always review its suggestions.
        </p>
      </div>
    </div>
  );
}
