

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


function setupAdminAuthRedirect() {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'signin.html' && page !== 'signup.html') return;

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
      const apiBase = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(apiBase + '/api/' + (page === 'signup.html' ? 'register' : 'login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');

      if (page === 'signin.html') {
        const adminCheck = await fetch(apiBase + '/api/admin/summary', { credentials: 'include' });
        if (!adminCheck.ok) throw new Error('This account is not an administrator.');
      }
      window.location.href = 'index.html';
    } catch (authError) {
      error.textContent = authError.message;
      if (button) button.disabled = false;
    }
  });
}

setupAdminAuthRedirect();
