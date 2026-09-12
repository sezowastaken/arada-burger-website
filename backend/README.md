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

- `npm run db:seed` — populate categories/products from the frontend menu data

## Structure

```text
src/
├── config/env.ts      # environment variable loading/validation
├── db/
│   ├── client.ts      # Drizzle + pg pool
│   ├── schema.ts      # categories, products, product_price_history
│   ├── migrate.ts     # applies pending migrations on start
│   └── seed.ts        # one-time data population
├── routes/
│   ├── health.ts      # GET /health
│   ├── menu.ts        # public menu API (/api)
│   └── admin.ts       # admin API (/api/admin) — unauthenticated for now
├── app.ts             # Fastify app factory
└── server.ts          # entrypoint
```

See [`../TECHNICAL_STACK.md`](../TECHNICAL_STACK.md) for the endpoint list and
the data model.
