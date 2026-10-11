"use client";

import { useState } from "react";
import { SettingRow } from "@/app/(app)/settings/components/setting-row";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Card, ListBox, Select } from "@heroui/react";
import { useTranslations } from "next-intl";

import type { PermissionLevel } from "@norish/config/zod/server-config";

import { useAdminSettingsContext } from "../context";

type PolicyAction = "view" | "edit" | "delete";

export default function PermissionPolicyCard() {
  const t = useTranslations("settings.admin.permissions");
  const { recipePermissionPolicy, updateRecipePermissionPolicy } = useAdminSettingsContext();
  const [saving, setSaving] = useState<PolicyAction | null>(null);

  const POLICY_OPTIONS: { value: PermissionLevel; labelKey: string; descriptionKey: string }[] = [
    {
      value: "everyone",
      labelKey: "levels.everyone",
      descriptionKey: "levels.everyoneDescription",
    },
    {
      value: "household",
      labelKey: "levels.household",
      descriptionKey: "levels.householdDescription",
    },
    {
      value: "owner",
      labelKey: "levels.owner",
      descriptionKey: "levels.ownerDescription",
    },
  ];

  const handleChange = async (action: PolicyAction, value: PermissionLevel) => {
    if (!recipePermissionPolicy) return;

    setSaving(action);
    try {
      await updateRecipePermissionPolicy({
        ...recipePermissionPolicy,
        [action]: value,
      });
    } finally {
      setSaving(null);
    }
  };

  const renderPolicySelect = (action: PolicyAction, ariaLabel: string) => (
    <Select
      aria-label={ariaLabel}
      className="w-full sm:w-48"
      isDisabled={saving !== null}
      placeholder={ariaLabel}
      selectedKey={recipePermissionPolicy?.[action] ?? null}
      size="sm"
      variant="secondary"
      onSelectionChange={(key) => {
        if (typeof key === "string") {
          void handleChange(action, key as PermissionLevel);
        }
      }}
    >
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover placement="bottom end">
        <ListBox>
          {POLICY_OPTIONS.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={t(option.labelKey)}>
              <div className="flex flex-col">
                <span>{t(option.labelKey)}</span>
                <span className="text-muted text-xs">{t(option.descriptionKey)}</span>
              </div>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );

  return (
    <Card>
      <Card.Header>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ShieldCheckIcon className="h-5 w-5" />
          {t("title")}
        </h2>
      </Card.Header>
      <Card.Content className="gap-6">
        <p className="text-muted text-base">{t("description")}</p>

        <div className="flex flex-col gap-4">
          <SettingRow description={t("viewDescription")} title={t("viewRecipes")}>
            {renderPolicySelect("view", t("viewRecipes"))}
          </SettingRow>

          <SettingRow description={t("editDescription")} title={t("editRecipes")}>
            {renderPolicySelect("edit", t("editRecipes"))}
          </SettingRow>

          <SettingRow description={t("deleteDescription")} title={t("deleteRecipes")}>
            {renderPolicySelect("delete", t("deleteRecipes"))}
          </SettingRow>
        </div>

        {/* The note names itself; a hard-coded "Note:" in front of it read as
            "Note: Note:" and was the one English word on a translated card. */}
        <div className="bg-surface-secondary text-muted mt-2 rounded-lg p-3 text-base">
          {t("note")}
        </div>
      </Card.Content>
    </Card>
  );
}
