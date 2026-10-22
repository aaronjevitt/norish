import type { ComponentProps } from "react";
import React from "react";
import useBrokenLinks from "@docusaurus/useBrokenLinks";
import clsx from "clsx";

type HeadingProps = ComponentProps<"h1"> & { as: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" };

/** A heading with a quiet # anchor; the anchor is registered for the broken-anchor check. */
export default function Heading({ as: As, id, children, className, ...props }: HeadingProps) {
  const brokenLinks = useBrokenLinks();

  if (As === "h1" || !id) {
    return (
      <As {...props} className={className}>
        {children}
      </As>
    );
  }

  brokenLinks.collectAnchor(id);

  return (
    // `anchor` is how Docusaurus finds the headings the table of contents follows.
    <As {...props} className={clsx("anchor", className)} id={id}>
      {children}
      <a aria-label="Link to this section" className="hash-link" href={`#${id}`} />
    </As>
  );
}
