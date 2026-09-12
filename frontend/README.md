# Frontend

Next.js 15 (App Router) + TypeScript + Tailwind. This single app serves both
the public website and the admin panel.

## Setup

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

The backend must be running for `/admin` to work — see `../backend/README.md`,
or start the whole stack with `docker compose up -d` from the repo root.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — lint

## Structure

```text
src/
├── app/
│   ├── [lang]/       public site (tr/en): landing, menu, about, location
│   └── admin/        admin panel: products, analytics, inventory, orders, settings
├── components/
│   ├── ui/           public-site components
│   ├── layout/       header/footer
│   └── admin/        admin panel components
├── constants/
│   └── menuData.json fallback menu data
├── lib/api.ts        backend API client
├── middleware.ts     language routing
└── styles/
```

## Conventions

- [`../DESIGN.md`](../DESIGN.md) is binding for all UI work.
- Mobile first — most customers open the menu on a phone.
- Every user-facing string has `tr` and `en` variants.
