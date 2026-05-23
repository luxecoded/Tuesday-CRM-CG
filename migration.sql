-- ============================================================
--  Tuesday CRM — Schema Migration
--  Run this ONCE in the Supabase SQL editor.
--  It renames the old tables, creates the new schema,
--  migrates all data across, then drops the old tables.
-- ============================================================


-- ── Step 1: Rename old tables to legacy ──────────────────────
-- (Keeps data safe while new tables are built alongside)

alter table if exists events  rename to _legacy_events;
alter table if exists orders  rename to _legacy_orders;
alter table if exists quotes  rename to _legacy_quotes;
alter table if exists deals   rename to _legacy_deals;
alter table if exists contacts rename to _legacy_contacts;

-- Remove legacy tables from realtime publication
do $$
begin
  alter publication supabase_realtime drop table _legacy_contacts;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime drop table _legacy_deals;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime drop table _legacy_quotes;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime drop table _legacy_orders;
exception when others then null;
end $$;
do $$
begin
  alter publication supabase_realtime drop table _legacy_events;
exception when others then null;
end $$;


-- ── Step 2: Create new tables ─────────────────────────────────

create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  full_name  text not null,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists addresses (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  line1       text not null,
  line2       text,
  city        text,
  postcode    text,
  created_at  timestamptz default now()
);

