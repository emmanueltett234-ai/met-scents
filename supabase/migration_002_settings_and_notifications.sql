-- ============================================================================
-- Met Scents — migration 002: store settings + enquiry notification tracking
-- Run this in the Supabase SQL editor AFTER schema.sql + seed.sql.
-- Safe to re-run.
-- ============================================================================

-- A single-row settings table the admin dashboard can edit — replaces the
-- hard-coded NEXT_PUBLIC_OWNER_WHATSAPP env var as the source of truth for
-- the owner's WhatsApp number (env var is kept only as a first-run fallback).
create table if not exists settings (
  id text primary key default 'default',
  owner_whatsapp_number text,
  owner_notification_email text,
  whatsapp_notifications_enabled boolean not null default true,
  email_notifications_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into settings (id)
values ('default')
on conflict (id) do nothing;

drop trigger if exists trg_settings_updated_at on settings;
create trigger trg_settings_updated_at before update on settings
  for each row execute function set_updated_at();

alter table settings enable row level security;

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings
  for select using (true);

drop policy if exists "admin manage settings" on settings;
create policy "admin manage settings" on settings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Track whether the automatic WhatsApp API notification (if configured) and
-- the email notification actually succeeded for each enquiry, so the admin
-- dashboard never has to guess — and the customer is never told "sent"
-- when nothing actually went out.
alter table enquiries add column if not exists whatsapp_status text not null default 'not_configured';
alter table enquiries add column if not exists whatsapp_error text;
alter table enquiries add column if not exists email_status text not null default 'not_configured';
alter table enquiries add column if not exists email_error text;

comment on column enquiries.whatsapp_status is 'not_configured | sent | failed — result of the automatic WhatsApp Business API notification attempt (separate from the customer-initiated wa.me link, which always works client-side).';
comment on column enquiries.email_status is 'not_configured | sent | failed — result of the Resend email notification attempt.';
