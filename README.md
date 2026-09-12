# Arada Burger

A simple, practical digital platform for Arada Burger: a public bilingual
website for customers, and an internal operations panel for the owners.

The philosophy is deliberately conservative — small, readable, maintainable,
and cheap to run on a single VPS. No microservices, no message queues, no
monorepo tooling.

## Architecture

```text
frontend/   Next.js 15 (App Router) + TypeScript + Tailwind
            ├── public site   /[lang]  — landing, menu, about, location (TR/EN)
            └── admin panel   /admin   — operations panel
backend/    Fastify + TypeScript, Drizzle ORM
            └── PostgreSQL
infra/      deployment configuration (reserved — not yet used)
docs/       brand guidelines, product scope, roadmap, working rules
```

`frontend/` and `backend/` are independent projects with their own
`package.json`. They are not linked by workspaces.

The public site and `/admin` live in the **same** Next.js app — one frontend,
two audiences.

## Quick start

```bash
cp .env.example .env          # first time only
docker compose up -d          # postgres → backend (auto-migrates) → frontend
cd backend && npm run db:seed # one-time: populate categories/products
```

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- API: http://localhost:4000

The backend container applies pending Drizzle migrations on every start
(idempotent). Seeding is always an explicit, separate step.

To run a service directly on the host instead, see `backend/README.md` and
`frontend/README.md`.

## Current status

Branch `main` is production and still holds the public-site-only version.
Active development happens on `feature/admin-backend`, which adds:

- Fastify + Drizzle + PostgreSQL backend
- `categories`, `products`, `product_price_history` schema
- Public menu API and an admin API with product CRUD, active/available
  toggles and automatic price-history recording
- `/admin` shell with a working Products page
- Docker Compose stack for local development

**Next up:** connect the public menu to the database. The admin panel already
reads and writes PostgreSQL, but `/tr/menu` and `/en/menu` still render
`frontend/src/constants/menuData.json`.

Admin endpoints are intentionally unauthenticated at this stage. Nothing is
deployed until authentication lands — see M7 in the roadmap.

## Documentation

| File | What it covers |
| --- | --- |
| [`docs/product/roadmap.md`](docs/product/roadmap.md) | Milestones M0–M9 and execution order |
| [`docs/product/project-scope.md`](docs/product/project-scope.md) | What this project is and is not |
| [`TECHNICAL_STACK.md`](TECHNICAL_STACK.md) | Stack details and workflow |
| [`DESIGN.md`](DESIGN.md) | The "Modern-Vintage Editorial" design system |
| [`docs/brand/brand-guidelines.md`](docs/brand/brand-guidelines.md) | Brand voice, colors, assets |
| [`docs/notes/working-rules.md`](docs/notes/working-rules.md) | Day-to-day working rules |
| [`CLAUDE.md`](CLAUDE.md) / [`GEMINI.md`](GEMINI.md) | Mandates for AI coding assistants |
