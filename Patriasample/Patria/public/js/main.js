AOS.init({
    duration: 680,
    once: true,
    offset: 55
});

/* NAVBAR SCROLL & ACTIVE LINK  */
window.addEventListener('scroll', function() {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('btt').classList.toggle('show', window.scrollY > 300);
    document.querySelectorAll('section[id]').forEach(function(sec) {
        var top = sec.offsetTop - 110,
            bot = top + sec.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bot) {
            document.querySelectorAll('.nav-link').forEach(function(l) {
                l.classList.remove('active');
            });
            var lnk = document.querySelector('.nav-link[href="#' + sec.id + '"]');
            if (lnk) lnk.classList.add('active');
        }
    });
});

/*  SMOOTH SCROLL + MOBILE NAV CLOSE  */
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;
        var t = document.querySelector(href);
        if (t) {
            e.preventDefault();
            // Close Bootstrap mobile navbar if open
            var navCollapse = document.getElementById('navmenu');
            if (navCollapse && navCollapse.classList.contains('show')) {
                var bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                } else {
                    navCollapse.classList.remove('show');
                }
            }
            // Scroll after slight delay to let navbar close
            setTimeout(function() {
                window.scrollTo({
                    top: t.offsetTop - 78,
                    behavior: 'smooth'
                });
            }, 50);
        }
    });
});


var adminOpen = document.getElementById("adminOpen");
if (adminOpen) {
    adminOpen.addEventListener("click", function(e) {
        e.preventDefault();
        var target = adminOpen.getAttribute("data-admin-url") || adminOpen.getAttribute("href") || "../dashboardsample/dist/index.html#discount-codes";
        window.location.href = new URL(target, window.location.href).href;
    });
}

var searchOv = document.getElementById('searchOv');

document.getElementById('navSearchBtn').addEventListener('click', function() {
    searchOv.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() {
        document.getElementById('searchInput').focus();
    }, 220);
});

document.getElementById('searchClose').addEventListener('click', closeSearch);

// Close when clicking backdrop
searchOv.addEventListener('click', function(e) {
    if (e.target === searchOv) closeSearch();
});

function closeSearch() {
    searchOv.classList.remove('open');
    document.body.style.overflow = '';
}

var authToken = localStorage.getItem("patriaAuthToken") || "";
var guestId = localStorage.getItem("patriaGuestId") || (Date.now().toString(36) + Math.random().toString(36).slice(2));
localStorage.setItem("patriaGuestId", guestId);
var currentUser = null;
var isLoggedIn = Boolean(authToken);
var pendingCheckout = false;
var accountOrders = [];
var accountOrdersTimer = null;

function productSlug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

var PATRIA_API_BASE = window.PATRIA_API_BASE || "";
var PATRIA_SAMPLE_MODE = typeof window.PATRIA_SAMPLE_MODE === "boolean" ? window.PATRIA_SAMPLE_MODE : window.location.protocol === "file:";
var DEMO_USERS_KEY = "patriaSampleUsers";
var DEMO_TOKENS_KEY = "patriaSampleTokens";
var DEMO_CARTS_KEY = "patriaSampleCarts";
var DEMO_ORDERS_KEY = "patriaSampleOrders";
var DEMO_ENGAGEMENT_KEY = "patriaSampleEngagement";
var DEMO_PRODUCTS_KEY = "patriaSampleProducts";
var COUPON_STORAGE_KEY = "patriaCouponCode";
var ADMIN_COUPONS_KEY = "patriaSampleCoupons";
var couponCode = (localStorage.getItem(COUPON_STORAGE_KEY) || "").toUpperCase();
var couponMessage = "";
var serverCoupons = null;
var DEFAULT_COUPONS = [
    { code: "WELCOME15", label: "Welcome 15% off", type: "percent", value: 15, min: 0, enabled: true },
    { code: "PATRIA10", label: "Patria 10% off", type: "percent", value: 10, min: 0, enabled: true },
    { code: "FAMILY5", label: "$5 family order discount", type: "fixed", value: 5, min: 40, enabled: true }
];

function demoRead(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (err) {
        return fallback;
    }
}

function demoWrite(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCoupon(coupon) {
    var type = coupon && coupon.type === "fixed" ? "fixed" : "percent";
    var value = Math.max(0, Number(coupon && coupon.value) || 0);
    if (type === "percent") value = Math.min(100, value);
    return {
        code: String(coupon && coupon.code || "").trim().toUpperCase(),
        label: String(coupon && coupon.label || "").trim(),
        type: type,
        value: value,
        min: Math.max(0, Number(coupon && coupon.min) || 0),
        enabled: coupon && coupon.enabled === false ? false : true
    };
}

function availableCoupons() {
    var stored = demoRead(ADMIN_COUPONS_KEY, null);
    var coupons = !PATRIA_SAMPLE_MODE && Array.isArray(serverCoupons) ? serverCoupons : (Array.isArray(stored) && stored.length ? stored : DEFAULT_COUPONS);
    return coupons.map(normalizeCoupon).filter(function(coupon) {
        return coupon.code && coupon.enabled;
    });
}

function loadCoupons() {
    if (PATRIA_SAMPLE_MODE) return Promise.resolve(availableCoupons());
    return apiRequest("/api/coupons").then(function(data) {
        serverCoupons = data.coupons || [];
        renderOrder();
        renderAccountOrders();
        return serverCoupons;
    }).catch(function(err) {
        console.warn("Coupon API is not available yet.", err);
        return availableCoupons();
    });
}

function demoDelay(data) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(data);
        }, 120);
    });
}

function demoBody(options) {
    if (!options || !options.body) return {};
    if (typeof options.body === "string") {
        try {
            return JSON.parse(options.body);
        } catch (err) {
            return {};
        }
    }
    return options.body;
}

function demoProductsFromPage() {
    var products = [];
    document.querySelectorAll(".mcard").forEach(function(card) {
        var title = card.getAttribute("data-title") || "Menu Item";
        var price = card.getAttribute("data-price") || "$0";
        var id = card.getAttribute("data-product-id") || productSlug(title);
        products.push({
            id: id,
            source: "sample",
            title: title,
            cat: card.getAttribute("data-cat") || "Menu",
            price: price,
            old: card.getAttribute("data-old") || "",
            priceValue: Number(price.replace(/[^0-9.]/g, "")) || 0,
            img: card.getAttribute("data-img") || "",
            desc: card.getAttribute("data-desc") || "",
            rating: card.getAttribute("data-rating") || "4.9",
            reviews: card.getAttribute("data-reviews") || "24",
            cal: card.getAttribute("data-cal") || "520",
            time: card.getAttribute("data-time") || "15",
            tags: card.getAttribute("data-tags") || "Patria,Sample",
            quantity: 25,
            day: "5"
        });
    });
    var storedProducts = demoRead(DEMO_PRODUCTS_KEY, []);
    if (storedProducts.length) {
        return storedProducts;
    }
    demoWrite(DEMO_PRODUCTS_KEY, products);
    return products;
}

function demoUsers() {
    return demoRead(DEMO_USERS_KEY, []);
}

function demoTokens() {
    return demoRead(DEMO_TOKENS_KEY, {});
}

function demoCarts() {
    return demoRead(DEMO_CARTS_KEY, {});
}

function demoOrders() {
    return demoRead(DEMO_ORDERS_KEY, []);
}

function demoEngagement() {
    return demoRead(DEMO_ENGAGEMENT_KEY, { reservations: [], messages: [], subscribers: [], searches: [] });
}

function demoCartKey(user) {
    return user && user.id ? "user:" + user.id : "guest:" + guestId;
}

function demoCurrentUser() {
    if (!authToken) return null;
    var userId = demoTokens()[authToken];
    return demoUsers().find(function(user) {
        return user.id === userId;
    }) || null;
}

function demoPublicUser(user) {
    if (!user) return null;
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        address: user.address || null
    };
}

function demoCartFor(user) {
    var carts = demoCarts();
    return { items: carts[demoCartKey(user)] || [] };
}

function demoSaveCartFor(user, items) {
    var carts = demoCarts();
    carts[demoCartKey(user)] = items;
    demoWrite(DEMO_CARTS_KEY, carts);
    return { items: items };
}

