-- ============================================================================
-- Met Scents — migration 006: admin greeting name.
-- Run this in the Supabase SQL editor AFTER migration_005_inventory_profit.sql.
-- Safe to re-run.
-- ============================================================================

-- How the shop owner wants to be addressed on the dashboard greeting, e.g.
-- "Mr. Odame" or "Mrs. Mensah" — free text since there's no reliable way to
-- infer an honorific, and it's admin-only (never shown to customers).
alter table settings add column if not exists admin_display_name text;

comment on column settings.admin_display_name is 'How to greet the shop owner on the admin dashboard, e.g. "Mr. Odame". Null shows a plain "Good morning." with no name.';

-- Fix the one RPC error message that reached the admin UI as a toast with an
-- em dash in it — CREATE OR REPLACE is safe to re-run against the function
-- already installed by migration_005.
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
    raise exception 'No inventory record for this product. Set up inventory tracking first.';
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
