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
- `/`        → `Pipeline`  — jobs grouped by status, filterable, + New Job button
- `/quotes`  → `Quotes`    — quote records with line items and status tracking
- `/orders`  → `Orders`    — order records (auto-created when quote is accepted)

All wrapped in `Layout` (nav sidebar) and `ThemeProvider` (dark/light mode via `ThemeContext`). A `PasswordGate` sits above the router — password is `elite2026`, stored in `localStorage` under key `tuesday-crm-unlocked-v1`. User name is entered at login and stored under `tuesday-crm-user-name`, displayed in the sidebar.

### Data layer — Supabase
Data hooks read from and write to Supabase with real-time subscriptions via `postgres_changes`. The Supabase client is at `src/lib/supabase.js`.

Each hook follows the same pattern:
- `fromCloud(row)` — maps snake_case DB columns → camelCase app fields
- `toCloud(obj)` — maps camelCase app fields → snake_case DB columns
- Real-time channel subscribes to `*` events on the table and re-fetches on any change
- Optimistic updates on writes, with rollback via re-fetch on error

**Join queries**: hooks that need related data use Supabase embedded select syntax, e.g. `jobs(title, customers(full_name), addresses(line1))`. Realtime events trigger a full re-fetch of the joined query.

### Supabase schema

**customers**
```
id uuid PK, full_name, phone, email, notes, created_at, updated_at
```

**addresses**
```
id uuid PK, customer_id (→ customers.id), line1, line2, city, postcode, created_at
```

**jobs**
```
id uuid PK, customer_id (→ customers.id), address_id (→ addresses.id),
title, status ('enquiry'|'quoted'|'accepted'|'surveyed'|'installed'|'complete'|'lost'),
quote_visit, created_at, updated_at
```
- Status enum is enforced by a CHECK constraint
- `STATUS_ORDER`, `STATUS_LABELS`, `STATUS_COLORS` exported from `useJobs.js`

**quotes**
```
id uuid PK, job_id (→ jobs.id cascade delete),
ewt_quote_ref, origin, supplier_name, supplier_reference,
ewt_value, supplier_value, total,
status ('draft'|'sent'|'accepted'|'declined'),
sent_to_supplier, sent_to_customer, created_at, updated_at
```
- Totals are calculated by the app from `quote_items` and written back to the quote row
- A Postgres trigger (`on_quote_accepted`) auto-creates an order row when `status` → `'accepted'`

**quote_items**
```
id uuid PK, quote_id (→ quotes.id cascade delete),
product_name, quantity, width (mm), height (mm), frame_colour, glass_type,
supplier_cost, sale_price, created_at
```
- Saving a quote deletes all existing items then re-inserts — no partial updates

**orders**
```
id uuid PK, job_id (→ jobs.id), quote_id (→ quotes.id),
ewt_job_ref, supplier_quote_ref, surveyor,
survey_booked, survey_date, contacted_customer, survey_to_supplier, checked_signed_off,
delivery_date_requested, install_start, install_end, customer_notified, deposit_received,
materials_cost, installation_charge, supplier_charge,
total, vat, nett  ← app calculates and writes these (not generated columns)
created_at, updated_at
```
- Financial formula: `total = materials_cost + installation_charge + supplier_charge`, `vat = total * 0.2`, `nett = total * 0.8`

**order_items**
```
id uuid PK, order_id (→ orders.id cascade delete), quote_item_id (→ quote_items.id),
product_name, quantity, width, height, frame_colour, glass_type,
supplier_cost, sale_price, created_at
```

**events** *(table exists, no UI yet)*
```
id uuid PK, job_id (→ jobs.id), title,
type ('quote_visit'|'survey'|'install'|'meeting'|'other'),
starts_at timestamptz, ends_at timestamptz, notes, created_at, updated_at
```

**comments**
```
id uuid PK, parent_type ('customer'|'job'|'quote'|'order'), parent_id uuid,
comment, created_at, updated_at
```
- Polymorphic — `CommentsSection` component handles all parent types

- Realtime enabled on all tables
- **RLS is disabled** on all tables — app uses a shared password gate, not Supabase Auth

### Components

- `JobDrawer` — create/edit jobs; resolves address by find-or-create on save
- `QuoteDrawer` — create/edit quotes with line items; passes `jobs` array for job-link dropdown
- `OrderDrawer` — edit orders; shows customer/address read-only from job join; shows order_items read-only
- `CommentsSection` — polymorphic comments for any entity; takes `parentType` + `parentId`

### Hooks

- `useJobs` — CRUD on `jobs` table with customer/address joins
- `useCustomers` — CRUD on `customers` table
- `useAddresses(customerId)` — addresses for a specific customer
- `useQuotes` — CRUD on `quotes` + `quote_items`; calculates totals before save
- `useOrders` — CRUD on `orders` + `order_items` reads; calculates financials before save
- `useComments(parentType, parentId)` — comments for one entity

### Supabase project
- Project ref: `pwgysziaeoquhyvszrqb`
- MCP server configured in `.claude/settings.json` (HTTP transport with Bearer token)

### Business domain
Single company: **Elite Windows** (window/door installation). Jobs move through 7 statuses. Currency is GBP, formatted with `£` and `en-GB` locale.

### Drawer/panel pattern
Selecting a job/quote/order opens a detail view — on desktop (`useIsDesktop` hook, breakpoint 1024px) it renders as a side panel; on mobile it renders as a bottom drawer. Both use the same component with an `isDesktop` prop.

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
