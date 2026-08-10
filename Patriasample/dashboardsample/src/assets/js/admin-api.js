import patriaProducts from '../../../../Patria/data/products.json';

const STATIC_BASE = '../../Patria';
const SAMPLE_PRODUCTS_KEY = 'patriaSampleProducts';
const SAMPLE_PRODUCTS_VERSION_KEY = 'patriaSampleProductsVersion';
const SAMPLE_PRODUCTS_VERSION = 'patria-products-json-v2-23';
const SAMPLE_ORDERS_KEY = 'patriaSampleOrders';
const SAMPLE_USERS_KEY = 'patriaSampleUsers';
const SAMPLE_ENGAGEMENT_KEY = 'patriaSampleEngagement';
const SAMPLE_COUPONS_KEY = 'patriaSampleCoupons';
let latestAdminOrders = [];
let latestInventoryProducts = [];
let inventoryPage = 1;
const INVENTORY_PAGE_SIZE = 10;

const SAMPLE_DEFAULT_COUPONS = [
  { code: 'WELCOME15', label: 'Welcome 15% off', type: 'percent', value: 15, min: 0, enabled: true },
  { code: 'PATRIA10', label: 'Patria 10% off', type: 'percent', value: 10, min: 0, enabled: true },
  { code: 'FAMILY5', label: '$5 family order discount', type: 'fixed', value: 5, min: 40, enabled: true }
];

const SAMPLE_DEFAULT_PRODUCTS = patriaProducts;

function sampleRead(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function sampleWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sampleSlug(text) {
  return String(text || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
}

function normalizeProduct(product, index = 0) {
  const priceValue = Number(product.priceValue || String(product.price || '').replace(/[^0-9.]/g, '') || 0);
  return {
    ...product,
    id: product.id || sampleSlug(product.title || 'product-' + (index + 1)),
    title: product.title || 'Untitled product',
    cat: product.cat || product.category || 'NOODLES',
    day: product.day || '5',
    price: product.price || money(priceValue),
    priceValue,
    quantity: Number.isFinite(Number(product.quantity)) ? Number(product.quantity) : 10,
    img: product.img || product.image || 'img/menu/1.webp',
    desc: product.desc || product.description || ''
  };
}

function sampleProducts() {
  const seeded = SAMPLE_DEFAULT_PRODUCTS.map(product => normalizeProduct({ ...product, source: product.source || 'static' }));
  const stored = sampleRead(SAMPLE_PRODUCTS_KEY, null);
  const storedVersion = localStorage.getItem(SAMPLE_PRODUCTS_VERSION_KEY);
  if (Array.isArray(stored) && stored.length) {
    const normalizedStored = stored.map(normalizeProduct);
    if (storedVersion !== SAMPLE_PRODUCTS_VERSION) {
      const seededIds = new Set(seeded.map(product => product.id));
      const adminProducts = normalizedStored.filter(product => product.source === 'admin' && !seededIds.has(product.id));
      const synced = [...seeded, ...adminProducts];
      sampleWrite(SAMPLE_PRODUCTS_KEY, synced);
      localStorage.setItem(SAMPLE_PRODUCTS_VERSION_KEY, SAMPLE_PRODUCTS_VERSION);
      return synced;
    }
    return normalizedStored;
  }
  sampleWrite(SAMPLE_PRODUCTS_KEY, seeded);
  localStorage.setItem(SAMPLE_PRODUCTS_VERSION_KEY, SAMPLE_PRODUCTS_VERSION);
  return seeded;
}

function saveSampleProducts(products) {
  const normalized = products.map(normalizeProduct);
  sampleWrite(SAMPLE_PRODUCTS_KEY, normalized);
  localStorage.setItem(SAMPLE_PRODUCTS_VERSION_KEY, SAMPLE_PRODUCTS_VERSION);
  return normalized;
}

function sampleOrders() {
  return sampleRead(SAMPLE_ORDERS_KEY, []);
}

function saveSampleOrders(orders) {
  sampleWrite(SAMPLE_ORDERS_KEY, orders);
}

function sampleUsers() {
  return sampleRead(SAMPLE_USERS_KEY, []);
}

function sampleEngagement() {
  return sampleRead(SAMPLE_ENGAGEMENT_KEY, { reservations: [], messages: [], subscribers: [], searches: [] });
}

function normalizeCoupon(coupon) {
  const type = coupon && coupon.type === 'fixed' ? 'fixed' : 'percent';
  let value = Math.max(0, Number(coupon && coupon.value) || 0);
  if (type === 'percent') value = Math.min(100, value);
  return {
    code: String(coupon && coupon.code || '').trim().toUpperCase(),
    label: String(coupon && coupon.label || '').trim(),
    type,
    value,
    min: Math.max(0, Number(coupon && coupon.min) || 0),
    enabled: coupon && coupon.enabled === false ? false : true,
    updatedAt: coupon && coupon.updatedAt ? coupon.updatedAt : new Date().toISOString()
  };
}

function sampleCoupons() {
  const stored = sampleRead(SAMPLE_COUPONS_KEY, null);
  if (Array.isArray(stored) && stored.length) return stored.map(normalizeCoupon);
  const seeded = SAMPLE_DEFAULT_COUPONS.map(normalizeCoupon);
  sampleWrite(SAMPLE_COUPONS_KEY, seeded);
  return seeded;
}

function saveSampleCoupons(coupons) {
  const normalized = coupons.map(normalizeCoupon).filter(coupon => coupon.code);
  sampleWrite(SAMPLE_COUPONS_KEY, normalized);
  return normalized;
}

function sampleCustomers() {
  const orders = sampleOrders();
  return sampleUsers().map(user => ({
    ...user,
    orderCount: orders.filter(order => order.userId === user.id).length
  }));
}

function sampleSummary() {
  const orders = sampleOrders();
  const users = sampleCustomers();
  const completed = orders.filter(order => ['completed', 'picked_up'].includes(String(order.status || '').toLowerCase()));
  const pending = orders.filter(order => !['completed', 'picked_up', 'cancelled'].includes(String(order.status || '').toLowerCase()));
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  return {
    totalSales,
    completedSales: completed.reduce((sum, order) => sum + Number(order.total || 0), 0),
    pendingSales: pending.reduce((sum, order) => sum + Number(order.total || 0), 0),
    itemCount: orders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0), 0),
    orderCount: orders.length,
    completedOrderCount: completed.length,
    customerCount: users.length,
    customersWithOrders: users.filter(user => user.orderCount > 0).length,
    customersWithAddresses: users.filter(user => user.address && user.address.address).length
  };
}