function demoProductByBody(body) {
    var products = demoProductsFromPage();
    return products.find(function(product) {
        return product.id === body.productId || product.title === body.title;
    }) || {
        id: body.productId || productSlug(body.title || "Menu Item"),
        title: body.title || "Menu Item",
        cat: "Menu",
        price: "$0",
        priceValue: 0,
        img: "",
        day: "5"
    };
}

function demoApiRequest(path, options) {
    options = options || {};
    var method = String(options.method || "GET").toUpperCase();
    var body = demoBody(options);
    var user = demoCurrentUser();

    if (method === "GET" && path === "/api/products") {
        return demoDelay({ products: demoProductsFromPage() });
    }

    if (method === "POST" && path === "/api/register") {
        var users = demoUsers();
        var existing = users.find(function(item) { return item.email === body.email; });
        var newUser = existing || {
            id: "user_" + Date.now().toString(36),
            name: body.name || "Demo Customer",
            email: body.email || "demo@patriafood.com",
            phone: body.phone || "",
            password: body.password || "demo",
            address: null
        };
        if (!existing) users.push(newUser);
        demoWrite(DEMO_USERS_KEY, users);
        var token = "sample_" + newUser.id;
        var tokens = demoTokens();
        tokens[token] = newUser.id;
        demoWrite(DEMO_TOKENS_KEY, tokens);
        return demoDelay({ token: token, user: demoPublicUser(newUser), cart: demoCartFor(newUser) });
    }

    if (method === "POST" && path === "/api/login") {
        var loginUsers = demoUsers();
        var found = loginUsers.find(function(item) {
            return item.email === body.login || item.name === body.login || item.phone === body.login;
        });
        if (!found) {
            found = {
                id: "user_demo",
                name: body.login || "Demo Customer",
                email: String(body.login || "demo@patriafood.com").indexOf("@") > -1 ? body.login : "demo@patriafood.com",
                phone: "",
                password: body.password || "demo",
                address: null
            };
            loginUsers.push(found);
            demoWrite(DEMO_USERS_KEY, loginUsers);
        }
        var loginToken = "sample_" + found.id;
        var loginTokens = demoTokens();
        loginTokens[loginToken] = found.id;
        demoWrite(DEMO_TOKENS_KEY, loginTokens);
        return demoDelay({ token: loginToken, user: demoPublicUser(found), cart: demoCartFor(found) });
    }

    if (method === "POST" && path === "/api/logout") {
        var logoutTokens = demoTokens();
        delete logoutTokens[authToken];
        demoWrite(DEMO_TOKENS_KEY, logoutTokens);
        return demoDelay({ ok: true });
    }

    if (method === "GET" && path === "/api/me") {
        if (!user) return Promise.reject(new Error("Not logged in."));
        return demoDelay({ user: demoPublicUser(user), cart: demoCartFor(user) });
    }

    if (method === "PUT" && path === "/api/me") {
        if (!user) return Promise.reject(new Error("Not logged in."));
        var updatedUsers = demoUsers().map(function(item) {
            if (item.id !== user.id) return item;
            return Object.assign({}, item, {
                name: body.name || item.name,
                email: body.email || item.email,
                phone: body.phone || item.phone,
                password: body.password || item.password
            });
        });
        demoWrite(DEMO_USERS_KEY, updatedUsers);
        var updated = updatedUsers.find(function(item) { return item.id === user.id; });
        return demoDelay({ user: demoPublicUser(updated), cart: demoCartFor(updated) });
    }

    if (method === "GET" && path === "/api/cart") {
        return demoDelay(demoCartFor(user));
    }

    if (method === "POST" && path === "/api/cart/add") {
        var product = demoProductByBody(body);
        var cart = demoCartFor(user).items.slice();
        var existingItem = cart.find(function(item) { return item.id === product.id; });
        if (existingItem) existingItem.qty += Number(body.qty || 1);
        else cart.push({
            id: product.id,
            productId: product.id,
            title: product.title,
            cat: product.cat,
            price: product.price,
            priceValue: product.priceValue,
            img: product.img,
            day: product.day || "5",
            qty: Number(body.qty || 1)
        });
        return demoDelay(demoSaveCartFor(user, cart));
    }

    if (method === "PATCH" && path === "/api/cart/item") {
        var patched = demoCartFor(user).items.map(function(item) {
            if (item.id !== body.productId) return item;
            return Object.assign({}, item, { qty: Math.max(1, Number(body.qty || 1)) });
        });
        return demoDelay(demoSaveCartFor(user, patched));
    }

    if (method === "DELETE" && path === "/api/cart/item") {
        var remaining = demoCartFor(user).items.filter(function(item) {
            return item.id !== body.productId;
        });
        return demoDelay(demoSaveCartFor(user, remaining));
    }

    if (method === "PUT" && path === "/api/address") {
        if (!user) return Promise.reject(new Error("Not logged in."));
        var addressUsers = demoUsers().map(function(item) {
            if (item.id !== user.id) return item;
            return Object.assign({}, item, { address: body });
        });
        demoWrite(DEMO_USERS_KEY, addressUsers);
        var addressUser = addressUsers.find(function(item) { return item.id === user.id; });
        return demoDelay({ user: demoPublicUser(addressUser) });
    }

    if (method === "DELETE" && path === "/api/address") {
        if (!user) return Promise.reject(new Error("Not logged in."));
        var clearedUsers = demoUsers().map(function(item) {
            if (item.id !== user.id) return item;
            return Object.assign({}, item, { address: null });
        });
        demoWrite(DEMO_USERS_KEY, clearedUsers);
        var clearedUser = clearedUsers.find(function(item) { return item.id === user.id; });
        return demoDelay({ user: demoPublicUser(clearedUser) });
    }

    if (method === "POST" && path === "/api/checkout") {
        if (!user) return Promise.reject(new Error("Please log in before checkout."));
        var checkoutCart = demoCartFor(user).items;
        if (!checkoutCart.length) return Promise.reject(new Error("Cart is empty."));
        var checkoutTotals = cartTotals(checkoutCart);
        var order = {
            id: "PS-" + Date.now().toString().slice(-8),
            userId: user.id,
            customer: demoPublicUser(user),
            items: checkoutCart,
            subtotal: checkoutTotals.subtotal,
            discount: checkoutTotals.discount,
            couponCode: checkoutTotals.coupon && checkoutTotals.coupon.valid ? checkoutTotals.coupon.code : "",
            total: checkoutTotals.total,
            status: "created",
            fulfillmentDate: body.fulfillmentDate || "",
            createdAt: new Date().toISOString()
        };
        var orders = demoOrders();
        orders.push(order);
        demoWrite(DEMO_ORDERS_KEY, orders);
        demoSaveCartFor(user, []);
        return demoDelay({ order: order, cart: { items: [] } });
    }

    if (method === "GET" && path === "/api/orders") {
        var userOrders = user ? demoOrders().filter(function(order) { return order.userId === user.id; }) : [];
        return demoDelay({ orders: userOrders });
    }

    if (method === "POST" && path === "/api/reservations") {
        var engagement = demoEngagement();
        engagement.reservations.push(Object.assign({}, body, { createdAt: new Date().toISOString() }));
        demoWrite(DEMO_ENGAGEMENT_KEY, engagement);
        return demoDelay({ ok: true });
    }

    if (method === "POST" && path === "/api/contact") {
        var contactEngagement = demoEngagement();
        contactEngagement.messages.push(Object.assign({}, body, { createdAt: new Date().toISOString() }));
        demoWrite(DEMO_ENGAGEMENT_KEY, contactEngagement);
        return demoDelay({ ok: true });
    }

    if (method === "POST" && path === "/api/newsletter") {
        var newsletterEngagement = demoEngagement();
        newsletterEngagement.subscribers.push(Object.assign({}, body, { createdAt: new Date().toISOString(), status: "active" }));
        demoWrite(DEMO_ENGAGEMENT_KEY, newsletterEngagement);
        return demoDelay({ ok: true });
    }

    if (method === "POST" && path === "/api/search") {
        var query = String(body.query || "").toLowerCase();
        var results = demoProductsFromPage().filter(function(product) {
            return product.title.toLowerCase().indexOf(query) > -1 || product.cat.toLowerCase().indexOf(query) > -1 || product.desc.toLowerCase().indexOf(query) > -1;
        });
        var searchEngagement = demoEngagement();
        searchEngagement.searches.push({ query: body.query || "", resultCount: results.length, createdAt: new Date().toISOString() });
        demoWrite(DEMO_ENGAGEMENT_KEY, searchEngagement);
        return demoDelay({ results: results, count: results.length });
    }

    return demoDelay({ ok: true });
}

