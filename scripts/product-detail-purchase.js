(() => {
  const productPage = document.querySelector('.emerald-product-page');
  const copy = productPage?.querySelector('.emerald-product-copy');
  const titleElement = copy?.querySelector('h2');
  if (!productPage || !copy || !titleElement) return;

  const normalize = value => String(value || '')
    .normalize('NFKC')
    .replace(/<br\s*\/?\s*>/gi, '')
    .replace(/[\s（）()\-]/g, '')
    .replace('季節限定', '')
    .toLowerCase();
  const money = value => `NT$${Number(value || 0).toLocaleString('zh-TW')}`;
  const pageTitle = normalize(titleElement.textContent);
  const pagePath = decodeURI(window.location.pathname).replace(/\/$/, '');

  const render = product => {
    const inStock = product.published !== false && Number(product.priceValue || 0) > 0 && Number(product.quantity ?? 1) > 0;
    if (Number(product.priceValue || 0) <= 0) {
      const badge = copy.querySelector('.emerald-product-badge, .bean-tart-badge');
      const pending = document.createElement('p');
      pending.className = 'product-detail-pending-price';
      pending.textContent = '價格待設定';
      if (badge) badge.insertAdjacentElement('afterend', pending);
      else copy.appendChild(pending);
      return;
    }
    const section = document.createElement('section');
    section.className = 'product-detail-purchase';
    section.setAttribute('aria-label', '商品購買');
    section.innerHTML = `<p class="product-detail-price">${money(product.priceValue)}</p><div class="cake-product-purchase" data-cake-purchase><div class="cake-quantity-control" aria-label="選擇數量"><button type="button" data-cake-quantity-change="-1"${inStock ? '' : ' disabled'} aria-label="減少數量">−</button><output data-cake-quantity aria-live="polite">1</output><button type="button" data-cake-quantity-change="1"${inStock ? '' : ' disabled'} aria-label="增加數量">＋</button></div><button class="cake-add-cart" type="button" data-product-detail-add-cart${inStock ? '' : ' disabled'}>${inStock ? '加入購物車' : '暫停供應'}</button></div><p class="product-detail-purchase-message" data-product-detail-message role="status"></p>`;
    const badge = copy.querySelector('.emerald-product-badge, .bean-tart-badge');
    if (badge) badge.insertAdjacentElement('afterend', section);
    else titleElement.insertAdjacentElement('afterend', section);

    section.querySelectorAll('[data-cake-quantity-change]').forEach(button => button.addEventListener('click', () => {
      const output = section.querySelector('[data-cake-quantity]');
      output.textContent = String(Math.max(1, Math.min(99, Number(output.textContent || 1) + Number(button.dataset.cakeQuantityChange || 0))));
    }));
    const addButton = section.querySelector('[data-product-detail-add-cart]');
    addButton.addEventListener('click', async () => {
      const message = section.querySelector('[data-product-detail-message]');
      const quantity = Number(section.querySelector('[data-cake-quantity]').textContent || 1);
      addButton.disabled = true;
      addButton.textContent = '加入中…';
      message.textContent = '';
      try {
        const response = await fetch('/api/cart/add', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, qty: quantity }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || '加入購物車失敗。');
        addButton.textContent = '已加購物車';
        document.querySelector('.cart-trigger')?.click();
      } catch (error) {
        message.textContent = error.message;
        addButton.textContent = '加入購物車';
      } finally {
        addButton.disabled = false;
      }
    });
  };

  fetch('/api/products', { credentials: 'include', headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('無法載入商品資料。')))
    .then(data => {
      const product = (data.products || []).find(item => {
        const itemPath = item.url ? decodeURI(new URL(item.url, window.location.origin).pathname).replace(/\/$/, '') : '';
        return itemPath === pagePath || normalize(item.title) === pageTitle;
      });
      if (product) render(product);
    })
    .catch(error => console.warn(error));
})();
