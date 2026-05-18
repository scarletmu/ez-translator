# AGENTS.md

Scope: entire repo. Authoritative index for LLM agents. If conflicts arise, the three design docs win; only deviate when the user explicitly requests it AND update docs in the same task.

## 1. Status & Stack

- MVP shipped: (a) selection translate, (b) screenshot region translate, (c) popup paste translate.
- Stack: WXT 0.19 + React 19 + TypeScript 5.7 + Zod 3.24. Target: Manifest V3.
- Package manager: `pnpm` (use `npx pnpm@9`). Do not introduce a second lockfile.
- Read before non-trivial work:
  - `docs/architecture.md` — module boundaries & dependency direction
  - `docs/ui-design.md` — interactions, states, copy, component hierarchy
  - `docs/development-setup.md` — bootstrap order, local dev flow

## 2. MVP Scope (hard limits)

In scope: selection translate, screenshot region translate, popup paste translate.

Constraints:
- Browser talks to model providers directly. No backend.
- Text-translate always has one base config.
- Screenshot translate may either (1) use one multimodal model end-to-end, or (2) split into "extract + translate" with separate configs.
- API keys persist locally inside the extension.
- All reuse is explicit. No auto-fallback, auto-inherit, or auto-mirror.
- Screenshot translate uses vision LLM, NOT OCR.
- Screenshot translate uploads only the user-cropped region, never the full page.
- Out of scope for MVP: multi-account, history, full-page translate, streaming.

## 3. Repo Layout (do not diverge)

```
.
├─ AGENTS.md
├─ README.md
├─ docs/{architecture,ui-design,development-setup}.md
├─ public/icon/
├─ src/
│  ├─ entrypoints/{background.ts, content.tsx, popup/, options/}
│  ├─ features/{selection-translate,screenshot-translate,paste-translate,settings}/
│  ├─ components/        # reusable UI
│  ├─ services/{llm,messaging,storage,permissions,capture,dom}/
│  ├─ contracts/         # type contracts
│  ├─ schemas/           # Zod runtime validation (*.schema.ts)
│  ├─ constants/
│  ├─ errors/            # error codes & classes
│  ├─ hooks/             # useXxx.ts
│  └─ styles/
├─ package.json, tsconfig.json, wxt.config.ts
```

Note: `entrypoints/` lives under `src/` because `wxt.config.ts` sets `srcDir: 'src'`; `@` alias maps to `src/`.

Layer roles:
- `entrypoints/` — extension entry mounting only, no business logic.
- `features/` — by business capability.
- `services/` — by technical responsibility.
- `contracts/` + `schemas/` + `constants/` + `errors/` — internal contract layer.

## 4. Entry Responsibilities (no mixing)

| Entry | Owns | Forbidden |
|---|---|---|
| `content script` | selection detection, screenshot overlay, DOM mount, in-page floats | reading API keys directly |
| `background` | API key read, provider requests, permission checks, config R/W, screenshot orchestration, error normalization | — |
| `popup` | entry points for text translate & screenshot mode | duplicating provider call logic |
| `options` | text config, screenshot pipeline config, per-step permission requests, per-step validation, config clearing | duplicating provider call logic |

Also forbidden:
- UI components calling providers directly.
- DOM / browser-extension-API logic leaking into generic presentational components.

## 5. UI & Interaction

- Selection translate: small button next to selection + in-place float.
- Screenshot translate: explicitly launched from popup. Do NOT merge with the selection button.
- Screenshot mode must support `Esc` cancel.
- Unconfigured state → guide user to settings, do NOT show raw network error.
- Result UI: dual block of "source / recognized source + translation".

## 6. Config & Permissions

- Persist with `chrome.storage.local`. Never use `chrome.storage.sync` for API keys.
- Text config and screenshot-pipeline config are stored & validated separately.
- Screenshot pipeline MAY explicitly reuse text config; implicit sharing is forbidden.
- All permission logic centralized in `src/services/permissions`.
- For every custom profile endpoint, request its origin permission explicitly per stage when actually enabled.

## 7. Screenshot Pipeline

Required flow: user trigger → in-page region select → background captures → local crop → upload crop only.

- Never upload the full-page screenshot.
- Never capture silently without explicit user action.
- Image size, region size, and failure feedback go through unified error codes.

## 8. Contracts & Provider Calls

Contract layer (centralized, not scattered):
- text & screenshot pipeline config shapes
- translation request/response types
- connection-validation results
- error codes
- message types
- constants

All provider requests go through `src/services/llm` (text translate, screenshot translate, connection validation, response parsing, error mapping). Direct `fetch` to providers from `features` / `components` / `entrypoints` is forbidden.

## 9. TS, Naming, Style

- TS strict mindset. Prefer explicit types for config, messages, service I/O, translation results.
- `any` only at unavoidable 3rd-party seams; converge ASAP.
- Runtime input validation via `zod`, not static types alone.
- Naming: components `PascalCase.tsx`; hooks `useXxx.ts`; services `kebab-case.ts`; `*.schema.ts`, `*.parser.ts`, `*.builder.ts`.
- Short functions; do not mix UI / network / state / parsing in one function. Compose small functions.
- No single-letter names. No meaningless comments — only when intent is non-obvious.
- Avoid implicit shared state; pass args explicitly.

## 10. Errors & User Feedback

- Use unified error codes.
- User-visible messages must be understandable; never surface raw stack traces.
- Distinguish: unconfigured, unauthorized, missing text-translate config, missing screenshot direct-translate config, missing screenshot-extract config, missing screenshot-translate config, missing text model, missing vision model, text too long, image too large, capture failure, network failure, model lacks vision.
- Tell the user the next step, not just the failure.

## 11. Security & Privacy

- API keys: `chrome.storage.local` only, explicit config field, read only by `background`.
- Never put keys into page context, URL, logs, or `storage.sync`.
- Never upload full-page screenshots. Never auto-capture without user action.
- Never log full API keys, full `imageBase64`, sensitive source text, or large screenshot payloads.
- User-facing errors must not leak keys or stack traces.

## 12. Doc Sync (mandatory)

Update docs whenever you change: directory structure, config shape, provider call strategy, UI interaction or state machine, screenshot/vision strategy.

Routing:
- architecture boundary → `docs/architecture.md`
- interaction / layout / state → `docs/ui-design.md`
- dev workflow / scaffold → `docs/development-setup.md`
- global rules → this file (`AGENTS.md`)

## 13. Test Order

Once scripts exist: nearest-to-change checks → page-capability checks → full build/test.

Coverage focus: config storage R/W; permission grant/deny branches; text & screenshot message flow; crop and result-float states; unconfigured + connection-validation states.

If the task is doc-only: do not generate implementation code or unrelated scaffolding.

## 14. Change Boundaries

- Do not create branches or commits unless the user asks.
- Do not add deps unrelated to the task.
- No "while I'm here" renames or directory moves.
- Do not expand MVP scope without an explicit request.
- Keep diffs minimal. Fix root causes, not symptoms.
- Any change to system boundary / config shape / interface shape / dir responsibility → sync the relevant doc in the same task.

## 15. Suggested Next Iterations (post-MVP)

1. Unit + integration tests, focus on `storage`, `permissions`, `llm`.
2. Harden error edges (network timeout retry, permission-denied recovery).
3. UI polish (dark mode, transitions, responsive).
4. Consider streaming output.
5. Always update docs before code when a boundary or interaction shifts.
