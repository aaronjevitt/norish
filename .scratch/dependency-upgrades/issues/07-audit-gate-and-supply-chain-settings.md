# 07 — Advisories can't pile up again

Status: ready-for-agent
Blocked by: 01, 02, 03 (the gate fails until they land). The mobile allowlist follows the decision in 23.
Target release: 0.26.0-beta (first in the cycle)

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Nothing in the repo updates dependencies or reports advisories today: no Renovate or Dependabot configuration, and no workflow runs an audit or an image scan. Three changes fix that.

**1. An audit gate in CI.**

- **Where and when.** Run `pnpm audit --audit-level=high --ignore-registry-errors` on pull requests (in `_node-ci.yml` or `pr-quality.yml`) and on a weekly schedule.
- **Output mode.** Use the table output: with `--json`, the exit code comes from the unfiltered total.
- **Allowlist.** Accepted advisories go to `auditConfig.ignoreGhsas` in `pnpm-workspace.yaml`, each with a comment giving the reason and a ticket. `--ignore` writes only CVE ids, so advisories without a CVE can't be ignored that way.
  - Starter allowlist, mobile/dev-only, pending ticket 23: `GHSA-vfj7-8cjw-p6xm`, `GHSA-86w9-cpqp-85rv`, `GHSA-w5hq-g745-h8pq`, `GHSA-vcc3-ghjq-m6fr`, `GHSA-5p2g-fcmc-qvqq`, `GHSA-w3rx-r6r6-pgpr`.
- **Other surfaces.** The same gate for `apps/docs` (its own lockfile), and `pip-audit` on `uv export --locked` for `apps/parser-api`.

**2. pnpm's supply-chain settings.** All of these are available in 10.34.5:

- `minimumReleaseAge` (in minutes, for example `2880`), with `minimumReleaseAgeExclude` for an urgent security release. This also limits what the unpinned legacy deploy can pick up until ticket 16 lands.
- `trustPolicy: no-downgrade`.
- `blockExoticSubdeps: true`. Neither lockfile has git or tarball resolutions, so this is safe.
- `strictDepBuilds: true`. Check that `onlyBuiltDependencies` still covers everything that needs a build.

**3. Renovate (`renovate.json`).**

- **Lockfile maintenance.** Weekly `lockFileMaintenance`. This is what would have prevented the stale lockfile state this effort found.
- **Groups:**
  - the pnpm catalog;
  - `@better-auth/*`;
  - `@trpc/*` together with `@tanstack/*`;
  - `ai` together with `@ai-sdk/*`;
  - testcontainers;
  - apps/docs;
  - uv (parser-api);
  - Docker base images;
  - GitHub Actions.
- **Release-age gating** to match `minimumReleaseAge`.
- **Majors** each in their own PR.
- **Confirm support.** Renovate's pnpm-catalog and uv support could not be confirmed from the sandbox; check both when configuring.
- **Maintainer step.** Install the Renovate GitHub App. The lighter alternative is Dependabot security updates; pick one in review.

## Acceptance criteria

- [ ] **Gate.** A PR that introduces a high or critical advisory not on the allowlist fails CI, and a weekly scheduled run exists.
- [ ] **Allowlist.** Every allowlist entry has a reason and a ticket reference.
- [ ] **Docs and parser.** The docs site and the parser are audited too.
- [ ] **pnpm settings.** They are set, and `pnpm install --frozen-lockfile` still passes in CI and in the Docker build.
- [ ] **Renovate.** `renovate.json` validates (`npx --package renovate renovate-config-validator`). The maintainer's choice of Renovate or Dependabot, and the app installation, are recorded in the comments.

## Comments

- Filed 2026-10-12 with the spec.
- 2026-10-12 — Moved to 0.26 when the maintainer limited 0.25 to safe fixes; its `strictDepBuilds` and release-age settings change how installs behave, which is not a release-candidate change.
- The image scan belongs with ticket 16, which makes the image's dependencies come from the lockfile in the first place.
