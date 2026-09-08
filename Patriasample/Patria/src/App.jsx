import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  checkout,
  getCart,
  getCoupons,
  getCurrentUser,
  getOrders,
  getProducts,
  login,
  logout,
  register,
  sendReservation,
  sendContactMessage,
  subscribeNewsletter,
  removeCartItem,
  updateMemberAddress,
  updateMemberProfile,
  updateCartItem,
} from "./api/client.js";

const imageBase = "https://www.aq-webdesign.com/images";

const categories = [
  { name: "ALL", image: "./img/category/1.webp" },
  { name: "NOODLES", image: "./img/category/2.webp" },
  { name: "DIM SUM", image: "./img/category/4.webp" },
  { name: "RICE", image: "./img/category/5.webp" },
  { name: "SOUP", image: "./img/category/6.webp" },
];

const fallbackCoupons = [
  { code: "WELCOME15", label: "Welcome 15% off", type: "percent", value: 15, min: 0 },
  { code: "PATRIA10", label: "Patria 10% off", type: "percent", value: 10, min: 0 },
  { code: "FAMILY5", label: "$5 family order discount", type: "fixed", value: 5, min: 40 },
];

const orderStatusLabel = {
  created: "訂單已建立",
  completed: "準備完成",
  picked_up: "已取貨",
  cancelled: "已取消",
};

function OrderStatus({ status }) {
  const key = String(status || "created").toLowerCase();
  return <span className={"account-order-status status-" + key}>{orderStatusLabel[key] || key}</span>;
}

function OrderSummary({ order }) {
  return (
    <div className="account-empty-row account-order-summary" key={order.id}>
      <div className="account-order-id"><span>Order</span><strong>#{order.id}</strong></div>
      <div className="account-order-meta"><OrderStatus status={order.status} /><strong>${Number(order.total || 0).toFixed(2)}</strong></div>
    </div>
  );
}

