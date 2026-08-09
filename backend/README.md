# Backend

Fastify + TypeScript API for Arada Burger, using Drizzle ORM against PostgreSQL.

## Setup

```bash
npm install
cp .env.example .env   # then edit DATABASE_URL, PORT, etc.
```

## Scripts

- `npm run dev` — start the dev server with hot reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server
- `npm run typecheck` — type-check without emitting
- `npm run db:generate` — generate Drizzle migrations from `src/db/schema.ts`
- `npm run db:migrate` — apply migrations
- `npm run db:studio` — open Drizzle Studio

## Structure

```text
src/
├── config/env.ts     # environment variable loading/validation
├── db/
│   ├── client.ts      # Drizzle + pg pool
│   └── schema.ts       # table definitions (empty for now)
├── routes/health.ts   # GET /health
├── app.ts             # Fastify app factory
└── server.ts           # entrypoint
```
