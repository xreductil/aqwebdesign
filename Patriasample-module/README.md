# Portable commerce modules

This repository contains portable cart, customer account, employee dashboard, data adapter, example-site, and SQLite demo modules.

## Modular installation

本專案的購物車、客戶後台與員工後台已整理成可移植模組。

### 1. 安裝前端模組

在其他 React/Vite 網站中，可直接引用模組：

```bash
npm install @patria/cart-ui @patria/customer-ui
```

使用：

```js
import { createCartApi } from "@patria/cart-ui/api";
import { CartDrawer } from "@patria/cart-ui/drawer";
import { createCustomerApi } from "@patria/customer-ui/api";
import { CustomerDashboard } from "@patria/customer-ui/dashboard";
import { startLineLogin, redirectAfterLineLogin } from "@patria/customer-ui/line-login";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
const cartApi = createCartApi({ apiBaseUrl });
const customerApi = createCustomerApi({ apiBaseUrl });
```

購物車 client 會自動產生並保存 `patria_guest_id`，每次 API request 送出 `X-Guest-ID`，以支援未登入使用者的購物車。

### 1.1 套用自己的 CSS

模組不會強制使用主站樣式；需要預設樣式時再個別引入：

```js
import "@patria/cart-ui/style.css";
import "@patria/customer-ui/style.css";
```

可在外部網站覆寫 CSS variables：

```css
.cart-module-overlay {
  --cart-module-primary: #2563eb;
  --cart-module-surface: #f8fafc;
  --cart-module-radius: 8px;
}

.customer-module {
  --customer-module-primary: #2563eb;
}
```

也可以完全不引入模組 CSS，直接用相同 class name 套用自己的設計。

### 2. 設定 API

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_PRODUCT_IMAGE_BASE_URL=/images/products
```

後端需提供購物車、會員與員工 API。API contract 位於：

- `cart-module/backend/README.md`
- `customer-backend-module/backend/README.md`
- `employee-backend-module/README.md`

### 3. 執行獨立 example site

```bash
cd example-site
npm install
npm run build
npm run dev
```

example site 不依賴 `Patria` 主站資料夾，可作為其他網站的最小整合範例。

### 4. 執行 SQLite demo

需要 Node.js 22.5 以上版本，建議使用 Node.js 25：

```bash
cd sqlite-demo
npm start
```

啟動後提供：

```text
GET http://127.0.0.1:8090/health
GET http://127.0.0.1:8090/api/products
```

SQLite 資料庫會建立在 `sqlite-demo/demo.sqlite`。資料表 schema 位於 `data-adapters/sql-schema.sql`。

### 5. 使用 PostgreSQL adapter

PostgreSQL adapter 使用 `pg` Pool，先在接入網站安裝：

```bash
npm install pg
```

```js
import pg from "pg";
import { createPostgresRepositories } from "./data-adapters/postgres-repositories.js";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const repositories = createPostgresRepositories({ pool });
```

PostgreSQL adapter 的方法是 async，router 也必須使用 `await`。

### 6. 驗證可移植性

至少應確認：

```bash
cd example-site
npm install
npm run build
```

並確認新網站不需要複製任何主站專案資料夾。
