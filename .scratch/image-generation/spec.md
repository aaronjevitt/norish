# Image Generation

Status: ready-for-agent

## Problem Statement

A recipe with no picture is a row of text. Norish's library, its dashboard cards, its share pages and its recipe pages are all built around a photograph of the dish, and a large share of recipes never get one: a paste import carries none, a URL import often scrapes something unusable, a hand-typed family recipe has nothing to scrape, and nobody photographs the stew they made on a Tuesday. Those recipes render on the plain theme background with an empty carousel and no Dish Colour, and they stay that way forever, because the only way to fix it is for a person to cook the dish and take a picture of it.

There is a second, smaller problem underneath. Some recipes do have an image and it is bad — a scraped thumbnail at 200 pixels, a stock photo of a different dish, a snapshot taken under kitchen strip lighting. The cook has no way to improve it short of cooking and shooting again.

Every other gap in a recipe has an answer already. Missing categories, missing nutrition, missing provenance and unlinked steps are all filled by Recipe Enrichment, automatically for new recipes and on request for old ones, with one coordinator deciding eligibility, one queue carrying the work and one lifecycle contract reporting progress. Images are the one gap that machinery does not reach.

## Solution

**Image Generation** becomes the seventh kind of Recipe Enrichment: AI draws the recipe a picture of its dish, and it reaches users through the machinery the other six already use.

It behaves differently from its siblings in one respect, and the difference is deliberate. The other kinds infer facts — a tag, a category, a country — and a fact can be right or wrong about the recipe. A **Generated Image** is invented, not inferred; it can only be apt or unconvincing. That is why it is the strictest gap-filler in the product on the automatic path (a recipe holding any image at all is left alone) and the most destructive on the manual one (a deliberate request replaces the primary image outright).

Three paths reach it, and they are not equally cautious:

- **Automatically**, for a newly usable recipe that has no image at all, when an administrator has switched the kind on. Quiet background work; a failure interrupts nobody.
- **On request**, from the actions menu on a recipe, on web and on mobile. This runs whatever is stored and replaces the primary image.
- **In bulk**, through the existing Enrich All Recipes sweep. By default it fills gaps only. With "Overwrite existing data" on it runs for every recipe, and the confirmation names the number of images it is about to generate before it starts.

Because most AI providers cannot draw at all, Image Generation reads its own provider configuration rather than the server's — a self-hoster running Ollama for text can still point image generation at Google or OpenAI (ADR-0024). And because an image model is prompted rather than reasoned with, one job makes two AI requests: a structured call turns the stored recipe into a short visual brief, and the image model draws from the brief (ADR-0024).

The result is stored in the recipe's gallery like any other image, at exactly 1280×720, marked in storage as generated. The marking is for the record, never for the reader: nothing in the interface distinguishes a Generated Image from a photograph. It travels in a Recipe Archive with its marking intact, so a receiving instance is told what it received.

## User Stories

