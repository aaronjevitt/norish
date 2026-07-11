# FEHB Plan Analyzer (2026, Self Plus One)

Ranks nationwide FEHB plans by **expected annual net cost** for a two-person
household, with full credit for what makes HSA plans win: employer premium
pass-through and pre-tax contribution savings.

```bash
python3 fehb_analyzer.py                      # 22% fed / 5% state defaults
python3 fehb_analyzer.py --fed 0.24 --state 0.06
python3 fehb_analyzer.py --spend 8000         # single custom utilization level
python3 fehb_analyzer.py --hsa-contrib 4000   # you'd only contribute $4k/yr
python3 fehb_analyzer.py --no-pretax-premiums # no premium conversion
python3 fehb_analyzer.py --json               # machine-readable
```

## How it scores a plan

For each utilization scenario (low / moderate / high / catastrophic, weighted
35/40/20/5%):

```
net cost = after-tax premiums
         + your cost share (deductible → coinsurance, capped at OOP max)
         − employer HSA pass-through
         − tax savings on your HSA contributions   (HDHP plans)
         − tax savings on FSA contributions        (non-HDHP plans)
```

Tax savings use your combined marginal rate (federal + state + 7.65% FICA),
since FEHB premium conversion, payroll HSA contributions, and FSAs all avoid
payroll tax.

## Scraping live data from OPM (Playwright)

`scrape_opm.js` walks [OPM's official plan-comparison tool](https://www.opm.gov/healthcare-insurance/healthcare/plan-information/compare-plans/)
and extracts every plan available for your zip code — premiums, deductible,
OOP max, coinsurance, HSA pass-through — into `out/plans.json`, with raw HTML
snapshots in `out/raw/` for auditing.

```bash
cd scripts/fehb-analyzer
npm install playwright-core            # Chromium must be available
node scrape_opm.js --zip 20001         # --headed to watch; --enrollment self|self-plus-one|family
python3 fehb_analyzer.py --plans-json out/plans.json
```

**Network caveat:** opm.gov (and carrier sites) are blocked by the egress
policy in restricted Claude Code remote sessions, and OPM's WAF blocks many
datacenter IPs. Run the scraper from your own machine, or a session whose
network policy allows general web access. Extraction is defensive (labeled
rows → regex fallback → raw HTML kept), since OPM redesigns the tool
periodically — plans missing fields are flagged `⚠ verify` by the analyzer
rather than silently trusted.

## Data & caveats

- Premiums are **2026 biweekly employee shares, Self Plus One, non-postal**.
  Plans flagged `⚠ verify` (GEHA Elevate / Elevate Plus) could not be
  independently cross-checked — confirm before trusting those rows.
- Deductible/coinsurance/OOP-max values for copay-style plans are simplified
  to an "effective coinsurance" — good enough for ranking, not for
  brochure-level precision.
- Edit the `PLANS` list and `DEFAULT_SCENARIOS` at the top of the script to
  update rates (Open Season) or tune spend levels to your actual history.
- Authoritative source: [OPM plan comparison tool](https://www.opm.gov/healthcare-insurance/healthcare/plan-information/compare-plans/)
  and each plan's official brochure.

## 2026 constants baked in

| Constant | Value |
|---|---|
| HSA family limit | $8,750 |
| GEHA HDHP pass-through (Self+1) | $2,000/yr |
| MHBP Consumer Option pass-through (Self+1) | $2,400/yr |
| Health FSA limit | $3,400 (verify) |
