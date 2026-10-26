# Tutor spike: AI SDK and Gemini

A one-hour spike, on 2026-10-26, to settle how the tutor will work before writing specs 04 and 05. It built a streaming route handler, a test page using the AI SDK's chat hook and one client-side tool, `setCannonSpeed(kmPerSecond)`, that changes a number on the page. The code is kept on the local branch `spike/tutor` for reference; it has no tests and is not merged.

## Versions

| Package | Version |
|---|---|
| `ai` | 7.0.153 |
| `@ai-sdk/react` | 4.0.157 |
| `@ai-sdk/google` | 4.0.105 |
| `zod` | 4.6.7 |

On Next.js 16.4.2, React 19.3.0 and Node 24.

AI SDK 7 differs from most examples online, which are written for versions 4 to 6:

- The system prompt option is `instructions`, not `system`. System messages inside `messages` are rejected by default.
- The full event stream of `streamText` is `result.stream`, not `fullStream`.
- A chat route returns `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`.
- The Google provider's names dropped `GenerativeAI` (`createGoogle`, `GoogleProvider`). It still reads its key from `GOOGLE_GENERATIVE_AI_API_KEY`.
- The packages are ESM only and need Node 22 or later.

## Model: `gemini-3.5-flash-lite`

| Model | Free tier (RPM / TPM / RPD) | First token | Tool calls | Notes |
|---|---|---|---|---|
| `gemini-3.5-flash-lite` | 15 / 250K / 500 | 490–945 ms | 3 of 3 | Chosen |
| `gemini-3.1-flash-lite` | 15 / 250K / 500 | 510–1,060 ms | 2 of 2 | Fallback candidate |
| `gemini-3.8-flash` | 5 / 250K / 20 | not measured | not measured | Two 503 "high demand" errors; one request took 299 s to its first token |

- **`gemini-3.5-flash-lite` is the default.** It has the highest free-tier limits of the Gemini text models, the lowest first-token latency, and it called the tool every time it was asked to launch the cannon. Its Spanish answers were correct and short (see "Answer quality").
- **The Flash models are not usable on the free tier.** 20 requests per day is too few for a public site, and `gemini-3.8-flash` was overloaded during the spike.
- **Thinking is off on Flash-Lite.** Its responses used 0 reasoning tokens whether or not `thinkingLevel` was set, and setting it changed nothing. `gemini-3.8-flash` rejects `thinkingLevel: "minimal"` with a 400. The tutor therefore sets no thinking option.
- **`gemini-3.1-flash-lite` is a possible fallback.** Quotas are per model, so falling back to it after a 429 would double the requests available per minute. Not tested.

## Free-tier limits

Google's rate-limits page no longer lists free-tier numbers; it points to AI Studio. The numbers above are from AI Studio's rate-limit page (all models, free tier) on 2026-10-26. They match the limits named in the 429 responses during the spike (`limit: 15` for `gemini-3.5-flash-lite`, `limit: 5` for `gemini-3.8-flash`).

- **Limits apply per project and per model,** not per API key. The daily quota resets at midnight Pacific time.
- **Failed requests count.** On `gemini-3.8-flash`, four 400s and two 503s inside one minute were followed by a 429.
- **The limits are shared by every visitor.** 15 requests per minute and 500 per day cover the whole site, not each user, so the tutor route needs its own rate limiting (spec 05).
- **Free-tier data is used to improve Google's products,** according to the pricing page (updated 2026-10-22). This matters for a learning app and belongs in spec 05 and the README.

## Tool calls

The spike declared `setCannonSpeed` on the server without an `execute` function, which makes it a client-side tool. One call flows like this:

1. The model emits the tool call. The server streams it as `tool-input-available` and the stream ends.
2. On the page, `useChat`'s `onToolCall` updates the state (the number on the page) and calls `addToolOutput` with the result.
3. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` sends the whole conversation again, now including the tool result.
4. The model answers in text, knowing the tool's result.

What this means:

- **One action costs two requests:** about 1.5 s locally (870 ms for the tool call, 660 ms for the explanation), and two of the 15 requests per minute. The model never wrote text alongside the tool call, so the second request cannot be skipped.
- **Server-side tools cannot change the page.** A tool with `execute` runs in the route handler, so it suits only pure calculations. Everything that operates the lesson is a client-side tool.
- **The tool's result should be what really happened.** Without it the model guesses: at 8 km/s it said the projectile "ha entrado en órbita" without seeing the simulation. If the result carries the speed applied and the outcome, the model explains the real result.
- **Do not validate with the schema.** With `max(15)` in the zod schema, the model once sent 50 km/s anyway. The SDK rejected the input on the server (`tool-input-error`), the tool part lost its static typing (`dynamic: true`), and the learner got no reply. Another time it clamped to 15 on its own. Validation belongs in the code that runs the action, which reports a rejected input as the tool's result so the model can explain it.
- **Types come from one definition.** With the tools defined in one module, `UIMessage<never, never, InferUITools<typeof tools>>` gives `useChat` typed tool inputs and outputs, with no casts.

## Error handling

**What a free-tier limit looks like.** When Google returns a 429, the SDK raises an `APICallError` with:

- `statusCode` 429 and `isRetryable: true`;
- `data.error.status` set to `RESOURCE_EXHAUSTED`;
- a `QuotaFailure` detail naming the quota (`quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier"`) and its limit (`quotaValue: "5"`);
- a `RetryInfo` detail with a `retryDelay` such as `"5s"`.

