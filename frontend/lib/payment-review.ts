/**
 * Staff-facing attention cues only; never auto-reject or expire a paid claim.
 * Relative thresholds do not grant new permissions or alter booking status.
 */
export type ReviewQueueItem = {
  startsAtUtc: string; submittedAtUtc: string; bookingStatus: string;
};
export type ReviewPriority = "RECONCILE" | "STARTED" | "STARTS_SOON" | "OVERDUE" | "NORMAL";
export function reviewPriority(payment: ReviewQueueItem, nowMs: number = Date.now()): ReviewPriority {
  if (payment.bookingStatus !== "AWAITING_REVIEW") return "RECONCILE";
  const start = Date.parse(payment.startsAtUtc);
  const submitted = Date.parse(payment.submittedAtUtc);
  if (Number.isFinite(start) && start <= nowMs) return "STARTED";
  if (Number.isFinite(start) && start - nowMs <= 60 * 60 * 1000) return "STARTS_SOON";
  if (Number.isFinite(submitted) && nowMs - submitted >= 60 * 60 * 1000) return "OVERDUE";
  return "NORMAL";
}
export function reviewPriorityLabel(priority: ReviewPriority): string {
  switch (priority) {
    case "RECONCILE": return "Booking changed — reconcile transfer";
    case "STARTED": return "Game time passed — review urgently";
    case "STARTS_SOON": return "Game starts within 1 hour";
    case "OVERDUE": return "Unreviewed for over 1 hour";
    default: return "Awaiting staff review";
  }
}
