/**
 * CalDAV Sync Producer - Application Logic
 *
 * Enqueue logic for CalDAV sync jobs.
 * Accepts a queue instance - does not manage lifecycle.
 */

import { randomUUID } from "node:crypto";
import type { Job, Queue } from "bullmq";

import type { CaldavSyncJobData } from "@norish/queue/contracts/job-types";
import { createLogger } from "@norish/shared-server/logger";

import { removeRetainedTerminalJob, sanitizeUrlForJobId } from "../helpers";

const log = createLogger("queue:caldav-sync");

/**
 * Generate a unique job ID based on CalDAV server URL and item ID.
 * This prevents duplicate sync operations for the same item to the same calendar.
 */
function generateCaldavJobId(caldavServerUrl: string, itemId: string): string {
  const sanitizedUrl = sanitizeUrlForJobId(caldavServerUrl);

  return `caldav_${sanitizedUrl}_${itemId}`;
}

/**
 * Whether a job already holding the id would push the state we want anyway.
 * Two adds that describe the same event are genuinely the same work, so the
 * one already queued can stand in for ours.
 */
function carriesSameState(stored: CaldavSyncJobData, wanted: CaldavSyncJobData): boolean {
  return (
    stored.operation === wanted.operation &&
    stored.eventTitle === wanted.eventTitle &&
    stored.date === wanted.date &&
    stored.slot === wanted.slot
  );
}

/**
 * Add a CalDAV sync job to the queue.
 *
 * Jobs are keyed by (calendar, item) so a burst of edits to one planned item
 * collapses into a single sync. That id is only reusable once the previous job
 * has let go of it: BullMQ treats `add` under an occupied id as a no-op, so a
 * job kept for history - or one still running - silently swallows the newer
 * state unless we clear the id first.
 *
 * @returns The queued job, which may be a follow-up under a fresh id when the
 *   deterministic one is held by an in-flight job.
 */
export async function addCaldavSyncJob(
  queue: Queue<CaldavSyncJobData>,
  data: CaldavSyncJobData
): Promise<Job<CaldavSyncJobData>> {
  const jobId = generateCaldavJobId(data.caldavServerUrl, data.itemId);

  // A job that has not been picked up yet has read nothing, so the newer state
  // simply replaces it.
  const existingJob = await queue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();

    if (state === "waiting" || state === "delayed" || state === "prioritized") {
      await existingJob.remove();
      log.debug({ jobId, itemId: data.itemId }, "Superseded queued CalDAV sync job");
    }
  }

  // A completed or failed job is retained for history but still owns the id.
  // That is what made every move, edit and delete after an item's first sync a
  // silent no-op for the length of the retention window.
  if (await removeRetainedTerminalJob(queue, jobId)) {
    log.debug({ jobId, itemId: data.itemId }, "Freed CalDAV sync job id held by a retained job");
  }

  const job = await queue.add("sync", data, { jobId });
  const stored = await queue.getJob(jobId);

  if (!stored || carriesSameState(stored.data, data)) {
    log.info(
      { jobId: job.id, itemId: data.itemId, operation: data.operation },
      "CalDAV sync job added to queue"
    );

    return job;
  }

  // The id is still held by a running job, or a concurrent producer claimed it
  // between our checks and BullMQ's atomic add. Either way the add above was
  // ignored, so re-enqueue under an id nobody holds. This queue is processed
  // serially, so the follow-up lands after the job that won the id.
  const followUpId = `${jobId}_${randomUUID()}`;
  const followUp = await queue.add("sync", data, { jobId: followUpId });

  log.info(
    { jobId: followUpId, heldBy: jobId, itemId: data.itemId, operation: data.operation },
    "CalDAV sync job id was in flight, queued a follow-up"
  );

  return followUp;
}
