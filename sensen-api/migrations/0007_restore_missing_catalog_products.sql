-- Restore the 18 products that are present in
-- sensen-backend/data/sensen-products.json but missing from production D1.
-- This migration is intentionally additive: it never deletes or updates an
-- existing product, order item, cart item, category, or image.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO categories (name, slug) VALUES
  ('生日蛋糕', '生日蛋糕'),
  ('造型蛋糕', '造型蛋糕'),
  ('冰淇淋蛋糕', '冰淇淋蛋糕');

INSERT OR IGNORE INTO products
  (category_id, name, slug, description, price, stock, image_key, is_active, metadata_json)
VALUES
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '繽紛世界', 'colorful-world', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2020-12.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2020-12.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '摩卡', 'mocha', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-15-2.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-15-2.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '榛果脆心巧思', 'hazelnut-crunch', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-13-1.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-13-1.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '黑森林', 'black-forest', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2020-4.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2020-4.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '雪芙蕾', 'souffle', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-11.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-11.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '馬卡龍森林', 'macaron-forest', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2020-15.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2020-15.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '草莓修多（季節限定）', 'strawberry-shudo', '季節限定生日蛋糕，價格請洽詢門市。', 0, 25, 'images/cake-9.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-9.png","desc":"季節限定生日蛋糕，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '玫瑰花束', 'rose-bouquet', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2024-6.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2024-6.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '波笛', 'bodhi-cake', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2024-7.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2024-7.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '泡芙王國', 'puff-kingdom', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-5-2.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-5-2.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '宇治禾風', 'uji-hayakaze', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2024-8.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2024-8.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '藍莓萊思克', 'blueberry-lysk', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2024-9.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2024-9.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '生日蛋糕' LIMIT 1), '天使', 'angel-cake', '生日蛋糕商品，價格請洽詢門市。', 0, 25, 'images/cake-2020-8.png', 1, '{"priceValue":0,"day":"5","img":"/assets/images/cake-2020-8.png","desc":"生日蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '造型蛋糕' LIMIT 1), '喜八柴柴', 'hibachi-shiba', '造型蛋糕商品，價格請洽詢門市。', 0, 15, 'images/cake-2024-3.png', 1, '{"priceValue":0,"day":"7","img":"/assets/images/cake-2024-3.png","desc":"造型蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '造型蛋糕' LIMIT 1), '拉拉熊', 'rilakkuma', '造型蛋糕商品，價格請洽詢門市。', 0, 15, 'images/cake-cartoon-6.png', 1, '{"priceValue":0,"day":"7","img":"/assets/images/cake-cartoon-6.png","desc":"造型蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '造型蛋糕' LIMIT 1), '皮卡丘', 'pikachu', '造型蛋糕商品，價格請洽詢門市。', 0, 15, 'images/cake-2024-5.png', 1, '{"priceValue":0,"day":"7","img":"/assets/images/cake-2024-5.png","desc":"造型蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '造型蛋糕' LIMIT 1), '可愛兔', 'cute-rabbit', '造型蛋糕商品，價格請洽詢門市。', 0, 15, 'images/cake-cartoon-2-2.png', 1, '{"priceValue":0,"day":"7","img":"/assets/images/cake-cartoon-2-2.png","desc":"造型蛋糕商品，價格請洽詢門市。","temporaryPrice":true}'),
  ((SELECT id FROM categories WHERE name = '冰淇淋蛋糕' LIMIT 1), '莓麗朵', 'berry-melody', '冰淇淋蛋糕商品，價格請洽詢門市。', 0, 15, 'images/cake-2024-12.png', 1, '{"priceValue":0,"day":"7","img":"/assets/images/cake-2024-12.png","desc":"冰淇淋蛋糕商品，價格請洽詢門市。","temporaryPrice":true}');

INSERT OR IGNORE INTO product_images (product_id, image_key, sort_order, is_primary)
SELECT id, image_key, 0, 1
FROM products
WHERE slug IN (
  'colorful-world', 'mocha', 'hazelnut-crunch', 'black-forest', 'souffle',
  'macaron-forest', 'strawberry-shudo', 'rose-bouquet', 'bodhi-cake',
  'puff-kingdom', 'uji-hayakaze', 'blueberry-lysk', 'angel-cake',
  'hibachi-shiba', 'rilakkuma', 'pikachu', 'cute-rabbit', 'berry-melody'
)
AND image_key IS NOT NULL;
