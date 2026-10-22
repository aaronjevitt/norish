import type { TOCItem } from "@docusaurus/mdx-loader";
import type { TOCTreeNode } from "@docusaurus/theme-common/internal";
import React from "react";
import { useFilteredAndTreeifiedTOC } from "@docusaurus/theme-common/internal";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Disclosure } from "@heroui/react";

type TOCCollapsibleProps = {
  toc: readonly TOCItem[];
  minHeadingLevel?: number;
  maxHeadingLevel?: number;
  className?: string;
};

/** The page's contents on a narrow screen, folded away above the article. */
export default function TOCCollapsible({
  toc,
  minHeadingLevel = 2,
  maxHeadingLevel = 3,
  className,
}: TOCCollapsibleProps) {
  const tree = useFilteredAndTreeifiedTOC({ toc, minHeadingLevel, maxHeadingLevel });

  return (
    <Disclosure className={`bg-background rounded-2xl px-4 py-1 ${className ?? ""}`}>
      <Disclosure.Trigger className="group flex w-full items-center justify-between py-2.5 text-sm font-medium">
        On this page
        <ChevronDownIcon className="text-muted size-4 transition-transform duration-200 group-aria-expanded:rotate-180" />
      </Disclosure.Trigger>
      <Disclosure.Content>
        <Tree nodes={tree} />
      </Disclosure.Content>
    </Disclosure>
  );
}

function Tree({ nodes }: { nodes: readonly TOCTreeNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <ul className="pb-2 text-sm">
      {nodes.map((node) => (
        <li key={node.id} className={node.level > 2 ? "pl-4" : undefined}>
          <a
            className="text-muted hover:text-foreground block py-1.5"
            dangerouslySetInnerHTML={{ __html: node.value }}
            href={`#${node.id}`}
          />
          <Tree nodes={node.children} />
        </li>
      ))}
    </ul>
  );
}