1. As a cook, I want a recipe with no photograph to get a picture of its dish, so that my library reads as a collection rather than a list of titles.
2. As a cook, I want that picture to appear without my asking, so that recipes I import become presentable over time rather than through manual work.
3. As a cook, I want a generated picture to fill the recipe hero the way a photograph would, so that nothing about the layout tells me it was drawn.
4. As a cook, I want a generated picture to tint the recipe page like a photograph does, so that the page still takes its hue from the dish.
5. As a cook, I want image generation never to delay or block saving a recipe, so that importing stays as fast as it is today.
6. As a cook, I want a failed generation to leave my recipe untouched and interrupt me with nothing, so that a background failure is not my problem.
7. As a cook, I want a recipe that already has a photograph to keep it, so that automatic work never touches what I or my import source supplied.
8. As a recipe editor, I want to request a picture on demand, so that a recipe imported before this feature existed can get one.
9. As a recipe editor, I want a requested picture to become the recipe's primary image, so that the point of asking is the image people see first.
10. As a recipe editor, I want to request a picture even when the recipe already has one, so that I can replace a bad scraped thumbnail with something better looking.
11. As a recipe editor, I want a second request to replace the picture from the first rather than adding to it, so that my gallery does not fill with near-duplicates.
12. As a recipe editor, I want my other gallery images left alone and in order, so that only the primary slot is at stake.
13. As a recipe editor, I want to see that a picture is being generated right now, so that the wait reads as progress rather than as nothing happening.
14. As a recipe editor, I want a requested generation that fails to tell me it failed, so that I know to try again.
15. As a recipe editor, I want the action unavailable rather than broken when my server has no image provider, so that I am not told to retry something that cannot work.
16. As a recipe editor, I want to delete a generated picture like any other image, so that I am not stuck with one I dislike.
17. As a recipe editor on mobile, I want the same action in the same menu as on web, so that the feature is not desktop-only.
18. As a household member, I want a picture generated by a housemate to appear on my screen without reloading, so that we see one recipe.
19. As an Offline user, I want a generated picture cached with the recipes in my Warm Set, so that the recipe page is complete without a connection.
20. As an administrator, I want a switch that turns automatic image generation on and off, so that it matches the control I have over the other six kinds.
21. As an administrator, I want that switch off by default, so that upgrading never starts spending my API budget on its own.
22. As an administrator, I want the manual action available to editors regardless of that switch, so that turning off automation does not remove an editing tool.
23. As an administrator, I want to configure an image provider separately from my text provider, so that running a local text model does not cost me this feature.
24. As an administrator, I want the provider list to offer only providers that can actually generate images, so that I cannot configure something that will never work.
25. As an administrator, I want the endpoint and key to fall back to my AI configuration when the provider is the same, so that I am not typing one key twice.
26. As an administrator, I want to run image generation across my whole library, so that a collection built up before this feature existed catches up in one action.
27. As an administrator, I want that sweep to fill gaps only by default, so that a routine catch-up cannot touch a stored photograph.
28. As an administrator, I want "Overwrite existing data" to make the sweep run everywhere, so that I can restyle a whole library deliberately.
29. As an administrator, I want to be told how many images a sweep will generate before I confirm it, so that I can weigh it against my provider's per-image price.
30. As an administrator, I want to be warned that overwriting is destructive, so that I understand a photograph will not survive it.
31. As an administrator, I want to edit both the visual brief prompt and the image style prompt, so that I can tune what my instance draws like every other AI feature.
32. As an administrator, I want image generation jobs in the job monitor, so that failures are diagnosable the same way as the other kinds.
33. As an administrator, I want a recipe with no ingredients skipped, so that requests are not spent on recipes with nothing to draw from.
34. As a self-hoster, I want image generation to require no new infrastructure, so that upgrading is an ordinary release.
35. As a self-hoster with AI disabled, I want the feature inert rather than broken, so that Norish stays fully usable without an AI provider.
36. As a self-hoster with an AI provider that cannot draw, I want the rest of Recipe Enrichment unaffected, so that one unavailable kind does not degrade the other six.
37. As a self-hoster, I want generated images stored at a predictable size, so that my uploads directory does not grow unpredictably.
38. As someone receiving a Recipe Archive, I want to be told which images were drawn rather than photographed, so that my instance knows what it accepted.
39. As someone importing a foreign archive, I want its images treated as supplied, so that Mela and Paprika recipes are not mislabelled.
40. As a maintainer, I want image generation to add no new client integration point, so that the lifecycle surface stays one contract rather than two.
41. As a maintainer, I want the two AI requests to fail independently and classify correctly, so that a refusal is not retried and a timeout is.
42. As a maintainer, I want the queue's concurrency set low, so that a library sweep does not trip the provider's rate limits.

## Implementation Decisions

**A seventh enrichment kind.** `image-generation` joins the kind vocabulary, its automatic switch, the queue registry, the queue-name and worker-concurrency tables, the coordinator's per-kind setting map, and the manual-request surface. Everything that is currently total over the six kinds becomes total over seven, including the translation keys in both apps.

