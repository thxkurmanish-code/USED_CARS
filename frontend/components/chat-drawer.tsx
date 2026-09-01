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
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    void initChat();
  }, [isOpen, listingId, user]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || !conversation) return;
    setSending(true);

    try {
      const newMsg = await apiClient<ChatMessage>(`/chat/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: inputMessage.trim() }),
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputMessage("");
    } catch {
      alert("Failed to send message.");
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
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${
                        isMe ? "bg-slate-900 text-white rounded-br-none" : "bg-white border text-slate-800 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.body}</p>
                      <span className={`block mt-1 text-[10px] ${isMe ? "text-slate-400 text-right" : "text-slate-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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
