import type { ViewMode } from "@/types/claim";

/**
 * Single source of truth for what each portal shows.
 *
 * Member → outcome + plain English + what to do next
 * Ops    → outcome + full trace + policy/financial detail + audit history
 */
export type ViewCapabilities = {
  showConfidence: boolean;
  showFullTrace: boolean;
  showTraceStepDetails: boolean;
  showFinancialBreakdown: boolean;
  showLineItems: boolean;
  showMemberPayoutSummary: boolean;
  showWhatHappensNext: boolean;
  showSubmissionAudit: boolean;
  showHistorySidebar: boolean;
  showSubmitClaimButton: boolean;
  useFriendlyLabels: boolean;
  traceCollapsedByDefault: boolean;
};

export const VIEW_CAPABILITIES: Record<ViewMode, ViewCapabilities> = {
  member: {
    showConfidence: false,
    showFullTrace: false,
    showTraceStepDetails: false,
    showFinancialBreakdown: false,
    showLineItems: false,
    showMemberPayoutSummary: true,
    showWhatHappensNext: true,
    showSubmissionAudit: false,
    showHistorySidebar: false,
    showSubmitClaimButton: true,
    useFriendlyLabels: true,
    traceCollapsedByDefault: true,
  },
  ops: {
    showConfidence: true,
    showFullTrace: true,
    showTraceStepDetails: true,
    showFinancialBreakdown: true,
    showLineItems: true,
    showMemberPayoutSummary: false,
    showWhatHappensNext: false,
    showSubmissionAudit: true,
    showHistorySidebar: true,
    showSubmitClaimButton: false,
    useFriendlyLabels: false,
    traceCollapsedByDefault: false,
  },
};

export function getViewCapabilities(viewMode: ViewMode): ViewCapabilities {
  return VIEW_CAPABILITIES[viewMode];
}
