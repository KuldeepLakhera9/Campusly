"use client";

import * as React from "react";
import { IConversation, IChatMessage } from "@/types/message";
import { MOCK_CONVERSATIONS } from "@/lib/data/mock-data";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Send,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Search,
  CheckCheck,
} from "lucide-react";

export default function MessagesPage() {
  const [conversations, setConversations] =
    React.useState<IConversation[]>(MOCK_CONVERSATIONS);
  const [activeId, setActiveId] = React.useState<string>(MOCK_CONVERSATIONS[0].id);
  const [inputMessage, setInputMessage] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [mobileShowChat, setMobileShowChat] = React.useState(false);

  const activeConversation = conversations.find((c) => c.id === activeId);

  const filteredConversations = conversations.filter((c) =>
    c.recipientPseudonym.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConversation) return;

    const newMsg: IChatMessage = {
      id: `msg-${Date.now()}`,
      senderPseudonym: "Library Fox",
      senderAvatarColor: "#C15438",
      isCurrentUser: true,
      content: inputMessage.trim(),
      timestamp: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: newMsg.content,
              lastMessageTime: "Just now",
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setInputMessage("");
  };

  const handleToggleIdentityReveal = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, realIdentityRevealed: !c.realIdentityRevealed }
          : c
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      {/* Page Heading */}
      <div className="pb-4 border-b border-campus-border/70 mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-campus-charcoal">
          Pseudonymous Conversations
        </h1>
        <p className="text-xs sm:text-sm text-campus-muted mt-0.5">
          Communicate directly with campus peers without the pressure of sharing personal social media.
        </p>
      </div>

      {/* Main Messenger Box */}
      <Card className="h-[680px] grid grid-cols-1 md:grid-cols-12 overflow-hidden shadow-xs">
        {/* Left Column: Conversation List (md: 4 or 5 cols) */}
        <div
          className={`md:col-span-4 lg:col-span-5 border-r border-campus-border flex flex-col h-full bg-campus-bg/30 ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search */}
          <div className="p-3.5 border-b border-campus-border/80 bg-white">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-campus-bg border border-campus-border text-xs">
              <Search className="w-3.5 h-3.5 text-campus-muted shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-campus-charcoal placeholder:text-campus-subtle"
              />
            </div>
          </div>

          {/* Threads List */}
          <div className="flex-1 overflow-y-auto divide-y divide-campus-border/50">
            {filteredConversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                    isActive
                      ? "bg-white border-l-3 border-l-campus-accent shadow-2xs"
                      : "hover:bg-white/70"
                  }`}
                >
                  <Avatar
                    moniker={c.recipientPseudonym}
                    color={c.recipientAvatarColor}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-campus-charcoal truncate">
                        {c.recipientPseudonym}
                      </span>
                      <span className="text-[10px] text-campus-muted shrink-0">
                        {c.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-xs text-campus-muted truncate mt-1">
                      {c.lastMessage}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline" size="sm">
                        {c.recipientCircle}
                      </Badge>
                      {c.realIdentityRevealed && (
                        <span className="text-[10px] font-medium text-emerald-700 flex items-center gap-1">
                          <CheckCheck className="w-3 h-3" />
                          <span>Revealed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Chat Window (md: 8 or 7 cols) */}
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
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-1 text-campus-muted hover:text-campus-charcoal rounded-md"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <Avatar
                    moniker={activeConversation.recipientPseudonym}
                    color={activeConversation.recipientAvatarColor}
                    size="sm"
                  />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-campus-charcoal leading-tight">
                      {activeConversation.recipientPseudonym}
                    </h3>
                    <div className="text-[10px] text-campus-muted flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>{activeConversation.recipientCircle} circle</span>
                    </div>
                  </div>
                </div>

                {/* Identity Reveal Toggle */}
                <button
                  onClick={handleToggleIdentityReveal}
                  className={`text-xs px-2.5 py-1.5 rounded-md border font-medium transition-colors flex items-center gap-1.5 ${
                    activeConversation.realIdentityRevealed
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-campus-bg text-campus-muted border-campus-border hover:text-campus-charcoal"
                  }`}
                  title="Mutual consent required to reveal real names"
                >
                  {activeConversation.realIdentityRevealed ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Mutual Identity Revealed</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-campus-muted" />
                      <span>Request Identity Reveal</span>
                    </>
                  )}
                </button>
              </div>

              {/* Privacy Banner */}
              <div className="px-4 py-2 bg-stone-50 border-b border-stone-200/80 flex items-center gap-2 text-[11px] text-campus-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-campus-accent shrink-0" />
                <span>
                  Your student email and name remain hidden until both students click Reveal.
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-campus-bg/20">
                {activeConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.isCurrentUser ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        msg.isCurrentUser
                          ? "bg-campus-charcoal text-white rounded-br-xs"
                          : "bg-white border border-campus-border text-campus-charcoal rounded-bl-xs"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-campus-subtle mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-campus-border bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Reply to ${activeConversation.recipientPseudonym}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2 text-sm bg-campus-bg border border-campus-border rounded-lg outline-none focus:border-campus-charcoal placeholder:text-campus-subtle"
                />
                <Button type="submit" variant="primary" size="md" disabled={!inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <EmptyState
              title="No conversation selected"
              description="Select a student thread from the left to read or start messaging."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
