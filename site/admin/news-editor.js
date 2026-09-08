(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const form = $('#news-form');
  const message = $('#news-message');
  const items = $('[data-news-items]');
  let articles = [];
  let contentImages = [];
  let layout = [];
  let pendingImageAction = null;
  const selectedImageIds = new Set();
  const imageLinePattern = /^(?:https?:\/\/|\/images\/)\S+\.(?:avif|gif|jpe?g|png|webp)(?:\?\S*)?$/i;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const api = async (path, options = {}) => {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || '操作失敗。');
    return data;
  };

  const setMessage = (text, type = '') => {
    message.textContent = text;
    message.className = type === 'error' ? 'text-danger small mb-3' : type === 'success' ? 'text-success small mb-3' : 'text-secondary small mb-3';
  };

  const toInputDate = value => {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return '';
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  const toIsoDate = value => {
    if (!value) return new Date().toISOString();
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  };

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

  const splitContent = value => {
    const lines = String(value || '').split(/\r?\n/);
    return {
      images: lines.map(line => line.trim()).filter(line => imageLinePattern.test(line)),
      copy: lines.filter(line => !imageLinePattern.test(line.trim())).join('\n').trim()
    };
  };

  const blockId = () => crypto.randomUUID ? crypto.randomUUID() : `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const defaultLayout = images => [
    { id: blockId(), type: 'date', span: 12 },
    { id: blockId(), type: 'title', span: 12 },
    ...(images.length ? [{ id: blockId(), type: 'gallery', images: [...images], span: 6 }] : []),
    { id: blockId(), type: 'copy', span: images.length ? 6 : 12 }
  ];

  const normalizeLayout = (value, images) => {
    if (!Array.isArray(value) || !value.length) return defaultLayout(images);
    const blocks = value.filter(block => block && ['date', 'title', 'copy', 'image', 'gallery', 'text'].includes(block.type)).map(block => ({
      id: String(block.id || blockId()),
      type: block.type,
      ...(block.type === 'image' ? { src: String(block.src || '') } : {}),
      ...(block.type === 'gallery' ? { images: Array.isArray(block.images) ? block.images.map(String).filter(Boolean) : [] } : {}),
      ...(block.type === 'text' ? { value: String(block.value || '') } : {}),
      ...(block.link ? { link: String(block.link) } : {}),
      span: Number(block.span) === 6 ? 6 : 12
    })).filter(block => (block.type !== 'image' || block.src) && (block.type !== 'gallery' || block.images.length));
    if (!blocks.some(block => block.type === 'date')) blocks.unshift({ id: blockId(), type: 'date', span: 12 });
    if (!blocks.some(block => block.type === 'title')) blocks.unshift({ id: blockId(), type: 'title', span: 12 });
    if (!blocks.some(block => block.type === 'copy')) blocks.push({ id: blockId(), type: 'copy', span: images.length ? 6 : 12 });
    images.forEach(src => { if (!blocks.some(block => (block.type === 'image' && block.src === src) || (block.type === 'gallery' && block.images.includes(src)))) blocks.push({ id: blockId(), type: 'image', src, span: 6 }); });
    return blocks;
  };

  const safeLink = value => {
    const link = String(value || '').trim();
    return /^(https?:\/\/|\/)/i.test(link) ? link : '';
  };

  const removeContentImage = index => {
    const [src] = contentImages.splice(index, 1);
    layout = layout.map(block => block.type === 'gallery' ? { ...block, images: block.images.filter(image => image !== src) } : block).filter(block => (block.type !== 'image' || block.src !== src) && (block.type !== 'gallery' || block.images.length));
    renderContentImages();
  };

  function renderContentImages() {
    const preview = $('[data-content-images-preview]');
    preview.innerHTML = contentImages.length
      ? contentImages.map((src, index) => `<div class="news-content-image-item"><img src="${escapeHtml(imageUrl(src))}" alt="內文圖片 ${index + 1}"><button type="button" data-remove-content-image="${index}" aria-label="移除內文圖片 ${index + 1}">&times;</button></div>`).join('')
      : '<p>尚未新增內文圖片</p>';
    $$('[data-remove-content-image]').forEach(button => button.addEventListener('click', () => {
      removeContentImage(Number(button.dataset.removeContentImage));
    }));
    renderPreview();
  }

  function startPointerDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    const canvas = $('[data-live-canvas]');
    const dragged = event.currentTarget.closest('[data-layout-id]');
    if (!dragged) return;
    dragged.classList.add('is-dragging');
    document.body.classList.add('is-layout-dragging');

    const move = pointerEvent => {
      const target = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest('[data-layout-id]');
      if (!target || target === dragged || target.parentElement !== canvas) return;
      const rect = target.getBoundingClientRect();
      const after = pointerEvent.clientY > rect.top + rect.height / 2 || (Math.abs(pointerEvent.clientY - (rect.top + rect.height / 2)) < rect.height / 3 && pointerEvent.clientX > rect.left + rect.width / 2);
      canvas.insertBefore(dragged, after ? target.nextSibling : target);
    };
    const finish = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
      dragged.classList.remove('is-dragging');
      document.body.classList.remove('is-layout-dragging');
      const byId = new Map(layout.map(block => [block.id, block]));
      layout = [...canvas.querySelectorAll('[data-layout-id]')].map(element => byId.get(element.dataset.layoutId)).filter(Boolean);
      renderPreview();
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', finish, { once: true });
    document.addEventListener('pointercancel', finish, { once: true });
  }

  function startGalleryPointerDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const dragged = event.currentTarget.closest('[data-gallery-src]');
    const gallery = dragged?.parentElement;
    const blockElement = dragged?.closest('[data-layout-index]');
    if (!dragged || !gallery || !blockElement) return;
    dragged.classList.add('is-dragging');
    document.body.classList.add('is-layout-dragging');
    const move = pointerEvent => {
      const target = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)?.closest('[data-gallery-src]');
      if (!target || target === dragged || target.parentElement !== gallery) return;
      const rect = target.getBoundingClientRect();
      gallery.insertBefore(dragged, pointerEvent.clientY > rect.top + rect.height / 2 ? target.nextSibling : target);
    };
    const finish = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
      const block = layout[Number(blockElement.dataset.layoutIndex)];
      if (block?.type === 'gallery') block.images = [...gallery.querySelectorAll('[data-gallery-src]')].map(item => item.dataset.gallerySrc);
      dragged.classList.remove('is-dragging');
      document.body.classList.remove('is-layout-dragging');
      renderPreview();
    };
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerup', finish, { once: true });
    document.addEventListener('pointercancel', finish, { once: true });
  }

  function renderPreview() {
    const title = form.elements.title.value.trim() || '文章標題預覽';
    const excerpt = form.elements.excerpt.value.trim() || form.elements.content.value.trim() || '內容摘要會顯示在這裡。';
    const image = imageUrl(form.elements.image.value);
    $('[data-preview-title]').textContent = title;
    $('[data-preview-excerpt]').textContent = excerpt.slice(0, 120);
    const media = $('[data-preview-media]');
    media.innerHTML = image ? `<img src="${escapeHtml(image)}" alt="">` : '尚未設定封面圖片';

    const previewDate = new Date(form.elements.publishAt.value || Date.now());
    const dateText = Number.isNaN(previewDate.getTime()) ? '' : previewDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const blockContent = (block, index) => ({
      date: `<p class="news-layout-date">${escapeHtml(dateText)}</p>`,
      title: `<h2 contenteditable="true" role="textbox" data-layout-edit="title">${escapeHtml(title)}</h2>`,
      copy: `<div class="news-layout-copy" contenteditable="true" role="textbox" aria-multiline="true" data-layout-edit="copy">${escapeHtml(form.elements.content.value.trim() || '文章內容會顯示在這裡。').replace(/\r?\n/g, '<br>')}</div>`,
      text: `<div class="news-layout-copy" contenteditable="true" role="textbox" aria-multiline="true" data-layout-edit="text" data-layout-edit-index="${index}">${escapeHtml(block.value || '新增文字區塊').replace(/\r?\n/g, '<br>')}</div>`,
      gallery: `<div class="news-layout-gallery">${(Array.isArray(block.images) ? block.images : []).map((src, imageIndex) => `<figure class="news-layout-gallery-item" data-gallery-src="${escapeHtml(src)}"><div class="news-gallery-toolbar"><button type="button" data-gallery-delete="${imageIndex}" aria-label="刪除群組內照片">刪除</button><button type="button" data-gallery-move="${imageIndex}" data-direction="-1">↑</button><button type="button" data-gallery-move="${imageIndex}" data-direction="1">↓</button></div><img src="${escapeHtml(imageUrl(src))}" alt="內文圖片"></figure>`).join('')}</div>`,
      image: `<figure><img src="${escapeHtml(imageUrl(block.src))}" alt="內文圖片"></figure>`
    }[block.type]);
    $('[data-live-canvas]').innerHTML = layout.map((block, index) => `<section class="news-layout-block span-${block.span}${selectedImageIds.has(block.id) ? ' is-selected' : ''}" data-layout-index="${index}" data-layout-id="${escapeHtml(block.id)}">
      <div class="news-layout-toolbar"><button type="button" data-layout-drag="${index}" aria-label="按住並拖曳此區塊">⠿ 拖移</button><button type="button" data-layout-move="${index}" data-direction="-1">↑</button><button type="button" data-layout-move="${index}" data-direction="1">↓</button><button type="button" data-layout-span="${index}">${block.span === 12 ? '半寬' : '全寬'}</button><button type="button" data-layout-link="${index}">${block.link ? '改連結' : '連結'}</button>${block.type === 'image' ? `<button type="button" data-layout-select="${index}">${selectedImageIds.has(block.id) ? '取消選取' : '選取'}</button><button type="button" data-layout-replace="${index}">更換</button>` : ''}${block.type === 'gallery' ? `<button type="button" data-gallery-add="${index}">＋群組圖片</button><button type="button" data-layout-ungroup="${index}">取消群組</button>` : ''}<button type="button" data-layout-add-text="${index}">＋文字</button><button type="button" data-layout-add-image="${index}">＋圖片</button>${['image', 'gallery', 'text'].includes(block.type) ? `<button type="button" data-layout-delete="${index}">刪除</button>` : ''}</div>
      ${block.link ? `<div class="news-layout-link" title="連結：${escapeHtml(safeLink(block.link))}">${blockContent(block, index)}</div>` : blockContent(block, index)}
    </section>`).join('');
    $$('[data-layout-span]').forEach(button => button.addEventListener('click', () => {
      const block = layout[Number(button.dataset.layoutSpan)];
      block.span = block.span === 12 ? 6 : 12;
      renderPreview();
    }));
    $$('[data-layout-move]').forEach(button => button.addEventListener('click', () => {
      const from = Number(button.dataset.layoutMove), to = from + Number(button.dataset.direction);
      if (!layout[to]) return;
      [layout[from], layout[to]] = [layout[to], layout[from]];
      renderPreview();
    }));
    $$('[data-layout-select]').forEach(button => button.addEventListener('click', () => {
      const block = layout[Number(button.dataset.layoutSelect)];
      if (selectedImageIds.has(block.id)) selectedImageIds.delete(block.id); else selectedImageIds.add(block.id);
      renderPreview();
    }));
    $$('[data-layout-ungroup]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.layoutUngroup), block = layout[index];
      const images = block.images.map(src => ({ id: blockId(), type: 'image', src, span: block.span }));
      layout.splice(index, 1, ...images);
      renderPreview();
    }));
    $$('[data-layout-link]').forEach(button => button.addEventListener('click', () => {
      const block = layout[Number(button.dataset.layoutLink)];
      const value = window.prompt('輸入連結網址；留空可移除連結。', block.link || 'https://');
      if (value === null) return;
      const link = safeLink(value);
      if (value.trim() && !link) return setMessage('連結需使用 https://、http:// 或站內 / 路徑。', 'error');
      if (link) block.link = link; else delete block.link;
      renderPreview();
    }));
    $$('[data-layout-add-text]').forEach(button => button.addEventListener('click', () => {
      layout.splice(Number(button.dataset.layoutAddText) + 1, 0, { id: blockId(), type: 'text', value: '新增文字區塊', span: 12 });
      renderPreview();
    }));
    $$('[data-layout-add-image]').forEach(button => button.addEventListener('click', () => {
      pendingImageAction = { type: 'insert', index: Number(button.dataset.layoutAddImage) + 1 };
      $('#news-content-images').click();
    }));
    $$('[data-layout-replace]').forEach(button => button.addEventListener('click', () => {
      pendingImageAction = { type: 'replace', index: Number(button.dataset.layoutReplace) };
      $('#news-content-images').click();
    }));
    $$('[data-gallery-add]').forEach(button => button.addEventListener('click', () => {
      pendingImageAction = { type: 'gallery-add', id: layout[Number(button.dataset.galleryAdd)].id };
      $('#news-content-images').click();
    }));
    $$('[data-layout-delete]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.layoutDelete), block = layout[index];
      if (block.type === 'image') contentImages = contentImages.filter(src => src !== block.src);
      if (block.type === 'gallery') contentImages = contentImages.filter(src => !block.images.includes(src));
      layout.splice(index, 1);
      renderContentImages();
    }));
    $$('[data-layout-drag]').forEach(handle => handle.addEventListener('pointerdown', startPointerDrag));
    $$('[data-gallery-delete]').forEach(button => button.addEventListener('click', () => {
      const block = layout[Number(button.closest('[data-layout-index]').dataset.layoutIndex)];
      const index = Number(button.dataset.galleryDelete);
      const [src] = block.images.splice(index, 1);
      contentImages = contentImages.filter(image => image !== src);
      if (!block.images.length) layout = layout.filter(item => item !== block);
      renderContentImages();
    }));
    $$('[data-gallery-move]').forEach(button => button.addEventListener('click', () => {
      const block = layout[Number(button.closest('[data-layout-index]').dataset.layoutIndex)];
      const from = Number(button.dataset.galleryMove), to = from + Number(button.dataset.direction);
      if (!block?.images?.[to]) return;
      [block.images[from], block.images[to]] = [block.images[to], block.images[from]];
      renderPreview();
    }));
  }

  function resetForm() {
    form.reset();
    form.elements.id.value = '';
    form.elements.status.value = 'draft';
    form.elements.category.value = 'latest-news';
    form.elements.publishAt.value = toInputDate();
    contentImages = [];
    selectedImageIds.clear();
    layout = defaultLayout(contentImages);
    $('#news-content-images').value = '';
    renderContentImages();
    $('#news-title').focus();
    renderPreview();
    setMessage('準備新增文章。');
  }

  function openArticle(article) {
    const parts = splitContent(article.content || '');
    form.elements.id.value = article.id || '';
    form.elements.title.value = article.title || '';
    form.elements.content.value = parts.copy;
    form.elements.excerpt.value = article.excerpt || '';
    form.elements.image.value = article.image || '';
    form.elements.status.value = article.status || 'draft';
    form.elements.category.value = article.category || 'latest-news';
    form.elements.publishAt.value = toInputDate(article.publishAt || article.createdAt);
    contentImages = parts.images;
    selectedImageIds.clear();
    layout = normalizeLayout(article.layout, contentImages);
    $('#news-content-images').value = '';
    renderContentImages();
    renderPreview();
    setMessage('正在編輯「' + article.title + '」。');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderList() {
    if (!articles.length) {
      items.innerHTML = '<p class="text-secondary mb-0">目前沒有文章，請先新增一篇。</p>';
      return;
    }
    items.innerHTML = articles.map(article => `<div class="news-list-item">
      <div><strong>${escapeHtml(article.title || '未命名文章')}</strong><small>${escapeHtml(article.category || '最新消息')} · ${article.status === 'published' ? '已發布' : '草稿'} · ${escapeHtml(String(article.publishAt || '').slice(0, 10))}</small></div>
      <div class="news-list-item-actions"><button class="btn btn-sm btn-outline-primary" type="button" data-edit-news="${escapeHtml(article.id)}">編輯</button><button class="btn btn-sm btn-outline-danger" type="button" data-delete-news="${escapeHtml(article.id)}">刪除</button></div>
    </div>`).join('');
    $$('[data-edit-news]').forEach(button => button.addEventListener('click', () => {
      const article = articles.find(item => item.id === button.dataset.editNews);
      if (article) openArticle(article);
    }));
    $$('[data-delete-news]').forEach(button => button.addEventListener('click', async () => {
      const article = articles.find(item => item.id === button.dataset.deleteNews);
      if (!article || !window.confirm(`確定刪除「${article.title}」？`)) return;
      try {
        await api('/api/admin/news', { method: 'DELETE', body: JSON.stringify({ id: article.id }) });
        if (form.elements.id.value === article.id) resetForm();
        await loadArticles();
        setMessage('文章已刪除。', 'success');
      } catch (error) { setMessage(error.message, 'error'); }
    }));
  }

  async function loadArticles() {
    const data = await api('/api/admin/news');
    articles = data.news || [];
    renderList();
  }

  async function save(status) {
    const data = Object.fromEntries(new FormData(form));
    const payload = {
      id: data.id,
      title: data.title.trim(),
      content: [...contentImages, data.content.trim()].filter(Boolean).join('\n'),
      excerpt: data.excerpt.trim(),
      image: data.image.trim(),
      category: data.category,
      status,
      publishAt: toIsoDate(data.publishAt),
      layout
    };
    if (!payload.title) return setMessage('請先輸入文章標題。', 'error');
    try {
      const result = await api('/api/admin/news', { method: payload.id ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      openArticle(result.news);
      await loadArticles();
      setMessage(status === 'published' ? '文章已發布，前台重新整理後即可看到。' : '草稿已儲存。', 'success');
    } catch (error) { setMessage(error.message, 'error'); }
  }

  form.elements.title.addEventListener('input', renderPreview);
  form.elements.content.addEventListener('input', renderPreview);
  form.elements.excerpt.addEventListener('input', renderPreview);
  form.elements.image.addEventListener('input', renderPreview);
  form.elements.publishAt.addEventListener('input', renderPreview);
  $('[data-live-canvas]').addEventListener('input', event => {
    const editable = event.target.closest('[data-layout-edit]');
    if (!editable) return;
    if (editable.dataset.layoutEdit === 'title') {
      form.elements.title.value = editable.innerText.replace(/\r?\n/g, ' ').trimStart();
      $('[data-preview-title]').textContent = form.elements.title.value || '文章標題預覽';
    } else if (editable.dataset.layoutEdit === 'copy') {
      form.elements.content.value = editable.innerText;
      if (!form.elements.excerpt.value.trim()) $('[data-preview-excerpt]').textContent = form.elements.content.value.trim().slice(0, 120) || '內容摘要會顯示在這裡。';
    } else {
      layout[Number(editable.dataset.layoutEditIndex)].value = editable.innerText;
    }
  });
  $('[data-live-canvas]').addEventListener('keydown', event => {
    if (event.target.matches('[data-layout-edit="title"]') && event.key === 'Enter') { event.preventDefault(); event.target.blur(); }
  });
  $('#news-content-images').addEventListener('change', async event => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    setMessage(`正在上傳 ${files.length} 張內文圖片…`);
    event.target.disabled = true;
    try {
      for (const file of files) {
        const body = new FormData();
        body.append('image', file);
        const result = await api('/api/admin/images', { method: 'POST', body });
        if (pendingImageAction?.type === 'replace') {
          const block = layout[pendingImageAction.index];
          if (block?.type === 'image') {
            contentImages = contentImages.map(src => src === block.src ? result.image : src);
            block.src = result.image;
          }
          pendingImageAction = null;
        } else if (pendingImageAction?.type === 'gallery-add') {
          const gallery = layout.find(block => block.id === pendingImageAction.id && block.type === 'gallery');
          if (gallery) {
            contentImages.push(result.image);
            gallery.images.push(result.image);
          }
        } else {
          contentImages.push(result.image);
          const gallery = !pendingImageAction && layout.find(block => block.type === 'gallery');
          const insertion = pendingImageAction?.type === 'insert' ? pendingImageAction.index : layout.findIndex(block => block.type === 'copy');
          if (gallery) gallery.images.push(result.image);
          else layout.splice(insertion < 0 ? layout.length : insertion, 0, { id: blockId(), type: 'image', src: result.image, span: 6 });
          if (pendingImageAction?.type === 'insert') pendingImageAction.index += 1;
        }
        renderContentImages();
      }
      setMessage(`已新增 ${files.length} 張內文圖片。`, 'success');
    } catch (error) {
      setMessage(error.message, 'error');
    } finally {
      event.target.disabled = false;
      event.target.value = '';
      pendingImageAction = null;
    }
  });
  $('[data-new-article]').addEventListener('click', resetForm);
  $('[data-layout-preset-gallery]').addEventListener('click', () => {
    const dateBlock = layout.find(block => block.type === 'date') || { id: blockId(), type: 'date', span: 12 };
    const titleBlock = layout.find(block => block.type === 'title') || { id: blockId(), type: 'title', span: 12 };
    const copyBlock = layout.find(block => block.type === 'copy') || { id: blockId(), type: 'copy', span: 6 };
    dateBlock.span = 12; titleBlock.span = 12; copyBlock.span = 6;
    const extras = layout.filter(block => ['text'].includes(block.type));
    layout = [dateBlock, titleBlock, { id: blockId(), type: 'gallery', images: [...contentImages], span: 6 }, copyBlock, ...extras].filter(block => block.type !== 'gallery' || block.images.length);
    renderPreview();
    setMessage('已套用多圖左側、文字右側版型；儲存或發布後才會同步前台。', 'success');
  });
  $('[data-layout-group-selected]').addEventListener('click', () => {
    const selected = layout.filter(block => block.type === 'image' && selectedImageIds.has(block.id));
    if (selected.length < 2) return setMessage('請先選取至少兩張獨立圖片。', 'error');
    const firstIndex = Math.min(...selected.map(block => layout.indexOf(block)));
    layout = layout.filter(block => !selectedImageIds.has(block.id));
    layout.splice(firstIndex, 0, { id: blockId(), type: 'gallery', images: selected.map(block => block.src), span: 6 });
    selectedImageIds.clear();
    renderPreview();
    setMessage(`已將 ${selected.length} 張圖片合併為群組。`, 'success');
  });
  $('[data-save-draft]').addEventListener('click', () => save('draft'));
  $('[data-publish]').addEventListener('click', () => save('published'));
  $('[data-refresh]').addEventListener('click', () => loadArticles().catch(error => setMessage(error.message, 'error')));

  resetForm();
  loadArticles().catch(error => {
    setMessage(error.message + ' 請先登入管理員帳號。', 'error');
    items.innerHTML = '<p class="text-danger mb-0">無法讀取文章。請確認已登入後台。</p>';
  });
})();
