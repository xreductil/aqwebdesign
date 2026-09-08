(() => {
  let modal;
  let lastFocusedCard;

  const formatPrice = value => `NT$${Number(value || 0).toLocaleString('zh-TW')}`;

  const parsePrices = value => {
    const text = String(value || '');
    const structured = [...text.matchAll(/(?:^|\|)([^=|]+)=([\d,.]+)/g)]
      .map(match => ({ label: match[1].trim(), value: Number(match[2].replace(/,/g, '')) }))
      .filter(option => option.label && Number.isFinite(option.value));
    if (structured.length) return structured;
    const sizes = [...text.matchAll(/\b([ML])\s*NT\$\s*([\d,.]+)/gi)]
      .map(match => ({ label: match[1].toUpperCase(), value: Number(match[2].replace(/,/g, '')) }))
      .filter(option => Number.isFinite(option.value));
    if (sizes.length) return sizes;
    const single = text.match(/NT\$\s*([\d,.]+)/i) || text.match(/([\d,.]+)/);
    return [{ label: '單杯', value: Number(single?.[1]?.replace(/,/g, '') || 0) }];
  };

  const renderOptions = (name, options, selected) => options.map(option => {
    const value = typeof option === 'object' ? option.label : option;
    const label = typeof option === 'object' ? option.label : option;
    return `<label class="drink-menu-modal-option"><input type="radio" name="${name}" value="${value}"${value === selected ? ' checked' : ''}><span>${label}</span></label>`;
  }).join('');

  const ensureModal = () => {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'drink-menu-modal';
    modal.hidden = true;
    modal.innerHTML = `<div class="drink-menu-modal-backdrop" data-drink-modal-close></div><article class="drink-menu-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="drink-menu-modal-title"><button class="drink-menu-modal-close" type="button" data-drink-modal-close aria-label="關閉商品說明">×</button><div class="drink-menu-modal-content"><div class="drink-menu-modal-image"><img data-drink-modal-image alt=""></div><div class="drink-menu-modal-info"><p class="drink-menu-modal-category" data-drink-modal-category></p><h2 id="drink-menu-modal-title" data-drink-modal-title></h2><p class="drink-menu-modal-english" data-drink-modal-english></p><p class="drink-menu-modal-description" data-drink-modal-description></p><fieldset data-drink-modal-temperature-field><legend>溫度</legend><div class="drink-menu-modal-options" data-drink-modal-temperature></div></fieldset><fieldset><legend>糖度</legend><div class="drink-menu-modal-options" data-drink-modal-sugar></div></fieldset><fieldset data-drink-modal-size-field><legend>尺寸</legend><div class="drink-menu-modal-options" data-drink-modal-size></div></fieldset><label class="drink-menu-modal-quantity">數量<input type="number" min="1" max="99" value="1" data-drink-modal-quantity></label><div class="drink-menu-modal-footer"><div><span>目前價格</span><strong data-drink-modal-price></strong><small data-drink-modal-summary></small></div><button class="drink-menu-modal-done" type="button" data-drink-modal-add-cart>加入購物車</button></div><p class="drink-menu-modal-message" data-drink-modal-message role="status"></p></div></div></article>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      if (event.target.closest('[data-drink-modal-close]')) closeModal();
      if (event.target.matches('input[name="drink-modal-size"]')) updatePrice();
      if (event.target.closest('[data-drink-modal-add-cart]')) addToCart();
    });
    modal.addEventListener('change', event => {
      if (event.target.matches('input[name="drink-modal-size"], input[name="drink-modal-temperature"], input[name="drink-modal-sugar"]')) updatePrice();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
    return modal;
  };

  const updatePrice = () => {
    if (!modal || modal.hidden) return;
    const size = modal.querySelector('input[name="drink-modal-size"]:checked')?.value;
    const price = modal._drinkPrices.find(option => option.label === size) || modal._drinkPrices[0];
    const temperature = modal.querySelector('input[name="drink-modal-temperature"]:checked')?.value || '';
    const sugar = modal.querySelector('input[name="drink-modal-sugar"]:checked')?.value || '';
    modal.querySelector('[data-drink-modal-price]').textContent = formatPrice(price?.value);
    modal.querySelector('[data-drink-modal-summary]').textContent = [temperature, sugar, price?.label].filter(Boolean).join('・');
  };

  const openModal = card => {
    const view = ensureModal();
    const prices = parsePrices(card.dataset.drinkSizePrices || card.dataset.drinkPrices);
    const temperatures = card.dataset.drinkTemperatures
      ? card.dataset.drinkTemperatures.split('|').filter(Boolean)
      : String(card.dataset.drinkTemperature || '').includes('熱') ? ['冷', '熱'] : [card.dataset.drinkTemperature || '冷'];
    const sugars = card.dataset.drinkSugars ? card.dataset.drinkSugars.split('|').filter(Boolean) : ['正常甜', '少糖', '半糖', '微糖', '無糖'];
    view._drinkPrices = prices;
    view._drinkProductId = card.dataset.drinkProductId || '';
    view.querySelector('[data-drink-modal-image]').src = card.querySelector('img')?.src || '';
    view.querySelector('[data-drink-modal-image]').alt = `${card.dataset.drinkName || '飲品'}示意圖`;
    view.querySelector('[data-drink-modal-category]').textContent = card.dataset.drinkCategory || '';
    view.querySelector('[data-drink-modal-title]').textContent = card.dataset.drinkName || '';
    view.querySelector('[data-drink-modal-english]').textContent = card.dataset.drinkEnglish || '';
    view.querySelector('[data-drink-modal-description]').textContent = card.dataset.drinkDescription || '可依照喜好調整飲品溫度、糖度與尺寸。';
    view.querySelector('[data-drink-modal-quantity]').value = '1';
    view.querySelector('[data-drink-modal-message]').textContent = '';
    view.querySelector('[data-drink-modal-add-cart]').disabled = !view._drinkProductId;
    view.querySelector('[data-drink-modal-temperature]').innerHTML = renderOptions('drink-modal-temperature', temperatures, temperatures[0]);
    view.querySelector('[data-drink-modal-sugar]').innerHTML = renderOptions('drink-modal-sugar', sugars, sugars[0]);
    view.querySelector('[data-drink-modal-size]').innerHTML = renderOptions('drink-modal-size', prices, prices[0]?.label);
    view.querySelector('[data-drink-modal-temperature-field]').hidden = temperatures.length < 2;
    view.querySelector('[data-drink-modal-size-field]').hidden = prices.length < 2;
    view.hidden = false;
    document.body.classList.add('drink-menu-modal-open');
    lastFocusedCard = card;
    view.querySelector('.drink-menu-modal-close').focus();
    updatePrice();
  };

  const addToCart = async () => {
    if (!modal || modal.hidden || !modal._drinkProductId) return;
    const button = modal.querySelector('[data-drink-modal-add-cart]');
    const message = modal.querySelector('[data-drink-modal-message]');
    const quantityInput = modal.querySelector('[data-drink-modal-quantity]');
    const quantity = Math.max(1, Math.min(99, Number(quantityInput.value || 1)));
    quantityInput.value = String(quantity);
    const options = {
      temperature: modal.querySelector('input[name="drink-modal-temperature"]:checked')?.value || '',
      sugar: modal.querySelector('input[name="drink-modal-sugar"]:checked')?.value || '',
      size: modal.querySelector('input[name="drink-modal-size"]:checked')?.value || ''
    };
    button.disabled = true;
    button.textContent = '加入中…';
    message.textContent = '';
    try {
      const response = await fetch('/api/cart/add', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: modal._drinkProductId, qty: quantity, options }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '加入購物車失敗。');
      closeModal();
      document.querySelector('.cart-trigger')?.click();
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
      button.textContent = '加入購物車';
    }
  };

  const closeModal = () => {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('drink-menu-modal-open');
    lastFocusedCard?.focus();
  };

  const bind = () => {
    document.querySelectorAll('[data-drink-menu-item]:not([data-drink-menu-bound])').forEach(card => {
      card.dataset.drinkMenuBound = 'true';
      card.addEventListener('click', event => {
        if (event.target.closest('a, button, input, select')) return;
        openModal(card);
      });
      card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openModal(card);
      });
    });
  };

  window.initDrinkMenuModals = bind;
  bind();
  const catalogContent = document.querySelector('[data-storefront-catalog-content]');
  if (catalogContent) new MutationObserver(bind).observe(catalogContent, { childList: true, subtree: true });
})();
