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

- `npm run db:seed` — insert categories/products into an empty database from
  `frontend/src/constants/menuData.json`. Insert-only: rows that already exist
  are left alone, so re-running it never overwrites an admin edit.
- `npm run db:export-menu` — regenerate that same JSON **from** the database.
  It is the frontend's emergency fallback menu, shown when the API is
  unreachable, so it has to be refreshed after menu changes or an outage will
  serve stale prices. Host-only: it writes into the frontend source tree, which
  the backend container does not have.

The two run in opposite directions on purpose. PostgreSQL is the source of
truth; the JSON is a snapshot of it.

## Structure

```text
src/
├── config/env.ts      # environment variable loading/validation
├── db/
│   ├── client.ts      # Drizzle + pg pool
│   ├── schema.ts      # categories, products, product_price_history
│   ├── migrate.ts     # applies pending migrations on start
│   ├── seed.ts        # one-time data population (insert-only)
│   └── exportMenu.ts  # database → frontend fallback JSON
├── routes/
│   ├── health.ts      # GET /health
│   ├── menu.ts        # public menu API (/api)
│   ├── admin.ts       # admin API (/api/admin) — unauthenticated for now
│   └── uploads.ts     # product image upload (/api/admin/uploads)
├── uploads/
│   └── imageFile.ts   # format sniffing and stored-filename rules
├── app.ts             # Fastify app factory
└── server.ts          # entrypoint
```

See [`../TECHNICAL_STACK.md`](../TECHNICAL_STACK.md) for the endpoint list and
the data model.

## Product images

Uploaded images are written to `backend/uploads/` (overridable with
`UPLOAD_DIR`) and served from `/uploads/<filename>`. Under Docker Compose that
directory is the `uploads_data` volume, so images survive image rebuilds.

The frontend proxies `/uploads/*` to this service (see `next.config.mjs`), so
the database stores an origin-relative path and `next/image` keeps treating
product photos as local assets.

The stored format is decided by sniffing the file's leading bytes, not by the
browser's Content-Type — phones frequently send `application/octet-stream`, and
a declared type is trivially forged. PNG, JPEG and WEBP are accepted, up to
5 MB.

Replacing a product's image leaves the previous file on disk. There is no
delete endpoint yet: an orphaned file is harmless, whereas deleting one that is
still referenced somewhere is not.
