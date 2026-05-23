-- Run migration.sql instead — this file is kept for reference only.
-- migration.sql handles the full schema creation and data migration in one step.

-- New schema (for reference):

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

-- Enable realtime
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table addresses;
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table quotes;
alter publication supabase_realtime add table quote_items;
alter publication supabase_realtime add table orders;
alter publication supabase_realtime add table order_items;
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table comments;
