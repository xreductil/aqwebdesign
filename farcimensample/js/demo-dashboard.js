(function () {
  var CART_KEY = "farcimenDemoCart";
  var ORDERS_KEY = "farcimenDemoOrders";
  var BOOKINGS_KEY = "farcimenDemoBookings";
  var PRODUCTS_KEY = "farcimenDemoProducts";
  var ADDRESSES_KEY = "farcimenDemoAddresses";
  var CUSTOMER_KEY = "farcimenDemoCustomer";
  var CUSTOMER_SESSION_KEY = "farcimenDemoCustomerLoggedIn";
  var ENGAGEMENT_KEY = "farcimenDemoEngagement";
  var currentOrderFilter = "all";
  var salesRange = "week";
  var overallRange = "week";
  var customerRange = "week";
  var inventorySearch = "";
  var inventoryFilter = "all";
  var inventoryPage = 1;
  var inventoryPageSize = 10;

  var defaultProducts = [
    { id: "delicious-pizza-20", sku: "FAR-1001", title: "招牌披薩", category: "Pizza", price: 20, unit: "份", stock: 18, day: 5, img: "images/f1.webp", description: "Cheese pizza with tomato sauce and fresh herbs." },
    { id: "delicious-burger-15", sku: "FAR-1002", title: "經典漢堡", category: "Burger", price: 15, unit: "份", stock: 24, day: 5, img: "images/f2.webp", description: "Juicy beef burger with lettuce, tomato and house sauce." },
    { id: "delicious-pizza-17", sku: "FAR-1003", title: "薄脆披薩", category: "Pizza", price: 17, unit: "份", stock: 12, day: 5, img: "images/f3.webp", description: "Crispy crust pizza prepared for sharing." },
    { id: "delicious-pasta-18", sku: "FAR-1004", title: "奶油義大利麵", category: "Pasta", price: 18, unit: "份", stock: 15, day: 5, img: "images/f4.webp", description: "Creamy pasta tossed with vegetables and parmesan." },
    { id: "french-fries-10", sku: "FAR-1005", title: "黃金薯條", category: "Fries", price: 10, unit: "份", stock: 3, day: 5, img: "images/f5.webp", description: "Golden fries served crisp with dipping sauce." },
    { id: "tasty-burger-12", sku: "FAR-1006", title: "美味漢堡", category: "Burger", price: 12, unit: "份", stock: 0, day: 5, img: "images/f7.webp", description: "Classic burger for quick lunches and takeaway orders." }
  ];

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function money(value) {
    return "$" + Number(value || 0).toFixed(2);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
    });
  }

  function productId(title) {
    return String(title || "product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
  }

  function products() {
    var saved = read(PRODUCTS_KEY, null);
    if (saved && saved.length) {
      var changed = false;
      var normalized = saved.map(function (product, index) {
        if (!product.sku) {
          product.sku = "FAR-" + String(1001 + index);
          changed = true;
        }
        if (!product.description) {
          product.description = product.title + " prepared fresh for demo ordering.";
          changed = true;
        }
        if (product.day == null) {
          product.day = 5;
          changed = true;
        }
        if (!product.unit) {
          product.unit = "份";
          changed = true;
        }
        if (product.stock == null && product.quantity != null) {
          product.stock = Number(product.quantity || 0);
          changed = true;
        }
        return product;
      });
      if (changed) write(PRODUCTS_KEY, normalized);
      return normalized;
    }
    write(PRODUCTS_KEY, defaultProducts);
    return defaultProducts;
  }

  function engagement() {
    var saved = read(ENGAGEMENT_KEY, null);
    if (saved) return saved;
    var seed = {
      messages: [
        { name: "Alex Carter", email: "alex@example.com", subject: "Private event", message: "Interested in catering for 20 people.", date: new Date().toISOString() },
        { name: "Mia Chen", email: "mia@example.com", subject: "Menu question", message: "Do you have vegetarian pasta options?", date: new Date(Date.now() - 86400000).toISOString() }
      ],
      subscribers: [
        { email: "foodie@example.com", status: "Active", date: new Date().toISOString() },
        { email: "updates@example.com", status: "Active", date: new Date(Date.now() - 172800000).toISOString() }
      ],
      searches: [
        { keyword: "burger", results: 2, date: new Date().toISOString() },
        { keyword: "pizza", results: 2, date: new Date(Date.now() - 3600000).toISOString() }
      ]
    };
    write(ENGAGEMENT_KEY, seed);
    return seed;
  }

  function orders() {
    var saved = read(ORDERS_KEY, []);
    if (saved.length) return saved;
    var seed = [
      {
        id: "FC-1026",
        customer: "訪客顧客",
        email: "guest@farcimen.demo",
        status: "Processing",
        total: 45,
        time: new Date().toISOString(),
        items: [
          { title: "經典漢堡", price: 15, qty: 1 },
          { title: "招牌披薩", price: 20, qty: 1 },
          { title: "黃金薯條", price: 10, qty: 1 }
        ]
      },
      {
        id: "FC-1019",
        customer: "Lena Howard",
        email: "lena@example.com",
        status: "Completed",
        total: 38,
        time: new Date(Date.now() - 86400000).toISOString(),
        items: [
          { title: "奶油義大利麵", price: 18, qty: 1 },
          { title: "招牌披薩", price: 20, qty: 1 }
        ]
      }
    ];
    write(ORDERS_KEY, seed);
    return seed;
  }

  function addresses() {
    var saved = read(ADDRESSES_KEY, []);
    if (saved.length) return saved;
    var seed = [{ name: "訪客顧客", phone: "+1 300 659 4381", address: "52 Teka Street, LA" }];
    write(ADDRESSES_KEY, seed);
    return seed;
  }

  function bookings() {
    return read(BOOKINGS_KEY, []);
  }

  function cart() {
    return read(CART_KEY, []);
  }

  function customer() {
    var saved = read(CUSTOMER_KEY, null);
    if (saved) {
      var changed = false;
      if (saved.firstName === "Guest") {
        saved.firstName = "訪客";
        changed = true;
      }
      if (saved.lastName === "Customer") {
        saved.lastName = "顧客";
        changed = true;
      }
      if (saved.displayName === "Guest Customer") {
        saved.displayName = "訪客顧客";
        changed = true;
      }
      if (changed) write(CUSTOMER_KEY, saved);
      return saved;
    }
    saved = {
      firstName: "訪客",
      lastName: "顧客",
      displayName: "訪客顧客",
      email: "guest@farcimen.demo",
      phone: "+1 300 659 4381",
      password: "demo1234"
    };
    write(CUSTOMER_KEY, saved);
    return saved;
  }

  function isCustomerLoggedIn() {
    return localStorage.getItem(CUSTOMER_SESSION_KEY) === "true";
  }

  function setCustomerLoggedIn(value) {
    localStorage.setItem(CUSTOMER_SESSION_KEY, value ? "true" : "false");
    renderCustomerShell();
  }

  function itemCount(order) {
    return (order.items || []).reduce(function (sum, item) { return sum + Number(item.qty || 0); }, 0);
  }

  function statusClass(status) {
    return String(status || "Processing").toLowerCase().replace(/\s+/g, "-");
  }

  function statusLabel(status) {
    return {
      Processing: "處理中",
      Completed: "已完成",
      "Picked Up": "已取貨",
      Cancelled: "已取消",
      Active: "啟用中"
    }[status] || status || "處理中";
  }

  function categoryLabel(category) {
    return {
      Burger: "漢堡",
      Pizza: "披薩",
      Pasta: "義大利麵",
      Fries: "薯條",
      Dessert: "甜點"
    }[category] || category || "未分類";
  }

  function unitLabel(unit) {
    return { item: "份" }[unit] || unit || "份";
  }

  function productTitle(title) {
    return {
      "Delicious Pizza": "招牌披薩",
      "Delicious Burger": "經典漢堡",
      "Delicious Pasta": "奶油義大利麵",
      "French Fries": "黃金薯條",
      "Tasty Burger": "美味漢堡"
    }[title] || title || "示範商品";
  }

  function customerName(name) {
    return name === "Guest Customer" ? "訪客顧客" : name || "訪客顧客";
  }

  function setText(selector, text) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.textContent = text;
    });
  }

  function setActive(sectionId) {
    document.querySelectorAll("[data-demo-panel]").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === sectionId);
    });
    document.querySelectorAll("[data-demo-tab]").forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-demo-tab") === sectionId);
    });
  }

  function setMobileMenu(open) {
    var sidebar = document.querySelector(".demo-sidebar");
    var toggle = document.querySelector("[data-demo-menu-toggle]");
    var backdrop = document.querySelector("[data-demo-sidebar-close]");
    if (!sidebar || !toggle || !backdrop) return;
    sidebar.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("demo-menu-open", open);
  }

  function renderSummary() {
    var orderList = orders();
    var productList = products();
    var completed = orderList.filter(function (order) { return order.status === "Completed" || order.status === "Picked Up"; });
    var processing = orderList.filter(function (order) { return order.status === "Processing"; });
    var total = orderList.reduce(function (sum, order) { return sum + Number(order.total || 0); }, 0);
    var completedTotal = completed.reduce(function (sum, order) { return sum + Number(order.total || 0); }, 0);
    var processingTotal = processing.reduce(function (sum, order) { return sum + Number(order.total || 0); }, 0);
    var sold = orderList.reduce(function (sum, order) { return sum + itemCount(order); }, 0);
    var cartItems = cart().reduce(function (sum, item) { return sum + Number(item.qty || 0); }, 0);
    setText("[data-demo-total-sales]", money(total));
    setText("[data-demo-product-count]", productList.length);
    setText("[data-demo-order-count]", orderList.length);
    setText("[data-demo-cart-count]", cartItems);
    setText("[data-demo-items-sold]", sold);
    setText("[data-demo-completed-count]", completed.length);
    setText("[data-demo-processing-count]", processing.length);
    setText("[data-demo-completed-sales]", money(completedTotal));
    setText("[data-demo-processing-sales]", money(processingTotal));
    setText("[data-demo-address-count]", addresses().length);
    setText("[data-demo-booking-count]", bookings().length);
    setText('[data-report-stat="revenue"]', money(total));
    setText('[data-report-stat="sold"]', sold);
    setText('[data-report-stat="low-stock"]', productList.filter(function (product) { return product.stock > 0 && product.stock <= 5; }).length);
    setText('[data-report-stat="out-stock"]', productList.filter(function (product) { return product.stock <= 0; }).length);
    var points = Math.floor(completedTotal);
    document.querySelectorAll("[data-demo-reward-points]").forEach(function (el) { el.textContent = points; });
    var progress = document.querySelector("[data-demo-reward-progress]");
    if (progress) progress.style.width = Math.min(100, points % 100) + "%";
  }

  function renderOrders() {
    var tbody = document.querySelector("[data-demo-orders]");
    if (!tbody) return;
    var list = orders().filter(function (order) {
      return currentOrderFilter === "all" || order.status === currentOrderFilter;
    });
    tbody.innerHTML = list.map(function (order) {
      return '<tr><td><strong>' + order.id + '</strong><br><span class="demo-muted">' + new Date(order.time).toLocaleString() + '</span></td><td>' + customerName(order.customer) + '<br><span class="demo-muted">' + (order.email || "") + '</span></td><td>' + itemCount(order) + '</td><td>' + money(order.total) + '</td><td><span class="demo-status ' + statusClass(order.status) + '">' + statusLabel(order.status) + '</span></td><td><button class="demo-button" data-view-order="' + order.id + '">查看</button></td></tr>';
    }).join("") || '<tr><td colspan="6" class="demo-muted">沒有符合此篩選條件的訂單。</td></tr>';
  }

  function renderRecentOrders() {
    var tbody = document.querySelector("[data-demo-recent-orders]");
    if (!tbody) return;
    tbody.innerHTML = orders().slice(0, 5).map(function (order) {
      return '<tr><td><strong>' + order.id + '</strong></td><td>' + customerName(order.customer) + '</td><td>' + money(order.total) + '</td><td><span class="demo-status ' + statusClass(order.status) + '">' + statusLabel(order.status) + '</span></td><td><button class="demo-button" data-view-order="' + order.id + '">查看</button></td></tr>';
    }).join("");
  }

  function renderCustomerOrders() {
    var rows = orders().map(function (order) {
      return '<tr><td><strong>' + order.id + '</strong></td><td>' + new Date(order.time).toLocaleDateString() + '</td><td>' + money(order.total) + '</td><td><span class="demo-status ' + statusClass(order.status) + '">' + statusLabel(order.status) + '</span></td><td><button class="demo-button" data-view-order="' + order.id + '">查看</button></td></tr>';
    }).join("");
    document.querySelectorAll("[data-demo-customer-orders]").forEach(function (tbody) {
      tbody.innerHTML = rows;
    });
  }

  function productSales() {
    var map = {};
    orders().forEach(function (order) {
      (order.items || []).forEach(function (item) {
        var key = item.id || productId(item.title);
        if (!map[key]) map[key] = { title: productTitle(item.title), qty: 0, revenue: 0 };
        map[key].qty += Number(item.qty || 0);
        map[key].revenue += Number(item.price || 0) * Number(item.qty || 0);
      });
    });
    return Object.keys(map).map(function (key) { return map[key]; }).sort(function (a, b) { return b.qty - a.qty; });
  }

  function filteredProducts() {
    var term = inventorySearch.trim().toLowerCase();
    return products().filter(function (product) {
      var matchesCategory = inventoryFilter === "all" || product.category === inventoryFilter;
      var matchesSearch = !term || [product.title, product.category, product.sku, product.description].join(" ").toLowerCase().indexOf(term) !== -1;
      return matchesCategory && matchesSearch;
    });
  }

  function renderInventoryPagination(total) {
    var showing = document.querySelector("[data-inventory-showing]");
    var pages = Math.max(1, Math.ceil(total / inventoryPageSize));
    inventoryPage = Math.min(inventoryPage, pages);
    var start = total ? (inventoryPage - 1) * inventoryPageSize + 1 : 0;
    var end = Math.min(total, inventoryPage * inventoryPageSize);
    if (showing) showing.textContent = "顯示 " + start + "-" + end + "，共 " + total + " 筆";
    var pager = document.querySelector("[data-inventory-pagination]");
    if (!pager) return;
    var buttons = [];
    buttons.push('<button type="button" data-inventory-page="' + Math.max(1, inventoryPage - 1) + '"' + (inventoryPage === 1 ? " disabled" : "") + '>上一頁</button>');
    for (var i = 1; i <= pages; i += 1) {
      buttons.push('<button type="button" data-inventory-page="' + i + '"' + (i === inventoryPage ? ' class="active"' : "") + '>' + i + '</button>');
    }
    buttons.push('<button type="button" data-inventory-page="' + Math.min(pages, inventoryPage + 1) + '"' + (inventoryPage === pages ? " disabled" : "") + '>下一頁</button>');
    pager.innerHTML = buttons.join("");
  }

  function renderProducts() {
    var wrap = document.querySelector("[data-demo-products]");
    if (!wrap) return;
    var list = filteredProducts();
    renderInventoryPagination(list.length);
    var pageItems = list.slice((inventoryPage - 1) * inventoryPageSize, inventoryPage * inventoryPageSize);
    if (!pageItems.length) {
      wrap.innerHTML = '<p class="demo-muted">沒有符合目前搜尋或篩選條件的商品。</p>';
      return;
    }
    wrap.innerHTML = '<div class="demo-product-row demo-product-head"><span>代碼</span><span>分類</span><span>天數</span><span>價格</span><span>單位</span><span>數量</span><span>操作</span></div>' + pageItems.map(function (product) {
      return '<div class="demo-product-row"><div class="demo-product-code"><img src="' + escapeHtml(product.img) + '" alt=""><div><strong>' + escapeHtml(product.sku) + '</strong><small>' + escapeHtml(productTitle(product.title)) + '</small></div></div><span>' + escapeHtml(categoryLabel(product.category)) + '</span><span>' + (product.day || 5) + '</span><strong>' + money(product.price) + '</strong><span>' + escapeHtml(unitLabel(product.unit)) + '</span><input type="number" min="0" value="' + product.stock + '" data-stock="' + escapeHtml(product.id) + '"><div class="demo-product-actions"><button class="demo-button dark" data-save-stock="' + escapeHtml(product.id) + '">儲存</button><button class="demo-icon-button" data-edit-product="' + escapeHtml(product.id) + '"><i class="fa fa-pencil"></i></button><button class="demo-icon-button danger" data-delete-product="' + escapeHtml(product.id) + '"><i class="fa fa-trash"></i></button></div></div>';
    }).join("");
  }

  function renderTopProducts() {
    var rows = productSales().slice(0, 5);
    var html = rows.map(function (item, index) {
      return '<div class="demo-list-row"><span>' + (index + 1) + '</span><div><strong>' + escapeHtml(item.title) + '</strong><small>已售出 ' + item.qty + ' 份</small></div><b>' + money(item.revenue) + '</b></div>';
    }).join("") || '<p class="demo-muted">目前尚無商品銷售資料。</p>';
    document.querySelectorAll("[data-demo-top-products]").forEach(function (wrap) { wrap.innerHTML = html; });
    var revenueWrap = document.querySelector("[data-demo-product-revenue]");
    if (revenueWrap) {
      revenueWrap.innerHTML = rows.slice(0, 4).map(function (item) {
        return '<div class="demo-info-item"><span>' + escapeHtml(item.title) + '</span><strong>' + item.qty + ' / ' + money(item.revenue) + '</strong></div>';
      }).join("") || '<p class="demo-muted">目前尚無營收資料。</p>';
    }
  }

  function renderAddresses() {
    var wrap = document.querySelector("[data-demo-addresses]");
    if (!wrap) return;
    wrap.innerHTML = addresses().map(function (address, index) {
      return '<div class="demo-card"><strong>' + customerName(address.name) + '</strong><p class="demo-muted">' + address.phone + '</p><p>' + address.address + '</p><button class="demo-button red" data-delete-address="' + index + '">刪除</button></div>';
    }).join("");
  }

  function renderCustomerShell() {
    if (document.body.getAttribute("data-dashboard") !== "customer") return;
    var auth = document.querySelector("[data-customer-auth]");
    var portal = document.querySelector("[data-customer-portal]");
    if (!auth) {
      if (portal) portal.hidden = false;
      renderProfileForm();
      return;
    }
    var loggedIn = isCustomerLoggedIn();
    if (auth) auth.hidden = loggedIn;
    if (portal) portal.hidden = !loggedIn;
    renderProfileForm();
  }

  function renderProfileForm() {
    var form = document.querySelector("[data-demo-profile-form]");
    if (!form) return;
    var data = customer();
    form.elements.firstName.value = data.firstName || "";
    form.elements.lastName.value = data.lastName || "";
    form.elements.displayName.value = data.displayName || "";
    form.elements.email.value = data.email || "";
    form.elements.phone.value = data.phone || "";
    var greeting = document.querySelector("[data-customer-greeting]");
    if (greeting) greeting.textContent = "您好，" + (data.displayName || data.firstName || "顧客") + "，您可以在這裡管理示範訂單與帳戶資料。";
  }

  function renderBookings() {
    var tbody = document.querySelector("[data-demo-bookings]");
    if (!tbody) return;
    tbody.innerHTML = bookings().map(function (booking) {
      return '<tr><td>' + booking.name + '</td><td>' + booking.phone + '</td><td>' + booking.persons + '</td><td>' + booking.date + '</td></tr>';
    }).join("") || '<tr><td colspan="4" class="demo-muted">目前尚無訂位資料。</td></tr>';
  }

  function renderEngagement() {
    var data = engagement();
    var messages = document.querySelector('[data-engagement-table="messages"]');
    if (messages) {
      messages.innerHTML = data.messages.map(function (item) {
        return '<div class="demo-mini-row"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.subject) + '</span><small>' + escapeHtml(item.message) + '</small></div>';
      }).join("") || '<p class="demo-muted">目前尚無聯絡訊息。</p>';
    }
    var subscribers = document.querySelector('[data-engagement-table="subscribers"]');
    if (subscribers) {
      subscribers.innerHTML = data.subscribers.map(function (item) {
        return '<div class="demo-mini-row"><strong>' + escapeHtml(item.email) + '</strong><span>' + escapeHtml(statusLabel(item.status)) + '</span><small>' + new Date(item.date).toLocaleDateString() + '</small></div>';
      }).join("") || '<p class="demo-muted">目前尚無訂閱者。</p>';
    }
    var searches = document.querySelector('[data-engagement-table="searches"]');
    if (searches) {
      searches.innerHTML = data.searches.map(function (item) {
        return '<div class="demo-mini-row"><strong>' + escapeHtml(item.keyword) + '</strong><span>' + item.results + ' 筆結果</span><small>' + new Date(item.date).toLocaleString() + '</small></div>';
      }).join("") || '<p class="demo-muted">目前尚無搜尋紀錄。</p>';
    }
  }

  function renderNotifications() {
    var orderList = orders();
    var productList = products();
    var data = engagement();
    var notes = [];
    orderList.filter(function (order) { return order.status === "Processing"; }).slice(0, 4).forEach(function (order) {
      notes.push({ icon: "fa-file-text-o", title: "處理中訂單 " + order.id, text: money(order.total) + " 等待員工處理。", detail: "顧客：" + customerName(order.customer) + "<br>合計：" + money(order.total) + "<br>狀態：" + statusLabel(order.status) });
    });
    productList.filter(function (product) { return product.stock <= 5; }).slice(0, 4).forEach(function (product) {
      notes.push({ icon: "fa-exclamation-triangle", title: productTitle(product.title), text: product.stock <= 0 ? "已缺貨" : "庫存剩 " + product.stock + " 份。", detail: "商品：" + productTitle(product.title) + "<br>分類：" + product.category + "<br>庫存：" + product.stock + " 份" });
    });
    bookings().slice(0, 2).forEach(function (booking) {
      notes.push({ icon: "fa-calendar", title: "訂位", text: booking.name + " / " + booking.date, detail: "姓名：" + booking.name + "<br>日期：" + booking.date + "<br>時間：" + (booking.time || "未填寫") + "<br>人數：" + (booking.people || "未填寫") });
    });
    (data.messages || []).slice(0, 2).forEach(function (message) {
      notes.push({ icon: "fa-envelope-o", title: "新訊息", text: message.subject, detail: "姓名：" + escapeHtml(message.name) + "<br>Email：" + escapeHtml(message.email) + "<br>主旨：" + escapeHtml(message.subject) + "<br>內容：" + escapeHtml(message.message) });
    });
    setText("[data-demo-notification-count]", notes.length);
    var notificationHtml = notes.map(function (note) {
      return '<button type="button" class="demo-notification-item" data-demo-notification-item data-notification-title="' + escapeHtml(note.title) + '" data-notification-detail="' + escapeHtml(note.detail || note.text) + '"><i class="fa ' + note.icon + '"></i><div><strong>' + escapeHtml(note.title) + '</strong><span>' + escapeHtml(note.text) + '</span></div></button>';
    }).join("") || '<p class="demo-muted">目前沒有通知。</p>';
    document.querySelectorAll("[data-demo-notifications]").forEach(function (menu) {
      menu.innerHTML = notificationHtml;
    });
  }

  function renderCharts() {
    var sales = document.querySelector("[data-demo-sales-chart]");
    if (sales) {
      var sets = {
        week: [34, 48, 28, 60, 72, 46, 88],
        month: [44, 58, 62, 74, 56, 92, 84],
        year: [35, 68, 51, 86, 74, 96, 78]
      };
      sales.innerHTML = sets[salesRange].map(function (value, index) {
        return '<div class="demo-bar-group"><span class="demo-bar sales" style="height:' + value + '%"></span><span class="demo-bar purchase" style="height:' + Math.max(18, value - 20 + index * 2) + '%"></span></div>';
      }).join("");
    }
    var overall = document.querySelector("[data-demo-overall]");
    if (overall) {
      var multiplier = overallRange === "year" ? 12 : overallRange === "month" ? 4 : 1;
      overall.innerHTML = [
        ["營收", money(83 * multiplier)],
        ["平均訂單金額", money(27.6 + multiplier)],
        ["回訪顧客", 18 * multiplier + "%"],
        ["取貨率", 72 + multiplier + "%"]
      ].map(function (item) {
        return '<div class="demo-info-item"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join("");
    }
    var customer = document.querySelector("[data-demo-customer-chart]");
    if (customer) {
      var percent = customerRange === "year" ? 78 : customerRange === "month" ? 63 : 52;
      customer.innerHTML = '<div class="demo-donut-ring" style="--value:' + percent + '%"><strong>' + percent + '%</strong><span>回訪</span></div>';
    }
    renderStockReports();
  }

  function renderStockReports() {
    var low = document.querySelector("[data-demo-low-stock]");
    var out = document.querySelector("[data-demo-out-stock]");
    var list = products();
    if (low) {
      low.innerHTML = list.filter(function (product) { return product.stock > 0 && product.stock <= 5; }).map(stockRow).join("") || '<p class="demo-muted">目前沒有低庫存品項。</p>';
    }
    if (out) {
      out.innerHTML = list.filter(function (product) { return product.stock <= 0; }).map(stockRow).join("") || '<p class="demo-muted">目前沒有缺貨品項。</p>';
    }
  }

  function stockRow(product) {
    return '<div class="demo-stock-row"><img src="' + product.img + '" alt=""><div><strong>' + productTitle(product.title) + '</strong><span>剩 ' + product.stock + ' 份</span></div></div>';
  }

  function csvCell(value) {
    var text = String(value == null ? "" : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportInventoryCsv() {
    var header = ["id", "title", "category", "day", "price", "unit", "quantity", "image", "description", "sku"];
    var rows = products().map(function (product) {
      return [product.id, productTitle(product.title), product.category, product.day || 5, product.price, unitLabel(product.unit), product.stock, product.img, product.description, product.sku].map(csvCell).join(",");
    });
    var blob = new Blob([header.join(",") + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    var link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "farcimen-inventory.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    setText("[data-inventory-excel-status]", "已匯出 " + rows.length + " 筆商品資料為 CSV。");
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var cell = "";
    var quoted = false;
    for (var i = 0; i < text.length; i += 1) {
      var char = text[i];
      if (char === '"' && quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (cell || row.length) {
          row.push(cell);
          rows.push(row);
          row = [];
          cell = "";
        }
      } else {
        cell += char;
      }
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function importInventoryCsv(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCsv(String(reader.result || ""));
      var headers = (rows.shift() || []).map(function (header) { return header.trim().toLowerCase(); });
      var imported = rows.map(function (row, index) {
        var data = {};
        headers.forEach(function (header, i) { data[header] = row[i]; });
        var title = data.title || "匯入商品 " + (index + 1);
        return {
          id: data.id || productId(title) + "-" + Date.now().toString().slice(-5) + index,
          sku: data.sku || "FAR-CSV-" + (index + 1),
          title: title,
          category: data.category || "Burger",
          day: Number(data.day || 5),
          price: Number(data.price || 0),
          unit: data.unit || "份",
          stock: Number(data.quantity || data.stock || 0),
          img: data.image || data.img || "images/f1.webp",
          description: data.description || title + " 由 CSV 匯入。"
        };
      }).filter(function (product) { return product.title; });
      if (!imported.length) {
        setText("[data-inventory-excel-status]", "這份 CSV 沒有可匯入的商品資料。");
        return;
      }
      var existing = products();
      imported.forEach(function (item) {
        var match = existing.findIndex(function (product) { return product.id === item.id; });
        if (match >= 0) existing[match] = item;
        else existing.unshift(item);
      });
      write(PRODUCTS_KEY, existing);
      inventoryPage = 1;
      setText("[data-inventory-excel-status]", "已從 CSV 匯入 " + imported.length + " 筆商品資料。");
      renderAll();
    };
    reader.readAsText(file);
  }

  function openModal(title, html) {
    var modal = document.querySelector(".demo-modal");
    if (!modal) return;
    modal.querySelector("h3").textContent = title;
    modal.querySelector(".demo-modal-body").innerHTML = html;
    modal.classList.add("show");
  }

  function viewOrder(id) {
    var order = orders().find(function (item) { return item.id === id; });
    if (!order) return;
    var items = (order.items || []).map(function (item) {
      return '<tr><td>' + productTitle(item.title) + '</td><td>' + item.qty + '</td><td>' + money(item.price * item.qty) + '</td></tr>';
    }).join("");
    var actions = document.body.getAttribute("data-dashboard") === "staff" ? '<div class="demo-modal-actions"><button class="demo-button" data-complete-order="' + id + '">標記完成</button><button class="demo-button dark" data-pickup-order="' + id + '">標記已取貨</button><button class="demo-button red" data-cancel-order="' + id + '">取消訂單</button></div>' : "";
    openModal("訂單明細", '<p><strong>' + order.id + '</strong> - ' + customerName(order.customer) + '</p><table class="demo-table"><tbody>' + items + '</tbody></table><p><strong>合計：</strong> ' + money(order.total) + '</p><p><strong>狀態：</strong> <span class="demo-status ' + statusClass(order.status) + '">' + statusLabel(order.status) + '</span></p>' + actions);
  }

  function updateOrder(id, status) {
    var list = orders().map(function (order) {
      if (order.id === id) order.status = status;
      return order;
    });
    write(ORDERS_KEY, list);
    renderAll();
    openModal("訂單已更新", "<p>訂單 " + id + " 的狀態已更新為「" + statusLabel(status) + "」。</p>");
  }

  function reorder(id) {
    var order = orders().find(function (item) { return item.id === id; });
    if (!order) return;
    var items = cart();
    (order.items || []).forEach(function (orderItem) {
      var existing = items.find(function (item) { return item.title === orderItem.title; });
      if (existing) existing.qty += Number(orderItem.qty || 1);
      else items.push({ id: orderItem.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title: orderItem.title, price: Number(orderItem.price || 0), qty: Number(orderItem.qty || 1), img: "images/f1.webp" });
    });
    write(CART_KEY, items);
    openModal("已加入購物車", "<p>訂單 " + id + " 的品項已加入示範購物車。</p><p><a class=\"demo-button\" href=\"index.html\">返回前台</a></p>");
  }

  function saveStock(id) {
    var list = products();
    var input = document.querySelector('[data-stock="' + id + '"]');
    list.forEach(function (product) {
      if (product.id === id) product.stock = Number(input.value || 0);
    });
    write(PRODUCTS_KEY, list);
    renderAll();
  }

  function editProduct(id) {
    var product = products().find(function (item) { return item.id === id; });
    if (!product) return;
    openModal("編輯商品", '<form class="demo-form" data-demo-edit-product="' + escapeHtml(id) + '"><label>商品名稱<input name="title" value="' + escapeHtml(productTitle(product.title)) + '"></label><label>SKU<input name="sku" value="' + escapeHtml(product.sku || "") + '"></label><label>分類<input name="category" value="' + escapeHtml(product.category) + '"></label><label>價格<input name="price" type="number" step="0.01" value="' + product.price + '"></label><label>單位<input name="unit" value="' + escapeHtml(unitLabel(product.unit)) + '"></label><label>庫存<input name="stock" type="number" value="' + product.stock + '"></label><label>備貨天數<input name="day" type="number" value="' + (product.day || 5) + '"></label><label>圖片路徑<input name="img" value="' + escapeHtml(product.img) + '"></label><label>描述<textarea name="description" rows="4">' + escapeHtml(product.description || "") + '</textarea></label><button class="demo-button" type="submit">儲存商品</button></form>');
  }

  function deleteProduct(id) {
    write(PRODUCTS_KEY, products().filter(function (product) { return product.id !== id; }));
    renderAll();
  }

  function bindInventoryTools() {
    var search = document.querySelector("[data-inventory-search]");
    if (search) {
      search.addEventListener("input", function () {
        inventorySearch = search.value;
        inventoryPage = 1;
        renderProducts();
      });
    }
    var filter = document.querySelector("[data-inventory-filter]");
    if (filter) {
      filter.addEventListener("change", function () {
        inventoryFilter = filter.value;
        inventoryPage = 1;
        renderProducts();
      });
    }
    var file = document.querySelector("[data-inventory-file]");
    var importButton = document.querySelector("[data-inventory-import]");
    if (importButton && file) {
      importButton.addEventListener("click", function () { file.click(); });
      file.addEventListener("change", function () {
        importInventoryCsv(file.files && file.files[0]);
        file.value = "";
      });
    }
    var exportButton = document.querySelector("[data-inventory-export]");
    if (exportButton) exportButton.addEventListener("click", exportInventoryCsv);
    var pdfButton = document.querySelector("[data-inventory-pdf]");
    if (pdfButton) {
      pdfButton.addEventListener("click", function () {
        setText("[data-inventory-excel-status]", "正在開啟瀏覽器列印視窗，可另存為 PDF。");
        window.print();
      });
    }
  }

  function bindForms() {
    var addressForm = document.querySelector("[data-demo-address-form]");
    if (addressForm) {
      addressForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var form = new FormData(addressForm);
        var list = addresses();
        list.push({ name: form.get("name"), phone: form.get("phone"), address: form.get("address") });
        write(ADDRESSES_KEY, list);
        addressForm.reset();
        renderAll();
      });
    }
    var productForm = document.querySelector("[data-demo-product-form]");
    if (productForm) {
      var imageSelect = productForm.querySelector('select[name="img"]');
      var imageFile = productForm.querySelector('input[name="imageFile"]');
      var preview = document.querySelector("[data-demo-image-preview]");
      if (imageSelect && preview) {
        imageSelect.addEventListener("change", function () {
          productForm._imageData = "";
          preview.src = imageSelect.value;
        });
      }
      if (imageFile && preview) {
        imageFile.addEventListener("change", function () {
          var file = imageFile.files && imageFile.files[0];
          if (!file) return;
          var reader = new FileReader();
          reader.onload = function () {
            productForm._imageData = String(reader.result || "");
            preview.src = productForm._imageData;
          };
          reader.readAsDataURL(file);
        });
      }
      productForm.addEventListener("reset", function () {
        productForm._imageData = "";
        window.setTimeout(function () {
          if (preview && imageSelect) preview.src = imageSelect.value;
          if (!productForm._addingProduct) setText("[data-add-product-status]", "");
        }, 0);
      });
      productForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var form = new FormData(productForm);
        var title = String(form.get("title") || "新商品");
        var item = {
          id: productId(title) + "-" + Date.now().toString().slice(-5),
          sku: form.get("sku") || "FAR-" + Date.now().toString().slice(-6),
          title: title,
          category: form.get("category"),
          price: Number(form.get("price") || 0),
          unit: form.get("unit") || "份",
          stock: Number(form.get("stock") || 0),
          day: Number(form.get("day") || 5),
          img: productForm._imageData || form.get("img"),
          description: form.get("description") || title + " prepared fresh for demo ordering."
        };
        var list = products();
        list.unshift(item);
        write(PRODUCTS_KEY, list);
        productForm._addingProduct = true;
        productForm.reset();
        inventorySearch = "";
        inventoryFilter = "all";
        inventoryPage = 1;
        setText("[data-add-product-status]", "商品已新增，並同步到庫存管理。");
        window.setTimeout(function () { productForm._addingProduct = false; }, 0);
        setActive("inventory");
        renderAll();
      });
    }

    var loginForm = document.querySelector("[data-demo-login-form]");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var form = new FormData(loginForm);
        var data = customer();
        if (form.get("email") && form.get("password")) {
          data.email = form.get("email");
          write(CUSTOMER_KEY, data);
          setCustomerLoggedIn(true);
          renderAll();
        }
      });
    }

    var registerForm = document.querySelector("[data-demo-register-form]");
    if (registerForm) {
      registerForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var form = new FormData(registerForm);
        var name = String(form.get("name") || "訪客顧客").trim();
        var parts = name.split(/\s+/);
        write(CUSTOMER_KEY, {
          firstName: parts[0] || "訪客",
          lastName: parts.slice(1).join(" "),
          displayName: name,
          email: form.get("email"),
          phone: "+1 300 659 4381",
          password: form.get("password")
        });
        setCustomerLoggedIn(true);
        renderAll();
      });
    }

    var profileForm = document.querySelector("[data-demo-profile-form]");
    if (profileForm) {
      profileForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var form = new FormData(profileForm);
        var data = customer();
        data.firstName = form.get("firstName");
        data.lastName = form.get("lastName");
        data.displayName = form.get("displayName");
        data.email = form.get("email");
        data.phone = form.get("phone");
        if (form.get("newPassword")) data.password = form.get("newPassword");
        write(CUSTOMER_KEY, data);
        renderProfileForm();
        openModal("帳戶已更新", "<p>示範帳戶資料已儲存在此瀏覽器。</p>");
      });
    }
  }

  function renderAll() {
    renderSummary();
    renderOrders();
    renderRecentOrders();
    renderCustomerOrders();
    renderProducts();
    renderAddresses();
    renderBookings();
    renderEngagement();
    renderCharts();
    renderTopProducts();
    renderNotifications();
    renderCustomerShell();
  }

  document.addEventListener("click", function (event) {
    var menuToggle = event.target.closest("[data-demo-menu-toggle]");
    if (menuToggle) {
      event.preventDefault();
      setMobileMenu(!menuToggle.classList.contains("is-open"));
      return;
    }
    if (event.target.closest("[data-demo-sidebar-close]")) {
      event.preventDefault();
      setMobileMenu(false);
      return;
    }
    var tab = event.target.closest("[data-demo-tab]");
    if (tab) {
      event.preventDefault();
      setActive(tab.getAttribute("data-demo-tab"));
      setMobileMenu(false);
      return;
    }
    var view = event.target.closest("[data-view-order]");
    if (view) {
      event.preventDefault();
      viewOrder(view.getAttribute("data-view-order"));
      return;
    }
    var reorderButton = event.target.closest("[data-reorder]");
    if (reorderButton) {
      event.preventDefault();
      reorder(reorderButton.getAttribute("data-reorder"));
      return;
    }
    var logout = event.target.closest("[data-demo-logout]");
    if (logout) {
      event.preventDefault();
      setCustomerLoggedIn(false);
      setMobileMenu(false);
      return;
    }
    var complete = event.target.closest("[data-complete-order]");
    if (complete) {
      event.preventDefault();
      updateOrder(complete.getAttribute("data-complete-order"), "Completed");
      return;
    }
    var pickup = event.target.closest("[data-pickup-order]");
    if (pickup) {
      event.preventDefault();
      updateOrder(pickup.getAttribute("data-pickup-order"), "Picked Up");
      return;
    }
    var cancel = event.target.closest("[data-cancel-order]");
    if (cancel) {
      event.preventDefault();
      updateOrder(cancel.getAttribute("data-cancel-order"), "Cancelled");
      return;
    }
    var stock = event.target.closest("[data-save-stock]");
    if (stock) {
      event.preventDefault();
      saveStock(stock.getAttribute("data-save-stock"));
      return;
    }
    var edit = event.target.closest("[data-edit-product]");
    if (edit) {
      event.preventDefault();
      editProduct(edit.getAttribute("data-edit-product"));
      return;
    }
    var removeProduct = event.target.closest("[data-delete-product]");
    if (removeProduct) {
      event.preventDefault();
      deleteProduct(removeProduct.getAttribute("data-delete-product"));
      return;
    }
    var inventoryPageButton = event.target.closest("[data-inventory-page]");
    if (inventoryPageButton && !inventoryPageButton.disabled) {
      event.preventDefault();
      inventoryPage = Number(inventoryPageButton.getAttribute("data-inventory-page") || 1);
      renderProducts();
      return;
    }
    var notificationItem = event.target.closest("[data-demo-notification-item]");
    if (notificationItem) {
      event.preventDefault();
      document.querySelectorAll("[data-demo-notifications]").forEach(function (menu) { menu.classList.remove("show"); });
      openModal(notificationItem.getAttribute("data-notification-title") || "通知", '<p>' + (notificationItem.getAttribute("data-notification-detail") || "") + '</p>');
      return;
    }
    var notifications = event.target.closest("[data-demo-notification-toggle]");
    if (notifications) {
      event.preventDefault();
      var notificationWrap = notifications.closest(".demo-notifications");
      var menu = notificationWrap ? notificationWrap.querySelector("[data-demo-notifications]") : null;
      document.querySelectorAll("[data-demo-notifications]").forEach(function (item) {
        if (item !== menu) item.classList.remove("show");
      });
      if (menu) menu.classList.toggle("show");
      return;
    }
    var orderFilter = event.target.closest("[data-order-filter]");
    if (orderFilter) {
      event.preventDefault();
      currentOrderFilter = orderFilter.getAttribute("data-order-filter");
      document.querySelectorAll("[data-order-filter]").forEach(function (button) { button.classList.toggle("active", button === orderFilter); });
      renderOrders();
      return;
    }
    var salesButton = event.target.closest("[data-report-range]");
    if (salesButton) {
      event.preventDefault();
      salesRange = salesButton.getAttribute("data-report-range");
      document.querySelectorAll("[data-report-range]").forEach(function (button) { button.classList.toggle("active", button === salesButton); });
      renderCharts();
      return;
    }
    var overallButton = event.target.closest("[data-overall-range]");
    if (overallButton) {
      event.preventDefault();
      overallRange = overallButton.getAttribute("data-overall-range");
      document.querySelectorAll("[data-overall-range]").forEach(function (button) { button.classList.toggle("active", button === overallButton); });
      renderCharts();
      return;
    }
    var customerButton = event.target.closest("[data-customer-range]");
    if (customerButton) {
      event.preventDefault();
      customerRange = customerButton.getAttribute("data-customer-range");
      document.querySelectorAll("[data-customer-range]").forEach(function (button) { button.classList.toggle("active", button === customerButton); });
      renderCharts();
      return;
    }
    var deleteAddress = event.target.closest("[data-delete-address]");
    if (deleteAddress) {
      event.preventDefault();
      var list = addresses();
      list.splice(Number(deleteAddress.getAttribute("data-delete-address")), 1);
      write(ADDRESSES_KEY, list);
      renderAll();
      return;
    }
    if (event.target.closest(".demo-modal-close") || event.target.classList.contains("demo-modal")) {
      document.querySelector(".demo-modal").classList.remove("show");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setMobileMenu(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) setMobileMenu(false);
  });

  document.addEventListener("submit", function (event) {
    var editForm = event.target.closest("[data-demo-edit-product]");
    if (!editForm) return;
    event.preventDefault();
    var id = editForm.getAttribute("data-demo-edit-product");
    var form = new FormData(editForm);
    var list = products().map(function (product) {
      if (product.id === id) {
        product.title = form.get("title");
        product.sku = form.get("sku");
        product.category = form.get("category");
        product.price = Number(form.get("price") || 0);
        product.unit = form.get("unit") || "份";
        product.stock = Number(form.get("stock") || 0);
        product.day = Number(form.get("day") || 5);
        product.img = form.get("img") || product.img;
        product.description = form.get("description") || product.description;
      }
      return product;
    });
    write(PRODUCTS_KEY, list);
    document.querySelector(".demo-modal").classList.remove("show");
    renderAll();
  });

  document.addEventListener("DOMContentLoaded", function () {
    bindInventoryTools();
    bindForms();
    renderAll();
  });
})();
