import React from 'react';
import { createRoot } from 'react-dom/client';
import { createCartApi } from '../../cart-module/frontend/cart-api.js';
import { createCustomerApi } from '../../customer-backend-module/frontend/customer-api.js';
import { CartDrawer } from '../../cart-module/frontend/CartDrawer.jsx';
import { CustomerDashboard } from '../../customer-backend-module/frontend/CustomerDashboard.jsx';
import '../../cart-module/frontend/cart.css';
import '../../customer-backend-module/frontend/customer.css';

const cartApi = createCartApi({ apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api' });
const customerApi = createCustomerApi({ apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api' });

function App() {
  const [cartOpen, setCartOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  return <main style={{ fontFamily: 'system-ui', maxWidth: 720, margin: '4rem auto', padding: '0 1rem' }}>
    <h1>Independent module example</h1>
    <p>This site imports cart and customer modules without importing the Patria app.</p>
    <button onClick={() => setCartOpen(true)}>Open cart</button>{' '}
    <button onClick={() => setAccountOpen(value => !value)}>Account</button>
    {cartOpen && <CartDrawer api={cartApi} open={cartOpen} onClose={() => setCartOpen(false)} />}
    {accountOpen && <CustomerDashboard api={customerApi} onClose={() => setAccountOpen(false)} />}
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