With the default `maxRetries: 2`, the SDK retries with backoff and then raises a `RetryError` (`reason: "maxRetriesExceeded"`) whose `lastError` is the `APICallError`. The learner waits 7 to 10 s before seeing anything, and each retry spends quota.

**What reaches the browser.** The response status is 200, because the stream has already started. The error arrives as one stream chunk, `{"type":"error","errorText": …}`. `errorText` is whatever `toUIMessageStream`'s `onError` returns; by default the SDK replaces the reason with a generic message. `useChat` then sets `status` to `"error"`, and `error.message` holds that text.

**Showing a Spanish message.** The pattern verified in the browser:

- `onError` on the server maps each error to a stable code: `rate-limited` for a 429 (checked directly, or as a `RetryError`'s `lastError`), `unavailable` for anything else.
- The page maps the code to Spanish text from `src/content/es.ts` (for example, "El tutor ha recibido demasiadas preguntas. Espera un minuto y vuelve a intentarlo.").
- With `maxRetries: 0`, the message appears at once. Retrying a 503 once might be worth it; retrying a 429 is not.

**Not verified:** the daily limit (500 requests) was not reached. It is expected to have the same shape with a per-day `quotaId`, which would let the message say "tomorrow" instead of "in a minute".

**A request can hang.** One `gemini-3.8-flash` request took 299 s to its first token. The route needs a timeout, not only `maxDuration`. AI SDK 7 lists a `timeout` request option; it was not tested.

## Answer quality

Four questions in Spanish, with a short system prompt describing the lesson and the cannon:

| Question | Answer |
|---|---|
| ¿Por qué la Luna no se cae a la Tierra? | Correct: it is falling, but it moves sideways so fast that it keeps missing the Earth. It offered to try the cannon. |
| Si la distancia entre la Tierra y la Luna fuera el doble, ¿cómo cambiaría la fuerza? | Correct: four times weaker, with the reason. |
| En el espacio no hay gravedad, por eso los astronautas flotan, ¿verdad? | Corrected the misconception: gravity at the space station's height is about 90 % of the surface value, and the astronauts are in free fall. |
| ¿Qué pasa si disparo el cañón más rápido que la velocidad de escape? | Correct but simplified: "never comes back". |

- "Lanza el cañón a 8 km/s" called the tool every time (5 of 5, across both Flash-Lite models). A vague request ("la velocidad justa para que entre en órbita") chose 8 km/s.
- Answers use Markdown (`**bold**`). The panel has to render it, or the instructions have to forbid it.
- The model quotes the tool's limits to the learner ("entre 0 y 15 km/s").

## Latency

Time to the first token, measured on 2026-10-26 from the development machine, with the route running under `next dev`.

| Path | First token |
|---|---|
| Direct to Google, `gemini-3.5-flash-lite` (6 questions) | 490–945 ms, about 600 ms typical |
| Direct to Google, `gemini-3.5-flash-lite`, tool call (2) | 480–570 ms |
| Direct to Google, `gemini-3.1-flash-lite` (6 questions) | 510–1,060 ms |
| Through the route, measured on the server | 470–880 ms |
| Through the route, measured in the browser | 590–900 ms |
| One cannon launch, both requests | about 1.5 s |

A Vercel deployment was not measured; spec 05 measures it on the real deployment.

## Other findings

- **Gemini's `thoughtSignature` travels to the browser** in the parts' `providerMetadata`, and has to come back with the conversation for tool calls to work. `convertToModelMessages` handles it, but any code that stores or trims messages must keep that metadata.
- **Retries hide errors for seconds.** See "Error handling".

## Environment variables

Proposed for a committed `.env.example`:

```bash
# Google AI Studio API key (free tier). Required. @ai-sdk/google reads this name.
GOOGLE_GENERATIVE_AI_API_KEY=
# The tutor's model as provider:model, resolved with the AI SDK's createProviderRegistry.
TUTOR_MODEL=google:gemini-3.5-flash-lite
```

- **One variable for the model.** The `provider:model` form is the AI SDK's own registry syntax, so the provider and the model cannot disagree. A new provider means adding its package to the registry and changing the value.
- **The key keeps the provider's name,** so the provider finds it without configuration.
- **Retries, timeout and thinking are set in code,** not in the environment.
- **`.gitignore` ignores `.env*`,** which includes `.env.example`. Spec 05 adds a `!.env.example` exception.
