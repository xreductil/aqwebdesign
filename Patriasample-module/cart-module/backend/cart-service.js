/**
 * Framework-independent cart domain helpers.
 *
 * The host application owns persistence and authentication. These helpers
 * only operate on the supplied database-shaped object and product records.
 */
export function getCart(db, auth, guestId, repositories) {
  db.userCarts ||= {};
  db.guestCarts ||= {};
  if (auth) {
    if (repositories?.carts?.user) return repositories.carts.user(auth.user.id);
    db.userCarts[auth.user.id] ||= [];
    return db.userCarts[auth.user.id];
  }
  const key = guestId || 'guest';
  if (repositories?.carts?.guest) return repositories.carts.guest(key);
  db.guestCarts[key] ||= [];
  return db.guestCarts[key];
}

export function cartSummary(cart) {
  const total = cart.reduce((sum, item) => sum + Number(item.priceValue || 0) * Number(item.qty || 0), 0);
  return { items: cart, total: Number(total.toFixed(2)) };
}

export function normalizeCoupon(coupon) {
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

export function couponDetails(db, code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();
  const coupon = (db.coupons || []).map(normalizeCoupon).find(item => item.enabled && item.code === normalized);
  if (!coupon) return null;
  if (subtotal < Number(coupon.min || 0)) return { code: normalized, coupon, valid: false, discount: 0 };
  const discount = coupon.type === 'percent'
    ? subtotal * (Number(coupon.value || 0) / 100)
    : Number(coupon.value || 0);
  return { code: normalized, coupon, valid: true, discount: Math.min(subtotal, Math.max(0, discount)) };
}

export function mergeGuestCart(db, userId, guestId, repositories) {
  const guestCart = guestId
    ? (repositories?.carts?.guest ? repositories.carts.guest(guestId) : db.guestCarts?.[guestId])
    : null;
  if (!guestId || !guestCart?.length) return;
  db.userCarts ||= {};
  const userCart = repositories?.carts?.user ? repositories.carts.user(userId) : (db.userCarts[userId] ||= []);
  for (const item of guestCart) {
    const existing = userCart.find(entry => entry.id === item.id);
    if (existing) existing.qty += item.qty;
    else userCart.push(item);
  }
  if (repositories?.carts?.removeGuest) repositories.carts.removeGuest(guestId);
  else delete db.guestCarts[guestId];
}
