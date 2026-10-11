# 06 — Manual Image Generation from the actions menu

Status: resolved
Blocked by: 05

Spec: `.scratch/image-generation/spec.md`

## What to build

A recipe editor can ask for a picture from the recipe's actions menu, on web and on mobile. It runs whatever is stored, replaces the primary image, and reports its own failures to the person who asked.

## Notes

Most of this arrives free with ticket 05: the manual request mutation already accepts any kind in the vocabulary, and the client hook already tracks per-kind lifecycle. What is new is two menu entries, their translations, and a message for the unconfigured-provider skip reason.

Availability depends on AI enablement and edit permission alone. The automatic switch is enrollment policy, not an availability check — automation policy must not remove an editing tool.

**The action is unguarded and destructive by decision** (ADR-0025). It does not confirm, and it does not spare a supplied photograph. Do not add a dialog.

Viewing a recipe never grants permission to change it through AI; the existing edit-permission assertion applies unchanged.

## Acceptance criteria

- [ ] The action appears in the recipe actions menu on web and on mobile.
- [ ] It is available on AI enablement and edit permission alone, regardless of the automatic switch.
- [ ] It is unavailable to someone with view-only access.
- [ ] It shows queued and processing states and disables itself while busy, like the other six.
- [ ] A terminal failure of a manual run is reported to the requester; an automatic failure still reports to nobody.
- [ ] A request on a server with no image provider configured is refused with a message that says so.
- [ ] A duplicate request while one is running is reported as already running, not queued twice.
- [ ] It runs on a recipe that already has a photograph, and that photograph does not survive.
- [ ] Both apps' translations are complete and the locale-key check passes.

## Comments

- 2026-08-22: Implemented (commit cebb76b8). Generate Picture in both actions menus behind AI enablement + edit permission, shared busy states, no dialog (ADR-0025 noted inline). `no-image-provider` refusal message in the router map with a test row; menu labels translated in all 14 locales.
