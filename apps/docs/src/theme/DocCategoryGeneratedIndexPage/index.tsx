import type { PropCategoryGeneratedIndex } from "@docusaurus/plugin-content-docs";
import React from "react";
import { useCurrentSidebarCategory } from "@docusaurus/plugin-content-docs/client";
import { PageMetadata } from "@docusaurus/theme-common";
import { Card } from "@heroui/react";
import DocBreadcrumbs from "@theme/DocBreadcrumbs";
import DocCardList from "@theme/DocCardList";
import DocPaginator from "@theme/DocPaginator";
import DocVersionBanner from "@theme/DocVersionBanner";

/** A section's landing page: its description and a card per page. */
export default function DocCategoryGeneratedIndexPage({
  categoryGeneratedIndex: index,
}: {
  categoryGeneratedIndex: PropCategoryGeneratedIndex;
}) {
  const category = useCurrentSidebarCategory();

  return (
    <>
      <PageMetadata description={index.description} keywords={index.keywords} title={index.title} />
      <DocVersionBanner />
      <Card className="gap-0 px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
        <DocBreadcrumbs />
        <header className="markdown">
          <h1>{index.title}</h1>
          {index.description && <p className="text-muted text-lg">{index.description}</p>}
        </header>
        <DocCardList className="mt-4" items={category.items} />
      </Card>
      <DocPaginator next={index.navigation.next} previous={index.navigation.previous} />
    </>
  );
}
