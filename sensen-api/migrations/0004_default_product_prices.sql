-- Give legacy products without a configured price a category-based storefront default.
UPDATE products
SET price = CASE
  WHEN category_id = (SELECT id FROM categories WHERE slug = '生日蛋糕') THEN 780
  WHEN category_id = (SELECT id FROM categories WHERE slug = '造型蛋糕') THEN 980
  WHEN category_id = (SELECT id FROM categories WHERE slug = '冰淇淋蛋糕') THEN 880
  ELSE price
END,
updated_at = CURRENT_TIMESTAMP
WHERE price IS NULL OR price <= 0;
