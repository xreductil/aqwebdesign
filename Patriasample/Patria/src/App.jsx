import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  checkout,
  getCart,
  getCurrentUser,
  getOrders,
  getProducts,
  login,
  logout,
  register,
  sendContactMessage,
} from "./api/client.js";

const imageBase = "https://www.aq-webdesign.com/images";

const categories = [
  { name: "ALL", image: "./img/category/1.webp" },
  { name: "NOODLES", image: "./img/category/2.webp" },
  { name: "DIM SUM", image: "./img/category/4.webp" },
  { name: "RICE", image: "./img/category/5.webp" },
  { name: "SOUP", image: "./img/category/6.webp" },
];

function ProductCard({ product, badge = "Featured", onAdd }) {
  return (
    <div
      id={`product-${product.id}`}
      className="mcard"
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
        <div className="mhrt"><i className="far fa-heart" /></div>
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
          <button type="button" className="madd" onClick={() => onAdd(product.id)} title="View Details">
            <i className="fas fa-plus" />
          </button>
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountPage, setAccountPage] = useState("dashboard");
  const [accountError, setAccountError] = useState("");
  const [loginForm, setLoginForm] = useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "General Inquiry", message: "" });
  const [contactStatus, setContactStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fulfillmentDate, setFulfillmentDate] = useState("");

  useEffect(() => {
    Promise.all([getCurrentUser().catch(() => null), getProducts(), getCart()])
      .then(([me, productData, cartData]) => {
        setUser(me?.success ? me.user : null);
        setProducts(productData.products || []);
        setCart({ items: cartData.items || [], total: cartData.total || 0 });
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    getOrders().then((data) => setOrders(data.orders || [])).catch(() => setOrders([]));
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

  async function handleAdd(productId) {
    try {
      setCart(await addToCart(productId));
      setCartOpen(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleCheckout() {
    try {
      const data = await checkout(fulfillmentDate);
      setCart(data.cart);
      setOrders((current) => [data.order, ...current]);
      setFulfillmentDate("");
    } catch (requestError) {
      setError(requestError.message);
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
      setUser({ id: data.user.id, name: data.user.display_name || data.user.name, email: data.user.email, avatar: data.user.avatar_url, lineUserId: data.user.line_user_id });
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
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu"><i className="fas fa-bars" /></button>
          <div className="collapse navbar-collapse" id="navmenu">
            <ul className="navbar-nav mx-auto">
              {[["Home", "hero"], ["About", "about"], ["Menu", "menu"], ["Chefs", "chefs"], ["Reservation", "reservation"], ["Reviews", "testimonials"], ["Contact", "contact-section"]].map(([label, id]) => <li className="nav-item" key={id}><a className="nav-link" href={`#${id}`}>{label}</a></li>)}
            </ul>
            <div className="nav-actions d-flex align-items-center">
              <a href="/admin/signin.html" className="admin-dashboard-link" title="管理後台"><i className="fas fa-table-columns" /></a>
              <button type="button" id="navSearchBtn" onClick={() => setSearchOpen(true)} title="搜尋" aria-label="搜尋"><i className="fas fa-search" /></button>
              <button type="button" id="accountOpen" className="nav-link" onClick={() => setAccountOpen(true)} title="帳戶" aria-label="帳戶"><i className="fas fa-user" /></button>
              <button type="button" id="orderOpen" className="nav-link" onClick={() => setCartOpen(true)} title="購物車" aria-label="購物車" data-tooltip="購物車"><i className="fas fa-shopping-cart" /><span className="cart-count">{cart.items.length}</span></button>
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
        <div className="account-nav"><a className="account-nav-brand" href="#hero" onClick={() => setAccountOpen(false)}><span className="account-nav-icon"><i className="fas fa-utensils" /></span><span>Pat<span>ria</span></span></a></div>
        <button type="button" className="account-close" id="accountClose" onClick={() => setAccountOpen(false)}><i className="fas fa-times" /></button>
        {user ? <div className="account-dashboard open" id="accountDashboard"><div className="container"><div className="account-dashboard-grid"><aside className="account-side"><div className="account-site-links"><a href="#hero" onClick={() => setAccountOpen(false)}>Home</a><a href="#menu" onClick={() => setAccountOpen(false)}>Menu</a><a href="#contact-section" onClick={() => setAccountOpen(false)}>Contact</a></div>{[["dashboard", "Dashboard"], ["orders", `Orders (${orders.length})`], ["addresses", "Addresses"], ["details", "Account Details"]].map(([page, label]) => <button className={accountPage === page ? "active" : ""} type="button" key={page} onClick={() => setAccountPage(page)}>{label}</button>)}<button type="button" id="linkLineBtn" onClick={() => window.location.href = "/auth/line/link"}>綁定 LINE 帳號</button><button id="accountLogout" type="button" onClick={handleLogout}>Logout</button></aside><main className="account-main"><section className="account-page active"><h2>{accountPage === "dashboard" ? <>Welcome back,<br />{user.name || "Patria member"}</> : accountPage === "orders" ? "Orders" : accountPage === "addresses" ? "Addresses" : "Account Details"}</h2><p className="account-main-desc">{accountPage === "orders" ? "Track your recent orders and start a new Patria order anytime." : accountPage === "addresses" ? "Manage the address used for delivery and pickup updates." : accountPage === "details" ? "Update your display name, email and password." : "Here’s an overview of your account. View your recent orders and manage your account details."}</p>{accountPage === "dashboard" && <div className="account-stat-grid"><div className="account-stat"><i className="fas fa-utensils" /><div><strong>Recent Orders</strong><span>{orders.length} orders</span></div></div><div className="account-stat"><i className="fas fa-user" /><div><strong>Account Details</strong><span>{user.email || user.name || "Member"}</span></div></div></div>}{accountPage === "orders" && <section className="account-section"><div className="account-section-head"><h3>Recent Orders</h3><button type="button" onClick={() => { setAccountOpen(false); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}>Start an order</button></div>{orders.length ? orders.map((order) => <div className="account-empty-row" key={order.id}><span>Order #{order.id}</span><strong>${Number(order.total || 0).toFixed(2)}</strong></div>) : <div className="account-empty-row"><span>You have not placed an order yet.</span></div>}</section>}{accountPage === "addresses" && <section className="account-section account-form-section"><h3>Saved Address</h3><div className="account-form-grid"><label>Full Name<input type="text" defaultValue={user.name || ""} /></label><label>Phone<input type="text" placeholder="Phone number" /></label><label className="wide">Address<input type="text" placeholder="Add your delivery address" /></label></div><button type="button" className="account-save-btn filled">Save Address</button></section>}{accountPage === "details" && <section className="account-section account-form-section"><div className="account-form-grid"><label>Display Name<input type="text" defaultValue={user.name || ""} /></label><label>Email Address<input type="email" defaultValue={user.email || ""} /></label><label>Phone<input type="text" placeholder="Phone number" /></label></div><button type="button" className="account-save-btn filled">Save Changes</button></section>}</section></main></div></div></div> : <div className="account-panel"><div className="container"><div className="row g-4 g-lg-5"><div className="col-lg-6"><h3>Login</h3><form className="account-card" onSubmit={handleLogin}><label>Username or email address *</label><input type="text" autoComplete="username" value={loginForm.login} onChange={(event) => setLoginForm({ ...loginForm, login: event.target.value })} required /><label>Password *</label><input type="password" autoComplete="current-password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required /><p className="account-error">{accountError}</p><button type="submit" className="account-btn">Log in</button><a className="account-btn account-line-btn" href="/auth/line"><i className="fab fa-line" /> 使用 LINE 登入</a></form></div><div className="col-lg-6"><h3>Register</h3><form className="account-card" onSubmit={handleRegister}><label>Full Name *</label><input type="text" autoComplete="name" value={registerForm.name} onChange={(event) => setRegisterForm({ ...registerForm, name: event.target.value })} required /><label>Email address *</label><input type="email" autoComplete="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required /><label>Phone</label><input type="text" autoComplete="tel" value={registerForm.phone} onChange={(event) => setRegisterForm({ ...registerForm, phone: event.target.value })} /><label>Password *</label><input type="password" autoComplete="new-password" minLength="8" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} required /><p className="account-error">{accountError}</p><button type="submit" className="account-btn">Register</button></form></div></div></div></div>}
      </div>

      <main>
        <section id="hero">
          <div className="hs hs1" /><div className="hs hs2" /><div className="hbgtxt">FOOD</div>
          <div className="container"><div className="row align-items-center g-5" style={{ minHeight: "88vh" }}>
            <div className="col-lg-6">
              <div className="hbadge"><div className="hbi"><i className="fas fa-star" /></div><span>#1 Rated Chinese Food Restaurant in Los Angeles</span></div>
              <div className="hero-mobile-art"><div className="hcircle"><img src={`${imageBase}/banners/home-hero.webp`} alt="Patria Chinese food" /></div></div>
              <h1 className="htitle">Delicious <span className="hl">chinese food</span>for Every Day</h1>
              <p className="hdesc">Experience authentic Chinese flavors prepared by premium ingredients. From savory stir-fried noodles to crispy spring rolls, every dish is made to share and savor.</p>
              <div className="hero-actions d-flex flex-wrap gap-3 mb-2"><a href="#menu" className="btn-red"><i className="fas fa-utensils" />Explore Menu</a><a href="#category" className="btn-play"><div className="pico"><i className="fas fa-shopping-cart" /></div><span>Order here</span></a></div>
              <div className="hstats d-flex gap-3 flex-wrap mt-4"><div className="hstat"><span className="snum">342<em>+</em></span><small>Happy Customers</small></div><div className="sdiv" /><div className="hstat"><span className="snum">150<em>+</em></span><small>Menu Items</small></div><div className="sdiv" /><div className="hstat"><span className="snum">10<em>+</em></span><small>Expert Chefs</small></div><div className="sdiv" /><div className="hstat"><span className="snum">18<em>yr</em></span><small>Experience</small></div></div>
            </div>
            <div className="col-lg-6 hero-desktop-art"><div className="hero-art-wrap"><div className="hcircle"><img src={`${imageBase}/banners/home-hero.webp`} alt="Patria Chinese food" /></div><div className="fcard fc1"><div className="fcoi r"><i className="fas fa-fire" /></div><div><span className="fcnum">Hot Deal</span><span className="fcsm">30% off today</span></div></div><div className="fcard fc2"><div className="fcoi y"><i className="fas fa-star" /></div><div><span className="fcnum">4.9/5</span><span className="fcsm">2k+ reviews</span></div></div><div className="fcard fc3"><div className="fcoi g"><i className="fas fa-clock" /></div><div><span className="fcnum">20 min</span><span className="fcsm">Fast delivery</span></div></div></div></div>
          </div></div>
        </section>

        <div className="mqsec"><div className="mqtrack">{["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"].concat(["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"]).map((item, index) => <div className="mqitem" key={`${item}-${index}`}><i className="fas fa-circle" />{item}</div>)}</div></div>

        <section id="category"><div className="container">
          <div className="quick-menu-types" data-aos="fade-up"><h2 className="stitle">Quick Meals / <span>Lunch Sets</span></h2></div>
          <div className="row g-4 quick-meals-grid">
            {quickMealProducts.map((product, index) => <div className="col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay={index * 80} key={`quick-${product.id}`}><ProductCard product={product} badge={index === 0 ? "Quick" : index === 1 ? "Lunch" : "Combo"} onAdd={handleAdd} /></div>)}
          </div>
          <div className="text-center mb-5" data-aos="fade-up"><span className="slbl">What We Offer</span><h2 className="stitle">Explore <span>Our Menu</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>From sizzling burgers to exotic world cuisines - find your favourite in our menu</p></div>
          <div className="row g-3 justify-content-center">
            {categories.map((item, index) => <div className="col-6 col-sm-4 col-md-3 col-lg-2" data-aos="zoom-in" data-aos-delay={index * 70} key={item.name}><button type="button" className={`catcard ${category === item.name ? "active" : ""}`} data-filter={item.name.toLowerCase()} onClick={() => { setCategory(item.name); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}><img className="catimg" src={item.image} alt="" /><div className="catnm">{item.name}</div><div className="catct">{item.name === "ALL" ? products.length : products.filter((product) => String(product.cat).toUpperCase() === item.name).length} items</div></button></div>)}
          </div>
          <div className="local-favourites"><h2 className="stitle">Local <span>Favourites</span></h2></div>
          <div className="row g-4 local-favourites-grid">
            {localFavouriteProducts.map((product, index) => <div className="col-sm-6 col-lg-4" data-aos="fade-up" data-aos-delay={(index % 3) * 80} key={`local-${product.id}`}><ProductCard product={product} badge={index === 0 ? "Local" : index === 1 ? "New" : index === 2 ? "Best Seller" : "Chef Pick"} onAdd={handleAdd} /></div>)}
          </div>
        </div></section>

        <section id="menu"><div className="container"><div className="text-center mb-5" data-aos="fade-up"><span className="slbl">What's Cooking</span><h2 className="stitle">Our Delicious <span>Menu</span></h2><div className="sline" /></div>
          <div className="text-center mb-4" data-aos="fade-up">
            {["ALL", "NOODLES", "DIM SUM", "RICE", "SOUP"].map((item) => <button type="button" className={`filtbtn ${category === item ? "active" : ""}`} data-f={item.toLowerCase()} key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          {error && <p className="alert alert-danger">{error}</p>}
          <div className="row g-4" id="mgrid">{visibleProducts.map((product, index) => <div className="col-sm-6 col-lg-4 mwrap" data-c={String(product.cat || "").toLowerCase()} data-aos="fade-up" data-aos-delay={(index % 3) * 80} key={product.id}><ProductCard product={product} onAdd={handleAdd} /></div>)}</div>
        </div></section>

        <section id="about"><div className="container"><div className="row align-items-center g-5"><div className="col-lg-5"><div className="astack"><div className="aexp"><span className="anum">12+</span><small>Years of<br />Excellence</small></div><div className="amain"><img src="./img/about1.jpg" alt="Restaurant" /></div><div className="asm"><img src="./img/about2.jpg" alt="" /></div></div></div><div className="col-lg-7"><span className="slbl">Our Story</span><h2 className="stitle text-start">We Invite You to Visit<br />Our <span>Food Restaurant</span></h2><div className="sline lft" /><p className="sdesc mb-4">Founded in 2012, Patria began as a small corner joint with a big dream - to serve food that brings people together. Today we serve thousands of happy customers every week with the same passion.</p><a href="#menu" className="btn-red"><i className="fas fa-book-open" /> View Full Menu</a></div></div></div></section>

        <section id="gallery"><div className="container"><div className="text-center mb-5"><span className="slbl">Food Showcase</span><h2 className="stitle">Let's See Our <span>Chinese Food</span></h2><div className="sline" /></div><div className="ggrid">{[1, 2, 4, 5, 6].map((number) => <div className="gitem" key={number}><img src={`./img/portfolio/${number}.webp`} alt="Patria dish" /><div className="gover"><span><i className="fas fa-expand-alt" /> Patria Food</span></div></div>)}</div></div></section>

        <section id="history"><div className="container"><div className="text-center mb-5"><span className="slbl">Our Journey</span><h2 className="stitle">A History of <span>Restaurant</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>From humble beginnings to a beloved restaurant - every chapter written with passion.</p></div><div className="timeline">{[["2012", "Patria opens its first diner on Teka Street."], ["2015", "We introduced our signature tasting menu."], ["2019", "Our modern Chinese food line launched."], ["2026", "Patria continues to grow with online ordering."]].map(([year, text]) => <div className="tli" key={year}><div className="tl-left"><div className="tlyear">{year}</div><p>{text}</p></div><div className="tl-center"><div className="tldot" /></div><div className="tl-right"><div className="tlyear">{year}</div><p>{text}</p></div></div>)}</div></div></section>

        <section id="chefs"><div className="container"><div className="text-center mb-5"><span className="slbl">The Culinary Team</span><h2 className="stitle">Meet Our Expert <span>Chefs</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Alice Mortal", "Head Chef"], [2, "Michael Corn", "Grill Master"], [3, "Sophie Lau", "Pastry Chef"], [4, "David Wong", "Sous Chef"]].map(([number, name, role]) => <div className="col-sm-6 col-lg-3" key={name}><div className="chcard"><div className="chimg"><img src={`./img/chefs/${number}.jpg`} alt={name} /></div><div className="chbody"><div className="chnm">{name}</div><div className="chrole">{role}</div><div className="chexp">8+ years experience</div></div></div></div>)}</div></div></section>

        <section id="hours"><div className="container"><div className="text-center mb-5"><span className="slbl">Opening Hours</span><h2 className="stitle">We're Open <span>For You</span></h2><div className="sline" /></div><div className="row g-4"><div className="col-lg-6"><div className="hrscard">{[["Monday - Tuesday", "09:00 AM - 10:00 PM"], ["Wednesday - Thursday", "09:00 AM - 10:00 PM"], ["Friday", "09:00 AM - 11:00 PM"], ["Saturday", "10:00 AM - 11:30 PM"], ["Sunday", "11:00 AM - 09:00 PM"]].map(([day, time]) => <div className="hrsrow" key={day}><span className="hrsday"><i className="fas fa-calendar-day me-2" />{day}</span><span className="hrstime">{time}</span></div>)}</div></div><div className="col-lg-6"><div className="hrscard"><h5><i className="fas fa-map-marker-alt me-2" /> Find Us</h5><p>52 Teka Street, Los Angeles, CA 90001</p><p>+1 (300) 659-4381</p><p>hello@patriafood.com</p></div></div></div></div></section>

        <section id="testimonials"><div className="container"><div className="text-center mb-5"><span className="slbl">What People Say</span><h2 className="stitle">Our Customers <span>Feedback</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Jack Pichai", "Honestly the best Chinese food I've ever had."], [2, "Jenny Marley", "The food arrived hot and fresh in 22 minutes."], [3, "Tim Bozone", "Great ambiance, friendly staff and delicious food."], [4, "Lily Blate", "Fresh, delicious, on time and well presented."]].map(([number, name, quote]) => <div className="col-md-6 col-lg-3" key={name}><div className="tescard"><div className="tesq">"</div><div className="tess">★★★★★</div><p className="testxt">{quote}</p><div className="tesauth"><img src={`./img/testimonial/${number}.webp`} alt={name} /><div><div className="tesnm">{name}</div><div className="tesrl">Customer</div></div></div></div></div>)}</div></div></section>

        <section id="reservation"><div className="container"><div className="text-center mb-5"><span className="slbl">Book a Table</span><h2 className="stitle">Make a <span>Reservation</span></h2><div className="sline" /></div><div className="reservation-card"><div className="row g-3"><div className="col-sm-6"><label className="flbl">Full Name *</label><input className="fctrl" placeholder="John Doe" /></div><div className="col-sm-6"><label className="flbl">Phone Number *</label><input className="fctrl" placeholder="+1 (800) 000-0000" /></div><div className="col-sm-6"><label className="flbl">Date *</label><input className="fctrl" type="date" /></div><div className="col-sm-6"><label className="flbl">Guests *</label><select className="fctrl"><option>2 People</option><option>3 - 4 People</option><option>5+ People</option></select></div><div className="col-12"><label className="flbl">Special Requests</label><textarea className="fctrl" rows="3" placeholder="Allergies, dietary needs, special occasions..." /></div><div className="col-12"><button type="button" className="btn-red w-100 justify-content-center"> <i className="fas fa-calendar-check" /> Confirm Reservation</button></div></div></div></div></section>

        <section id="newsletter"><div className="container"><div className="nlw text-center"><span className="slbl">Stay Connected</span><h2>Subscribe &amp; Get Exclusive <span>Deals</span></h2><p>Get 15% off your first order plus early access to new menu items</p><div className="nl-form-wrap"><input className="nlinput" type="email" placeholder="Enter your email address..." /><button type="button" className="nlbtn"><i className="fas fa-paper-plane me-1" /> Subscribe</button></div></div></div></section>

        <section id="account" className="account-inline"><div className="container"><div className="text-center mb-4"><span className="slbl">Your Patria</span><h2 className="stitle">My <span>Account</span></h2><div className="sline" /></div></div></section>

        <section id="contact-section"><div className="container"><div className="text-center mb-5" data-aos="fade-up"><span className="slbl">Get In Touch</span><h2 className="stitle">Contact <span>Us</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>Have a question, feedback, or want to plan a special event? We'd love to hear from you.</p></div><div className="row g-4"><div className="col-lg-4" data-aos="fade-right"><div className="ctdark"><h4>Let's Talk</h4><p className="ctsub">We typically respond within 2 hours during business hours.</p>{[["map-marker-alt", "Address", <>52 Teka Street, Los Angeles,<br />CA 90001</>], ["phone-alt", "Phone", "+1 (300) 659-4381"], ["envelope", "Email", "hello@patriafood.com"], ["clock", "Working Hours", "Mon - Sun: 09 AM - 11 PM"]].map(([icon, title, value]) => <div className="ctitem" key={title}><div className="cticon"><i className={`fas fa-${icon}`} /></div><div className="ctinfo"><strong>{title}</strong><span>{value}</span></div></div>)}<div className="ctsocrow"><a href="#"><i className="fab fa-facebook-f" /></a><a href="#"><i className="fab fa-instagram" /></a><a href="#"><i className="fab fa-twitter" /></a><a href="#"><i className="fab fa-youtube" /></a></div></div></div><div className="col-lg-8" data-aos="fade-left"><div className="form-card"><div className="row g-3"><div className="col-sm-6"><label className="flbl">Your Name *</label><input type="text" className="fctrl" placeholder="John Doe" /></div><div className="col-sm-6"><label className="flbl">Email Address *</label><input type="email" className="fctrl" placeholder="you@email.com" /></div><div className="col-sm-6"><label className="flbl">Phone Number</label><input type="tel" className="fctrl" placeholder="+1 (800) 000-0000" /></div><div className="col-sm-6"><label className="flbl">Subject *</label><select className="fctrl"><option>General Inquiry</option><option>Catering &amp; Events</option><option>Feedback</option><option>Partnership</option><option>Media &amp; Press</option></select></div><div className="col-12"><label className="flbl">Message *</label><textarea className="fctrl" rows="5" placeholder="Write your message here..." /></div><div className="col-12"><button type="button" className="btn-red"><i className="fas fa-paper-plane" />Send Message</button></div></div></div></div></div></div></section>
        {contactStatus && <div className="container"><p className="sucmsg text-center">{contactStatus}</p></div>}
      </main>

      <footer><div className="container"><div className="row g-5"><div className="col-lg-4"><div className="fnm">Pat<span>ria</span></div><p className="fdesc">We bring the world's finest flavors together in a fast, friendly, and affordable experience. Every meal crafted with love.</p><div className="fsoc"><a href="#"><i className="fab fa-facebook-f" /></a><a href="#"><i className="fab fa-instagram" /></a><a href="#"><i className="fab fa-twitter" /></a><a href="#"><i className="fab fa-youtube" /></a><a href="#"><i className="fab fa-tiktok" /></a></div></div><div className="col-sm-6 col-lg-2"><div className="ftit">Quick Links</div><ul className="flinks ps-0"><li><a href="#hero"><i className="fas fa-chevron-right" />Home</a></li><li><a href="#about"><i className="fas fa-chevron-right" />About Us</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />Our Menu</a></li><li><a href="#reservation"><i className="fas fa-chevron-right" />Reservation</a></li><li><a href="#contact-section"><i className="fas fa-chevron-right" />Contact</a></li></ul></div><div className="col-sm-6 col-lg-2"><div className="ftit">Our Menu</div><ul className="flinks ps-0"><li><a href="#menu"><i className="fas fa-chevron-right" />NOODLES</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />DIM SUM</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />RICE</a></li><li><a href="#menu"><i className="fas fa-chevron-right" />SOUP</a></li></ul></div><div className="col-lg-4"><div className="ftit">Get In Touch</div>{[["map-marker-alt", "Address", "52 Teka Street, Los Angeles, CA 90001"], ["phone-alt", "Phone", "+1 (300) 659-4381"], ["envelope", "Email", "hello@patriafood.com"], ["clock", "Hours", "Mon - Sun: 09 AM - 11 PM"]].map(([icon, title, value]) => <div className="fci" key={title}><div className="fciico"><i className={`fas fa-${icon}`} /></div><div className="fciinfo"><strong>{title}</strong>{value}</div></div>)}</div></div></div><div className="fbot"><div className="container"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><p>&copy; 2026 <span>Patria Restaurant</span> All rights reserved.<span className="footer-credit">Design by <a href="https://www.aq-webdesign.com/index.html" target="_blank" rel="noopener">A.Q.webdesign</a></span></p><div><a href="#">Privacy Policy</a><a href="#">Terms</a><a href="#">Cookies</a></div></div></div></div></footer>

      {cartOpen && <div className="order-overlay open" onClick={(event) => event.target === event.currentTarget && setCartOpen(false)}><aside className="order-drawer"><div className="order-head"><h2>Your Order</h2><button type="button" className="order-close" onClick={() => setCartOpen(false)}><i className="fas fa-times" /></button></div><div className="order-body">{cart.items.length ? <>{cart.items.map((item) => <div className="account-cart-row" key={item.id}><img src={item.img} alt="" /><span>{item.title} × {item.qty}</span></div>)}<strong>Total: ${Number(cart.total).toFixed(2)}</strong><input type="date" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} /><button type="button" className="account-btn filled" disabled={!user} onClick={handleCheckout}>{user ? "Checkout" : "Please log in"}</button></> : <p className="order-empty">No products in the cart.</p>}</div></aside></div>}
    </>
  );
}

export default App;
