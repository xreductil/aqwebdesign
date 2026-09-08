(() => {
  const page = document.querySelector('[data-latest-news-article-page]');
  if (!page) return;
  if (page.dataset.articleHydrated === 'true') return;

  const status = page.querySelector('[data-article-status]');
  const imageContainer = page.querySelector('[data-article-image]');
  const date = page.querySelector('[data-article-date]');
  const category = page.querySelector('[data-article-category]');
  const title = page.querySelector('[data-article-title]');
  const content = page.querySelector('[data-article-content]');
  const categoryLabels = {
    'season-only': '季節限定',
    'new-arrival': '新品上市',
    'latest-news': '最新消息',
    'sensen-coffee': '森森飲品'
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const imageUrl = value => {
    const image = String(value || '').trim();
    if (!image) return '';
    try {
      const source = new URL(image, window.location.origin);
      if (source.hostname === 'www.sensen.com.tw' && source.pathname.startsWith('/wp-content/uploads/')) {
        return '/images/legacy-news?url=' + encodeURIComponent(source.href);
      }
    } catch {}
    if (/^(https?:|data:|\/)/i.test(image)) return image;
    return '/assets/images/' + image.replace(/^\.\//, '').replace(/^assets\/images\//, '');
  };

  const formatDate = value => {
    const parsed = new Date(value || 0);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const imageLinePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;
  const plainTextToHtml = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
  const articleParts = value => {
    const lines = String(value || '').split(/\r?\n/);
    return {
      images: lines.map(line => line.trim()).filter(line => imageLinePattern.test(line)),
      copy: lines.filter(line => !imageLinePattern.test(line.trim())).map(escapeHtml).join('<br>')
    };
  };
  const articleId = new URLSearchParams(window.location.search).get('id') || decodeURIComponent(window.location.pathname.match(/^\/latest-news\/article\/([^/]+)\/?$/)?.[1] || '');

  const showError = message => {
    status.textContent = message;
    status.classList.add('is-error');
  };

  if (!articleId) {
    showError('找不到這則最新消息。');
    return;
  }

  fetch('/api/news?id=' + encodeURIComponent(articleId), {
    credentials: 'include',
    headers: { Accept: 'application/json' }
  })
    .then(response => {
      if (!response.ok) throw new Error('目前無法載入這則最新消息。');
      return response.json();
    })
    .then(data => {
      const article = Array.isArray(data.news) ? data.news[0] : null;
      if (!article) throw new Error('找不到這則最新消息，可能已下架或不存在。');

      status.hidden = true;
      document.title = article.title + ' – 森森點心坊';
      title.textContent = article.title || '最新消息';
      date.innerHTML = '<span aria-hidden="true">◷</span>' + escapeHtml(formatDate(article.publishAt || article.createdAt));
      category.textContent = categoryLabels[article.category] || article.category || '最新消息';
      const parts = articleParts(article.content || article.excerpt || '目前沒有文章內容。');
      content.innerHTML = parts.copy;

      if (Array.isArray(article.layout) && article.layout.length) {
        const shell = imageContainer.parentElement;
        const allowed = new Set(['date', 'title', 'copy', 'image', 'gallery', 'text']);
        const blocks = article.layout.filter(block => block && allowed.has(block.type));
        const safeLink = value => /^(https?:\/\/|\/)/i.test(String(value || '').trim()) ? String(value).trim() : '';
        const blockHtml = block => ({
          date: '<p class="latest-news-layout-date"><span aria-hidden="true">◷</span>' + escapeHtml(formatDate(article.publishAt || article.createdAt)) + '</p>',
          title: '<h1 class="latest-news-layout-title">' + escapeHtml(article.title || '最新消息') + '</h1>',
          copy: '<div class="latest-news-layout-copy">' + parts.copy + '</div>',
          text: '<div class="latest-news-layout-copy">' + plainTextToHtml(block.value || '') + '</div>',
          gallery: '<div class="latest-news-layout-gallery">' + (Array.isArray(block.images) ? block.images : []).map(image => '<img class="latest-news-layout-image" src="' + escapeHtml(imageUrl(image)) + '" alt="' + escapeHtml(article.title) + '－內文圖片" loading="lazy">').join('') + '</div>',
          image: '<img class="latest-news-layout-image" src="' + escapeHtml(imageUrl(block.src)) + '" alt="' + escapeHtml(article.title) + '－內文圖片" loading="lazy">'
        }[block.type]);
        shell.className = 'latest-news-article-shell is-free-layout';
        shell.innerHTML = blocks.map(block => {
          const markup = blockHtml(block);
          const link = safeLink(block.link);
          return '<section class="latest-news-layout-block span-' + (Number(block.span) === 6 ? '6' : '12') + '">' + (link ? '<a class="latest-news-layout-link" href="' + escapeHtml(link) + '">' + markup + '</a>' : markup) + '</section>';
        }).join('');
        return;
      }

      // Only article-specific images appear here; the cover stays on listing cards.
      imageContainer.innerHTML = parts.images.map((image, index) =>
        '<img src="' + escapeHtml(imageUrl(image)) + '" alt="' + escapeHtml(article.title) + '－內文圖片 ' + (index + 1) + '" loading="lazy">'
      ).join('');
      imageContainer.hidden = parts.images.length === 0;
      category.hidden = true;
      const header = document.createElement('header');
      header.className = 'latest-news-article-header';
      header.append(date, title);
      imageContainer.parentElement.insertBefore(header, imageContainer);
    })
    .catch(error => showError(error.message || '目前無法載入這則最新消息。'));
})();
