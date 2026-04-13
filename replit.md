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

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- Routes: `/api/openai/conversations` (CRUD + SSE streaming chat)
- AI integration: `@workspace/integrations-openai-ai-server`
- DB: PostgreSQL `conversations` and `messages` tables via Drizzle ORM

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration

Uses Replit AI Integrations (OpenAI) — no user API key needed. The AI is configured to respond exclusively in Uzbek via a system prompt.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
