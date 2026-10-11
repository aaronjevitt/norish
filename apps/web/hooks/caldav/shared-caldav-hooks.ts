"use client";

import { useTRPC } from "@/app/providers/trpc-provider";
import { toast } from "@heroui/react";

import { createCaldavHooks } from "@norish/shared-react/hooks";

export const sharedCaldavHooks = createCaldavHooks({
  useTRPC,
  useToastAdapter: () => ({
    showSyncCompleteToast: (totalQueued: number, totalFailed: number) => {
      toast("CalDAV Sync Started", {
        description: `Syncing ${totalQueued} items${totalFailed > 0 ? `, ${totalFailed} could not be queued` : ""}`,
        variant: totalFailed > 0 ? "warning" : "success",
      });
    },
  }),
});
