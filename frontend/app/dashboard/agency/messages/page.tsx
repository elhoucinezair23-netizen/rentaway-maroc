"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Send, Paperclip, Loader2, MessageSquare, User,
} from "lucide-react";
import { Message } from "@/types";
import { messageApi } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
}

type RawMessage = Message & {
  sender: { id: string; firstName: string; lastName: string; avatar?: string };
  receiver: { id: string; firstName: string; lastName: string; avatar?: string };
};

export default function AgencyMessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const sessionUser = session?.user as {
    id?: string;
    name?: string;
    image?: string;
    accessToken?: string;
  } | undefined;

  // Pre-select conversation from URL param ?user=xxx
  useEffect(() => {
    const userId = searchParams.get("user");
    if (userId) setSelectedId(userId);
  }, [searchParams]);

  // Init WebSocket
  useEffect(() => {
    if (!sessionUser?.id) return;
    const token = (session as { accessToken?: string })?.accessToken;
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000",
      { auth: { token } }
    );
    socketRef.current = socket;
    socket.on("message:new", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // Refresh conversations list on new message
      loadConversations();
    });
    return () => { socket.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id, session]);

  const loadConversations = useCallback(() => {
    const myId = sessionUser?.id;
    messageApi
      .getConversations()
      .then((res) => {
        const data: RawMessage[] = res.data || [];
        const convs: Conversation[] = data.map((m) => {
          const partner = m.senderId === myId ? m.receiver : m.sender;
          return {
            partnerId: partner?.id || "",
            partnerName: `${partner?.firstName || ""} ${partner?.lastName || ""}`.trim(),
            partnerAvatar: partner?.avatar,
            lastMessage: m.content || (m.attachmentUrl ? "📎 Pièce jointe" : ""),
            lastDate: m.createdAt,
            unread: 0,
          };
        });
        setConversations(convs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionUser?.id]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedId) return;
    messageApi
      .getMessages(selectedId)
      .then((r) => setMessages(r.data || []))
      .catch(() => {});
  }, [selectedId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!content.trim() || !selectedId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("receiverId", selectedId);
      fd.append("content", content);
      const res = await messageApi.send(fd);
      setMessages((prev) => [...prev, res.data]);
      setContent("");
      loadConversations();
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const fd = new FormData();
    fd.append("receiverId", selectedId);
    fd.append("content", "");
    fd.append("attachment", file);
    try {
      const r = await messageApi.send(fd);
      setMessages((p) => [...p, r.data]);
      loadConversations();
    } catch {
      toast.error("Erreur upload");
    }
    // Reset input
    e.target.value = "";
  };

  const myId = sessionUser?.id;

  const selectedConversation = conversations.find((c) => c.partnerId === selectedId);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Messages</h1>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex h-[calc(100vh-220px)] min-h-[500px]">
        {/* Conversation list */}
        <div className="w-72 border-r border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-700">Conversations clients</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-10 text-gray-400 px-4">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune conversation</p>
                <p className="text-xs mt-1">Les clients vous contacteront depuis la page véhicule</p>
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.partnerId}
                  onClick={() => setSelectedId(c.partnerId)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    selectedId === c.partnerId
                      ? "bg-primary-50 border-r-2 border-primary-600"
                      : ""
                  }`}
                >
                  {c.partnerAvatar ? (
                    <Image
                      src={c.partnerAvatar}
                      alt=""
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.partnerName}</p>
                    <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(c.lastDate), "HH:mm", { locale: fr })}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sélectionnez une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              {selectedConversation && (
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                  {selectedConversation.partnerAvatar ? (
                    <Image
                      src={selectedConversation.partnerAvatar}
                      alt=""
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedConversation.partnerName}
                  </p>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMe = msg.senderId === myId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                          isMe
                            ? "bg-primary-600 text-white rounded-br-sm"
                            : "bg-gray-100 text-gray-900 rounded-bl-sm"
                        }`}
                      >
                        {msg.attachmentUrl && (
                          <a
                            href={msg.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block mb-2 underline opacity-80 text-xs"
                          >
                            📎 Pièce jointe
                          </a>
                        )}
                        {msg.content && (
                          <p className="leading-relaxed">{msg.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${isMe ? "text-primary-200" : "text-gray-400"}`}>
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <label className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
                    <Paperclip className="h-4 w-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <input
                    type="text"
                    placeholder="Votre message..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!content.trim() || sending}
                    className="p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
