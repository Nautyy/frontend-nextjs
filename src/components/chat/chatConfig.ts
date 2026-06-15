import type { ChatMessage, ViewMode } from "@/types/claim";

export type Audience = "member" | "ops";

export type AudienceConfig = {
  viewMode: ViewMode;
  title: string;
  subtitle: string;
  newClaimLabel: string;
  portalLink: { href: string; label: string };
  initialMessages: ChatMessage[];
  startSuggestions: string[];
  followUpSuggestions: string[];
  placeholderBefore: string;
  placeholderAfter: string;
  decisionIntro: (decision: string) => string;
  chatAudience: "member" | "ops";
};

const MEMBER_WELCOME_ID = "welcome";
const MEMBER_FORM_ID = "claim-form";
const OPS_WELCOME_ID = "ops-welcome";
const OPS_FORM_ID = "ops-form";

export const AUDIENCE_CONFIG: Record<Audience, AudienceConfig> = {
  member: {
    viewMode: "member",
    title: "Claims Assistant",
    subtitle: "Employee health benefits · plumhq.com",
    newClaimLabel: "New claim",
    portalLink: { href: "/ops", label: "Claims team →" },
    initialMessages: [
      {
        id: MEMBER_WELCOME_ID,
        role: "assistant",
        kind: "text",
        content:
          "Hi, I'm your Plum Claims Assistant.\n\nI can help you submit a health insurance claim and explain the result in plain language. Most reimbursement claims with Plum are settled within a week.",
      },
      {
        id: MEMBER_FORM_ID,
        role: "assistant",
        kind: "claim-form",
        content: "Fill in your claim details below to get an instant decision.",
      },
    ],
    startSuggestions: [
      "What documents do I need?",
      "How long does processing take?",
    ],
    followUpSuggestions: [
      "Why did I get this amount?",
      "What documents did you check?",
      "Can I appeal this?",
      "When will I get paid?",
    ],
    placeholderBefore: "Ask a question or submit your claim above…",
    placeholderAfter: "Ask me anything about your claim…",
    decisionIntro: (decision) =>
      decision === "PENDING"
        ? "We couldn't finish reviewing your claim yet. See what's missing below, then check again or submit once corrected."
        : "Here's your preliminary decision. Review the breakdown below — when you're ready, submit the claim to Plum for processing.",
    chatAudience: "member",
  },
  ops: {
    viewMode: "ops",
    title: "Claims Review Console",
    subtitle: "Internal ops · adjudication & trace",
    newClaimLabel: "New review",
    portalLink: { href: "/", label: "← Employee portal" },
    initialMessages: [
      {
        id: OPS_WELCOME_ID,
        role: "assistant",
        kind: "text",
        content:
          "Plum Claims Review Console.\n\nProcess a claim submission and inspect the full adjudication pipeline — gatekeeper, OCR, extraction, policy engine, and decision trace.\n\nUse this view to validate AI decisions before settlement.",
      },
      {
        id: OPS_FORM_ID,
        role: "assistant",
        kind: "claim-form",
        content: "Enter claim details below to run adjudication and review the full execution trace.",
      },
    ],
    startSuggestions: [
      "What triggers MANUAL_REVIEW?",
      "How does gatekeeper work?",
      "Explain degraded confidence",
    ],
    followUpSuggestions: [
      "Walk me through the execution trace",
      "Were any pipeline steps degraded?",
      "Why was this amount approved?",
      "What policy rules were applied?",
    ],
    placeholderBefore: "Ask about the adjudication pipeline…",
    placeholderAfter: "Ask about this claim's trace, policy, or decision…",
    decisionIntro: (decision) =>
      decision === "PENDING"
        ? "Early stop — gatekeeper or document validation failed. Review the trace and member-facing message below."
        : "Adjudication complete. Full trace, financial breakdown, and line items are shown below.",
    chatAudience: "ops",
  },
};

export function getInitialMessages(audience: Audience): ChatMessage[] {
  return AUDIENCE_CONFIG[audience].initialMessages;
}
