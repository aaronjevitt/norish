# 08 — Browser E2E for Image Generation

Status: resolved
Blocked by: 06, 07

Spec: `.scratch/image-generation/spec.md`

## What to build

Production-like browser coverage for both user-visible paths, in the existing `ai` E2E project, so the feature's acceptance does not rest on mocks.

## Notes

The fake AI provider gains an image-generation route returning a fixture JPEG, alongside the chat-completion route it already serves, and it should be directable to succeed or fail the same way. That route is shared infrastructure both specs need, which is why this is one ticket rather than two halves.

Follow the existing recipe-enrichment and bulk-enrichment specs rather than inventing a harness shape. The project's fixtures own stack lifecycle.

Assert what a reader sees: the primary image changes, the page re-tints from the new Dish Colour, the previous image is gone from the gallery.

If the suite goes quiet-red, suspect stale artifacts before suspecting the feature — the injected workspace copies and the Next build output both go stale after editing packages, and the symptom looks like a realtime bug.

## Acceptance criteria

- [ ] The fake AI provider serves image generation and can be directed to succeed or fail like the existing route.
- [ ] A spec drives the manual action from the actions menu and asserts the primary image is replaced and the page re-tints.
- [ ] A spec drives the bulk sweep and asserts gap-only behaviour by default and every-recipe behaviour with overwrite on.
- [ ] Both specs run in the existing `ai` project under the existing fixtures, with no new stack.
- [ ] `pnpm test:e2e` passes.

## Comments

- 2026-08-22: Implemented (commit 817b34c5). The fake provider serves `/images/generations` with its own directive lane (`succeedImageWith`/`failImage…`), wire-tested through the real SDK image client. `image-generation.e2e.ts`: the manual action replaces a seeded photograph and the open page swaps its hero and re-tints from the drawing's hue without a reload; the bulk sweep names 1 image by default and 2 with overwrite, fills only the gap recipe by default, and reaches the photographed one with overwrite — image-route request counts pin the spend. Full `pnpm test:e2e` green after fixing a pre-existing UTC/local date flake in the offline fixture (82d8539a).
