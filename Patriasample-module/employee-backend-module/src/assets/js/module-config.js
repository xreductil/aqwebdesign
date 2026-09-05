const runtimeConfig = globalThis.__EMPLOYEE_MODULE_CONFIG__ || {};

export const employeeModuleConfig = {
  apiBaseUrl: String(runtimeConfig.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  productImageBaseUrl: String(runtimeConfig.productImageBaseUrl || import.meta.env.VITE_PRODUCT_IMAGE_BASE_URL || '').replace(/\/$/, ''),
  storeUrl: runtimeConfig.storeUrl || '/',
  brandName: runtimeConfig.brandName || 'Restaurant Admin',
  defaultProducts: Array.isArray(runtimeConfig.defaultProducts) ? runtimeConfig.defaultProducts : [],
};

export function resolveModuleUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^(?:https?:|data:|blob:|\/\/)/i.test(value)) return value;
  if (!employeeModuleConfig.productImageBaseUrl) return value;
  return `${employeeModuleConfig.productImageBaseUrl}/${value.replace(/^\/+/, '')}`;
}
