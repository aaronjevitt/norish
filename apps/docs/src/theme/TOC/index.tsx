import type { TOCItem } from "@docusaurus/mdx-loader";
import type { TOCTreeNode } from "@docusaurus/theme-common/internal";
import React from "react";
import { useFilteredAndTreeifiedTOC, useTOCHighlight } from "@docusaurus/theme-common/internal";
import clsx from "clsx";

type TOCProps = {
  toc: readonly TOCItem[];
  minHeadingLevel?: number;
  maxHeadingLevel?: number;
  className?: string;
};

const LINK = "toc-link";
const ACTIVE = "toc-link--active";

/** "On this page", in the right margin; the heading in view is marked as you scroll. */
export default function TOC({
  toc,
  minHeadingLevel = 2,
  maxHeadingLevel = 3,
  className,
}: TOCProps) {
  const tree = useFilteredAndTreeifiedTOC({ toc, minHeadingLevel, maxHeadingLevel });

  useTOCHighlight({
    linkClassName: LINK,
    linkActiveClassName: ACTIVE,
    minHeadingLevel,
    maxHeadingLevel,
  });

  return (
    <nav aria-label="On this page" className={clsx("text-sm", className)}>
      <p className="text-foreground mb-3 font-medium">On this page</p>
      <TOCTree className="border-separator border-l" nodes={tree} />
    </nav>
  );
}

function TOCTree({ nodes, className }: { nodes: readonly TOCTreeNode[]; className?: string }) {
  if (nodes.length === 0) return null;

  return (
    <ul className={className}>
      {nodes.map((node) => (
        <li key={node.id}>
          <a
            className={clsx(
              LINK,
              "text-muted hover:text-foreground -ml-px block border-l border-transparent py-1 leading-snug transition-colors",
              "[&.toc-link--active]:border-accent [&.toc-link--active]:text-foreground",
              node.level > 2 ? "pl-7" : "pl-4"
            )}
            // Headings are trusted MDX output (inline code, emphasis).
            dangerouslySetInnerHTML={{ __html: node.value }}
            href={`#${node.id}`}
          />
          <TOCTree nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}
