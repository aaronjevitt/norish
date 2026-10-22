# 18 — BullMQ 6

Status: ready-for-agent
Blocked by: 17, shipped in an earlier release
Target release: 0.26.x or 0.27, at least one release after 17

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move `bullmq` to the 6.x line (6.0.0 shipped on 2026-07-30; 6.3.13 is current). **ioredis stays on 5.**

- BullMQ 6 makes ioredis an optional peer (`>=5`) and requires it lazily, only when it is given connection options.
- Norish passes ioredis instances (`packages/queue/src/redis/bullmq.ts`) and depends on ioredis directly.
- BullMQ's own CI still tests against ioredis 5.11.1.

After ticket 17, the remaining breaking surface doesn't touch Norish:

- `debounce`, `discard()`, `getRepeatableJobs` and `removeRepeatable*` are removed; Norish uses none of them.
- `QueueEvents` now parses `completed.returnvalue`; Norish listens only to `waiting` and `drained`.
- `waitUntilReady()` returns `void`.
- `Worker.resume()` is async; it is already awaited in `lazy-worker-manager.ts`.
- The third constructor argument is now a backend factory.
- cron-parser moves to 5.
- The Proxy in `operation-aware-queue.ts` stays safe, because BullMQ uses no `#private` fields.

**Self-hosters:**

- **Redis.** The minimum is unchanged: 5.0.0, with 6.2.0 recommended. Compose ships `redis:8.10.1` (`docker/compose.base.yaml`), while `README.md` and the docs' `QuickStartCompose` still say 8.4.0. Both versions are fine; align the docs.
- **No downgrade.** v6 is one-way; no downgrade path is documented. → Upgrade note.

**Later improvement:** BullMQ 6's typed `ProgressType`, replacing `readStepProgress(unknown)` in `packages/queue/src/job-steps.ts`.

## Acceptance criteria

- [ ] **Type check.** A strict `tsc --noEmit` on packages/queue and packages/trpc is clean of BullMQ errors.
- [ ] **Tests.** The queue tests pass, including ticket 17's scheduler and client assertions.
- [ ] **Production smoke.** On a production build: a scheduled task fires, an enrichment runs, a URL import and a paste import run, and the admin job-queue view lists jobs.
- [ ] **Docs.** The Redis version is aligned in `README.md` and the docs.
- [ ] **Release notes.** An Upgrade note that the queue upgrade is one-way: back up Redis before upgrading if you might roll back.

## Comments

- Filed 2026-10-12 with the spec.
