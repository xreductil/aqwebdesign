import { useEffect, useState } from "react";
import {
  addToCart,
  checkout,
  getCart,
  getCurrentUser,
  getOrders,
  getProducts,
  logout,
} from "./api/client.js";

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState("");

  useEffect(() => {
    Promise.all([
      getCurrentUser().catch(() => null),
      getProducts(),
      getCart(),
    ])
      .then(([me, productData, cartData]) => {
        setUser(me?.success ? me.user : null);
        setProducts(productData.products || []);
        setCart({
          items: cartData.items || [],
          total: cartData.total || 0,
        });
      })
      .catch((requestError) => {
        setError(requestError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;
    getOrders()
      .then((data) => setOrders(data.orders || []))
      .catch(() => setOrders([]));
  }, [user]);

  async function handleAdd(productId) {
    try {
      setCart(await addToCart(productId));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCheckout() {
    try {
      const data = await checkout(fulfillmentDate);
      setCart(data.cart);
      setOrders((currentOrders) => [data.order, ...currentOrders]);
      setFulfillmentDate("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
    setOrders([]);
  }

  if (loading) return <p>載入中...</p>;

  return (
    <main>
      <header>
        <h1>Patria</h1>
        {user ? (
          <div>
            <span>您好，{user.name || "會員"}</span>
            <button type="button" onClick={handleLogout}>登出</button>
          </div>
        ) : (
          <a href="/auth/line">使用 LINE 登入</a>
        )}
      </header>

      {error && <p role="alert">{error}</p>}

      <section>
        <h2>商品</h2>
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            {product.img && (
              <img
                className="product-card__image"
                src={product.img}
                alt={product.title}
                loading="lazy"
              />
            )}
            <h3>{product.title}</h3>
            <p>{product.price}</p>
            <button type="button" onClick={() => handleAdd(product.id)}>
              加入購物車
            </button>
          </article>
        ))}
      </section>

      <section>
        <h2>購物車</h2>
        {cart.items.length === 0 ? (
          <p>購物車是空的</p>
        ) : (
          <>
            {cart.items.map((item) => (
              <div className="cart-item" key={item.id}>
                {item.img && (
                  <img
                    className="cart-item__image"
                    src={item.img}
                    alt=""
                    loading="lazy"
                  />
                )}
                <span>{item.title} × {item.qty}</span>
              </div>
            ))}
            <strong>總額：${cart.total.toFixed(2)}</strong>
            <div>
              <input
                type="date"
                value={fulfillmentDate}
                onChange={(event) => setFulfillmentDate(event.target.value)}
              />
              <button type="button" onClick={handleCheckout} disabled={!user}>
                {user ? "送出訂單" : "請先登入"}
              </button>
            </div>
          </>
        )}
      </section>

      {user && (
        <section>
          <h2>我的訂單</h2>
          {orders.length === 0 ? (
            <p>尚無訂單</p>
          ) : (
            orders.map((order) => (
              <p key={order.id}>
                #{order.id} · {order.fulfillmentDate} · ${order.total.toFixed(2)}
              </p>
            ))
          )}
        </section>
      )}
    </main>
  );
}

export default App;
