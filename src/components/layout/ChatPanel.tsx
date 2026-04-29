"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ChatMessage, RichCard } from "@/types/index";

// ─── Chat Composer ─────────────────────────────────────────
function ChatComposer({
  onSend,
  isLoading,
}: {
  onSend: (msg: string) => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div
      className="border-t px-4 pb-4 pt-3"
      style={{ borderColor: "var(--line)", background: "var(--paper)" }}
    >
      {/* Suggestion chips */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {["كيف حال ميزانيتي؟", "حلل إنفاقي هذا الشهر", "متى موعد الراتب؟"].map((s) => (
          <button
            key={s}
            onClick={() => onSend(s)}
            className="flex-shrink-0 rounded-xl px-3 py-2 font-heading text-[12.5px] whitespace-nowrap"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div
        className="flex items-center gap-2 rounded-2xl ps-3.5"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          padding: "6px 6px 6px 14px",
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="اسألني عن أموالك..."
          className="flex-1 border-0 bg-transparent outline-none font-body text-sm py-2"
          style={{ color: "var(--ink)" }}
          aria-label="رسالة للمساعد الذكي"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--amber)", color: "var(--ink)", border: 0 }}
          aria-label="إرسال"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l-7-7 7-7M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Rich Card Renderer ────────────────────────────────────
function RichCardRenderer({ card }: { card: RichCard }) {
  if (card.type === "chips") {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {card.chips.map((chip, i) => (
          <button
            key={i}
            className="rounded-xl px-3 py-1.5 font-heading text-[12px]"
            style={
              i === 0
                ? { background: "var(--ink)", color: "var(--paper)", border: "none" }
                : { background: "transparent", border: "1px solid var(--line-strong)", color: "var(--ink)" }
            }
          >
            {chip.label}
          </button>
        ))}
      </div>
    );
  }

  if (card.type === "tx_receipt") {
    return (
      <div
        className="mt-2 rounded-2xl p-3"
        style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="font-heading text-[13px] font-medium">{card.merchant}</span>
          <span className="font-numbers text-[18px]" style={{ color: card.amount < 0 ? "var(--rose)" : "var(--sage)" }}>
            {card.amount > 0 ? "+" : ""}{card.amount.toFixed(2)}
          </span>
        </div>
        <div className="flex gap-2">
          {card.suggestions.map((s) => (
            <button
              key={s.project_id}
              className="flex-1 rounded-xl py-2 font-heading text-[12px]"
              style={{ border: "1.5px solid var(--line-strong)", background: "var(--paper-2)", color: "var(--ink)" }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// ─── Chat Message Bubble ───────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col max-w-[88%] ${isUser ? "self-end items-end" : "self-start items-start"}`}>
      <div
        className="px-3.5 py-2.5 rounded-[18px] text-sm leading-7"
        style={
          isUser
            ? {
                background: "var(--ink)",
                color: "var(--paper)",
                borderBottomRightRadius: 6,
              }
            : {
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderBottomLeftRadius: 6,
              }
        }
      >
        {message.content}
      </div>
      {message.rich_card && <RichCardRenderer card={message.rich_card} />}
      <span className="text-[10px] opacity-45 mt-1 px-1.5 font-heading">
        {new Date(message.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

// ─── Main ChatPanel ─────────────────────────────────────────
export default function ChatPanel() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["chat-messages"],
    queryFn: async () => {
      const res = await fetch("/api/chat/messages");
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages ?? [];
    },
    staleTime: 30_000,
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      // Optimistically add user message
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: "",
        role: "user",
        content: text,
        rich_card: null,
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<ChatMessage[]>(["chat-messages"], (old = []) => [
        ...old,
        tempUserMsg,
      ]);

      setIsStreaming(true);
      setStreamingText("");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok || !response.body) {
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              fullText += parsed.content;
              setStreamingText(fullText);
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      setIsStreaming(false);
      setStreamingText("");
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    },
  });

  return (
    <aside
      className="rounded-3xl flex flex-col overflow-hidden"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line)",
        position: "sticky",
        top: "24px",
        height: "calc(100vh - 48px)",
        boxShadow: "var(--shadow)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{
          borderBottom: "1px solid var(--line)",
          background: "var(--paper)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center relative font-numbers italic text-[18px]"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          م
          <span
            className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 rounded-full"
            style={{
              background: "var(--sage)",
              border: "2px solid var(--paper)",
            }}
          />
        </div>
        <div>
          <b className="block font-heading text-[15px]">ماليّ الذكي</b>
          <small className="text-[11px] opacity-55">مساعدكِ المالي الشخصي</small>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5"
      >
        {messages.length === 0 && !isStreaming && (
          <div className="text-center opacity-50 text-sm mt-8 font-heading">
            <div className="text-3xl mb-3">💬</div>
            اسألني أي شيء عن أموالك
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <div className="self-start items-start flex flex-col max-w-[88%]">
            <div
              className="px-3.5 py-2.5 rounded-[18px] text-sm leading-7"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderBottomLeftRadius: 6,
              }}
            >
              {streamingText || (
                <span className="opacity-50">
                  يكتب
                  <span className="animate-bounce inline-block ms-1">...</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <ChatComposer
        onSend={(text) => sendMutation.mutate(text)}
        isLoading={isStreaming || sendMutation.isPending}
      />
    </aside>
  );
}
