import type { Browser } from "playwright-core";
import { chromium } from "playwright-core";

import { SERVER_CONFIG } from "@norish/config/env-config-server";
import { serverLogger as log } from "@norish/shared-server/logger";

/**
 * The connection to Obscura, the headless browser that renders pages for URL
 * imports. Obscura serves the Chrome DevTools Protocol, so Playwright Core
 * talks to it directly: `OBSCURA_ENDPOINT` is dialled as given, with no
 * debugger-metadata probe and no hostname rewriting in between.
 */
let browser: Browser | null = null;

/**
 * The connection attempt in flight, if there is one. Cached as a promise rather
 * than awaited per caller, so two imports arriving while Obscura is cold share
 * one connection instead of opening two and orphaning the first.
 */
let connecting: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  // One connection serves every import; contexts, not connections, are what
  // keeps concurrent imports isolated. A connection Obscura dropped — because
  // it restarted, say — is replaced here rather than by restarting Norish.
  if (browser?.isConnected()) return browser;
  if (connecting) return connecting;

  const endpoint = SERVER_CONFIG.OBSCURA_ENDPOINT;

  connecting = chromium
    .connectOverCDP(endpoint)
    .then((connected) => {
      browser = connected;

      return connected;
    })
    .catch((error: unknown) => {
      log.error({ err: error, endpoint }, "Failed to connect to Obscura");
      throw new Error(
        `Obscura is not reachable at ${endpoint}. Start the obscura service or check OBSCURA_ENDPOINT.`
      );
    })
    .finally(() => {
      // Cleared either way: a failed attempt must not be cached, so the next
      // import retries once Obscura is back.
      connecting = null;
    });

  return connecting;
}

export async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
    } catch (error) {
      log.error({ err: error }, "Error closing the Obscura connection");
    }
    browser = null;
  }
}

// Graceful shutdown - register handlers only once
let shutdownHandlersRegistered = false;

function registerShutdownHandlers() {
  if (shutdownHandlersRegistered) return;
  shutdownHandlersRegistered = true;
  process.on("SIGINT", closeBrowser);
  process.on("SIGTERM", closeBrowser);
}

registerShutdownHandlers();
