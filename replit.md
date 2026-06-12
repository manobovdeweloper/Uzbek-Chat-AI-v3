# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### O'zbek AI Chat (`artifacts/uzbek-ai-chat`)
- React + Vite frontend at `/` (port auto-assigned)
- Uzbek-language AI chatbot using GPT-5.2 via Replit AI Integrations
- Features: real-time SSE streaming, conversation history, sidebar navigation
- Two tiers: free (unlimited text + 3 images/day) and premium ($2/mo, unlimited HD images + PDF + Voice)

### O'zbek AI Mobile (`artifacts/uzbek-ai-mobile`)
- Expo React Native app at `/mobile`
- Cyberpunk neon dark theme, mirrors web tier system

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Routes:
  - `/api/openai/conversations` — CRUD + SSE streaming chat (`POST .../messages`)
  - `/api/openai/images/generate` — image generation via `gpt-image-1` (returns `dataUrl`)
  - `/api/premium/activate` — POST `{code}` validates 6-digit single-use code, deletes on success
  - `/api/premium/admin/codes` — admin GET/POST gated by `ADMIN_SECRET` env header `x-admin-secret`
- DB: PostgreSQL `conversations`, `messages`, `premium_codes` (drizzle)
- On startup, if `premium_codes` table is empty, seeds 20 random 6-digit codes and logs them once

## Premium System
- 6-digit numeric activation codes stored in `premium_codes` table
- Single-use: row is deleted via `DELETE ... RETURNING` on successful activation
- Frontend persists `isPremium=1` in localStorage / AsyncStorage after server returns ok
- Free tier: unlimited text chat, 3 image generations / 24h (counter in localStorage / AsyncStorage)
- Premium tier: unlimited HD images, PDF analyzer, voice chat
- Payment flow: user pays card `5614 6818 5899 7095` → DM Telegram `@manobov_deweloper` with screenshot → admin sends a 6-digit code from the seeded pool
- Initial seeded codes are visible in the API server's startup log (search for `PREMIUM ACTIVATION CODES`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration

Uses Replit AI Integrations (OpenAI) — no user API key needed. The AI is configured to respond exclusively in Uzbek via a system prompt.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