create table if not exists jobs (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  address_id  uuid references addresses(id) on delete set null,
  title       text,
  status      text not null default 'enquiry'
                check (status in ('enquiry','quoted','accepted','surveyed','installed','complete','lost')),
  quote_visit date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists quotes (
  id                     uuid primary key default gen_random_uuid(),
  job_id                 uuid references jobs(id) on delete cascade,
  ewt_quote_ref          text,
  origin                 text,
  supplier_name          text,
  supplier_reference     text,
  ewt_value              numeric(10,2) default 0,
  supplier_value         numeric(10,2) default 0,
  total                  numeric(10,2) default 0,
  status                 text not null default 'draft'
                           check (status in ('draft','sent','accepted','declined')),
  sent_to_supplier       boolean default false,
  sent_to_customer       boolean default false,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create table if not exists quote_items (
  id             uuid primary key default gen_random_uuid(),
  quote_id       uuid not null references quotes(id) on delete cascade,
  product_name   text not null,
  quantity       integer default 1,
  width          numeric(10,2),
  height         numeric(10,2),
  frame_colour   text,
  glass_type     text,
  supplier_cost  numeric(10,2) default 0,
  sale_price     numeric(10,2) default 0,
  created_at     timestamptz default now()
);

create table if not exists orders (
  id                      uuid primary key default gen_random_uuid(),
  job_id                  uuid references jobs(id) on delete set null,
  quote_id                uuid references quotes(id) on delete set null,
  ewt_job_ref             text,
  supplier_quote_ref      text,
  surveyor                text,
  survey_booked           boolean default false,
  survey_date             date,
  contacted_customer      boolean default false,
  survey_to_supplier      boolean default false,
  checked_signed_off      boolean default false,
  delivery_date_requested date,
  install_start           date,
  install_end             date,
  customer_notified       boolean default false,
  deposit_received        boolean default false,
  materials_cost          numeric(10,2) default 0,
  installation_charge     numeric(10,2) default 0,
  supplier_charge         numeric(10,2) default 0,
  total                   numeric(10,2) default 0,
  vat                     numeric(10,2) default 0,
  nett                    numeric(10,2) default 0,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

create table if not exists order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references orders(id) on delete cascade,
  quote_item_id  uuid references quote_items(id) on delete set null,
  product_name   text not null,
  quantity       integer default 1,
  width          numeric(10,2),
  height         numeric(10,2),
  frame_colour   text,
  glass_type     text,
  supplier_cost  numeric(10,2) default 0,
  sale_price     numeric(10,2) default 0,
  created_at     timestamptz default now()
);

create table if not exists events (
  id         uuid primary key default gen_random_uuid(),
  job_id     uuid references jobs(id) on delete set null,
  title      text not null,
  type       text check (type in ('quote_visit','survey','install','meeting','other')),
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  notes      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  parent_type text not null check (parent_type in ('customer','job','quote','order')),
  parent_id   uuid not null,
  comment     text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);


-- ── Step 3: ID mapping tables (text → uuid) ───────────────────

create temp table _contact_map (
  old_id text primary key,
  new_id uuid default gen_random_uuid()
);
insert into _contact_map (old_id) select id from _legacy_contacts;

create temp table _deal_map (
  old_id text primary key,
  new_id uuid default gen_random_uuid()
);
insert into _deal_map (old_id) select id from _legacy_deals;

create temp table _quote_map (
  old_id uuid primary key,
  new_id uuid default gen_random_uuid()
);
insert into _quote_map (old_id) select id from _legacy_quotes;

create temp table _order_map (
  old_id uuid primary key,
  new_id uuid default gen_random_uuid()
);
insert into _order_map (old_id) select id from _legacy_orders;


-- ── Step 4: Migrate contacts → customers ─────────────────────

insert into customers (id, full_name, phone, email, notes, created_at, updated_at)
select
  cm.new_id,
  coalesce(nullif(trim(c.name), ''), 'Unknown'),
  nullif(trim(c.phone), ''),
  nullif(trim(c.email), ''),
  nullif(trim(c.notes), ''),
  c.created_at,
  c.created_at
from _legacy_contacts c
join _contact_map cm on c.id = cm.old_id;


-- ── Step 5: Migrate deal locations → addresses ───────────────
-- One address per deal that has a non-empty location field.
-- The address is linked to the deal's contact (customer).

create temp table _deal_address_map (
  deal_old_id text primary key,
  address_id  uuid default gen_random_uuid()
);
insert into _deal_address_map (deal_old_id)
select id from _legacy_deals
where location is not null and trim(location) <> '';

insert into addresses (id, customer_id, line1, created_at)
select
  dam.address_id,
  cm.new_id,
  trim(d.location),
  d.created_at
from _legacy_deals d
join _deal_address_map dam on d.id = dam.deal_old_id
left join _contact_map cm on d.contact_id = cm.old_id;


-- ── Step 6: Migrate deals → jobs ─────────────────────────────

insert into jobs (id, customer_id, address_id, title, status, quote_visit, created_at, updated_at)
select
  dm.new_id,
  cm.new_id,
  dam.address_id,
  coalesce(nullif(trim(d.deal), ''), 'Untitled Job'),
  case
    when d.deal_group = 'won'                                        then 'complete'
    when d.stage in ('Quote','Awaiting Client','Follow Up')          then 'quoted'
    when d.stage = 'Survey'                                          then 'surveyed'
    when d.stage in ('Signed','To Order',
                     'Installation TBC','Installation Booked')       then 'accepted'
    when d.stage in ('Installed Pending Certification',
                     'Awaiting Payment')                             then 'installed'
    when d.stage in ('Completed','Service Call')                     then 'complete'
    else 'enquiry'
  end,
  d.quote_visit,
  d.created_at,
  d.created_at
from _legacy_deals d
join _deal_map dm on d.id = dm.old_id
left join _contact_map cm on d.contact_id = cm.old_id
left join _deal_address_map dam on d.id = dam.deal_old_id;


-- ── Step 7: Migrate quotes ────────────────────────────────────
-- Totals are summed from the JSONB options array.
-- Supplier name/ref taken from the first option.

insert into quotes (
  id, job_id, ewt_quote_ref, origin,
  supplier_name, supplier_reference,
  ewt_value, supplier_value, total,
  status, sent_to_supplier, sent_to_customer,
  created_at, updated_at
)
select
  qm.new_id,
  dm.new_id,
  nullif(trim(q.ewt_quote_ref), ''),
  nullif(trim(q.origin), ''),
  nullif(trim(q.options->0->>'supplierName'), ''),
  nullif(trim(q.options->0->>'supplierReference'), ''),
  coalesce((
    select sum((opt->>'ewtValue')::numeric)
    from jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) opt
  ), 0),
  coalesce((
    select sum((opt->>'supplierValue')::numeric)
    from jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) opt
  ), 0),
  coalesce((
    select sum((opt->>'total')::numeric)
    from jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) opt
  ), 0),
  case q.response
    when 'Go Ahead' then 'accepted'
    when 'No Go'    then 'declined'
    when 'Waiting'  then 'sent'
    else                 'draft'
  end,
  coalesce(q.sent_to_supplier, false),
  coalesce(q.quote_sent_to_customer, false),
  q.created_at,
  q.created_at
from _legacy_quotes q
join _quote_map qm on q.id = qm.old_id
left join _deal_map dm on q.deal_id::text = dm.old_id;


-- ── Step 8: Migrate quote options → quote_items ──────────────
-- Each element in the old options JSONB array becomes one row.
-- product_name = label + products text combined.

insert into quote_items (quote_id, product_name, quantity, supplier_cost, sale_price, created_at)
select
  qm.new_id,
  trim(
    coalesce(nullif(opt->>'label', ''), 'Option') ||
    case
      when (opt->>'products') is not null and trim(opt->>'products') <> ''
      then ': ' || trim(opt->>'products')
      else ''
    end
  ),
  1,
  coalesce((opt->>'supplierValue')::numeric, 0),
  coalesce((opt->>'ewtValue')::numeric, 0),
  q.created_at
