import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const imageRoot = fileURLToPath(
  new URL("../../Patriasample/Patria/public/img", import.meta.url)
);
const products = JSON.parse(
  fs.readFileSync(
    new URL("../../Patriasample/Patria/data/products.json", import.meta.url),
    "utf8"
  )
);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const contentTypes = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function uploadObject(filePath, key) {
  const extension = path.extname(filePath).toLowerCase();
  const contentType = contentTypes[extension];

  if (!contentType) {
    console.warn(`Skipping unsupported image type: ${filePath}`);
    return;
  }

  console.log(`Uploading ${key}`);
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `patria-images/${key}`,
      `--file=${filePath}`,
      `--content-type=${contentType}`,
      "--remote",
    ],
    { stdio: "inherit" }
  );
}

for (const product of products) {
  const sourcePath = String(product.img || "").replace(/^img\//, "");
  const filePath = path.join(imageRoot, sourcePath);

  if (!product.id || !fs.existsSync(filePath)) {
    console.warn(`Skipping missing product image: ${product.id || sourcePath}`);
    continue;
  }

  uploadObject(filePath, `products/${product.id}/main.webp`);
}

const categoryRoot = path.join(imageRoot, "category");
if (fs.existsSync(categoryRoot)) {
  for (const entry of fs.readdirSync(categoryRoot, { withFileTypes: true })) {
    if (!entry.isFile() || path.extname(entry.name).toLowerCase() !== ".webp") {
      continue;
    }

    uploadObject(
      path.join(categoryRoot, entry.name),
      `categories/${entry.name}`
    );
  }
}

const bannerPath = path.join(imageRoot, "banner-img.webp");
if (fs.existsSync(bannerPath)) {
  uploadObject(bannerPath, "banners/home-hero.webp");
}

const avatarRoot = path.join(imageRoot, "avatars");
if (fs.existsSync(avatarRoot)) {
  for (const entry of fs.readdirSync(avatarRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }

    uploadObject(path.join(avatarRoot, entry.name), `avatars/${entry.name}`);
  }
}
