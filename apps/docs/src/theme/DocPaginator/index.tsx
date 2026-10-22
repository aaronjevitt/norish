import type { PropNavigation, PropNavigationLink } from "@docusaurus/plugin-content-docs";
import React from "react";
import Link from "@docusaurus/Link";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";

export default function DocPaginator({ previous, next }: PropNavigation) {
  if (!previous && !next) return null;

  return (
    <nav aria-label="Docs pages" className="mt-6 grid gap-3 sm:grid-cols-2">
      {previous && <PagerLink direction="previous" link={previous} />}
      {next && <PagerLink direction="next" link={next} />}
    </nav>
  );
}

function PagerLink({
  link,
  direction,
}: {
  link: PropNavigationLink;
  direction: "previous" | "next";
}) {
  const next = direction === "next";

  return (
    <Link
      className={clsx(
        "group bg-surface/60 hover:bg-surface border-border flex flex-col gap-1 rounded-3xl border px-5 py-4 transition-colors",
        next && "items-end text-right sm:col-start-2"
      )}
      to={link.permalink}
    >
      <span className="text-muted flex items-center gap-1.5 text-xs font-medium">
        {!next && <ArrowLeftIcon className="size-3.5" />}
        {next ? "Next" : "Previous"}
        {next && <ArrowRightIcon className="size-3.5" />}
      </span>
      <span className="text-foreground font-medium">{link.title}</span>
    </Link>
  );
}
