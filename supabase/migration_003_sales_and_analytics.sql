-- ============================================================================
-- Met Scents — migration 003: sales system, enquiry source/outcome tracking,
-- activity timeline, admin notes.
-- Run this in the Supabase SQL editor AFTER schema.sql, seed.sql, and
-- migration_002_settings_and_notifications.sql. Safe to re-run.
--
-- Design notes (read before editing):
-- - "enquiry_source" / "whatsapp_opened" / "outcome" are NEW columns, distinct
--   from the existing whatsapp_status/email_status columns added in
--   migration_002 (those track the removed WhatsApp Business API auto-send
--   attempt and always read 'not_configured' — do not repurpose them).
-- - Historical enquiries (rows that exist before this migration runs) get
--   enquiry_source = 'unknown' and whatsapp_opened = false by default. This
--   codebase's only enquiry-creation path has always been the website form,
--   but the system never recorded that fact at the time, so per the
--   no-fabricated-history rule we default to 'unknown' rather than assume.
-- - An enquiry is NOT a sale. "sales"/"sale_items" are a fully independent
--   ledger: a sale MAY reference an enquiry (enquiry_id, nullable) but is
--   never assumed to contain everything the enquiry requested, and a sale
--   can exist with no enquiry at all (WhatsApp/Instagram/walk-in/etc).
-- - sale_items snapshots product name/size/price at time of sale, mirroring
--   the existing enquiry_items pattern, so later catalogue/price edits never
--   rewrite historical sales.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- enquiries: source + WhatsApp-opened + outcome tracking
-- ----------------------------------------------------------------------------
alter table enquiries add column if not exists enquiry_source text not null default 'unknown';
alter table enquiries add column if not exists whatsapp_opened boolean not null default false;
alter table enquiries add column if not exists whatsapp_opened_at timestamptz;
alter table enquiries add column if not exists outcome text not null default 'no_decision';
alter table enquiries add column if not exists contacted_at timestamptz;
alter table enquiries add column if not exists completed_at timestamptz;

do $$ begin
  alter table enquiries add constraint enquiries_enquiry_source_check
    check (enquiry_source in ('website', 'whatsapp', 'unknown'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table enquiries add constraint enquiries_outcome_check
    check (outcome in ('no_decision', 'contacted', 'sale_completed', 'no_sale', 'cancelled'));
exception when duplicate_object then null; end $$;

comment on column enquiries.enquiry_source is 'website | whatsapp | unknown — how the enquiry itself originated. Never silently changed by a later WhatsApp click; see whatsapp_opened for that.';
comment on column enquiries.whatsapp_opened is 'True once the customer or admin has clicked a WhatsApp button for this enquiry and wa.me opened locally. This means WhatsApp OPENED, never that a message was sent — the customer still has to press Send themselves.';
comment on column enquiries.whatsapp_opened_at is 'Timestamp of the first time whatsapp_opened was set true.';
comment on column enquiries.outcome is 'no_decision | contacted | sale_completed | no_sale | cancelled — admin-recorded outcome, always manually set, never auto-derived from a sale existing.';

-- ----------------------------------------------------------------------------
-- sales — independent ledger of confirmed revenue. Not derived from
-- enquiries; estimated enquiry value is never counted as revenue.
-- ----------------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid references enquiries (id) on delete set null,
  customer_name text not null,
  whatsapp_number text,
  sale_date timestamptz not null default now(),
  source text not null default 'other',
  payment_method text not null default 'other',
  sale_amount numeric(10, 2) not null check (sale_amount >= 0),
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table sales add constraint sales_source_check
    check (source in ('website', 'whatsapp', 'instagram', 'walk_in', 'referral', 'other'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table sales add constraint sales_payment_method_check
    check (payment_method in ('cash', 'mobile_money', 'bank_transfer', 'other'));
exception when duplicate_object then null; end $$;

comment on table sales is 'Confirmed sales, recorded manually by the admin. The only source of revenue figures — never derived from enquiry totals.';
comment on column sales.enquiry_id is 'Optional link to the enquiry that led to this sale. Nullable: a sale may have no enquiry (direct WhatsApp/Instagram/walk-in/referral/other).';

drop trigger if exists trg_sales_updated_at on sales;
create trigger trg_sales_updated_at before update on sales
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- sale_items — snapshot of product/price at time of sale, mirroring
-- enquiry_items. Never rewritten by later catalogue/price changes.
-- ----------------------------------------------------------------------------
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales (id) on delete cascade,
  product_id uuid references products (id) on delete set null,
  product_name_snapshot text not null,
  brand_snapshot text,
  size_snapshot text not null,
  quantity int not null default 1,
  unit_price numeric(10, 2) not null,
  line_total numeric(10, 2) not null
);

-- ----------------------------------------------------------------------------
-- enquiry_activities — append-only timeline. Never fabricated for historical
-- rows; only written going forward from real events.
-- ----------------------------------------------------------------------------
create table if not exists enquiry_activities (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by text
);

do $$ begin
  alter table enquiry_activities add constraint enquiry_activities_event_type_check
    check (event_type in (
      'enquiry_created', 'whatsapp_opened', 'status_changed', 'outcome_changed',
      'note_added', 'sale_created', 'sale_updated'
    ));
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- enquiry_notes — private, admin-only notes. Never shown to customers, never
-- injected into WhatsApp messages.
-- ----------------------------------------------------------------------------
create table if not exists enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references enquiries (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  created_by text
);

-- ----------------------------------------------------------------------------
-- Indexes — matched to the actual query patterns this feature needs
-- (date-range filtering, source/opened filtering, per-enquiry/per-sale
-- lookups). enquiries.created_at and enquiries.status already exist.
-- ----------------------------------------------------------------------------
create index if not exists idx_enquiries_enquiry_source on enquiries (enquiry_source);
create index if not exists idx_enquiries_whatsapp_opened on enquiries (whatsapp_opened);
create index if not exists idx_enquiries_outcome on enquiries (outcome);

create index if not exists idx_enquiry_items_product_id on enquiry_items (product_id);

create index if not exists idx_sales_sale_date on sales (sale_date desc);
create index if not exists idx_sales_source on sales (source);
create index if not exists idx_sales_enquiry_id on sales (enquiry_id);

create index if not exists idx_sale_items_sale_id on sale_items (sale_id);
create index if not exists idx_sale_items_product_id on sale_items (product_id);

create index if not exists idx_enquiry_activities_enquiry_id on enquiry_activities (enquiry_id);
create index if not exists idx_enquiry_notes_enquiry_id on enquiry_notes (enquiry_id);

-- ============================================================================
-- Row Level Security — all new tables are pure internal business data with
-- no public-facing use case at all, so there is no public policy of any
-- kind (not even public insert). Admin (any authenticated Supabase Auth
-- user, matching every other table in this project) gets full access.
-- ============================================================================
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table enquiry_activities enable row level security;
alter table enquiry_notes enable row level security;

drop policy if exists "admin manage sales" on sales;
create policy "admin manage sales" on sales
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage sale_items" on sale_items;
create policy "admin manage sale_items" on sale_items
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage enquiry_activities" on enquiry_activities;
create policy "admin manage enquiry_activities" on enquiry_activities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage enquiry_notes" on enquiry_notes;
create policy "admin manage enquiry_notes" on enquiry_notes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
