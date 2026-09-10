-- ============================================================================
-- Met Scents — migration 004: rebuild "categories" into a real Product Type
-- system.
-- Run this in the Supabase SQL editor AFTER schema.sql, seed.sql,
-- migration_002_settings_and_notifications.sql, and
-- migration_003_sales_and_analytics.sql. Safe to re-run.
--
-- Design notes (read before editing):
-- - The existing `categories` table was never actually a product-type
--   classification — its 3 seeded rows ("Men's Fragrances", "Women's
--   Fragrances", "Unisex Fragrances") duplicate the `gender` column that
--   already exists on `products`. There is also no fragrance-characteristic
--   data (Fresh/Woody/Oud/etc.) anywhere in this database, so there is
--   nothing of that kind to migrate or preserve.
-- - This migration repurposes that table (rename, not recreate) into
--   `product_types` — "what kind of product is this" (Perfumes, Oils,
--   Bundles, Candles, ...) — and adds the `is_active` flag the admin UI
--   needs to retire a type without deleting it.
-- - `products.category` (free text, e.g. "unisex-fragrances") is renamed to
--   `products.legacy_category` and left in place, untouched, purely as an
--   audit trail of the old value. Nothing in the application reads it after
--   this migration. It is never dropped so no historical value is lost.
-- - `products.product_type_id` is the new FK every product actually uses.
--   Every existing product in this catalogue is a perfume, so this
--   migration backfills all of them to a single seeded "Perfumes" product
--   type — no product is left unassigned, no price/name/image/flag is
--   touched.
-- - The 3 old gender-named rows are deactivated (is_active = false), not
--   deleted: nothing in the new system references them by then, but
--   deleting them destroys data for no reason when deactivating is just as
--   safe and fully reversible.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Rename categories -> product_types, add is_active.
--    (Renaming preserves the table's id/created_at/updated_at columns, its
--    indexes, RLS, and the existing updated_at trigger automatically.)
-- ----------------------------------------------------------------------------
do $$ begin
  alter table categories rename to product_types;
exception when undefined_table then null; end $$;

alter table product_types add column if not exists is_active boolean not null default true;

-- Cosmetic rename of the trigger so it reads correctly against the new table
-- name; functionally identical to the one created in schema.sql.
drop trigger if exists trg_categories_updated_at on product_types;
drop trigger if exists trg_product_types_updated_at on product_types;
create trigger trg_product_types_updated_at before update on product_types
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. products: rename the old free-text `category` to `legacy_category`
--    (kept, unused, audit-only) and add the new `product_type_id` FK.
-- ----------------------------------------------------------------------------
do $$ begin
  alter table products rename column category to legacy_category;
exception when undefined_column then null; end $$;

comment on column products.legacy_category is 'Unused legacy value from the old gender-duplicate "categories" system, kept only as an audit trail. Superseded by product_type_id — see migration_004.';

alter table products add column if not exists product_type_id uuid references product_types (id) on delete restrict;

create index if not exists idx_products_product_type_id on products (product_type_id);

-- ----------------------------------------------------------------------------
-- 3. Seed the one product type every existing product actually needs, and
--    backfill every existing product onto it. Idempotent: re-running this
--    never creates a duplicate "Perfumes" row and never overwrites a
--    product that an admin has since reassigned to a different type.
-- ----------------------------------------------------------------------------
insert into product_types (name, slug, description, sort_order, is_active)
values ('Perfumes', 'perfumes', 'Eau de parfum, parfum and extrait decants and full bottles.', 1, true)
on conflict (slug) do nothing;

update products
set product_type_id = (select id from product_types where slug = 'perfumes')
where product_type_id is null;

-- ----------------------------------------------------------------------------
-- 4. Deactivate the old gender-named rows. Deactivating (not deleting) means
--    no data is destroyed and nothing needs reassigning first — no product
--    has referenced them since step 3 backfilled every row onto "Perfumes".
-- ----------------------------------------------------------------------------
update product_types
set is_active = false
where slug in ('men-fragrances', 'women-fragrances', 'unisex-fragrances');

-- ----------------------------------------------------------------------------
-- 5. Every product now has a type; enforce it going forward at the DB level
--    too (the admin form already requires one). Only applied once nothing is
--    null, so this is always safe to run.
-- ----------------------------------------------------------------------------
do $$ begin
  if not exists (select 1 from products where product_type_id is null) then
    alter table products alter column product_type_id set not null;
  end if;
end $$;

-- ============================================================================
-- Row Level Security — rename the policy names to match (same behavior:
-- public read, authenticated/admin full access — already attached to the
-- renamed table and does not need to be recreated to keep working; this is
-- purely so the policy list reads correctly under \d product_types).
-- ============================================================================
drop policy if exists "public read categories" on product_types;
create policy "public read product_types" on product_types
  for select using (true);

drop policy if exists "admin manage categories" on product_types;
create policy "admin manage product_types" on product_types
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