function apiUrl(path) {
    if (String(path).indexOf("http://") === 0 || String(path).indexOf("https://") === 0) return path;
    if (PATRIA_API_BASE) return PATRIA_API_BASE.replace(/\/$/, "") + path;
    if (window.location.protocol === "file:") return "http://127.0.0.1:8080" + path;
    return path;
}

function apiRequest(path, options) {
    if (PATRIA_SAMPLE_MODE) return demoApiRequest(path, options);

    options = options || {};
    options.headers = options.headers || {};
    options.headers["Content-Type"] = "application/json";
    options.headers["X-Guest-Id"] = guestId;
    if (authToken) options.headers.Authorization = "Bearer " + authToken;
    if (options.body && typeof options.body !== "string") options.body = JSON.stringify(options.body);

    return Promise.resolve().then(function() {
        return fetch(apiUrl(path), options);
    }).then(function(res) {
        return res.text().then(function(text) {
            var data = {};
            if (text) {
                try {
                    data = JSON.parse(text);
                } catch (err) {
                    throw new Error("Sample data is not available.");
                }
            }
            if (!res.ok) throw new Error(data.error || "Request failed.");
            return data;
        });
    });
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[char];
    });
}

function formatMoney(value) {
    return "$" + Number(value || 0).toFixed(2);
}

function cartSubtotal(items) {
    return (items || []).reduce(function(sum, item) {
        return sum + Number(item.priceValue || 0) * Number(item.qty || 0);
    }, 0);
}

function couponDetails(code, subtotal) {
    var normalized = String(code || "").trim().toUpperCase();
    var coupon = availableCoupons().find(function(item) {
        return item.code === normalized;
    });
    if (!coupon) return null;
    if (subtotal < Number(coupon.min || 0)) {
        return {
            code: normalized,
            coupon: coupon,
            valid: false,
            discount: 0,
            message: normalized + " requires a subtotal of " + formatMoney(coupon.min) + "."
        };
    }
    var discount = coupon.type === "percent" ? subtotal * (Number(coupon.value || 0) / 100) : Number(coupon.value || 0);
    discount = Math.min(subtotal, Math.max(0, discount));
    return {
        code: normalized,
        coupon: coupon,
        valid: true,
        discount: discount,
        message: normalized + " applied: " + coupon.label + "."
    };
}

function cartTotals(items) {
    var subtotal = cartSubtotal(items);
    var coupon = couponDetails(couponCode, subtotal);
    var discount = coupon && coupon.valid ? coupon.discount : 0;
    return {
        subtotal: subtotal,
        coupon: coupon,
        discount: discount,
        total: Math.max(0, subtotal - discount)
    };
}

function couponStatusHtml(totals) {
    var sampleCodes = availableCoupons().slice(0, 3).map(function(coupon) {
        return coupon.code;
    }).join(", ");
    var message = couponMessage || (totals.coupon ? totals.coupon.message : (sampleCodes ? "Try " + sampleCodes + "." : "No active discount codes right now."));
    var tone = totals.coupon && totals.coupon.valid ? " success" : (couponMessage ? " error" : "");
    return "<p class=\"coupon-message" + tone + "\">" + escapeHtml(message) + "</p>";
}

function couponFormHtml(prefix, totals) {
    var value = couponCode ? escapeHtml(couponCode) : "";
    var removeButton = couponCode ? "<button type=\"button\" data-coupon-action=\"remove\">Remove</button>" : "";
    return "<div class=\"" + prefix + "-coupon coupon-box\">" +
        "<label for=\"" + prefix + "CouponInput\">優惠碼</label>" +
        "<div class=\"coupon-controls\">" +
        "<input type=\"text\" id=\"" + prefix + "CouponInput\" data-coupon-input value=\"" + value + "\" placeholder=\"輸入 WELCOME15\" autocomplete=\"off\"/>" +
        "<button type=\"button\" data-coupon-action=\"apply\" data-coupon-source=\"" + prefix + "\">Apply</button>" +
        removeButton +
        "</div>" +
        couponStatusHtml(totals) +
        "</div>";
}

function totalsHtml(totals, className) {
    return "<div class=\"" + className + " order-total-lines\">" +
        "<div><span>Subtotal</span><span>" + formatMoney(totals.subtotal) + "</span></div>" +
        (totals.discount ? "<div class=\"discount\"><span>Discount" + (totals.coupon ? " (" + escapeHtml(totals.coupon.code) + ")" : "") + "</span><span>-" + formatMoney(totals.discount) + "</span></div>" : "") +
        "<div class=\"grand-total\"><span>Total</span><span>" + formatMoney(totals.total) + "</span></div>" +
        "</div>";
}

