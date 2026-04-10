# Technical Documentation: Arada Burger Website

This document outlines the technical architecture, technology stack, and development roadmap for the Arada Burger project. The project follows a "simple and practical" philosophy, prioritizing maintainability and clean code over complex abstractions.

## 1. Tech Stack

### Frontend
- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/) - Chosen for its robust routing, server-side rendering (SSR), and SEO capabilities.
- **Language:** [TypeScript](https://www.typescriptlang.org/) - Ensures type safety and better developer experience.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) - Used for rapid UI development with a focus on utility-first styling.
- **Fonts:** 
  - `Epilogue`: Display font for headings.
  - `Manrope`: Body font for readability.
- **Icons:** [Lucide React](https://lucide.dev/) - A clean and consistent icon set.

### Backend (Planned)
- **Runtime:** [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/) or [FastAPI](https://fastapi.tiangolo.com/).
- **Database:** PostgreSQL or MongoDB (to be finalized based on Phase 2 requirements).

### Infrastructure
- **Containerization:** [Docker](https://www.docker.com/) - Used for consistent environments across development and production.
- **Version Control:** Git.

---

## 2. Project Structure

The repository is structured to keep concerns separate without the overhead of a monorepo manager:

```text
/
├── frontend/          # Next.js application
├── backend/           # API services (Phase 2)
├── infra/             # Docker, CI/CD, and deployment scripts
├── docs/              # Brand guidelines, product roadmap, and rules
└── GEMINI.md          # Core mandates for AI assistants
```

---

## 3. General Implementation Plan

### Phase 1: Prototype & Static Content (Current)
- [x] Foundation: Setup Next.js with TypeScript and Tailwind.
- [x] Design System: Implement brand colors, typography, and global styles.
- [x] Multilingual Support: Implementation of `[lang]` routing for TR/EN.
- [x] Landing Page: Responsive Hero, Featured Products, and "Why Arada" sections.
- [x] Mascot System: Retro-style mascots with dynamic positioning.
- [ ] Menu Page: Interactive menu with category filtering.

### Phase 2: Dynamic Features & Backend
- [ ] Backend API: Setup Node.js/Express server.
- [ ] Database Integration: Persist menu data and store locations.
- [ ] Admin Panel: Simple dashboard for updating menu items and prices.

### Phase 3: Deployment & Optimization
- [ ] Dockerization: Create Dockerfiles for frontend and backend.
- [ ] Performance: Optimize images and implement Next.js caching.
- [ ] SEO: Finalize meta tags and schema markup.

---

## 4. Pipeline & Workflow

### Development Workflow
1. **Local Dev:** Run `npm run dev` in the `frontend` directory.
2. **Standardization:** Adhere to the patterns established in `frontend/src/components/` for UI and layout.
3. **Mascot Tuning:** Mascots are positioned using absolute coordinates relative to the main page container to ensure they "float" naturally around the content.

### CI/CD Pipeline (Planned)
- **Linting:** Automated `next lint` on every pull request.
- **Build Check:** `npm run build` to ensure no production-breaking errors.
- **Docker Build:** Automated image creation for staging environments.

---
