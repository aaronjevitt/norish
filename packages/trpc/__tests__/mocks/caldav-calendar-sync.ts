import { vi } from "vitest";

// Mock CalDAV bulk sync entry points
export const syncAllFutureItems = vi.fn().mockResolvedValue({
  totalSynced: 0,
  totalFailed: 0,
});

export const retryFailedSyncs = vi.fn().mockResolvedValue({
  totalRetried: 0,
  totalFailed: 0,
});

export default {
  syncAllFutureItems,
  retryFailedSyncs,
};
