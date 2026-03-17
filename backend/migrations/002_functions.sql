-- ============================================================
-- CampusBazaar — Database Functions & Triggers
-- ============================================================

-- Shadow ban a user (hides their listings without notifying them)
create or replace function public.shadow_ban_user(user_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.users
  set is_shadow_banned = true
  where id = user_id;

  -- Hide all their active listings silently
  update public.listings
  set status = 'hidden'
  where seller_id = user_id and status = 'active';
end;
$$;

-- Get dashboard stats for admin panel
create or replace function public.get_dashboard_stats()
returns json language plpgsql security definer as $$
declare
  result json;
begin
  select json_build_object(
    'total_users',             (select count(*) from public.users),
    'active_listings',         (select count(*) from public.listings where status = 'active'),
    'completed_transactions',  (select count(*) from public.transactions where status = 'completed'),
    'open_reports',            (select count(*) from public.reports where resolved = false)
  ) into result;
  return result;
end;
$$;

-- Auto-increment report_count on new report
create or replace function public.increment_report_count()
returns trigger language plpgsql as $$
begin
  if NEW.target_type = 'user' then
    update public.users
    set report_count = report_count + 1
    where id = NEW.target_id::uuid;
  end if;
  return NEW;
end;
$$;

create trigger on_report_inserted
  after insert on public.reports
  for each row execute function public.increment_report_count();

-- Auto-update transactions.updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- Enable realtime for live feed
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.messages;
