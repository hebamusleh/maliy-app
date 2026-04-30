"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { ChatMessage, RichCard, TxReceiptCard, InsightCard } from "@/types/index";

// ─── Suggestion pills ───────────────────────────────────────
const SUGGESTION_PILLS = [
  { label: "تقرير أسبوعي", prompt: "أعطني تقريراً مفصلاً عن مصاريفي خلال الأسبوع الماضي مع تصنيف حسب الفئة والمشروع" },
  { label: "ربط بطاقة", prompt: "أريد ربط بطاقة بنكية بأحد مشاريعي، كيف أفعل ذلك؟" },
  { label: "تحديد هدف ادخار", prompt: "ساعدني في تحديد هدف ادخار شهري مناسب بناءً على دخلي ومصاريفي الحالية" },
  { label: "جدولة فاتورة", prompt: "أريد جدولة دفع فاتورة متكررة أو تذكيراً بموعد دفع ثابت" },
];

// ─── Chat Composer ─────────────────────────────────────────
function ChatComposer({
  onSend,
  isLoading,
}: {
  onSend: (msg: string) => void;
  isLoading: boolean;
}) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setIsVoiceSupported(true);

    const recognition = new SR();
    recognition.lang = "ar-SA";
    recognition.interimResults = true;
    recognition.continuous = false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setValue(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setIsRecording(false);
        onSend(transcript);
        setValue("");
      }
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
  }, [onSend]);

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
      }
    }
  }

  return (
    <div
      className="border-t px-4 pb-4 pt-3"
      style={{ borderColor: "var(--line)", background: "var(--paper)" }}
    >
      {/* Suggestion pills */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {SUGGESTION_PILLS.map((pill) => (
          <button
            key={pill.label}
            onClick={() => onSend(pill.prompt)}
            disabled={isLoading}
            className="flex-shrink-0 rounded-xl px-3 py-2 font-heading text-[12.5px] whitespace-nowrap disabled:opacity-40"
            style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              color: "var(--ink)",
            }}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div
        className="flex items-center gap-2 rounded-2xl"
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

        {/* Mic button */}
        {isVoiceSupported && (
          <button
            onClick={toggleRecording}
            disabled={isLoading}
            className="w-10 h-10 rounded-xl flex items-center justify-center relative flex-shrink-0 disabled:opacity-40"
            style={{
              background: isRecording ? "var(--rose)" : "var(--paper-3, var(--paper))",
              border: isRecording ? "none" : "1px solid var(--line)",
              color: isRecording ? "white" : "var(--ink)",
            }}
            aria-label={isRecording ? "إيقاف التسجيل" : "إدخال صوتي"}
          >
            {isRecording && (
              <span
                className="absolute inset-0 rounded-xl animate-ping opacity-30"
                style={{ background: "var(--rose)" }}
              />
            )}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="9" y="2" width="6" height="11" rx="3" />
              <path strokeLinecap="round" d="M5 10a7 7 0 0014 0" />
              <line x1="12" y1="17" x2="12" y2="21" />
              <line x1="9" y1="21" x2="15" y2="21" />
            </svg>
          </button>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isLoading || !value.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
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

// ─── Tx Receipt Card ────────────────────────────────────────
function TxReceiptCardView({
  card,
  messageId,
  onCardUpdate,
  onSend,
}: {
  card: TxReceiptCard;
  messageId: string;
  onCardUpdate: (id: string, card: RichCard) => void;
  onSend: (msg: string) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editMerchant, setEditMerchant] = useState(card.merchant);
  const [editAmount, setEditAmount] = useState(card.amount);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const confirmMutation = useMutation({
    mutationFn: async (opts: { merchant?: string; amount?: number; project_id?: string }) => {
      const res = await fetch(`/api/chat/messages/${messageId}/card`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed", ...opts }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "فشل تأكيد المعاملة");
      }
      return res.json();
    },
    onSuccess: (data) => {
      onCardUpdate(messageId, data.message.rich_card);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("تم حفظ المعاملة");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/chat/messages/${messageId}/card`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "deleted" }),
      });
      if (!res.ok) throw new Error("فشل الإلغاء");
      return res.json();
    },
    onSuccess: (data) => onCardUpdate(messageId, data.message.rich_card),
    onError: () => toast.error("فشل الإلغاء"),
  });

  const isPending = card.status === "pending";
  const isBusy = confirmMutation.isPending || deleteMutation.isPending;

  if (card.status === "deleted") {
    return (
      <div
        className="mt-2 rounded-2xl px-3 py-2 text-[12px] font-heading"
        style={{ background: "var(--paper-2)", color: "var(--ink)", opacity: 0.45 }}
      >
        تم الإلغاء
      </div>
    );
  }

  return (
    <div
      className="mt-2 rounded-2xl p-3 flex flex-col gap-2"
      style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
    >
      {/* Header: merchant + amount */}
      {editing ? (
        <div className="flex gap-2">
          <input
            value={editMerchant}
            onChange={(e) => setEditMerchant(e.target.value)}
            className="flex-1 border rounded-lg px-2 py-1 text-[13px] bg-transparent outline-none"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
            placeholder="اسم المحل"
          />
          <input
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)}
            className="w-24 border rounded-lg px-2 py-1 text-[13px] bg-transparent outline-none font-numbers"
            style={{ borderColor: "var(--line)", color: "var(--ink)" }}
          />
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <span className="font-heading text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            {card.merchant}
          </span>
          <span
            className="font-numbers text-[18px]"
            style={{ color: card.amount < 0 ? "var(--rose)" : "var(--sage)" }}
          >
            {card.amount > 0 ? "+" : ""}
            {card.amount.toFixed(2)}
          </span>
        </div>
      )}

      {/* Category + confidence */}
      {!editing && (
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full font-heading"
            style={{ background: "var(--paper-2)", color: "var(--ink)", opacity: 0.7 }}
          >
            {card.category}
          </span>
          <span className="text-[11px] font-numbers" style={{ color: "var(--ink)", opacity: 0.45 }}>
            {card.confidence}%
          </span>
        </div>
      )}

      {/* Confirmed state */}
      {card.status === "confirmed" && (
        <div className="flex items-center gap-1 text-[12px] font-heading" style={{ color: "var(--sage)" }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          تم الحفظ
        </div>
      )}

      {/* Project suggestions (pending only) */}
      {isPending && card.suggestions.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {card.suggestions.map((s) => (
            <button
              key={s.project_id}
              onClick={() =>
                setSelectedProjectId(selectedProjectId === s.project_id ? null : s.project_id)
              }
              className="rounded-xl px-2.5 py-1.5 text-[11px] font-heading transition-colors"
              style={{
                border:
                  selectedProjectId === s.project_id
                    ? "1.5px solid var(--amber)"
                    : "1.5px solid var(--line)",
                background:
                  selectedProjectId === s.project_id
                    ? "color-mix(in srgb, var(--amber) 12%, transparent)"
                    : "var(--paper-2)",
                color: "var(--ink)",
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Action chips (pending only) */}
      {isPending && (
        <div className="flex gap-2 mt-1">
          {editing ? (
            <>
              <button
                onClick={() => {
                  confirmMutation.mutate({
                    merchant: editMerchant,
                    amount: editAmount,
                    project_id: selectedProjectId ?? undefined,
                  });
                  setEditing(false);
                }}
                disabled={isBusy}
                className="flex-1 rounded-xl py-1.5 text-[12px] font-heading disabled:opacity-50"
                style={{ background: "var(--sage)", color: "white", border: "none" }}
              >
                حفظ
              </button>
              <button
                onClick={() => setEditing(false)}
                disabled={isBusy}
                className="rounded-xl px-3 py-1.5 text-[12px] font-heading"
                style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
              >
                إلغاء
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  confirmMutation.mutate({ project_id: selectedProjectId ?? undefined })
                }
                disabled={isBusy}
                className="flex-1 rounded-xl py-1.5 text-[12px] font-heading disabled:opacity-50"
                style={{ background: "var(--sage)", color: "white", border: "none" }}
              >
                {confirmMutation.isPending ? "جاري الحفظ..." : "تأكيد ✓"}
              </button>
              <button
                onClick={() => setEditing(true)}
                disabled={isBusy}
                className="rounded-xl px-3 py-1.5 text-[12px] font-heading"
                style={{ background: "var(--paper-2)", border: "1px solid var(--line)", color: "var(--ink)" }}
              >
                تعديل ✏
              </button>
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={isBusy}
                className="rounded-xl px-3 py-1.5 text-[12px] font-heading disabled:opacity-50"
                style={{ background: "var(--paper-2)", border: "1px solid var(--rose)", color: "var(--rose)" }}
              >
                {deleteMutation.isPending ? "..." : "حذف ✗"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Insight Card ───────────────────────────────────────────
function InsightCardView({
  card,
  onSend,
}: {
  card: InsightCard;
  onSend: (msg: string) => void;
}) {
  return (
    <div
      className="mt-2 rounded-2xl p-3 flex flex-col gap-2"
      style={{
        background: "color-mix(in srgb, var(--amber) 8%, var(--paper))",
        border: "1px solid color-mix(in srgb, var(--amber) 30%, transparent)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-heading" style={{ color: "var(--amber)" }}>
        <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 14H11v-2h2v2zm0-4H11V7h2v5z" />
        </svg>
        رؤية ذكية
      </div>
      {card.action_label && (
        <button
          onClick={() => onSend(card.action_label)}
          className="self-start rounded-xl px-3 py-1.5 text-[12px] font-heading"
          style={{ background: "var(--amber)", color: "var(--paper)", border: "none" }}
        >
          {card.action_label}
        </button>
      )}
    </div>
  );
}

// ─── Rich Card Renderer ─────────────────────────────────────
function RichCardRenderer({
  card,
  messageId,
  onCardUpdate,
  onSend,
}: {
  card: RichCard;
  messageId: string;
  onCardUpdate: (id: string, card: RichCard) => void;
  onSend: (msg: string) => void;
}) {
  if (card.type === "tx_receipt") {
    return (
      <TxReceiptCardView
        card={card}
        messageId={messageId}
        onCardUpdate={onCardUpdate}
        onSend={onSend}
      />
    );
  }

  if (card.type === "insight") {
    return <InsightCardView card={card} onSend={onSend} />;
  }

  if (card.type === "chips") {
    return (
      <div className="flex gap-2 flex-wrap mt-2">
        {card.chips.map((chip, i) => (
          <button
            key={i}
            onClick={() => onSend(chip.action)}
            className="rounded-xl px-3 py-1.5 font-heading text-[12px]"
            style={
              i === 0
                ? { background: "var(--ink)", color: "var(--paper)", border: "none" }
                : { background: "transparent", border: "1px solid var(--line)", color: "var(--ink)" }
            }
          >
            {chip.label}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Chat Message Bubble ───────────────────────────────────
function MessageBubble({
  message,
  onCardUpdate,
  onSend,
}: {
  message: ChatMessage;
  onCardUpdate: (id: string, card: RichCard) => void;
  onSend: (msg: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`flex flex-col max-w-[88%] ${isUser ? "self-end items-end" : "self-start items-start"}`}>
      <div
        className="px-3.5 py-2.5 rounded-[18px] text-sm leading-7"
        style={
          isUser
            ? { background: "var(--ink)", color: "var(--paper)", borderBottomRightRadius: 6 }
            : { background: "var(--paper)", border: "1px solid var(--line)", borderBottomLeftRadius: 6 }
        }
      >
        {message.content}
      </div>
      {message.rich_card && (
        <RichCardRenderer
          card={message.rich_card}
          messageId={message.id}
          onCardUpdate={onCardUpdate}
          onSend={onSend}
        />
      )}
      <span className="text-[10px] opacity-45 mt-1 px-1.5 font-heading">
        {new Date(message.created_at).toLocaleTimeString("ar-SA", {
          hour: "2-digit",
          minute: "2-digit",
        })}
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
  // Local overlay for instant card status updates
  const [cardOverrides, setCardOverrides] = useState<Map<string, RichCard>>(new Map());

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

  // Proactive insights — called once on mount
  const { data: insightData } = useQuery({
    queryKey: ["chat-insights"],
    queryFn: async () => {
      const res = await fetch("/api/chat/insights");
      if (!res.ok) return { insights_sent: 0 };
      return res.json();
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (insightData && insightData.insights_sent > 0) {
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
    }
  }, [insightData, queryClient]);

  // Merge server messages with local card overrides
  const displayMessages = messages.map((msg) => {
    const override = cardOverrides.get(msg.id);
    if (override) return { ...msg, rich_card: override };
    return msg;
  });

  const handleCardUpdate = useCallback((messageId: string, updatedCard: RichCard) => {
    setCardOverrides((prev) => new Map(prev).set(messageId, updatedCard));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, streamingText]);

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
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

  const handleSend = useCallback(
    (text: string) => sendMutation.mutate(text),
    [sendMutation]
  );

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
        style={{ borderBottom: "1px solid var(--line)", background: "var(--paper)" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center relative font-numbers italic text-[18px]"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          م
          <span
            className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--sage)", border: "2px solid var(--paper)" }}
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
        {displayMessages.length === 0 && !isStreaming && (
          <div className="text-center opacity-50 text-sm mt-8 font-heading">
            <div className="text-3xl mb-3">💬</div>
            اسألني أي شيء عن أموالك
          </div>
        )}

        {displayMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onCardUpdate={handleCardUpdate}
            onSend={handleSend}
          />
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
        onSend={handleSend}
        isLoading={isStreaming || sendMutation.isPending}
      />
    </aside>
  );
}
