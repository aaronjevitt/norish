/**
 * CalDAV Sync Producer Tests
 *
 * The job id is deterministic per (calendar, item), so every later edit to a
 * planned item competes with whatever still holds that id.
 */

// @vitest-environment node

import type { Job, Queue } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CaldavSyncJobData } from "@norish/queue/contracts/job-types";

import { addCaldavSyncJob } from "../../src/caldav-sync/producer";
import { sanitizeUrlForJobId } from "../../src/helpers";

const add = vi.fn();
const getJob = vi.fn();
const remove = vi.fn();

const queue = { add, getJob } as unknown as Queue<CaldavSyncJobData>;

const SERVER_URL = "https://radicale.example/dav/";
const ITEM_ID = "item-1";
const JOB_ID = `caldav_${sanitizeUrlForJobId(SERVER_URL)}_${ITEM_ID}`;

function jobData(overrides: Partial<CaldavSyncJobData> = {}): CaldavSyncJobData {
  return {
    userId: "user-1",
    itemId: ITEM_ID,
    itemType: "recipe",
    plannedItemId: ITEM_ID,
    eventTitle: "Lasagne",
    date: "2026-08-21",
    slot: "Dinner",
    operation: "sync",
    caldavServerUrl: SERVER_URL,
    ...overrides,
  };
}

/** A job occupying the id in the given BullMQ state. */
function occupying(state: string, data: CaldavSyncJobData) {
  return { id: JOB_ID, data, getState: vi.fn().mockResolvedValue(state), remove };
}

beforeEach(() => {
  vi.clearAllMocks();
  remove.mockResolvedValue(undefined);
  add.mockImplementation((_name: string, data: CaldavSyncJobData, opts: { jobId: string }) =>
    Promise.resolve({ id: opts.jobId, data } as Job<CaldavSyncJobData>)
  );
});

describe("addCaldavSyncJob", () => {
  it("enqueues under the deterministic id when it is free", async () => {
    getJob.mockResolvedValueOnce(null);
    const data = jobData();

    getJob.mockResolvedValueOnce(occupying("waiting", data));

    const job = await addCaldavSyncJob(queue, data);

    expect(job.id).toBe(JOB_ID);
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("sync", data, { jobId: JOB_ID });
  });

  it("supersedes a queued job that has not been picked up", async () => {
    const stale = occupying("waiting", jobData({ date: "2026-08-20" }));
    const data = jobData();

    getJob.mockResolvedValueOnce(stale);
    getJob.mockResolvedValueOnce(null); // removeRetainedTerminalJob: id now free
    getJob.mockResolvedValueOnce(occupying("waiting", data));

    await addCaldavSyncJob(queue, data);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("sync", data, { jobId: JOB_ID });
  });

  // The reported bug: after an item's first sync completes, the retained job
  // keeps the id and BullMQ ignores every later add for the same item.
  it.each(["completed", "failed"])(
    "frees the id held by a retained %s job so the move reaches the server",
    async (state) => {
      const firstSync = occupying(state, jobData());
      const moved = jobData({ date: "2026-08-25" });

      getJob.mockResolvedValueOnce(firstSync); // supersede check: terminal, left alone
      getJob.mockResolvedValueOnce(firstSync); // removeRetainedTerminalJob
      getJob.mockResolvedValueOnce(occupying(state, moved));

      const job = await addCaldavSyncJob(queue, moved);

      expect(remove).toHaveBeenCalledTimes(1);
      expect(job.id).toBe(JOB_ID);
      expect(add).toHaveBeenCalledWith("sync", moved, { jobId: JOB_ID });
    }
  );

  it("queues a follow-up when a running job still holds the id", async () => {
    const running = occupying("active", jobData());
    const moved = jobData({ date: "2026-08-25" });

    getJob.mockResolvedValueOnce(running); // supersede check: active, left alone
    getJob.mockResolvedValueOnce(running); // removeRetainedTerminalJob: not terminal
    getJob.mockResolvedValueOnce(running); // add was ignored, old state still stored

    const job = await addCaldavSyncJob(queue, moved);

    expect(remove).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledTimes(2);
    expect(job.id).toMatch(new RegExp(`^${JOB_ID}_`));
    expect(add).toHaveBeenLastCalledWith("sync", moved, { jobId: job.id });
  });

  it("does not queue a follow-up when the holding job carries the same state", async () => {
    const data = jobData();
    const running = occupying("active", jobData());

    getJob.mockResolvedValueOnce(running);
    getJob.mockResolvedValueOnce(running);
    getJob.mockResolvedValueOnce(running);

    const job = await addCaldavSyncJob(queue, data);

    expect(add).toHaveBeenCalledTimes(1);
    expect(job.id).toBe(JOB_ID);
  });

  it("re-enqueues a delete that collides with the item's retained sync", async () => {
    const synced = occupying("completed", jobData());
    const deletion = jobData({ operation: "delete", eventTitle: "", date: "", slot: "" });

    getJob.mockResolvedValueOnce(synced);
    getJob.mockResolvedValueOnce(synced);
    getJob.mockResolvedValueOnce(occupying("waiting", deletion));

    await addCaldavSyncJob(queue, deletion);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("sync", deletion, { jobId: JOB_ID });
  });
});
