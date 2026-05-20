# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:5173
npm run build      # Production build to /dist
npm run lint       # ESLint
npm run preview    # Preview production build
```

## Stack

- **React 19** + **Vite 8** + **Tailwind CSS 4**
- **React Router v7** (client-side, `BrowserRouter`)
- **Supabase JS v2** (`@supabase/supabase-js`)
- No test framework configured

## Architecture

### Pages & routing
Three pages under `src/pages/`:
- `/` → `Pipeline` — Kanban/list view of deals grouped by stage
- `/calendar` → `Calendar` — event scheduling
- `/contacts` → `Contacts` — contact management

All wrapped in `Layout` (nav sidebar) and `ThemeProvider` (dark/light mode via `ThemeContext`). A `PasswordGate` sits above the router — password is `elite2026`, stored in `localStorage` under key `tuesday-crm-unlocked-v1`.

### Data layer — ⚠️ NOT yet wired to Supabase
The three data hooks (`useDeals`, `useContacts`, `useEvents`) currently read from `src/lib/seed.js` (hardcoded in-memory data). The Supabase client exists at `src/lib/supabase.js` and the schema is in `supabase-setup.sql`, but the hooks have not been migrated to use it yet. When wiring up Supabase, replace the seed-based `useState` calls in those hooks with Supabase queries.

### Supabase schema (from `supabase-setup.sql`)
- **contacts** — `id, first_name, last_name, email, phone, company, role, notes, created_at`
- **events** — `id, title, type, company, date, end_date, color, notes, deal_id (→ deals), created_at`
- A `deals` table is referenced but not defined in the SQL file — needs to be created
- Realtime is enabled on `contacts` and `events`

### Business domain
Three window/door companies: **Isis Windows**, **Paradise Windows**, **Elite Windows**. Deals have a `group` field (`active` | `won`) and move through 12 fixed stages defined in `STAGE_ORDER` in `Pipeline.jsx`. Currency is GBP, formatted with `£` and `en-GB` locale.

### Drawer/panel pattern
Selecting a deal/contact/event opens a detail view — on desktop (`useIsDesktop` hook, breakpoint 1024px) it renders as a side panel; on mobile it renders as a bottom drawer. Both use the same component (e.g. `DealDrawer`) with an `isDesktop` prop.

### Environment
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
Both are required. `.env` is gitignored — collaborators must supply their own copy.
