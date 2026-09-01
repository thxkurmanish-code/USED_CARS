"use client";

import React, { useEffect, useState } from "react";
import { apiClient } from "@/services/api-client";
import { useAuth } from "@/features/auth/auth-provider";
import { ChatMessage, ConversationResponse } from "@/types/api";

interface ChatDrawerProps {
  listingId: string;
  carTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatDrawer({ listingId, carTitle, isOpen, onClose }: ChatDrawerProps) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState<ConversationResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function initChat() {
      if (!isOpen || !user) return;
      setLoading(true);
      try {
        const conv = await apiClient<ConversationResponse>(`/chat/conversations?listing_id=${listingId}`, {
          method: "POST",
        });
        setConversation(conv);

        const msgs = await apiClient<ChatMessage[]>(`/chat/conversations/${conv.id}/messages`);
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void initChat();
  }, [isOpen, listingId, user]);

  // Real-time 2.5-second polling loop when drawer is open
  useEffect(() => {
    if (!isOpen || !conversation || !user) return;

    const interval = setInterval(async () => {
      try {
        const latestMsgs = await apiClient<ChatMessage[]>(`/chat/conversations/${conversation.id}/messages`);
        setMessages((prev) => {
          // Merge keeping any pending optimistic messages
          const pending = prev.filter((m) => m.is_pending);
          const serverMsgIds = new Set(latestMsgs.map((m) => m.id));
          const filteredPending = pending.filter((m) => !serverMsgIds.has(m.id));
          return [...latestMsgs, ...filteredPending];
        });
      } catch {
        // ignore polling errors quietly
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, conversation, user]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = inputMessage.trim();
    if (!text || !conversation || !user) return;
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMsg: ChatMessage = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: user.id,
      body: text,
      is_read: false,
      status: "sent",
      is_pending: true,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputMessage("");
    setTimeout(scrollToBottom, 50);

    try {
      const newMsg = await apiClient<ChatMessage>(`/chat/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });

      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...newMsg, status: "delivered" } : m)));
      setTimeout(scrollToBottom, 50);
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-900 text-white">
        <div>
          <h3 className="font-display font-bold">Dream Car Bazaar Chat</h3>
          <p className="text-xs text-slate-300 truncate max-w-[280px]">{carTitle}</p>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-slate-300 hover:bg-slate-800">
          ✕
        </button>
      </div>

      {!user ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <p className="text-sm text-slate-600">Please sign in to chat with Dream Car Bazaar sales support.</p>
            <a href="/login" className="mt-4 inline-block rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white">
              Sign In
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {loading ? (
              <p className="text-center text-xs text-slate-500 pt-8">Loading messages…</p>
            ) : messages.length === 0 ? (
              <div className="pt-8 text-center text-xs text-slate-400">
                <p>Start a conversation with Dream Car Bazaar regarding {carTitle}.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user.id;
                const isRead = msg.is_read || msg.status === "read";
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                        isMe ? "bg-slate-900 text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-slate-400" : "text-slate-400"}`}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isMe && (
                          <span className="font-bold">
                            {msg.is_pending ? (
                              <span title="Sending (✓)">✓</span>
                            ) : isRead ? (
                              <span className="text-emerald-400 font-bold" title="Read (✓✓)">
                                ✓✓
                              </span>
                            ) : (
                              <span className="text-slate-400" title="Delivered (✓✓)">
                                ✓✓
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t p-3 bg-white flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about this vehicle..."
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending || !inputMessage.trim()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

