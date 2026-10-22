import React from "react";
import { useSidebarBreadcrumbs } from "@docusaurus/plugin-content-docs/client";
import { Breadcrumbs } from "@heroui/react";

/** Where the page sits in the sidebar, above its title. Hidden on top-level pages. */
export default function DocBreadcrumbs() {
  const breadcrumbs = useSidebarBreadcrumbs();

  if (!breadcrumbs || breadcrumbs.length < 2) return null;

  return (
    <Breadcrumbs className="mb-5 flex-wrap text-sm">
      {breadcrumbs.map((item, index) => {
        const last = index === breadcrumbs.length - 1;

        return (
          <Breadcrumbs.Item key={index} href={last ? undefined : item.href}>
            {item.label}
          </Breadcrumbs.Item>
        );
      })}
    </Breadcrumbs>
  );
}
