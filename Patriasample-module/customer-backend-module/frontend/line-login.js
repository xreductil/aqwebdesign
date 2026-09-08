const DEFAULT_PENDING_KEY = "customer_line_login_pending";

export function startLineLogin({ loginUrl = "/auth/line", pendingKey = DEFAULT_PENDING_KEY } = {}) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(pendingKey, "1");
  window.location.assign(loginUrl);
}

/**
 * Call this on the store homepage after LINE login redirects back.
 * It redirects only when this browser started a LINE login flow.
 */
export async function redirectAfterLineLogin({ api, accountUrl = "/account", pendingKey = DEFAULT_PENDING_KEY } = {}) {
  if (typeof window === "undefined" || !api) return false;
  if (window.sessionStorage.getItem(pendingKey) !== "1") return false;
  try {
    await api.me();
    window.sessionStorage.removeItem(pendingKey);
    window.location.replace(accountUrl);
    return true;
  } catch {
    window.sessionStorage.removeItem(pendingKey);
    return false;
  }
}
