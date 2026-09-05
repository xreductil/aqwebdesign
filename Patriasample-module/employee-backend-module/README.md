# Employee backend module

此資料夾是從 `dashboardsample` 複製出的完整員工後台，可獨立安裝與建置：

## 安裝

```bash
cd employee-backend-module
npm install
```

設定 API 位址：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_PRODUCT_IMAGE_BASE_URL=https://cdn.example.com/products
```

啟動開發環境：

```bash
npm run dev
```

建立部署檔案：

```bash
npm run build
```

建置後的 `dist/` 可部署到 `/admin/`、`/staff/` 或其他靜態路徑。後端必須提供 `/api/admin/*` API，並在伺服器端驗證 admin role；只依靠前端導頁並不具備權限安全性。

```bash
npm install
npm run build
```

主要頁面：`signin.html`、`signup.html`、`index.html`、`inventory.html`、`reports.html`、`create-product.html`。

`src/assets/js/admin-api.js` 集中管理產品、訂單、客戶、優惠碼、摘要與互動資料。部署到其他網站時，設定 `VITE_API_BASE_URL`，並提供 `/api/admin/*` API；後端必須在所有 `/api/admin/*` 路由驗證 admin role。

## 自訂 CSS 與品牌

員工後台的 SCSS 位於 `src/assets/scss/`。接入其他網站時，可以覆寫 Bootstrap `$primary`、`$body-bg` 與 `src/assets/scss/_custom.scss` 的 theme variables，再重新執行 `npm run build`。後台不需要修改 API 或 router。

主站的訂單、客戶、優惠碼、摘要、訂單狀態，以及產品 CRUD API 已由 `backend/employee-router.js` 處理，並透過 repository／資料 adapter 讀取或寫入資料。

## 移植設定

後台不再依賴外部 Patria 專案檔案。可使用 Vite 環境變數：

```env
VITE_API_BASE_URL=https://api.example.com
VITE_PRODUCT_IMAGE_BASE_URL=https://cdn.example.com/products
```

若需要在沒有 API 的展示環境提供預設商品，可在頁面載入前設定：

```html
<script>
  window.__EMPLOYEE_MODULE_CONFIG__ = {
    apiBaseUrl: '/api',
    productImageBaseUrl: '/images/products',
    storeUrl: '/',
    brandName: 'My Restaurant',
    defaultProducts: []
  };
</script>
```