function formatOrderDate(value) {
    if (!value) return "Just now";
    return new Date(value).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function orderLeadDays(items) {
    return (items || []).reduce(function(max, item) {
        var days = Number(item.day == null || item.day === "" ? 5 : item.day);
        return Math.max(max, Number.isFinite(days) ? days : 5);
    }, 0);
}

function dateAfterDays(days) {
    var date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + Number(days || 0));
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

function orderStatusLabel(status) {
    var value = String(status || "created").toLowerCase();
    if (value === "picked_up") return "Picked Up";
    if (value === "completed") return "Completed";
    return "Processing";
}

function renderAccountOrderRows(orders, compact) {
    if (!orders.length) {
        return "<div class=\"account-empty-row\"><span>You have not placed an order yet.</span><button type=\"button\" class=\"account-start-order\">Browse Menu</button></div>";
    }
    return "<div class=\"account-order-list\">" + orders.map(function(order) {
        var qty = (order.items || []).reduce(function(sum, item) {
            return sum + Number(item.qty || 0);
        }, 0);
        var first = order.items && order.items[0] ? order.items[0] : {};
        var status = String(order.status || "").toLowerCase();
        var completed = status === "completed" || status === "picked_up";
        var statusNote = status === "picked_up" ? "Your order has been picked up." : "Your order is completed.";
        return "<article class=\"account-order-row" + (completed ? " completed" : "") + "\">" +
            "<img src=\"" + escapeHtml(first.img || "images/menu/menu-1.webp") + "\" alt=\"" + escapeHtml(first.title || "Order") + "\">" +
            "<div class=\"account-order-copy\">" +
            "<strong>Order #" + escapeHtml(order.id) + "</strong>" +
            "<span>" + qty + " items · " + formatMoney(order.total) + " · Pickup " + escapeHtml(order.fulfillmentDate || "-") + " · " + formatOrderDate(order.createdAt) + "</span>" +
            (completed ? "<em>" + statusNote + "</em>" : "") +
            (!compact && order.items ? "<small>" + order.items.map(function(item) { return escapeHtml(item.title) + " x " + Number(item.qty || 0); }).join(", ") + "</small>" : "") +
            "</div>" +
            "<b class=\"account-order-status\">" + orderStatusLabel(order.status) + "</b>" +
            "</article>";
    }).join("") + "</div>";
}

function renderAccountCartRows() {
    if (!cartItems.length) {
        return "<div class=\"account-cart-box empty\"><span>Your cart is empty.</span><button type=\"button\" class=\"account-start-order\">Browse Menu</button></div>";
    }
    var totals = cartTotals(cartItems);
    return "<div class=\"account-cart-box\">" +
        "<div class=\"account-cart-list\">" + cartItems.map(function(item, index) {
            var itemTotal = Number(item.priceValue || 0) * Number(item.qty || 0);
            return "<article class=\"account-cart-row\">" +
                "<img src=\"" + escapeHtml(item.img || "images/menu/menu-1.webp") + "\" alt=\"" + escapeHtml(item.title || "Cart item") + "\">" +
                "<div class=\"account-order-copy\">" +
                "<strong>" + escapeHtml(item.title || "Untitled item") + "</strong>" +
                "<span>" + escapeHtml(item.cat || "Menu") + " · " + escapeHtml(item.price || formatMoney(item.priceValue)) + "</span>" +
                "<small>Qty " + Number(item.qty || 0) + " · " + formatMoney(itemTotal) + "</small>" +
                "</div>" +
                "<div class=\"account-cart-controls\">" +
                "<button type=\"button\" data-cart-action=\"dec\" data-cart-index=\"" + index + "\">-</button>" +
                "<b>" + Number(item.qty || 0) + "</b>" +
                "<button type=\"button\" data-cart-action=\"inc\" data-cart-index=\"" + index + "\">+</button>" +
                "<button type=\"button\" data-cart-action=\"remove\" data-cart-index=\"" + index + "\">Remove</button>" +
                "</div>" +
                "</article>";
        }).join("") + "</div>" +
        couponFormHtml("account", totals) +
        totalsHtml(totals, "account-cart-total") +
        "<button type=\"button\" class=\"account-checkout-btn\" data-cart-action=\"checkout\">Checkout</button>" +
        "<p class=\"account-cart-note\">" + (isLoggedIn ? "This cart is synced with Your Order." : "Please log in before checkout.") + "</p>" +
        "</div>";
}

function renderAccountNotifications(orders) {
    var completed = orders.filter(function(order) {
        return String(order.status || "").toLowerCase() === "completed";
    });
    if (!completed.length) return "";
    var latest = completed[completed.length - 1];
    return "<div class=\"account-order-notice\">" +
        "<i class=\"fas fa-circle-check\"></i>" +
        "<div><strong>Order completed</strong><span>Your order #" + escapeHtml(latest.id) + " is ready. Thank you for ordering from Patria.</span></div>" +
        "</div>";
}

function bindAccountStartOrderButtons() {
    accountOv.querySelectorAll(".account-start-order").forEach(function(btn) {
        if (btn.getAttribute("data-start-order-bound") === "true") return;
        btn.setAttribute("data-start-order-bound", "true");
        btn.addEventListener("click", function() {
            closeAccount();
            document.getElementById("category").scrollIntoView({ behavior: "smooth", block: "start" });
        });
    });
}

function renderAccountOrders() {
    if (!accountOv) return;
    var dashboardPanel = accountOv.querySelector("[data-account-page-panel=\"dashboard\"]");
    var ordersPanel = accountOv.querySelector("[data-account-page-panel=\"orders\"]");
    var recentSection = dashboardPanel && dashboardPanel.querySelector(".account-section");
    var ordersSection = ordersPanel && ordersPanel.querySelector(".account-section");
    var ordered = accountOrders.slice().sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    var stats = accountOv.querySelectorAll(".account-stat span");
    if (stats[0]) stats[0].textContent = ordered.length + (ordered.length === 1 ? " order" : " orders");

    if (recentSection) {
        recentSection.innerHTML = "<div class=\"account-section-head\"><h3>Recent Orders</h3><button type=\"button\" data-account-page=\"orders\">View All Orders</button></div>" +
            renderAccountNotifications(ordered) +
            renderAccountOrderRows(ordered.slice(0, 3), true);
    }
    if (ordersSection) {
        ordersSection.innerHTML = "<div class=\"account-section-head\"><h3>Current Cart</h3><button type=\"button\" class=\"account-start-order\">Add More</button></div>" +
            renderAccountCartRows() +
            "<div class=\"account-section-head account-history-head\"><h3>Recent Orders</h3><button type=\"button\" class=\"account-start-order\">Start an order</button></div>" +
            renderAccountNotifications(ordered) +
            renderAccountOrderRows(ordered, false);
    }

    accountOv.querySelectorAll("[data-account-page]").forEach(function(btn) {
        if (btn.getAttribute("data-account-page-bound") === "true") return;
        btn.setAttribute("data-account-page-bound", "true");
        btn.addEventListener("click", function() {
            showAccountDashboard(btn.getAttribute("data-account-page"));
        });
    });
    bindAccountStartOrderButtons();
}

function fillAccountProfile() {
    if (!accountOv || !currentUser) return;
    var name = currentUser.name || "Customer";
    var email = currentUser.email || "";
    var phone = currentUser.phone || "";
    var address = currentUser.address || {};
    var stats = accountOv.querySelectorAll(".account-stat span");
    if (stats[1]) stats[1].textContent = address.address ? "Address saved" : "Add an address";
    if (stats[2]) stats[2].textContent = name;

    var miniCards = accountOv.querySelectorAll(".account-mini-card");
    if (miniCards[0]) {
        var ps = miniCards[0].querySelectorAll("p");
        if (ps[0]) ps[0].textContent = name;
        if (ps[1]) ps[1].textContent = address.address ? [address.address, address.city, address.zip].filter(Boolean).join(", ") : "No address saved yet.";
    }

    var addressPanel = accountOv.querySelector("[data-account-page-panel=\"addresses\"]");
    if (addressPanel) {
        var addressInputs = addressPanel.querySelectorAll("input");
        if (addressInputs[0]) addressInputs[0].value = address.fullName || name;
        if (addressInputs[1]) addressInputs[1].value = address.phone || phone;
        if (addressInputs[2]) addressInputs[2].value = address.address || "";
        if (addressInputs[3]) addressInputs[3].value = address.city || "";
        if (addressInputs[4]) addressInputs[4].value = address.zip || "";
    }

    var detailsPanel = accountOv.querySelector("[data-account-page-panel=\"details\"]");
    if (detailsPanel) {
        var detailInputs = detailsPanel.querySelectorAll("input");
        if (detailInputs[0]) detailInputs[0].value = name;
        if (detailInputs[1]) detailInputs[1].value = email;
        if (detailInputs[2]) detailInputs[2].value = phone;
        if (detailInputs[3]) detailInputs[3].value = "";
        if (detailInputs[4]) detailInputs[4].value = "";
    }
}

function loadAccountProfile() {
    if (!isLoggedIn) return Promise.resolve(null);
    return apiRequest("/api/me", { method: "GET" }).then(function(data) {
        currentUser = data.user || currentUser;
        updateAccountDashboard();
        fillAccountProfile();
        return currentUser;
    }).catch(function(err) {
        console.warn(err.message);
        if (err.message === "Not logged in.") {
            authToken = "";
            currentUser = null;
            isLoggedIn = false;
            localStorage.removeItem("patriaAuthToken");
            showAccountForm();
        }
        return null;
    });
}

function loadAccountOrders() {
    if (!isLoggedIn) return Promise.resolve([]);
    return apiRequest("/api/orders", { method: "GET" }).then(function(data) {
        accountOrders = data.orders || [];
        renderAccountOrders();
        return accountOrders;
    }).catch(function(err) {
        console.warn(err.message);
        return accountOrders;
    });
}

function startAccountOrdersPolling() {
    if (accountOrdersTimer || !isLoggedIn) return;
    accountOrdersTimer = setInterval(function() {
        if (accountOv && accountOv.classList.contains("open") && isLoggedIn) {
            loadAccountOrders();
        }
    }, 10000);
}

function stopAccountOrdersPolling() {
    if (!accountOrdersTimer) return;
    clearInterval(accountOrdersTimer);
    accountOrdersTimer = null;
}

function setAuth(data) {
    if (data.token) {
        authToken = data.token;
        localStorage.setItem("patriaAuthToken", authToken);
    }
    if (data.user) currentUser = data.user;
    isLoggedIn = Boolean(authToken);
    if (data.cart) cartItems = data.cart.items || [];
    updateAccountDashboard();
    fillAccountProfile();
    loadAccountOrders();
}

function completeLineLogin() {
    var params = new URLSearchParams(window.location.search);
    var ticket = params.get("line_ticket");
    var lineError = params.get("line_error");
    if (lineError) {
        alert(lineError);
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        return;
    }
    if (!ticket) return;
    apiRequest("/api/auth/line/exchange", { method: "POST", body: { ticket: ticket, guestId: guestId } }).then(function(data) {
        setAuth(data);
        window.history.replaceState({}, document.title, window.location.pathname + "#account");
        if (accountOv) {
            accountOv.classList.add("open");
            showAccountDashboard();
        }
    }).catch(function(err) {
        alert(err.message || "LINE 登入失敗。");
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    });
}

function updateAccountDashboard() {
    var name = currentUser && currentUser.name ? currentUser.name : "jinfeng8605";
    accountOv && accountOv.querySelectorAll(".account-main h2").forEach(function(h2) {
        if (h2.textContent.indexOf("Welcome back") >= 0) h2.innerHTML = "Welcome back,<br/>" + name;
    });
    accountOv && accountOv.querySelectorAll(".account-stat span").forEach(function(span) {
        if (span.textContent === "jinfeng8605") span.textContent = name;
    });
    fillAccountProfile();
}

function setAccountError(form, message) {
    var error = form && form.querySelector(".account-error");
    if (error) error.textContent = message || "";
}

function validateAccountForm(form) {
    var fields = form.querySelectorAll("input[type=\"text\"], input[type=\"email\"], input[type=\"password\"]");
    var valid = true;
    fields.forEach(function(field) {
        var empty = !field.value.trim();
        field.classList.toggle("field-error", empty);
        if (empty) valid = false;
    });
    if (!valid) setAccountError(form, "Please fill in all required fields.");
    else setAccountError(form, "");
    return valid;
}


var accountOv = document.getElementById("accountOv");
var accountOpen = document.getElementById("accountOpen");
var accountClose = document.getElementById("accountClose");
var lineLoginBtn = document.getElementById("lineLoginBtn");
var accountDashboard = document.getElementById("accountDashboard");
var accountMenuToggle = document.getElementById("accountMenuToggle");

function setAccountMenuOpen(open) {
    if (!accountDashboard || !accountMenuToggle) return;
    var accountSide = accountDashboard.querySelector(".account-side");
    accountMenuToggle.classList.toggle("open", open);
    accountMenuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (accountSide) accountSide.classList.toggle("open", open);
}

function setAccountHash() {
    if (window.location.hash !== "#account") {
        window.history.replaceState(null, "", "#account");
    }
}

function clearAccountHash() {
    if (window.location.hash === "#account") {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
}

if (accountOv && accountOpen && accountClose) {
    accountOpen.addEventListener("click", function(e) {
        e.preventDefault();
        if (isLoggedIn) {
            showAccountDashboard();
        } else {
            showAccountForm();
        }
        accountOv.classList.add("open");
        document.body.style.overflow = "hidden";
        setAccountHash();
    });

    accountClose.addEventListener("click", closeAccount);

    if (accountMenuToggle) {
        accountMenuToggle.addEventListener("click", function() {
            setAccountMenuOpen(!accountMenuToggle.classList.contains("open"));
        });
    }

    var accountBackStore = document.getElementById("accountBackStore");
    if (accountBackStore) {
        accountBackStore.addEventListener("click", closeAccount);
    }

    accountOv.querySelectorAll(".account-nav a").forEach(function(link) {
        link.addEventListener("click", function() {
            closeAccount();
        });
    });

    accountOv.querySelectorAll(".account-site-links a").forEach(function(link) {
        link.addEventListener("click", function() {
            closeAccount();
        });
    });

    accountOv.addEventListener("click", function(e) {
        if (e.target === accountOv) closeAccount();
    });

    accountOv.querySelectorAll(".account-password button").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var input = btn.parentElement.querySelector("input");
            input.type = input.type === "password" ? "text" : "password";
        });
    });
}

