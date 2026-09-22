-- ============================================================================
-- Met Scents — migration 005: inventory (ml-based), cost/profit tracking,
-- restocking ledger, and business expenses.
-- Run this in the Supabase SQL editor AFTER schema.sql, seed.sql,
-- migration_002_settings_and_notifications.sql, migration_003_sales_and_
-- analytics.sql, and migration_004_product_types.sql. Safe to re-run.
--
-- Design notes (read before editing):
-- - product_inventory/inventory_purchases/business_expenses are pure
--   internal business data, exactly like sales/sale_items in migration_003:
--   admin-only RLS, NO public policy of any kind. Cost/profit data must
--   never reach the storefront, which is why it lives here and not on the
--   publicly-readable `products` table.
-- - Costing is weighted-average, not FIFO: cost_per_ml is always
--   total_cost_invested / initial_ml, recomputed from two cumulative sums
--   that only ever grow. This stays correct across any number of restocks
--   at different prices without batch bookkeeping, and can never drift
--   because it is derived, never stored.
-- - Inventory status (in stock / low stock / out of stock) is ALWAYS
--   derived from current_ml vs threshold at query/app time — never stored
--   as a column — so it can't go stale relative to the real balance.
-- - sale_items' new columns are nullable: a sale line with no linked
--   product, or a variant with no size_ml, has no cost/profit tracked and
--   must render as "cost not tracked", never a fabricated 0.
-- - The two RPC functions are the only things allowed to mutate
--   product_inventory.current_ml, so every ml movement is atomic and
--   auditable. They are SECURITY DEFINER (same install method as the
--   existing set_updated_at() — paste and run in the SQL editor) with an
--   internal auth check and EXECUTE granted only to `authenticated`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- product_variants: optional ml value per size, so a sale line knows exactly
-- how much juice it represents. Null for sizes with no inventory tracking.
-- ----------------------------------------------------------------------------
alter table product_variants add column if not exists size_ml numeric(10, 2);

do $$ begin
  alter table product_variants add constraint product_variants_size_ml_check
    check (size_ml is null or size_ml > 0);
exception when duplicate_object then null; end $$;

comment on column product_variants.size_ml is 'Optional ml amount this size represents (e.g. "10ml Decant" -> 10). Null for sizes with no inventory tracking (e.g. bundles) — those variants can still be sold, just with no ml deduction/cost.';

