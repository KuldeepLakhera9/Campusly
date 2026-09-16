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
import { formatRelativeTime } from "@/lib/utils/formatters";
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
  Check,
  CheckCheck,
  Clock,
  ChevronDown,
  Copy,
  MessageSquare,
  Smile,
  X,
} from "lucide-react";
import { ChatMessageSkeleton, ConversationThreadSkeleton } from "@/components/ui/skeleton-loader";

const REACTION_EMOJIS = ["❤️", "🔥", "😂", "👏", "👀", "💡"];


function formatChatDateDivider(dateStr?: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

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

  // Chat container scrolling and state management
  const chatContainerRef = React.useRef<HTMLDivElement>(null);
  const isNearBottomRef = React.useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = React.useState(false);
  const [newMessagesWhileScrolled, setNewMessagesWhileScrolled] = React.useState(0);
  const [copiedMsgId, setCopiedMsgId] = React.useState<string | null>(null);

  // In-chat search and reaction states
  const [chatSearchQuery, setChatSearchQuery] = React.useState("");
  const [showChatSearch, setShowChatSearch] = React.useState(false);
  const [activeReactionMenuMsgId, setActiveReactionMenuMsgId] = React.useState<string | null>(null);

  const handleToggleReaction = async (msgId: string, emoji: string) => {
    setActiveReactionMenuMsgId(null);

    // Optimistic UI update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        const currentReactions = msg.reactions || [];
        const existing = currentReactions.find((r) => r.emoji === emoji);
        let updatedReactions;
        if (existing) {
          if (existing.userReacted) {
            if (existing.count <= 1) {
              updatedReactions = currentReactions.filter((r) => r.emoji !== emoji);
            } else {
              updatedReactions = currentReactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r
              );
            }
          } else {
            updatedReactions = currentReactions.map((r) =>
              r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r
            );
          }
        } else {
          updatedReactions = [...currentReactions, { emoji, count: 1, userReacted: true }];
        }
        return { ...msg, reactions: updatedReactions };
      })
    );

    try {
      const res = await fetch(`/api/messages/${msgId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (res.ok && data.reactions) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === msgId ? { ...msg, reactions: data.reactions } : msg
          )
        );
      }
    } catch (err) {
      console.error("Reaction toggle failed:", err);
    }
  };

  const visibleMessages = React.useMemo(() => {
    if (!chatSearchQuery.trim()) return messages;
    const q = chatSearchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, chatSearchQuery]);

  // Container-isolated scroll to bottom helper (does NOT jump window/page)
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
      isNearBottomRef.current = true;
      setShowScrollBottomBtn(false);
      setNewMessagesWhileScrolled(0);
    }
  }, []);

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom);
    if (nearBottom) {
      setNewMessagesWhileScrolled(0);
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 1500);
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
          const incoming: IChatMessage[] = data.messages || [];
          setMessages((prev) => {
            if (silent && prev.length > 0 && incoming.length > prev.length) {
              if (!isNearBottomRef.current) {
                setNewMessagesWhileScrolled((c) => c + (incoming.length - prev.length));
              }
            }
            return incoming;
          });

          if (!silent || isNearBottomRef.current) {
            requestAnimationFrame(() => {
              scrollToBottom(silent ? "smooth" : "auto");
            });
          }
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [activeId, scrollToBottom]
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
          requestAnimationFrame(() => scrollToBottom("auto"));
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
  }, [activeId, scrollToBottom]);

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
      isSeen: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage("");
    requestAnimationFrame(() => scrollToBottom("smooth"));

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
                lastMessageIsMine: true,
                lastMessageSeen: false,
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
    <div className="max-w-6xl mx-auto px-0 sm:px-6 py-0 sm:py-6 md:py-8 h-[calc(100dvh-4rem)] md:h-auto flex flex-col">
      {/* Page Heading */}
      <div
        className={`pb-3 sm:pb-4 border-b border-campus-border/70 mb-2 sm:mb-6 flex items-center justify-between px-4 sm:px-0 ${
          mobileShowChat ? "hidden md:flex" : "flex"
        }`}
      >
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
      <Card className="flex-1 md:h-[750px] grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-xs border-0 sm:border border-campus-border/80 rounded-none sm:rounded-2xl min-h-0 bg-white">
        {/* Left Column: Conversation List */}
        <div
          className={`md:col-span-4 lg:col-span-5 border-r border-campus-border flex flex-col h-full bg-campus-bg/40 min-h-0 ${
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
              <div className="divide-y divide-campus-border/40">
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
                <ConversationThreadSkeleton />
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
                        className={`text-xs truncate mt-1 flex items-center gap-1.5 ${
                          c.unreadCount > 0
                            ? "font-semibold text-campus-charcoal"
                            : "text-campus-muted"
                        } ${c.lastMessage?.isDeleted ? "italic opacity-80" : ""}`}
                      >
                        {c.lastMessageIsMine && (
                          c.lastMessageSeen ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-600 shrink-0 stroke-[2.2]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-campus-subtle shrink-0" />
                          )
                        )}
                        <span className="truncate">
                          {c.lastMessage ? c.lastMessage.content : "Started a new conversation."}
                        </span>
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
          className={`md:col-span-8 lg:col-span-7 flex flex-col h-full bg-white min-h-0 ${
            !mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:px-6 border-b border-campus-border flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1.5 -ml-1 text-campus-muted hover:text-campus-charcoal rounded-md active:bg-stone-100"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setViewProfileUserId(activeConversation.otherUser.userId)}
                    className="flex items-center gap-3 text-left group cursor-pointer"
                  >
                    <Avatar
                      moniker={activeConversation.otherUser.username}
                      avatarId={activeConversation.otherUser.avatarId}
                      color={activeConversation.otherUser.avatarColor}
                      size="sm"
                    />
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-campus-charcoal leading-tight group-hover:text-campus-accent transition-colors flex items-center gap-1.5">
                        <span>{activeConversation.otherUser.username}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      </h3>
                      <p className="text-[10px] text-campus-muted truncate max-w-[170px] sm:max-w-xs mt-0.5">
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
                    onClick={() => {
                      setShowChatSearch((prev) => !prev);
                      if (showChatSearch) setChatSearchQuery("");
                    }}
                    className={`text-xs ${
                      showChatSearch
                        ? "text-campus-accent bg-campus-accent/10"
                        : "text-campus-muted hover:text-campus-charcoal"
                    }`}
                    title="Search in this chat"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>

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

              {/* In-Chat Search Bar */}
              {showChatSearch && (
                <div className="px-4 py-2 bg-stone-50 border-b border-campus-border/80 flex items-center gap-2 animate-in slide-in-from-top-1 shrink-0">
                  <Search className="w-3.5 h-3.5 text-campus-muted shrink-0" />
                  <input
                    type="text"
                    placeholder="Search keywords in this chat..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    autoFocus
                    className="flex-1 bg-transparent text-xs text-campus-charcoal placeholder:text-campus-subtle outline-none"
                  />
                  {chatSearchQuery && (
                    <span className="text-[11px] font-medium text-campus-muted">
                      {visibleMessages.length} {visibleMessages.length === 1 ? "match" : "matches"}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setChatSearchQuery("");
                      setShowChatSearch(false);
                    }}
                    className="p-1 text-campus-muted hover:text-campus-charcoal rounded cursor-pointer"
                    aria-label="Close search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Privacy Banner */}
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-200/70 flex items-center justify-between gap-2 text-[11px] text-campus-muted shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                  <span>
                    Anonymous to peers. Accountable to Campusly. Real identity is never revealed.
                  </span>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 min-h-0 p-3.5 sm:p-6 overflow-y-auto overscroll-contain space-y-3 bg-campus-bg/25 relative"
              >
                {isLoadingMessages ? (
                  <ChatMessageSkeleton />
                ) : visibleMessages.length > 0 ? (
                  visibleMessages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? visibleMessages[idx - 1] : null;
                    const showDivider =
                      !prevMsg ||
                      formatChatDateDivider(msg.createdAt) !== formatChatDateDivider(prevMsg.createdAt);

                    return (
                      <React.Fragment key={msg.id}>
                        {showDivider && (
                          <div className="flex justify-center my-3 select-none">
                            <span className="text-[10px] sm:text-[11px] font-medium text-campus-muted bg-white/90 border border-campus-border/70 px-3 py-0.5 rounded-full shadow-2xs">
                              {formatChatDateDivider(msg.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex flex-col group ${
                            msg.isCurrentUser ? "items-end" : "items-start"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 max-w-[85%] sm:max-w-[75%] relative">
                            {/* Actions for current user message */}
                            {msg.isCurrentUser && !msg.isDeleted && !msg.id.startsWith("temp-") && (
                              <div className="flex items-center gap-0.5 relative">
                                <button
                                  onClick={() =>
                                    setActiveReactionMenuMsgId(
                                      activeReactionMenuMsgId === msg.id ? null : msg.id
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-amber-600 transition-opacity cursor-pointer"
                                  title="Add reaction"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                </button>

                                {activeReactionMenuMsgId === msg.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveReactionMenuMsgId(null)}
                                    />
                                    <div className="absolute bottom-full mb-1 right-0 bg-white border border-campus-border rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-30 animate-in fade-in zoom-in-95">
                                      {REACTION_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleToggleReaction(msg.id, emoji)}
                                          className="p-1 text-sm hover:scale-125 transition-transform active:scale-95"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}

                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-campus-charcoal transition-opacity cursor-pointer"
                                  title={copiedMsgId === msg.id ? "Copied!" : "Copy message"}
                                >
                                  {copiedMsgId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-red-600 transition-opacity cursor-pointer"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div
                              className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                                msg.isDeleted
                                  ? "bg-stone-100 border border-stone-200 text-stone-500 italic"
                                  : msg.isCurrentUser
                                  ? "bg-campus-charcoal text-white rounded-br-xs"
                                  : "bg-white border border-campus-border text-campus-charcoal rounded-bl-xs"
                              }`}
                            >
                              {msg.content}
                            </div>

                            {/* Actions for peer message */}
                            {!msg.isCurrentUser && !msg.isDeleted && (
                              <div className="flex items-center gap-0.5 relative">
                                <button
                                  onClick={() =>
                                    setActiveReactionMenuMsgId(
                                      activeReactionMenuMsgId === msg.id ? null : msg.id
                                    )
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-amber-600 transition-opacity cursor-pointer"
                                  title="Add reaction"
                                >
                                  <Smile className="w-3.5 h-3.5" />
                                </button>

                                {activeReactionMenuMsgId === msg.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveReactionMenuMsgId(null)}
                                    />
                                    <div className="absolute bottom-full mb-1 left-0 bg-white border border-campus-border rounded-full shadow-lg px-2 py-1 flex items-center gap-1 z-30 animate-in fade-in zoom-in-95">
                                      {REACTION_EMOJIS.map((emoji) => (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleToggleReaction(msg.id, emoji)}
                                          className="p-1 text-sm hover:scale-125 transition-transform active:scale-95"
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  </>
                                )}

                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-campus-charcoal transition-opacity cursor-pointer"
                                  title={copiedMsgId === msg.id ? "Copied!" : "Copy message"}
                                >
                                  {copiedMsgId === msg.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    setReportTarget({ type: "message", id: msg.id })
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-1 text-campus-subtle hover:text-amber-600 transition-opacity cursor-pointer"
                                  title="Report message"
                                >
                                  <Flag className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Reaction Pills */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 px-1">
                              {msg.reactions.map((r) => (
                                <button
                                  key={r.emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, r.emoji)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all active:scale-95 cursor-pointer ${
                                    r.userReacted
                                      ? "bg-amber-100/90 border-amber-300 text-amber-950 font-bold shadow-2xs"
                                      : "bg-white/90 border-campus-border text-campus-charcoal hover:bg-stone-50"
                                  }`}
                                  title={`React with ${r.emoji}`}
                                >
                                  <span>{r.emoji}</span>
                                  <span className="text-[10px]">{r.count}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Message metadata & delivery/seen status */}
                          <div className="flex items-center gap-1.5 text-[10px] text-campus-subtle mt-1 px-1 select-none">
                            <span>{msg.timestamp}</span>
                            {msg.isCurrentUser && !msg.isDeleted && (
                              <>
                                {msg.id.startsWith("temp-") ? (
                                  <span className="flex items-center gap-0.5 text-stone-400" title="Sending...">
                                    <Clock className="w-3 h-3 animate-pulse" />
                                    <span className="text-[9px]">Sending</span>
                                  </span>
                                ) : msg.isSeen ? (
                                  <span
                                    className="flex items-center gap-1 text-sky-600 font-semibold"
                                    title={msg.seenAt ? `Seen ${formatRelativeTime(msg.seenAt)}` : "Seen by student"}
                                  >
                                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.4]" />
                                    <span className="text-[9px] uppercase tracking-wider font-bold">Seen</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 text-stone-400" title="Delivered">
                                    <Check className="w-3.5 h-3.5" />
                                    <span className="text-[9px]">Sent</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                ) : chatSearchQuery ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                    <Search className="w-8 h-8 text-campus-muted mb-2 opacity-60" />
                    <p className="font-serif text-sm font-semibold text-campus-charcoal mb-1">
                      No matching messages
                    </p>
                    <p className="text-xs text-campus-muted max-w-xs leading-relaxed mb-3">
                      We couldn&apos;t find any messages containing &quot;{chatSearchQuery}&quot;.
                    </p>
                    <button
                      type="button"
                      onClick={() => setChatSearchQuery("")}
                      className="text-xs text-campus-accent font-semibold hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-campus-accent/10 text-campus-accent flex items-center justify-center mb-3 shadow-2xs">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="font-serif text-base font-semibold text-campus-charcoal mb-1">
                      Start your private conversation
                    </p>
                    <p className="text-xs text-campus-muted max-w-xs leading-relaxed mb-4">
                      Direct, pseudonymous messaging. Ask about classes, study sessions, or shared interests.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                      {[
                        "👋 Hey! What's your major?",
                        "📚 Free for a study session this week?",
                        "☕ Any good coffee spot recommendations nearby?",
                      ].map((promptText) => (
                        <button
                          key={promptText}
                          type="button"
                          onClick={() => setInputMessage(promptText)}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-white border border-campus-border hover:border-campus-accent hover:text-campus-accent transition-all text-campus-body text-left shadow-2xs cursor-pointer active:scale-95"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floating jump to latest messages button */}
                {showScrollBottomBtn && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom("smooth")}
                    className="sticky bottom-2 ml-auto z-20 bg-white/95 text-campus-charcoal hover:bg-white border border-campus-border shadow-md rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all animate-in fade-in zoom-in-95 cursor-pointer active:scale-95"
                    title="Jump to latest messages"
                  >
                    <ChevronDown className="w-4 h-4 text-campus-accent" />
                    <span className="text-xs font-semibold">Latest</span>
                    {newMessagesWhileScrolled > 0 && (
                      <span className="text-[10px] font-bold bg-campus-accent text-white px-1.5 py-0.5 rounded-full">
                        {newMessagesWhileScrolled}
                      </span>
                    )}
                  </button>
                )}
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
                  className="p-2.5 sm:p-4 border-t border-campus-border bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
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