function showAccountForm() {
    accountOv.classList.remove("dashboard-mode");
    var hero = accountOv.querySelector(".account-hero");
    var panel = accountOv.querySelector(".account-panel");
    if (hero) hero.style.display = "block";
    if (panel) panel.style.display = "block";
    if (accountDashboard) accountDashboard.classList.remove("open");
}

function setAccountPage(page) {
    setAccountMenuOpen(false);
    accountOv.querySelectorAll("[data-account-page]").forEach(function(btn) {
        btn.classList.toggle("active", btn.getAttribute("data-account-page") === page);
    });
    accountOv.querySelectorAll("[data-account-page-panel]").forEach(function(panel) {
        panel.classList.toggle("active", panel.getAttribute("data-account-page-panel") === page);
    });
}

function showAccountDashboard(page) {
    isLoggedIn = true;
    setAccountHash();
    accountOv.classList.add("dashboard-mode");
    var hero = accountOv.querySelector(".account-hero");
    var panel = accountOv.querySelector(".account-panel");
    if (hero) hero.style.display = "block";
    if (panel) panel.style.display = "none";
    if (accountDashboard) accountDashboard.classList.add("open");
    setAccountPage(page || "dashboard");
    loadAccountProfile();
    loadAccountOrders();
    startAccountOrdersPolling();
}

function closeAccount() {
    accountOv.classList.remove("open");
    document.body.style.overflow = "";
    setAccountMenuOpen(false);
    clearAccountHash();
    stopAccountOrdersPolling();
}

if (accountOv && window.location.hash === "#account") {
    accountOv.classList.add("open");
    document.body.style.overflow = "hidden";
    showAccountDashboard();
}

if (accountOv) {
    accountOv.querySelectorAll(".account-card").forEach(function(form) {
        form.addEventListener("submit", function(e) {
            e.preventDefault();
        });
    });

    accountOv.querySelectorAll(".account-btn").forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            var form = btn.closest(".account-card");
            if (!validateAccountForm(form)) return;

            var action = btn.getAttribute("data-account-action");
            var fields = form.querySelectorAll("input[type=\"text\"], input[type=\"email\"], input[type=\"password\"]");
            var body;

            if (action === "register") {
                body = {
                    name: fields[0].value.trim(),
                    email: fields[1].value.trim(),
                    phone: fields[2].value.trim(),
                    password: fields[3].value,
                    guestId: guestId
                };
                apiRequest("/api/register", { method: "POST", body: body }).then(function(data) {
                    setAuth(data);
                    showAccountDashboard();
                    renderOrder();
                    if (pendingCheckout) checkoutOrder();
                }).catch(function(err) {
                    setAccountError(form, err.message);
                });
                return;
            }

            body = { login: fields[0].value.trim(), password: fields[1].value, guestId: guestId };
            apiRequest("/api/login", { method: "POST", body: body }).then(function(data) {
                setAuth(data);
                showAccountDashboard();
                renderOrder();
                if (pendingCheckout) checkoutOrder();
            }).catch(function(err) {
                setAccountError(form, err.message);
            });
        });
    });

    accountOv.querySelectorAll("[data-account-page]").forEach(function(btn) {
        if (btn.getAttribute("data-account-page-bound") === "true") return;
        btn.setAttribute("data-account-page-bound", "true");
        btn.addEventListener("click", function() {
            showAccountDashboard(btn.getAttribute("data-account-page"));
        });
    });

    bindAccountStartOrderButtons();

    accountOv.querySelectorAll(".account-save-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            var panel = btn.closest("[data-account-page-panel]");
            var inputs = panel.querySelectorAll("input");
            if (panel.getAttribute("data-account-page-panel") === "addresses") {
                apiRequest("/api/address", {
                    method: "PUT",
                    body: { fullName: inputs[0].value, phone: inputs[1].value, address: inputs[2].value, city: inputs[3].value, zip: inputs[4].value }
                }).then(function(data) {
                    currentUser = data.user;
                    updateAccountDashboard();
                    fillAccountProfile();
                    alert("Address saved.");
                }).catch(function(err) { alert(err.message); });
                return;
            }
            apiRequest("/api/me", {
                method: "PUT",
                body: { name: inputs[0].value, email: inputs[1].value, phone: inputs[2].value, password: inputs[3].value }
            }).then(function(data) {
                currentUser = data.user;
                updateAccountDashboard();
                fillAccountProfile();
                alert("Account details saved.");
            }).catch(function(err) { alert(err.message); });
        });
    });

    var accountLogout = document.getElementById("accountLogout");
    if (accountLogout) {
        accountLogout.addEventListener("click", function() {
            apiRequest("/api/logout", { method: "POST" }).finally(function() {
                authToken = "";
                currentUser = null;
                isLoggedIn = false;
                localStorage.removeItem("patriaAuthToken");
                showAccountForm();
                renderOrder();
            });
        });
    }
}

