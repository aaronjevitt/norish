import type { PropSidebarItem } from "@docusaurus/plugin-content-docs";
import React from "react";
import {
  filterDocCardListItems,
  useCurrentSidebarSiblings,
} from "@docusaurus/plugin-content-docs/client";
import DocCard from "@theme/DocCard";
import clsx from "clsx";

export default function DocCardList({
  items,
  className,
}: {
  items?: PropSidebarItem[];
  className?: string;
}) {
  return items ? (
    <CardGrid className={className} items={items} />
  ) : (
    <CurrentCategoryCards className={className} />
  );
}

function CurrentCategoryCards({ className }: { className?: string }) {
  return <CardGrid className={className} items={useCurrentSidebarSiblings()} />;
}

function CardGrid({ items, className }: { items: PropSidebarItem[]; className?: string }) {
  return (
    <section className={clsx("grid gap-3 sm:grid-cols-2", className)}>
      {filterDocCardListItems(items).map((item, index) => (
        <DocCard key={index} item={item} />
      ))}
    </section>
  );
}