function sampleNotifications() {
  const orderNotes = sampleOrders().slice(-5).reverse().map(order => ({
    type: 'order',
    title: 'New order #' + order.id,
    message: (order.customer && order.customer.name ? order.customer.name : 'Guest customer') + ' placed an order for ' + money(order.total) + '.',
    time: order.createdAt
  }));
  const userNotes = sampleUsers().slice(-3).reverse().map(user => ({
    type: 'user',
    title: 'Customer account',
    message: (user.name || 'Customer') + ' updated account data.',
    time: user.updatedAt || user.createdAt || new Date().toISOString()
  }));
  return [...orderNotes, ...userNotes].slice(0, 6);
}

function sampleBody(options) {
  if (!options || !options.body) return {};
  if (typeof options.body !== 'string') return options.body;
  try {
    return JSON.parse(options.body);
  } catch (error) {
    return {};
  }
}

async function api(path, options = {}) {
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'API request failed.');
  return data;
}

function money(value) {
  return '$' + Number(value || 0).toFixed(2);
}

function productImage(src) {
  if (!src) return './assets/images/product-1.webp';
  if (/^https?:\/\//.test(src)) return src;
  const clean = String(src).replace(/^\.\//, '').replace(/^\//, '');
  if (clean.startsWith('assets/')) return './' + clean;
  if (clean.startsWith('img/')) return STATIC_BASE.replace(/\/$/, '') + '/' + clean;
  return clean;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function formatOrderDate(value) {
  return value ? new Date(value).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Just now';
}

function inventoryQuantity(product, index) {
  return Number.isFinite(Number(product.quantity)) ? Number(product.quantity) : (index < 3 ? 80 + index * 15 : 40 + index * 6);
}

async function markOrderCompleted(orderId) {
  const data = await api('/api/admin/orders/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status: 'completed' })
  });
  latestAdminOrders = latestAdminOrders.map(order => order.id === orderId ? data.order : order);
  renderRecentOrders(latestAdminOrders);
  renderOrderDetailCard(data.order);
}

async function markOrderPickedUp(orderId) {
  const data = await api('/api/admin/orders/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, status: 'picked_up' })
  });
  latestAdminOrders = latestAdminOrders.map(order => order.id === orderId ? data.order : order);
  renderRecentOrders(latestAdminOrders);
  renderOrderDetailCard(data.order);
}

function renderTopProducts(products, orders = []) {
  const list = document.querySelector('[data-admin-list="top-products"]');
  if (!list) return;
  const sold = productSalesFromOrders(orders);
  const rows = sold.length ? sold.slice(0, 5) : products.slice(0, 5).map(product => ({ ...product, qty: 0, revenue: 0 }));
  if (!rows.length) {
    list.innerHTML = '<li class="list-group-item text-secondary">No product data yet.</li>';
    return;
  }
  list.innerHTML = rows.map((product, index) => {
    return '<li class="list-group-item d-flex align-items-center gap-3">'
      + '<img src="' + productImage(product.img) + '" class="rounded object-fit-cover" width="48" height="48" alt="' + escapeHtml(product.title || 'Product') + '">'
      + '<div class="flex-grow-1">'
      + '<p class="mb-1">' + escapeHtml(product.title || 'Untitled product') + '</p>'
      + '<div class="d-flex align-items-center gap-2 text-muted">'
      + '<small class="fw-semibold">' + Number(product.qty || 0) + ' sold</small><small>•</small><small>' + money(product.revenue || 0) + '</small>'
      + '</div></div>'
      + '<span class="badge bg-primary-subtle text-primary border border-primary">#' + (index + 1) + '</span>'
      + '</li>';
  }).join('');
}

function renderLowStockProducts(products) {
  const list = document.querySelector('[data-admin-list="low-stock-products"]');
  if (!list) return;
  const rows = products
    .map((product, index) => ({ product, stock: inventoryQuantity(product, index) }))
    .filter(item => item.stock > 0 && item.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);
  if (!rows.length) {
    list.innerHTML = '<li class="list-group-item text-secondary">No low stock products.</li>';
    return;
  }
  list.innerHTML = rows.map(({ product, stock }) => {
    return '<li class="list-group-item d-flex align-items-center gap-3">'
      + '<img src="' + productImage(product.img) + '" class="rounded object-fit-cover" width="48" height="48" alt="' + escapeHtml(product.title || 'Product') + '">'
      + '<div class="flex-grow-1">'
      + '<p class="mb-1">' + escapeHtml(product.title || 'Untitled product') + '</p>'
      + '<small>ID: #' + escapeHtml(String(product.id || '').toUpperCase().slice(0, 8)) + '</small>'
      + '</div>'
      + '<div class="d-flex flex-column gap-0 align-items-center">'
      + '<span class="fw-semibold text-primary">' + String(stock).padStart(2, '0') + '</span>'
      + '<small class="text-muted">In Stock</small>'
      + '</div>'
      + '</li>';
  }).join('');
}

function renderOrderDetailCard(order) {
  const existing = document.querySelector('[data-admin-order-modal]');
  if (existing) existing.remove();

  const customer = order.customer || {};
  const items = order.items || [];
  const qty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const status = String(order.status || '').toLowerCase();
  const isCompleted = status === 'completed' || status === 'picked_up';
  const isPickedUp = status === 'picked_up';
  const itemRows = items.map(item => {
    const lineTotal = Number(item.priceValue || 0) * Number(item.qty || 0);
    return '<div class="admin-order-item">'
      + '<img src="' + productImage(item.img) + '" alt="' + escapeHtml(item.title || 'Item') + '">'
      + '<div><strong>' + escapeHtml(item.title || 'Untitled item') + '</strong><span>' + escapeHtml(item.cat || 'Menu') + ' • ' + escapeHtml(item.price || money(item.priceValue)) + ' x ' + Number(item.qty || 0) + '</span></div>'
      + '<b>' + money(lineTotal) + '</b>'
      + '</div>';
  }).join('');

  const modal = document.createElement('div');
  modal.className = 'admin-order-modal';
  modal.setAttribute('data-admin-order-modal', '');
  modal.innerHTML = '<div class="admin-order-card">'
    + '<button type="button" class="admin-order-close" aria-label="Close order detail">&times;</button>'
    + '<div class="admin-order-head"><span>Order Detail</span><strong>#' + escapeHtml(order.id) + '</strong></div>'
    + '<div class="admin-order-meta">'
    + '<div><small>Customer</small><strong>' + escapeHtml(customer.name || 'Guest customer') + '</strong><span>' + escapeHtml(customer.email || '') + '</span></div>'
    + '<div><small>Status</small><strong>' + escapeHtml(order.status || 'created') + '</strong><span>' + formatOrderDate(order.createdAt) + '</span></div>'
    + '<div><small>Items</small><strong>' + qty + '</strong><span>Total quantity</span></div>'
    + '<div><small>Pickup Date</small><strong>' + escapeHtml(order.fulfillmentDate || '-') + '</strong><span>' + Number(order.leadDays || 0) + ' days notice</span></div>'
    + '</div>'
    + '<div class="admin-order-items">' + itemRows + '</div>'
    + '<div class="admin-order-total"><span>Total</span><strong>' + money(order.total) + '</strong></div>'
    + '<button type="button" class="btn btn-primary w-100 admin-order-complete" data-order-complete="' + escapeHtml(order.id) + '"' + (isCompleted ? ' disabled' : '') + '>'
    + (isCompleted ? '已完成' : '標記為已完成')
    + '</button>'
    + '<button type="button" class="btn btn-outline-primary w-100 mt-2 admin-order-picked-up" data-order-picked-up="' + escapeHtml(order.id) + '"' + (isPickedUp ? ' disabled' : '') + '>'
    + (isPickedUp ? '已取貨' : '標記為已取貨')
    + '</button>'
    + '</div>';

  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.closest('.admin-order-close')) modal.remove();
  });
  const completeButton = modal.querySelector('[data-order-complete]');
  if (completeButton) {
    completeButton.addEventListener('click', async () => {
      completeButton.disabled = true;
      completeButton.textContent = '更新中...';
      try {
        await markOrderCompleted(order.id);
      } catch (error) {
        console.error(error);
        completeButton.disabled = false;
        completeButton.textContent = '標記為已完成';
      }
    });
  }
  const pickedUpButton = modal.querySelector('[data-order-picked-up]');
  if (pickedUpButton) {
    pickedUpButton.addEventListener('click', async () => {
      pickedUpButton.disabled = true;
      pickedUpButton.textContent = '更新中...';
      try {
        await markOrderPickedUp(order.id);
      } catch (error) {
        console.error(error);
        pickedUpButton.disabled = false;
        pickedUpButton.textContent = '標記為已取貨';
      }
    });
  }
  document.body.appendChild(modal);
}