if (lineLoginBtn) {
    lineLoginBtn.addEventListener("click", function() {
        window.location.href = "/auth/line";
    });
}

var orderOv = document.getElementById("orderOv");
var orderOpen = document.getElementById("orderOpen");
var orderClose = document.getElementById("orderClose");
var selectedOrderDate = "";

if (orderOv && orderOpen && orderClose) {
    orderOpen.addEventListener("click", function(e) {
        e.preventDefault();
        renderOrder();
        orderOv.classList.add("open");
        document.body.style.overflow = "hidden";
    });

    orderClose.addEventListener("click", closeOrder);

    orderOv.addEventListener("click", function(e) {
        if (e.target === orderOv) closeOrder();
    });
}

function closeOrder() {
    orderOv.classList.remove("open");
    document.body.style.overflow = "";
}

function renderOrder() {
    var orderBody = document.getElementById("orderBody");
    if (!orderBody) return;

    if (!cartItems.length) {
        orderBody.classList.add("is-empty");
        orderBody.innerHTML = "<p class=\"order-empty\">No products in the cart.</p>";
        return;
    }

    orderBody.classList.remove("is-empty");
    var totals = cartTotals(cartItems);
    var leadDays = orderLeadDays(cartItems);
    var minOrderDate = dateAfterDays(leadDays);
    if (selectedOrderDate && selectedOrderDate < minOrderDate) selectedOrderDate = "";

    orderBody.innerHTML = "<div class=\"order-list\">" + cartItems.map(function(item, index) {
        var itemTotal = item.priceValue * item.qty;
        return "<div class=\"order-item\">" +
            "<img src=\"" + item.img + "\" alt=\"" + item.title + "\"/>" +
            "<div class=\"order-item-info\"><div class=\"order-item-title\">" + item.title + "</div>" +
            "<div class=\"order-item-meta\">" + item.cat + " · " + item.price + "</div>" +
            "<div class=\"order-controls\">" +
            "<button type=\"button\" class=\"order-qty-btn\" data-cart-action=\"dec\" data-cart-index=\"" + index + "\">-</button>" +
            "<span class=\"order-qty\">" + item.qty + "</span>" +
            "<button type=\"button\" class=\"order-qty-btn\" data-cart-action=\"inc\" data-cart-index=\"" + index + "\">+</button>" +
            "<button type=\"button\" class=\"order-remove\" data-cart-action=\"remove\" data-cart-index=\"" + index + "\">Remove</button>" +
            "</div>" +
            "<div class=\"order-item-total\">$" + itemTotal.toFixed(2) + "</div></div>" +
            "</div>";
    }).join("") + couponFormHtml("order", totals) +
        totalsHtml(totals, "order-summary") +
        "<label class=\"order-date-field\">Pickup date<input type=\"date\" id=\"orderDate\" min=\"" + minOrderDate + "\" value=\"" + escapeHtml(selectedOrderDate) + "\"/></label>" +
        "<p class=\"order-login-note\">Earliest available date is " + minOrderDate + " because this order requires " + leadDays + " days notice.</p>" +
        "<button type=\"button\" class=\"order-checkout\" data-cart-action=\"checkout\">Checkout</button>" +
        "<p class=\"order-login-note\">" + (isLoggedIn ? "You are logged in and ready to checkout." : "Please log in before checkout.") + "</p></div>";
}

function syncCart(data) {
    cartItems = data.items || [];
    renderOrder();
    renderAccountOrders();
}

function updateCartItem(index, action) {
    if (action === "checkout") {
        checkoutOrder();
        return;
    }

    var item = cartItems[index];
    if (!item) return;

    if (action === "remove") {
        apiRequest("/api/cart/item", { method: "DELETE", body: { productId: item.id, guestId: guestId } }).then(syncCart).catch(function(err) {
            alert(err.message);
        });
        return;
    }

    var qty = item.qty + (action === "inc" ? 1 : -1);
    apiRequest("/api/cart/item", { method: "PATCH", body: { productId: item.id, qty: qty, guestId: guestId } }).then(syncCart).catch(function(err) {
        alert(err.message);
    });
}

function updateCoupon(action, source) {
    if (action === "remove") {
        couponCode = "";
        couponMessage = "優惠碼已移除。";
        localStorage.removeItem(COUPON_STORAGE_KEY);
        renderOrder();
        renderAccountOrders();
        return;
    }

    var input = document.getElementById((source || "order") + "CouponInput") || document.querySelector("[data-coupon-input]");
    var code = input ? input.value.trim().toUpperCase() : "";
    var totals = cartTotals(cartItems);
    var details = couponDetails(code, totals.subtotal);
    if (!code) {
        couponCode = "";
        couponMessage = "請先輸入優惠碼。";
        localStorage.removeItem(COUPON_STORAGE_KEY);
    } else if (!details) {
        couponCode = "";
        couponMessage = "找不到這個優惠碼，請確認後再試一次。";
        localStorage.removeItem(COUPON_STORAGE_KEY);
    } else if (!details.valid) {
        couponCode = code;
        couponMessage = details.message;
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
    } else {
        couponCode = code;
        couponMessage = details.message;
        localStorage.setItem(COUPON_STORAGE_KEY, couponCode);
    }
    renderOrder();
    renderAccountOrders();
}

function checkoutOrder() {
    if (!cartItems.length) return;

    if (!isLoggedIn) {
        pendingCheckout = true;
        closeOrder();
        showAccountForm();
        accountOv.classList.add("open");
        document.body.style.overflow = "hidden";
        return;
    }

    var leadDays = orderLeadDays(cartItems);
    var minOrderDate = dateAfterDays(leadDays);
    if (!selectedOrderDate || selectedOrderDate < minOrderDate) {
        orderOv.classList.add("open");
        document.body.style.overflow = "hidden";
        alert("Please choose a pickup date on or after " + minOrderDate + ".");
        return;
    }

    apiRequest("/api/checkout", { method: "POST", body: { fulfillmentDate: selectedOrderDate, couponCode: couponCode } }).then(function(data) {
        pendingCheckout = false;
        selectedOrderDate = "";
        couponCode = "";
        couponMessage = "";
        localStorage.removeItem(COUPON_STORAGE_KEY);
        syncCart(data.cart || { items: [] });
        loadAccountOrders();
        alert("Order created: " + data.order.id);
    }).catch(function(err) {
        alert(err.message);
    });
}

function addCartItem(item, qty) {
    return apiRequest("/api/cart/add", {
        method: "POST",
        body: { productId: item.productId, title: item.title, qty: qty, guestId: guestId }
    }).then(function(data) {
        syncCart(data);
    });
}

document.addEventListener("click", function(e) {
    var btn = e.target.closest("[data-cart-action]");
    if (!btn) return;

    var index = parseInt(btn.getAttribute("data-cart-index"), 10);
    var action = btn.getAttribute("data-cart-action");
    updateCartItem(index, action);
});

document.addEventListener("click", function(e) {
    var btn = e.target.closest("[data-coupon-action]");
    if (!btn) return;
    updateCoupon(btn.getAttribute("data-coupon-action"), btn.getAttribute("data-coupon-source"));
});

document.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" || !e.target || !e.target.matches("[data-coupon-input]")) return;
    e.preventDefault();
    var source = e.target.id === "accountCouponInput" ? "account" : "order";
    updateCoupon("apply", source);
});

document.addEventListener("change", function(e) {
    if (e.target && e.target.id === "orderDate") {
        selectedOrderDate = e.target.value;
    }
});

// Category buttons inside search box
document.querySelectorAll('.sovcat').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.sovcat').forEach(function(b) {
            b.classList.remove('active');
        });
        this.classList.add('active');
        var f = this.getAttribute('data-cat');
        closeSearch();
        setTimeout(function() {
            filterMenu(f);
            document.getElementById('menu').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 300);
    });
});

// Trending tags fill the search input
document.querySelectorAll('.sovtrend .ttag').forEach(function(t) {
    t.addEventListener('click', function() {
        document.getElementById('searchInput').value = this.textContent.trim();
        document.getElementById('searchInput').focus();
    });
});

