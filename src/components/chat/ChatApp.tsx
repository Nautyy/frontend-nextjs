"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Audience } from "./chatConfig";
import { AUDIENCE_CONFIG, getInitialMessages } from "./chatConfig";
import ClaimHistorySidebar from "./ClaimHistorySidebar";
import type { ChatMessage, ClaimHistorySummary, ClaimResult } from "@/types/claim";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatMessageView from "./ChatMessage";
import { getViewCapabilities } from "./viewCapabilities";
import { buildChatClaimContext, parseChatError } from "./chatContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildHistoryViewMessages(claim: ClaimResult, intro: string): ChatMessage[] {
  return [
    {
      id: uid(),
      role: "assistant",
      kind: "text",
      content: `Loaded claim #${claim.claim_id} from history. Full trace and decision are below — ask me anything about this adjudication.`,
    },
    {
      id: uid(),
      role: "assistant",
      kind: "decision",
      content: intro,
      result: claim,
    },
  ];
}

type Props = {
  audience: Audience;
};

export default function ChatApp({ audience }: Props) {
  const config = AUDIENCE_CONFIG[audience];
  const caps = getViewCapabilities(config.viewMode);

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages(audience));
  const [input, setInput] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [historyClaims, setHistoryClaims] = useState<ClaimHistorySummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(caps.showHistorySidebar);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingClaimId, setLoadingClaimId] = useState<string | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<Record<string, unknown> | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadHistory = useCallback(async () => {
    if (!caps.showHistorySidebar) return;

    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/claims/history?limit=50`);
      if (!res.ok) return;
      const data = (await res.json()) as ClaimHistorySummary[];
      setHistoryClaims(data);
    } catch {
      setHistoryClaims([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [caps.showHistorySidebar]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const replaceTyping = (replacement: ChatMessage) => {
    setMessages((prev) => {
      const withoutTyping = prev.filter((m) => m.kind !== "typing");
      return [...withoutTyping, replacement];
    });
  };

  const handleNewChat = () => {
    setMessages(getInitialMessages(audience));
    setClaimResult(null);
    setPendingSubmission(null);
    setRecordError(null);
    setActiveClaimId(null);
    setInput("");
    setError(null);
  };

  const openHistoricalClaim = async (claimId: string) => {
    if (loadingClaimId) return;

    setLoadingClaimId(claimId);
    setError(null);
    setActiveClaimId(claimId);

    try {
      const res = await fetch(`${API_URL}/claims/${encodeURIComponent(claimId)}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to load claim (${res.status})`);
      }

      const data = (await res.json()) as ClaimResult;
      setClaimResult({ ...data, recorded: true });
      setMessages(buildHistoryViewMessages({ ...data, recorded: true }, config.decisionIntro(data.decision)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not load claim";
      setError(msg);
      setActiveClaimId(null);
    } finally {
      setLoadingClaimId(null);
    }
  };

  const handleClaimSubmit = async (payload: Record<string, unknown>) => {
    setClaimLoading(true);
    setError(null);
    setRecordError(null);
    setActiveClaimId(null);
    setPendingSubmission(payload);

    const submitLabel =
      audience === "ops"
        ? `Run adjudication for ${payload.member_id} — ₹${Number(payload.claimed_amount).toLocaleString("en-IN")} (${payload.claim_category})`
        : `Check claim for ${payload.member_id} — ₹${Number(payload.claimed_amount).toLocaleString("en-IN")} (${payload.claim_category})`;

    addMessage({ id: uid(), role: "user", kind: "text", content: submitLabel });
    addMessage({ id: uid(), role: "assistant", kind: "typing", content: "" });

    const endpoint = caps.showSubmitClaimButton ? "adjudicate" : "submit";

    try {
      const res = await fetch(`${API_URL}/claims/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as ClaimResult;
      const result: ClaimResult = caps.showSubmissionAudit
        ? { ...data, submission: payload, submitted_at: new Date().toISOString(), recorded: true }
        : { ...data, submission: payload, recorded: false };

      setClaimResult(result);
      setActiveClaimId(result.claim_id);

      replaceTyping({
        id: uid(),
        role: "assistant",
        kind: "decision",
        content: config.decisionIntro(result.decision),
        result,
      });

      if (caps.showHistorySidebar) {
        loadHistory();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      setError(msg);
      setPendingSubmission(null);
      replaceTyping({
        id: uid(),
        role: "assistant",
        kind: "text",
        content: `Could not process claim: ${msg}. Check that LangGraph is running on port 2024.`,
      });
    } finally {
      setClaimLoading(false);
    }
  };

  const updateDecisionInMessages = (updated: ClaimResult) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.kind === "decision" && msg.result.claim_id === updated.claim_id
          ? { ...msg, result: updated }
          : msg
      )
    );
  };

  const handleRecordClaim = async () => {
    if (!claimResult || !pendingSubmission || recordLoading || claimResult.recorded) return;

    setRecordLoading(true);
    setRecordError(null);

    try {
      const res = await fetch(`${API_URL}/claims/record`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submission: pendingSubmission,
          claim_id: claimResult.claim_id,
          decision: claimResult.decision,
          approved_amount: claimResult.approved_amount,
          reason: claimResult.reason,
          confidence_score: claimResult.confidence_score,
          execution_trace: claimResult.execution_trace,
          rejection_reasons: claimResult.rejection_reasons,
          line_item_decisions: claimResult.line_item_decisions,
          financial_breakdown: claimResult.financial_breakdown,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as ClaimResult;
      const updated: ClaimResult = {
        ...claimResult,
        ...data,
        submission: pendingSubmission,
        recorded: true,
        submitted_at: data.submitted_at ?? new Date().toISOString(),
      };

      setClaimResult(updated);
      updateDecisionInMessages(updated);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit claim";
      setRecordError(msg);
    } finally {
      setRecordLoading(false);
    }
  };

  const handleAsk = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || chatLoading || claimLoading || !claimResult) return;

    setChatLoading(true);
    setError(null);
    addMessage({ id: uid(), role: "user", kind: "text", content: trimmed });
    addMessage({ id: uid(), role: "assistant", kind: "typing", content: "" });
    setInput("");

    const history = messages
      .filter((m) => m.kind === "text")
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_URL}/claims/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          claim_context: buildChatClaimContext(claimResult),
          history,
          audience: config.chatAudience,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }

      const data = (await res.json()) as { answer: string };
      replaceTyping({ id: uid(), role: "assistant", kind: "text", content: data.answer });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Could not get an answer";
      const msg = parseChatError(raw);
      setError(msg);
      replaceTyping({
        id: uid(),
        role: "assistant",
        kind: "text",
        content: `Sorry, I couldn't answer that: ${msg}`,
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleSuggestion = (text: string) => {
    handleAsk(text);
  };

  const suggestions = config.followUpSuggestions;
  const inputDisabled = claimLoading || chatLoading || Boolean(loadingClaimId);

  return (
    <div className="flex h-dvh flex-col bg-[#f7f7f8]">
      <ChatHeader
        config={config}
        onNewChat={handleNewChat}
        showSidebarToggle={caps.showHistorySidebar}
        onToggleSidebar={() => setSidebarOpen(true)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {caps.showHistorySidebar && (
          <ClaimHistorySidebar
            claims={historyClaims}
            activeId={activeClaimId}
            loading={historyLoading}
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNewReview={handleNewChat}
            onSelect={openHistoricalClaim}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="chat-scroll flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl space-y-1 px-4 py-6 sm:px-6">
              {loadingClaimId && (
                <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-muted">
                  Loading claim #{loadingClaimId}…
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessageView
                  key={msg.id}
                  message={msg}
                  claimLoading={claimLoading}
                  recordLoading={recordLoading}
                  recordError={recordError}
                  viewMode={config.viewMode}
                  onClaimSubmit={handleClaimSubmit}
                  onRecordClaim={caps.showSubmitClaimButton ? handleRecordClaim : undefined}
                />
              ))}

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div ref={bottomRef} className="h-4" />
            </div>
          </div>

          {claimResult && (
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => handleAsk(input)}
              disabled={inputDisabled}
              placeholder={config.placeholderAfter}
              suggestions={suggestions}
              onSuggestion={handleSuggestion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
