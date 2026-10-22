import type { ReactNode } from "react";
import React from "react";
import { useHistory } from "@docusaurus/router";
import { RouterProvider } from "react-aria-components";

// HeroUI links and menu items with an href navigate through Docusaurus's
// router instead of a full page load.
export default function Root({ children }: { children: ReactNode }) {
  const history = useHistory();

  return <RouterProvider navigate={(path) => history.push(path)}>{children}</RouterProvider>;
}
