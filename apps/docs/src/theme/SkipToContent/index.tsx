import React from "react";
import { SkipToContentLink } from "@docusaurus/theme-common";

export default function SkipToContent() {
  return (
    <SkipToContentLink className="bg-surface fixed top-4 left-full z-[60] rounded-full px-4 py-2 text-sm font-medium shadow-lg focus:left-4" />
  );
}
