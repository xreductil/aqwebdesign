const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
).replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: options.cache || "no-store",
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

export function updateMemberProfile(payload) {
  return apiRequest("/api/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateMemberAddress(payload) {
  return apiRequest("/api/address", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return apiRequest("/api/logout", { method: "POST" });
}

export function login(loginValue, password) {
  return apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify({ login: loginValue, password }),
  });
}

export function register({ name, email, phone, password }) {
  return apiRequest("/api/register", {
    method: "POST",
    body: JSON.stringify({ name, email, phone, password }),
  });
}

export function sendContactMessage(payload) {
  return apiRequest("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendReservation(payload) {
  return apiRequest("/api/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function subscribeNewsletter(email) {
  return apiRequest("/api/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getProducts() {
  return apiRequest("/api/products");
}

export function getCoupons() {
  return apiRequest("/api/coupons");
}

export function getCart() {
  return apiRequest("/api/cart");
}

export function addToCart(productId, qty = 1) {
  return apiRequest("/api/cart/add", {
    method: "POST",
    body: JSON.stringify({ productId, qty }),
  });
}

export function updateCartItem(productId, qty) {
  return apiRequest("/api/cart/item", {
    method: "PATCH",
    body: JSON.stringify({ productId, qty }),
  });
}

export function removeCartItem(productId) {
  return apiRequest("/api/cart/item", {
    method: "DELETE",
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
