

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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    sessionStorage.setItem('patriaAdminSignedIn', 'true');
    window.location.href = 'index.html';
  });
}

setupAdminAuthRedirect();
