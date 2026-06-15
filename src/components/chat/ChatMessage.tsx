"use client";

import type { ChatMessage as ChatMessageType, ViewMode } from "@/types/claim";
import AssistantAvatar from "./AssistantAvatar";
import ClaimFormCard from "./ClaimFormCard";
import DecisionCard from "./DecisionCard";

type Props = {
  message: ChatMessageType;
  claimLoading: boolean;
  recordLoading?: boolean;
  recordError?: string | null;
  viewMode: ViewMode;
  onClaimSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onRecordClaim?: () => void | Promise<void>;
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted/50" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted/50" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted/50" />
    </div>
  );
}

export default function ChatMessage({
  message,
  claimLoading,
  recordLoading,
  recordError,
  viewMode,
  onClaimSubmit,
  onRecordClaim,
}: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end py-1">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-plum-brand px-4 py-2.5 text-[15px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-2">
      <AssistantAvatar className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-3">
        {message.kind === "typing" && <TypingIndicator />}

        {message.kind === "text" && (
          <p className="max-w-2xl text-[15px] leading-7 text-text whitespace-pre-wrap">
            {message.content}
          </p>
        )}

        {message.kind === "claim-form" && (
          <div className="max-w-2xl space-y-3">
            {message.content && (
              <p className="text-[15px] leading-7 text-text">{message.content}</p>
            )}
            <ClaimFormCard
              loading={claimLoading}
              variant={viewMode === "ops" ? "ops" : "member"}
              onSubmit={onClaimSubmit}
            />
          </div>
        )}

        {message.kind === "decision" && (
          <div className="max-w-2xl space-y-3">
            {message.content && (
              <p className="text-[15px] leading-7 text-text">{message.content}</p>
            )}
            <DecisionCard
              result={message.result}
              viewMode={viewMode}
              onRecordClaim={onRecordClaim}
              recordLoading={recordLoading}
              recordError={recordError}
            />
          </div>
        )}
      </div>
    </div>
  );
}
