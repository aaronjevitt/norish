import type { ReactNode } from "react";
import React from "react";
import clsx from "clsx";

export function FeatureGrid({ children }: { children: ReactNode }) {
  return <div className="my-6 grid gap-3 sm:grid-cols-2">{children}</div>;
}

/** One feature: an icon, a title and a sentence or two. */
export function Feature({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("bg-background/50 flex gap-4 rounded-3xl p-5", className)}>
      <span className="bg-accent-soft text-accent grid size-10 flex-none place-items-center rounded-full [&_svg]:size-5">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-foreground font-medium">{title}</div>
        {/* MDX wraps the text in a paragraph; the prose margins don't belong in a tile. */}
        <div className="text-muted mt-1 text-sm leading-relaxed [&_p]:m-0">{children}</div>
      </div>
    </div>
  );
}
