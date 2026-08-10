import { useEffect, useMemo, useState } from "react";
import {
  addToCart,
  checkout,
  getCart,
  getCurrentUser,
  getOrders,
  getProducts,
  logout,
} from "./api/client.js";

const imageBase = "https://www.aq-webdesign.com/images";

const categories = [
  { name: "ALL", image: "./img/category/1.webp" },
  { name: "NOODLES", image: "./img/category/2.webp" },
  { name: "DIM SUM", image: "./img/category/4.webp" },
  { name: "RICE", image: "./img/category/5.webp" },
  { name: "SOUP", image: "./img/category/6.webp" },
];

function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [orders, setOrders] = useState([]);
  const [category, setCategory] = useState("ALL");
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
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

  const visibleProducts = useMemo(() => {
    if (category === "ALL") return products;
    return products.filter((product) => String(product.cat || "").toUpperCase() === category);
  }, [category, products]);

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
  }

  if (loading) return <div className="container py-5"><p>載入中...</p></div>;

  return (
    <>
      <div id="topbar">
        <div className="container"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="top-contact d-flex flex-wrap"><span><i className="fas fa-phone-alt" /> +1 (300) 659-4381</span><span><i className="fas fa-envelope" /> hello@patriafood.com</span><span><i className="fas fa-map-marker-alt" /> 52 Teka Street, LA</span></div>
          <span className="ttag"><i className="fas fa-fire me-1" /> Free Delivery Today!</span>
        </div></div>
      </div>

      <nav className="navbar navbar-expand-lg" id="nav">
        <div className="container">
          <a className="navbar-brand" href="#hero"><div className="blogo"><div className="bico"><i className="fas fa-utensils" /></div><div><div className="bname">Pat<span>ria</span></div><div className="bsub">Chinese Food &amp; Restaurant</div></div></div></a>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navmenu"><i className="fas fa-bars" /></button>
          <div className="collapse navbar-collapse" id="navmenu">
            <ul className="navbar-nav mx-auto">
              {[["Home", "hero"], ["About", "about"], ["Menu", "menu"], ["Account", "account"], ["Contact", "contact-section"]].map(([label, id]) => <li className="nav-item" key={id}><a className="nav-link" href={`#${id}`}>{label}</a></li>)}
            </ul>
            <div className="nav-actions d-flex align-items-center">
              <a href="/admin/signin.html" className="admin-dashboard-link" title="管理後台"><i className="fas fa-table-columns" /></a>
              <a href="#account" className="nav-link" onClick={() => setAccountOpen(true)} title="帳戶"><i className="fas fa-user" /></a>
              <button type="button" className="nav-link" onClick={() => setCartOpen(true)} title="購物車"><i className="fas fa-shopping-cart" /><span className="cart-count">{cart.items.length}</span></button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section id="hero">
          <div className="hs hs1" /><div className="hs hs2" /><div className="hbgtxt">FOOD</div>
          <div className="container"><div className="row align-items-center g-5" style={{ minHeight: "88vh" }}>
            <div className="col-lg-6">
              <div className="hbadge"><div className="hbi"><i className="fas fa-star" /></div><span>#1 Rated Chinese Food Restaurant in Los Angeles</span></div>
              <h1 className="htitle">Delicious <span className="hl">chinese food</span> for Every Day</h1>
              <p className="hdesc">Experience authentic Chinese flavors prepared by premium ingredients. Every dish is made to share and savor.</p>
              <div className="hero-actions d-flex flex-wrap gap-3 mb-2"><a href="#menu" className="btn-red"><i className="fas fa-utensils" /> Explore Menu</a><button type="button" className="btn-play" onClick={() => setCartOpen(true)}><span className="pico"><i className="fas fa-shopping-cart" /></span><span>Order here</span></button></div>
              <div className="hstats d-flex gap-3 flex-wrap mt-4"><div className="hstat"><span className="snum">342<em>+</em></span><small>Happy Customers</small></div><div className="sdiv" /><div className="hstat"><span className="snum">150<em>+</em></span><small>Menu Items</small></div><div className="sdiv" /><div className="hstat"><span className="snum">10<em>+</em></span><small>Expert Chefs</small></div></div>
            </div>
            <div className="col-lg-6 hero-desktop-art"><div className="hero-art-wrap"><div className="hcircle"><img src={`${imageBase}/banners/home-hero.webp`} alt="Patria Chinese food" /></div><div className="fcard fc1"><div className="fcoi r"><i className="fas fa-fire" /></div><div><span className="fcnum">Hot Deal</span><span className="fcsm">30% off today</span></div></div><div className="fcard fc2"><div className="fcoi y"><i className="fas fa-star" /></div><div><span className="fcnum">4.9/5</span><span className="fcsm">2k+ reviews</span></div></div></div></div>
          </div></div>
        </section>

        <div className="mqsec"><div className="mqtrack">{["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"].concat(["DIM SUM", "YUM CHA", "RICE", "SEAFOOD", "NOODLES", "VEGETABLES"]).map((item, index) => <div className="mqitem" key={`${item}-${index}`}><i className="fas fa-circle" />{item}</div>)}</div></div>

        <section id="category"><div className="container">
          <div className="text-center mb-5"><span className="slbl">What We Offer</span><h2 className="stitle">Explore <span>Our Menu</span></h2><div className="sline" /></div>
          <div className="row g-3 justify-content-center">{categories.map((item) => <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={item.name}><button type="button" className={`catcard ${category === item.name ? "active" : ""}`} onClick={() => { setCategory(item.name); document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" }); }}><img className="catimg" src={item.image} alt="" /><div className="catnm">{item.name}</div><div className="catct">{item.name === "ALL" ? products.length : products.filter((product) => String(product.cat).toUpperCase() === item.name).length} items</div></button></div>)}</div>
        </div></section>

        <section id="menu"><div className="container"><div className="text-center mb-5"><span className="slbl">What's Cooking</span><h2 className="stitle">Our Delicious <span>Menu</span></h2><div className="sline" /></div>
          {error && <p className="alert alert-danger">{error}</p>}
          <div className="row g-4">{visibleProducts.map((product) => <div className="col-sm-6 col-lg-4" key={product.id}><article className="mcard"><div className="mimg"><img src={product.img} alt={product.title} loading="lazy" /><div className="mbdg hot"><i className="fas fa-star" /> Featured</div></div><div className="mbody"><div className="mcat">{product.cat}</div><div className="mtit">{product.title}</div><div className="mdesc">{product.desc}</div><div className="mfoot"><div><div className="mprice">{product.price}</div><div className="mstars"><i className="fas fa-star" /> {product.rating || "4.9"}</div></div><button type="button" className="madd" onClick={() => handleAdd(product.id)} title="Add to cart"><i className="fas fa-plus" /></button></div></div></article></div>)}</div>
        </div></section>

        <section id="about"><div className="container"><div className="row align-items-center g-5"><div className="col-lg-5"><div className="astack"><div className="aexp"><span className="anum">12+</span><small>Years of<br />Excellence</small></div><div className="amain"><img src="./img/about1.jpg" alt="Restaurant" /></div><div className="asm"><img src="./img/about2.jpg" alt="" /></div></div></div><div className="col-lg-7"><span className="slbl">Our Story</span><h2 className="stitle text-start">We Invite You to Visit<br />Our <span>Food Restaurant</span></h2><div className="sline lft" /><p className="sdesc mb-4">Founded in 2012, Patria began as a small corner joint with a big dream - to serve food that brings people together. Today we serve thousands of happy customers every week with the same passion.</p><a href="#menu" className="btn-red"><i className="fas fa-book-open" /> View Full Menu</a></div></div></div></section>

        <section id="gallery"><div className="container"><div className="text-center mb-5"><span className="slbl">Food Showcase</span><h2 className="stitle">Let's See Our <span>Chinese Food</span></h2><div className="sline" /></div><div className="ggrid">{[1, 2, 4, 5, 6].map((number) => <div className="gitem" key={number}><img src={`./img/portfolio/${number}.webp`} alt="Patria dish" /><div className="gover"><span><i className="fas fa-expand-alt" /> Patria Food</span></div></div>)}</div></div></section>

        <section id="history"><div className="container"><div className="text-center mb-5"><span className="slbl">Our Journey</span><h2 className="stitle">A History of <span>Restaurant</span></h2><div className="sline" /><p className="sdesc mx-auto" style={{ maxWidth: 480 }}>From humble beginnings to a beloved restaurant - every chapter written with passion.</p></div><div className="timeline">{[["2012", "Patria opens its first diner on Teka Street."], ["2015", "We introduced our signature tasting menu."], ["2019", "Our modern Chinese food line launched."], ["2026", "Patria continues to grow with online ordering."]].map(([year, text]) => <div className="tli" key={year}><div className="tl-left"><div className="tlyear">{year}</div><p>{text}</p></div><div className="tl-center"><div className="tldot" /></div><div className="tl-right"><div className="tlyear">{year}</div><p>{text}</p></div></div>)}</div></div></section>

        <section id="chefs"><div className="container"><div className="text-center mb-5"><span className="slbl">The Culinary Team</span><h2 className="stitle">Meet Our Expert <span>Chefs</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Alice Mortal", "Head Chef"], [2, "Michael Corn", "Grill Master"], [3, "Sophie Lau", "Pastry Chef"], [4, "David Wong", "Sous Chef"]].map(([number, name, role]) => <div className="col-sm-6 col-lg-3" key={name}><div className="chcard"><div className="chimg"><img src={`./img/chefs/${number}.jpg`} alt={name} /></div><div className="chbody"><div className="chnm">{name}</div><div className="chrole">{role}</div><div className="chexp">8+ years experience</div></div></div></div>)}</div></div></section>

        <section id="hours"><div className="container"><div className="text-center mb-5"><span className="slbl">Opening Hours</span><h2 className="stitle">We're Open <span>For You</span></h2><div className="sline" /></div><div className="row g-4"><div className="col-lg-6"><div className="hrscard">{[["Monday - Tuesday", "09:00 AM - 10:00 PM"], ["Wednesday - Thursday", "09:00 AM - 10:00 PM"], ["Friday", "09:00 AM - 11:00 PM"], ["Saturday", "10:00 AM - 11:30 PM"], ["Sunday", "11:00 AM - 09:00 PM"]].map(([day, time]) => <div className="hrsrow" key={day}><span className="hrsday"><i className="fas fa-calendar-day me-2" />{day}</span><span className="hrstime">{time}</span></div>)}</div></div><div className="col-lg-6"><div className="hrscard"><h5><i className="fas fa-map-marker-alt me-2" /> Find Us</h5><p>52 Teka Street, Los Angeles, CA 90001</p><p>+1 (300) 659-4381</p><p>hello@patriafood.com</p></div></div></div></div></section>

        <section id="testimonials"><div className="container"><div className="text-center mb-5"><span className="slbl">What People Say</span><h2 className="stitle">Our Customers <span>Feedback</span></h2><div className="sline" /></div><div className="row g-4">{[[1, "Jack Pichai", "Honestly the best Chinese food I've ever had."], [2, "Jenny Marley", "The food arrived hot and fresh in 22 minutes."], [3, "Tim Bozone", "Great ambiance, friendly staff and delicious food."], [4, "Lily Blate", "Fresh, delicious, on time and well presented."]].map(([number, name, quote]) => <div className="col-md-6 col-lg-3" key={name}><div className="tescard"><div className="tesq">"</div><div className="tess">★★★★★</div><p className="testxt">{quote}</p><div className="tesauth"><img src={`./img/testimonial/${number}.webp`} alt={name} /><div><div className="tesnm">{name}</div><div className="tesrl">Customer</div></div></div></div></div>)}</div></div></section>

        <section id="reservation"><div className="container"><div className="text-center mb-5"><span className="slbl">Book a Table</span><h2 className="stitle">Make a <span>Reservation</span></h2><div className="sline" /></div><div className="reservation-card"><div className="row g-3"><div className="col-sm-6"><label className="flbl">Full Name *</label><input className="fctrl" placeholder="John Doe" /></div><div className="col-sm-6"><label className="flbl">Phone Number *</label><input className="fctrl" placeholder="+1 (800) 000-0000" /></div><div className="col-sm-6"><label className="flbl">Date *</label><input className="fctrl" type="date" /></div><div className="col-sm-6"><label className="flbl">Guests *</label><select className="fctrl"><option>2 People</option><option>3 - 4 People</option><option>5+ People</option></select></div><div className="col-12"><label className="flbl">Special Requests</label><textarea className="fctrl" rows="3" placeholder="Allergies, dietary needs, special occasions..." /></div><div className="col-12"><button type="button" className="btn-red w-100 justify-content-center"> <i className="fas fa-calendar-check" /> Confirm Reservation</button></div></div></div></div></section>

        <section id="newsletter"><div className="container"><div className="nlw text-center"><span className="slbl">Stay Connected</span><h2>Subscribe &amp; Get Exclusive <span>Deals</span></h2><p>Get 15% off your first order plus early access to new menu items</p><div className="nl-form-wrap"><input className="nlinput" type="email" placeholder="Enter your email address..." /><button type="button" className="nlbtn"><i className="fas fa-paper-plane me-1" /> Subscribe</button></div></div></div></section>

        <section id="account"><div className="container"><div className="text-center mb-4"><span className="slbl">Your Patria</span><h2 className="stitle">My <span>Account</span></h2><div className="sline" /></div>{user ? <div className="account-card"><h3>您好，{user.name || "會員"}</h3><p>{orders.length} 筆訂單</p><button type="button" className="account-btn" onClick={handleLogout}>Logout</button></div> : <div className="account-card text-center"><p>登入後查看訂單與會員資料。</p><a className="account-btn account-line-btn" href="/auth/line"><i className="fab fa-line" /> 使用 LINE 登入</a></div>}</div></section>
      </main>

      <footer id="contact-section"><div className="container"><div className="d-flex justify-content-between align-items-center flex-wrap gap-3"><div className="bname">Pat<span>ria</span></div><p className="mb-0">Fresh Chinese food, made to share.</p><a href="#hero">Back to top ↑</a></div></div></footer>

      {cartOpen && <div className="order-overlay open" onClick={(event) => event.target === event.currentTarget && setCartOpen(false)}><aside className="order-drawer"><div className="order-head"><h2>Your Order</h2><button type="button" className="order-close" onClick={() => setCartOpen(false)}><i className="fas fa-times" /></button></div><div className="order-body">{cart.items.length ? <>{cart.items.map((item) => <div className="account-cart-row" key={item.id}><img src={item.img} alt="" /><span>{item.title} × {item.qty}</span></div>)}<strong>Total: ${Number(cart.total).toFixed(2)}</strong><input type="date" value={fulfillmentDate} onChange={(event) => setFulfillmentDate(event.target.value)} /><button type="button" className="account-btn filled" disabled={!user} onClick={handleCheckout}>{user ? "Checkout" : "Please log in"}</button></> : <p className="order-empty">No products in the cart.</p>}</div></aside></div>}
    </>
  );
}

export default App;