function renderRecentOrders(orders) {
  const list = document.querySelector('[data-admin-list="recent-orders"]');
  if (!list) return;
  const rows = orders.filter(order => String(order.status || '').toLowerCase() !== 'picked_up').slice(-5).reverse();
  if (!rows.length) {
    list.innerHTML = '<li class="list-group-item text-secondary">No orders yet.</li>';
    return;
  }
  list.innerHTML = rows.map((order, index) => {
    const first = order.items && order.items[0] ? order.items[0] : {};
    const qty = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const customer = order.customer && order.customer.name ? order.customer.name : 'Guest customer';
    const date = formatOrderDate(order.createdAt);
    return '<li class="list-group-item d-flex align-items-center gap-3 admin-order-row" role="button" tabindex="0" data-order-index="' + index + '">'
      + '<img src="' + productImage(first.img) + '" class="rounded object-fit-cover" width="48" height="48" alt="' + escapeHtml(first.title || 'Order') + '">'
      + '<div class="flex-grow-1">'
      + '<p class="mb-1">Order #' + escapeHtml(order.id) + '</p>'
      + '<div class="d-flex align-items-center gap-2 text-muted flex-wrap">'
      + '<small class="fw-semibold">' + escapeHtml(customer) + '</small><small>•</small><small>' + qty + ' items</small><small>•</small><small>' + money(order.total) + '</small><small>•</small><small>' + date + '</small>'
      + '</div></div>'
      + '<span class="badge bg-success-subtle text-success">' + escapeHtml(order.status || 'created') + '</span>'
      + '</li>';
  }).join('');

  list.querySelectorAll('[data-order-index]').forEach(row => {
    const open = () => renderOrderDetailCard(rows[Number(row.dataset.orderIndex)]);
    row.addEventListener('click', open);
    row.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function renderAdminNotifications(notifications) {
  const list = document.querySelector('[data-admin-notifications]');
  const count = document.querySelector('[data-admin-notification-count]');
  if (count) {
    count.childNodes[0].nodeValue = String((notifications || []).length) + ' ';
  }
  if (!list) return;
  const rows = (notifications || []).slice(0, 5);
  if (!rows.length) {
    list.innerHTML = '<li class="p-3 text-secondary small">No customer activity yet.</li>';
    return;
  }
  list.innerHTML = rows.map(item => {
    const icon = item.type === 'user' ? 'ti-user-check' : 'ti-receipt';
    return '<li class="p-3 border-bottom">'
      + '<div class="d-flex gap-3">'
      + '<span class="avatar avatar-sm rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center"><i class="ti ' + icon + '"></i></span>'
      + '<div class="flex-grow-1 small">'
      + '<p class="mb-0">' + escapeHtml(item.title || 'Customer activity') + '</p>'
      + '<p class="mb-1">' + escapeHtml(item.message || '') + '</p>'
      + '<div class="text-secondary">' + formatOrderDate(item.time) + '</div>'
      + '</div>'
      + '</div>'
      + '</li>';
  }).join('') + '<li class="px-4 py-3 text-center"><a href="index.html#recent-orders" class="text-primary">View all notifications</a></li>';
}

function renderAdminSummary(summary) {
  if (!summary) return;
  setText('[data-admin-summary="completed-sales"]', money(summary.completedSales));
  setText('[data-admin-summary="pending-sales"]', money(summary.pendingSales));
  setText('[data-admin-summary="addresses"]', String(summary.customersWithAddresses || 0));
  setText('[data-admin-summary="first-time"]', String(Math.max(0, Number(summary.customerCount || 0) - Number(summary.customersWithOrders || 0))));
  setText('[data-admin-summary="returning"]', String(summary.customersWithOrders || 0));
  setText('[data-admin-summary="completed-orders"]', String(summary.completedOrderCount || 0));
  setText('[data-admin-summary="customers"]', String(summary.customerCount || 0));
  setText('[data-admin-summary="orders"]', String(summary.orderCount || 0));
}

function productSalesFromOrders(orders) {
  const sales = {};
  (orders || []).forEach(order => {
    (order.items || []).forEach(item => {
      const id = item.id || item.title;
      if (!id) return;
      sales[id] ||= { ...item, qty: 0, revenue: 0 };
      sales[id].qty += Number(item.qty || 0);
      sales[id].revenue += Number(item.qty || 0) * Number(item.priceValue || 0);
    });
  });
  return Object.values(sales).sort((a, b) => b.qty - a.qty);
}

function renderReportTopProducts(orders, products) {
  const list = document.querySelector('[data-report-list="top-products"]');
  if (!list) return;
  const sold = productSalesFromOrders(orders);
  const rows = sold.length ? sold.slice(0, 5) : (products || []).slice(0, 5).map(product => ({ ...product, qty: 0, revenue: 0 }));
  if (!rows.length) {
    list.innerHTML = '<div class="list-group-item p-3 text-secondary">No product data yet.</div>';
    return;
  }
  list.innerHTML = rows.map(product => {
    return '<div class="list-group-item p-3 d-flex align-items-center">'
      + '<div class="me-3"><img src="' + productImage(product.img) + '" alt="' + escapeHtml(product.title || 'Product') + '" class="rounded object-fit-cover" style="width:48px; height:48px;"></div>'
      + '<div class="flex-grow-1"><div class="d-flex justify-content-between align-items-center gap-3">'
      + '<div><h6 class="mb-0">' + escapeHtml(product.title || 'Untitled product') + '</h6><small class="text-secondary">' + Number(product.qty || 0) + ' units sold</small></div>'
      + '<div class="text-end"><strong>' + money(product.revenue || 0) + '</strong></div>'
      + '</div></div>'
      + '</div>';
  }).join('');
}

function renderReportOrders(orders) {
  const tbody = document.querySelector('[data-report-table="orders"]');
  if (!tbody) return;
  const rows = (orders || []).slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-secondary">No customer orders yet.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(order => {
    const qty = (order.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const customer = order.customer || {};
    const status = String(order.status || 'created');
    return '<tr>'
      + '<td>#' + escapeHtml(order.id) + '</td>'
      + '<td><strong>' + escapeHtml(customer.name || 'Guest customer') + '</strong><br><small class="text-secondary">' + escapeHtml(customer.email || '') + '</small></td>'
      + '<td>' + qty + '</td>'
      + '<td>' + money(order.total) + '</td>'
      + '<td><span class="badge ' + (status.toLowerCase() === 'completed' ? 'bg-success-subtle text-success' : 'bg-primary-subtle text-primary') + '">' + escapeHtml(status) + '</span></td>'
      + '<td>' + formatOrderDate(order.createdAt) + '</td>'
      + '</tr>';
  }).join('');
}

function renderReportAddresses(customers) {
  const tbody = document.querySelector('[data-report-table="addresses"]');
  if (!tbody) return;
  const rows = (customers || []).filter(customer => customer.address && customer.address.address);
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-secondary">No saved addresses yet.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(customer => {
    const address = customer.address || {};
    const parts = [address.address, address.city, address.postal].filter(Boolean).join(', ');
    return '<tr>'
      + '<td>' + escapeHtml(customer.name || 'Customer') + '</td>'
      + '<td>' + escapeHtml(customer.email || '-') + '</td>'
      + '<td>' + escapeHtml(customer.phone || '-') + '</td>'
      + '<td>' + escapeHtml(parts || '-') + '</td>'
      + '<td>' + Number(customer.orderCount || 0) + '</td>'
      + '</tr>';
  }).join('');
}