from _legacy_quotes q
join _quote_map qm on q.id = qm.old_id
cross join lateral jsonb_array_elements(coalesce(q.options, '[]'::jsonb)) as opt
where jsonb_array_length(coalesce(q.options, '[]'::jsonb)) > 0;


-- ── Step 9: Migrate orders ────────────────────────────────────

insert into orders (
  id, job_id, quote_id,
  ewt_job_ref, supplier_quote_ref,
  survey_booked, survey_date,
  contacted_customer, survey_to_supplier, checked_signed_off,
  delivery_date_requested,
  install_start, install_end,
  customer_notified, deposit_received,
  materials_cost, installation_charge, supplier_charge,
  total, vat, nett,
  created_at, updated_at
)
select
  om.new_id,
  dm.new_id,
  -- find the first quote linked to the same deal
  (
    select nq.new_id
    from _legacy_quotes lq
    join _quote_map nq on lq.id = nq.old_id
    where lq.deal_id::text = o.deal_id::text
    limit 1
  ),
  nullif(trim(o.ewt_job_ref), ''),
  nullif(trim(coalesce(o.supplier_reference, '')), ''),
  coalesce(o.survey_booked, false),
  o.survey_date,
  coalesce(o.contacted_customer, false),
  coalesce(o.survey_to_supplier, false),
  coalesce(o.checked_signed_off, false),
  o.delivery_date_requested,
  o.install_date,
  null,
  coalesce(o.customer_notified, false),
  false,
  0,
  coalesce(o.installation_charge, 0),
  coalesce(o.supplier_charge, 0),
  coalesce(o.installation_charge, 0) + coalesce(o.supplier_charge, 0),
  round((coalesce(o.installation_charge, 0) + coalesce(o.supplier_charge, 0)) * 0.2, 2),
  round((coalesce(o.installation_charge, 0) + coalesce(o.supplier_charge, 0)) * 0.8, 2),
  o.created_at,
  o.created_at
from _legacy_orders o
join _order_map om on o.id = om.old_id
left join _deal_map dm on o.deal_id::text = dm.old_id;


-- ── Step 10: Migrate order items from windows/doors counts ────

insert into order_items (order_id, product_name, quantity, supplier_cost, sale_price, created_at)
select
  om.new_id,
  coalesce(nullif(trim(o.windows_type), ''), 'Window'),
  o.windows_count,
  0, 0,
  o.created_at
from _legacy_orders o
join _order_map om on o.id = om.old_id
where coalesce(o.windows_count, 0) > 0;

insert into order_items (order_id, product_name, quantity, supplier_cost, sale_price, created_at)
select
  om.new_id,
  coalesce(nullif(trim(o.doors_type), ''), 'Door'),
  o.doors_count,
  0, 0,
  o.created_at
from _legacy_orders o
join _order_map om on o.id = om.old_id
where coalesce(o.doors_count, 0) > 0;


-- ── Step 11: Migrate events ───────────────────────────────────

insert into events (id, job_id, title, type, starts_at, ends_at, notes, created_at, updated_at)
select
  e.id,
  dm.new_id,
  e.title,
  case e.type
    when 'quote'   then 'quote_visit'
    when 'survey'  then 'survey'
    when 'install' then 'install'
    when 'meeting' then 'meeting'
    else                'other'
  end,
  e.date::timestamptz,
  e.end_date::timestamptz,
  nullif(trim(coalesce(e.notes, '')), ''),
  e.created_at,
  e.created_at
from _legacy_events e
left join _deal_map dm on e.deal_id::text = dm.old_id;


-- ── Step 12: Auto-create order trigger ───────────────────────
-- Fires when a quote's status is set to 'accepted'.
-- Creates a skeleton order linked to the same job and quote.

create or replace function handle_quote_accepted()
returns trigger language plpgsql as $$
begin
  if new.status = 'accepted' and (old.status is null or old.status <> 'accepted') then
    insert into orders (job_id, quote_id, total, vat, nett)
    values (
      new.job_id,
      new.id,
      new.total,
      round(new.total * 0.2, 2),
      round(new.total * 0.8, 2)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_quote_accepted on quotes;
create trigger on_quote_accepted
  after update on quotes
  for each row execute function handle_quote_accepted();


-- ── Step 13: Enable realtime on new tables ────────────────────

alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table addresses;
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table quotes;
alter publication supabase_realtime add table quote_items;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table comments;


-- ── Step 14: Drop legacy tables ───────────────────────────────
-- Only run this after verifying the migrated data looks correct.
-- Comment these out if you want to keep the legacy tables as a backup.

drop table if exists _legacy_events   cascade;
drop table if exists _legacy_orders   cascade;
drop table if exists _legacy_quotes   cascade;
drop table if exists _legacy_deals    cascade;
drop table if exists _legacy_contacts cascade;
