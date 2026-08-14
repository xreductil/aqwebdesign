



import "./chart.js";
import "./sidebar.js";
import { employeeModuleConfig } from "./module-config.js";

document.querySelectorAll("[data-store-link]").forEach((link) => {
  link.href = employeeModuleConfig.storeUrl;
});

document.querySelectorAll("[data-module-brand]").forEach((element) => {
  element.textContent = employeeModuleConfig.brandName;
});