function renderEngagementTables(data) {
  const reservations = document.querySelector('[data-engagement-table="reservations"]');
  if (reservations) {
    const rows = data.reservations || [];
    reservations.innerHTML = rows.length ? rows.map(item => '<tr>'
      + '<td>' + escapeHtml(item.name || '-') + '</td>'
      + '<td>' + escapeHtml(item.phone || '-') + '</td>'
      + '<td>' + escapeHtml(item.email || '-') + '</td>'
      + '<td>' + escapeHtml(item.guests || '-') + '</td>'
      + '<td>' + escapeHtml(item.date || '-') + '</td>'
      + '<td>' + escapeHtml(item.time || '-') + '</td>'
      + '<td>' + escapeHtml(item.requests || '-') + '</td>'
      + '</tr>').join('') : '<tr><td colspan="7" class="text-secondary">No reservations yet.</td></tr>';
  }

  const messages = document.querySelector('[data-engagement-table="messages"]');
  if (messages) {
    const rows = data.messages || [];
    messages.innerHTML = rows.length ? rows.map(item => '<tr>'
      + '<td>' + escapeHtml(item.name || '-') + '</td>'
      + '<td>' + escapeHtml(item.email || '-') + '</td>'
      + '<td>' + escapeHtml(item.phone || '-') + '</td>'
      + '<td>' + escapeHtml(item.subject || '-') + '</td>'
      + '<td>' + escapeHtml(item.message || '-') + '</td>'
      + '<td>' + formatOrderDate(item.createdAt) + '</td>'
      + '</tr>').join('') : '<tr><td colspan="6" class="text-secondary">No messages yet.</td></tr>';
  }

  const subscribers = document.querySelector('[data-engagement-table="subscribers"]');
  if (subscribers) {
    const rows = data.subscribers || [];
    subscribers.innerHTML = rows.length ? rows.map(item => '<tr>'
      + '<td>' + escapeHtml(item.email || '-') + '</td>'
      + '<td>' + escapeHtml(item.status || 'active') + '</td>'
      + '<td>' + formatOrderDate(item.createdAt || item.updatedAt) + '</td>'
      + '</tr>').join('') : '<tr><td colspan="3" class="text-secondary">No subscribers yet.</td></tr>';
  }

  const searches = document.querySelector('[data-engagement-table="searches"]');
  if (searches) {
    const rows = data.searches || [];
    searches.innerHTML = rows.length ? rows.map(item => '<tr>'
      + '<td>' + escapeHtml(item.query || '-') + '</td>'
      + '<td>' + Number(item.resultCount || 0) + '</td>'
      + '<td>' + formatOrderDate(item.createdAt) + '</td>'
      + '</tr>').join('') : '<tr><td colspan="3" class="text-secondary">No searches yet.</td></tr>';
  }
}

