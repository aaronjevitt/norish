import React from "react";

// The app's own list, so a new language shows up here on the next docs build.
import { LOCALE_CATALOG } from "../../../../packages/i18n/src/locales";

/** The flag of the country a language is most at home in (CLDR's likely region: en → US). */
function flag(code: string) {
  const region = new Intl.Locale(code).maximize().region ?? "";

  return String.fromCodePoint(...[...region].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65));
}

/** Every language Norish ships as a flag, named on hover; variants of one language (Sie and Du) count once. */
export default function Languages() {
  const byLanguage = new Map<string, { code: string; name: string }[]>();
  for (const [code, { name }] of Object.entries(LOCALE_CATALOG)) {
    const language = code.split("-")[0];
    byLanguage.set(language, [...(byLanguage.get(language) ?? []), { code, name }]);
  }
  const languages = [...byLanguage.values()].map((variants) => ({
    flag: flag(variants[0].code),
    name: variants.length > 1 ? variants[0].name.replace(/\s*\(.*\)$/, "") : variants[0].name,
  }));

  return (
    <>
      Norish is available in {languages.length} languages.
      <span className="mt-2 flex flex-wrap gap-1.5 text-lg leading-none">
        {languages.map(({ flag, name }) => (
          <span key={name} aria-label={name} role="img" title={name}>
            {flag}
          </span>
        ))}
      </span>
    </>
  );
}
