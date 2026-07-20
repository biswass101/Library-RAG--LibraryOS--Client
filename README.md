# LibraryOS — Frontend

The web client for **Library-RAG**, a library management system with an AI assistant powered by Retrieval-Augmented Generation (RAG). Librarians can manage the catalog, circulation, and members, upload knowledge-base documents, and chat with an assistant that answers questions grounded in those documents.

Built with **Next.js 15 (App Router) + React 19 + TypeScript**, styled with **Tailwind CSS v4** and shadcn/ui (Radix primitives).

## Features

- **Dashboard** — stats, borrow trends, popular categories, recent activity, upcoming due dates
- **Catalog** — books CRUD with search/filter/sort, plus categories, authors, and publishers
- **Circulation** — members, borrow issue/return/renew with automatic fines, reservations with queue positions
- **Knowledge** — document upload for the RAG index, reports
- **AI Assistant** — chat backed by the `/rag/chat` endpoint, with source citations
- **Auth** — JWT login against the backend; token stored in `localStorage` and attached via an axios interceptor

## Prerequisites

- Node.js 20+
- The [backend](../backend) running (default `http://localhost:4000`), which in turn needs the Docker services (`docker compose up` in `backend/` for Postgres + pgvector, Redis, pgAdmin)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure the API URL in `.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and log in (seeded credentials: `admin@libraryos.io` / `admin123` — see `backend/seed.ts`).

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the dev server on port 3000 |
| `npm run build` | Production build                  |
| `npm run start` | Serve the production build        |
| `npm run lint`  | Run ESLint                        |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login, forgot/reset password
│   └── (app)/              # Authenticated app shell
│       ├── dashboard/      # Overview widgets & charts
│       ├── chat/           # AI assistant (RAG)
│       ├── books/          # Catalog: list, detail, new, edit
│       ├── categories/     # Taxonomy CRUD
│       ├── authors/
│       ├── publishers/
│       ├── members/        # Members list & profile
│       ├── borrows/        # Loans + fines sub-page
│       ├── reservations/
│       ├── documents/      # Knowledge-base uploads
│       ├── reports/
│       └── settings/
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── data-table/         # Generic server-driven table (search, filters, sort, pagination)
│   ├── layout/             # Sidebar, topbar, breadcrumbs, command palette (nav-config.ts defines sections)
│   ├── charts/             # Recharts wrappers
│   └── shared/             # PageHeader, StatusBadge, ConfirmDialog, empty/error states
├── features/               # Feature-specific components (forms, dialogs, widgets)
└── lib/
    ├── api/
    │   ├── client.ts       # Axios instance + auth interceptors
    │   └── services.ts     # API services + backend→UI shape mappers
    ├── types.ts            # Core domain types
    ├── format.ts           # Date/currency helpers
    └── utils.ts
```

## Architecture Notes

- **Data fetching** uses TanStack Query. List pages share the generic `DataTable` component ([src/components/data-table/data-table.tsx](src/components/data-table/data-table.tsx)), which drives server-side pagination, search, filtering, and sorting through a `queryFn(params) => Paginated<T>` contract.
- **API adapter layer** — all HTTP calls live in [src/lib/api/services.ts](src/lib/api/services.ts). The backend returns Prisma rows with nested relations (e.g. `book.author.name`); mapper functions there flatten them into the UI types in [src/lib/types.ts](src/lib/types.ts) (e.g. `authorName`) and compute derived fields like book stock status. Pages and components never touch raw API shapes — if the backend changes, update the mappers only.
- **Forms** use react-hook-form + zod resolvers.
- **Theming** — light/dark via `next-themes`; toasts via `sonner`.

## Backend Contract

All list endpoints return a paginated envelope:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 10, "pageCount": 0 }
```

Query params: `page`, `pageSize`, `search`, `sortBy`, `sortDir`, plus endpoint-specific filters (e.g. `categoryId`, `status`). See the backend Swagger docs at `http://localhost:4000/api` when the server is running.
