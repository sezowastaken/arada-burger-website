# GEMINI.md - Instructions for Gemini CLI

This file contains foundational mandates for Gemini CLI when working in this repository.

## Core Directives
1. **Consult Documentation:** Always read `README.md`, `GEMINI.md`, and all files in `docs/` before proposing or implementing changes.
2. **No Assumptions:** Avoid making random assumptions about architecture or tech stack. If the documentation is silent, ask for clarification or infer from existing code.
3. **Preserve Simplicity:** This project is intentionally simple. Do NOT introduce monorepos, npm workspaces, complex build pipelines, or unnecessary abstractions.
4. **Focused Changes:** Prefer small, surgical, and highly focused changes over large refactors.
5. **Phase Alignment:** Respect the current project phase. Do not implement Phase 2 features while we are in Phase 1 unless explicitly directed.
6. **Technical Integrity:** Follow existing patterns and naming conventions found in the source of truth (the actual files).
7. **Autonomy vs. Inquiry:** If a task is well-documented, proceed autonomously. If it deviates from the "simple and practical" philosophy, stop and ask.

## Architecture Philosophy
- **Separation, Not Complexity:** Keep `frontend`, `backend`, and `infra` as distinct folders. Do not link them via workspace configurations.
- **Practical Docker:** Docker will be used later as a simple runner for services (App + DB), not as a complex development environment wrapper.
