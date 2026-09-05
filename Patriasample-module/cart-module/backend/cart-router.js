import { cartSummary, couponDetails, getCart } from './cart-service.js';

function result(status, data, commit = false) {
  return { status, data, commit };
}

/**
 * Handle cart and checkout requests without depending on a web framework.
 * Return null when the route does not belong to this module.
 */
export async function handleCartRequest({ method, path, body = {}, db, repositories, auth, guestId, products, createOrderId }) {
  if (method === 'GET' && path === '/api/cart') {
    return result(200, cartSummary(getCart(db, auth, guestId, repositories)), true);
  }

  if (method === 'POST' && path === '/api/cart/add') {
    const product = products.find(item => item.id === body.productId || item.title === body.title);
    const qty = Math.max(1, Number(body.qty || 1));
    if (!product) return result(404, { error: 'Product not found.' });
    const cart = getCart(db, auth, guestId, repositories);
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.qty += qty;
    else cart.push({ ...product, qty });
    return result(200, cartSummary(cart), true);
  }

  if (method === 'PATCH' && path === '/api/cart/item') {
    const cart = getCart(db, auth, guestId, repositories);
    const item = cart.find(entry => entry.id === body.productId);
    if (!item) return result(404, { error: 'Cart item not found.' });
    item.qty = Math.max(0, Number(body.qty || 0));
    if (item.qty === 0) cart.splice(cart.indexOf(item), 1);
    return result(200, cartSummary(cart), true);
  }

  if (method === 'DELETE' && path === '/api/cart/item') {
    const cart = getCart(db, auth, guestId, repositories);
    const index = cart.findIndex(item => item.id === body.productId);
    if (index >= 0) cart.splice(index, 1);
    return result(200, cartSummary(cart), true);
  }

  if (method === 'POST' && path === '/api/checkout') {
    if (!auth) return result(401, { error: 'Please log in before checkout.' });
    const cart = repositories?.carts?.user(auth.user.id) || db.userCarts[auth.user.id] || [];
    if (!cart.length) return result(400, { error: 'Cart is empty.' });
    const fulfillmentDate = String(body.fulfillmentDate || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fulfillmentDate)) {
      return result(400, { error: 'Please choose a pickup date.' });
    }
    const leadDays = cart.reduce((max, item) => {
      const days = Number(item.day == null || item.day === '' ? 5 : item.day);
      return Math.max(max, Number.isFinite(days) ? days : 5);
    }, 0);
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    minDate.setDate(minDate.getDate() + leadDays);
    const selectedDate = new Date(fulfillmentDate + 'T00:00:00');
    const minDateText = minDate.getFullYear() + '-' + String(minDate.getMonth() + 1).padStart(2, '0') + '-' + String(minDate.getDate()).padStart(2, '0');
    if (selectedDate < minDate) {
      return result(400, { error: 'Pickup date must be on or after ' + minDateText + '.' });
    }
    const subtotal = cart.reduce((sum, item) => sum + Number(item.priceValue || 0) * Number(item.qty || 0), 0);
    const coupon = couponDetails(db, body.couponCode, subtotal);
    const discount = coupon && coupon.valid ? coupon.discount : 0;
    const total = Math.max(0, subtotal - discount);
    const order = {
      id: createOrderId(),
      userId: auth.user.id,
      items: cart,
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      couponCode: coupon && coupon.valid ? coupon.code : '',
      total: Number(total.toFixed(2)),
      fulfillmentDate,
      leadDays,
      status: 'created',
      createdAt: new Date().toISOString()
    };
    db.orders.push(order);
    db.userCarts[auth.user.id] = [];
    return result(201, { order, cart: cartSummary([]) }, true);
  }

  return null;
}
