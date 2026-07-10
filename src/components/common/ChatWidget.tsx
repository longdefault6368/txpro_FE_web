"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Headset } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function formatMessageContent(content: string) {
  const lines = content.split("\n");
  return lines.map((line, lineIdx) => {
    const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
    const cleanLine = isBullet ? line.trim().substring(2) : line;

    const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
    const renderedLine = parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (isBullet) {
      return (
        <li key={lineIdx} className="ml-4 list-disc list-inside my-1">
          {renderedLine}
        </li>
      );
    }

    return (
      <p key={lineIdx} className="my-1 min-h-[1rem]">
        {renderedLine}
      </p>
    );
  });
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDot, setShowDot] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI thông minh của TXEPRO. Tôi có thể giúp gì cho quý khách hoặc tài xế hôm nay?",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from localStorage on client-side mount
  useEffect(() => {
    const saved = localStorage.getItem("txpro_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history:", e);
      }
    }
  }, []);

  // Save chat history to localStorage when messages update
  useEffect(() => {
    if (messages.length > 1) {
      localStorage.setItem("txpro_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  // Sync conversation history across multiple browser tabs in real-time
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "txpro_chat_history" && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch (err) {
          console.error("Storage sync error:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (showDot) setShowDot(false);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio("/audio/live_chat.mp3");
      audio.play().catch((err) => console.log("Audio autoplay blocked by browser:", err));
    } catch (e) {
      console.error("Failed to play chat sound:", e);
    }
  };

  const getAIResponse = async (chatHistory: Message[]) => {
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      
      // Play received message sound
      playNotificationSound();

      return data.reply;
    } catch (error) {
      console.error("AI fetch error:", error);
      return "Xin lỗi, hiện tại hệ thống AI đang quá tải hoặc gặp sự cố mạng. Vui lòng gửi lại câu hỏi sau!";
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    const text = inputVal.trim();
    if (!text || isTyping) return;

    const newMessages = [...messages, { role: "user", content: text } as Message];
    setMessages(newMessages);
    setInputVal("");

    const aiReply = await getAIResponse(newMessages);
    setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
  };

  const handleQuickReply = async (text: string) => {
    if (isTyping) return;
    
    const newMessages = [...messages, { role: "user", content: text } as Message];
    setMessages(newMessages);

    const aiReply = await getAIResponse(newMessages);
    setMessages((prev) => [...prev, { role: "assistant", content: aiReply }]);
  };

  return (
    <div id="chatWidget" className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      <div
        id="chatWindow"
        className={`absolute bottom-16 right-0 w-[calc(100vw-2.5rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                <Headset className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <p className="font-bold text-sm">Trợ lý AI TXEPRO</p>
              <p className="text-xs text-primary-100">Đang trực tuyến</p>
            </div>
          </div>
          <button onClick={toggleChat} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages list (Height increased by ~26% to max-h-[380px]) */}
        <div
          id="chatMessages"
          className="flex-1 p-4 space-y-4 max-h-[380px] overflow-y-auto bg-slate-50 text-sm"
        >
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">
                  TX
                </div>
              )}
              <div
                className={`${
                  msg.role === "user" ? "bg-primary-600 text-white" : "bg-white text-slate-700"
                } p-3 rounded-2xl shadow-sm max-w-[80%] leading-relaxed`}
              >
                {formatMessageContent(msg.content)}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold flex-shrink-0">
                TX
              </div>
              <div className="bg-white text-slate-400 p-3 rounded-2xl shadow-sm max-w-[80%] flex items-center gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        <div className="p-2 border-t border-slate-100 bg-white flex gap-2 flex-wrap">
          <button
            onClick={() => handleQuickReply("Tôi muốn tìm xe gửi hàng")}
            disabled={isTyping}
            className="quick-reply bg-slate-100 hover:bg-primary-50 hover:text-primary-600 text-slate-600 px-3 py-1.5 rounded-full text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tôi muốn tìm xe gửi hàng
          </button>
          <button
            onClick={() => handleQuickReply("Tôi muốn đăng xe rỗng")}
            disabled={isTyping}
            className="quick-reply bg-slate-100 hover:bg-primary-50 hover:text-primary-600 text-slate-600 px-3 py-1.5 rounded-full text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tôi muốn đăng xe rỗng
          </button>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder={isTyping ? "AI đang trả lời..." : "Nhập tin nhắn..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isTyping}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-primary-500 text-sm disabled:bg-slate-50"
          />
          <button
            onClick={handleSend}
            disabled={isTyping}
            className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={toggleChat}
        className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center relative"
      >
        <MessageSquare className="w-6 h-6" />
        {showDot && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-ping"></span>
        )}
      </button>
    </div>
  );
}
