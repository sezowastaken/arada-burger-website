# Infrastructure

Reserved for future infrastructure/deployment configuration (e.g. `nginx`,
VPS deployment config) — not yet added.

The local development Docker Compose stack (`postgres`, `backend`,
`frontend`) lives at the repo root: see `../docker-compose.yml` and
`../.env.example`.

## Fresh development setup

```bash
# from the repo root
cp .env.example .env   # first time only
docker compose up -d   # starts postgres, then backend (auto-migrates), then frontend
cd backend && npm run db:seed   # one-time: populate categories/products
```

The `backend` container runs pending Drizzle migrations automatically on
every start (safe/idempotent — already-applied migrations are skipped) before
starting the server, so the schema is always up to date. Seeding is a
separate, explicit step and is never run automatically.
