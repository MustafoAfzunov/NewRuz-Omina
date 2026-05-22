import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { MessageSquare, Plus, Send } from "lucide-react";
import { Button } from "./ui/button";
import { api, type Conversation, type Message, type MessageContact } from "../lib/api";
type MessagesInboxProps = {
  role: "mentor" | "mentee";
};

function formatMessageTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function MessagesInbox({ role }: MessagesInboxProps) {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [newContactId, setNewContactId] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const loadConversations = useCallback(() => {
    return api.getConversations().then((data) => {
      setConversations(Array.isArray(data) ? data : []);
    });
  }, []);

  const loadContacts = useCallback(() => {
    return api.getMessageContacts().then((data) => {
      setContacts(Array.isArray(data) ? data : []);
    });
  }, []);

  const loadMessages = useCallback((conversationId: number) => {
    setLoadingThread(true);
    return api
      .getConversationMessages(conversationId)
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingThread(false));
  }, []);

  useEffect(() => {
    const param = searchParams.get("conversation");
    if (param) {
      const id = Number(param);
      if (!Number.isNaN(id)) setSelectedId(id);
    }
  }, [searchParams]);

  useEffect(() => {
    setLoadingList(true);
    setError("");
    Promise.all([loadConversations(), loadContacts()])
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      })
      .finally(() => setLoadingList(false));
  }, [loadConversations, loadContacts]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
    const interval = window.setInterval(() => {
      void loadMessages(selectedId);
      void loadConversations();
    }, 8000);
    return () => window.clearInterval(interval);
  }, [selectedId, loadMessages, loadConversations]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = (id: number) => {
    setSelectedId(id);
    setShowNewChat(false);
  };

  const startConversation = async () => {
    const contactId = Number(newContactId);
    if (!contactId) return;
    setError("");
    try {
      const conv = await api.createConversation(
        role === "mentor" ? { mentee_id: contactId } : { mentor_id: contactId },
      );
      await loadConversations();
      setSelectedId(conv.id);
      setShowNewChat(false);
      setNewContactId("");
      await loadMessages(conv.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start conversation.");
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError("");
    try {
      const msg = await api.sendMessage(selectedId, draft.trim());
      setDraft("");
      setMessages((prev) => [...prev, msg]);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  };

  const subtitle =
    role === "mentor"
      ? "Chat with mentees you have sessions with."
      : "Chat with mentors you have sessions with.";

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      <header className="bg-white border-b px-8 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="flex flex-1 min-h-0 p-6 gap-4">
        <aside className="w-80 shrink-0 flex flex-col bg-white border rounded-xl overflow-hidden">
          <div className="p-3 border-b flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-900">Conversations</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => setShowNewChat((v) => !v)}
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </div>

          {showNewChat ? (
            <div className="p-3 border-b bg-gray-50 space-y-2">
              <label className="text-xs font-medium text-gray-600">
                {role === "mentor" ? "Message a mentee" : "Message a mentor"}
              </label>
              <select
                value={newContactId}
                onChange={(e) => setNewContactId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
              >
                <option value="">Select…</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.username}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!newContactId}
                onClick={() => void startConversation()}
              >
                Start chat
              </Button>
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <p className="p-4 text-sm text-gray-500">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No conversations yet. Start a new chat with someone you have a session with.
              </p>
            ) : (
              conversations.map((conv) => {
                const active = conv.id === selectedId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => openConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors ${
                      active ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {conv.other_username}
                      </p>
                      {conv.unread_count > 0 ? (
                        <span className="shrink-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {conv.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.last_message || "No messages yet"}
                    </p>
                    {conv.last_message_at ? (
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatMessageTime(conv.last_message_at)}
                      </p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-white border rounded-xl overflow-hidden min-w-0">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm p-8 text-center">
              Select a conversation or start a new chat.
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b">
                <p className="font-semibold text-gray-900">{selected.other_username}</p>
                <p className="text-xs text-gray-500">{selected.other_email}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-gray-50/80">
                {loadingThread && messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">
                    Say hello — your first message will appear here.
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          msg.is_mine
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white border text-gray-900 rounded-bl-md shadow-sm"
                        }`}
                      >
                        {!msg.is_mine ? (
                          <p className="text-[10px] font-semibold opacity-70 mb-1">
                            {msg.sender_username}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            msg.is_mine ? "text-blue-100" : "text-gray-400"
                          }`}
                        >
                          {formatMessageTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>

              <form onSubmit={(e) => void handleSend(e)} className="p-4 border-t flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  maxLength={4000}
                />
                <Button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
