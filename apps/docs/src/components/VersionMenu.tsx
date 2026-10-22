import React from "react";
import {
  useActiveDocContext,
  useDocsPreferredVersion,
  useDocsVersionCandidates,
  useVersions,
} from "@docusaurus/plugin-content-docs/client";
import { useHistory, useLocation } from "@docusaurus/router";
import { ChevronUpDownIcon } from "@heroicons/react/16/solid";
import { Button, Chip, Dropdown, Label } from "@heroui/react";

/**
 * The docs version picker. Switching keeps the reader on the same page in the
 * other version when it exists there, and on that version's intro otherwise.
 */
export default function VersionMenu({ className }: { className?: string }) {
  const versions = useVersions(undefined);
  const activeDocContext = useActiveDocContext(undefined);
  const [displayed] = useDocsVersionCandidates(undefined);
  const { savePreferredVersionName } = useDocsPreferredVersion(undefined);
  const history = useHistory();
  const { search, hash } = useLocation();

  const shown = displayed ?? versions[0];
  const latest = versions[0];

  const pathIn = (name: string) => {
    const version = versions.find((candidate) => candidate.name === name);
    const target =
      activeDocContext.alternateDocVersions[name] ??
      version?.docs.find((doc) => doc.id === version.mainDocId);

    return target?.path ?? "/";
  };

  return (
    <Dropdown>
      <Button
        aria-label={`Docs version ${shown.label}`}
        className={className}
        size="sm"
        variant="tertiary"
      >
        {shown.label}
        <ChevronUpDownIcon className="text-muted size-4" />
      </Button>
      <Dropdown.Popover className="min-w-56" placement="bottom end">
        <Dropdown.Menu
          aria-label="Docs versions"
          className="max-h-[min(24rem,70vh)] overflow-y-auto"
          selectedKeys={new Set([shown.name])}
          selectionMode="single"
          onAction={(key) => {
            const name = String(key);

            savePreferredVersionName(name);
            history.push(`${pathIn(name)}${search}${hash}`);
          }}
        >
          {versions.map((version) => (
            <Dropdown.Item key={version.name} id={version.name} textValue={version.label}>
              <Label>{version.label}</Label>
              {version === latest && (
                <Chip className="ml-auto" color="accent" size="sm" variant="soft">
                  Latest
                </Chip>
              )}
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