function ProductCard({ product, badge = "Featured", onOpen }) {
  return (
    <div
      id={`product-${product.id}`}
      className="mcard"
      onClick={() => onOpen(product)}
      data-img={product.img}
      data-title={product.title}
      data-cat={product.cat}
      data-price={product.price}
      data-rating={product.rating || "4.9"}
      data-desc={product.desc}
    >
      <div className="mimg">
        <img src={product.img} alt={product.title} loading="lazy" />
        <div className="mbdg hot"><i className="fas fa-star" /> {badge}</div>
        <div className="mhrt" onClick={(event) => event.stopPropagation()}><i className="far fa-heart" /></div>
      </div>
      <div className="mbody">
        <div className="mcat">{product.cat}</div>
        <div className="mtit">{product.title}</div>
        <div className="mdesc">{product.desc}</div>
        <div className="mfoot">
          <div>
            <div className="mprice">{product.price}</div>
            <div className="mstars"><i className="fas fa-star" /> {product.rating || "4.9"}</div>
          </div>
          <button type="button" className="madd" onClick={(event) => { event.stopPropagation(); onOpen(product); }} title="View Details">
            <i className="fas fa-plus" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ product, quantity, setQuantity, onClose, onAdd }) {
  if (!product) return null;
  const rating = Number(product.rating || 4.9);
  const fullStars = Math.round(rating);
  const tags = String(product.tags || product.cat || "Patria").split(",").map((tag) => tag.trim()).filter(Boolean);
  return (
    <div id="menuPop" className="open" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="mpbox">
        <button type="button" className="mpclose" onClick={onClose} aria-label="Close product details"><i className="fas fa-times" /></button>
        <div className="mpimg"><img src={product.img} alt={product.title} /></div>
        <div className="mpbody">
          <div id="mpCat">{product.cat}</div>
          <div id="mpTitle">{product.title}</div>
          <div id="mpStars">{Array.from({ length: 5 }, (_, index) => <i className={index < fullStars ? "fas fa-star" : "far fa-star"} key={index} />)} <span>{rating} ({product.reviews || 0} reviews)</span></div>
          <div id="mpDesc">{product.desc}</div>
          <div id="mpPrice">{product.price}{product.old && <small>{product.old}</small>}</div>
          <div className="mpmeta" id="mpMeta">
            <div className="mpm"><div className="mpmv">{product.cal || "—"} kcal</div><div className="mpml">Calories</div></div>
            <div className="mpm"><div className="mpmv">{product.time || "—"} min</div><div className="mpml">Prep Time</div></div>
            <div className="mpm"><div className="mpmv">{rating}/5</div><div className="mpml">Rating</div></div>
          </div>
          <div className="mpqty"><button type="button" className="mpqbtn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span className="mpqnum">{quantity}</span><button type="button" className="mpqbtn" onClick={() => setQuantity(quantity + 1)}>+</button><span className="mpportion">portion</span></div>
          <div className="mptags">{tags.map((tag) => <span className="mptag" key={tag}>{tag}</span>)}</div>
          <button type="button" className="mpaddcart" onClick={() => onAdd(product.id, quantity)}><i className="fas fa-shopping-cart" /> Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

function OrderDrawer({ cart, user, coupons, couponCode, setCouponCode, couponMessage, fulfillmentDate, setFulfillmentDate, onApplyCoupon, onRemoveCoupon, onChangeQty, onRemove, onCheckout, onClose, busy, error }) {
  const subtotal = Number(cart.total || 0);
  const availableCoupons = coupons.length ? coupons : fallbackCoupons;
  const coupon = availableCoupons.find((item) => String(item.code).toUpperCase() === couponCode.toUpperCase());
  const discount = coupon && subtotal >= Number(coupon.min || 0)
    ? Math.min(subtotal, coupon.type === "percent" ? subtotal * Number(coupon.value || 0) / 100 : Number(coupon.value || 0))
    : 0;
  const total = Math.max(0, subtotal - discount);
  const leadDays = cart.items.reduce((max, item) => Math.max(max, Number(item.day || 5)), 0);
  const minimumDateObject = new Date();
  minimumDateObject.setHours(0, 0, 0, 0);
  minimumDateObject.setDate(minimumDateObject.getDate() + leadDays);
  const minimumDate = minimumDateObject.toISOString().slice(0, 10);

  return (
    <div className="order-overlay open react-order-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="order-drawer" aria-label="Your Order">
        <div className="order-head"><h2>Your Order</h2><button type="button" className="order-close" onClick={onClose} aria-label="Close order"><i className="fas fa-times" /></button></div>
        <div className={`order-body${cart.items.length ? "" : " is-empty"}`}>
          {!cart.items.length ? <p className="order-empty">No products in the cart.</p> : <>
            <div className="order-list">
              {cart.items.map((item) => {
                const quantity = Number(item.qty || 0);
                const itemTotal = Number(item.priceValue || 0) * quantity;
                return <div className="order-item" key={item.id}>
                  <img src={item.img} alt={item.title} />
                  <div className="order-item-info">
                    <div className="order-item-title">{item.title}</div>
                    <div className="order-item-meta">{item.cat} · {item.price}</div>
                    <div className="order-controls">
                      <button type="button" className="order-qty-btn" onClick={() => onChangeQty(item, quantity - 1)} aria-label={"Decrease " + item.title}>−</button>
                      <span className="order-qty">{quantity}</span>
                      <button type="button" className="order-qty-btn" onClick={() => onChangeQty(item, quantity + 1)} aria-label={"Increase " + item.title}>+</button>
                      <button type="button" className="order-remove" onClick={() => onRemove(item)}>Remove</button>
                    </div>
                    <div className="order-item-total">{"$"}{itemTotal.toFixed(2)}</div>
                  </div>
                </div>;
              })}
            </div>
            <div className="coupon-box order-coupon">
              <label htmlFor="orderCouponInput">優惠碼</label>
              <div className="coupon-controls"><input id="orderCouponInput" type="text" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="輸入 WELCOME15" /><button type="button" onClick={onApplyCoupon}>Apply</button>{couponCode && <button type="button" onClick={onRemoveCoupon}>Remove</button>}</div>
              {couponMessage && <p className={`coupon-message ${coupon ? "success" : "error"}`}>{couponMessage}</p>}
            </div>
            <div className="order-summary order-total-lines">
              <div><span>Subtotal</span><span>{"$"}{subtotal.toFixed(2)}</span></div>
              {discount > 0 && <div className="discount"><span>Discount</span><span>−{"$"}{discount.toFixed(2)}</span></div>}
              <div className="grand-total"><span>Total</span><span>{"$"}{total.toFixed(2)}</span></div>
            </div>
            <label className="order-date-field">Pickup date<input type="date" min={minimumDate} value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} /></label>
            <p className="order-login-note">Earliest available date is {minimumDate} because this order requires {leadDays} days notice.</p>
            {error && <p className="coupon-message error">{error}</p>}
            <button type="button" className="order-checkout" disabled={busy} onClick={onCheckout}>{busy ? "Processing..." : "Checkout"}</button>
            <p className="order-login-note">{user ? "You are logged in and ready to checkout." : "Please log in before checkout."}</p>
          </>}
        </div>
      </aside>
    </div>
  );
}

function CheckoutModal({ cart, user, fulfillmentDate, total, couponCode, onConfirm, onClose, onEditCart, busy, error }) {
  const [detailsConfirmed, setDetailsConfirmed] = useState(false);
  const address = user?.address || {};
  const addressText = [address.address, address.city, address.zip].filter(Boolean).join(", ");
  const nameParts = String(user?.name || "").trim().split(/\s+/).filter(Boolean);

  function goToDetails() {
    setDetailsConfirmed(true);
    window.requestAnimationFrame(() => document.getElementById("checkoutDetailsPanel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="checkout-overlay" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <section className="checkout-page">
        <header className="checkout-page-head"><div className="container"><h1 id="checkoutTitle">Checkout</h1><p>Complete your pickup order from our Patria kitchen.</p></div></header>
        <div className="checkout-layout container">
          <main className="checkout-form-column">
            <div className="checkout-wallets"><button type="button" className="checkout-wallet" disabled><i className="fab fa-apple" />Pay <small>即將開放</small></button><button type="button" className="checkout-wallet" disabled><strong className="google-g">G</strong>Pay <small>即將開放</small></button></div>
            <div className="checkout-or"><span>— OR —</span></div>
            <section className="checkout-details-panel" id="checkoutDetailsPanel"><h2>Your Details</h2><div className="checkout-fields two-col"><label>First name *<input value={nameParts[0] || ""} readOnly /></label><label>Last name *<input value={nameParts.slice(1).join(" ")} readOnly /></label></div><label>Email address *<input type="email" value={user?.email || ""} readOnly /></label><label>Country / Region *<select defaultValue="Taiwan"><option>Taiwan</option><option>Australia</option><option>United States</option><option>Japan</option></select></label><label>Street address *<input value={address.address || ""} placeholder="House number and street name" readOnly /></label><label>Postcode *<input value={address.zip || ""} placeholder="Postcode" readOnly /></label><div className="checkout-pickup-field"><i className="fas fa-calendar-day" /><div><span>Pickup date</span><strong>{fulfillmentDate}</strong></div></div><p className="checkout-form-note">需要修改姓名、地址或電話？請返回會員中心的 Account Details／Addresses 更新。</p><button type="button" className="checkout-confirm checkout-details-confirm" disabled={busy || !detailsConfirmed} onClick={onConfirm}>{busy ? "Processing..." : "確認填寫並完成結帳"}</button></section>
          </main>
          <aside className="checkout-order-column"><section className="checkout-order-panel"><div className="checkout-order-title"><h2>Your Order</h2><button type="button" onClick={onEditCart}><i className="fas fa-pen-to-square" /> Edit Cart</button></div><div className="checkout-coupon"><input value={couponCode || ""} placeholder="Coupon code" readOnly /><button type="button" onClick={onEditCart}>Apply coupon</button></div><div className="checkout-items">{cart.items.map((item) => <div className="checkout-item" key={item.id}><span>{item.title} × {item.qty}</span><strong>${(Number(item.priceValue || 0) * Number(item.qty || 0)).toFixed(2)}</strong></div>)}</div><div className="checkout-total-lines"><div><span>Subtotal</span><strong>${Number(cart.total || 0).toFixed(2)}</strong></div>{Number(cart.total || 0) !== Number(total || 0) && <div><span>Total after discount</span><strong>${Number(total || 0).toFixed(2)}</strong></div>}<div className="checkout-grand-total"><span>Total</span><strong>${Number(total || 0).toFixed(2)}</strong></div></div><section className="checkout-payment-card"><h3>Payment</h3><div className="checkout-safe"><i className="fas fa-shield-halved" /><div><strong>Secure payment</strong><span>付款資料由金流服務商處理，Patria 不會儲存信用卡敏感資料。</span></div></div><p className="checkout-note">目前會先建立訂單；正式啟用金流服務後，付款方式會在此安全完成。</p></section>{error && <p className="coupon-message error">{error}</p>}<button type="button" className="checkout-confirm" disabled={busy || detailsConfirmed} onClick={goToDetails}>{detailsConfirmed ? "已前往 Your Details" : "確認訂單"}</button><button type="button" className="checkout-back" onClick={onClose}>返回購物車</button></section></aside>
        </div>
      </section>
    </div>
  );
}

function GalleryModal({ items, index, setIndex, onClose }) {
  if (index === null) return null;
  const item = items[index];
  return <div id="galPop" className="open" onClick={(event) => event.target === event.currentTarget && onClose()}><div className="gpbox"><button type="button" className="gpclose" onClick={onClose} aria-label="Close gallery"><i className="fas fa-times" /></button><div className="gallery-scroll"><img id="gpImg" src={item.img} alt={item.title} /><div className="gpcap"><h5 id="gpTitle">{item.title}</h5><p id="gpDesc">{item.desc}</p></div><div className="gpnav"><button type="button" onClick={() => setIndex((index - 1 + items.length) % items.length)}><i className="fas fa-chevron-left me-1" />Prev</button><button type="button" onClick={() => setIndex((index + 1) % items.length)}>Next <i className="fas fa-chevron-right ms-1" /></button></div></div></div></div>;
}

function ReservationSection({ form, setForm, status, setStatus }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await sendReservation(form);
      setStatus("Table reserved! We'll confirm via email shortly.");
      setForm({ name: "", phone: "", email: "", guests: "2 People", date: "", time: "09:00 AM", requests: "" });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <section id="reservation"><div className="container"><div className="text-center mb-5"><span className="slbl">Book a Table</span><h2 className="stitle">Make a <span>Reservation</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>Reserve your table for a memorable dining experience. We recommend booking 24 hours in advance for weekend evenings.</p></div><div className="row g-4 align-items-start"><div className="col-lg-4"><div style={{ background: "var(--dark)", borderRadius: 18, padding: 36 }}><h4 style={{ color: "#fff", fontSize: "1.3rem", marginBottom: 8 }}>Contact Info</h4><p style={{ color: "rgba(255,255,255,.55)", fontSize: ".85rem", marginBottom: 26 }}>We're happy to help you plan the perfect dining experience.</p><div className="d-flex flex-column gap-3">{[["clock", "Opening Hours", "Mon - Sun, 09 AM - 11 PM"], ["phone-alt", "Call for Booking", "+1 (300) 659-4381"], ["users", "Group Dining", "Special menus for 10+ guests"], ["map-marker-alt", "Location", "52 Teka Street, LA"]].map(([icon, title, text]) => <div className="d-flex align-items-center gap-3" key={title}><div className="reservation-info-icon"><i className={`fas fa-${icon}`} /></div><div><strong className="reservation-info-title">{title}</strong><span className="reservation-info-text">{text}</span></div></div>)}</div></div></div><div className="col-lg-8"><form className="reservation-card" onSubmit={submit}><div className="row g-3"><div className="col-sm-6"><label className="flbl">Full Name *</label><input required className="fctrl" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="John Doe" /></div><div className="col-sm-6"><label className="flbl">Phone Number *</label><input required type="tel" className="fctrl" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+1 (800) 000-0000" /></div><div className="col-sm-6"><label className="flbl">Email Address *</label><input required type="email" className="fctrl" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@email.com" /></div><div className="col-sm-6"><label className="flbl">Number of Guests *</label><select required className="fctrl" value={form.guests} onChange={(event) => setForm({ ...form, guests: event.target.value })}>{["1 Person", "2 People", "3 - 4 People", "5 - 6 People", "7 -10 People", "10+ People"].map((value) => <option key={value}>{value}</option>)}</select></div><div className="col-sm-6"><label className="flbl">Date *</label><input required type="date" className="fctrl" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div><div className="col-sm-6"><label className="flbl">Time *</label><select required className="fctrl" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })}>{["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM"].map((value) => <option key={value}>{value}</option>)}</select></div><div className="col-12"><label className="flbl">Special Requests</label><textarea className="fctrl" rows="3" value={form.requests} onChange={(event) => setForm({ ...form, requests: event.target.value })} placeholder="Allergies, dietary needs, special occasions..." /></div><div className="col-12"><button type="submit" className="btn-red w-100 justify-content-center" disabled={busy}><i className={busy ? "fas fa-spinner fa-spin" : "fas fa-calendar-check"} />{busy ? " Booking..." : " Confirm Reservation"}</button></div></div>{status && <p className="sucmsg reservation-status">{status}</p>}</form></div></div></div></section>;
}

function NewsletterSection({ email, setEmail, status, setStatus }) {
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      await subscribeNewsletter(email);
      setStatus("Subscribed! Check your inbox for Patria updates.");
      setEmail("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }
  return <section id="newsletter"><div className="nlbg" /><div className="container"><div className="nlw text-center"><span className="slbl" style={{ color: "rgba(255,255,255,.7)" }}>Stay Connected</span><h2 className="mb-3" style={{ color: "#fff" }}>Subscribe &amp; Get Exclusive <span style={{ color: "var(--secondary)" }}>Deals</span></h2><p className="mb-4" style={{ color: "rgba(255,255,255,.78)" }}>Get 15% off your first order plus early access to new menu items</p><form className="nl-form-wrap" onSubmit={submit}><input required type="email" className="nlinput" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address..." /><button type="submit" className="nlbtn" disabled={busy}><i className="fas fa-paper-plane me-1" />{busy ? "Subscribing..." : "Subscribe"}</button></form>{status && <p className="newsletter-status">{status}</p>}<p style={{ color: "rgba(255,255,255,.45)", fontSize: ".76rem", marginTop: 11 }}><i className="fas fa-lock me-1" />No spam, unsubscribe anytime.</p></div></div></section>;
}

function DealCountdown() {
  const [remaining, setRemaining] = useState({ hours: 8, minutes: 45, seconds: 30 });
  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        const total = current.hours * 3600 + current.minutes * 60 + current.seconds - 1;
        const value = total <= 0 ? 8 * 3600 + 45 * 60 + 30 : total;
        return { hours: Math.floor(value / 3600), minutes: Math.floor((value % 3600) / 60), seconds: value % 60 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <div className="deal-countdown" aria-label="Special offer countdown"><span>Today's offer ends in</span><strong>{String(remaining.hours).padStart(2, "0")}:{String(remaining.minutes).padStart(2, "0")}:{String(remaining.seconds).padStart(2, "0")}</strong></div>;
}

function MemberDashboard({ user, orders, page, setPage, addressForm, setAddressForm, detailsForm, setDetailsForm, onSaveAddress, onSaveDetails, onLinkLine, onLogout, onClose, notice, menuOpen, setMenuOpen }) {
  const addressLabel = addressForm.address ? [addressForm.address, addressForm.city, addressForm.zip].filter(Boolean).join(", ") : "No address saved yet.";
  return (
    <div className="account-dashboard open react-account-dashboard" id="accountDashboard">
      <div className="container">
        <div className="account-dashboard-grid">
          <aside className={`account-side${menuOpen ? " open" : ""}`} id="accountSideMenu">
            <div className="account-site-links">
              <a href="#hero" onClick={() => { setMenuOpen(false); onClose(); }}>Home</a>
              <a href="#menu" onClick={() => { setMenuOpen(false); onClose(); }}>Menu</a>
              <a href="#contact-section" onClick={() => { setMenuOpen(false); onClose(); }}>Contact</a>
              <button type="button" onClick={() => { setMenuOpen(false); onClose(); }}>Back to store</button>
            </div>
            {[['dashboard', 'Dashboard'], ['orders', `Orders (${orders.length})`], ['shipping', '物流 Shipping'], ['addresses', 'Addresses'], ['payments', '金流 Payments'], ['details', 'Account Details']].map(([key, label]) => <button className={page === key ? "active" : ""} type="button" data-account-page={key} key={key} onClick={() => { setMenuOpen(false); setPage(key); }}>{label}</button>)}
            <button type="button" id="linkLineBtn" onClick={() => { setMenuOpen(false); onLinkLine(); }}>綁定 LINE 帳號</button>
            <button id="accountLogout" type="button" onClick={onLogout}>Logout</button>
          </aside>

          <main className="account-main">
            {page === "dashboard" && <section className="account-page active">
              <h2>Welcome back,<br />{user.name || "Patria member"}</h2>
              <p className="account-main-desc">Here’s an overview of your account. View your recent orders, manage your addresses and update your account details.</p>
              <div className="account-stat-grid">
                <div className="account-stat"><i className="fas fa-utensils" /><div><strong>Recent Orders</strong><span>{orders.length} {orders.length === 1 ? "order" : "orders"}</span></div></div>
                <div className="account-stat"><i className="fas fa-user" /><div><strong>Account Details</strong><span>{user.name || "Member"}</span></div></div>
              </div>
              <section className="account-section"><div className="account-section-head"><h3>Recent Orders</h3><button type="button" onClick={() => setPage("orders")}>View All Orders</button></div>{orders.length ? orders.slice(0, 3).map((order) => <OrderSummary order={order} key={order.id} />) : <div className="account-empty-row"><span>You have not placed an order yet.</span><button type="button" className="account-start-order" onClick={onClose}>Start an order</button></div>}</section>
              <div className="account-card-grid"><section className="account-mini-card"><i className="fas fa-truck" /><div><h3>物流 Shipping</h3><p>查看取貨日期與訂單物流狀態。</p><button type="button" onClick={() => setPage("shipping")}>查看物流</button></div></section><section className="account-mini-card"><i className="fas fa-credit-card" /><div><h3>金流 Payments</h3><p>查看付款方式、訂單金額與付款狀態。</p><button type="button" onClick={() => setPage("payments")}>查看金流</button></div></section><section className="account-mini-card"><i className="fas fa-utensils" /><div><h3>Need Something Delicious?</h3><p>Your Patria favourites are only a few clicks away.</p><button type="button" className="account-start-order filled" onClick={onClose}>Start a New Order</button></div></section></div>
            </section>}

            {page === "orders" && <section className="account-page active"><h2>Orders</h2><p className="account-main-desc">Track your recent orders and start a new Patria order anytime.</p><section className="account-section"><div className="account-section-head"><h3>Recent Orders</h3><button type="button" className="account-start-order" onClick={onClose}>Start an order</button></div>{orders.length ? orders.map((order) => <OrderSummary order={order} key={order.id} />) : <div className="account-empty-row"><span>You have not placed an order yet.</span><button type="button" className="account-start-order" onClick={onClose}>Browse Menu</button></div>}</section></section>}

            {page === "addresses" && <section className="account-page active"><h2>Addresses</h2><p className="account-main-desc">Manage the address used for delivery and pickup updates.</p><section className="account-section account-form-section"><h3>Saved Address</h3><div className="account-form-grid"><label>Full Name<input type="text" value={addressForm.fullName} onChange={(event) => setAddressForm({ ...addressForm, fullName: event.target.value })} /></label><label>Phone<input type="text" value={addressForm.phone} onChange={(event) => setAddressForm({ ...addressForm, phone: event.target.value })} placeholder="Phone number" /></label><label className="wide">Address<input type="text" value={addressForm.address} onChange={(event) => setAddressForm({ ...addressForm, address: event.target.value })} placeholder="Add your delivery address" /></label><label>City<input type="text" value={addressForm.city} onChange={(event) => setAddressForm({ ...addressForm, city: event.target.value })} placeholder="Los Angeles" /></label><label>ZIP Code<input type="text" value={addressForm.zip} onChange={(event) => setAddressForm({ ...addressForm, zip: event.target.value })} placeholder="90001" /></label></div><button type="button" className="account-save-btn filled" onClick={onSaveAddress}>Save Address</button>{notice && <p className="account-error">{notice}</p>}</section></section>}

            {page === "shipping" && <section className="account-page active"><h2>物流 Shipping</h2><p className="account-main-desc">查看取貨日期、訂單處理狀態與配送地址。</p><section className="account-section"><h3>目前取貨地址</h3><div className="shipping-address-card"><strong>{addressForm.fullName || user.name || "Member"}</strong><span>{addressForm.phone || user.phone || "尚未設定電話"}</span><span>{addressLabel}</span><button type="button" onClick={() => setPage("addresses")}>編輯地址</button></div></section><section className="account-section"><h3>物流／取貨進度</h3>{orders.length ? orders.map((order) => <div className="shipping-order-row" key={order.id}><div><strong>Order #{order.id}</strong><span>Pickup date: {order.fulfillmentDate || "—"}</span></div><div><strong className="shipping-order-price">${Number(order.total || 0).toFixed(2)}</strong><OrderStatus status={order.status} /></div></div>) : <div className="account-empty-row"><span>目前沒有物流訂單。</span></div>}</section></section>}

            {page === "payments" && <section className="account-page active"><h2>金流 Payments</h2><p className="account-main-desc">查看付款方式與訂單付款紀錄。付款卡號不會直接儲存在 Patria D1。</p><section className="account-section"><h3>付款方式</h3><div className="payment-method-card"><i className="fas fa-shield-halved" /><div><strong>結帳時選擇付款方式</strong><span>目前尚未綁定付款方式。</span><small>正式串接 Stripe、LINE Pay 或其他金流後，付款資料將由金流服務商安全保存。</small></div></div></section><section className="account-section"><h3>付款紀錄</h3>{orders.length ? orders.map((order) => <div className="payment-order-row" key={order.id}><div><strong>Order #{order.id}</strong><span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}</span></div><div><strong>{"$"}{Number(order.total || 0).toFixed(2)}</strong><OrderStatus status={order.status} /></div></div>) : <div className="account-empty-row"><span>目前沒有付款紀錄。</span></div>}</section></section>}

            {page === "details" && <section className="account-page active"><h2>Account Details</h2><p className="account-main-desc">Update your display name, email and password.</p><section className="account-section account-form-section"><div className="account-form-grid"><label>Display Name<input type="text" value={detailsForm.name} onChange={(event) => setDetailsForm({ ...detailsForm, name: event.target.value })} /></label><label>Email Address<input type="email" value={detailsForm.email} onChange={(event) => setDetailsForm({ ...detailsForm, email: event.target.value })} /></label><label>Phone<input type="text" value={detailsForm.phone} onChange={(event) => setDetailsForm({ ...detailsForm, phone: event.target.value })} placeholder="Phone number" /></label><label>Password<input type="password" value={detailsForm.password} onChange={(event) => setDetailsForm({ ...detailsForm, password: event.target.value })} placeholder="New password" /></label><label>Confirm Password<input type="password" value={detailsForm.confirmPassword || ""} onChange={(event) => setDetailsForm({ ...detailsForm, confirmPassword: event.target.value })} placeholder="Confirm password" /></label></div><button type="button" className="account-save-btn filled" onClick={onSaveDetails}>Save Changes</button>{notice && <p className="account-error">{notice}</p>}</section></section>}
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [orders, setOrders] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountPage, setAccountPage] = useState("dashboard");
  const [accountError, setAccountError] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
  const [contactStatus, setContactStatus] = useState("");
  const [reservationStatus, setReservationStatus] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [reservationForm, setReservationForm] = useState({ name: "", phone: "", email: "", guests: "2 People", date: "", time: "09:00 AM", requests: "" });
  const [accountNotice, setAccountNotice] = useState("");
  const [addressForm, setAddressForm] = useState({ fullName: "", phone: "", address: "", city: "", zip: "" });
  const [detailsForm, setDetailsForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState("");
  const galleryItems = [
    { img: "./img/portfolio/1.webp", title: "Gourmet Burgers", desc: "Our award-winning smash burgers, hand-crafted with 100% premium beef, aged cheddar and house-made sauces." },
    { img: "./img/portfolio/2.webp", title: "Wood-Fired Pizza", desc: "Authentic Neapolitan-style pizzas fired at 900°F in our wood-burning stone oven for the perfect char." },
    { img: "./img/portfolio/4.webp", title: "Crispy Fried Chicken", desc: "Double-brined, hand-battered chicken fried to golden perfection using our 15-spice secret blend." },
    { img: "./img/portfolio/5.webp", title: "Sweet Desserts", desc: "Handcrafted desserts—from molten lava cakes to artisan ice cream sundaes and seasonal pastries." },
    { img: "./img/portfolio/6.webp", title: "Fresh Wraps & Rolls", desc: "Loaded fresh wraps packed with grilled proteins, crunchy vegetables and our house-made sauces." },
  ];

  useEffect(() => {
    Promise.all([getCurrentUser().catch(() => null), getProducts(), getCart(), getCoupons().catch(() => ({ coupons: [] }))])
      .then(([me, productData, cartData, couponData]) => {
        setUser(me?.user || null);
        setProducts(productData.products || []);
        setCart({ items: cartData.items || [], total: cartData.total || 0 });
        setCoupons(couponData.coupons?.length ? couponData.coupons : fallbackCoupons);
        if (me?.user && new URLSearchParams(window.location.search).get("line_login") === "success") {
          setAccountOpen(true);
          window.history.replaceState({}, document.title, `${window.location.pathname}#account`);
        }
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getOrders().then((data) => setOrders(data.orders || [])).catch(() => setOrders([]));
    setAddressForm({ fullName: user.address?.fullName || user.name || "", phone: user.address?.phone || user.phone || "", address: user.address?.address || "", city: user.address?.city || "", zip: user.address?.zip || "" });
    setDetailsForm({ name: user.name || "", email: user.email || "", phone: user.phone || "", password: "", confirmPassword: "" });
  }, [user]);

  useEffect(() => {
    const openAccountFromHash = () => {
      if (window.location.hash === "#account") setAccountOpen(true);
    };
    openAccountFromHash();
    window.addEventListener("hashchange", openAccountFromHash);
    return () => window.removeEventListener("hashchange", openAccountFromHash);
  }, []);

  useEffect(() => {
    if (!user || !accountOpen) return undefined;
    let active = true;
    const refreshOrders = () => getOrders().then((data) => {
      if (active) setOrders(data.orders || []);
    }).catch(() => {});
    refreshOrders();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshOrders();
    };
    const interval = window.setInterval(refreshOrders, 5000);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, accountOpen]);

  useEffect(() => {
    const formCard = document.querySelector("#contact-section .form-card");
    const button = formCard?.querySelector(".btn-red");
    if (!formCard || !button) return undefined;

    const submitContact = async () => {
      const fields = [...formCard.querySelectorAll(".fctrl")];
      const [name, email, phone, subject, message] = fields.map((field) => field.value.trim());
      setContactStatus("");
      try {
        await sendContactMessage({ name, email, phone, subject, message });
        setContactStatus("Message sent! We'll reply within 2 hours.");
        fields.forEach((field) => { field.value = ""; });
      } catch (requestError) {
        setContactStatus(requestError.message);
      }
    };

    button.addEventListener("click", submitContact);
    return () => button.removeEventListener("click", submitContact);
  }, [loading]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const passwordInputs = [...document.querySelectorAll("#accountOv input[type='password']")];
    const cleanups = [];
    passwordInputs.forEach((input) => {
      if (input.dataset.passwordToggle === "true") return;
      input.dataset.passwordToggle = "true";
      const wrapper = document.createElement("div");
      wrapper.className = "account-password";
      input.parentNode.insertBefore(wrapper, input);
      wrapper.appendChild(input);
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "account-password-toggle";
      toggle.title = "Show password";
      toggle.setAttribute("aria-label", "Show password");
      toggle.innerHTML = '<i class="fas fa-eye"></i>';
      wrapper.appendChild(toggle);
      const onToggle = () => {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        toggle.title = visible ? "Show password" : "Hide password";
        toggle.setAttribute("aria-label", toggle.title);
        toggle.innerHTML = `<i class="fas fa-eye${visible ? "" : "-slash"}"></i>`;
      };
      toggle.addEventListener("click", onToggle);
      cleanups.push(() => toggle.removeEventListener("click", onToggle));
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [accountOpen, accountPage, user]);

  const visibleProducts = useMemo(() => {
    if (category === "ALL") return products;
    return products.filter((product) => String(product.cat || "").toUpperCase() === category);
  }, [category, products]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((product) => `${product.title} ${product.cat} ${product.desc}`.toLowerCase().includes(term));
  }, [products, searchTerm]);

  const quickMealProducts = products.slice(0, 3);
  const localFavouriteProducts = products.slice(3, 9);

  async function handleAdd(productId, quantity = 1) {
    if (!user) {
      setSelectedProduct(null);
      setProductQuantity(1);
      setAccountError("請先登入後再使用購物車。");
      setAccountOpen(true);
      return;
    }
    try {
      setCart(await addToCart(productId, quantity));
      setSelectedProduct(null);
      setProductQuantity(1);
      setCartOpen(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setProductQuantity(1);
  }

  function handleOpenCart() {
    if (!user) {
      setAccountError("請先登入後再使用購物車。");
      setAccountOpen(true);
      return;
    }
    setCartOpen(true);
  }

  function openCheckout() {
    if (!user) {
      setCartOpen(false);
      setAccountOpen(true);
      return;
    }
    if (!fulfillmentDate) {
      setError("Please choose a pickup date.");
      return;
    }
    setError("");
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  async function handleCheckout() {
    if (!user || !fulfillmentDate) return;
    setCheckoutBusy(true);
    setError("");
    try {
      const data = await checkout(fulfillmentDate, couponCode);
      setCart(data.cart);
      setOrders((current) => [data.order, ...current]);
      setFulfillmentDate("");
      setCouponCode("");
      setCouponMessage("");
      setCheckoutOpen(false);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function handleCartQuantity(item, quantity) {
    try {
      setCart(await (quantity <= 0 ? removeCartItem(item.id) : updateCartItem(item.id, quantity)));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleRemoveCartItem(item) {
    try {
      setCart(await removeCartItem(item.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function handleApplyCoupon() {
    const normalized = couponCode.trim().toUpperCase();
    const availableCoupons = coupons.length ? coupons : fallbackCoupons;
    const coupon = availableCoupons.find((item) => String(item.code).toUpperCase() === normalized);
    if (!normalized) {
      setCouponMessage("請先輸入優惠碼。");
    } else if (!coupon) {
      setCouponMessage("找不到這個優惠碼，請確認後再試一次。");
    } else if (Number(cart.total || 0) < Number(coupon.min || 0)) {
      setCouponMessage(normalized + " requires a subtotal of $" + Number(coupon.min || 0).toFixed(2) + ".");
    } else {
      setCouponCode(normalized);
      setCouponMessage(normalized + " applied: " + (coupon.label || "discount") + ".");
    }
  }

  async function handleLogout() {
    await logout().catch(() => {});
    setUser(null);
    setOrders([]);
    setAccountOpen(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setAccountError("");
    try {
      const data = await login(loginForm.login, loginForm.password);
      setUser(data.user);
      setLoginForm({ login: "", password: "" });
      setAccountPage("dashboard");
    } catch (requestError) {
      setAccountError(requestError.message);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setAccountError("");
    try {
      const data = await register(registerForm);
      setUser(data.user);
      setRegisterForm({ name: "", email: "", phone: "", password: "" });
      setAccountPage("dashboard");
    } catch (requestError) {
      setAccountError(requestError.message);
    }
  }

  async function handleContactSubmit(event) {
    event.preventDefault();
    setContactStatus("");
    try {
      await sendContactMessage(contactForm);
      setContactStatus("Message sent! We'll reply within 2 hours.");
      setContactForm({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
    } catch (requestError) {
      setContactStatus(requestError.message);
    }
  }

  async function handleSaveAddress() {
    setAccountNotice("");
    try {
      const data = await updateMemberAddress(addressForm);
      setUser(data.user);
      setAccountNotice("Address saved.");
    } catch (requestError) {
      setAccountNotice(requestError.message);
    }
  }

  async function handleSaveDetails() {
    setAccountNotice("");
    if (detailsForm.password && detailsForm.password !== detailsForm.confirmPassword) {
      setAccountNotice("Passwords do not match.");
      return;
    }
    try {
      const data = await updateMemberProfile(detailsForm);
      setUser(data.user);
      setDetailsForm((current) => ({ ...current, password: "", confirmPassword: "" }));
      setAccountNotice("Account details saved.");
    } catch (requestError) {
      setAccountNotice(requestError.message);
    }
  }

  function focusProduct(productId) {
    setCategory("ALL");
    setSearchOpen(false);
    document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    window.setTimeout(() => document.getElementById(`product-${productId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
  }

  if (loading) return <div className="container py-5"><p>載入中...</p></div>;

  return (
    <>
      <div id="topbar">
        <div className="container"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="top-contact d-flex flex-wrap"><span><i className="fas fa-phone-alt" /> +1 (300) 659-4381</span><span><i className="fas fa-envelope" /> hello@patriafood.com</span><span><i className="fas fa-map-marker-alt" /> 52 Teka Street, LA</span></div>
          <div className="d-flex align-items-center gap-3"><span className="ttag"><i className="fas fa-fire me-1" />Free Delivery Today!</span><div className="tsoc"><a href="#" aria-label="Facebook"><i className="fab fa-facebook-f" /></a><a href="#" aria-label="Instagram"><i className="fab fa-instagram" /></a><a href="#" aria-label="TikTok"><i className="fab fa-tiktok" /></a><a href="#" aria-label="YouTube"><i className="fab fa-youtube" /></a></div></div>
        </div></div>
      </div>

      <nav className="navbar navbar-expand-lg" id="nav">
        <div className="container">
          <a className="navbar-brand" href="#hero"><div className="blogo"><div className="bico"><i className="fas fa-utensils" /></div><div><div className="bname">Pat<span>ria</span></div><div className="bsub">Chinese Food &amp; Restaurant</div></div></div></a>
          <button className="navbar-toggler border-0" type="button" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen} aria-controls="navmenu" aria-label="Toggle navigation"><i className={navOpen ? "fas fa-times" : "fas fa-bars"} /></button>
          <div className={`collapse navbar-collapse${navOpen ? " show" : ""}`} id="navmenu">
            <ul className="navbar-nav mx-auto">
              {[["Home", "hero"], ["About", "about"], ["Menu", "menu"], ["Chefs", "chefs"], ["Reservation", "reservation"], ["Reviews", "testimonials"], ["Contact", "contact-section"]].map(([label, id]) => <li className="nav-item" key={id}><a className="nav-link" href={`#${id}`}>{label}</a></li>)}
            </ul>
            <div className="nav-actions d-flex align-items-center">
              <a href="/admin/signin.html" id="adminOpen" className="admin-dashboard-link" title="管理後台" aria-label="管理後台" data-tooltip="管理後台"><i className="fas fa-table-columns" /></a>
              <button type="button" id="navSearchBtn" onClick={() => setSearchOpen(true)} title="搜尋" aria-label="搜尋" data-tooltip="搜尋"><i className="fas fa-search" /></button>
              <button type="button" id="accountOpen" className="nav-link" onClick={() => { setAccountMenuOpen(false); setAccountOpen(true); }} title="帳戶" aria-label="帳戶" data-tooltip="會員帳戶"><i className="fas fa-user" /></button>
              <button type="button" id="orderOpen" className="nav-link" onClick={handleOpenCart} title="購物車" aria-label="購物車" data-tooltip="購物車"><i className="fas fa-shopping-cart" /><span className="cart-count">{cart.items.length}</span></button>
            </div>
          </div>
        </div>
      </nav>

      <div id="searchOv" className={searchOpen ? "open" : ""}>
        <button type="button" className="sovclose" id="searchClose" onClick={() => setSearchOpen(false)}><i className="fas fa-times" /></button>
        <div className="sovbox">
          <h4>What are you craving today?</h4>
          <div className="sovinput"><input autoFocus={searchOpen} type="text" id="searchInput" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search noodles, dim sum, rice..." autoComplete="off" /><button type="button"><i className="fas fa-search" /></button></div>
          <div className="sovcats">{categories.map((item) => <button type="button" className={`sovcat ${category === item.name ? "active" : ""}`} data-cat={item.name.toLowerCase()} key={item.name} onClick={() => { setCategory(item.name); setSearchOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}><img src={item.image} alt="" />{item.name}</button>)}</div>
          <div className="sovtrend"><p><i className="fas fa-fire me-1" style={{ color: "var(--secondary)" }} />Trending Searches</p>{["Seafood Noodles", "Spring Rolls", "Fried Rice", "Chicken Soup"].map((term) => <button type="button" className="ttag" key={term} onClick={() => setSearchTerm(term)}>{term}</button>)}</div>
          {searchTerm && <div className="sovresults">{searchResults.slice(0, 5).map((product) => <button type="button" key={product.id} onClick={() => focusProduct(product.id)}><span>{product.title}</span><small>{product.cat}</small></button>)}{!searchResults.length && <p>No matching dishes found.</p>}</div>}
        </div>
      </div>

      <div id="accountOv" className={accountOpen ? "open" : ""}>
        <div className="account-nav"><a className="account-nav-brand" href="#hero" onClick={() => { setAccountMenuOpen(false); setAccountOpen(false); }}><span className="account-nav-icon"><i className="fas fa-utensils" /></span><span>Pat<span>ria</span></span></a>{user && <button type="button" className={`account-menu-toggle${accountMenuOpen ? " open" : ""}`} onClick={() => setAccountMenuOpen((open) => !open)} aria-expanded={accountMenuOpen} aria-controls="accountSideMenu" aria-label="Toggle account menu"><span /><span /><span /></button>}</div>
        <button type="button" className="account-close" id="accountClose" onClick={() => setAccountOpen(false)}><i className="fas fa-times" /></button>
        {user && <MemberDashboard user={user} orders={orders} page={accountPage} setPage={setAccountPage} addressForm={addressForm} setAddressForm={setAddressForm} detailsForm={detailsForm} setDetailsForm={setDetailsForm} onSaveAddress={handleSaveAddress} onSaveDetails={handleSaveDetails} onLinkLine={() => { window.location.href = "/auth/line/link"; }} onLogout={handleLogout} onClose={() => { setAccountMenuOpen(false); setAccountOpen(false); }} notice={accountNotice} menuOpen={accountMenuOpen} setMenuOpen={setAccountMenuOpen} />}
        {user ? <div className="account-dashboard open" id="accountDashboard"><div className="container"><div className="account-dashboard-grid"><aside className="account-side"><div className="account-site-links"><a href="#hero" onClick={() => setAccountOpen(false)}>Home</a><a href="#menu" onClick={() => setAccountOpen(false)}>Menu</a><a href="#contact-section" onClick={() => setAccountOpen(false)}>Contact</a></div>{[["dashboard", "Dashboard"], ["orders", `Orders (${orders.length})`], ["addresses", "Addresses"], ["details", "Account Details"]].map(([page, label]) => <button className={accountPage === page ? "active" : ""} type="button" key={page} onClick={() => setAccountPage(page)}>{label}</button>)}<button type="button" id="linkLineBtn" onClick={() => window.location.href = "/auth/line/link"}>綁定 LINE 帳號</button><button id="accountLogout" type="button" onClick={handleLogout}>Logout</button></aside><main className="account-main"><section className="account-page active"><h2>{accountPage === "dashboard" ? <>Welcome back,<br />{user.name || "Patria member"}</> : accountPage === "orders" ? "Orders" : accountPage === "addresses" ? "Addresses" : "Account Details"}</h2><p className="account-main-desc">{accountPage === "orders" ? "Track your recent orders and start a new Patria order anytime." : accountPage === "addresses" ? "Manage the address used for delivery and pickup updates." : accountPage === "details" ? "Update your display name, email and password." : "Here’s an overview of your account. View your recent orders and manage your account details."}</p>{accountPage === "dashboard" && <div className="account-stat-grid"><div className="account-stat"><i className="fas fa-utensils" /><div><strong>Recent Orders</strong><span>{orders.length} orders</span></div></div><div className="account-stat"><i className="fas fa-user" /><div><strong>Account Details</strong><span>{user.email || user.name || "Member"}</span></div></div></div>}{accountPage === "orders" && <section className="account-section"><div className="account-section-head"><h3>Recent Orders</h3><button type="button" onClick={() => { setAccountOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Start an order</button></div>{orders.length ? orders.map((order) => <div className="account-empty-row" key={order.id}><span>Order #{order.id}</span><strong>${Number(order.total || 0).toFixed(2)}</strong></div>) : <div className="account-empty-row"><span>You have not placed an order yet.</span></div>}</section>}{accountPage === "addresses" && <section className="account-section account-form-section"><h3>Saved Address</h3><div className="account-form-grid"><label>Full Name<input type="text" defaultValue={user.name || ""} /></label><label>Phone<input type="text" placeholder="Phone number" /></label><label className="wide">Address<input type="text" placeholder="Add your delivery address" /></label></div><button type="button" className="account-save-btn filled">Save Address</button></section>}{accountPage === "details" && <section className="account-section account-form-section"><div className="account-form-grid"><label>Display Name<input type="text" defaultValue={user.name || ""} /></label><label>Email Address<input type="email" defaultValue={user.email || ""} /></label><label>Phone<input type="text" placeholder="Phone number" /></label></div><button type="button" className="account-save-btn filled">Save Changes</button></section>}</section></main></div></div></div> : <div className="account-panel"><div className="container"><div className="row g-4 g-lg-5"><div className="col-lg-6"><h3>Login</h3><form className="account-card" onSubmit={handleLogin}><label>Username or email address *</label><input type="text" autoComplete="username" value={loginForm.login} onChange={(event) => setLoginForm({ ...loginForm, login: event.target.value })} required /><label>Password *</label><input type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required /><p className="account-error">{accountError}</p><button type="submit" className="account-btn">Log in</button><a className="account-btn account-line-btn" href="https://liff.line.me/2011054194-YNQIwkml"><i className="fab fa-line" /> 使用 LINE 登入</a></form></div><div className="col-lg-6"><h3>Register</h3><form className="account-card" onSubmit={handleRegister}><label>Full Name *</label><input type="text" autoComplete="name" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} required /><label>Email address *</label><input type="email" autoComplete="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required /><label>Phone</label><input type="text" autoComplete="tel" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} /><label>Password *</label><input type="password" autoComplete="new-password" minLength="8" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} required /><p className="account-error">{accountError}</p><button type="submit" className="account-btn">Register</button></form></div></div></div></div>}
      </div>

      {accountNotice && <div className="account-save-notice" role="status">{accountNotice}</div>}

      <main>
        <section id="hero">
          <div className="hs hs1" /><div className="hs hs2" /><div className="hbgtxt">FOOD</div>
          <div className="container"><div className="row align-items-center g-5" style={{ minHeight: "88vh" }}>
            <div className="col-lg-6">
              <div className="hbadge"><div className="hbi"><i className="fas fa-star" /></div><span>#1 Rated Chinese Food Restaurant in Los Angeles</span></div>
              <div className="hero-mobile-art"><div className="hcircle"><img src={`${imageBase}/banners/home-hero.webp`} alt="Patria Chinese food" /></div></div>
              <h1 className="htitle">Delicious <span className="hl">chinese food</span>for Every Day</h1>
              <p className="hdesc">Experience authentic Chinese flavors prepared by premium ingredients. From savory stir-fried noodles to crispy spring rolls, every dish is made to share and savor.</p>
              <div className="hero-actions d-flex flex-wrap gap-3 mb-2"><a href="#menu" className="btn-red"><i className="fas fa-utensils" />Explore Menu</a><a href="#category" className="btn-play"><div className="pico"><i className="fas fa-shopping-cart" /></div><span>Order here</span></a></div><DealCountdown />
              <div className="hstats d-flex gap-3 flex-wrap mt-4"><div className="hstat"><span className="snum">342<em>+</em></span><small>Happy Customers</small></div><div className="sdiv" /><div className="hstat"><span className="snum">150<em>+</em></span><small>Menu Items</small></div><div className="sdiv" /><div className="hstat"><span className="snum">10<em>+</em></span><small>Expert Chefs</small></div><div className="sdiv" /><div className="hstat"><span className="snum">18<em>yr</em></span><small>Experience</small></div></div>
            </div>
            <div className="col-lg-6 hero-desktop-art"><div className="hero-art-wrap"><div className="hcircle"><img src={`${imageBase}/banners/home-hero.webp`} alt="Patria Chinese food" /></div><div className="fcard fc1"><div className="fcoi r"><i className="fas fa-fire" /></div><div><span className="fcnum">Hot Deal</span><span className="fcsm">30% off today</span></div></div><div className="fcard fc2"><div className="fcoi y"><i className="fas fa-star" /></div><div><span className="fcnum">4.9/5</span><span className="fcsm">2k+ reviews</span></div></div><div className="fcard fc3"><div className="fcoi g"><i className="fas fa-clock" /></div><div><span className="fcnum">20 min</span><span className="fcsm">Fast delivery</span></div></div></div></div>
          </div></div>
        </section>

        <div className="mqsec"><div className="mqtrack">{["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"].concat(["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"]).map((item, index) => <div className="mqitem" key={`${item}-${index}`}><i className="fas fa-circle" />{item}</div>)}</div></div>

        <section id="category"><div className="container">
          <div className="quick-menu-types" data-aos="fade-up"><h2 className="stitle">Quick Meals / <span>Lunch Sets</span></h2></div>
          <div className="row g-4 quick-meals-grid">
            {quickMealProducts.map((product, index) => <div className="col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay={index * 80} key={`quick-${product.id}`}><ProductCard product={product} badge={index === 0 ? "Quick" : index === 1 ? "Lunch" : "Combo"} onOpen={openProduct} /></div>)}
          </div>
          <div className="text-center mb-5" data-aos="fade-up"><span className="slbl">What We Offer</span><h2 className="stitle">Explore <span>Our Menu</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>From sizzling burgers to exotic world cuisines - find your favourite in our menu</p></div>
          <div className="row g-3 justify-content-center">
            {categories.map((item, index) => {
              const itemCount = item.name === "ALL" ? products.length : products.filter((product) => String(product.cat).toUpperCase() === item.name).length;
              const selectCategory = () => { setCategory(item.name); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); };
              return <div className="col-6 col-sm-4 col-md-3 col-lg-2" data-aos="zoom-in" data-aos-delay={index * 70} key={item.name}><div className={`catcard ${category === item.name ? "active" : ""}`} data-filter={item.name.toLowerCase()} role="button" tabIndex="0" onClick={selectCategory} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCategory(); } }}><img className="catimg" src={item.image} alt="" /><div className="catnm">{item.name}</div><div className="catct">{itemCount} items</div></div></div>;
            })}
          </div>
          <div className="local-favourites"><h2 className="stitle">Local <span>Favourites</span></h2></div>
          <div className="row g-4 local-favourites-grid">
            {localFavouriteProducts.map((product, index) => <div className="col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay={(index % 3) * 80} key={`local-${product.id}`}><ProductCard product={product} badge={index === 0 ? "Local" : index === 1 ? "New" : index === 2 ? "Best Seller" : "Chef Pick"} onOpen={openProduct} /></div>)}
          </div>
        </div></section>

        <section id="menu"><div className="container"><div className="text-center mb-5" data-aos="fade-up"><span className="slbl">What's Cooking</span><h2 className="stitle">Our Delicious <span>Menu</span></h2><div className="sline" /></div>
          <div className="text-center mb-4" data-aos="fade-up">
            {["ALL", "NOODLES", "DIM SUM", "RICE", "SOUP"].map((item) => <button type="button" className={`filtbtn ${category === item ? "active" : ""}`} data-f={item.toLowerCase()} key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          {error && <p className="alert alert-danger">{error}</p>}
          <div className="row g-4" id="mgrid">{visibleProducts.map((product, index) => <div className="col-sm-6 col-lg-4 mwrap" data-c={String(product.cat || "").toLowerCase()} data-aos="fade-up" data-aos-delay={(index % 3) * 80} key={product.id}><ProductCard product={product} onOpen={openProduct} /></div>)}</div>
        </div></section>

        <section id="about"><div className="container"><div className="row align-items-center g-5"><div className="col-lg-5"><div className="astack"><div className="aexp"><span className="anum">12+</span><small>Years of<br />Excellence</small></div><div className="amain"><img src="./img/about1.jpg" alt="Restaurant" /></div><div className="asm"><img src="./img/about2.jpg" alt="" /></div></div></div><div className="col-lg-7"><span className="slbl">Our Story</span><h2 className="stitle text-start">We Invite You to Visit<br />Our <span>Food Restaurant</span></h2><div className="sline lft" /><p className="sdesc mb-4">Founded in 2012, Patria began as a small corner joint with a big dream - to serve food that brings people together. Today we serve thousands of happy customers every week with the same passion.</p><a href="#menu" className="btn-red"><i className="fas fa-book-open" /> View Full Menu</a></div></div></div></section>

        <section id="gallery"><div className="container"><div className="text-center mb-5"><span className="slbl">Food Showcase</span><h2 className="stitle">Let's See Our <span>Chinese Food</span></h2><div className="sline" /></div><div className="ggrid">{galleryItems.map((item, index) => <div className="gitem" key={item.img} onClick={() => setGalleryIndex(index)} role="button" tabIndex="0" onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setGalleryIndex(index); } }}><img src={item.img} alt={item.title} /><div className="gover"><span><i className="fas fa-expand-alt" /> {item.title}</span></div></div>)}</div></div></section>

        <section id="history"><div className="container"><div className="text-center mb-5"><span className="slbl">Our Journey</span><h2 className="stitle">A History of <span>Restaurant</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>From humble beginnings to a beloved restaurant - every chapter written with passion.</p></div><div className="timeline">{[["2012", "Patria opens its first diner on Teka Street."], ["2015", "We introduced our signature tasting menu."], ["2019", "Our modern Chinese food line launched."], ["2026", "Patria continues to grow with online ordering."]].map(([year, text]) => <div className="tli" key={year}><div className="tl-left"><div className="tlyear">{year}</div><p>{text}</p></div><div className="tl-center"><div className="tldot" /></div><div className="tl-right"><div className="tlyear">{year}</div><p>{text}</p></div></div>)}</div></div></section>

        <section id="chefs"><div className="container"><div className="text-center mb-5"><span className="slbl">The Culinary Team</span><h2 className="stitle">Meet Our Expert <span>Chefs</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Alice Mortal", "Head Chef"], [2, "Michael Corn", "Grill Master"], [3, "Sophie Lau", "Pastry Chef"], [4, "David Wong", "Sous Chef"]].map(([number, name, role]) => <div className="col-sm-6 col-lg-3" key={name}><div className="chcard"><div className="chimg"><img src={`./img/chefs/${number}.jpg`} alt={name} /></div><div className="chbody"><div className="chnm">{name}</div><div className="chrole">{role}</div><div className="chexp">8+ years experience</div></div></div></div>)}</div></div></section>

        <section id="hours"><div className="container"><div className="text-center mb-5"><span className="slbl">Opening Hours</span><h2 className="stitle">We're Open <span>For You</span></h2><div className="sline" /></div><div className="row g-4"><div className="col-lg-6"><div className="hrscard">{[["Monday - Tuesday", "09:00 AM - 10:00 PM"], ["Wednesday - Thursday", "09:00 AM - 10:00 PM"], ["Friday", "09:00 AM - 11:00 PM"], ["Saturday", "10:00 AM - 11:30 PM"], ["Sunday", "11:00 AM - 09:00 PM"]].map(([day, time]) => <div className="hrsrow" key={day}><span className="hrsday"><i className="fas fa-calendar-day me-2" />{day}</span><span className="hrstime">{time}</span></div>)}</div></div><div className="col-lg-6"><div className="hrscard"><h5><i className="fas fa-map-marker-alt me-2" /> Find Us</h5><p>52 Teka Street, Los Angeles, CA 90001</p><p>+1 (300) 659-4381</p><p>hello@patriafood.com</p></div></div></div></div></section>

        <section id="testimonials"><div className="container"><div className="text-center mb-5"><span className="slbl">What People Say</span><h2 className="stitle">Our Customers <span>Feedback</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Jack Pichai", "Honestly the best Chinese food I've ever had."], [2, "Jenny Marley", "The food arrived hot and fresh in 22 minutes."], [3, "Tim Bozone", "Great ambiance, friendly staff and delicious food."], [4, "Lily Blate", "Fresh, delicious, on time and well presented."]].map(([number, name, quote]) => <div className="col-md-6 col-lg-3" key={name}><div className="tescard"><div className="tesq">"</div><div className="tess">★★★★★</div><p className="testxt">{quote}</p><div className="tesauth"><img src={`./img/testimonial/${number}.webp`} alt={name} /><div><div className="tesnm">{name}</div><div className="tesrl">Customer</div></div></div></div></div>)}</div></div></section>

        <ReservationSection form={reservationForm} setForm={setReservationForm} status={reservationStatus} setStatus={setReservationStatus} />

        <NewsletterSection email={newsletterEmail} setEmail={setNewsletterEmail} status={newsletterStatus} setStatus={setNewsletterStatus} />

        <section id="account" className="account-inline"><div className="container"><div className="text-center mb-4"><span className="slbl">Your Patria</span><h2 className="stitle">My <span>Account</span></h2><div className="sline" /></div></div></section>

        <section id="contact-section"><div className="container"><div className="text-center mb-5" data-aos="fade-up"><span className="slbl">Get In Touch</span><h2 className="stitle">Contact <span>Us</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>Have a question, feedback, or want to plan a special event? We'd love to hear from you.</p></div><div className="row g-4"><div className="col-lg-4" data-aos="fade-right"><div className="ctdark"><h4>Let's Talk</h4><p className="ctsub">We typically respond within 2 hours during business hours.</p>{[["map-marker-alt", "Address", <>52 Teka Street, Los Angeles,<br />CA 90001</>], ["phone-alt", "Phone", "+1 (300) 659-4381"], ["envelope", "Email", "hello@patriafood.com"], ["clock", "Working Hours", "Mon - Sun: 09 AM - 11 PM"]].map(([icon, title, value]) => <div className="ctitem" key={title}><div className="cticon"><i className={`fas fa-${icon}`} /></div><div className="ctinfo"><strong>{title}</strong><span>{value}</span></div></div>)}<div className="ctsocrow"><a href="#"><i className="fab fa-facebook-f" /></a><a href="#"><i className="fab fa-instagram" /></a><a href="#"><i className="fab fa-twitter" /></a><a href="#"><i className="fab fa-youtube" /></a></div></div></div><div className="col-lg-8" data-aos="fade-left"><div className="form-card"><div className="row g-3"><div className="col-sm-6"><label className="flbl">Your Name *</label><input type="text" className="fctrl" placeholder="John Doe" /></div><div className="col-sm-6"><label className="flbl">Email Address *</label><input type="email" className="fctrl" placeholder="you@email.com" /></div><div className="col-sm-6"><label className="flbl">Phone Number</label><input type="tel" className="fctrl" placeholder="+1 (800) 000-0000" /></div><div className="col-sm-6"><label className="flbl">Subject *</label><select className="fctrl"><option>General Inquiry</option><option>Catering &amp; Events</option><option>Feedback</option><option>Partnership</option><option>Media &amp; Press</option></select></div><div className="col-12"><label className="flbl">Message *</label><textarea className="fctrl" rows="5" placeholder="Write your message here..." /></div><div className="col-12"><button type="button" className="btn-red"><i className="fas fa-paper-plane" />Send Message</button></div></div></div></div></div></div></section>
        {contactStatus && <div className="container"><p className="sucmsg text-center">{contactStatus}</p></div>}
      </main>

      <footer><div className="container"><div className="row g-5"><div className="col-lg-4"><div className="fnm">Pat<span>ria</span></div><p className="fdesc">We bring the world's finest flavors together in a fast, friendly, and affordable experience. Every meal crafted with love.</p><div className="fsoc"><a href="#"><i className="fab fa-facebook-f" /></a><a href="#"><i className="fab fa-instagram" /></a><a href="#"><i className="fab fa-twitter" /></a><a href="#"><i className="fab fa-youtube" /></a><a href="#"><i className="fab fa-tiktok" /></a></div></div><div className="col-sm-6 col-lg-2"><div className="ftit">Quick Links</div><ul className="flinks ps-0"><li><a href="#hero"><i className="fas fa-chevron-right" />Home</a></li><li><a href="#about"><i className="fas fa-chevron-right" />About Us</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />Our Menu</a></li><li><a href="#reservation"><i className="fas fa-chevron-right" />Reservation</a></li><li><a href="#contact-section"><i className="fas fa-chevron-right" />Contact</a></li></ul></div><div className="col-sm-6 col-lg-2"><div className="ftit">Our Menu</div><ul className="flinks ps-0"><li><a href="#menu"><i className="fas fa-chevron-right" />NOODLES</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />DIM SUM</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />RICE</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />SOUP</a></li></ul></div><div className="col-lg-4"><div className="ftit">Get In Touch</div>{[["map-marker-alt", "Address", "52 Teka Street, Los Angeles, CA 90001"], ["phone-alt", "Phone", "+1 (300) 659-4381"], ["envelope", "Email", "hello@patriafood.com"], ["clock", "Hours", "Mon - Sun: 09 AM - 11 PM"]].map(([icon, title, value]) => <div className="fci" key={title}><div className="fciico"><i className={`fas fa-${icon}`} /></div><div className="fciinfo"><strong>{title}</strong>{value}</div></div>)}</div></div></div><div className="fbot"><div className="container"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><p>&copy; 2026 <span>Patria Restaurant</span> All rights reserved.<span className="footer-credit">Design by <a href="https://www.aq-webdesign.com/index.html" target="_blank" rel="noopener">A.Q.webdesign</a></span></p><div><a href="#">Privacy Policy</a><a href="#">Terms</a><a href="#">Cookies</a></div></div></div></div></footer>

      {cartOpen && <div className="order-overlay open" onClick={(event) => event.target === event.currentTarget && setCartOpen(false)}><aside className="order-drawer"><div className="order-head"><h2>Your Order</h2><button type="button" className="order-close" onClick={() => setCartOpen(false)}><i className="fas fa-times" /></button></div><div className="order-body">{cart.items.length ? <>{cart.items.map((item) => <div className="account-cart-row" key={item.id}><img src={item.img} alt="" /><span>{item.title} × {item.qty}</span></div>)}<strong>Total: ${Number(cart.total).toFixed(2)}</strong><input type="date" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} /><button type="button" className="account-btn filled" disabled={!user} onClick={openCheckout}>{user ? "Checkout" : "Please log in"}</button></> : <p className="order-empty">No products in the cart.</p>}</div></aside></div>}
      {cartOpen && <OrderDrawer cart={cart} user={user} coupons={coupons} couponCode={couponCode} setCouponCode={setCouponCode} couponMessage={couponMessage} fulfillmentDate={fulfillmentDate} setFulfillmentDate={setFulfillmentDate} onApplyCoupon={handleApplyCoupon} onRemoveCoupon={() => { setCouponCode(""); setCouponMessage("優惠碼已移除。"); }} onChangeQty={handleCartQuantity} onRemove={handleRemoveCartItem} onCheckout={openCheckout} onClose={() => setCartOpen(false)} busy={checkoutBusy} error={error} />}
      {checkoutOpen && <CheckoutModal cart={cart} user={user} fulfillmentDate={fulfillmentDate} total={(() => { const coupon = coupons.find((item) => String(item.code).toUpperCase() === couponCode.toUpperCase()); const subtotal = Number(cart.total || 0); const discount = coupon && subtotal >= Number(coupon.min || 0) ? Math.min(subtotal, coupon.type === "percent" ? subtotal * Number(coupon.value || 0) / 100 : Number(coupon.value || 0)) : 0; return Math.max(0, subtotal - discount); })()} onConfirm={handleCheckout} onClose={() => setCheckoutOpen(false)} busy={checkoutBusy} error={error} />}
      {selectedProduct && <ProductModal product={selectedProduct} quantity={productQuantity} setQuantity={setProductQuantity} onClose={() => { setSelectedProduct(null); setProductQuantity(1); }} onAdd={handleAdd} />}
      <GalleryModal items={galleryItems} index={galleryIndex} setIndex={setGalleryIndex} onClose={() => setGalleryIndex(null)} />
    </>
  );
}

export default App;
