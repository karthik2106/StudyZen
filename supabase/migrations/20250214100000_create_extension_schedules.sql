create extension if not exists pgcrypto;

create table if not exists extension_schedules (
  id uuid primary key default gen_random_uuid(),
  extension_id uuid not null,
  raw_text text not null,
  schedule jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists extension_schedules_extension_id_key
  on extension_schedules (extension_id);

create or replace function trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_extension_schedules_updated_at
  before update on extension_schedules
  for each row
  execute function trigger_set_timestamp();