**Its own provider configuration.** A new Image Generation configuration block holds provider, model, endpoint and key, with the provider list restricted to those that expose an image model — OpenAI, Google, Azure, LM Studio and the generic OpenAI-compatible endpoint. Endpoint and key fall back to the AI configuration when the provider matches, exactly as transcription's block already does. There is no separate timeout: the existing AI timeout governs it (ADR-0015, ADR-0024).

**A third runtime entry point.** The AI Runtime gains an image-generation entry point beside structured generation and transcription, owning provider construction, the enabled and configured checks, token or image logging, and error classification. Image model construction lives with language-model and transcription construction inside the provider boundary. No feature calls the SDK (ADR-0015, ADR-0024).

**Two Prompts, two requests, one job.** A structured-generation request produces a short visual brief from the recipe; the brief plus the style Prompt goes to the image model. Both Prompts are administrator-editable, appended to rather than interpolated (ADR-0016), and both join the shipped-defaults set and the retired-defaults regeneration. The brief is written in English whatever language the recipe is in, is never stored, and is never shown.

**Eligibility.** The coordinator's blanket "no ingredients means insufficient input" rule applies. On top of it: an ordinary automatic run is skipped when the recipe has any image at all — any gallery row, or the legacy scalar — reported as supplied data present. A manual request and an administrator's refresh are not subject to that check. A new skip reason covers "no image provider configured", and it applies to every origin, including manual. The automatic switch gates the automatic path and the bulk sweep together, as it does for every kind.

**The write.** One repository operation, one transaction: the generated image is written at order 0, and the row that held order 0 is deleted along with its file. Every other gallery row keeps its contents and its relative order. A recipe therefore holds at most one Generated Image (ADR-0025). The operation is the only place a Generated Image is written, and the worker composes no queries of its own.

**Marking.** A column on the recipe-images table records that an image was generated. It is carried in the recipe DTO, written by the replacement operation, and read only by archive export. No interface surface renders it.

**Image shape.** The provider is asked for its widest supported landscape. On save the bytes are cropped to exactly 1280×720 and normalised to JPEG — a cover-crop variant of the existing recipe-image save path, which today preserves aspect ratio and does not crop. The existing size and format validation still applies.

**Dish Colour.** Replacing the primary changes it, so a successful run recomputes it from the image it just wrote (ADR-0023).

**Lifecycle and realtime.** The kind uses the existing five-state lifecycle, the existing per-kind event, and the existing canonical recipe update on success. Origin decides who hears about a failure, unchanged: automatic runs stay quiet, a manual request tells its requester.

**Failure classification.** An unusable brief and an unusable image are retryable. A refused image and a missing or invalid image configuration are not, and are raised so the worker runner stops burning attempts, as it already does for AI being switched off.

**Bulk pre-flight count.** The sweep already walks every recipe to decide eligibility. When image generation is among the enabled kinds, the confirmation modal states how many images the sweep will generate, distinguishing the default and overwrite cases. The count is a per-request read, not stored configuration.

**Archive.** A Generated Image travels as ordinary media with its marking preserved on export and honoured on import. Foreign archive formats carry no such field, so their images arrive unmarked, which is correct: they were supplied.

**Surfaces.** The manual trigger joins the recipe actions menu on web and on mobile, reusing the existing busy state, lifecycle labels and error toasts. No new UI pattern, no editor-form control, and no badge anywhere.

**Concurrency.** The new queue runs at concurrency 1 rather than the 2 every other enrichment queue uses, because image APIs are billed per call and rate-limited hard.

## Testing Decisions

A good test here asserts external behaviour: what is stored, what is skipped, what the user is told. It does not assert that a particular helper was called with particular arguments unless that call _is_ the observable behaviour at that seam. Every seam below already exists; only the fake provider's image route and one new worker test directory are new.

