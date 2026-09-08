/**
 * Portable cart API client.
 * Change apiBaseUrl when the module is mounted on another site.
 */
function createBrowserGuestId() {
  try {
    const storageKey = "patria_guest_id";
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const value = globalThis.crypto?.randomUUID?.() || `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(storageKey, value);
    return value;
  } catch {
    return "guest_" + Math.random().toString(36).slice(2);
  }
}

export function createCartApi({ apiBaseUrl = "", guestId, getGuestId = createBrowserGuestId } = {}) {
  const request = async (path, options = {}) => {
    const resolvedGuestId = guestId || getGuestId?.();
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(resolvedGuestId ? { "X-Guest-ID": resolvedGuestId } : {}),
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Cart request failed.");
    return data;
  };

  return {
    getCart: () => request("/api/cart"),
    getCoupons: () => request("/api/coupons"),
    add: (productId, qty = 1) => request("/api/cart/add", { method: "POST", body: JSON.stringify({ productId, qty }) }),
    update: (productId, qty) => request("/api/cart/item", { method: "PATCH", body: JSON.stringify({ productId, qty }) }),
    remove: (productId) => request("/api/cart/item", { method: "DELETE", body: JSON.stringify({ productId }) }),
    checkout: (fulfillmentDate, couponCode = "") => request("/api/checkout", { method: "POST", body: JSON.stringify({ fulfillmentDate, couponCode }) }),
  };
}
