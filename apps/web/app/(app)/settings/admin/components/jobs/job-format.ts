import type { useTranslations } from "next-intl";

import type {
  AdminJobAttemptDTO,
  AdminJobDetailDTO,
  AdminJobStepStatus,
} from "@norish/shared/contracts";

export function formatDuration(durationMs: number | null): string {
  if (durationMs === null || durationMs < 0) return "-";
  if (durationMs < 1_000) return `${durationMs}ms`;
  if (durationMs < 60_000) return `${(durationMs / 1_000).toFixed(1)}s`;
  if (durationMs < 3_600_000) {
    const minutes = Math.floor(durationMs / 60_000);
    const seconds = Math.round((durationMs % 60_000) / 1_000);

    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.round((durationMs % 3_600_000) / 60_000);

  return `${hours}h ${minutes}m`;
}

export function formatTimestamp(epochMs: number | null): string {
  return epochMs ? new Date(epochMs).toLocaleString() : "-";
}

/**
 * Translate a worker-reported step id. Steps may carry a suffix after ":"
 * (e.g. "creating-recipes:2/5", "running:media-cleanup"); the prefix is
 * translated and the suffix appended verbatim. Unknown ids render raw.
 */
export function formatStep(
  step: string | null,
  t: ReturnType<typeof useTranslations>
): string | null {
  if (!step) return null;

  const [id, ...rest] = step.split(":");
  const suffix = rest.length > 0 ? ` (${rest.join(":")})` : "";

  if (id && t.has(`steps.${id}`)) {
    return `${t(`steps.${id}`)}${suffix}`;
  }

  return step;
}

/**
 * One attempt's status. An attempt only carries a message once it has failed,
 * so the latest attempt of a job that is still active is running, not done.
 */
export function attemptStatus(
  attempt: AdminJobAttemptDTO,
  job: Pick<AdminJobDetailDTO, "state" | "attempts">
): Extract<AdminJobStepStatus, "done" | "failed" | "running"> {
  if (attempt.message) return "failed";

  const isLatest = attempt.attempt === job.attempts[job.attempts.length - 1]?.attempt;

  return isLatest && job.state === "active" ? "running" : "done";
}
