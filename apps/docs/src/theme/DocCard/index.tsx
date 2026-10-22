import type {
  PropSidebarItem,
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from "@docusaurus/plugin-content-docs";
import React from "react";
import { findFirstSidebarItemLink, useDocById } from "@docusaurus/plugin-content-docs/client";
import { FolderIcon } from "@heroicons/react/24/outline";
import LinkCard from "@site/src/components/LinkCard";

/** One page or section on a category's index. */
export default function DocCard({ item }: { item: PropSidebarItem }) {
  if (item.type === "category") return <CategoryCard item={item} />;
  if (item.type === "link") return <LinkCardItem item={item} />;

  return null;
}

function LinkCardItem({ item }: { item: PropSidebarItemLink }) {
  const doc = useDocById(item.docId ?? undefined);

  return (
    <LinkCard
      description={item.description ?? doc?.description}
      href={item.href}
      title={item.label}
    />
  );
}

function CategoryCard({ item }: { item: PropSidebarItemCategory }) {
  const href = findFirstSidebarItemLink(item);

  if (!href) return null;

  return (
    <LinkCard
      description={item.description ?? `${item.items.length} pages`}
      href={href}
      icon={<FolderIcon className="text-muted size-4.5" />}
      title={item.label}
    />
  );
}