function renderInventory(products) {
  const tbody = document.querySelector('[data-admin-table="inventory"]');
  if (!tbody) return;
  latestInventoryProducts = products;
  const pageCount = Math.max(1, Math.ceil(products.length / INVENTORY_PAGE_SIZE));
  inventoryPage = Math.min(Math.max(1, inventoryPage), pageCount);
  const start = (inventoryPage - 1) * INVENTORY_PAGE_SIZE;
  const pageProducts = products.slice(start, start + INVENTORY_PAGE_SIZE);
  tbody.innerHTML = pageProducts.map((product, pageIndex) => {
    const index = start + pageIndex;
    return '<tr class="align-middle">'
      + '<td><a href="#" class="d-inline-flex align-items-center text-reset text-decoration-none">'
      + '<img src="' + productImage(product.img) + '" alt="' + escapeHtml(product.title) + '" class="avatar avatar-md rounded object-fit-cover" />'
      + '<span class="ms-3">' + escapeHtml(product.title) + '</span></a></td>'
      + '<td>PRD' + String(index + 1).padStart(3, '0') + '</td>'
      + '<td>' + escapeHtml(product.cat || 'Menu') + '</td>'
      + '<td>' + escapeHtml(product.day || '5') + '</td>'
      + '<td>' + escapeHtml(product.price) + '</td>'
      + '<td>dish</td>'
      + '<td>' + inventoryQuantity(product, index) + '</td>'
      + '<td><div class="d-inline-flex align-items-center gap-2">'
      + '<button type="button" class="btn btn-sm btn-light admin-product-edit" data-product-index="' + index + '" aria-label="Edit ' + escapeHtml(product.title) + '"><i class="ti ti-edit"></i></button>'
      + '<button type="button" class="btn btn-sm btn-light link-danger admin-product-delete" data-product-delete-index="' + index + '" aria-label="Delete ' + escapeHtml(product.title) + '"><i class="ti ti-trash"></i></button>'
      + '</div></td>'
      + '</tr>';
  }).join('');
  renderInventoryPagination(products.length, pageCount);

  tbody.querySelectorAll('[data-product-index]').forEach(button => {
    button.addEventListener('click', () => openProductEditor(latestInventoryProducts[Number(button.dataset.productIndex)], Number(button.dataset.productIndex)));
  });
  tbody.querySelectorAll('[data-product-delete-index]').forEach(button => {
    button.addEventListener('click', () => deleteInventoryProduct(latestInventoryProducts[Number(button.dataset.productDeleteIndex)]));
  });
}

