# 06 — The parser's Python lock picks up the security fixes

Status: ready-for-agent
Blocked by: None. It needs an environment with Python 3.14 and uv; the research sandbox could not download an interpreter.
Target release: 0.25.0-beta (safe fixes only)

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

`apps/parser-api` (Python 3.14, uv, FastAPI) runs inside the production image and parses untrusted pages.

**In 0.25, only the transitive packages that have a fix inside their current major move.** Use one `uv lock --upgrade-package <name>` per package, to the smallest fixed version. The current constraints allow every one of these (checked against PyPI `requires_dist`).

| Package         | Locked | Move to  | Why it matters                                                                                                                                 |
| --------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| lxml            | 6.0.2  | ≥ 6.1.0  | **CVE-2026-41066**: XML entity resolution can read local files, and lxml parses untrusted pages through extruct. cp314 musllinux wheels exist. |
| lxml-html-clean | 0.4.4  | 0.4.5    | CVE-2026-49825                                                                                                                                 |
| urllib3         | 2.6.3  | 2.8.0    | 5 advisories (via requests)                                                                                                                    |
| anyio           | 4.13.0 | ≥ 4.14.2 | 2 advisories                                                                                                                                   |
| idna            | 3.11   | ≥ 3.15   | CVE-2026-45409                                                                                                                                 |
| soupsieve       | 2.8.3  | ≥ 2.9.0  | 4 selector-parsing DoS advisories. Low risk: the selectors are hard-coded.                                                                     |

**Not in 0.25 (ticket 30):**

- **starlette's six advisories**, which are fixed only in starlette 1.x, a major. The parser listens on 127.0.0.1 only, so they wait.
- **The direct dependencies:** fastapi, uvicorn and beautifulsoup4.

## Acceptance criteria

- [ ] **Lock.** `uv.lock` holds the fixed versions above. No direct dependency and no other package changes; review the lock diff to confirm.
- [ ] **Tests.** `uv run pytest` passes in apps/parser-api. No CI gate runs the Python tests today; ticket 07 adds `pip-audit`.
- [ ] **Imports.** A production Docker build imports a handful of real recipe URLs, including one through the extruct path, and the E2E URL-import tests pass.
- [ ] **Release notes.** A bullet under `## Fixes and Improvements`: "Security updates to the recipe parser's dependencies."

## Comments

- Filed 2026-10-12 with the spec.
- 2026-10-12 — Narrowed for the safe-fixes-only 0.25: starlette 1.x and the direct-dependency bumps moved to ticket 30.
- Source: the PyPI JSON API, including each release's `vulnerabilities` list.