document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    var query = this.value.trim();
    if (!query) return;
    e.preventDefault();
    apiRequest('/api/search', { method: 'POST', body: { query: query } }).then(function(data) {
        var found = {};
        (data.products || []).forEach(function(product) {
            found[product.id || productSlug(product.title)] = true;
            found[productSlug(product.title)] = true;
        });
        document.querySelectorAll('.mwrap').forEach(function(wrap) {
            var card = wrap.querySelector('.mcard');
            var id = card ? (card.getAttribute('data-product-id') || productSlug(card.getAttribute('data-title'))) : '';
            wrap.style.display = found[id] || found[productSlug(card && card.getAttribute('data-title'))] ? '' : 'none';
        });
        closeSearch();
        document.getElementById('menu').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function(err) {
        alert(err.message);
    });
});


$(document).ready(function() {
	$('.magnific_popup').magnificPopup({
	  disableOn: 700,
	  type: 'iframe',
	  mainClass: 'mfp-fade',
	  removalDelay: 160,
	  preloader: false,
	  fixedContentPos: false,
	  disableOn: 300
	});	
});


function filterMenu(cat) {
    // sync filter buttons
    document.querySelectorAll('.filtbtn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-f') === cat);
    });
    // sync category cards
    document.querySelectorAll('.catcard').forEach(function(c) {
        c.classList.toggle('active', c.getAttribute('data-filter') === cat);
    });
    // show/hide menu cards
    document.querySelectorAll('.mwrap').forEach(function(w) {
        var c = w.getAttribute('data-c');
        if (cat === 'all' || c === cat) {
            w.classList.remove('gone');
            w.style.opacity = '0';
            w.style.transform = 'translateY(16px)';
            setTimeout(function() {
                w.style.transition = 'opacity .38s,transform .38s';
                w.style.opacity = '1';
                w.style.transform = 'translateY(0)';
            }, 60);
        } else {
            w.classList.add('gone');
        }
    });
}

// Filter buttons
document.querySelectorAll('.filtbtn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        filterMenu(this.getAttribute('data-f'));
    });
});

// Category section cards â†’ scroll + filter
document.querySelectorAll('.catcard').forEach(function(card) {
    card.addEventListener('click', function() {
        var f = this.getAttribute('data-filter');
        window.scrollTo({
            top: document.getElementById('menu').offsetTop - 80,
            behavior: 'smooth'
        });
        setTimeout(function() {
            filterMenu(f);
        }, 480);
    });
});

function menuFilterCode(cat) {
    var key = String(cat || '').trim().toUpperCase();
    if (key === 'NOODLES' || key === 'BURGERS') return 'burgers';
    if (key === 'DIM SUM' || key === 'DIMSUM' || key === 'WRAPS') return 'wraps';
    if (key === 'RICE' || key === 'DESSERTS') return 'desserts';
    if (key === 'SOUP' || key === 'PASTA') return 'pasta';
    return 'burgers';
}

function bindMenuCard(card) {
    if (!card || card.getAttribute('data-menu-bound') === 'true') return;
    card.setAttribute('data-menu-bound', 'true');
    card.addEventListener('click', function() {
        openMenuPop(this);
    });
}

function bindMenuAddButton(btn) {
    if (!btn || btn.getAttribute('data-menu-add-bound') === 'true') return;
    btn.setAttribute('data-menu-add-bound', 'true');
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openMenuPop(this.closest('.mcard'));
    });
}

function renderMenuProducts(products) {
    var grid = document.getElementById('mgrid');
    if (!grid) return;
    grid.innerHTML = '';
    (products || []).filter(function(product) {
        return !String(product.img || '').includes('/QuickMeals/');
    }).forEach(function(product) {
        var title = product.title || 'Menu Item';
        var cat = product.cat || 'NOODLES';
        var price = product.price || formatMoney(product.priceValue);
        var old = product.old || '';
        var img = product.img || 'img/menu/1.webp';
        var desc = product.desc || 'Freshly prepared Patria Chinese food.';
        var rating = product.rating || '4.8';
        var reviews = product.reviews || '24';
        var cal = product.cal || '520';
        var time = product.time || '15';
        var wrap = document.createElement('div');
        wrap.className = 'col-sm-6 col-lg-4 mwrap';
        wrap.setAttribute('data-c', menuFilterCode(cat));
        wrap.innerHTML =
            '<div class="mcard" data-product-id="' + escapeHtml(product.id || productSlug(title)) + '" data-img="' + escapeHtml(img) + '" data-title="' + escapeHtml(title) + '" data-cat="' + escapeHtml(cat) + '" data-price="' + escapeHtml(price) + '" data-old="' + escapeHtml(old) + '" data-rating="' + escapeHtml(rating) + '" data-reviews="' + escapeHtml(reviews) + '" data-cal="' + escapeHtml(cal) + '" data-time="' + escapeHtml(time) + '" data-desc="' + escapeHtml(desc) + '" data-tags="' + escapeHtml(product.tags || cat + ',Patria') + '">' +
            '<div class="mimg"><img src="' + escapeHtml(img) + '" alt="' + escapeHtml(title) + '"><div class="mbdg hot"><i class="fas fa-star"></i> New</div><div class="mhrt"><i class="far fa-heart"></i></div></div>' +
            '<div class="mbody"><div class="mcat">' + escapeHtml(cat) + '</div><div class="mtit">' + escapeHtml(title) + '</div><div class="mdesc">' + escapeHtml(desc) + '</div><div class="mfoot"><div><div class="mprice">' + escapeHtml(price) + '</div><div class="mstars"><i class="fas fa-star"></i> <span style="color:#bbb;font-size:.7rem;">(' + escapeHtml(reviews) + ')</span></div></div><button class="madd" title="View Details"><i class="fas fa-plus"></i></button></div></div>' +
            '</div>';
        grid.appendChild(wrap);
        bindMenuCard(wrap.querySelector('.mcard'));
        bindMenuAddButton(wrap.querySelector('.madd'));
    });
    var active = document.querySelector('.filtbtn.active');
    filterMenu(active ? active.getAttribute('data-f') : 'all');
}

apiRequest('/api/products').then(function(data) {
    renderMenuProducts(data.products || []);
}).catch(function() {});

window.addEventListener('storage', function(event) {
    if (event.key !== DEMO_PRODUCTS_KEY || !PATRIA_SAMPLE_MODE) return;
    apiRequest('/api/products').then(function(data) {
        renderMenuProducts(data.products || []);
    }).catch(function() {});
});


var menuPop = document.getElementById('menuPop');
var mpQty = 1;
var currentMenuItem = null;
var cartItems = [];

function openMenuPop(card) {
    var img = card.getAttribute('data-img');
    var title = card.getAttribute('data-title');
    var cat = card.getAttribute('data-cat');
    var price = card.getAttribute('data-price');
    var old = card.getAttribute('data-old');
    var rating = parseFloat(card.getAttribute('data-rating'));
    var reviews = card.getAttribute('data-reviews');
    var cal = card.getAttribute('data-cal');
    var time = card.getAttribute('data-time');
    var desc = card.getAttribute('data-desc');
    var tags = card.getAttribute('data-tags') || '';
    currentMenuItem = {
        img: img,
        title: title,
        cat: cat,
        price: price,
        priceValue: parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0,
        productId: card.getAttribute('data-product-id') || productSlug(title)
    };

    document.getElementById('mpImg').setAttribute('src', img);
    document.getElementById('mpCat').textContent = cat;
    document.getElementById('mpTitle').textContent = title;

    var full = Math.round(rating),
        empty = 5 - full;
    document.getElementById('mpStars').innerHTML =
        '<i class="fas fa-star"></i>'.repeat(full) + 'â˜†'.repeat(empty) +
        ' <span style="color:#bbb;font-size:.78rem;">' + rating + ' (' + reviews + ' reviews)</span>';

    document.getElementById('mpDesc').textContent = desc;

    document.getElementById('mpPrice').innerHTML =
        price + (old ? '<small style="color:#ccc;text-decoration:line-through;margin-left:8px;font-size:1rem;">' + old + '</small>' : '');

    document.getElementById('mpMeta').innerHTML =
        '<div class="mpm"><div class="mpmv">' + cal + ' kcal</div><div class="mpml">Calories</div></div>' +
        '<div class="mpm"><div class="mpmv">' + time + ' min</div><div class="mpml">Prep Time</div></div>' +
        '<div class="mpm"><div class="mpmv">' + rating + '/5</div><div class="mpml">Rating</div></div>';

    document.getElementById('mpTags').innerHTML =
        tags.split(',').filter(Boolean).map(function(t) {
            return '<span class="mptag">' + t.trim() + '</span>';
        }).join('');

    mpQty = 1;
    document.getElementById('mpQnum').textContent = 1;
    document.getElementById('mpAddCart').innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
    document.getElementById('mpAddCart').style.background = '';

    menuPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

// Card click open popup
document.querySelectorAll('.mcard').forEach(bindMenuCard);

// + button  open popup (stop propagation to avoid double firing)
document.querySelectorAll('.madd').forEach(bindMenuAddButton);

// Heart toggle (no popup)
document.querySelectorAll('.mhrt').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var ico = this.querySelector('i');
        ico.classList.toggle('far');
        ico.classList.toggle('fas');
        this.style.color = ico.classList.contains('fas') ? 'var(--primary)' : '#ccc';
    });
});

