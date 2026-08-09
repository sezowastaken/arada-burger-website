# CLAUDE.md - Architecture Rules for Arada Burger

This file contains foundational architecture rules for Claude Code when working in this repository. Read this before proposing or implementing changes.

## Architecture

- **Frontend:** the existing Next.js site under `frontend/`. Do not restructure or migrate it.
- **Backend:** Fastify + TypeScript under `backend/`.
- **Database:** PostgreSQL.
- **ORM:** Drizzle ORM (`drizzle-kit` for migrations).

## Rules

1. **Keep architecture simple.** No Redis, message queues, microservices, Kubernetes, or other unnecessary abstractions.
2. **Separation, not complexity.** `frontend/` and `backend/` are independent projects (separate `package.json`, no npm workspaces/monorepo tooling linking them).
3. **Focused changes.** Prefer small, surgical changes over large refactors.
4. **Phase alignment.** Don't build ahead of the current phase (e.g. no business tables, auth, or admin features until explicitly requested).
5. **Follow existing patterns.** Check `docs/` and the current source before introducing new conventions.

See also `TECHNICAL_STACK.md`, `GEMINI.md`, and `docs/notes/working-rules.md` for further project context.
