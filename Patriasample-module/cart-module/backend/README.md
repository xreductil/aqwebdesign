# Cart backend adapter

`cart-service.js` 放置與 HTTP framework 無關的購物車／優惠碼 domain logic；`cart-router.js` 提供可由任意 host server 掛載的 route handler。

`cart-router.js` 現在負責購物車與 checkout route 的判斷，host server 只需提供 `db`、目前登入者、商品清單與 persistence callback。

若 host 提供 `repositories.carts`，router 會使用 `user()`、`guest()` 與 `removeGuest()`；因此可直接替換 JSON、SQLite 或 PostgreSQL adapter。

必備資料：`guestCarts`、`userCarts`、`orders`、`coupons`。登入或註冊時要合併 guest cart 到會員 cart；結帳時要驗證登入、取貨日期、庫存／備貨天數與優惠碼。
