import type { ReactNode } from "react";
import React from "react";
import { useDocsSidebar } from "@docusaurus/plugin-content-docs/client";
import { NavbarSecondaryMenuFiller } from "@docusaurus/theme-common";
import DocsSidebar from "@site/src/components/DocsSidebar";

/** The docs frame: the navigation column on the paper ground, the page beside it. */
export default function DocRootLayout({ children }: { children: ReactNode }) {
  const sidebar = useDocsSidebar();

  return (
    <div className="mx-auto grid w-full max-w-[90rem] flex-1 gap-8 px-3 pt-6 pb-16 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:pt-8">
      {sidebar && (
        <>
          {/* The same tree, handed to the header's drawer on a phone. */}
          <NavbarSecondaryMenuFiller component={DocsSidebar} props={{ items: sidebar.items }} />
          <aside className="hidden lg:block">
            <nav
              aria-label="Docs"
              className="sticky top-28 -mx-1 max-h-[calc(100vh-8rem)] [scrollbar-width:thin] overflow-y-auto px-1 pb-8"
            >
              <DocsSidebar items={sidebar.items} />
            </nav>
          </aside>
        </>
      )}
      <main className="min-w-0">{children}</main>
    </div>
  );
}
