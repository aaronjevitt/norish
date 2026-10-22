import React, { useEffect, useState } from "react";
import Link from "@docusaurus/Link";
import { useLocation } from "@docusaurus/router";
import { useHideableNavbar, useNavbarSecondaryMenu } from "@docusaurus/theme-common/internal";
import { ArrowUpRightIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Button, Drawer } from "@heroui/react";
import GitHubIcon from "@site/src/components/GitHubIcon";
import ThemeToggle from "@site/src/components/ThemeToggle";
import VersionMenu from "@site/src/components/VersionMenu";
import clsx from "clsx";

const links = {
  site: "https://norish.dev",
  github: "https://github.com/norish-recipes/Norish",
};

/**
 * The norish.dev header: a surface pill floating just off the top edge. On a
 * phone the docs navigation moves into a drawer behind the menu button; the
 * docs layout hands its tree over through Docusaurus's secondary menu. Like
 * the norish.dev header it gets out of the way as you read down and comes
 * back the moment you scroll up.
 */
export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const docsNav = useNavbarSecondaryMenu().content;
  const { navbarRef, isNavbarVisible } = useHideableNavbar(true);

  // Following a link in the drawer closes it.
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    // `navbar` is how Docusaurus measures the header when it marks the heading in view.
    <header
      ref={navbarRef}
      className={clsx(
        "navbar sticky top-0 z-50 px-3 pt-3 transition-[translate] duration-450 ease-(--ease-calm) motion-reduce:transition-none sm:px-6 sm:pt-4",
        // Past its own height too, so the shadow goes with it.
        !isNavbarVisible && "translate-y-[calc(-100%-1.5rem)]"
      )}
    >
      <nav
        aria-label="Main"
        className="bg-surface mx-auto flex h-14 max-w-[90rem] items-center gap-2 rounded-full pr-2 pl-4 shadow-[0_8px_28px_-10px_rgb(0_0_0/0.3)] sm:h-16 sm:pr-3 sm:pl-5"
      >
        <Link aria-label="Norish docs home" className="flex shrink-0 items-center gap-3" to="/">
          <img alt="Norish" height={26} src="/img/logo.svg" width={97} />
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <VersionMenu className="hidden md:inline-flex" />
          <a
            className="text-muted hover:text-foreground hidden items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors md:inline-flex"
            href={links.site}
            rel="noreferrer"
            target="_blank"
          >
            norish.dev
            <ArrowUpRightIcon className="size-3.5" />
          </a>
          <a
            aria-label="Norish on GitHub"
            className="text-muted hover:bg-default hover:text-foreground hidden size-9 place-items-center rounded-full transition-colors md:grid"
            href={links.github}
            rel="noreferrer"
            target="_blank"
          >
            <GitHubIcon className="size-4.5" />
          </a>
          <ThemeToggle />
          <Button
            isIconOnly
            aria-label="Open navigation"
            className="lg:hidden"
            size="sm"
            variant="ghost"
            onPress={() => setMenuOpen(true)}
          >
            <Bars3Icon className="size-5" />
          </Button>
        </div>
      </nav>

      {/* Opened from state, so no Drawer root: that is a trigger wrapper with nothing to wrap. */}
      <Drawer.Backdrop isOpen={menuOpen} onOpenChange={setMenuOpen}>
        <Drawer.Content className="w-[min(22rem,88vw)]" placement="left">
          <Drawer.Dialog aria-label="Navigation" className="bg-background">
            <Drawer.CloseTrigger />
            <Drawer.Header className="gap-3">
              <img alt="Norish" height={26} src="/img/logo.svg" width={97} />
            </Drawer.Header>
            <Drawer.Body className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-3 md:hidden">
                <VersionMenu />
                <div className="flex items-center gap-1">
                  <a
                    className="text-muted hover:text-foreground inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm"
                    href={links.site}
                    rel="noreferrer"
                    target="_blank"
                  >
                    norish.dev
                    <ArrowUpRightIcon className="size-3.5" />
                  </a>
                  <a
                    aria-label="Norish on GitHub"
                    className="text-muted hover:text-foreground grid size-9 place-items-center rounded-full"
                    href={links.github}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <GitHubIcon className="size-4.5" />
                  </a>
                </div>
              </div>
              {docsNav}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </header>
  );
}
