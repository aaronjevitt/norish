import type { ReactNode } from "react";
import React from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { Card } from "@heroui/react";
import DocBreadcrumbs from "@theme/DocBreadcrumbs";
import DocItemContent from "@theme/DocItem/Content";
import DocItemFooter from "@theme/DocItem/Footer";
import DocItemPaginator from "@theme/DocItem/Paginator";
import DocVersionBanner from "@theme/DocVersionBanner";
import TOC from "@theme/TOC";
import TOCCollapsible from "@theme/TOCCollapsible";
import clsx from "clsx";

/**
 * A doc page: the article on a white sheet over the paper ground, as cards sit
 * in the app, with its contents in the margin on a wide screen.
 */
export default function DocItemLayout({ children }: { children: ReactNode }) {
  const { frontMatter, toc } = useDoc();
  const tocProps = {
    toc,
    minHeadingLevel: frontMatter.toc_min_heading_level,
    maxHeadingLevel: frontMatter.toc_max_heading_level,
  };
  const showToc = !frontMatter.hide_table_of_contents && toc.length > 0;

  return (
    <div className={clsx("grid gap-10", showToc && "xl:grid-cols-[minmax(0,1fr)_13rem]")}>
      <div className="min-w-0">
        <DocVersionBanner />
        <Card className="gap-0 px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
          <article>
            <DocBreadcrumbs />
            {showToc && <TOCCollapsible {...tocProps} className="mb-8 xl:hidden" />}
            <DocItemContent>{children}</DocItemContent>
            <DocItemFooter />
          </article>
        </Card>
        <DocItemPaginator />
      </div>
      {showToc && (
        <div className="hidden xl:block">
          <TOC {...tocProps} className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto" />
        </div>
      )}
    </div>
  );
}