function renderInventoryPagination(total, pageCount) {
  const tbody = document.querySelector('[data-admin-table="inventory"]');
  const table = tbody && tbody.closest('table');
  const footerLabel = table && table.querySelector('tfoot td:first-child');
  const pager = table && table.querySelector('tfoot .pagination');
  if (!pager) return;
  const start = total ? (inventoryPage - 1) * INVENTORY_PAGE_SIZE + 1 : 0;
  const end = Math.min(inventoryPage * INVENTORY_PAGE_SIZE, total);
  if (footerLabel) footerLabel.textContent = 'Showing ' + start + '-' + end + ' of ' + total;
  const pageLinks = Array.from({ length: pageCount }, (_, index) => {
    const page = index + 1;
    return '<li class="page-item' + (page === inventoryPage ? ' active' : '') + '">'
      + '<a class="page-link" href="#" data-inventory-page="' + page + '">' + page + '</a>'
      + '</li>';
  }).join('');
  pager.innerHTML = '<li class="page-item' + (inventoryPage <= 1 ? ' disabled' : '') + '">'
    + '<a class="page-link" href="#" data-inventory-page="prev" tabindex="-1">Previous</a>'
    + '</li>'
    + pageLinks
    + '<li class="page-item' + (inventoryPage >= pageCount ? ' disabled' : '') + '">'
    + '<a class="page-link" href="#" data-inventory-page="next">Next</a>'
    + '</li>';
  pager.querySelectorAll('[data-inventory-page]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      if (button.closest('.page-item').classList.contains('disabled')) return;
      if (button.dataset.inventoryPage === 'next') inventoryPage += 1;
      else if (button.dataset.inventoryPage === 'prev') inventoryPage -= 1;
      else inventoryPage = Number(button.dataset.inventoryPage);
      renderInventory(latestInventoryProducts);
    });
  });
}

function csvCell(value) {
  const text = String(value ?? '');
  return '"' + text.replace(/"/g, '""') + '"';
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function productFromCsvRow(headers, row) {
  const data = {};
  headers.forEach((header, index) => {
    data[String(header || '').trim().toLowerCase()] = row[index] || '';
  });
  return {
    id: data.id || '',
    title: data.title || data.name || '',
    cat: data.category || data.cat || 'NOODLES',
    day: data.day || '5',
    priceValue: Number(String(data.price || data.pricevalue || '').replace(/[^0-9.]/g, '')),
    quantity: Number(data.quantity || data.qty || 0),
    img: data.image || data.img || '',
    desc: data.description || data.desc || ''
  };
}

function exportInventoryCsv() {
  const headers = ['id', 'title', 'category', 'day', 'price', 'quantity', 'image', 'description'];
  const rows = latestInventoryProducts.map((product, index) => [
    product.id || '',
    product.title || '',
    product.cat || '',
    product.day || '5',
    Number(product.priceValue || String(product.price || '').replace(/[^0-9.]/g, '') || 0).toFixed(2),
    inventoryQuantity(product, index),
    product.img || '',
    product.desc || ''
  ]);
  const csv = '\ufeff' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'patria-inventory.csv';
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

async function importInventoryCsv(file) {
  const status = document.querySelector('[data-inventory-excel-status]');
  if (status) status.textContent = 'Importing products...';
  const text = await file.text();
  const rows = parseCsv(text).filter(row => row.some(cell => String(cell).trim()));
  if (rows.length < 2) throw new Error('CSV needs a header row and at least one product row.');
  const headers = rows[0];
  const products = rows.slice(1).map(row => productFromCsvRow(headers, row)).filter(product => product.title);
  if (!products.length) throw new Error('No valid products found in the CSV file.');

  let created = 0;
  let updated = 0;
  for (const product of products) {
    const existing = latestInventoryProducts.find(item => item.id === product.id || item.title === product.title);
    if (existing) {
      await api('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, id: existing.id })
      });
      updated += 1;
    } else {
      await api('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      created += 1;
    }
  }
  const data = await api('/api/products');
  inventoryPage = 1;
  renderInventory(data.products || []);
  if (status) status.textContent = 'Imported ' + created + ' new and updated ' + updated + ' products.';
}

function bindInventoryExcelTools() {
  const importButton = document.querySelector('[data-inventory-import]');
  const exportButton = document.querySelector('[data-inventory-export]');
  const fileInput = document.querySelector('[data-inventory-file]');
  const status = document.querySelector('[data-inventory-excel-status]');
  if (exportButton && exportButton.getAttribute('data-bound') !== 'true') {
    exportButton.setAttribute('data-bound', 'true');
    exportButton.addEventListener('click', exportInventoryCsv);
  }
  if (importButton && fileInput && importButton.getAttribute('data-bound') !== 'true') {
    importButton.setAttribute('data-bound', 'true');
    importButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      try {
        await importInventoryCsv(file);
      } catch (error) {
        if (status) status.textContent = error.message;
      } finally {
        fileInput.value = '';
      }
    });
  }
}

async function deleteInventoryProduct(product) {
  if (!product) return;
  if (!window.confirm('Delete ' + product.title + ' from inventory?')) return;
  await api('/api/admin/products', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: product.id })
  });
  latestInventoryProducts = latestInventoryProducts.filter(item => item.id !== product.id);
  renderInventory(latestInventoryProducts);
}

