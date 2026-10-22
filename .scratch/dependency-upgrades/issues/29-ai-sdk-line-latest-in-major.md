# 29 — The AI SDK line moves to its latest in-major versions

Status: ready-for-agent
Blocked by: 05
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move `ai` and every `@ai-sdk/*` package in `packages/shared-server` to the newest version inside its current major. This ends the two `@ai-sdk/provider` / `provider-utils` copies that ticket 05 left behind.

At research time:

| Package                         | Today   | Latest in-major |
| ------------------------------- | ------- | --------------- |
| `ai`                            | 7.0.107 | 7.0.137         |
| `@ai-sdk/provider` (dev)        | 4.0.17  | 4.0.26          |
| `@ai-sdk/anthropic`             | 4.0.58  | 4.0.78          |
| `@ai-sdk/azure`                 | 4.0.75  | 4.0.99          |
| `@ai-sdk/google`                | 4.0.76  | 4.0.93          |
| `@ai-sdk/groq`                  | 4.0.46  | 4.0.59          |
| `@ai-sdk/mistral`               | 4.0.48  | 4.0.62          |
| `@ai-sdk/openai`                | 4.0.71  | 4.0.91          |
| `@ai-sdk/deepseek`              | 3.0.49  | 3.0.63          |
| `@ai-sdk/openai-compatible`     | 3.0.53  | 3.0.67          |
| `@ai-sdk/typesafe-ai`           | 3.0.4   | 3.0.17          |
| `ai-sdk-ollama`                 | 4.3.0   | 4.4.0           |
| `openai` (transcription client) | 7.5.0   | 7.32.0          |

- **Use one provider version.** Each package pins exact `@ai-sdk/provider` and `provider-utils` versions, so take a set that agrees on one of each. The newest releases on the same day usually do.
- **The `openai` client** is used only by the transcription client in `ai/runtime/providers.ts`.
- **Everything stays inside `ai/runtime/`** (ADR-0015).

## Acceptance criteria

- [ ] **One copy.** `pnpm why @ai-sdk/provider @ai-sdk/provider-utils` shows one version of each.
- [ ] **Runtime tests pass:**
  - temperature fallback;
  - structured output, including the plain-JSON degrade for OpenAI-compatible endpoints (#538);
  - image generation;
  - transcription.
- [ ] **E2E.** The E2E AI project passes.
- [ ] **Real-key smoke** (manual): one hosted provider plus the OpenAI-compatible or Ollama path.
- [ ] **AI boundary.** An `rg` check shows that no feature file imports `ai` or an `@ai-sdk/*` package.

## Comments

- Filed 2026-10-12, split out of ticket 05 when the maintainer limited 0.25 to safe fixes.
