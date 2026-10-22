import type { PrismTheme, Token } from "prism-react-renderer";
import type { ReactNode } from "react";
import React, { isValidElement, useEffect, useRef, useState } from "react";
import { useThemeConfig } from "@docusaurus/theme-common";
import { createCodeBlockMetadata } from "@docusaurus/theme-common/internal";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import clsx from "clsx";
import { Highlight } from "prism-react-renderer";

// Token colours are CSS variables (custom.css), so one theme serves light and
// dark and the server render never disagrees with the browser.
const theme: PrismTheme = {
  plain: { color: "var(--code-plain)", backgroundColor: "transparent" },
  styles: [
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "var(--code-comment)", fontStyle: "italic" },
    },
    { types: ["punctuation", "operator"], style: { color: "var(--code-punctuation)" } },
    {
      types: ["property", "tag", "atrule", "attr-name", "key", "selector"],
      style: { color: "var(--code-key)" },
    },
    {
      types: ["string", "char", "attr-value", "inserted", "url"],
      style: { color: "var(--code-string)" },
    },
    {
      types: ["number", "boolean", "constant", "symbol", "null"],
      style: { color: "var(--code-number)" },
    },
    {
      types: ["keyword", "important", "deleted", "regex"],
      style: { color: "var(--code-keyword)" },
    },
    {
      types: ["function", "builtin", "class-name", "variable"],
      style: { color: "var(--code-function)" },
    },
  ],
};

const frame = "border-border bg-background mb-5 overflow-hidden rounded-2xl border";
const pre =
  "overflow-x-auto p-4 font-mono text-[0.8125rem] leading-relaxed [font-variant-ligatures:none]";

type CodeBlockProps = {
  children?: ReactNode;
  className?: string;
  metastring?: string;
  title?: ReactNode;
  language?: string;
  showLineNumbers?: boolean | number;
};

/** A fenced code block: highlighted, with its file name when it has one, and a copy button. */
export default function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  const { prism } = useThemeConfig();

  // A fence holding JSX (rare) can't be highlighted or copied; show it as written.
  if (React.Children.toArray(children).some(isValidElement)) {
    return (
      <pre className={clsx(frame, pre, className)}>
        <code>{children}</code>
      </pre>
    );
  }

  const metadata = createCodeBlockMetadata({
    code: React.Children.toArray(children).join(""),
    className,
    metastring: props.metastring,
    language: props.language,
    title: props.title,
    showLineNumbers: props.showLineNumbers,
    magicComments: prism.magicComments,
    defaultLanguage: prism.defaultLanguage,
  });

  return (
    <div className={clsx(frame, metadata.className)}>
      {metadata.title && (
        <div className="border-border flex items-center justify-between gap-3 border-b py-1 pr-1.5 pl-4">
          <span className="text-muted truncate font-mono text-xs">{metadata.title}</span>
          <CopyButton code={metadata.code} />
        </div>
      )}
      <div className="relative">
        <Highlight code={metadata.code} language={metadata.language} theme={theme}>
          {({ className: prismClass, style, tokens, getLineProps, getTokenProps }) => (
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scrollable region
            <pre
              className={clsx(prismClass, pre, !metadata.title && "pr-12")}
              style={style}
              tabIndex={0}
            >
              <code>
                {tokens.map((line, index) => (
                  <div
                    key={index}
                    {...getLineProps({
                      line,
                      className: clsx(metadata.lineClassNames[index]),
                    })}
                  >
                    {withoutLoneBreak(line).map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                    <br />
                  </div>
                ))}
              </code>
            </pre>
          )}
        </Highlight>
        {!metadata.title && (
          <CopyButton iconOnly className="absolute top-2 right-2" code={metadata.code} />
        )}
      </div>
    </div>
  );
}

// An empty line arrives as a single "\n" token; with the <br> after every line it
// would count twice.
function withoutLoneBreak(line: Token[]): Token[] {
  return line.length === 1 && line[0].content === "\n" ? [{ ...line[0], content: "" }] : line;
}

function CopyButton({
  code,
  className,
  iconOnly,
}: {
  code: string;
  className?: string;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      aria-label={copied ? "Copied" : "Copy code"}
      className={clsx(
        "text-muted h-7 gap-1.5 text-xs",
        iconOnly ? "w-7 min-w-7 px-0" : "px-2.5",
        className
      )}
      isIconOnly={iconOnly}
      size="sm"
      variant="ghost"
      onPress={() => {
        void navigator.clipboard.writeText(code).then(() => {
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? (
        <CheckIcon className="text-accent size-3.5" />
      ) : (
        <ClipboardIcon className="size-3.5" />
      )}
      {!iconOnly && (copied ? "Copied" : "Copy")}
    </Button>
  );
}
