import React from "react";
import { useDoc } from "@docusaurus/plugin-content-docs/client";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default function DocItemFooter() {
  const { editUrl } = useDoc().metadata;

  if (!editUrl) return null;

  return (
    <footer className="border-separator mt-12 border-t pt-6">
      <a
        className="text-muted hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        href={editUrl}
        rel="noreferrer"
        target="_blank"
      >
        <PencilSquareIcon className="size-4" />
        Edit this page on GitHub
      </a>
    </footer>
  );
}
