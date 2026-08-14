# Customer backend contract

`customer-router.js` 提供與 HTTP framework 無關的會員帳戶路由處理；host application 注入 password hashing、session cookie 與 persistence callback。

目前提供的 repository contract 包含 `users`、`sessions`、`orders` 與 `carts`；JSON adapter 位於專案的 `data-adapters/json-repositories.js`。

需要提供以下 API：

| Method | Path | 用途 |
| --- | --- | --- |
| POST | `/api/register` | 建立客戶帳戶 |
| POST | `/api/login` | 客戶／員工登入 |
| POST | `/api/logout` | 清除 session |
| GET | `/api/me` | 取得目前會員 |
| PUT | `/api/me` | 更新姓名、Email、電話、密碼 |
| PUT/DELETE | `/api/address` | 儲存／刪除地址 |
| GET | `/api/orders` | 取得目前會員訂單 |

後端必須依 session user id 過濾 `/api/orders`，不得讓客戶讀取其他會員訂單。
