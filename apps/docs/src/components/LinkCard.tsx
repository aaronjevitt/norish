import type { ReactNode } from "react";
import React from "react";
import Link from "@docusaurus/Link";
import { useDocById, useLayoutDoc } from "@docusaurus/plugin-content-docs/client";
import { ArrowRightIcon, ArrowUpRightIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

/** A page link drawn as a card: an optional eyebrow, the title, a line or two of description. */
export default function LinkCard({
  href,
  title,
  description,
  eyebrow,
  icon,
  className,
}: {
  href: string;
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const Arrow = /^https?:/.test(href) ? ArrowUpRightIcon : ArrowRightIcon;

  return (
    <Link
      className={clsx(
        "group border-border bg-background/50 hover:bg-background flex flex-col gap-1.5 rounded-3xl border p-5 no-underline transition-colors",
        className
      )}
      to={href}
    >
      {eyebrow && <span className="text-muted text-xs font-medium">{eyebrow}</span>}
      <span className="text-foreground flex items-center gap-2 font-medium">
        {icon}
        {title}
        <Arrow className="text-muted ml-auto size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </span>
      {description && (
        <span className="text-muted text-sm leading-relaxed font-normal">{description}</span>
      )}
    </Link>
  );
}

/** A card for another docs page, by id, so it follows the version being read. */
export function DocLinkCard({
  doc,
  eyebrow,
  className,
}: {
  doc: string;
  eyebrow?: string;
  className?: string;
}) {
  const { title, description } = useDocById(doc);
  const { path } = useLayoutDoc(doc)!;

  return (
    <LinkCard
      className={className}
      description={description}
      eyebrow={eyebrow}
      href={path}
      title={title}
    />
  );
}

export function LinkCardGrid({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}
