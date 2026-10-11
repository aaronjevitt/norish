# 07 — The bulk sweep names the image count

Status: resolved
Blocked by: 05

Spec: `.scratch/image-generation/spec.md`

## What to build

Before an administrator confirms Enrich All Recipes, the confirmation says how many images the sweep will generate — this being the one kind whose cost is per recipe and lands on a bill. The count reflects the toggle: gaps only by default, every eligible recipe with "Overwrite existing data" on.

## Notes

The sweep itself needs no change to run this kind; it already enrolls every enabled kind with the automatic origin. This ticket is the count and its presentation.

The count is a per-request read, never stored configuration, and it is only shown when image generation is among the enabled kinds. A server with the kind switched off sees the modal exactly as it does today.

The existing danger-styled replace warning and the generic cost warning both stay. This adds a number; it does not replace a warning.

The default sweep must remain incapable of touching a stored image — that is ticket 05's eligibility rule. Do not weaken it to make the count easier to compute.

## Acceptance criteria

- [ ] The confirmation states how many images the sweep will generate when image generation is enabled.
- [ ] The number reflects gaps only by default and every eligible recipe with overwrite on, and updates when the toggle changes.
- [ ] The modal is unchanged on a server where image generation is switched off.
- [ ] The existing replace and cost warnings are retained.
- [ ] A default sweep queues no image generation for any recipe that already has an image.
- [ ] Translations are complete and the locale-key check passes.

## Comments

- 2026-08-22: Implemented (commit 949ed105). `getImageGenerationSweepCounts` (real-db tested) mirrors coordinator eligibility in SQL; admin query `imageGenerationSweepCount` returns `enabled: false` when the switch is off (modal unchanged) and honest zeros when no provider is configured. The confirmation renders the ICU-plural count above the retained cost warning, switching live with the overwrite toggle; router and web component tests added.
