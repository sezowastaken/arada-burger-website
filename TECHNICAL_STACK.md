# Technical Documentation: Arada Burger

This document describes the architecture and development workflow. The project
follows a "simple and practical" philosophy — maintainability over cleverness.

For what is built and what comes next, see
[`docs/product/roadmap.md`](docs/product/roadmap.md).

## 1. Tech Stack

### Frontend

One Next.js application serves both the public website and the admin panel.

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) — SSR and SEO
  for the public site, plus the `/admin` routes.
- **Language:** TypeScript.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/).
- **Fonts:** `Epilogue` (display/headings), `Manrope` (body).
- **Icons:** [Lucide React](https://lucide.dev/).
- **Routing:** `/[lang]` for the bilingual public site (TR/EN), `/admin` for
  the operations panel.

### Backend

- **Runtime:** Node.js with [Fastify](https://fastify.dev/) + TypeScript.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/), migrations via
  `drizzle-kit`.
- **Database:** PostgreSQL 16.
- **Validation:** Fastify JSON Schema on route bodies/params.
  `removeAdditional` is disabled on purpose so unknown properties fail with a
  400 instead of being silently dropped.

### Infrastructure

- **Containerization:** Docker Compose (`postgres`, `backend`, `frontend`).
- **Version Control:** Git.

## 2. Project Structure

Separate concerns without monorepo overhead — `frontend/` and `backend/` each
have their own `package.json` and are not linked by workspaces.

```text
/
├── frontend/            Next.js app (public site + /admin)
│   └── src/
│       ├── app/[lang]/  public pages
│       ├── app/admin/   admin panel
│       ├── components/  ui/, layout/, admin/
│       ├── constants/   menuData.json (fallback menu data)
│       └── lib/api.ts   backend API client
├── backend/
│   ├── src/
│   │   ├── config/env.ts   environment loading/validation
│   │   ├── db/             client, schema, migrate, seed
│   │   ├── routes/         health, menu (public), admin
│   │   ├── app.ts          Fastify app factory
│   │   └── server.ts       entrypoint
│   └── drizzle/            generated SQL migrations
├── infra/               deployment config (reserved)
├── docs/                brand, product, working rules
└── docker-compose.yml   local development stack
```

## 3. Data Model

Current tables:

| Table | Purpose |
| --- | --- |
| `categories` | Menu categories, bilingual names, sort order, active flag |
| `products` | Menu items, bilingual name/description, price, image path, sort order, `is_active`, `is_available` |
| `product_price_history` | Every price change, recorded automatically in the same transaction as the update |

Two distinct flags, deliberately:

- `is_active` — the product is part of the menu at all. Inactive products
  disappear from the public menu entirely. Rows are never physically deleted,
  so price history and future order references survive.
- `is_available` — the product is on the menu but currently sold out.

## 4. API

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/menu` | Public menu — active categories and active products only |
| `GET` | `/api/products/:slug` | Single active product |
| `GET` | `/api/admin/categories` | All categories |
| `GET` | `/api/admin/products` | All products, including inactive/unavailable |
| `POST` | `/api/admin/products` | Create; slug derived from the English name |
| `PATCH` | `/api/admin/products/:id` | Update; a price change also writes history |
| `PATCH` | `/api/admin/products/:id/active` | Toggle menu visibility |
| `PATCH` | `/api/admin/products/:id/available` | Toggle sold-out state |

`/api/admin/*` is intentionally unauthenticated during local development.
Authentication is M7 and is required before any deployment.

## 5. Development Workflow

### Docker (recommended)

```bash
cp .env.example .env
docker compose up -d
cd backend && npm run db:seed   # one-time
```

The backend container runs pending migrations on every start before serving.

### Running on the host

```bash
cd backend  && npm install && npm run dev   # :4000
cd frontend && npm install && npm run dev   # :3000
```

Postgres still comes from Compose (`docker compose up -d postgres`). The root
`.env` is the single source of truth for credentials; host-side tools connect
via `localhost`, while the backend container overrides `DATABASE_URL` to reach
the `postgres` service.

### Database changes

```bash
cd backend
npm run db:generate   # generate SQL from src/db/schema.ts
npm run db:migrate    # apply
npm run db:studio     # inspect
```

Always read the generated SQL before applying it — check `onDelete`
behaviour, indexes and constraints rather than trusting the diff blindly.

### Conventions

- Follow the patterns already in `frontend/src/components/` and
  `backend/src/routes/`.
- The design system in [`DESIGN.md`](DESIGN.md) is binding for UI work.
- Mobile first — most customers open the menu on a phone.
- Bilingual (TR/EN) support is handled at the data level: every user-facing
  string has `tr` and `en` variants.

## 6. CI/CD (planned)

Not set up yet. When it is:

- Lint on every pull request
- `npm run build` and `npm run typecheck` as the build gate
- Docker image build for staging

Deployment topology and the staging/production branch flow are decided in M8.
