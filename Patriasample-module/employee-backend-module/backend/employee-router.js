import { normalizeCoupon } from '../../cart-module/backend/cart-service.js';

function result(status, data, commit = false) {
  return { status, data, commit };
}

/** Core employee dashboard routes. The host is responsible for admin auth. */
export async function handleEmployeeRequest({ method, path, body = {}, db, repositories, products = [], publicUser, createToken, createProductId, defaultCoupons = [] }) {
  const users = (repositories?.users?.list ? await repositories.users.list() : null) || db.users || [];
  const orders = (repositories?.orders?.list ? await repositories.orders.list() : null) || db.orders || [];
  if (!products.length && repositories?.products?.list) products = await repositories.products.list();

  if (method === 'POST' && path === '/api/admin/products') {
    const title = String(body.title || '').trim();
    const cat = String(body.cat || 'NOODLES').trim().toUpperCase();
    const sku = String(body.sku || '').trim();
    const img = String(body.img || 'img/menu/1.webp').trim();
    const desc = String(body.desc || '').trim();
    const day = String(body.day || '5').trim();
    const quantity = Math.max(0, Number(body.quantity ?? 0));
    const priceValue = Number(body.priceValue || String(body.price || '').replace(/[^0-9.]/g, ''));
    if (!title) return result(400, { error: 'Product title is required.' });
    if (!Number.isFinite(priceValue) || priceValue < 0) return result(400, { error: 'Product price is invalid.' });
    if (!Number.isFinite(quantity)) return result(400, { error: 'Product quantity is invalid.' });
    const now = new Date().toISOString();
    const product = {
      id: createProductId(title), source: 'admin', title, sku, cat,
      priceValue: Number(priceValue.toFixed(2)), price: '$' + Number(priceValue).toFixed(2),
      quantity, day, img, desc, rating: '4.8', reviews: '24', cal: '520', time: '15',
      createdAt: now, updatedAt: now
    };
    if (repositories?.products?.insert) await repositories.products.insert(product);
    else { db.productAdditions ||= []; db.productAdditions.push(product); }
    return result(201, { product }, true);
  }

  if (method === 'PATCH' && path === '/api/admin/products') {
    const product = products.find(item => item.id === body.id);
    if (!product) return result(404, { error: 'Product not found.' });
    const title = String(body.title || product.title).trim();
    const cat = String(body.cat || product.cat || 'Menu').trim();
    const img = String(body.img || product.img || '').trim();
    const desc = String(body.desc || product.desc || '').trim();
    const day = String(body.day || product.day || '5').trim();
    const quantity = Math.max(0, Number(body.quantity ?? product.quantity ?? 0));
    const priceValue = Number(body.priceValue || String(body.price || product.price).replace(/[^0-9.]/g, ''));
    if (!title) return result(400, { error: 'Product title is required.' });
    if (!Number.isFinite(priceValue) || priceValue < 0) return result(400, { error: 'Product price is invalid.' });
    if (!Number.isFinite(quantity)) return result(400, { error: 'Product quantity is invalid.' });
    const changes = {
      title, cat, img, desc, quantity, day,
      priceValue: Number(priceValue.toFixed(2)), price: '$' + Number(priceValue).toFixed(2),
      updatedAt: new Date().toISOString()
    };
    if (repositories?.products?.override) await repositories.products.override(product.id, changes);
    else { db.productOverrides ||= {}; db.productOverrides[product.id] = changes; }
    return result(200, { product: { ...product, ...changes, id: product.id } }, true);
  }

  if (method === 'DELETE' && path === '/api/admin/products') {
    const product = products.find(item => item.id === body.id);
    if (!product) return result(404, { error: 'Product not found.' });
    if (repositories?.products?.remove) await repositories.products.remove(product.id);
    else {
      db.deletedProducts ||= [];
      if (!db.deletedProducts.includes(product.id)) db.deletedProducts.push(product.id);
      if (db.productOverrides) delete db.productOverrides[product.id];
    }
    return result(200, { ok: true, id: product.id }, true);
  }

  if (path === '/api/admin/coupons' && ['GET', 'POST', 'PATCH', 'DELETE'].includes(method)) {
    db.coupons = (db.coupons || defaultCoupons).map(normalizeCoupon);
    if (method === 'GET') return result(200, { coupons: db.coupons }, true);
    if (method === 'POST') {
      const coupon = normalizeCoupon({ ...body, updatedAt: new Date().toISOString() });
      if (!coupon.code) return result(400, { error: 'Please enter a coupon code.' });
      if (db.coupons.some(item => item.code === coupon.code)) return result(409, { error: 'This coupon code already exists.' });
      db.coupons.push(coupon);
      return result(201, { coupon, coupons: db.coupons }, true);
    }
    const code = String(body.code || '').trim().toUpperCase();
    if (method === 'PATCH') {
      if (!db.coupons.some(coupon => coupon.code === code)) return result(404, { error: 'Coupon not found.' });
      db.coupons = db.coupons.map(coupon => coupon.code === code ? normalizeCoupon({ ...coupon, ...body, code, updatedAt: new Date().toISOString() }) : coupon);
      return result(200, { coupon: db.coupons.find(coupon => coupon.code === code), coupons: db.coupons }, true);
    }
    db.coupons = db.coupons.filter(coupon => coupon.code !== code);
    return result(200, { ok: true, coupons: db.coupons }, true);
  }

  if (method === 'GET' && path === '/api/admin/orders') {
    const adminOrders = orders.map(order => {
      const user = repositories?.users?.findById?.(order.userId) || users.find(entry => entry.id === order.userId);
      return {
        ...order,
        customer: user ? { name: user.name, email: user.email, phone: user.phone || '' } : null
      };
    });
    return result(200, { orders: adminOrders });
  }

  if (method === 'GET' && path === '/api/admin/customers') {
    return result(200, {
      customers: users.map(user => ({
        ...publicUser(user),
        orderCount: orders.filter(order => order.userId === user.id).length
      }))
    });
  }

  if (method === 'GET' && path === '/api/admin/coupons') {
    db.coupons = (db.coupons || []).map(normalizeCoupon);
    return result(200, { coupons: db.coupons }, true);
  }

  if (method === 'GET' && path === '/api/admin/engagement') {
    return result(200, {
      reservations: (db.reservations || []).slice().reverse(),
      messages: (db.messages || []).slice().reverse(),
      subscribers: (db.subscribers || []).slice().reverse(),
      searches: (db.searches || []).slice().reverse()
    });
  }

  if (method === 'GET' && path === '/api/admin/summary') {
    const completedOrders = orders.filter(order => ['completed', 'picked_up'].includes(String(order.status || '').toLowerCase()));
    const customersWithOrders = new Set(orders.map(order => order.userId).filter(Boolean));
    const customersWithAddresses = users.filter(user => user.address && user.address.address).length;
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const completedSales = completedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const itemCount = orders.reduce((sum, order) => sum + (order.items || []).reduce((total, item) => total + Number(item.qty || 0), 0), 0);
    const notifications = [
      ...orders.slice(-5).map(order => {
        const user = users.find(entry => entry.id === order.userId);
        const status = String(order.status || '').toLowerCase();
        return {
          type: 'order',
          title: status === 'picked_up' ? 'Order picked up' : (status === 'completed' ? 'Order completed' : 'New order received'),
          message: 'Order #' + order.id + ' from ' + (user ? user.name : 'Guest customer'),
          time: order.updatedAt || order.createdAt || new Date().toISOString()
        };
      }),
      ...users.slice(-3).map(user => ({
        type: 'user',
        title: 'Customer account active',
        message: user.name + ' is connected to My Account',
        time: user.createdAt || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0)).slice(0, 5);
    return result(200, {
      summary: {
        totalSales: Number(totalSales.toFixed(2)),
        completedSales: Number(completedSales.toFixed(2)),
        pendingSales: Number(Math.max(0, totalSales - completedSales).toFixed(2)),
        itemCount,
        customerCount: users.length,
        customersWithOrders: customersWithOrders.size,
        customersWithAddresses,
        orderCount: orders.length,
        completedOrderCount: completedOrders.length,
        notificationCount: notifications.length
      },
      notifications
    });
  }

  if (method === 'PATCH' && path === '/api/admin/orders/status') {
    const order = orders.find(entry => entry.id === body.orderId);
    if (!order) return result(404, { error: 'Order not found.' });
    order.status = String(body.status || 'completed').trim() || 'completed';
    order.updatedAt = new Date().toISOString();
    const user = users.find(entry => entry.id === order.userId);
    return result(200, {
      order: {
        ...order,
        customer: user ? { name: user.name, email: user.email, phone: user.phone || '' } : null
      }
    }, true);
  }

  return null;
}
