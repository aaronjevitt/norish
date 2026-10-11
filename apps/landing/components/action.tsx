import type { AnchorHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";

type ActionProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Compact height for tight spots such as the site header. */
  small?: boolean;
  external?: boolean;
  className?: string;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">;

const base =
  "group inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary: "border-border bg-surface text-foreground hover:bg-default border",
};

/**
 * A link that carries an action. Both variants are filled pills so they read
 * as buttons against the page; colour and weight do the work. Nothing lifts,
 * scales or glows on hover.
 */
export function Action({
  href,
  children,
  variant = "primary",
  small,
  external,
  className,
  ...rest
}: ActionProps) {
  const externalProps = external ? { target: "_blank", rel: "noreferrer" } : {};

  return (
    <a
      className={`${base} ${variants[variant]} ${small ? "h-9 px-5" : "h-11 px-6"} ${className ?? ""}`}
      href={href}
      {...externalProps}
      {...rest}
    >
      {children}
    </a>
  );
}
