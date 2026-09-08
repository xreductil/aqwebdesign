import fs from "node:fs";

const products = JSON.parse(
  fs.readFileSync(
    new URL("../../Patriasample/Patria/data/products.json", import.meta.url),
    "utf8"
  )
);

const imageBaseUrl = (
  process.env.PATRIA_IMAGE_BASE_URL ||
  "https://www.aq-webdesign.com/images"
).replace(/\/$/, "");

function imageUrl(product) {
  if (!product.id || !product.img) return null;
  return `${imageBaseUrl}/products/${encodeURIComponent(product.id)}/main.webp`;
}

function sql(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  return `'${String(value).replaceAll("'", "''")}'`;
}

for (const product of products) {
  const priceValue = Number(
    product.priceValue || String(product.price || "").replace(/[^0-9.]/g, "")
  ) || 0;

  console.log(`
INSERT INTO products (
  id, title, category, price_value, price, old_price, image_url,
  description, rating, reviews, calories, prep_time, tags, quantity, lead_days
) VALUES (
  ${sql(product.id)},
  ${sql(product.title)},
  ${sql(product.cat || "MENU")},
  ${sql(priceValue)},
  ${sql(product.price || `$${priceValue.toFixed(2)}`)},
  ${sql(product.old)},
  ${sql(imageUrl(product))},
  ${sql(product.desc)},
  ${sql(Number(product.rating) || null)},
  ${sql(Number(product.reviews) || null)},
  ${sql(Number(product.cal) || null)},
  ${sql(Number(product.time) || null)},
  ${sql(product.tags)},
  ${sql(Math.max(0, Number(product.quantity ?? 25)))},
  ${sql(Math.max(0, Number(product.day ?? 5)))}
)
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  category = excluded.category,
  price_value = excluded.price_value,
  price = excluded.price,
  old_price = excluded.old_price,
  image_url = excluded.image_url,
  description = excluded.description,
  rating = excluded.rating,
  reviews = excluded.reviews,
  calories = excluded.calories,
  prep_time = excluded.prep_time,
  tags = excluded.tags,
  quantity = excluded.quantity,
  lead_days = excluded.lead_days,
  updated_at = CURRENT_TIMESTAMP;`);
}
