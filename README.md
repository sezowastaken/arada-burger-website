# Arada Burger

A simple and practical digital platform for Arada Burger, focusing on a high-quality customer experience and streamlined internal operations.

## Project Overview
This project aims to provide Arada Burger with a modern yet retro-inspired digital presence. The immediate priority is a live digital menu for customers, followed by a user-friendly admin panel for business data entry.

## Folder Structure
- `frontend/`: Public-facing website (React/Next.js or similar).
- `backend/`: Future API and internal admin backend (Java/Spring Boot or similar).
- `infra/`: Docker configurations and MySQL setup.
- `docs/`: Project documentation, brand guidelines, and decision logs.

## Current Status
- **Phase:** Phase 1 (Initialization)
- **Status:** Project structure and core documentation established.
- **Next Steps:** Begin frontend development for the digital menu and landing page.

## Current Priorities
1. **Digital Menu:** A fast, responsive, and bilingual (TR/EN) menu for in-store and remote customers.
2. **Landing Page:** Introducing the Arada Burger brand and vibe.
3. **Location & About:** Providing essential business information.


```
arada-burger-website
├─ backend
│  └─ README.md
├─ DESIGN.md
├─ docs
│  ├─ brand
│  │  ├─ asset-inventory.md
│  │  └─ brand-guidelines.md
│  ├─ notes
│  │  └─ working-rules.md
│  └─ product
│     ├─ project-scope.md
│     └─ roadmap.md
├─ frontend
│  ├─ next-env.d.ts
│  ├─ next.config.mjs
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ brand
│  │  │  ├─ logo
│  │  │  │  └─ logo_background_removed.png
│  │  │  └─ mascots
│  │  │     ├─ burger_maskot.png
│  │  │     ├─ hotdog_maskot.png
│  │  │     ├─ patates_maskotu.png
│  │  │     └─ soda_maskot.png
│  │  ├─ images
│  │  │  ├─ burger_favicon.png
│  │  │  ├─ eyes_favicon.png
│  │  │  ├─ favicon_burger.png
│  │  │  ├─ product_card_frame.png
│  │  │  ├─ vintage_frame.png
│  │  │  └─ vintage_frame_2.png
│  │  └─ menu
│  │     ├─ extras
│  │     │  └─ CokeCan-Photoroom.png
│  │     ├─ pdf
│  │     │  └─ Arada_Burger_Menu_TR.pdf
│  │     └─ products
│  │        ├─ Aksaz_Hotdog.png
│  │        ├─ Bayır_Burger.png
│  │        ├─ Bozburun_Burger.png
│  │        ├─ Datça_Burger.png
│  │        ├─ Göcek_Burger.png
│  │        ├─ Marmaris_Burger.png
│  │        ├─ Selimiye_Burger.png
│  │        ├─ Söğüt_Burger.png
│  │        └─ Turgut_Hotdog.png
│  ├─ README.md
│  ├─ src
│  │  ├─ app
│  │  │  ├─ layout.tsx
│  │  │  └─ [lang]
│  │  │     ├─ layout.tsx
│  │  │     ├─ location
│  │  │     │  └─ page.tsx
│  │  │     ├─ menu
│  │  │     │  ├─ MenuClient.tsx
│  │  │     │  └─ page.tsx
│  │  │     └─ page.tsx
│  │  ├─ components
│  │  │  └─ ui
│  │  │     ├─ CategoryFilter.tsx
│  │  │     └─ ProductCard.tsx
│  │  ├─ constants
│  │  │  └─ menuData.json
│  │  ├─ middleware.ts
│  │  └─ styles
│  │     └─ globals.css
│  ├─ tailwind.config.js
│  └─ tsconfig.json
├─ GEMINI.md
├─ infra
│  └─ README.md
├─ README.md
└─ TECHNICAL_STACK.md

```