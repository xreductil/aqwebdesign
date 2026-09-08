(() => {
  const section = document.querySelector('[data-home-news-section]');
  const list = document.querySelector('[data-home-news-list]');
  if (!section || !list) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const formatDate = value => {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const render = articles => {
    const visible = Array.isArray(articles) ? articles.slice(0, 3) : [];
    if (!visible.length) {
      section.hidden = true;
      return;
    }
    list.innerHTML = visible.map(article => `<a class="home-news-card" href="/latest-news/article/${escapeHtml(encodeURIComponent(article.slug || article.id || ''))}/">
      <small>${escapeHtml(formatDate(article.publishAt || article.createdAt))}</small><h3>${escapeHtml(article.title || '最新消息')}</h3><span>更多</span>
    </a>`).join('');
    section.hidden = false;
  };

  fetch('/api/news', { credentials: 'include', headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Unable to load news.')))
    .then(data => render(data.news))
    .catch(() => render([]));
})();
