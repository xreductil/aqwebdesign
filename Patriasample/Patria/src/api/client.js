const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "API request failed.");
  }

  return data;
}

export function getCurrentUser() {
  return apiRequest("/api/me");
}

export function logout() {
  return apiRequest("/api/logout", { method: "POST" });
}

export function getProducts() {
  return apiRequest("/api/products");
}

export function getCart() {
  return apiRequest("/api/cart", {
    headers: {
      "X-Guest-Id": getGuestId(),
    },
  });
}

export function addToCart(productId, qty = 1) {
  return apiRequest("/api/cart/add", {
    method: "POST",
    headers: {
      "X-Guest-Id": getGuestId(),
    },
    body: JSON.stringify({ productId, qty }),
  });
}

export function updateCartItem(productId, qty) {
  return apiRequest("/api/cart/item", {
    method: "PATCH",
    headers: {
      "X-Guest-Id": getGuestId(),
    },
    body: JSON.stringify({ productId, qty }),
  });
}

export function removeCartItem(productId) {
  return apiRequest("/api/cart/item", {
    method: "DELETE",
    headers: {
      "X-Guest-Id": getGuestId(),
    },
    body: JSON.stringify({ productId }),
  });
}

export function checkout(fulfillmentDate, couponCode = "") {
  return apiRequest("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ fulfillmentDate, couponCode }),
  });
}

export function getOrders() {
  return apiRequest("/api/orders");
}

function getGuestId() {
  const key = "patriaGuestId";
  let guestId = window.localStorage.getItem(key);
  if (!guestId) {
    guestId = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
    window.localStorage.setItem(key, guestId);
  }
  return guestId;
}
