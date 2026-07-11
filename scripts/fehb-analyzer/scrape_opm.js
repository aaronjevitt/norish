#!/usr/bin/env node
/**
 * OPM FEHB plan scraper (Playwright).
 *
 * Walks OPM's official plan-comparison tool, extracts every plan visible for
 * your zip code (nationwide + local), captures premiums and benefit details,
 * and writes:
 *
 *   out/plans.json      — normalized best-effort data for fehb_analyzer.py --plans-json
 *   out/raw/*.html      — raw page snapshots (so you can fix selectors if OPM
 *                         changes markup, and audit every extracted number)
 *
 * Usage:
 *   npm install playwright-core        # or playwright
 *   node scrape_opm.js --zip 20001 [--headed] [--enrollment self-plus-one]
 *
 * NOTE: opm.gov blocks many datacenter IPs and simple fetchers; run this from
 * a residential connection / your own machine. In restricted Claude Code
 * remote sessions the egress policy may deny opm.gov entirely — run locally
 * or in a session whose network policy allows general web access.
 *
 * OPM's comparison tool is periodically redesigned. The extraction below is
 * deliberately defensive: it prefers labeled DOM rows, falls back to regex
 * over rendered text, and always keeps the raw HTML so nothing is lost.
 */

const fs = require('fs');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch {
  ({ chromium } = require('playwright'));
}

const args = process.argv.slice(2);
const getArg = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const ZIP = getArg('zip', '20001');
const HEADED = args.includes('--headed');
const ENROLLMENT = getArg('enrollment', 'self-plus-one'); // self | self-plus-one | family

const BASE = 'https://www.opm.gov/healthcare-insurance/healthcare/plan-information/compare-plans';
const PLANS_URL =
  `${BASE}/fehb/Plans?FFSSearch=on&Medicare=False&ZipCode=${ZIP}` +
  `&IncludeNationwide=True&empType=a&payPeriod=c`;

const OUT_DIR = path.join(__dirname, 'out');
const RAW_DIR = path.join(OUT_DIR, 'raw');
fs.mkdirSync(RAW_DIR, { recursive: true });

const money = (s) => {
  const m = String(s).replace(/,/g, '').match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1]) : null;
};

/** Pull "Label ... $123.45"-style pairs out of rendered text. */
function extractLabeledMoney(text, patterns) {
  const out = {};
  for (const [key, re] of Object.entries(patterns)) {
    const m = text.match(re);
    out[key] = m ? money(m[1]) : null;
  }
  return out;
}

const DETAIL_PATTERNS = {
  annual_deductible: /annual\s+deductible[^$]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i,
  oop_max: /out[\s-]*of[\s-]*pocket\s+max(?:imum)?[^$]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i,
  hsa_passthrough: /(?:pass[\s-]*through|plan\s+contribution|premium\s+pass)[^$]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i,
  pcp_copay: /primary\s+care[^$%]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i,
  specialist_copay: /specialist[^$%]{0,120}\$\s*([\d,]+(?:\.\d+)?)/i,
};

const COINSURANCE_RE = /(\d{1,2})\s*%\s*(?:coinsurance|of\s+(?:the\s+)?plan\s+allowance)/i;

