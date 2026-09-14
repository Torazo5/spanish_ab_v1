# Groq Model Migration — Oral Conversation

**Project:** Spanish Practice Tool  
**Researched:** 2026-09-13  
**Scope:** Replacement for the oral conversation and grammar-explanation use of `llama-3.1-8b-instant` in `lib/groq.ts`.

---

## Decision

Groq documents **`openai/gpt-oss-20b`** as the direct replacement for
`llama-3.1-8b-instant`. For this app's short, streamed oral turn, use
**`qwen/qwen3.8-27b`** with `reasoning_effort: 'none'` instead: it reserves
the full 150-token budget for the visible Spanish reply.

Groq's current deprecation notice names `openai/gpt-oss-20b` as the direct replacement for `llama-3.1-8b-instant`. The old model was shut down for **free and developer-tier** usage on **2026-08-16**; Enterprise customers with committed spend are exempt. The current model catalog consequently lists Llama 3.1 8B as Enterprise-only, while GPT-OSS 20B is a production model with developer-plan limits.

Sources: [Groq deprecations](https://console.groq.com/docs/deprecations), [Groq supported models](https://console.groq.com/docs/models).

## Why it fits the oral flow

`openai/gpt-oss-20b` supports text input/output and JSON modes, has a 131,072-token context window, and Groq lists it at approximately 1,000 tokens/second. Groq also identifies its multilingual performance and advises specifying the target language and cultural context—already explicit in the app's Spanish conversation prompt. It remains suitable for concise grammar explanations; Qwen 3.8's documented non-reasoning mode is the better fit for the latency-sensitive oral-conversation stream.

Sources: [GPT-OSS 20B model page](https://console.groq.com/docs/model/openai/gpt-oss-20b), [Qwen 3.8 27B model page](https://console.groq.com/docs/model/qwen/qwen3.8-27b), [Groq reasoning controls](https://console.groq.com/docs/reasoning).

## Alternative (only if higher quality is worth higher cost)

**`openai/gpt-oss-120b`** is a current production model and is Groq's recommended successor for the retired 70B Llama model. It is *not* the direct successor for the retired 8B model, costs more, and is unnecessary for the latency-sensitive conversational turn. Keep it as an evaluation option, not the default migration.

Source: [Groq deprecations](https://console.groq.com/docs/deprecations), [Groq supported models](https://console.groq.com/docs/models).

## Integration notes

- The existing `chat.completions.create` and streaming pattern are compatible with the selected models. Use Qwen's `reasoning_effort: 'none'` for conversation; use low reasoning effort and exclude reasoning output for the GPT-OSS analysis calls.
- Retain the current persona, Spanish-language, difficulty, and response-length instructions. Groq's migration guidance recommends preserving parameters initially and testing model-specific output deliberately rather than changing model and prompt behavior at once.
- If the replacement returns **403** rather than 404, inspect the Groq organization's/project's model-permission settings: permissions can restrict a model even when it is otherwise available to the plan.

Sources: [GPT-OSS 20B quickstart](https://console.groq.com/docs/model/openai/gpt-oss-20b), [Groq model-migration guidance](https://console.groq.com/docs/prompting/model-migration), [Groq model permissions](https://console.groq.com/docs/model-permissions).

## Verification after implementation

1. Set `MODELS.conversation` to `qwen/qwen3.8-27b` and use `reasoning_effort: 'none'`.
2. Set `MODELS.observer` and `MODELS.listening` to `openai/gpt-oss-120b`, and `MODELS.drillDeeper` to `openai/gpt-oss-20b`.
3. Start a medium-difficulty oral session and confirm its initial streamed reply arrives.
4. Submit a spoken response and confirm the next streamed turn plus the grammar explanation both work.
5. If the account has an allow-list, add each selected model before testing.
