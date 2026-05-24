-- ─────────────────────────────────────────────────────────────────────────────
-- Status auto-progression triggers
-- 2026-05-24
--
-- Automatically advances job.status as key events occur, so the pipeline
-- stays accurate without manual updates:
--
--   enquiry  ──[quote created]──► quoted
--   quoted   ──[quote accepted]──► accepted   (order also auto-created by existing trigger)
--   accepted ──[order signed off]──► complete
--
-- Triggers are safe to re-run (CREATE OR REPLACE / DROP IF EXISTS).
-- They only advance status forward — never backwards — and skip jobs
-- already in a terminal state (lost, complete).
-- ─────────────────────────────────────────────────────────────────────────────


-- 1. enquiry → quoted
--    Fires when a quote row is inserted for a job that is still at 'enquiry'.

create or replace function auto_job_quoted()
returns trigger as $$
begin
  update jobs
  set    status     = 'quoted',
         updated_at = now()
  where  id     = new.job_id
    and  status = 'enquiry';
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_quote_created_advance_job on quotes;
create trigger on_quote_created_advance_job
  after insert on quotes
  for each row
  execute function auto_job_quoted();


-- 2. enquiry/quoted → accepted
--    Fires when a quote's status changes to 'accepted'.
--    Works alongside the existing on_quote_accepted trigger (order creation).

create or replace function auto_job_accepted()
returns trigger as $$
begin
  if new.status = 'accepted' and old.status != 'accepted' then
    update jobs
    set    status     = 'accepted',
           updated_at = now()
    where  id     = new.job_id
      and  status in ('enquiry', 'quoted');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_quote_accepted_advance_job on quotes;
create trigger on_quote_accepted_advance_job
  after update of status on quotes
  for each row
  execute function auto_job_accepted();


-- 3. any active status → complete
--    Fires when an order's checked_signed_off flips to true.

create or replace function auto_job_complete()
returns trigger as $$
begin
  if new.checked_signed_off = true
     and (old.checked_signed_off is null or old.checked_signed_off = false)
  then
    update jobs
    set    status     = 'complete',
           updated_at = now()
    where  id     = new.job_id
      and  status not in ('lost', 'complete');
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_order_signed_off_complete_job on orders;
create trigger on_order_signed_off_complete_job
  after update of checked_signed_off on orders
  for each row
  execute function auto_job_complete();