function openProductEditor(product, index) {
  if (!product) return;
  const existing = document.querySelector('[data-admin-product-modal]');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.className = 'admin-product-modal';
  modal.setAttribute('data-admin-product-modal', '');
  modal.innerHTML = '<form class="admin-product-card">'
    + '<button type="button" class="admin-order-close" aria-label="Close product editor">&times;</button>'
    + '<div class="admin-order-head"><span>Edit Product</span><strong>' + escapeHtml(product.title) + '</strong></div>'
    + '<div class="admin-product-preview"><img src="' + productImage(product.img) + '" alt="' + escapeHtml(product.title) + '"><span>PRD' + String(index + 1).padStart(3, '0') + '</span></div>'
    + '<label>Product Name<input name="title" value="' + escapeHtml(product.title) + '" required></label>'
    + '<label>Category<input name="cat" value="' + escapeHtml(product.cat || 'Menu') + '" required></label>'
    + '<label>Price<input name="priceValue" type="number" min="0" step="0.01" value="' + Number(product.priceValue || 0).toFixed(2) + '" required></label>'
    + '<label>Quantity<input name="quantity" type="number" min="0" step="1" value="' + inventoryQuantity(product, index) + '" required></label>'
    + '<label>day<input name="day" value="' + escapeHtml(product.day || '5') + '"></label>'
    + '<label class="wide">Image Path<input name="img" value="' + escapeHtml(product.img || '') + '"></label>'
    + '<label class="wide">Description<textarea name="desc" rows="3">' + escapeHtml(product.desc || '') + '</textarea></label>'
    + '<p class="admin-product-error" data-product-error></p>'
    + '<button type="submit" class="btn btn-primary w-100">Save Changes</button>'
    + '</form>';

  modal.addEventListener('click', event => {
    if (event.target === modal || event.target.closest('.admin-order-close')) modal.remove();
  });
  modal.querySelector('form').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('[type="submit"]');
    const error = form.querySelector('[data-product-error]');
    const formData = new FormData(form);
    button.disabled = true;
    button.textContent = 'Saving...';
    if (error) error.textContent = '';
    try {
      const data = await api('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          title: formData.get('title'),
          cat: formData.get('cat'),
          priceValue: Number(formData.get('priceValue')),
          quantity: Number(formData.get('quantity')),
          day: formData.get('day'),
          img: formData.get('img'),
          desc: formData.get('desc')
        })
      });
      latestInventoryProducts = latestInventoryProducts.map(item => item.id === product.id ? data.product : item);
      renderInventory(latestInventoryProducts);
      modal.remove();
    } catch (saveError) {
      if (error) error.textContent = saveError.message;
      button.disabled = false;
      button.textContent = 'Save Changes';
    }
  });
  document.body.appendChild(modal);
}

function couponDiscountText(coupon) {
  if (coupon.type === 'fixed') return money(coupon.value);
  return Number(coupon.value || 0) + '%';
}

function renderCoupons(coupons) {
  const tbody = document.querySelector('[data-admin-table="coupons"]');
  const count = document.querySelector('[data-admin-coupon-count]');
  if (count) count.textContent = String((coupons || []).length);
  if (!tbody) return;
  if (!coupons || !coupons.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-secondary">No discount codes yet.</td></tr>';
    return;
  }
  tbody.innerHTML = coupons.map(coupon => {
    const statusClass = coupon.enabled ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary';
    return '<tr>'
      + '<td><strong>' + escapeHtml(coupon.code) + '</strong><div class="small text-secondary">' + escapeHtml(coupon.label || 'Untitled discount') + '</div></td>'
      + '<td>' + (coupon.type === 'fixed' ? 'Fixed amount' : 'Percentage') + '</td>'
      + '<td>' + couponDiscountText(coupon) + '</td>'
      + '<td>' + money(coupon.min || 0) + '</td>'
      + '<td><span class="badge ' + statusClass + '">' + (coupon.enabled ? 'Active' : 'Paused') + '</span></td>'
      + '<td class="text-end">'
      + '<button type="button" class="btn btn-sm btn-light me-1" data-coupon-toggle="' + escapeHtml(coupon.code) + '">' + (coupon.enabled ? 'Pause' : 'Enable') + '</button>'
      + '<button type="button" class="btn btn-sm btn-light link-danger" data-coupon-delete="' + escapeHtml(coupon.code) + '"><i class="ti ti-trash"></i></button>'
      + '</td>'
      + '</tr>';
  }).join('');
  tbody.querySelectorAll('[data-coupon-toggle]').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.getAttribute('data-coupon-toggle');
      const coupon = coupons.find(item => item.code === code);
      if (!coupon) return;
      const data = await api('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, enabled: !coupon.enabled })
      });
      renderCoupons(data.coupons || []);
    });
  });
  tbody.querySelectorAll('[data-coupon-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      const code = button.getAttribute('data-coupon-delete');
      if (!window.confirm('Delete discount code ' + code + '?')) return;
      const data = await api('/api/admin/coupons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      renderCoupons(data.coupons || []);
    });
  });
}

function initCouponManager(coupons) {
  const form = document.querySelector('[data-admin-coupon-form]');
  if (!form || form.getAttribute('data-bound') === 'true') {
    renderCoupons(coupons);
    return;
  }
  form.setAttribute('data-bound', 'true');
  const status = document.querySelector('[data-admin-coupon-status]');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (status) {
      status.className = 'small mb-0 text-secondary';
      status.textContent = 'Saving discount code...';
    }
    try {
      const formData = new FormData(form);
      const data = await api('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.get('code'),
          label: formData.get('label'),
          type: formData.get('type'),
          value: Number(formData.get('value')),
          min: Number(formData.get('min')),
          enabled: formData.get('enabled') === 'on'
        })
      });
      form.reset();
      const enabled = form.querySelector('[name="enabled"]');
      if (enabled) enabled.checked = true;
      renderCoupons(data.coupons || []);
      if (status) {
        status.className = 'small mb-0 text-success';
        status.textContent = data.coupon.code + ' 已同步到前台優惠碼。';
      }
    } catch (error) {
      if (status) {
        status.className = 'small mb-0 text-danger';
        status.textContent = error.message;
      }
    }
  });
  renderCoupons(coupons);
}

