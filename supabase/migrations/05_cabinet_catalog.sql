-- 05_cabinet_catalog.sql
-- Seeds the cabinet catalog: two house lines (Classic Shaker / European Frameless)
-- with the colors Cesar resells. Supplier names are visible ONLY inside the
-- admin portal; the public site never shows them.
--
-- Prices are left at 0 on purpose: Cesar (or Angel) sets the real per-linear-foot
-- price and cost in Portal -> What you sell -> Cabinets. Entries seed as inactive
-- until a price is set, so a $0 cabinet can never appear on a quote by accident.
--
-- Safe to run more than once: each insert is guarded by WHERE NOT EXISTS on name.

create or replace function _seed_cabinet(
  p_name text, p_supplier text, p_tier text,
  p_desc_en text, p_desc_es text, p_swatch text, p_sort int
) returns void language plpgsql as $$
begin
  insert into materials (kind, name, supplier, tier, unit, unit_price, cost,
                         description_en, description_es, swatch_path, is_active, sort_order)
  select 'cabinet', p_name, p_supplier, p_tier, 'linear_ft', 0, 0,
         p_desc_en, p_desc_es, p_swatch, false, p_sort
  where not exists (
    select 1 from materials where kind = 'cabinet' and name = p_name and deleted_at is null
  );
end $$;

-- ---- Classic Shaker collection (all-wood, framed) --------------------------
select _seed_cabinet('White Shaker', 'Woodex', 'Classic Shaker',
  'Bright all-wood shaker, soft-close everything. The safest choice for resale.',
  'Shaker de madera blanco y luminoso, cierre suave en todo. La opción más segura para reventa.',
  '/images/catalog/swatch-shaker-white.webp', 10);

select _seed_cabinet('Grey Shaker', 'Woodex', 'Classic Shaker',
  'Cool mid-grey shaker that hides fingerprints and pairs with any stone.',
  'Shaker gris medio que disimula huellas y combina con cualquier piedra.',
  '/images/catalog/swatch-shaker-grey.webp', 20);

select _seed_cabinet('Espresso Shaker', 'Woodex', 'Classic Shaker',
  'Deep coffee-brown shaker for a warm, traditional kitchen.',
  'Shaker marrón café profundo para una cocina cálida y tradicional.',
  '/images/catalog/swatch-shaker-espresso.webp', 30);

select _seed_cabinet('Modern Slate Shaker', 'Woodex', 'Classic Shaker',
  'Charcoal slate shaker — the moody, designer look without designer prices.',
  'Shaker pizarra carbón: el look de diseñador sin precios de diseñador.',
  '/images/catalog/swatch-shaker-slate.webp', 40);

select _seed_cabinet('Navy Blue Shaker', 'Woodex', 'Classic Shaker',
  'Rich navy shaker, stunning on islands with white or gold-veined tops.',
  'Shaker azul marino intenso, espectacular en islas con cubiertas blancas o vetas doradas.',
  '/images/catalog/swatch-shaker-navy.webp', 50);

select _seed_cabinet('Powder Blue Shaker', 'Woodex', 'Classic Shaker',
  'Soft powder-blue shaker for coastal and farmhouse kitchens.',
  'Shaker azul claro suave para cocinas costeras y de estilo farmhouse.',
  '/images/catalog/swatch-shaker-powder-blue.webp', 60);

select _seed_cabinet('Light Blue Shaker', 'Woodex', 'Classic Shaker',
  'Airy light-blue shaker with a subtle grey undertone.',
  'Shaker azul claro con un sutil matiz gris.',
  '/images/catalog/swatch-shaker-light-blue.webp', 70);

select _seed_cabinet('Sage Green Shaker', 'Woodex', 'Classic Shaker',
  'Trending sage green shaker — organic, calm, magazine-ready.',
  'Shaker verde salvia en tendencia: orgánico, sereno, digno de revista.',
  '/images/catalog/swatch-shaker-sage.webp', 80);

select _seed_cabinet('Natural Oak Shaker', 'Woodex', 'Classic Shaker',
  'Warm natural oak grain in a clean shaker frame.',
  'Veta natural de roble cálido en un marco shaker limpio.',
  '/images/catalog/swatch-shaker-oak.webp', 90);

select _seed_cabinet('Cherry Shaker', 'Woodex', 'Classic Shaker',
  'Deep cherry-stained shaker for classic, formal kitchens.',
  'Shaker teñido cereza profundo para cocinas clásicas y formales.',
  '/images/catalog/swatch-shaker-cherry.webp', 100);

select _seed_cabinet('Classic White Raised Panel', 'Woodex', 'Raised Panel',
  'Traditional raised-panel door in warm white — timeless, detailed, elegant.',
  'Puerta tradicional de panel elevado en blanco cálido: atemporal, detallada, elegante.',
  '/images/catalog/swatch-raised-panel-white.webp', 110);

-- ---- European Frameless collection (modern slab) ---------------------------
select _seed_cabinet('European White Gloss', 'Woodex', 'European Frameless',
  'Seamless high-gloss white slab doors, full-access frameless boxes.',
  'Puertas lisas blanco brillante sin juntas, gabinetes frameless de acceso total.',
  '/images/catalog/swatch-euro-white-gloss.webp', 200);

select _seed_cabinet('European Light Oak', 'Woodex', 'European Frameless',
  'Scandinavian light-oak slab fronts — warm minimalism.',
  'Frentes lisos de roble claro escandinavo: minimalismo cálido.',
  '/images/catalog/swatch-euro-light-oak.webp', 210);

select _seed_cabinet('European Walnut', 'Woodex', 'European Frameless',
  'Rich walnut-grain slab fronts for a high-end modern look.',
  'Frentes lisos con veta de nogal para un look moderno de alta gama.',
  '/images/catalog/swatch-euro-walnut.webp', 220);

drop function _seed_cabinet(text, text, text, text, text, text, int);

notify pgrst, 'reload schema';
