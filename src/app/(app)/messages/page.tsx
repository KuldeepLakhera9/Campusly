"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { IConversationSummary, IChatMessage } from "@/types/message";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { PublicProfileModal } from "@/components/profile/public-profile-modal";
import { REPORT_REASONS, ReportReason } from "@/types/post";
import {
  Send,
  ShieldCheck,
  ArrowLeft,
  Search,
  Trash2,
  Flag,
  UserX,
  UserCheck,
  User,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramConvId = searchParams.get("c");

  const [conversations, setConversations] = React.useState<IConversationSummary[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(paramConvId || null);
  const [messages, setMessages] = React.useState<IChatMessage[]>([]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileShowChat, setMobileShowChat] = React.useState(Boolean(paramConvId));

  const [isLoadingConversations, setIsLoadingConversations] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [sendError, setSendError] = React.useState<string | null>(null);

  // Modals state
  const [viewProfileUserId, setViewProfileUserId] = React.useState<string | null>(null);
  const [reportTarget, setReportTarget] = React.useState<{ type: "message" | "user"; id: string } | null>(null);
  const [reportReason, setReportReason] = React.useState<ReportReason>("Spam");
  const [reportDetails, setReportDetails] = React.useState("");
  const [isSubmittingReport, setIsSubmittingReport] = React.useState(false);
  const [reportSuccess, setReportSuccess] = React.useState<string | null>(null);

  const [blockConfirmUser, setBlockConfirmUser] = React.useState<{ id: string; username: string; isBlocked: boolean } | null>(null);
  const [isProcessingBlock, setIsProcessingBlock] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // 1. Fetch Conversations List callback (for polling and manual triggers)
  const fetchConversations = React.useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingConversations(true);
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        const convList: IConversationSummary[] = data.conversations || [];
        setConversations(convList);

        if (!paramConvId && convList.length > 0) {
          setActiveId((curr) => curr || convList[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (!silent) setIsLoadingConversations(false);
    }
  }, [paramConvId]);

  // Initial conversations fetch
  React.useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      try {
        const res = await fetch("/api/conversations");
        if (res.ok && isMounted) {
          const data = await res.json();
          const convList: IConversationSummary[] = data.conversations || [];
          setConversations(convList);
          if (!paramConvId && convList.length > 0) {
            setActiveId((curr) => curr || convList[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        if (isMounted) setIsLoadingConversations(false);
      }
    }
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [paramConvId]);

  const activeConversation = conversations.find((c) => c.id === activeId);

  // 2. Fetch Messages callback (for polling and manual refresh)
  const fetchMessages = React.useCallback(
    async (silent = false) => {
      if (!activeId) return;
      try {
        if (!silent) setIsLoadingMessages(true);
        const res = await fetch(`/api/conversations/${activeId}/messages?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          if (!silent) {
            setTimeout(() => scrollToBottom("auto"), 50);
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [activeId]
  );

  // Load messages & mark conversation as read when activeId changes
  React.useEffect(() => {
    if (!activeId) return;
    let isMounted = true;

    async function loadActiveMessages() {
      try {
        setIsLoadingMessages(true);
        const res = await fetch(`/api/conversations/${activeId}/messages?limit=50`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setMessages(data.messages || []);
          setTimeout(() => scrollToBottom("auto"), 50);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    }

    loadActiveMessages();

    // Mark as read
    fetch(`/api/conversations/${activeId}/read`, { method: "POST" })
      .then(() => {
        if (isMounted) {
          setConversations((prev) =>
            prev.map((c) => (c.id === activeId ? { ...c, unreadCount: 0 } : c))
          );
        }
      })
      .catch((err) => console.error("Mark read error:", err));

    return () => {
      isMounted = false;
    };
  }, [activeId]);

  // 3. Smart Polling Engine (6-second interval, only while tab is visible and conversation is open)
  React.useEffect(() => {
    if (!activeId) return;

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (document.visibilityState === "visible") {
            fetchMessages(true);
            fetchConversations(true);
          }
        }, 6000);
      }
    };

    const stopPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMessages(true);
        fetchConversations(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeId, fetchMessages, fetchConversations]);

  // 4. Send Message Handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputMessage.trim();
    if (!content || !activeId || isSending) return;

    setSendError(null);
    setIsSending(true);

    // Optimistic message entry
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: IChatMessage = {
      id: tempId,
      senderPseudonym: "You",
      senderAvatarColor: "#C15438",
      isCurrentUser: true,
      content,
      createdAt: new Date().toISOString(),
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage("");
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to deliver message.");
      }

      // Replace optimistic message with actual confirmed message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? data.message : m))
      );

      // Update conversation thread preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                lastMessage: {
                  content,
                  senderPseudonym: "You",
                  createdAt: data.message.createdAt,
                },
                lastMessageTime: "Just now",
              }
            : c
        )
      );
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Couldn't send that. Try again.");
      // Rollback optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputMessage(content);
    } finally {
      setIsSending(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 5. Delete Message (Soft Delete)
  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, isDeleted: true, content: "This message was deleted" }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Delete message failed:", err);
    }
  };

  // 6. Block / Unblock User
  const handleToggleBlock = async () => {
    if (!blockConfirmUser) return;
    setIsProcessingBlock(true);

    try {
      const method = blockConfirmUser.isBlocked ? "DELETE" : "POST";
      const res = await fetch(`/api/users/${blockConfirmUser.id}/block`, { method });
      if (res.ok) {
        // Update local conversation state
        setConversations((prev) =>
          prev.map((c) =>
            c.otherUser.userId === blockConfirmUser.id
              ? {
                  ...c,
                  isBlockedByMe: !blockConfirmUser.isBlocked,
                  status: !blockConfirmUser.isBlocked ? "blocked" : "active",
                }
              : c
          )
        );
        setBlockConfirmUser(null);
      }
    } catch (err) {
      console.error("Block action failed:", err);
    } finally {
      setIsProcessingBlock(false);
    }
  };

  // 7. Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget) return;

    setIsSubmittingReport(true);
    setReportSuccess(null);

    try {
      const endpoint =
        reportTarget.type === "message"
          ? `/api/messages/${reportTarget.id}/report`
          : `/api/posts/${reportTarget.id}/report`; // Generic fallback

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });

      if (res.ok) {
        setReportSuccess("Report submitted. Campusly moderation will review this.");
        setTimeout(() => {
          setReportTarget(null);
          setReportSuccess(null);
          setReportDetails("");
        }, 1500);
      }
    } catch (err) {
      console.error("Report failed:", err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBlocked =
    activeConversation?.isBlockedByMe || activeConversation?.isBlockedByOther;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* Page Heading */}
      <div className="pb-4 border-b border-campus-border/70 mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
            Pseudonymous Conversations
          </h1>
          <p className="text-xs sm:text-sm text-campus-muted mt-0.5">
            Direct, private 1-to-1 chats with verified peers. Real names and emails remain hidden.
          </p>
        </div>
      </div>

      {/* Main Messenger Box */}
      <Card className="h-[700px] grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-xs border-campus-border/80">
        {/* Left Column: Conversation List */}
        <div
          className={`md:col-span-4 lg:col-span-5 border-r border-campus-border flex flex-col h-full bg-campus-bg/40 ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-3.5 border-b border-campus-border/80 bg-white">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-campus-bg border border-campus-border text-xs">
              <Search className="w-3.5 h-3.5 text-campus-muted shrink-0" />
              <input
                type="text"
                placeholder="Search by student moniker..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-campus-charcoal placeholder:text-campus-subtle"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-campus-border/50">
            {isLoadingConversations ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-6 h-6 text-campus-accent animate-spin mb-2" />
                <span className="text-xs text-campus-muted">Loading conversations...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const isActive = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveId(c.id);
                      setMobileShowChat(true);
                      router.replace(`/messages?c=${c.id}`);
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 relative ${
                      isActive
                        ? "bg-white border-l-3 border-l-campus-accent shadow-2xs"
                        : "hover:bg-white/80"
                    }`}
                  >
                    <Avatar
                      moniker={c.otherUser.username}
                      avatarId={c.otherUser.avatarId}
                      color={c.otherUser.avatarColor}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            c.unreadCount > 0
                              ? "font-bold text-campus-charcoal"
                              : "font-medium text-campus-charcoal"
                          }`}
                        >
                          {c.otherUser.username}
                        </span>
                        <span className="text-[10px] text-campus-muted shrink-0">
                          {c.lastMessageTime}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate mt-1 ${
                          c.unreadCount > 0
                            ? "font-semibold text-campus-charcoal"
                            : "text-campus-muted"
                        } ${c.lastMessage?.isDeleted ? "italic opacity-80" : ""}`}
                      >
                        {c.lastMessage ? c.lastMessage.content : "Started a new conversation."}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-campus-subtle truncate max-w-[140px]">
                          {c.otherUser.collegeName || "Campusly University"}
                        </span>
                        {c.unreadCount > 0 && (
                          <span className="min-w-4 h-4 px-1 rounded-full bg-campus-accent text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </span>
                        )}
                        {c.status === "blocked" && (
                          <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="font-serif text-sm font-semibold text-campus-charcoal mb-1">
                  No conversations yet.
                </p>
                <p className="text-xs text-campus-muted leading-relaxed">
                  Find someone interesting on campus and start a conversation.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div
          className={`md:col-span-8 lg:col-span-7 flex flex-col h-full bg-white ${
            !mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 sm:px-6 border-b border-campus-border flex items-center justify-between bg-white z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 text-campus-muted hover:text-campus-charcoal rounded-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setViewProfileUserId(activeConversation.otherUser.userId)}
                    className="flex items-center gap-3 text-left group"
                  >
                    <Avatar
                      moniker={activeConversation.otherUser.username}
                      avatarId={activeConversation.otherUser.avatarId}
                      color={activeConversation.otherUser.avatarColor}
                      size="sm"
                    />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-campus-charcoal leading-tight group-hover:text-campus-accent transition-colors">
                        {activeConversation.otherUser.username}
                      </h3>
                      <p className="text-[10px] text-campus-muted truncate max-w-[180px] sm:max-w-xs mt-0.5">
                        {activeConversation.otherUser.interests && activeConversation.otherUser.interests.length > 0
                          ? activeConversation.otherUser.interests.slice(0, 3).join(" · ")
                          : activeConversation.otherUser.collegeName}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Header Action Menu */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewProfileUserId(activeConversation.otherUser.userId)}
                    className="text-xs text-campus-muted hover:text-campus-charcoal hidden sm:flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setBlockConfirmUser({
                        id: activeConversation.otherUser.userId,
                        username: activeConversation.otherUser.username,
                        isBlocked: Boolean(activeConversation.isBlockedByMe),
                      })
                    }
                    className="text-xs text-campus-muted hover:text-red-700"
                    title={activeConversation.isBlockedByMe ? "Unblock user" : "Block user"}
                  >
                    {activeConversation.isBlockedByMe ? (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <UserX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Privacy Banner */}
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-200/70 flex items-center justify-between gap-2 text-[11px] text-campus-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                  <span>
                    Anonymous to peers. Accountable to Campusly. Real identity is never revealed.
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-campus-bg/25">
                {isLoadingMessages ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <Loader2 className="w-6 h-6 text-campus-accent animate-spin mb-2" />
                    <span className="text-xs text-campus-muted">Loading messages...</span>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${
                        msg.isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%]">
                        {/* Action trigger for current user (Delete) */}
                        {msg.isCurrentUser && !msg.isDeleted && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-red-600 transition-opacity"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={`rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                            msg.isDeleted
                              ? "bg-stone-100 border border-stone-200 text-stone-500 italic"
                              : msg.isCurrentUser
                              ? "bg-campus-charcoal text-white rounded-br-xs"
                              : "bg-white border border-campus-border text-campus-charcoal rounded-bl-xs"
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Action trigger for peer message (Report) */}
                        {!msg.isCurrentUser && !msg.isDeleted && (
                          <button
                            onClick={() =>
                              setReportTarget({ type: "message", id: msg.id })
                            }
                            className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-amber-600 transition-opacity"
                            title="Report message"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <span className="text-[10px] text-campus-subtle mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <p className="font-serif text-sm font-semibold text-campus-charcoal mb-1">
                      Start the conversation.
                    </p>
                    <p className="text-xs text-campus-muted max-w-xs leading-relaxed">
                      Say something natural. Ask about classes, hangouts, or shared campus interests.
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Blocked or Active Input Bar */}
              {isBlocked ? (
                <div className="p-4 border-t border-campus-border bg-stone-50 text-center">
                  <p className="text-xs font-medium text-stone-600">
                    {activeConversation.isBlockedByMe
                      ? "You have blocked this student. Unblock to resume messaging."
                      : "Messaging is currently unavailable between these accounts."}
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-campus-border bg-white"
                >
                  {sendError && (
                    <div className="mb-2 text-xs text-red-600 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{sendError}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <textarea
                      rows={1}
                      placeholder={`Message ${activeConversation.otherUser.username}... (Enter to send, Shift+Enter for newline)`}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-campus-bg border border-campus-border rounded-lg outline-none focus:border-campus-charcoal resize-none placeholder:text-campus-subtle max-h-28"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      disabled={!inputMessage.trim() || isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <EmptyState
              title="No conversation selected"
              description="Select a student thread from the left to read or start messaging."
            />
          )}
        </div>
      </Card>

      {/* Public Profile Modal */}
      <PublicProfileModal
        userId={viewProfileUserId}
        isOpen={Boolean(viewProfileUserId)}
        onClose={() => setViewProfileUserId(null)}
      />

      {/* Report Modal */}
      <Modal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title="Report Message"
        size="sm"
      >
        <form onSubmit={handleSubmitReport} className="space-y-4 pt-2">
          {reportSuccess ? (
            <div className="py-6 text-center text-sm text-emerald-700 font-medium">
              {reportSuccess}
            </div>
          ) : (
            <>
              <p className="text-xs text-campus-muted">
                Help keep Campusly safe and respectful. Select a reason for your report:
              </p>

              <div>
                <label className="block text-xs font-semibold text-campus-charcoal mb-1">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 text-xs border border-campus-border rounded-lg bg-white outline-none focus:border-campus-charcoal"
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-campus-charcoal mb-1">
                  Additional Details (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for our moderators..."
                  className="w-full px-3 py-2 text-xs border border-campus-border rounded-lg bg-white outline-none focus:border-campus-charcoal"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-campus-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReportTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingReport}
                >
                  {isSubmittingReport ? "Submitting..." : "Submit Report"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Block Confirmation Modal */}
      <Modal
        isOpen={Boolean(blockConfirmUser)}
        onClose={() => setBlockConfirmUser(null)}
        title={blockConfirmUser?.isBlocked ? "Unblock Student" : "Block Student"}
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs sm:text-sm text-campus-charcoal leading-relaxed">
            {blockConfirmUser?.isBlocked
              ? `Are you sure you want to unblock ${blockConfirmUser?.username}? They will be able to message you again.`
              : `Are you sure you want to block ${blockConfirmUser?.username}? They will not be able to message you or view your updates.`}
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-campus-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBlockConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant={blockConfirmUser?.isBlocked ? "primary" : "secondary"}
              size="sm"
              onClick={handleToggleBlock}
              disabled={isProcessingBlock}
            >
              {isProcessingBlock
                ? "Processing..."
                : blockConfirmUser?.isBlocked
                ? "Unblock"
                : "Confirm Block"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
