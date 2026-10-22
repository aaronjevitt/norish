# 30 — The parser's direct dependencies and starlette 1

Status: ready-for-agent
Blocked by: 06
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Bring `apps/parser-api`'s direct dependencies to their latest, and take **starlette 1.x**. That clears starlette's six advisories, which have no fix on the 0.x line.

| Package                   | Today   | Target  |
| ------------------------- | ------- | ------- |
| `fastapi`                 | 0.136.1 | 0.143.x |
| `uvicorn`                 | 0.46.0  | 0.54.x  |
| `beautifulsoup4`          | 4.14.3  | 4.15.x  |
| `starlette` (via fastapi) | 0.47.3  | ≥ 1.3.1 |
| `recipe-scrapers`         | 15.12.0 | current |

- **Pick the FastAPI release to match.** FastAPI allows `starlette>=0.46.0` with no upper bound, so land on a FastAPI release that supports the starlette version you end up with.
- **starlette 0.x → 1.x is a major.** Read its 1.0 notes for anything FastAPI-facing.
- **Optional:** the Dockerfile installs uv from the uv 0.12.5 image; 0.13.x is out.

## Acceptance criteria

- [ ] **Lock.** `uv.lock` and the `pyproject.toml` bounds are updated, and starlette is ≥ 1.3.1.
- [ ] **Tests.** `uv run pytest` passes in apps/parser-api.
- [ ] **Imports.** A production Docker build imports a handful of real recipe URLs, including one through the extruct path, and the E2E URL-import tests pass.
- [ ] **Release notes.** A bullet under `## Fixes and Improvements` for the parser's dependency updates.

## Comments

- Filed 2026-10-12, split out of ticket 06 when the maintainer limited 0.25 to safe fixes.