-- ----------------------------------------------------------------------------
-- product_inventory — admin-only cost/ml tracking, 1:1 with products.
-- ----------------------------------------------------------------------------
create table if not exists product_inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products (id) on delete cascade,
  bottle_size_ml numeric(10, 2) not null check (bottle_size_ml > 0),
  decant_size_ml numeric(10, 2) not null default 10 check (decant_size_ml > 0),
  initial_ml numeric(10, 2) not null default 0 check (initial_ml >= 0),
  current_ml numeric(10, 2) not null default 0 check (current_ml >= 0),
  total_cost_invested numeric(10, 2) not null default 0 check (total_cost_invested >= 0),
  atomizer_cost numeric(10, 2) not null default 0 check (atomizer_cost >= 0),
  label_cost numeric(10, 2) not null default 0 check (label_cost >= 0),
  packaging_cost numeric(10, 2) not null default 0 check (packaging_cost >= 0),
  pouch_cost numeric(10, 2) not null default 0 check (pouch_cost >= 0),
  shipping_cost numeric(10, 2) not null default 0 check (shipping_cost >= 0),
  other_cost numeric(10, 2) not null default 0 check (other_cost >= 0),
  selling_price_per_decant numeric(10, 2) not null default 0 check (selling_price_per_decant >= 0),
  low_stock_threshold_ml numeric(10, 2) check (low_stock_threshold_ml is null or low_stock_threshold_ml >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_inventory_product_id on product_inventory (product_id);

drop trigger if exists trg_product_inventory_updated_at on product_inventory;
create trigger trg_product_inventory_updated_at before update on product_inventory
  for each row execute function set_updated_at();

comment on table product_inventory is 'Admin-only cost/ml tracking, 1:1 with products. Never joined into any public-readable query — cost fields must never reach the storefront.';
comment on column product_inventory.initial_ml is 'Cumulative ml ever purchased (grows on every restock, never decreases). Denominator for weighted-average cost per ml.';
comment on column product_inventory.total_cost_invested is 'Cumulative juice cost across every restock (numerator for weighted-average cost per ml). Does NOT include the per-decant extras (atomizer/label/etc) — those are flat per-unit costs applied at sale time.';
comment on column product_inventory.current_ml is 'Remaining ml. Decremented atomically on sale via record_inventory_sale(), restored via reverse_inventory_sale(). Status (in stock/low/out) is always DERIVED from this + threshold, never stored.';
comment on column product_inventory.low_stock_threshold_ml is 'Per-product override. Null means "use settings.default_low_stock_threshold_ml".';

-- ----------------------------------------------------------------------------
-- inventory_purchases — append-only restock ledger, gives per-fragrance
-- investment history. Never edited/deleted by the app.
-- ----------------------------------------------------------------------------
create table if not exists inventory_purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  bottle_size_ml numeric(10, 2) not null check (bottle_size_ml > 0),
  ml_added numeric(10, 2) not null check (ml_added > 0),
  cost_price numeric(10, 2) not null check (cost_price >= 0),
  purchase_date timestamptz not null default now(),
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_purchases_product_id on inventory_purchases (product_id);
create index if not exists idx_inventory_purchases_purchase_date on inventory_purchases (purchase_date desc);

comment on table inventory_purchases is 'Append-only restock history. Each row is a source-of-truth investment record, rolled into product_inventory totals by record_inventory_purchase().';

-- ----------------------------------------------------------------------------
-- business_expenses — marketing/branding/operating expenses, independent of
-- inventory. category is text+check (not a native enum), matching the
-- extensible pattern migration_003/004 already use.
-- ----------------------------------------------------------------------------
create table if not exists business_expenses (
  id uuid primary key default gen_random_uuid(),
  expense_name text not null,
  category text not null default 'other',
  amount numeric(10, 2) not null check (amount >= 0),
  expense_date timestamptz not null default now(),
  description text,
  related_product_id uuid references products (id) on delete set null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  alter table business_expenses add constraint business_expenses_category_check
    check (category in ('marketing', 'branding', 'packaging', 'delivery', 'inventory', 'equipment', 'other'));
exception when duplicate_object then null; end $$;

create index if not exists idx_business_expenses_expense_date on business_expenses (expense_date desc);
create index if not exists idx_business_expenses_category on business_expenses (category);

drop trigger if exists trg_business_expenses_updated_at on business_expenses;
create trigger trg_business_expenses_updated_at before update on business_expenses
  for each row execute function set_updated_at();

comment on table business_expenses is 'Marketing/branding/operating expenses. The granular presets from the brief (Meta Ads, TikTok Ads, influencer, photography, stickers, business cards, ...) are curated expense_name suggestions in the UI only, not a schema concept — category stays the coarse grouping used for totals.';

-- ----------------------------------------------------------------------------
-- sale_items — cost/profit snapshot columns. Nullable and backward
-- compatible: an existing or future free-text line item (no product_id, or
-- a variant with no size_ml) simply has no cost tracked.
-- ----------------------------------------------------------------------------
alter table sale_items add column if not exists variant_id uuid references product_variants (id) on delete set null;
alter table sale_items add column if not exists decant_size_ml numeric(10, 2);
alter table sale_items add column if not exists ml_deducted numeric(10, 2);
alter table sale_items add column if not exists unit_cost_snapshot numeric(10, 2);
alter table sale_items add column if not exists line_cost numeric(10, 2);
alter table sale_items add column if not exists line_profit numeric(10, 2);

create index if not exists idx_sale_items_variant_id on sale_items (variant_id);

comment on column sale_items.variant_id is 'Optional link to the specific size variant sold, so ml deduction/cost snapshotting knows the exact size_ml. Nullable: custom/free-text line items never had a variant.';
comment on column sale_items.unit_cost_snapshot is 'Cost PER UNIT (weighted-average juice cost for the decant size + atomizer/label/packaging/pouch/shipping/other), snapshotted at sale time so later cost edits never rewrite historical profit. Null when this line has no tracked inventory.';
comment on column sale_items.line_cost is 'unit_cost_snapshot * quantity. Null when unit_cost_snapshot is null.';
comment on column sale_items.line_profit is 'line_total - line_cost. Null when line_cost is null — must be displayed as "cost not tracked", never as 0.';

-- ----------------------------------------------------------------------------
-- settings — site-wide default low-stock threshold (per-product override
-- lives on product_inventory.low_stock_threshold_ml).
-- ----------------------------------------------------------------------------
alter table settings add column if not exists default_low_stock_threshold_ml numeric(10, 2) not null default 20;

-- ============================================================================
-- RPC functions — the only things allowed to mutate product_inventory's
-- ml/cost totals, so every movement is atomic and auditable.
-- ============================================================================

-- Restock: atomically append to the ledger and roll the totals into
-- product_inventory. Weighted-average cost is never stored — it is always
-- (total_cost_invested / initial_ml) at read/sale time.
create or replace function record_inventory_purchase(
  p_product_id uuid,
  p_bottle_size_ml numeric,
  p_ml_added numeric,
  p_cost_price numeric,
  p_purchase_date timestamptz,
  p_notes text,
  p_created_by text
) returns product_inventory
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv product_inventory%rowtype;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  select * into v_inv from product_inventory where product_id = p_product_id for update;
  if not found then
    raise exception 'No inventory record for this product — set up inventory tracking first.';
  end if;

  insert into inventory_purchases (product_id, bottle_size_ml, ml_added, cost_price, purchase_date, notes, created_by)
  values (p_product_id, p_bottle_size_ml, p_ml_added, p_cost_price, coalesce(p_purchase_date, now()), p_notes, p_created_by);

  update product_inventory
  set bottle_size_ml = p_bottle_size_ml,
      initial_ml = initial_ml + p_ml_added,
      current_ml = current_ml + p_ml_added,
      total_cost_invested = total_cost_invested + p_cost_price,
      updated_at = now()
  where product_id = p_product_id
  returning * into v_inv;

  return v_inv;
end;
$$;

revoke all on function record_inventory_purchase(uuid, numeric, numeric, numeric, timestamptz, text, text) from public;
grant execute on function record_inventory_purchase(uuid, numeric, numeric, numeric, timestamptz, text, text) to authenticated;

-- Sale: atomically compute the weighted-average cost snapshot for one sale
-- line and deduct ml, rejecting if it would go negative (blocks overselling).
create or replace function record_inventory_sale(
  p_product_id uuid,
  p_quantity int,
  p_ml_per_unit numeric
) returns table (unit_cost_snapshot numeric, ml_deducted numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv product_inventory%rowtype;
  v_avg_cost_per_ml numeric;
  v_total_ml numeric;
  v_unit_cost numeric;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  select * into v_inv from product_inventory where product_id = p_product_id for update;
  if not found then
    raise exception 'No inventory record for this product';
  end if;

  v_total_ml := p_quantity * p_ml_per_unit;
  if v_inv.current_ml < v_total_ml then
    raise exception 'Insufficient stock: % ml remaining, % ml requested', v_inv.current_ml, v_total_ml;
  end if;

  v_avg_cost_per_ml := case when v_inv.initial_ml > 0 then v_inv.total_cost_invested / v_inv.initial_ml else 0 end;
  v_unit_cost := (v_avg_cost_per_ml * p_ml_per_unit)
    + v_inv.atomizer_cost + v_inv.label_cost + v_inv.packaging_cost
    + v_inv.pouch_cost + v_inv.shipping_cost + v_inv.other_cost;

  update product_inventory set current_ml = current_ml - v_total_ml, updated_at = now() where product_id = p_product_id;

  return query select round(v_unit_cost, 2), v_total_ml;
end;
$$;

revoke all on function record_inventory_sale(uuid, int, numeric) from public;
grant execute on function record_inventory_sale(uuid, int, numeric) to authenticated;

-- Reversal (sale deleted / items replaced): restore ml. Silently no-ops if
-- the inventory record no longer exists rather than blocking the caller —
-- a sale must always be deletable even if its product was later removed.
create or replace function reverse_inventory_sale(
  p_product_id uuid,
  p_ml_to_restore numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authorized';
  end if;

  update product_inventory
  set current_ml = current_ml + p_ml_to_restore, updated_at = now()
  where product_id = p_product_id;
end;
$$;

revoke all on function reverse_inventory_sale(uuid, numeric) from public;
grant execute on function reverse_inventory_sale(uuid, numeric) to authenticated;

-- ============================================================================
-- Row Level Security — product_inventory / inventory_purchases /
-- business_expenses are pure internal business data with no public-facing
-- use case at all, exactly like sales/sale_items in migration_003: no
-- public policy of any kind, admin (any authenticated Supabase Auth user)
-- gets full access.
-- ============================================================================
alter table product_inventory enable row level security;
alter table inventory_purchases enable row level security;
alter table business_expenses enable row level security;

drop policy if exists "admin manage product_inventory" on product_inventory;
create policy "admin manage product_inventory" on product_inventory
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage inventory_purchases" on inventory_purchases;
create policy "admin manage inventory_purchases" on inventory_purchases
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin manage business_expenses" on business_expenses;
create policy "admin manage business_expenses" on business_expenses
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- products/product_variants keep their existing public-read policy
-- unchanged — cost data lives entirely in the new tables above, never on
-- products, so the storefront's public read never sees it.
