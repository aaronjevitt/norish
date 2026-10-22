# 24 — Lazy workers may never report running

Status: needs-triage
Blocked by: None — can start immediately

Spec: `.scratch/dependency-upgrades/spec.md`. This was found while researching BullMQ 6; it is not a dependency change.

## What to build

`packages/queue/src/lazy-worker-manager.ts` starts a lazy worker like this:

```ts
await worker.run();
state.isRunning = true;
log.info({ queueName }, "Lazy worker started");
```

**Suspected behaviour.** In BullMQ 5 and 6, `Worker.run()` resolves when the worker closes or pauses, not when it starts processing. The unit tests mock `run()` to resolve immediately, so they can't tell the difference. If that holds:

- `state.isRunning` stays `false` for as long as the worker runs, so the warm-idle shutdown never fires.
- A boot with jobs waiting in a lazy queue could block `startWorkers()`. `apps/web/server/index.ts` awaits that call before the server starts listening.

**This is not verified at runtime.**

**Triage:**

1. Reproduce with a real Redis (testcontainers). Start the server with a job waiting in a lazy queue and see whether it reaches `listen`. Separately, check whether `isRunning` ever becomes true.
2. If confirmed, start the worker without awaiting `run()`: keep its promise, log its rejection, and set `isRunning` from the worker's own state (`isRunning()`, or the `ready` / `active` events). Then cover it with an integration test that does not mock `run()`.

## Acceptance criteria (if confirmed)

- [ ] **Integration test.** A test against real Redis shows the server starting with jobs waiting in a lazy queue, and `isRunning` true while the worker runs.
- [ ] **Warm idle.** The warm-idle shutdown fires after its timeout.

## Comments

- Filed 2026-10-12 with the spec.
