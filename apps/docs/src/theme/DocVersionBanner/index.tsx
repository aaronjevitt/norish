import React from "react";
import Link from "@docusaurus/Link";
import {
  useDocsPreferredVersion,
  useDocsVersion,
  useDocVersionSuggestions,
} from "@docusaurus/plugin-content-docs/client";
import { Alert } from "@heroui/react";

/** Shown on a frozen version's pages, pointing at the same page in the current one. */
export default function DocVersionBanner() {
  const version = useDocsVersion();
  const { latestDocSuggestion, latestVersionSuggestion } = useDocVersionSuggestions(
    version.pluginId
  );
  const { savePreferredVersionName } = useDocsPreferredVersion(version.pluginId);

  if (!version.banner) return null;

  const target =
    latestDocSuggestion ??
    latestVersionSuggestion.docs.find((doc) => doc.id === latestVersionSuggestion.mainDocId);

  return (
    <Alert className="mb-4" status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>
          {version.banner === "unreleased"
            ? `These are the docs for ${version.label}, which is not released yet.`
            : `These are the docs for ${version.label}, an older release.`}
        </Alert.Title>
        <Alert.Description>
          See{" "}
          <Link
            className="font-medium underline underline-offset-2"
            to={target?.path ?? "/"}
            onClick={() => savePreferredVersionName(latestVersionSuggestion.name)}
          >
            the current docs ({latestVersionSuggestion.label})
          </Link>{" "}
          for what Norish does today.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
