"use client";

import SettingsSkeleton from "@/components/skeleton/settings-skeleton";
import { Skeleton } from "@heroui/react";
import { useTranslations } from "next-intl";

/**
 * The loading state for the whole settings page.
 *
 * It reproduces the real page's chrome geometry — the title, the 56px tab strip
 * and the panel's `py-4` — so the only thing that changes when the page mounts
 * is the panel filling in. A bare `SettingsSkeleton` painted the cards 136px too
 * high and then dropped them once the title and tab list arrived; that layout
 * jump is the one traced in
 * `.scratch/appearance-improvements/issues/04-settings-flicker-trace.md`.
 *
 * The tab strip is one full-width pill rather than one per tab on purpose: the
 * Admin tab is only present for admins, so a per-tab placeholder would guess the
 * count wrong for half the users and shift the strip when the real tabs arrive.
 *
 * Shared by the route's `loading.tsx` and the page's own Suspense fallback so
 * both loading states are the same shape.
 */
export default function SettingsPageSkeleton() {
  const t = useTranslations("settings");

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("page.title")}</h1>

      {/* Mirrors the Tabs root: a column with an 8px gap. */}
      <div className="flex w-full flex-col gap-2">
        {/* Mirrors Tabs.List: 56px tall, 4px of padding around 48px tabs. */}
        <div className="h-14 w-full p-1">
          <Skeleton className="h-12 w-full rounded-full" />
        </div>

        {/* Mirrors Tabs.Panel's py-4. */}
        <div className="py-4">
          <SettingsSkeleton />
        </div>
      </div>
    </div>
  );
}
