"use client";

import SettingsSwitch from "@/app/(app)/settings/components/settings-switch";
import { ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";

type ImageGenerationSweepCounts =
  { enabled: false } | { enabled: true; gapOnly: number; overwrite: number };

type BulkEnrichmentConfirmationModalProps = {
  isOpen: boolean;
  replaceExisting: boolean;
  /** Absent while loading, or on a server where the kind is switched off. */
  imageCounts?: ImageGenerationSweepCounts;
  onReplaceExistingChange: (replaceExisting: boolean) => void;
  onClose: () => void;
  onConfirm: () => void;
};
export default function BulkEnrichmentConfirmationModal({
  isOpen,
  replaceExisting,
  imageCounts,
  onReplaceExistingChange,
  onClose,
  onConfirm,
}: BulkEnrichmentConfirmationModalProps) {
  const t = useTranslations("settings.admin.aiProcessing.bulkEnrichment");
  const tActions = useTranslations("common.actions");

  return (
    <Modal.Backdrop className="z-[1099]" isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Container className="z-[1100]">
        <Modal.Dialog>
          <Modal.Header className="flex items-center gap-2">
            <ExclamationTriangleIcon className="text-warning h-5 w-5" />
            {t("confirmTitle")}
          </Modal.Header>
          <Modal.Body>
            <p>{t("confirmMessage")}</p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{t("replaceExisting")}</span>
                <span className="text-muted text-base">{t("replaceExistingDescription")}</span>
              </div>
              <SettingsSwitch
                aria-label={t("replaceExisting")}
                isSelected={replaceExisting}
                onValueChange={onReplaceExistingChange}
              />
            </div>
            {replaceExisting && (
              <div className="bg-danger/10 dark:bg-danger/10 border-danger/30 dark:border-danger/30 mt-2 rounded-lg border p-4">
                <p className="text-danger dark:text-danger text-base">{t("replaceWarning")}</p>
              </div>
            )}
            {imageCounts?.enabled && (
              <p className="text-muted mt-2 text-base">
                {t("imageCount", {
                  count: replaceExisting ? imageCounts.overwrite : imageCounts.gapOnly,
                })}
              </p>
            )}
            <div className="bg-warning/10 dark:bg-warning/10 border-warning/30 dark:border-warning/30 mt-2 rounded-lg border p-4">
              <p className="text-warning dark:text-warning text-base">{t("costWarning")}</p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>
              {tActions("cancel")}
            </Button>
            <Button variant={replaceExisting ? "danger" : "secondary"} onPress={onConfirm}>
              {replaceExisting ? t("confirmButtonReplace") : t("confirmButton")}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
