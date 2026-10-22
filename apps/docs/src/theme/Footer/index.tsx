import React from "react";
import Link from "@docusaurus/Link";

const columns = [
  {
    title: "Docs",
    items: [
      { label: "Introduction", to: "/" },
      { label: "Quick start", to: "/quick-start" },
      { label: "Authentication", to: "/configuration/authentication" },
      { label: "API reference", to: "/reference/api" },
    ],
  },
  {
    title: "Project",
    items: [
      { label: "Website", href: "https://norish.dev" },
      { label: "GitHub", href: "https://github.com/norish-recipes/Norish" },
      { label: "Docker Hub", href: "https://hub.docker.com/r/norishapp/norish" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Issues", href: "https://github.com/norish-recipes/Norish/issues" },
      { label: "Buy Me a Coffee", href: "https://buymeacoffee.com/mikevanes" },
    ],
  },
];

/** The norish.dev footer, with the docs' own links. */
export default function Footer() {
  return (
    <footer className="border-border border-t px-5 py-14 sm:px-8">
      <div className="mx-auto grid max-w-[90rem] gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto] lg:gap-20">
        <div>
          <img alt="Norish" height={26} src="/img/logo.svg" width={97} />
          <p className="text-muted mt-4 max-w-xs text-sm text-pretty">
            The open-source recipe app for families &amp; friends.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h2 className="text-sm font-medium">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.items.map((item) => (
                <li key={item.label}>
                  {"to" in item ? (
                    <Link
                      className="text-muted hover:text-foreground text-sm transition-colors"
                      to={item.to}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      className="text-muted hover:text-foreground text-sm transition-colors"
                      href={item.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-border mx-auto mt-12 flex max-w-[90rem] flex-col gap-2 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted/70 text-xs">
          © {new Date().getFullYear()} Norish is released under the AGPL-3.0 License. Docs built
          with{" "}
          <a
            className="hover:text-foreground underline-offset-2 transition-colors hover:underline"
            href="https://docusaurus.io"
            rel="noreferrer"
            target="_blank"
          >
            Docusaurus
          </a>
          .
        </p>
        <p className="text-muted/70 text-xs">Built for people who love to cook.</p>
      </div>
    </footer>
  );
}
