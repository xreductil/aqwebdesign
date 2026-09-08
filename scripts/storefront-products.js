(() => {
  const root = document.querySelector('[data-storefront-catalog]');
  if (!root) return;

  const content = root.querySelector('[data-storefront-catalog-content]');
  const status = root.querySelector('[data-storefront-catalog-status]');
  const view = root.dataset.storefrontView || 'overview';
  const categoryRoutes = {
    '生日蛋糕': '/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/',
    '造型蛋糕': '/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/',
    '冰淇淋蛋糕': '/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e7%94%9f%e6%97%a5%e8%9b%8b%e7%b3%95-%e4%b8%8b%e6%96%b9%e6%9c%89dm%e4%be%9b%e4%b8%8b%e8%bc%89-264/',
    '伴手禮': '/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/%e4%bc%b4%e6%89%8b%e7%a6%ae/'
  };
  const categoryMeta = {
    '生日蛋糕': { eyebrow: 'BIRTHDAY CAKE', icon: '/assets/images/icon-cake.png' },
    '造型蛋糕': { eyebrow: 'CARTOON SHAPE CAKE', icon: '/assets/images/icon-cake.png' },
    '冰淇淋蛋糕': { eyebrow: 'ICE CREAM CAKE', icon: '/assets/images/icon-cake2.png' },
    '伴手禮': { eyebrow: 'SOUVENIR', icon: '/assets/images/icon-cupcake.png' }
  };
  const categoryOrder = ['生日蛋糕', '造型蛋糕', '冰淇淋蛋糕', '伴手禮'];
  const hotProductFallback = ['oreo-ice-cream', 'colorful-world', 'macaron-forest', 'caramel-party', 'passion-pear', 'berry-melody'];
  const newProductFallback = ['emerald-lysk', 'strawberry-lysk'];
  const drinkMenuSections = [
    { title: '咖啡類', items: [
      ['黑咖啡', 'Black Coffee', '冷／熱', 'M NT$65 · L NT$80'], ['原味拿鐵', 'Coffee Latte', '冷／熱', 'M NT$85 · L NT$100'],
      ['青梅氣泡冰咖啡', 'Green plum sparkling coffee', '冷', 'NT$95'], ['西西里青檸冰咖啡', 'Lemon ice coffee', '冷', 'NT$75'],
      ['纖橙冰咖啡', 'Orange ice coffee', '冷', 'NT$75'], ['卡布奇諾', 'Cappuccino', '冷／熱', 'M NT$85 · L NT$100'],
      ['摩卡', 'Mocha', '冷／熱', 'M NT$90 · L NT$110'], ['焦糖瑪奇朵', 'Caramel macchiato', '冷／熱', 'M NT$95 · L NT$115'],
      ['麥芽威士忌拿鐵', 'Whisky Latte', '冷／熱', 'M NT$95 · L NT$115'], ['香草拿鐵', 'Flavored Latte (Vanilla)', '冷／熱', 'M NT$90 · L NT$110'],
      ['榛果拿鐵', 'Flavored Latte (Hazelnut)', '冷／熱', 'M NT$90 · L NT$110']
    ]},
    { title: '氣泡飲類', items: [
      ['香橙泡泡', 'Orange bubble drink', '冷', 'NT$75'], ['柚子泡泡', 'Pomelo bubble drink', '冷', 'NT$75'],
      ['葡萄泡泡', 'Grape bubble drink', '冷', 'NT$75'], ['水蜜桃泡泡', 'Peach bubble drink', '冷', 'NT$75'],
      ['蔓越莓氣泡果醋', 'Cranberry vinegar bubble drink', '冷', 'NT$75']
    ]},
    { title: '茶飲類', items: [
      ['英式紅茶', 'Black tea', '冷／熱', 'NT$55'], ['森森綠茶', 'Green tea', '冷／熱', 'NT$55'],
      ['台茶12號', 'Jin Xuan Oolong tea', '冷／熱', 'NT$65'], ['玄米綠茶', 'Brown rice tea', '冷／熱', 'NT$65'],
      ['韓式柚子飲', 'Pomelo tea', '冷／熱', 'NT$75'], ['花果蜜茶', 'Fruit honey tea', '冷／熱', 'NT$75'],
      ['養生花茶', 'Scented tea', '冷／熱', 'NT$75'], ['伯爵紅茶', 'Earl black tea', '冷／熱', 'NT$65'],
      ['柚香綠茶', 'Pomelo tea', '冷／熱', 'NT$75']
    ]},
    { title: '奶茶類', items: [
      ['就是奶茶', 'British milk tea', '冷／熱', 'M NT$75 · L NT$85'], ['伯爵奶茶', 'Earl milk tea', '冷／熱', 'M NT$75 · L NT$85'],
      ['黑糖歐蕾', 'Brown sugar au lait', '冷／熱', 'M NT$80 · L NT$95'], ['可可歐蕾', 'Cocoa au lait', '冷／熱', 'M NT$90 · L NT$105'],
      ['抹茶歐蕾', 'Matcha au lait', '冷／熱', 'M NT$90 · L NT$105']
    ]}
  ];
  const drinkMenuImages = {
    '咖啡類': '/assets/images/coffee.jpg',
    '氣泡飲類': '/assets/images/yogurt-drink.jpg',
    '茶飲類': '/assets/images/tea-12-number.jpg',
    '奶茶類': '/assets/images/coffee-2.jpg'
  };
  const drinkEnglishByTitle = Object.fromEntries(drinkMenuSections.flatMap(section => section.items.map(item => [item[0], item[1]])));
  const birthdayProductOrder = [
    'emerald-lysk', 'strawberry-lysk', 'caramel-party', 'gulava',
    'passion-pear', 'colorful-world', 'mocha', 'hazelnut-crunch',
    'black-forest', 'souffle', 'macaron-forest', 'strawberry-shudo',
    'rose-bouquet', 'bodhi-cake', 'puff-kingdom', 'uji-hayakaze',
    'blueberry-lysk', 'angel-cake'
  ];
  const orderProducts = products => products
    .map((product, index) => ({ product, index }))
    .sort((a, b) => {
      if (a.product.cat !== '生日蛋糕' || b.product.cat !== '生日蛋糕') return a.index - b.index;
      const aRank = birthdayProductOrder.indexOf(a.product.id);
      const bRank = birthdayProductOrder.indexOf(b.product.id);
      return (aRank < 0 ? Number.MAX_SAFE_INTEGER : aRank) - (bRank < 0 ? Number.MAX_SAFE_INTEGER : bRank) || a.index - b.index;
    })
    .map(({ product }) => product);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const normalizeTitle = value => String(value || '').replace(/<br\s*\/?\s*>/gi, '').replace(/\s+/g, '').replace(/[（(]季節限定[）)]/g, '（季節限定）');
  const money = value => {
    const amount = Number(value || 0);
    return amount > 0 ? `NT$${amount.toLocaleString('zh-TW')}` : '價格洽詢';
  };
  const pathMap = (() => {
    try { return JSON.parse(root.dataset.productPaths || '{}'); } catch (error) { return {}; }
  })();
  const detailPath = product => product.url || pathMap[normalizeTitle(product.title)] || '';
  const imagePath = product => product.img || '/assets/images/icon-cake.png';
  const available = product => product.published !== false && Number(product.priceValue || 0) > 0 && Number(product.quantity ?? 1) > 0;

  const productLink = (product, className, body) => {
    const href = detailPath(product);
    return `<a class="${className}" href="${escapeHtml(href || '#')}"${href ? '' : ' data-product-no-detail="true"'}>${body}</a>`;
  };

  const storefrontProductCard = (product, { articleClass, badge = '' } = {}) => {
    const name = String(product.title || '商品');
    const title = escapeHtml(name).replace(/[（(]季節限定[）)]/, '<br>（季節限定）');
    const body = `<span class="cake-product-image"><img src="${escapeHtml(imagePath(product))}" alt="${escapeHtml(name)}" loading="lazy"></span>`;
    const meta = `<span class="cake-product-title">${title}</span><span class="cake-product-price">${escapeHtml(money(product.priceValue))}</span>`;
    return `<article class="${articleClass}${badge ? ' product-intro-featured-card' : ''}">${badge ? `<span class="product-intro-featured-badge">${escapeHtml(badge)}</span>` : ''}<div>${productLink(product, 'cake-product-card-link', body)}</div><div class="cake-product-meta">${productLink(product, 'cake-product-title-link', meta)}</div></article>`;
  };

  const productIntroCard = (product, badge = '') => storefrontProductCard(product, { articleClass: 'product-intro-card cake-product-card', badge });

  const cakeCard = product => {
    return storefrontProductCard(product, { articleClass: 'cake-product-card' });
  };

  const souvenirCard = product => storefrontProductCard(product, { articleClass: 'souvenir-card cake-product-card' });

  const heading = (category, icon = true) => {
    const meta = categoryMeta[category] || { eyebrow: category, icon: '/assets/images/icon-cake.png' };
    return `<div class="product-intro-section-heading"><div><p>${escapeHtml(meta.eyebrow)}</p><h2>${icon ? `<img src="${escapeHtml(meta.icon)}" alt="" aria-hidden="true">` : ''}${escapeHtml(category)}</h2></div><div class="product-intro-carousel-controls"><button type="button" data-storefront-previous aria-label="向左滑動">‹</button><button type="button" data-storefront-next aria-label="向右滑動">›</button></div></div>`;
  };

  const selectFeaturedProducts = (products, rankKey, fallbackIds, limit = 6) => {
    const byId = new Map(products.map(product => [product.id, product]));
    const ranked = products
      .filter(product => rankKey === 'newArrivalRank'
        ? product.newArrival === true || Number(product[rankKey]) > 0
        : Number(product[rankKey]) > 0)
      .sort((a, b) => {
        if (rankKey === 'salesCount') return Number(b[rankKey]) - Number(a[rankKey]);
        if (rankKey === 'newArrivalRank') {
          const aRank = Number(a[rankKey]) || Number.MAX_SAFE_INTEGER;
          const bRank = Number(b[rankKey]) || Number.MAX_SAFE_INTEGER;
          return aRank - bRank || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        return Number(a[rankKey]) - Number(b[rankKey]);
      });
    const fallback = fallbackIds.map(id => byId.get(id)).filter(Boolean);
    const recent = rankKey === 'newArrivalRank'
      ? products.filter(product => product.createdAt && product.newArrival !== false).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      : [];
    return [...new Map([...ranked, ...fallback, ...recent, ...products].map(product => [product.id, product])).values()].slice(0, limit);
  };

  const renderFeaturedSection = (products, { eyebrow, title, icon, badge }) => {
    if (!products.length) return '';
    return `<section class="product-intro-section product-intro-featured-section" data-storefront-section><div class="product-intro-section-heading"><div><p>${escapeHtml(eyebrow)}</p><h2><img src="${escapeHtml(icon)}" alt="" aria-hidden="true">${escapeHtml(title)}</h2></div><div class="product-intro-carousel-controls"><button type="button" data-storefront-previous aria-label="向左滑動">‹</button><button type="button" data-storefront-next aria-label="向右滑動">›</button></div></div><div class="product-intro-carousel"><div class="product-intro-track" data-storefront-track tabindex="0">${products.map((product, index) => productIntroCard(product, typeof badge === 'function' ? badge(product, index) : badge)).join('')}</div></div></section>`;
  };

  const renderOverviewSection = (category, products) => `<section class="product-intro-section" data-storefront-section><div class="product-intro-section-heading"><div><p>${escapeHtml((categoryMeta[category] || {}).eyebrow || category)}</p><h2><img src="${escapeHtml((categoryMeta[category] || {}).icon || '/assets/images/icon-cake.png')}" alt="" aria-hidden="true">${escapeHtml(category)}</h2></div><div class="product-intro-carousel-controls"><button type="button" data-storefront-previous aria-label="向左滑動">‹</button><button type="button" data-storefront-next aria-label="向右滑動">›</button></div></div><div class="product-intro-carousel"><div class="product-intro-track" data-storefront-track tabindex="0">${products.map(productIntroCard).join('')}</div></div><a class="product-intro-load-more" href="${escapeHtml(categoryRoutes[category] || '/%e7%94%a2%e5%93%81%e4%bb%8b%e7%b4%b9/')}">查看全部商品</a></section>`;

  const drinkMenuFallbackProducts = drinkMenuSections.flatMap(section => section.items.map(item => ({ title: item[0], english: item[1], drinkCategory: section.title, temperature: item[2], priceLabel: item[3], img: drinkMenuImages[section.title] })));
  const drinkMenuCard = product => {
    const category = product.drinkCategory || '咖啡類';
    const variants = product.variants || {};
    const sizes = Object.entries(variants.sizes || {}).filter(([, value]) => Number.isFinite(Number(value)));
    const sizePrices = sizes.length ? sizes : [['單杯', Number(product.priceValue || 0)]];
    const temperatures = Array.isArray(variants.temperatures) && variants.temperatures.length ? variants.temperatures : String(product.temperature || '冷').split('／');
    const sugars = Array.isArray(variants.sugars) && variants.sugars.length ? variants.sugars : ['正常甜', '少糖', '半糖', '微糖', '無糖'];
    const image = product.img || drinkMenuImages[category] || '/assets/images/coffee.jpg';
    const title = product.title || '飲品';
    const english = product.english || product.enTitle || drinkEnglishByTitle[title] || '';
    return `<article class="product-intro-card drink-menu-card cake-product-card" data-drink-menu-item data-drink-product-id="${escapeHtml(product.id || '')}" data-drink-name="${escapeHtml(title)}" data-drink-english="${escapeHtml(english)}" data-drink-category="${escapeHtml(category)}" data-drink-temperatures="${escapeHtml(temperatures.join('|'))}" data-drink-sugars="${escapeHtml(sugars.join('|'))}" data-drink-size-prices="${escapeHtml(sizePrices.map(([size, value]) => `${size}=${Number(value)}`).join('|'))}" data-drink-description="${escapeHtml(product.desc || '')}" role="button" tabindex="0"><div class="cake-product-image drink-menu-card-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}飲品示意圖" loading="lazy"><span class="drink-menu-card-category">${escapeHtml(category)}</span></div><div class="cake-product-meta"><div class="cake-product-title-link"><span class="cake-product-title">${escapeHtml(title)}</span><span class="drink-menu-card-english">${escapeHtml(english)}</span></div></div></article>`;
  };
  const renderMenuSection = (products = []) => {
    const drinks = products.length ? products : drinkMenuFallbackProducts;
    return `<section class="product-intro-section" data-storefront-section data-storefront-menu-section><div class="product-intro-section-heading"><div><p>DRINK MENU</p><h2><img src="/assets/images/icon-coffee.png" alt="" aria-hidden="true">飲品 MENU</h2></div><div class="product-intro-carousel-controls"><button type="button" data-storefront-previous aria-label="向左滑動">‹</button><button type="button" data-storefront-next aria-label="向右滑動">›</button></div></div><div class="product-intro-carousel"><div class="product-intro-track" data-storefront-track tabindex="0">${drinks.map(drinkMenuCard).join('')}</div></div><a class="product-intro-load-more" href="/%e6%a3%ae%e6%a3%ae%e5%92%96%e5%95%a1/">查看完整飲品 MENU</a></section>`;
  };

  const renderCakes = products => {
    const categories = categoryOrder.filter(category => category !== '伴手禮' && products.some(product => product.cat === category));
    content.innerHTML = categories.map((category, index) => {
      const categoryProducts = products.filter(product => product.cat === category);
      const visible = category === '生日蛋糕' ? categoryProducts.slice(0, 10) : categoryProducts;
      const extra = category === '生日蛋糕' ? categoryProducts.slice(10) : [];
      return `<section class="cake-category ${index === 0 ? 'is-first' : ''}"><div class="cake-category-heading">${index === 0 ? `<img class="cake-section-icon" src="${escapeHtml((categoryMeta[category] || {}).icon || '/assets/images/icon-cake.png')}" alt="" aria-hidden="true">` : ''}<p>${escapeHtml((categoryMeta[category] || {}).eyebrow || category)}</p><h2>${escapeHtml(category)}</h2></div><div class="cake-product-grid">${visible.map(cakeCard).join('')}</div>${extra.length ? `<div class="cake-product-grid cake-product-grid-more" data-cake-load-more-items hidden>${extra.map(cakeCard).join('')}</div><div class="cake-load-more"><button class="cake-load-more-button" type="button" data-cake-load-more aria-expanded="false">▪▪ Load more</button></div>` : ''}</section>`;
    }).join('') || '<p class="storefront-catalog-empty">目前沒有已上架的商品。</p>';
  };

  const renderSouvenirs = products => {
    const items = products.filter(product => product.cat === '伴手禮');
    content.innerHTML = `<section class="souvenir-products"><img class="souvenir-icon" src="/assets/images/icon-cupcake.png" alt="" aria-hidden="true"><div class="souvenir-grid">${items.map(souvenirCard).join('')}</div>${items.length ? '' : '<p class="storefront-catalog-empty">目前沒有已上架的商品。</p>'}</section>`;
  };

  const bindInteractions = () => {
    content.querySelectorAll('[data-storefront-previous], [data-storefront-next]').forEach(button => button.addEventListener('click', () => {
      const track = button.closest('[data-storefront-section]')?.querySelector('[data-storefront-track]');
      if (track) track.scrollBy({ left: (button.hasAttribute('data-storefront-previous') ? -1 : 1) * Math.max(track.clientWidth * .82, 260), behavior: 'smooth' });
    }));
    content.addEventListener('click', event => {
      const button = event.target.closest('[data-cake-load-more]');
      if (!button || !content.contains(button)) return;
      event.preventDefault();
      const items = button.closest('.cake-category')?.querySelector('[data-cake-load-more-items]');
      if (!items) return;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      items.classList.toggle('is-expanded', !expanded);
      items.hidden = expanded;
      button.setAttribute('aria-expanded', String(!expanded));
      button.textContent = expanded ? '▪▪ Load more' : '▪▪ 收起商品';
    });
    content.addEventListener('click', event => {
      if (event.target.closest('a, button')) return;
      const card = event.target.closest('.cake-product-card');
      const link = card?.querySelector('a[href]:not([href="#"])');
      if (link) link.click();
    });
    content.querySelectorAll('[data-product-no-detail]').forEach(link => link.addEventListener('click', event => event.preventDefault()));
  };

  const load = async () => {
    try {
      const response = await fetch('/api/products', { credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || '商品資料暫時無法載入。');
      const products = orderProducts((data.products || []).filter(product => product.published !== false));
      if (view === 'overview') {
        const hotProducts = selectFeaturedProducts(products, 'salesCount', hotProductFallback, 5);
        const newProducts = selectFeaturedProducts(products, 'newArrivalRank', newProductFallback);
        const drinkProducts = products.filter(product => product.cat === '飲品 MENU');
        const groups = categoryOrder.filter(category => products.some(product => product.cat === category)).map(category => renderOverviewSection(category, products.filter(product => product.cat === category)));
        content.innerHTML = renderFeaturedSection(hotProducts, { eyebrow: 'BEST SELLERS', title: '熱銷排行榜', icon: '/assets/images/icon-cake.png', badge: (_, index) => `TOP ${index + 1}` })
          + renderFeaturedSection(newProducts, { eyebrow: 'NEW ARRIVALS', title: '新品上市', icon: '/assets/images/icon-wheat.png', badge: 'NEW' })
          + groups.join('') + renderMenuSection(drinkProducts);
      } else if (view === 'cakes') {
        renderCakes(products);
      } else {
        renderSouvenirs(products);
      }
      status.hidden = true;
      bindInteractions();
    } catch (error) {
      status.textContent = error.message;
      status.className = 'storefront-catalog-error';
    }
  };

  load();
})();
