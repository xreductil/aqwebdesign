(function () {
  var CART_KEY = "foodmartDemoCart";
  var ACCOUNT_KEY = "foodmartDemoAccount";
  var ORDERS_KEY = "foodmartDemoOrders";
  var PRODUCTS_KEY = "foodmartDemoProducts";
  var ADDRESSES_KEY = "foodmartDemoAddresses";

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

  function cart() {
    return read(CART_KEY, []);
  }

  function saveCart(items) {
    write(CART_KEY, items);
    renderCart();
  }

  function orders() {
    return read(ORDERS_KEY, []);
  }

  function saveOrders(items) {
    write(ORDERS_KEY, items);
  }

  function products() {
    return read(PRODUCTS_KEY, []);
  }

  function saveProducts(items) {
    write(PRODUCTS_KEY, items);
  }

  function account() {
    var saved = read(ACCOUNT_KEY, null);
    if (saved) {
      if (saved.name === "Demo Customer") {
        saved.name = "示範顧客";
        write(ACCOUNT_KEY, saved);
      }
      return saved;
    }
    saved = {
      name: "示範顧客",
      email: "customer@foodmart.demo",
      phone: "+1 980 349 4089"
    };
    write(ACCOUNT_KEY, saved);
    return saved;
  }

  function ensureStyles() {
    if (document.getElementById("foodmart-demo-style")) return;
    var style = document.createElement("style");
    style.id = "foodmart-demo-style";
    style.textContent = [
      ".foodmart-cart-link{position:relative;}",
      ".foodmart-cart-count{position:absolute;right:-6px;top:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ffc43f;color:#222;font-size:11px;line-height:18px;text-align:center;font-weight:800;}",
      ".foodmart-cart-row{display:grid;grid-template-columns:58px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #eee;}",
      ".foodmart-cart-row img{width:58px;height:58px;object-fit:contain;border-radius:12px;background:#f8f8f8;}",
      ".foodmart-cart-row h6{margin:0 0 4px;font-size:15px;}",
      ".foodmart-cart-row small{color:#777;}",
      ".foodmart-cart-controls{grid-column:2/4;display:flex;align-items:center;gap:8px;}",
      ".foodmart-cart-controls button{border:0;border-radius:999px;background:#f1f1f1;color:#222;min-width:34px;height:34px;font-weight:800;}",
      ".foodmart-cart-controls button[data-foodmart-remove]{background:#222;color:#fff;padding:0 12px;}",
      ".foodmart-cart-total-row{display:flex;align-items:center;justify-content:space-between;font-size:20px;font-weight:800;margin:18px 0;}",
      ".foodmart-demo-modal{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.5);padding:20px;overflow:auto;}",
      ".foodmart-demo-modal.show{display:flex;}",
      ".foodmart-demo-card{width:min(520px,100%);background:#fff;border-radius:20px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.25);}",
      ".foodmart-demo-card.is-product{width:min(920px,calc(100vw - 40px));max-height:calc(100vh - 40px);padding:0;overflow:auto;}",
      ".foodmart-demo-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;}",
      ".foodmart-demo-card.is-product .foodmart-demo-head{position:absolute;right:18px;top:18px;z-index:2;margin:0;}",
      ".foodmart-demo-card.is-product .foodmart-demo-head h3{display:none;}",
      ".foodmart-demo-head h3{margin:0;font-weight:800;}",
      ".foodmart-demo-close{border:0;background:#f1f1f1;border-radius:50%;width:36px;height:36px;font-size:20px;}",
      ".foodmart-account-grid{display:grid;gap:12px;}",
      ".foodmart-account-item{background:#f8f8f8;border-radius:14px;padding:14px;}",
      ".foodmart-product-modal{display:grid;grid-template-columns:.9fr 1.1fr;min-height:460px;}",
      ".foodmart-product-image{background:#f8f8f8;display:grid;place-items:center;padding:30px;}",
      ".foodmart-product-image img{width:100%;height:100%;max-height:380px;object-fit:contain;}",
      ".foodmart-product-detail{padding:34px 38px 30px;display:flex;flex-direction:column;justify-content:center;}",
      ".foodmart-product-kicker{color:#ffc43f;font-size:13px;font-weight:900;letter-spacing:2px;margin-bottom:10px;text-transform:uppercase;}",
      ".foodmart-product-detail h4{font-size:42px;font-weight:900;line-height:1.05;margin:0 0 12px;color:#222;}",
      ".foodmart-product-rating{color:#ffc43f;font-weight:800;margin-bottom:16px;}",
      ".foodmart-product-rating span{color:#9a9a9a;font-weight:600;margin-left:8px;}",
      ".foodmart-product-desc{color:#777;font-size:16px;line-height:1.6;margin:0 0 20px;}",
      ".foodmart-product-price{display:flex;align-items:flex-end;gap:12px;margin-bottom:20px;}",
      ".foodmart-product-price strong{color:#222;font-size:40px;font-weight:900;line-height:1;}",
      ".foodmart-product-price del{color:#aaa;font-size:20px;font-weight:800;}",
      ".foodmart-product-meta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px;}",
      ".foodmart-product-meta span{background:#f8f8f8;border-radius:999px;color:#555;font-weight:800;padding:8px 14px;}",
      ".foodmart-product-qty{display:flex;align-items:center;gap:14px;margin-bottom:24px;}",
      ".foodmart-product-qty button{width:38px;height:38px;border:0;border-radius:50%;background:#f1f1f1;color:#222;font-size:22px;font-weight:900;}",
      ".foodmart-product-qty strong{min-width:28px;text-align:center;font-size:22px;}",
      ".foodmart-product-add{border:0;border-radius:999px;background:#ffc43f;color:#222;font-size:18px;font-weight:900;padding:15px 24px;width:100%;}",
      ".brand-product-card{cursor:pointer;}",
      ".brand-product-card .brand-add-link{display:inline-flex;align-items:center;gap:6px;margin-top:10px;color:#222;font-weight:800;text-decoration:none;}",
      ".brand-product-card .brand-add-link:hover{color:#ffc43f;}",
      ".product-item{cursor:pointer;}",
      "@media (max-width: 767px){.foodmart-demo-modal{align-items:flex-start;padding:12px;}.foodmart-demo-card.is-product{width:100%;max-height:calc(100vh - 24px);border-radius:16px;}.foodmart-product-modal{grid-template-columns:1fr;min-height:auto;}.foodmart-product-image{min-height:170px;padding:18px;}.foodmart-product-image img{max-height:180px;}.foodmart-product-detail{padding:20px 18px 18px;}.foodmart-product-detail h4{font-size:25px;line-height:1.15;}.foodmart-product-rating{margin-bottom:10px;}.foodmart-product-desc{font-size:14px;line-height:1.5;margin-bottom:14px;}.foodmart-product-price{margin-bottom:14px;}.foodmart-product-price strong{font-size:28px;}.foodmart-product-price del{font-size:16px;}.foodmart-product-meta{gap:6px;margin-bottom:14px;}.foodmart-product-meta span{font-size:12px;padding:6px 10px;}.foodmart-product-qty{margin-bottom:16px;}.foodmart-product-add{padding:13px 18px;font-size:16px;}}",
      ".foodmart-toast{position:fixed;left:50%;bottom:26px;z-index:2100;transform:translate(-50%,18px);opacity:0;background:#222;color:#fff;border-radius:999px;padding:12px 18px;box-shadow:0 14px 40px rgba(0,0,0,.25);transition:.2s ease;}",
      ".foodmart-toast.show{opacity:1;transform:translate(-50%,0);}"
    ].join("");
    document.head.appendChild(style);
  }

  function toast(message) {
    var el = document.querySelector(".foodmart-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "foodmart-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.remove("show");
    }, 2200);
  }

  function ensureAccountModal() {
    var modal = document.querySelector(".foodmart-demo-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.className = "foodmart-demo-modal";
    modal.innerHTML = '<div class="foodmart-demo-card"><div class="foodmart-demo-head"><h3>示範帳戶</h3><button class="foodmart-demo-close" type="button" aria-label="關閉">&times;</button></div><div class="foodmart-demo-body"></div></div>';
    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.closest(".foodmart-demo-close")) {
        modal.classList.remove("show");
      }
    });
    document.body.appendChild(modal);
    return modal;
  }

  function showAccount() {
    var data = account();
    var lastOrder = read("foodmartDemoLastOrder", null);
    var orderCount = orders().length;
    var modal = ensureAccountModal();
    modal.querySelector(".foodmart-demo-card").classList.remove("is-product");
    modal.querySelector(".foodmart-demo-head h3").textContent = "示範帳戶";
    modal.querySelector(".foodmart-demo-body").innerHTML = [
      '<div class="foodmart-account-grid">',
      '<div class="foodmart-account-item"><strong>姓名</strong><br><span>' + data.name + '</span></div>',
      '<div class="foodmart-account-item"><strong>電子信箱</strong><br><span>' + data.email + '</span></div>',
      '<div class="foodmart-account-item"><strong>電話</strong><br><span>' + data.phone + '</span></div>',
      '<div class="foodmart-account-item"><strong>最近訂單</strong><br><span>' + (lastOrder ? lastOrder.id : "目前尚無示範訂單") + '</span></div>',
      '<div class="foodmart-account-item"><strong>訂單總數</strong><br><span>' + orderCount + '</span></div>',
      '</div><div class="d-flex gap-2 mt-3 flex-wrap"><a class="btn btn-primary" href="customer-dashboard.html">客戶後台</a><a class="btn btn-dark" href="staff-dashboard.html">員工後台</a></div>'
    ].join("");
    modal.classList.add("show");
  }

  function productCopyFromImage(src) {
    var file = String(src || "").split("/").pop();
    return {
      "thumb-avocado.webp": { title: "新鮮酪梨", desc: "果肉細緻綿密的酪梨，適合沙拉、吐司、果昔與輕食料理。" },
      "thumb-avocado.webp": { title: "新鮮酪梨", desc: "果肉細緻綿密的酪梨，適合沙拉、吐司、果昔與輕食料理。" },
      "thumb-bananas.webp": { title: "新鮮香蕉", desc: "香甜熟成的香蕉，適合早餐、點心、果昔或日常補充能量。" },
      "thumb-bananas.webp": { title: "新鮮香蕉", desc: "香甜熟成的香蕉，適合早餐、點心、果昔或日常補充能量。" },
      "thumb-biscuits.webp": { title: "奶油餅乾", desc: "酥脆香甜的奶油餅乾，適合下午茶、辦公室點心與家庭零食。" },
      "thumb-biscuits.webp": { title: "奶油餅乾", desc: "酥脆香甜的奶油餅乾，適合下午茶、辦公室點心與家庭零食。" },
      "thumb-cucumber.webp": { title: "小黃瓜", desc: "清脆爽口的小黃瓜，適合沙拉、涼拌、三明治與清爽配菜。" },
      "thumb-cucumber.webp": { title: "小黃瓜", desc: "清脆爽口的小黃瓜，適合沙拉、涼拌、三明治與清爽配菜。" },
      "thumb-milk.webp": { title: "鮮乳", desc: "口感溫潤的日常鮮乳，適合早餐、咖啡、麥片與烘焙使用。" },
      "thumb-milk.webp": { title: "鮮乳", desc: "口感溫潤的日常鮮乳，適合早餐、咖啡、麥片與烘焙使用。" },
      "thumb-orange-juice.webp": { title: "柳橙汁", desc: "清爽酸甜的柳橙汁，適合早餐、午茶或餐後搭配飲用。" },
      "thumb-orange-juice.webp": { title: "柳橙汁", desc: "清爽酸甜的柳橙汁，適合早餐、午茶或餐後搭配飲用。" },
      "thumb-raspberries.webp": { title: "覆盆莓", desc: "酸甜細緻的覆盆莓，可搭配優格、甜點、沙拉或水果盤。" },
      "thumb-raspberries.webp": { title: "覆盆莓", desc: "酸甜細緻的覆盆莓，可搭配優格、甜點、沙拉或水果盤。" },
      "thumb-tomatoes.webp": { title: "有機番茄", desc: "飽滿多汁的有機番茄，適合沙拉、燉煮、義大利麵與日常料理。" },
      "thumb-tomatoes.webp": { title: "有機番茄", desc: "飽滿多汁的有機番茄，適合沙拉、燉煮、義大利麵與日常料理。" },
      "thumb-tomatoketchup.webp": { title: "番茄醬", desc: "經典番茄醬，酸甜順口，適合薯條、漢堡、熱狗與家庭料理調味。" },
      "thumb-tomatoketchup.webp": { title: "番茄醬", desc: "經典番茄醬，酸甜順口，適合薯條、漢堡、熱狗與家庭料理調味。" },
      "thumb-honey.jpg": { title: "蜂蜜罐", desc: "香氣溫潤的蜂蜜，適合搭配吐司、茶飲、優格與日常甜味調整。" },
      "thumb-herb.jpg": { title: "花草茶包", desc: "清香乾燥花草茶包，適合午後沖泡、放鬆休息或搭配甜點。" },
      "thumb-junk.jpg": { title: "調理食品包", desc: "方便保存的調理食品包，適合快速備餐、露營或忙碌時簡單上桌。" },
      "thumb-tuna.jpg": { title: "鮪魚罐頭", desc: "方便保存的鮪魚罐頭，適合沙拉、三明治、義大利麵與快速料理。" },
      "product-thumb-11.jpg": { title: "蜂蜜罐", desc: "香氣溫潤的蜂蜜，適合搭配吐司、茶飲、優格與日常甜味調整。" },
      "product-thumb-12.jpg": { title: "花草茶包", desc: "清香乾燥花草茶包，適合午後沖泡、放鬆休息或搭配甜點。" },
      "product-thumb-13.jpg": { title: "鮪魚罐頭", desc: "方便保存的鮪魚罐頭，適合沙拉、三明治、義大利麵與快速料理。" },
      "product-thumb-14.jpg": { title: "調理食品包", desc: "方便保存的調理食品包，適合快速備餐、露營或忙碌時簡單上桌。" }
    }[file] || {};
  }

  function productFromCard(card) {
    var storedId = card.getAttribute("data-foodmart-product-id");
    if (storedId) {
      var storedProduct = products().find(function (item) { return item.id === storedId; });
      if (storedProduct) {
        return {
          id: storedProduct.id,
          title: storedProduct.title,
          price: Number(storedProduct.price || 0),
          img: storedProduct.img || "images/thumb-bananas.webp",
          unit: storedProduct.unit || "1 件",
          rating: storedProduct.rating || "4.5",
          desc: storedProduct.desc || storedProduct.description || "新鮮嚴選的日常商品，風味均衡、價格實惠。",
          category: storedProduct.category || "produce",
          qty: Math.max(1, Number(card.querySelector(".input-number") ? card.querySelector(".input-number").value : 1) || 1)
        };
      }
    }
    var priceText = card.querySelector(".price") ? card.querySelector(".price").textContent.trim() : (card.getAttribute("data-price") || "$8.99");
    var img = card.querySelector("img") ? card.querySelector("img").getAttribute("src") : "";
    var copy = productCopyFromImage(img);
    var titleEl = card.querySelector("h3") || card.querySelector("h5") || card.querySelector(".card-title");
    var title = copy.title || (titleEl ? titleEl.textContent.trim() : "FoodMart 商品");
    var qtyInput = card.querySelector(".input-number");
    var qty = Math.max(1, Number(qtyInput ? qtyInput.value : 1) || 1);
    return {
      id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + priceText.replace(/[^0-9]/g, "") + "-" + img.split("/").pop(),
      title: title,
      price: Number(priceText.replace(/[^0-9.]/g, "")) || 0,
      img: img,
      unit: card.querySelector(".qty") ? card.querySelector(".qty").textContent.trim() : "1 件",
      rating: card.querySelector(".rating") ? card.querySelector(".rating").textContent.replace(/\s+/g, " ").trim() : "4.5",
      desc: copy.desc || "新鮮嚴選的日常商品，風味均衡、價格實惠，可快速完成示範結帳。",
      category: cardCategory(card),
      stock: Number(card.getAttribute("data-stock") || 20),
      qty: qty
    };
  }

  function titleLabel(title) {
    return {
      "Sunstar Fresh Melon Juice": "FoodMart 精選商品",
      "FoodMart Product": "FoodMart 商品"
    }[title] || title || "FoodMart 商品";
  }

  function seedProductsFromPage() {
    if (products().length) return;
    var seen = {};
    var list = [];
    document.querySelectorAll("#nav-all .product-item").forEach(function (card, index) {
      var product = productFromCard(card);
      if (!product.title || seen[product.title + product.img]) return;
      seen[product.title + product.img] = true;
      product.sku = "FD-" + String(1001 + index);
      product.stock = Number(product.stock || 20);
      product.category = product.category || cardCategory(card);
      list.push(product);
    });
    if (list.length) saveProducts(list);
  }

  function productCardHtml(product) {
    return [
      '<div class="col" data-staff-product>',
      '<div class="product-item" data-foodmart-product-id="' + product.id + '" data-stock="' + Number(product.stock || 0) + '">',
      '<a href="#" class="btn-wishlist"><svg width="24" height="24"><use xlink:href="#heart"></use></svg></a>',
      '<figure><a href="index.html" title="商品名稱"><img src="' + (product.img || "images/thumb-bananas.webp") + '" class="tab-image"></a></figure>',
      '<h3>' + product.title + '</h3>',
      '<span class="qty">' + (product.unit || "1 件") + '</span><span class="rating"><svg width="24" height="24" class="text-primary"><use xlink:href="#star-solid"></use></svg> ' + (product.rating || "4.5") + '</span>',
      '<span class="price">' + money(product.price) + '</span>',
      '<p class="text-body-secondary small mb-2">庫存 ' + Number(product.stock || 0) + ' 件</p>',
      '<div class="d-flex align-items-center justify-content-between"><div class="input-group product-qty"><span class="input-group-btn"><button type="button" class="quantity-left-minus btn btn-danger btn-number" data-type="minus"><svg width="16" height="16"><use xlink:href="#minus"></use></svg></button></span><input type="text" class="form-control input-number" value="1"><span class="input-group-btn"><button type="button" class="quantity-right-plus btn btn-success btn-number" data-type="plus"><svg width="16" height="16"><use xlink:href="#plus"></use></svg></button></span></div><a href="#" class="nav-link">加入購物車 <iconify-icon icon="uil:shopping-cart"></iconify-icon></a></div>',
      '</div></div>'
    ].join("");
  }

  function renderStoredProducts() {
    var grid = document.querySelector("#nav-all .product-grid");
    if (!grid) return;
    grid.querySelectorAll("[data-staff-product]").forEach(function (node) { node.remove(); });
    var existing = {};
    grid.querySelectorAll(".product-item").forEach(function (card) {
      var product = productFromCard(card);
      existing[product.title + product.img] = true;
    });
    products().forEach(function (product) {
      if (existing[product.title + product.img]) return;
      grid.insertAdjacentHTML("beforeend", productCardHtml(product));
    });
  }

  function syncInventoryAfterCheckout(items) {
    var list = products();
    var changed = false;
    items.forEach(function (cartItem) {
      var product = list.find(function (item) { return item.id === cartItem.id || item.title === cartItem.title; });
      if (!product) return;
      product.stock = Math.max(0, Number(product.stock || 0) - Number(cartItem.qty || 0));
      changed = true;
    });
    if (changed) saveProducts(list);
  }

  function showProductDetail(product) {
    var modal = ensureAccountModal();
    var card = modal.querySelector(".foodmart-demo-card");
    card.classList.add("is-product");
    modal.querySelector(".foodmart-demo-head h3").textContent = product.title;
    modal.querySelector(".foodmart-demo-body").innerHTML = [
      '<div class="foodmart-product-modal">',
      '<div class="foodmart-product-image"><img src="' + product.img + '" alt="' + product.title + '"></div>',
      '<div class="foodmart-product-detail">',
      '<div class="foodmart-product-kicker">FoodMart 精選</div>',
      '<h4>' + product.title + '</h4>',
      '<div class="foodmart-product-rating">★★★★★ <span>' + product.rating + ' 顧客評分</span></div>',
      '<p class="foodmart-product-desc">' + product.desc + '</p>',
      '<div class="foodmart-product-price"><strong>' + money(product.price) + '</strong><del>' + money(product.price + 5) + '</del></div>',
      '<div class="foodmart-product-meta"><span>' + product.unit + '</span><span>新鮮庫存</span><span>前端示範</span></div>',
      '<div class="foodmart-product-qty"><button type="button" data-foodmart-product-dec>-</button><strong data-foodmart-product-qty>' + product.qty + '</strong><button type="button" data-foodmart-product-inc>+</button><span>件</span></div>',
      '<button class="foodmart-product-add" type="button" data-foodmart-product-add>加入購物車</button>',
      '</div>',
      '</div>'
    ].join("");
    modal._activeProduct = product;
    modal.classList.add("show");
  }

  function addToCart(product) {
    var items = cart();
    var inventoryProduct = products().find(function (item) { return item.id === product.id || item.title === product.title; });
    var existing = items.find(function (item) {
      return item.id === product.id;
    });
    if (inventoryProduct) {
      var requested = Number(product.qty || 1);
      var already = existing ? Number(existing.qty || 0) : 0;
      var available = Number(inventoryProduct.stock || 0);
      if (available <= 0) {
        toast(titleLabel(product.title) + " 目前售完。");
        return;
      }
      if (already + requested > available) {
        toast(titleLabel(product.title) + " 目前庫存剩 " + available + " 件。");
        return;
      }
    }
    if (existing) existing.qty += product.qty;
    else items.push(product);
    saveCart(items);
    toast(titleLabel(product.title) + " 已加入購物車。");
  }

  function changeCart(index, mode) {
    var items = cart();
    if (!items[index]) return;
    if (mode === "inc") items[index].qty += 1;
    if (mode === "dec") items[index].qty = Math.max(1, items[index].qty - 1);
    if (mode === "remove") items.splice(index, 1);
    saveCart(items);
  }

  function checkout() {
    var items = cart();
    if (!items.length) return;
    var total = items.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
    var data = account();
    var order = {
      id: "FM-" + Date.now().toString().slice(-6),
      customer: data.name || "示範顧客",
      email: data.email || "customer@foodmart.demo",
      phone: data.phone || "",
      status: "Processing",
      total: total,
      items: items,
      time: new Date().toISOString()
    };
    var list = orders();
    list.unshift(order);
    saveOrders(list);
    write("foodmartDemoLastOrder", order);
    syncInventoryAfterCheckout(items);
    saveCart([]);
    renderStoredProducts();
    toast("示範結帳完成： " + order.id);
  }

  function renderCart() {
    var items = cart();
    var count = items.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    var total = items.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);

    document.querySelectorAll(".foodmart-cart-link").forEach(function (link) {
      var badge = link.querySelector(".foodmart-cart-count");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "foodmart-cart-count";
        link.appendChild(badge);
      }
      badge.textContent = count;
      badge.style.display = count ? "block" : "none";
    });

    document.querySelectorAll(".cart-total").forEach(function (el) {
      el.textContent = money(total);
    });

    var offcanvas = document.querySelector("#offcanvasCart .offcanvas-body");
    if (!offcanvas) return;
    var rows = items.map(function (item, index) {
      return [
        '<div class="foodmart-cart-row">',
        '<img src="' + item.img + '" alt="">',
        '<div><h6>' + titleLabel(item.title) + '</h6><small>' + money(item.price) + " x " + item.qty + '</small></div>',
        '<strong>' + money(item.price * item.qty) + '</strong>',
        '<div class="foodmart-cart-controls">',
        '<button type="button" data-foodmart-dec="' + index + '">-</button>',
        '<span>' + item.qty + '</span>',
        '<button type="button" data-foodmart-inc="' + index + '">+</button>',
        '<button type="button" data-foodmart-remove="' + index + '">刪除</button>',
        '</div>',
        '</div>'
      ].join("");
    }).join("");

    offcanvas.innerHTML = [
      '<div class="order-md-last">',
      '<h4 class="d-flex justify-content-between align-items-center mb-3"><span class="text-primary">購物車</span><span class="badge bg-primary rounded-pill">' + count + '</span></h4>',
      rows || '<p class="text-body-secondary">購物車目前是空的。</p>',
      '<div class="foodmart-cart-total-row"><span>總計</span><strong>' + money(total) + '</strong></div>',
      '<button class="w-100 btn btn-primary btn-lg" type="button" data-foodmart-checkout ' + (items.length ? "" : "disabled") + '>前往結帳</button>',
      '</div>'
    ].join("");
  }

  function bindClicks() {
    document.addEventListener("click", function (event) {
      var productFilterLink = event.target.closest("[data-product-filter]");
      if (productFilterLink) {
        event.preventDefault();
        filterProductCards(productFilterLink.getAttribute("data-product-filter"));
        scrollToTarget(productFilterLink.getAttribute("href") || "#women");
        return;
      }

      var categoryItem = event.target.closest(".category-item");
      if (categoryItem) {
        event.preventDefault();
        filterProductCards(categoryItem.textContent);
        scrollToTarget("#women");
        return;
      }

      var viewCategories = event.target.closest('a[href="#category"], .section-header a.btn-link');
      if (viewCategories && viewCategories.textContent.toLowerCase().indexOf("分類") !== -1) {
        event.preventDefault();
        scrollToTarget("#category");
        return;
      }

      var menuLink = event.target.closest('.main-menu a[href^="#"]');
      if (menuLink && menuLink.getAttribute("href")) {
        var href = menuLink.getAttribute("href");
        if (document.querySelector(href)) {
          event.preventDefault();
          scrollToTarget(href);
          closeMobileMenu();
          return;
        }
      }

      var accountLink = event.target.closest(".foodmart-account-link");
      if (accountLink) {
        event.preventDefault();
        showAccount();
        return;
      }

      var addLink = event.target.closest(".product-item .nav-link");
      if (addLink && addLink.textContent.toLowerCase().indexOf("加入購物車") !== -1) {
        event.preventDefault();
        showProductDetail(productFromCard(addLink.closest(".product-item")));
        return;
      }

      var productLink = event.target.closest(".product-item figure a, .product-item h3");
      if (productLink) {
        event.preventDefault();
        showProductDetail(productFromCard(productLink.closest(".product-item")));
        return;
      }

      var productCard = event.target.closest(".product-item");
      if (productCard && !event.target.closest(".btn-wishlist, .product-qty, button, input")) {
        event.preventDefault();
        showProductDetail(productFromCard(productCard));
        return;
      }

      var brandCard = event.target.closest(".brand-product-card");
      if (brandCard) {
        event.preventDefault();
        showProductDetail(productFromCard(brandCard));
        return;
      }

      var inc = event.target.closest("[data-foodmart-inc]");
      if (inc) {
        event.preventDefault();
        changeCart(Number(inc.getAttribute("data-foodmart-inc")), "inc");
        return;
      }

      var dec = event.target.closest("[data-foodmart-dec]");
      if (dec) {
        event.preventDefault();
        changeCart(Number(dec.getAttribute("data-foodmart-dec")), "dec");
        return;
      }

      var remove = event.target.closest("[data-foodmart-remove]");
      if (remove) {
        event.preventDefault();
        changeCart(Number(remove.getAttribute("data-foodmart-remove")), "remove");
        return;
      }

      var checkoutButton = event.target.closest("[data-foodmart-checkout]");
      if (checkoutButton) {
        event.preventDefault();
        checkout();
        return;
      }

      var productInc = event.target.closest("[data-foodmart-product-inc]");
      if (productInc) {
        event.preventDefault();
        var qtyEl = ensureAccountModal().querySelector("[data-foodmart-product-qty]");
        if (qtyEl) qtyEl.textContent = Number(qtyEl.textContent || 1) + 1;
        return;
      }

      var productDec = event.target.closest("[data-foodmart-product-dec]");
      if (productDec) {
        event.preventDefault();
        var decQtyEl = ensureAccountModal().querySelector("[data-foodmart-product-qty]");
        if (decQtyEl) decQtyEl.textContent = Math.max(1, Number(decQtyEl.textContent || 1) - 1);
        return;
      }

      var productAdd = event.target.closest("[data-foodmart-product-add]");
      if (productAdd) {
        event.preventDefault();
        var modal = ensureAccountModal();
        var activeProduct = modal._activeProduct;
        var activeQty = modal.querySelector("[data-foodmart-product-qty]");
        if (activeProduct) {
          activeProduct.qty = Number(activeQty ? activeQty.textContent : 1) || 1;
          addToCart(activeProduct);
          modal.classList.remove("show");
        }
      }
    });

    document.querySelectorAll(".filter-categories, .search-bar select").forEach(function (select) {
      select.addEventListener("change", function () {
        var value = select.value.toLowerCase();
        if (value.indexOf("飲品") !== -1) {
          activateProductTab("果汁");
          scrollToTarget("#women");
          return;
        }
        if (value.indexOf("巧克力") !== -1) {
          scrollToTarget("#sale");
          return;
        }
        if (value.indexOf("雜貨") !== -1) {
          activateProductTab("水果與蔬菜");
          scrollToTarget("#women");
        }
      });
    });
    document.querySelectorAll("#nav-tab .nav-link").forEach(function (tab) {
      tab.addEventListener("click", function () {
        window.setTimeout(function () {
          resetProductCards(tab.textContent);
        }, 0);
      });
    });
  }

  function scrollToTarget(selector) {
    var target = document.querySelector(selector);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeMobileMenu() {
    if (!window.bootstrap) return;
    var menu = document.getElementById("offcanvasNavbar");
    if (!menu) return;
    var instance = bootstrap.Offcanvas.getInstance(menu);
    if (instance) instance.hide();
  }

  function enhanceBrandCards() {
    document.querySelectorAll(".brand-carousel .card").forEach(function (card, index) {
      var prices = ["$8.99", "$6.99", "$5.99", "$10.99"];
      card.classList.add("brand-product-card");
      if (!card.getAttribute("data-price")) card.setAttribute("data-price", prices[index % prices.length]);
      if (card.querySelector(".brand-add-link")) return;
      var body = card.querySelector(".card-body");
      if (!body) return;
      var link = document.createElement("a");
      link.href = "#";
      link.className = "brand-add-link";
      link.innerHTML = '加入購物車 <iconify-icon icon="uil:shopping-cart"></iconify-icon>';
      body.appendChild(link);
    });
  }

  function categoryFromText(label) {
    var text = String(label || "").toLowerCase();
    if (text.indexOf("全部") !== -1 || text.indexOf("all") !== -1) return "all";
    if (text.indexOf("麵包") !== -1 || text.indexOf("甜點") !== -1 || text.indexOf("烘焙") !== -1 || text.indexOf("bread") !== -1) return "bakery";
    if (text.indexOf("飲品") !== -1 || text.indexOf("瓶裝") !== -1 || text.indexOf("果汁") !== -1 || text.indexOf("drink") !== -1 || text.indexOf("juice") !== -1) return "drinks";
    if (text.indexOf("乳") !== -1 || text.indexOf("dairy") !== -1) return "dairy";
    if (text.indexOf("調味") !== -1 || text.indexOf("醬") !== -1 || text.indexOf("sauce") !== -1) return "sauce";
    if (text.indexOf("水果") !== -1 || text.indexOf("蔬菜") !== -1 || text.indexOf("蔬果") !== -1 || text.indexOf("fruit") !== -1 || text.indexOf("veges") !== -1) return "produce";
    return "all";
  }

  function cardCategory(card) {
    var img = card.querySelector("img");
    var src = img ? img.getAttribute("src") || "" : "";
    var title = card.querySelector("h3") ? card.querySelector("h3").textContent : "";
    var text = (src + " " + title).toLowerCase();
    if (text.indexOf("biscuit") !== -1 || text.indexOf("餅乾") !== -1) return "bakery";
    if (text.indexOf("honey") !== -1 || text.indexOf("蜂蜜") !== -1) return "bakery";
    if (text.indexOf("herb") !== -1 || text.indexOf("花草") !== -1 || text.indexOf("茶包") !== -1) return "drinks";
    if (text.indexOf("milk") !== -1 || text.indexOf("鮮乳") !== -1) return "dairy";
    if (text.indexOf("juice") !== -1 || text.indexOf("果汁") !== -1) return "drinks";
    if (text.indexOf("junk") !== -1 || text.indexOf("調理") !== -1) return "sauce";
    if (text.indexOf("ketchup") !== -1 || text.indexOf("醬") !== -1) return "sauce";
    if (text.indexOf("tuna") !== -1 || text.indexOf("鮪魚") !== -1 || text.indexOf("罐頭") !== -1) return "sauce";
    return "produce";
  }

  function filterProductCards(label) {
    var filter = categoryFromText(label);
    activateProductTab("全部");
    var title = document.querySelector("[data-all-products-title]");
    if (title) title.textContent = filter === "all" ? "所有商品" : "所有商品 - " + String(label || "").replace(/\s+/g, " ").trim();
    var visibleCount = 0;
    document.querySelectorAll("#nav-all .product-grid > .col").forEach(function (col) {
      var item = col.querySelector(".product-item");
      var matches = filter === "all" || (item && cardCategory(item) === filter);
      col.style.display = matches ? "" : "none";
      if (matches) visibleCount += 1;
    });
    var empty = document.querySelector("[data-product-filter-empty]");
    if (!empty) {
      empty = document.createElement("p");
      empty.className = "text-body-secondary mt-3";
      empty.setAttribute("data-product-filter-empty", "");
      var grid = document.querySelector("#nav-all .product-grid");
      if (grid && grid.parentNode) grid.parentNode.appendChild(empty);
    }
    empty.textContent = visibleCount ? "" : "此分類目前沒有商品。";
  }

  function resetProductCards(label) {
    var title = document.querySelector("[data-all-products-title]");
    if (title) title.textContent = "所有商品";
    document.querySelectorAll("#nav-all .product-grid > .col").forEach(function (col) {
      col.style.display = "";
    });
    var empty = document.querySelector("[data-product-filter-empty]");
    if (empty) empty.textContent = "";
  }

  function activateProductTab(label) {
    var text = String(label || "").toLowerCase();
    var target = "#nav-all";
    if (text.indexOf("fruit") !== -1 || text.indexOf("veges") !== -1 || text.indexOf("水果") !== -1 || text.indexOf("蔬菜") !== -1) target = "#nav-fruits";
    if (text.indexOf("drink") !== -1 || text.indexOf("juice") !== -1 || text.indexOf("飲品") !== -1 || text.indexOf("果汁") !== -1) target = "#nav-juices";
    var tab = document.querySelector('[data-bs-target="' + target + '"]');
    if (tab && window.bootstrap) {
      bootstrap.Tab.getOrCreateInstance(tab).show();
    } else if (tab) {
      document.querySelectorAll("#nav-tab .nav-link").forEach(function (item) {
        item.classList.toggle("active", item === tab);
      });
      document.querySelectorAll("#nav-tabContent .tab-pane").forEach(function (pane) {
        pane.classList.toggle("show", "#" + pane.id === target);
        pane.classList.toggle("active", "#" + pane.id === target);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureStyles();
    enhanceBrandCards();
    seedProductsFromPage();
    renderStoredProducts();
    bindClicks();
    renderCart();
  });
})();
