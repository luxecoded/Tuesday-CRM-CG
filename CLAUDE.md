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
Three active pages under `src/pages/`:
- `/`        → `Pipeline`  — deal list grouped by stage, filterable by stage dropdown
- `/quotes`  → `Quotes`    — quote records with multi-option pricing
- `/orders`  → `Orders`    — order/sales records

All wrapped in `Layout` (nav sidebar) and `ThemeProvider` (dark/light mode via `ThemeContext`). A `PasswordGate` sits above the router — password is `elite2026`, stored in `localStorage` under key `tuesday-crm-unlocked-v1`. User name is entered at login and stored under `tuesday-crm-user-name`, displayed in the sidebar.

> **Dead files (not routed):** `Calendar.jsx`, `Contacts.jsx`, `ContactDrawer.jsx`, `EventDrawer.jsx`, `EventDetailPanel.jsx`, `useEvents.js`, `lib/seed.js` — safe to delete.

### Data layer — Supabase
Data hooks (`useDeals`, `useContacts`, `useQuotes`, `useOrders`) read from and write to Supabase with real-time subscriptions via `postgres_changes`. The Supabase client is at `src/lib/supabase.js`.

Each hook follows the same pattern:
- `fromCloud(row)` — maps snake_case DB columns → camelCase app fields
- `toCloud(obj)` — maps camelCase app fields → snake_case DB columns
- Real-time channel subscribes to `*` events on the table and re-fetches on any change
- Optimistic updates on writes, with rollback via re-fetch on error

**Field mapping notes:**
- `deal_group` (DB) ↔ `group` (app) — `group` is a reserved SQL word
- Date fields use `null` (not empty string `''`) for unset values — FK constraints require `null` not `''` for `contact_id`

### Contact auto-sync
`useQuotes.js` contains a `syncContact(quote)` function that fires after every quote create/update. It upserts a contact record from the quote's customer details, matching by **email → phone → name** (priority order). Only blank fields on existing contacts are filled in — existing data is never overwritten. This keeps the `contacts` table populated automatically without a contacts UI.

### Supabase schema

**contacts**
```
id text PK, name, company, email, phone, notes, linked_deal, created_at
```

**deals**
```
id text PK, deal_group, deal, company, stage, value, contact, contact_id (→ contacts.id),
location, quote_sent, deposit, comments, quote_visit, survey_date,
install_start, install_end, materials_cost, surveyor, install_cost, created_at
```

**quotes**
```
id uuid PK, deal_id, ewt_quote_ref, customer_name, address, contact_number, email,
origin, options (JSONB array), sent_to_supplier, quote_sent_to_customer,
response ('Waiting'|'Go Ahead'|'No Go'), created_at
```
- `options` is a JSONB array of `{ id, label, products, ewtValue, supplierValue, total, supplierName, supplierReference }`
- A Postgres trigger auto-creates an order record when `response` is set to `'Go Ahead'`

**orders**
```
id uuid PK, ewt_job_ref, ewt_quote_ref, customer_name, install_address, contact_number, email,
windows_count, windows_type, doors_count, doors_type, installation_charge, supplier_charge,
supplier_name, supplier_reference, survey_date, install_start, install_end,
survey_booked, contacted_customer, survey_to_supplier, customer_notified, checked_signed_off,
total (generated), vat (generated), nett (generated), total_product (generated), created_at
```

**events** *(table exists in DB, not currently used in the UI)*
```
id uuid PK, title, type, company, date, end_date, color, notes, deal_id (→ deals.id), created_at
```

- Realtime enabled on all tables
- **RLS is disabled** on all tables — app uses a shared password gate, not Supabase Auth

### Supabase project
- Project ref: `pwgysziaeoquhyvszrqb`
- MCP server configured in `.claude/settings.json` (HTTP transport with Bearer token)

### Business domain
Single company: **Elite Windows** (window/door installation). Deals move through 12 fixed stages defined in `STAGE_ORDER` in `Pipeline.jsx`. Only `active` group deals are shown in the dashboard. Currency is GBP, formatted with `£` and `en-GB` locale.

### Drawer/panel pattern
Selecting a deal/quote/order opens a detail view — on desktop (`useIsDesktop` hook, breakpoint 1024px) it renders as a side panel; on mobile it renders as a bottom drawer. Both use the same component (e.g. `DealDrawer`) with an `isDesktop` prop.

### Auth / identity
- Single shared password (`elite2026`) — no per-user Supabase Auth
- On login the user enters their name; it's stored in `localStorage` and shown in the sidebar
- `lockApp()` in `PasswordGate.jsx` clears both localStorage keys and reloads the page

### Environment
```
VITE_SUPABASE_URL=https://pwgysziaeoquhyvszrqb.supabase.co
VITE_SUPABASE_ANON_KEY=...
```
Both are required. `.env` is gitignored — collaborators must supply their own copy (or be sent the file directly).
