"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  Bot,
  ExternalLink,
  FileText,
  MessageSquarePlus,
  Mic,
  MoreVertical,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { chatApi, suggestedQuestions } from "@/lib/api/services";
import { formatRelative } from "@/lib/format";
import type { ChatMessage, ChatSource, Conversation } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Typing indicator                                                     */
/* ------------------------------------------------------------------ */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground/50"
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: i * 0.18,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Source reference card                                               */
/* ------------------------------------------------------------------ */
function SourceCard({ source }: { source: ChatSource }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <FileText className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold">{source.documentName}</p>
          <Badge variant="secondary" className="shrink-0 text-xs">
            p. {source.page}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{source.snippet}</p>
        <div className="mt-1 flex items-center gap-1">
          <div
            className="h-1.5 flex-1 rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={Math.round(source.score * 100)}
          >
            <div
              className="h-1.5 rounded-full bg-primary/60 transition-all"
              style={{ width: `${Math.round(source.score * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{Math.round(source.score * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Single chat message bubble                                           */
/* ------------------------------------------------------------------ */
function ChatBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  const isUser = message.role === "user";

  const [displayedContent, setDisplayedContent] = React.useState(
    isUser || !isStreaming ? message.content : ""
  );

  React.useEffect(() => {
    if (isUser || !isStreaming) {
      setDisplayedContent(message.content);
      return;
    }
    // Simulate word-by-word streaming
    const words = message.content.split(" ");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedContent(words.slice(0, i).join(" "));
      if (i >= words.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [message.content, isUser, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-primary text-primary-foreground" : "bg-primary/10"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4 text-primary" />}
      </div>

      <div className={`min-w-0 max-w-[80%] space-y-2 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`min-w-0 max-w-full overflow-hidden rounded-2xl px-4 py-3 ${
            isUser
              ? "rounded-br-sm bg-primary text-primary-foreground"
              : "rounded-bl-sm bg-muted"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed wrap-break-word whitespace-pre-wrap">{displayedContent}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed wrap-break-word [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-md my-2 max-w-full overflow-x-auto"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-[13px]" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {displayedContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source references */}
        {!isUser && message.sources && message.sources.length > 0 && displayedContent === message.content && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <FileText className="h-3 w-3" />
              {message.sources.length} source{message.sources.length === 1 ? "" : "s"}
            </div>
          </motion.div>
        )}

        <p className="text-[11px] text-muted-foreground">
          {formatRelative(message.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Conversation sidebar item                                           */
/* ------------------------------------------------------------------ */
function ConvItem({
  conv,
  active,
  onSelect,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <MessageSquarePlus className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-sm font-medium">{conv.title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 aria-hidden /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Chat Page                                                       */
/* ------------------------------------------------------------------ */
export default function ChatPage() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = React.useState<string | null>(null);
  // Transient bubble for the question currently in flight. The persisted
  // conversation is the single source of truth for everything already
  // answered, so this is the ONLY place an un-persisted message lives.
  const [pendingUserMsg, setPendingUserMsg] = React.useState<ChatMessage | null>(null);
  const [input, setInput] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingMsgId, setStreamingMsgId] = React.useState<string | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isPending: convsLoading } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: chatApi.conversations,
  });

  const activeConv = React.useMemo(
    () => conversations?.find((c) => c.id === activeConvId),
    [conversations, activeConvId]
  );

  // The persisted transcript, plus the in-flight question if one is pending.
  const messages = React.useMemo(() => {
    const base = activeConv?.messages ?? [];
    return pendingUserMsg ? [...base, pendingUserMsg] : base;
  }, [activeConv, pendingUserMsg]);

  // Snap to the newest message whenever the transcript changes.
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  // Keep the view pinned to the bottom while the answer types out word-by-word
  // (the bubble grows without the `messages` array changing).
  React.useEffect(() => {
    if (!streamingMsgId) return;
    const interval = window.setInterval(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 150);
    return () => window.clearInterval(interval);
  }, [streamingMsgId]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      let convId = activeConvId;
      if (!convId) {
        const newConv = await chatApi.createConversation(question);
        convId = newConv.id;
        setActiveConvId(newConv.id);
        // Seed the cache so the sidebar shows the new conversation immediately.
        queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (old) =>
          old ? [newConv, ...old] : [newConv]
        );
      }

      // Show the question right away as a transient bubble.
      setPendingUserMsg({
        id: `pending-${Date.now()}`,
        role: "user",
        content: question,
        createdAt: new Date().toISOString(),
      });
      setIsStreaming(true);

      return chatApi.ask(convId, question);
    },
    onSuccess: ({ conversation, assistantMsg }) => {
      // Commit the persisted conversation into the cache and drop the
      // transient bubble in the same render — no flicker, no duplicate.
      queryClient.setQueryData<Conversation[]>(["chat", "conversations"], (old) => {
        const list = old ? [...old] : [];
        const idx = list.findIndex((c) => c.id === conversation.id);
        if (idx >= 0) list[idx] = conversation;
        else list.unshift(conversation);
        return list;
      });
      setPendingUserMsg(null);
      setStreamingMsgId(assistantMsg.id);

      // End the streaming reveal after roughly the time it takes to type out.
      const wordCount = assistantMsg.content.split(" ").length;
      window.setTimeout(() => {
        setIsStreaming(false);
        setStreamingMsgId(null);
      }, wordCount * 30 + 500);
    },
    onError: () => {
      setPendingUserMsg(null);
      setIsStreaming(false);
      setStreamingMsgId(null);
      toast.error("AI failed to respond", { description: "Please try again." });
    },
  });

  const deleteConvMutation = useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      if (activeConvId === id) {
        setActiveConvId(null);
        setPendingUserMsg(null);
      }
      toast.success("Conversation deleted");
    },
  });

  const handleSend = () => {
    const q = input.trim();
    if (!q || askMutation.isPending || isStreaming) return;
    setInput("");
    askMutation.mutate(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNew = () => {
    setActiveConvId(null);
    setPendingUserMsg(null);
    setInput("");
    textareaRef.current?.focus();
  };

  const selectConv = (id: string) => {
    if (isStreaming || askMutation.isPending) return;
    setActiveConvId(id);
    setPendingUserMsg(null);
  };

  return (
    <div className="flex h-[calc(100svh-3.5rem)] min-h-0 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="hidden min-h-0 w-64 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-sidebar-foreground">Conversations</h2>
          <Button size="icon-sm" variant="ghost" onClick={startNew} title="New conversation">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
        <ScrollArea className="flex-1 px-2 py-2">
          {convsLoading ? (
            <div className="space-y-2 px-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : !conversations?.length ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              No conversations yet. Ask a question to start!
            </p>
          ) : (
            <div className="space-y-0.5">
              {conversations.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  active={activeConvId === conv.id}
                  onSelect={() => selectConv(conv.id)}
                  onDelete={() => deleteConvMutation.mutate(conv.id)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </aside>

      {/* ── Chat area ──────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Library AI Assistant</h1>
            <p className="text-xs text-muted-foreground">
              Powered by RAG · {conversations?.length ?? 0} conversation
              {(conversations?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="ml-auto">
            <Button size="sm" variant="outline" onClick={startNew}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="min-h-0 flex-1 px-4 py-6 [&>[data-slot=scroll-area-viewport]>div]:block!">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                /* Welcome / suggestions */
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-8 py-12 text-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Ask the Library AI</h2>
                    <p className="max-w-md text-muted-foreground">
                      I search through indexed library documents to answer your questions about
                      policies, procedures, and more.
                    </p>
                  </div>
                  <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                    {suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        className="rounded-xl border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-primary/5 hover:border-primary/30"
                        onClick={() => {
                          setInput(q);
                          textareaRef.current?.focus();
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isStreaming={msg.id === streamingMsgId}
                  />
                ))
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            {isStreaming && !streamingMsgId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t bg-background/80 px-4 py-4 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
              <Textarea
                ref={textareaRef}
                placeholder="Ask about policies, procedures, opening hours…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={askMutation.isPending && !isStreaming}
                rows={1}
                className="max-h-32 flex-1 resize-none border-none bg-transparent p-2 shadow-none focus-visible:ring-0"
              />
              <Button
                size="icon"
                className="shrink-0"
                onClick={handleSend}
                disabled={(askMutation.isPending && !isStreaming) || !input.trim()}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Answers are based on indexed library documents. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
