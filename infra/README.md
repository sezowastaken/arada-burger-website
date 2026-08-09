# Infrastructure

Docker Compose stack for local development (and reusable as a base for VPS deployment).

Currently runs:
- `postgres` — PostgreSQL 16, persisted in a named volume (`postgres_data`)
- `backend` — the Fastify API, built from `../backend/Dockerfile`

`admin` and `nginx` will be added to this same stack later — not yet.

## Usage

```bash
cd infra
cp .env.example .env   # then edit POSTGRES_PASSWORD, etc.
docker compose up --build
```

- Backend: http://localhost:4000/health
- PostgreSQL: localhost:5432 (or `POSTGRES_PORT` if overridden)

Stop with `docker compose down` (add `-v` to also drop the `postgres_data` volume — this deletes all data).