async function main() {
  const launchOpts = { headless: !HEADED };
  if (process.env.PLAYWRIGHT_BROWSERS_PATH === '/opt/pw-browsers') {
    launchOpts.executablePath = '/opt/pw-browsers/chromium';
  }
  if (process.env.HTTPS_PROXY) launchOpts.proxy = { server: process.env.HTTPS_PROXY };

  const browser = await chromium.launch(launchOpts);
  const ctx = await browser.newContext({
    ignoreHTTPSErrors: !!process.env.HTTPS_PROXY, // proxy re-terminates TLS
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 1000 },
  });
  const page = await ctx.newPage();

  console.log(`Loading plan list for zip ${ZIP} ...`);
  await page.goto(PLANS_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  fs.writeFileSync(path.join(RAW_DIR, 'plans-list.html'), await page.content());

  // -- Collect plan cards -----------------------------------------------
  // The tool renders one block per plan option with a name, enrollment
  // codes, and biweekly premiums. Grab links to detail pages plus any
  // premium shown on the card.
  const cards = await page.evaluate(() => {
    const results = [];
    // Any element linking into PlanDetails identifies a plan option.
    const links = Array.from(document.querySelectorAll('a[href*="PlanDetails"]'));
    const seen = new Set();
    for (const a of links) {
      const href = a.href;
      if (seen.has(href)) continue;
      seen.add(href);
      // Walk up to the enclosing card and take its full text.
      let card = a;
      for (let i = 0; i < 6 && card.parentElement; i++) {
        card = card.parentElement;
        if ((card.innerText || '').length > 120) break;
      }
      results.push({ href, cardText: (card.innerText || '').slice(0, 4000) });
    }
    return results;
  });

  if (cards.length === 0) {
    console.error(
      'No PlanDetails links found — OPM may have changed markup or served a ' +
      'block page. Inspect out/raw/plans-list.html and adjust selectors.'
    );
  }
  console.log(`Found ${cards.length} plan option card(s).`);

  const plans = [];
  for (const [i, card] of cards.entries()) {
    const nameMatch = card.cardText.match(/^([^\n]{4,80})/);
    const name = nameMatch ? nameMatch[1].trim() : `plan-${i}`;
    const codeMatch = card.cardText.match(/\b(\d{2}[0-9A-Z]\d?)\b.*?(?:code|enrollment)/i)
      || card.cardText.match(/enrollment\s+code[:\s]+([0-9A-Z]{3})/i);
    console.log(`  [${i + 1}/${cards.length}] ${name}`);

    let detail = { name, code: codeMatch ? codeMatch[1] : null, url: card.href };
    try {
      await page.goto(card.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
      const html = await page.content();
      const slug = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60);
      fs.writeFileSync(path.join(RAW_DIR, `${i}-${slug}.html`), html);

      const text = await page.innerText('body');

      // Premiums: find the row for the requested enrollment tier.
      const tierLabel = {
        'self': /self\s+only/i,
        'self-plus-one': /self\s+plus\s+one/i,
        'family': /self\s+(?:and|&)\s+family/i,
      }[ENROLLMENT];
      let biweekly = null;
      for (const line of text.split('\n')) {
        if (tierLabel.test(line)) {
          const amounts = [...line.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map((m) => money(m[1]));
          // Rows typically show total / gov share / your share — take the smallest
          // as the employee share when several are present.
          if (amounts.length) biweekly = Math.min(...amounts);
          if (biweekly != null) break;
        }
      }

      const labeled = extractLabeledMoney(text, DETAIL_PATTERNS);
      const coins = text.match(COINSURANCE_RE);

      detail = {
        ...detail,
        enrollment: ENROLLMENT,
        biweekly_premium: biweekly,
        coinsurance: coins ? parseInt(coins[1], 10) / 100 : null,
        hsa_qualified: /health\s+savings\s+account|HSA/i.test(text) &&
                       /pass[\s-]*through|premium\s+pass/i.test(text),
        ...labeled,
        scraped_at: new Date().toISOString(),
      };
    } catch (e) {
      detail.error = e.message;
      console.warn(`     ! ${e.message.split('\n')[0]}`);
    }
    plans.push(detail);
  }

  fs.writeFileSync(path.join(OUT_DIR, 'plans.json'), JSON.stringify(plans, null, 2));
  console.log(`\nWrote ${plans.length} plan(s) to ${path.join(OUT_DIR, 'plans.json')}`);
  console.log('Raw HTML snapshots in out/raw/ — audit extracted numbers against them.');
  console.log('Feed into the analyzer:  python3 fehb_analyzer.py --plans-json out/plans.json');

  await browser.close();
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
