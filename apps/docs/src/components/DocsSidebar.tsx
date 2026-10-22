import type {
  PropSidebarItem,
  PropSidebarItemCategory,
  PropSidebarItemLink,
} from "@docusaurus/plugin-content-docs";
import React, { useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import { isActiveSidebarItem } from "@docusaurus/plugin-content-docs/client";
import { useLocation } from "@docusaurus/router";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { Disclosure } from "@heroui/react";
import clsx from "clsx";

const row =
  "flex min-h-9 flex-1 items-center rounded-full px-3 py-1.5 text-[0.9375rem] leading-snug transition-colors";
const idle = "text-muted hover:bg-default/70 hover:text-foreground";
const current = "bg-surface text-foreground font-medium shadow-[0_1px_3px_rgb(0_0_0/0.08)]";

/** The docs navigation tree, shared by the desktop column and the phone drawer. */
export default function DocsSidebar({ items }: { items: PropSidebarItem[] }) {
  const { pathname } = useLocation();

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item, index) => (
        <SidebarItem key={index} activePath={pathname} item={item} />
      ))}
    </ul>
  );
}

function SidebarItem({ item, activePath }: { item: PropSidebarItem; activePath: string }) {
  if (item.type === "category") return <SidebarCategory activePath={activePath} item={item} />;
  if (item.type === "link") return <SidebarLink activePath={activePath} item={item} />;

  return null;
}

function SidebarLink({ item, activePath }: { item: PropSidebarItemLink; activePath: string }) {
  const active = isActiveSidebarItem(item, activePath);

  return (
    <li className="flex">
      <Link
        aria-current={active ? "page" : undefined}
        className={clsx(row, active ? current : idle)}
        to={item.href}
      >
        {item.label}
      </Link>
    </li>
  );
}

function SidebarCategory({
  item,
  activePath,
}: {
  item: PropSidebarItemCategory;
  activePath: string;
}) {
  const active = isActiveSidebarItem(item, activePath);
  const [expanded, setExpanded] = useState(active || !item.collapsed);

  // Opening a page inside a closed category opens the category.
  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  const onIndex = item.href === activePath;

  return (
    <li>
      <Disclosure isExpanded={expanded} onExpandedChange={setExpanded}>
        <div className="flex items-center gap-0.5">
          {item.href ? (
            <Link
              aria-current={onIndex ? "page" : undefined}
              className={clsx(row, onIndex ? current : idle)}
              to={item.href}
              onClick={() => setExpanded(true)}
            >
              {item.label}
            </Link>
          ) : (
            <span className={clsx(row, "text-muted")}>{item.label}</span>
          )}
          <Disclosure.Trigger
            aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
            className="group text-muted hover:bg-default/70 hover:text-foreground grid size-8 flex-none place-items-center rounded-full transition-colors"
          >
            <ChevronRightIcon className="size-4 transition-transform duration-200 group-aria-expanded:rotate-90" />
          </Disclosure.Trigger>
        </div>
        <Disclosure.Content>
          <ul className="border-separator my-1 ml-4 flex flex-col gap-0.5 border-l pl-2">
            {item.items.map((child, index) => (
              <SidebarItem key={index} activePath={activePath} item={child} />
            ))}
          </ul>
        </Disclosure.Content>
      </Disclosure>
    </li>
  );
}
