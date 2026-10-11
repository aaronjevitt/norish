# 04 — Archive carries the Generated Image marking

Status: resolved
Blocked by: 02

Spec: `.scratch/image-generation/spec.md`

## What to build

A Recipe Archive tells a receiving instance which of the images it contains were drawn rather than photographed. Exporting a recipe with a Generated Image preserves the marking, importing one honours it, and images from foreign archives arrive unmarked because they were supplied.

## Notes

This is the marking's only live purpose. Eligibility does not consult it and no surface renders it, so if this ticket is dropped the column should be dropped with it.

Mela, Paprika, Mealie and Tandoor carry no such field. Their images are Supplied Recipe Data and must arrive unmarked — not defaulted to generated, and not guessed at from anything.

A Norish archive written before this ticket has no field either. Importing one must leave its images unmarked rather than fail.

The Dish Colour still does not travel (ADR-0023). A receiving instance takes its own from the image it received, and that stays true when the image is a Generated Image.

## Acceptance criteria

- [ ] Exporting a recipe with a Generated Image writes the marking into the archive.
- [ ] Importing that archive restores it.
- [ ] Importing a Norish archive written before this ticket leaves its images unmarked and does not fail.
- [ ] Images from foreign archive formats arrive unmarked.
- [ ] Covered by the existing Norish archive round-trip test and a foreign-parser assertion.

## Comments

- 2026-08-22: Implemented (commit 24f69667). The writer emits `generated: true` only when set, so an unmarked image's wire shape is byte-identical to every pre-marking archive; the parser honours the field exactly when present. Foreign parsers untouched (they never produce gallery arrays); a Paprika assertion pins that their images arrive unmarked. Round-trip, writer, and parser tests extended.