**Real database — the destructive write.** The replacement operation is tested against testcontainers, beside the existing recipe dish-colour database test: the previous primary row is gone, the generated row is at order 0 with its marking set, the remaining gallery kept its contents and relative order, a second run replaces its own predecessor rather than accumulating, and a recipe with no images ends with exactly one. This is the seam that matters most, because a mocked repository cannot prove a delete deleted anything.

**Coordinator — eligibility.** Extends the existing coordinator test: automatic is skipped for a recipe with a gallery image, for one with only the legacy scalar, and when the automatic switch is off; a manual request and a refresh are not skipped in any of those cases; every origin is skipped when no image provider is configured; a recipe with no ingredients is skipped as insufficient input.

**Worker — orchestration.** A new test directory alongside the existing per-kind worker tests, following the recipe-provenance worker test's shape: the brief is requested before the image, the replacement operation is called, the Dish Colour is recomputed, an empty or unusable image fails rather than silently succeeding, and a refusal is raised as unrecoverable while a timeout is not.

**AI features and runtime.** The briefer is tested against a mocked runtime, as the existing enrichment inferrers are. The runtime's image entry point is tested against the fake provider, beside the existing transcription runtime test — including the disabled and unconfigured cases.

**Media — the crop.** A test beside the existing dish-colour media test asserting the saved file is exactly 1280×720 for a landscape source and for a square one, and that the existing size and format validation still rejects what it rejected before.

**Prompts and configuration.** The new Prompts join the existing shipped-default and retired-default assertions, which already fail when a shipped prompt changes without regeneration. The configuration block joins the existing AI config schema test, including the endpoint and key fallback.

**Routers.** The manual request's rejection when no image provider is configured, and the sweep's pre-flight count, join the existing enrichment and admin router tests.

**Archive.** The marking's survival joins the existing Norish archive round-trip test; a foreign-parser test asserts imported images arrive unmarked.

**Browser E2E**, in the existing `ai` project, which is required because these are user-visible workflows whose acceptance depends on browser behaviour. The fake AI provider gains an image-generation route returning a fixture JPEG. Two specs extend what is already there: the manual trigger from the actions menu replaces the primary image and the page re-tints, following the existing recipe-enrichment spec; and the bulk sweep generates for gap recipes only by default and for all recipes with overwrite on, following the existing bulk enrichment spec.

## Out of Scope

- **Any visible marking of a generated image.** Decided against for this release; the marking exists in storage and in archives only.
- **Undo, trash, or recovering a replaced photograph.** Norish has no trash, and this feature does not introduce one.
- **Keeping more than one Generated Image per recipe**, or comparing candidates before choosing.
- **A per-recipe prompt or hint** ("make it darker", "no garnish"). The Prompts are server-wide.
- **A generate button in the recipe editor's gallery**, which would conflict with the form's local gallery state.
- **Step images.** Only the recipe's primary image is in scope.
- **Image editing, upscaling, or generating a variation of an existing photograph.**
- **Cost accounting, per-user quotas, or spend telemetry.** The bulk pre-flight count is the only cost surface.
- **A hard cap on images per sweep.**
- **Video generation.**

## Further Notes

The two hard decisions are recorded as ADRs rather than only here: ADR-0024 for the third runtime entry point and the separate provider block, ADR-0025 for the destructive primary-slot write. Both carry their rejected alternatives, several of which look like obvious improvements from the outside — read them before changing either behaviour.

The marking survived two decisions that removed its other jobs. Eligibility asks only whether an image exists, replacement consumes the primary slot whatever is in it, and no surface renders it. Its sole live purpose is telling a receiving instance what an archive contained. That is a thin justification for a migration and it was taken knowingly; if archive fidelity is ever dropped, the column should go with it.

Provider capability was read from the installed provider packages, not from documentation. It is a fact about which packages expose an image model, and it can change under a dependency bump — re-check it when the AI SDK line moves.
