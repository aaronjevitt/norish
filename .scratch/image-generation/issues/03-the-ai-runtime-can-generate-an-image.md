# 03 — The AI Runtime can generate an image

Status: resolved
Blocked by: 01

Spec: `.scratch/image-generation/spec.md`

## What to build

The AI Runtime gains a third entry point beside structured generation and transcription. Given a Prompt name and appended sections it returns image bytes from the configured image provider, or a typed error that says whether retrying is worth it. Nothing calls it from a recipe yet.

## Notes

ADR-0024 is the decision this implements. The third entry point is a deliberate amendment to ADR-0015's "two entry points, because Norish makes two genuinely different kinds of request" — image generation takes no schema, returns bytes, and leaves the structured-output strategy nothing to parse.

Image model construction lives beside language-model and transcription construction, inside the provider boundary and on the shared transport. No feature constructs a provider client, and no feature passes a finished prompt string (ADR-0016).

The provider is asked for its widest supported landscape. Providers differ in whether they accept a size or an aspect ratio, and the widest landscape differs between them. Cropping to the stored size is ticket 02's job, not this one's.

Errors follow the existing classification rather than a new one: AI disabled and a missing or invalid image configuration never retry, a provider refusal never retries, an empty or unusable response always retries, and provider failures follow the SDK's own retryability.

## Acceptance criteria

- [ ] The runtime exposes an image-generation entry point beside structured generation and transcription.
- [ ] It reads the Image Generation configuration, not the AI configuration's provider.
- [ ] It refuses non-retryably when AI is disabled and when no image provider is configured.
- [ ] A provider refusal is non-retryable; an empty or unusable response is retryable.
- [ ] The request runs on the shared transport under the existing AI timeout.
- [ ] One log line per request records provider, model and feature.
- [ ] Covered by a runtime test against the fake AI provider, beside the existing transcription runtime test.

## Comments

- 2026-08-22: Implemented (commit 6d9ba9fa). `generateImage` beside `generateStructured`/`transcribe`, reading the image block with the matching-provider fallback, image-model construction in `providers.ts` on the shared transport under the AI timeout. Landscape per provider: size 1792×1024/1536×1024 for the DALL·E/gpt-image families, aspect ratio 16:9 for Google, exactly 1280×720 for the OpenAI-compatible endpoints (no published size list to lean on — a documented pragmatic reading of "widest supported landscape"). `maxRetries: 0` on the SDK call so the queue's attempts are the one retry budget for per-call-billed APIs; `NoImageGeneratedError` maps to the retryable response error. Runtime test against a local HTTP fake beside the transcription test, including the one-call-per-request assertion.