// Close popup
document.getElementById('mpClose').addEventListener('click', closeMenuPop);
menuPop.addEventListener('click', function(e) {
    if (e.target === this) closeMenuPop();
});

function closeMenuPop() {
    menuPop.classList.remove('open');
    document.body.style.overflow = '';
}

// Qty +/-
document.getElementById('mpPlus').addEventListener('click', function() {
    document.getElementById('mpQnum').textContent = ++mpQty;
});
document.getElementById('mpMinus').addEventListener('click', function() {
    if (mpQty > 1) document.getElementById('mpQnum').textContent = --mpQty;
});

// Add to cart button
document.getElementById('mpAddCart').addEventListener('click', function() {
    if (!currentMenuItem) return;

    var self = this;
    addCartItem(currentMenuItem, mpQty).then(function() {
        self.innerHTML = '<i class="fas fa-check"></i> Added to Cart!';
        self.style.background = 'linear-gradient(135deg,var(--green),#1a4a35)';
        setTimeout(function() {
            closeMenuPop();
            self.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
            self.style.background = '';
            orderOv.classList.add('open');
            document.body.style.overflow = 'hidden';
        }, 650);
    }).catch(function(err) {
        alert(err.message);
    });
});


document.getElementById('resBtn').addEventListener('click', function() {
    var btn = this;
    var box = btn.closest('.fcard');
    var fields = box.querySelectorAll('.fctrl');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';
    btn.disabled = true;
    apiRequest('/api/reservations', {
        method: 'POST',
        body: {
            name: fields[0].value,
            phone: fields[1].value,
            email: fields[2].value,
            guests: fields[3].value,
            date: fields[4].value,
            time: fields[5].value,
            requests: fields[6].value
        }
    }).then(function() {
        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Reservation';
        btn.disabled = false;
        fields.forEach(function(field) { field.value = ''; });
        var ok = document.getElementById('resOk');
        ok.style.display = 'block';
        ok.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }).catch(function(err) {
        btn.innerHTML = '<i class="fas fa-calendar-check"></i> Confirm Reservation';
        btn.disabled = false;
        alert(err.message);
    });
});


document.getElementById('ctcBtn').addEventListener('click', function() {
    var btn = this;
    var box = btn.closest('.fcard');
    var fields = box.querySelectorAll('.fctrl');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;
    apiRequest('/api/contact', {
        method: 'POST',
        body: {
            name: fields[0].value,
            email: fields[1].value,
            phone: fields[2].value,
            subject: fields[3].value,
            message: fields[4].value
        }
    }).then(function() {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        btn.disabled = false;
        fields.forEach(function(field) { field.value = ''; });
        var ok = document.getElementById('ctcOk');
        ok.style.display = 'block';
        ok.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }).catch(function(err) {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
        btn.disabled = false;
        alert(err.message);
    });
});


var galPop = document.getElementById('galPop');
var galData = [];
var galIdx = 0;

document.querySelectorAll('.gitem').forEach(function(item) {
    galData.push({
        img: item.getAttribute('data-gimg'),
        title: item.getAttribute('data-gtitle'),
        desc: item.getAttribute('data-gdesc')
    });
    item.addEventListener('click', function() {
        openGal(parseInt(this.getAttribute('data-gi')));
    });
});

function openGal(i) {
    galIdx = i;
    var g = galData[i];
    document.getElementById('gpImg').setAttribute('src', g.img);
    document.getElementById('gpTitle').textContent = g.title;
    document.getElementById('gpDesc').innerHTML = g.desc;
    galPop.classList.add('open');
    document.body.style.overflow = 'hidden';
}

document.getElementById('gpClose').addEventListener('click', closeGal);
galPop.addEventListener('click', function(e) {
    if (e.target === this) closeGal();
});

function closeGal() {
    galPop.classList.remove('open');
    document.body.style.overflow = '';
}

document.getElementById('gpPrev').addEventListener('click', function() {
    openGal((galIdx - 1 + galData.length) % galData.length);
});
document.getElementById('gpNext').addEventListener('click', function() {
    openGal((galIdx + 1) % galData.length);
});

/*  ESC key closes everything */
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSearch();
        closeMenuPop();
        closeGal();
        if (typeof $.magnificPopup !== 'undefined') $.magnificPopup.close();
    }
});


new Swiper('.tesSwiper', {
    slidesPerView: 1,
    spaceBetween: 22,
    loop: true,
    autoplay: {
        delay: 4000,
        disableOnInteraction: false
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true
    },
    breakpoints: {
        640: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
    }
});


var cH = 8,
    cM = 45,
    cS = 30;
setInterval(function() {
    cS--;
    if (cS < 0) {
        cS = 59;
        cM--;
    }
    if (cM < 0) {
        cM = 59;
        cH--;
    }
    if (cH < 0) {
        cH = 8;
        cM = 45;
        cS = 30;
    }
    document.getElementById('cdH').textContent = String(cH).padStart(2, '0');
    document.getElementById('cdM').textContent = String(cM).padStart(2, '0');
    document.getElementById('cdS').textContent = String(cS).padStart(2, '0');
}, 1000);

/* â”€â”€ NEWSLETTER â”€â”€ */
document.getElementById('nlBtn').addEventListener('click', function() {
    var email = document.getElementById('nlEmail').value;
    if (email && email.includes('@')) {
        var btn = this;
        btn.textContent = 'Subscribing...';
        btn.disabled = true;
        apiRequest('/api/newsletter', { method: 'POST', body: { email: email } }).then(function() {
            btn.textContent = 'Subscribed!';
            btn.style.background = '#4ade80';
            btn.style.color = '#222';
            document.getElementById('nlEmail').value = '';
            setTimeout(function() {
                btn.textContent = 'Subscribe';
                btn.style.background = '';
                btn.style.color = '';
                btn.disabled = false;
            }, 3000);
        }).catch(function(err) {
            btn.textContent = 'Subscribe';
            btn.disabled = false;
            alert(err.message);
        });
    }
});

/*  NUMBER COUNTER ANIMATION*/
var numAnimated = false;
window.addEventListener('scroll', function() {
    var hero = document.getElementById('hero');
    if (!numAnimated && hero && window.scrollY > hero.offsetHeight - 300) {
        numAnimated = true;
        document.querySelectorAll('.snum').forEach(function(el) {
            var txt = el.textContent;
            var num = parseInt(txt);
            var suf = txt.replace(/[0-9]/g, '');
            if (isNaN(num)) return;
            var start = 0;
            var step = Math.ceil(num / 55);
            var iv = setInterval(function() {
                start += step;
                if (start >= num) {
                    start = num;
                    clearInterval(iv);
                }
                el.textContent = start + suf;
            }, 1400 / 55);
        });
    }
});

loadCoupons();
completeLineLogin();
apiRequest('/api/cart').then(syncCart).catch(function() {});
if (authToken) {
    apiRequest('/api/me').then(function(data) {
        currentUser = data.user;
        isLoggedIn = true;
        updateAccountDashboard();
    }).catch(function() {
        authToken = '';
        isLoggedIn = false;
        localStorage.removeItem('patriaAuthToken');
    });
}
