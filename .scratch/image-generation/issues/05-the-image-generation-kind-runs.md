# 05 — The image-generation kind runs

Status: resolved
Blocked by: 01, 02, 03

Spec: `.scratch/image-generation/spec.md`

## What to build

Image Generation becomes the seventh kind of Recipe Enrichment. When a recipe becomes usable, has no image at all, and the administrator has switched the kind on, a background job writes a short visual brief from the recipe, asks the image model to draw it, stores the result as the recipe's primary image and recomputes the Dish Colour. Automatic enrolment works from here; the manual action is ticket 06 and the bulk count is ticket 07.

## Notes

**This ticket carries the fan-out.** A seventh kind breaks every exhaustive map over the kind vocabulary at once: the coordinator's per-kind setting map, queue names, worker concurrency, stalled intervals, the queue registry, the client hook's idle-state map, the router's skip-message map, and the translation keys in both apps. Around fifteen sites, mechanical, and none can be deferred — the vocabulary is not extendable by half.

Adding the kind should read as a worked example of adding an enrichment kind, not as a parallel pipeline. One coordinator decides eligibility, one queue carries the work, one lifecycle contract reports progress, one repository operation persists the result.

Eligibility (ADR-0025): the blanket no-ingredients pre-check applies unchanged. On top of it, an ordinary automatic run is skipped when the recipe has any image at all — any gallery row, or the legacy scalar — reported as supplied data present. A manual request and an administrator's refresh skip that check. A new skip reason covers an unconfigured image provider and applies to every origin, manual included.

Two AI requests, one job: brief first, image second. The brief is written in English whatever language the recipe is in, is never stored, and is never shown (ADR-0024).

The queue runs at **concurrency 1**, not the 2 the other enrichment queues use, because image APIs are billed per call and rate-limited hard.

The shared write-mode helper decides nothing for this kind. Every run that reaches a worker replaces; eligibility is what keeps automatic runs off stored images.

## Acceptance criteria

- [ ] `image-generation` is a seventh member of the enrichment kind vocabulary; lifecycle states, origins, enrollment outcomes and the status contract are reused unchanged and now report seven kinds.
- [ ] Every exhaustive map over the kind vocabulary is total again, in both apps.
- [ ] The kind has its own queue with the shared job identity, retry, backoff and retention options, and does not disturb the other six.
- [ ] The queue runs at concurrency 1.
- [ ] An ordinary automatic run is skipped for a recipe with a gallery image, and for one with only the legacy scalar.
- [ ] A manual request and an administrator's refresh are not skipped in either of those cases.
- [ ] Every origin is skipped when no image provider is configured, with a dedicated skip reason.
- [ ] A recipe with no ingredients is skipped as insufficient input.
- [ ] With the automatic switch off, the automatic path and the bulk sweep both skip the kind.
- [ ] One job issues the brief request before the image request and stores the result through the ticket 02 operation.
- [ ] The brief is written in English regardless of the recipe's language, and is not stored.
- [ ] A successful run recomputes the Dish Colour from the image it wrote.
- [ ] An empty or unusable image fails the job rather than succeeding silently.
- [ ] A refusal is terminal without burning retry attempts; a timeout retries.
- [ ] A failed automatic run leaves the recipe untouched and reports nothing to any user.
- [ ] A successful run publishes the canonical recipe update, so clients converge without refetching.

## Comments

- 2026-08-22: Implemented (commit 10b79963). Seventh kind through every exhaustive map (queue names/concurrency/stalled/hanging/options, registry, worker startup, coordinator setting map, client hook maps, router skip messages, job monitor, translations both apps). Queue at concurrency 1. Eligibility per ADR-0025: `no-image-provider` first (every origin), then any-image-at-all suppresses only ordinary automatic runs (gallery row or non-blank legacy scalar). Worker: brief (`writeVisualBrief`, mocked-runtime-tested) before image, storage through the ticket-02 operation, Dish Colour recomputed before the canonical publish. Coordinator/bulk/status/worker tests extended or added.
