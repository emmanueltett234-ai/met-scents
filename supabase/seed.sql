-- ============================================================================
-- Met Scents — initial catalogue seed
-- Run after schema.sql. Safe to re-run (upserts on slug).
-- Product images are left blank — upload them from /admin/products after
-- seeding; the site shows an elegant monogram placeholder until then.
-- ============================================================================

insert into categories (name, slug, description, sort_order) values
  ('Men''s Fragrances', 'men-fragrances', 'Bold, distinguished scents for him.', 1),
  ('Women''s Fragrances', 'women-fragrances', 'Elegant, refined scents for her.', 2),
  ('Unisex Fragrances', 'unisex-fragrances', 'Fragrances that transcend gender.', 3)
on conflict (slug) do update set name = excluded.name, description = excluded.description;

-- ----------------------------------------------------------------------------
-- Products
-- ----------------------------------------------------------------------------
insert into products (brand, name, slug, description, fragrance_notes, fragrance_type, gender, category, featured, new_arrival, best_seller, availability)
values
  ('Xerjoff', 'Vibrato', 'vibrato',
   'A radiant, honeyed gourmand with a warm amber trail — one of our most requested niche decants. Confident, long-lasting, and unmistakably premium.',
   'Bergamot, Saffron, Honey, Tobacco, Amber, Musk', 'Eau de Parfum', 'unisex', 'unisex-fragrances',
   true, false, true, 'available'),

  ('Jean Paul Gaultier', 'Le Male Elixir Absolu', 'jpg-le-male-elixir-absolu',
   'An intensified take on the JPG classic — smoky, spiced, and deeply seductive with a rich vanilla-tonka base built for cooler evenings.',
   'Lavender, Vanilla, Tonka Bean, Cardamom, Amberwood', 'Parfum', 'men', 'men-fragrances',
   false, true, false, 'available'),

  ('Xerjoff', 'Erba Pura', 'erba-pura',
   'A sun-drenched citrus and musk composition with a signature bubblegum-sweet drydown. Fresh, joyful and instantly recognisable.',
   'Bergamot, Lemon, Red Berries, Musk, Cotton Candy', 'Eau de Parfum', 'unisex', 'unisex-fragrances',
   true, false, false, 'available'),

  ('Nishane', 'Swy', 'swy',
   'A crisp, addictive fougère-gourmand blend balancing fresh lavender against a soft, sweet base. Understated luxury for daily wear.',
   'Lavender, Bergamot, Vanilla, Musk, Cedar', 'Extrait de Parfum', 'unisex', 'unisex-fragrances',
   false, false, false, 'available'),

  ('Gucci', 'Intense Oud', 'gucci-intense-oud',
   'A rich, woody oud fragrance layered with rose and spice — deep, resinous and enduring on the skin.',
   'Rose, Pepper, Oud, Vanilla, Patchouli', 'Eau de Parfum', 'unisex', 'unisex-fragrances',
   false, false, true, 'available'),

  ('Xerjoff', 'Bianco Latte', 'bianco-latte',
   'A creamy, powdery gourmand centred on soft musk and vanilla — comforting, elegant and effortlessly wearable.',
   'Bergamot, Milk Accord, Vanilla, White Musk, Sandalwood', 'Eau de Parfum', 'unisex', 'unisex-fragrances',
   false, false, false, 'available'),

  ('Gucci', 'Guilty Elixir', 'gucci-guilty-elixir',
   'A dark, spiced take on the Guilty line with intense woody-amber depth built to last from evening into night.',
   'Bergamot, Lavender, Amber, Patchouli, Vanilla', 'Parfum', 'men', 'men-fragrances',
   false, false, false, 'available'),

  ('Yves Saint Laurent', 'Myself Absolu', 'ysl-myself-absolu',
   'An intensified, more sensual expression of Myself — warm orange blossom and cedar wrapped in a suede-soft finish.',
   'Orange Blossom, Cedar, Amberwood, Suede', 'Parfum', 'men', 'men-fragrances',
   false, true, false, 'available')
on conflict (slug) do update set
  brand = excluded.brand,
  description = excluded.description,
  fragrance_notes = excluded.fragrance_notes,
  fragrance_type = excluded.fragrance_type,
  gender = excluded.gender,
  category = excluded.category;

-- ----------------------------------------------------------------------------
-- Variants (size / price)
-- ----------------------------------------------------------------------------
insert into product_variants (product_id, size, price, availability, sort_order)
select p.id, v.size, v.price, 'available', v.sort_order
from (values
  ('vibrato', '10ml Decant', 380.00, 1),
  ('vibrato', '100ml Full Bottle', 3700.00, 2),
  ('jpg-le-male-elixir-absolu', '10ml Decant', 200.00, 1),
  ('erba-pura', '10ml Decant', 320.00, 1),
  ('swy', '10ml Decant', 200.00, 1),
  ('gucci-intense-oud', '10ml Decant', 270.00, 1),
  ('bianco-latte', '10ml Decant', 300.00, 1),
  ('gucci-guilty-elixir', '10ml Decant', 230.00, 1),
  ('ysl-myself-absolu', '10ml Decant', 250.00, 1)
) as v(slug, size, price, sort_order)
join products p on p.slug = v.slug
where not exists (
  select 1 from product_variants ev where ev.product_id = p.id and ev.size = v.size
);
