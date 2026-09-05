

// Import Bootstrap JS
import * as bootstrap from 'bootstrap';
import './custom.js';
import { initCreateProduct, loadAdminDashboard, loadAdminReports, loadInventory } from './admin-api.js';


// Import SCSS
import '../scss/style.scss';

loadAdminDashboard();
loadInventory();
loadAdminReports();
initCreateProduct();

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function authRequest(path, options = {}) {
  const response = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Authentication failed.');
  return data;
}

async function assertAdminSession() {
  await authRequest('/api/admin/summary');
}

function setupAdminAuthRedirect() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'signin.html' && page !== 'signup.html') {
    assertAdminSession().catch(() => {
      window.location.href = 'signin.html';
    });
    return;
  }

  const form = document.querySelector('form.needs-validation');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const button = form.querySelector('[type="submit"]');
    const existingError = form.querySelector('[data-auth-error]');
    const error = existingError || document.createElement('p');
    error.setAttribute('data-auth-error', '');
    error.className = 'text-danger small mt-3';
    if (!existingError) form.appendChild(error);
    error.textContent = '';
    if (button) button.disabled = true;

    try {
      const payload = page === 'signup.html'
        ? {
            name: document.getElementById('fullName')?.value.trim(),
            email: document.getElementById('email')?.value.trim(),
            password: document.getElementById('password')?.value
          }
        : {
            login: document.getElementById('email')?.value.trim(),
            password: document.getElementById('password')?.value
          };
      await authRequest('/api/' + (page === 'signup.html' ? 'register' : 'login'), {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      await assertAdminSession();
      window.location.href = 'index.html';
    } catch (authError) {
      await authRequest('/api/logout', { method: 'POST' }).catch(() => {});
      error.textContent = authError.message === 'Administrator role required.'
        ? 'This account is not an administrator.'
        : authError.message;
      if (button) button.disabled = false;
    }
  });
}

setupAdminAuthRedirect();
