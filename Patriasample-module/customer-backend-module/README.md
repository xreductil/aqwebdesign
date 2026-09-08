# Customer backend module

可移植的會員／客戶後台功能，包含註冊、登入、登出、會員資料、地址、訂單、物流與付款紀錄顯示。

## 安裝

發布到 npm registry 後，在 React/Vite 網站中安裝：

```bash
npm install @patria/customer-ui
```

若使用本地模組資料夾：

```bash
npm install ./customer-backend-module
```

## 使用

```js
import { createCustomerApi } from "@patria/customer-ui/api";
import { CustomerDashboard } from "@patria/customer-ui/dashboard";
import { startLineLogin, redirectAfterLineLogin } from "@patria/customer-ui/line-login";
import "@patria/customer-ui/style.css";

const customerApi = createCustomerApi({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api"
});
```

```jsx
<CustomerDashboard
  api={customerApi}
  onClose={() => navigate("/")}
/>
```

## LINE 登入成功後導向客戶後台

登入按鈕先記錄 pending 狀態，再導向後端 LINE endpoint：

```jsx
<button onClick={() => startLineLogin({ loginUrl: "/auth/line" })}>
  使用 LINE 登入
</button>
```

在首頁載入時執行一次：

```js
await redirectAfterLineLogin({
  api: customerApi,
  accountUrl: "/account"
});
```

流程會變成：

```text
登入按鈕 → LINE → 回到首頁 → GET /api/me → /account
```

只有由 LINE 登入流程返回的瀏覽器會被導向，不會影響一般訪客開啟首頁。

若網站使用 JWT 或其他驗證方式，請在 `customer-api.js` 的 request adapter 接入；預設使用 cookie session。可不引入預設 CSS，或覆寫 `.customer-module` 與 `--customer-module-primary` 等 variables。

## 套件入口

```js
import { createCustomerApi } from "@patria/customer-ui/api";
import { CustomerDashboard } from "@patria/customer-ui/dashboard";
```

- `frontend/customer-api.js`：會員 API client。
- `frontend/CustomerDashboard.jsx`：最小可用會員後台元件，可依接入網站品牌重新套版。
- `backend/README.md`：後端路由與資料需求。

主站目前使用 cookie session。搬到其他網站時，可沿用 session middleware，或把 client 的 `credentials` 改成 token 方案。

目前主站的 `/api/register`、`/api/login`、`/api/logout`、`/api/me`、`/api/address` 與 `/api/orders` 已由 `backend/customer-router.js` 處理；LINE 專用登入流程仍保留在主站，下一階段再抽成可選 adapter。
