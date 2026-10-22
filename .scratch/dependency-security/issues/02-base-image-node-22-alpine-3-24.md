# 02 — Base image on a maintained Alpine

Status: resolved
Target version: 0.25.0-beta
Blocked by: none

Spec: `.scratch/dependency-security/spec.md`

## What to build

`docker/Dockerfile` `FROM node:22-alpine3.21` → `node:22-alpine3.24`, and the comment and `_docker-build.yml` note that name the old tag. `.nvmrc` 22.23.2 → 22.23.3. Fix any `apk` package name the three Alpine minors renamed.

## Acceptance criteria

- [ ] The image builds.
- [ ] Booted against Postgres and Redis, `node -v` prints 22.23.x, the app serves the login page, an image upload is resized (sharp/vips), and `ffmpeg -version` and a database query work.
- [ ] `pnpm lint`, `pnpm test:run`, `pnpm build` pass.

## Comments

- 2026-10-12: Done. No `apk` renames (`libc6-compat` is provided by gcompat, `pkgconfig` by pkgconf). Booted against Postgres and Redis: node v22.23.3, Alpine 3.24.2, ffmpeg 8.1.2, `/login` 200, sign-up plus a DB query, an 1800×1350 upload stored at 960×720.
