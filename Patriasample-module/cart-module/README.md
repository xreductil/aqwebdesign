# Cart module

可移植的購物車功能，包含訪客／會員購物車、數量調整、刪除、優惠碼與結帳流程。

## 安裝

發布到 npm registry 後，在 React/Vite 網站中安裝：

```bash
npm install @patria/cart-ui
```

若使用本地模組資料夾：

```bash
npm install ./cart-module
```

## 使用

```js
import { createCartApi } from "@patria/cart-ui/api";
import { CartDrawer } from "@patria/cart-ui/drawer";
import "@patria/cart-ui/style.css";

const cartApi = createCartApi({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api"
});
```

client 會自動在瀏覽器 `localStorage` 建立 `patria_guest_id`，並以 `X-Guest-ID` header 傳給後端。若網站有自己的 guest identity，可傳入固定的 `guestId` 或自訂 `getGuestId`。

```jsx
<CartDrawer
  api={cartApi}
  open={cartOpen}
  onClose={() => setCartOpen(false)}
  onCheckout={(cart) => console.log(cart)}
/>
```

可不引入 `style.css`，改用自己的 CSS 覆寫 `.cart-module-*` class。預設樣式支援 `--cart-module-primary`、`--cart-module-surface` 與 `--cart-module-radius`。

## 套件入口

目前可直接從本資料夾或發布後的 npm package 引用：

```js
import { createCartApi } from "@patria/cart-ui/api";
import { CartDrawer } from "@patria/cart-ui/drawer";
import { getCart, cartSummary } from "@patria/cart-ui/backend";
```

`apiBaseUrl`、登入 cookie/token 行為與 UI 樣式都由接入網站決定。

## 前端

- `frontend/cart-api.js`：可設定 `apiBaseUrl` 的 API client。
- `frontend/CartDrawer.jsx`：最小可用購物車抽屜元件，可套用自己的 CSS。

```js
import { createCartApi } from "./cart-api.js";
const cartApi = createCartApi({ apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "" });
```

## 後端介面

主站目前已提供：`GET /api/cart`、`POST /api/cart/add`、`PATCH /api/cart/item`、`DELETE /api/cart/item`、`GET /api/coupons`、`POST /api/checkout`。

搬到其他網站時，保留這些路徑或在 API gateway 做對應即可。購物車資料需要 `guestCarts`、`userCarts` 與訂單資料表／集合。
