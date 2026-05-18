-- Run this in the Supabase SQL editor to create the tables needed
-- for the Contacts and Calendar pages.

-- Contacts table
create table if not exists contacts (
  id         uuid default gen_random_uuid() primary key,
  first_name text,
  last_name  text,
  email      text,
  phone      text,
  company    text,
  role       text,
  notes      text,
  created_at timestamptz default now()
);

-- Events table (custom calendar events)
create table if not exists events (
  id         uuid default gen_random_uuid() primary key,
  title      text not null,
  type       text,     -- quote | survey | install | meeting | other
  company    text,     -- Isis Windows | Paradise Windows | Elite Windows
  date       date not null,
  end_date   date,
  color      text default '#6366f1',
  notes      text,
  deal_id    uuid references deals(id) on delete set null,
  created_at timestamptz default now()
);

-- Enable real-time on both tables
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table events;
