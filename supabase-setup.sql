-- Run this in the Supabase SQL editor to create all tables.
-- Run supabase-seed.sql afterwards to load the initial data.

-- Contacts
create table if not exists contacts (
  id          text primary key default gen_random_uuid()::text,
  name        text,
  company     text,
  email       text,
  phone       text,
  notes       text,
  linked_deal text,
  created_at  timestamptz default now()
);

-- Deals (must be created before events, which references it)
create table if not exists deals (
  id             text primary key default gen_random_uuid()::text,
  deal_group     text default 'active',
  deal           text,
  company        text,
  stage          text,
  value          numeric default 0,
  contact        text,
  contact_id     text references contacts(id) on delete set null,
  location       text,
  quote_sent     date,
  deposit        boolean default false,
  comments       text,
  quote_visit    date,
  survey_date    date,
  install_start  date,
  install_end    date,
  materials_cost numeric default 0,
  surveyor       text,
  install_cost   numeric default 0,
  created_at     timestamptz default now()
);

-- Events
create table if not exists events (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  type       text,     -- quote | survey | install | meeting | other
  company    text,     -- Isis Windows | Paradise Windows | Elite Windows
  date       date not null,
  end_date   date,
  color      text default '#6366f1',
  notes      text,
  deal_id    text references deals(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable real-time on all tables
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table events;
