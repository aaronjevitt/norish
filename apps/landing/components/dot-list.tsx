/**
 * A short run of facts separated by hairline dots, instead of a row of badges.
 * Each dot trails its own item, so a line that wraps starts on a word rather
 * than on a stranded separator.
 */
export function DotList({ items, className }: { items: readonly string[]; className?: string }) {
  const last = items.length - 1;

  return (
    <p className={`text-muted flex flex-wrap items-center gap-x-2.5 gap-y-1.5 ${className ?? ""}`}>
      {items.map((item, index) => (
        <span key={item} className="flex items-center gap-2.5">
          {item}
          {index < last ? <span aria-hidden className="bg-border size-1 rounded-full" /> : null}
        </span>
      ))}
    </p>
  );
}
