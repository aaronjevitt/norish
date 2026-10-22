import type { ReactNode } from "react";
import React from "react";
import { processAdmonitionProps } from "@docusaurus/theme-common";
import { Alert } from "@heroui/react";

type AdmonitionProps = {
  type: string;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
};

const statusOf = {
  note: "default",
  info: "accent",
  tip: "success",
  warning: "warning",
  caution: "warning",
  danger: "danger",
} as const;

// The sheet is white, so each kind carries a faint wash of its colour.
const washOf = {
  default: "bg-default/50",
  accent: "bg-accent/8",
  success: "bg-success/10",
  warning: "bg-warning/12",
  danger: "bg-danger/10",
} as const;

const titleOf: Record<string, string> = {
  note: "Note",
  info: "Info",
  tip: "Tip",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
};

/** `:::note` and friends, as the app's own alerts. */
export default function Admonition(props: AdmonitionProps) {
  // Lifts a `:::note[Custom title]` title out of the children.
  const { type, title, children, className } = processAdmonitionProps(props);
  const status = statusOf[type as keyof typeof statusOf] ?? "default";

  return (
    <Alert className={`mb-5 shadow-none ${washOf[status]} ${className ?? ""}`} status={status}>
      <Alert.Indicator />
      <Alert.Content className="min-w-0">
        <Alert.Title className="mb-1">{title ?? titleOf[type] ?? type}</Alert.Title>
        {/* Alert.Description is an inline span; an admonition holds paragraphs and code. */}
        <div className="w-full text-[0.9375rem] [&_p]:mb-2 [&>:last-child]:mb-0">{children}</div>
      </Alert.Content>
    </Alert>
  );
}