export async function loadAdminDashboard() {
  if (!document.querySelector('[data-admin-page="dashboard"]')) return;
  try {
    const productsData = await api('/api/products');
    const products = productsData.products || [];
    let orders = [];
    let summary = null;
    let notifications = [];
    let coupons = [];
    try {
      const ordersData = await api('/api/admin/orders');
      orders = ordersData.orders || [];
      latestAdminOrders = orders;
    } catch (ordersError) {
      console.warn('Admin orders API is not available yet. Restart Patria/Patria/server.js to enable it.', ordersError);
    }
    try {
      const summaryData = await api('/api/admin/summary');
      summary = summaryData.summary || null;
      notifications = summaryData.notifications || [];
    } catch (summaryError) {
      console.warn('Admin summary API is not available yet. Restart Patria/Patria/server.js to enable it.', summaryError);
    }
    try {
      const couponData = await api('/api/admin/coupons');
      coupons = couponData.coupons || [];
    } catch (couponError) {
      console.warn('Admin coupons API is not available yet.', couponError);
    }
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemCount = orders.reduce((sum, order) => sum + (order.items || []).reduce((s, item) => s + Number(item.qty || 0), 0), 0);
    setText('[data-admin-stat="sales"]', money(totalSales));
    setText('[data-admin-stat="products"]', String(products.length));
    setText('[data-admin-stat="orders"]', String(orders.length));
    setText('[data-admin-stat="items"]', String(itemCount));
    renderTopProducts(products, orders);
    renderLowStockProducts(products);
    renderRecentOrders(orders);
    renderAdminSummary(summary);
    renderAdminNotifications(notifications);
    initCouponManager(coupons);
    setText('[data-admin-status]', orders.length ? '已連接 Patria sample 訂單。' : '純前端 sample 後台已就緒，等待前台訂單。');
  } catch (error) {
    console.error(error);
    setText('[data-admin-status]', '純前端 sample 資料讀取失敗。');
  }
}

export async function loadInventory() {
  if (!document.querySelector('[data-admin-table="inventory"]')) return;
  bindInventoryExcelTools();
  try {
    const data = await api('/api/products');
    renderInventory(data.products || []);
  } catch (error) {
    console.error(error);
    const tbody = document.querySelector('[data-admin-table="inventory"]');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="text-secondary">純前端 sample 資料讀取失敗。</td></tr>';
  }
}

export async function loadAdminReports() {
  if (!document.querySelector('[data-admin-page="reports"]')) return;
  try {
    const productsData = await api('/api/products');
    const products = productsData.products || [];
    const ordersData = await api('/api/admin/orders');
    const orders = ordersData.orders || [];
    let customers = [];
    try {
      const customersData = await api('/api/admin/customers');
      customers = customersData.customers || [];
    } catch (customersError) {
      console.warn(customersError);
    }
    let engagement = { reservations: [], messages: [], subscribers: [], searches: [] };
    try {
      engagement = await api('/api/admin/engagement');
    } catch (engagementError) {
      console.warn(engagementError);
    }
    let summary = null;
    let notifications = [];
    try {
      const summaryData = await api('/api/admin/summary');
      summary = summaryData.summary || null;
      notifications = summaryData.notifications || [];
    } catch (summaryError) {
      console.warn(summaryError);
    }
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const soldQty = orders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.qty || 0), 0), 0);
    const lowStock = products.filter(product => inventoryQuantity(product, 999) > 0 && inventoryQuantity(product, 999) < 10).length;
    const outStock = products.filter(product => inventoryQuantity(product, 999) === 0).length;
    setText('[data-report-stat="revenue"]', money(summary ? summary.totalSales : totalSales));
    setText('[data-report-stat="sold"]', String(summary ? summary.itemCount : soldQty));
    setText('[data-report-stat="low-stock"]', String(lowStock));
    setText('[data-report-stat="out-stock"]', String(outStock));
    renderReportTopProducts(orders, products);
    renderReportOrders(orders);
    renderReportAddresses(customers);
    renderEngagementTables(engagement);
    renderAdminNotifications(notifications);
  } catch (error) {
    console.error(error);
    setText('[data-report-stat="revenue"]', 'Offline');
    const tbody = document.querySelector('[data-report-table="orders"]');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-secondary">純前端 sample 資料讀取失敗。</td></tr>';
    const addressesTable = document.querySelector('[data-report-table="addresses"]');
    if (addressesTable) addressesTable.innerHTML = '<tr><td colspan="5" class="text-secondary">純前端 sample 資料讀取失敗。</td></tr>';
    document.querySelectorAll('[data-engagement-table]').forEach(table => {
      const cols = table.getAttribute('data-engagement-table') === 'reservations' ? 7 : (table.getAttribute('data-engagement-table') === 'messages' ? 6 : 3);
      table.innerHTML = '<tr><td colspan="' + cols + '" class="text-secondary">純前端 sample 資料讀取失敗。</td></tr>';
    });
  }
}

export function initCreateProduct() {
  const form = document.getElementById('addProductForm');
  if (!form) return;
  const status = document.querySelector('[data-add-product-status]');
  const submit = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const imageInput = document.getElementById('productImage');
    const imageFile = imageInput && imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
    const imagePath = imageFile ? 'img/menu/' + imageFile.name : '';
    if (status) {
      status.className = 'small mt-3 mb-0 text-secondary';
      status.textContent = '';
    }
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Adding...';
    }

    try {
      const data = await api('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.getElementById('productName').value,
          sku: document.getElementById('productSKU').value,
          priceValue: Number(document.getElementById('productPrice').value),
          quantity: Number(document.getElementById('productStock').value),
          cat: document.getElementById('productCategory').value,
          img: imagePath,
          desc: document.getElementById('productDescription').value
        })
      });
      form.reset();
      if (status) {
        status.className = 'small mt-3 mb-0 text-success';
        status.textContent = data.product.title + ' 已加入前台菜單與 Inventory。';
      }
    } catch (error) {
      if (status) {
        status.className = 'small mt-3 mb-0 text-danger';
        status.textContent = error.message;
      }
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = 'Add Product';
      }
    }
  });
}
