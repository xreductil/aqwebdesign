document.addEventListener('DOMContentLoaded', function () {
    const homeHero = document.querySelector('#hero.home-hero');
    if (homeHero) {
        homeHero.addEventListener('pointermove', function (event) {
            const rect = homeHero.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            homeHero.style.setProperty('--hero-glow-x', `${x}%`);
            homeHero.style.setProperty('--hero-glow-y', `${y}%`);
        });
    }

    const contactLinks = document.querySelectorAll('a[data-contact-modal]');
    if (!contactLinks.length) return;

    const modal = document.createElement('div');
    modal.className = 'contact-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'contactModalTitle');
    const contactChannels = {
        line: {
            title: 'Line',
            url: 'https://line.me/ti/p/grace843286',
            note: '掃描 QR Code 透過 Line 聯絡我們'
        },
        threads: {
            title: 'Threads',
            url: 'https://www.threads.net/',
            note: '掃描 QR Code 或開啟 Threads 連結'
        },
        instagram: {
            title: 'Instagram',
            url: 'https://www.instagram.com/',
            note: '掃描 QR Code 或開啟 Instagram 連結'
        }
    };

    function qrUrl(url) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(url)}`;
    }

    modal.innerHTML = `
        <div class="contact-modal">
            <button class="contact-modal-close" type="button" aria-label="關閉聯絡視窗">&times;</button>
            <p class="contact-modal-kicker">Contact</p>
            <h2 id="contactModalTitle">告訴我們你的想法</h2>
            <div class="contact-modal-body">
                <div class="contact-methods" aria-label="聯絡方式">
                    <button class="contact-method is-active" type="button" data-contact-channel="line">Line</button>
                    <button class="contact-method" type="button" data-contact-channel="threads">Threads</button>
                    <button class="contact-method" type="button" data-contact-channel="instagram">Instagram</button>
                    <a class="contact-method" href="mailto:aq.webdesign@example.com">Email</a>
                    <button class="contact-method" type="button" data-contact-channel="phone">電話</button>
                </div>
                <div class="contact-link-panel" data-contact-panel="link">
                    <h3>Line</h3>
                    <img class="contact-qr" src="${qrUrl(contactChannels.line.url)}" alt="Line QR Code">
                    <p>掃描 QR Code 透過 Line 聯絡我們</p>
                    <a class="contact-open-link" href="${contactChannels.line.url}" target="_blank" rel="noopener" aria-label="開啟 Line 連結">↗</a>
                </div>
                <form class="contact-form-panel" data-contact-panel="phone" hidden>
                    <h3>電話</h3>
                    <label for="contactPhone">電話號碼</label>
                    <input id="contactPhone" name="phone" type="tel" placeholder="請輸入聯絡電話">
                    <label for="contactMessage">訊息內容</label>
                    <textarea id="contactMessage" name="message" placeholder="簡單描述你想做的網站、App、系統或自動化流程..."></textarea>
                    <button class="contact-submit" type="submit">送出訊息</button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const closeButton = modal.querySelector('.contact-modal-close');
    const form = modal.querySelector('.contact-form-panel');
    const linkPanel = modal.querySelector('.contact-link-panel');
    const channelButtons = modal.querySelectorAll('[data-contact-channel]');
    let previousFocus = null;

    function showChannel(channel) {
        channelButtons.forEach(button => {
            button.classList.toggle('is-active', button.dataset.contactChannel === channel);
        });

        if (channel === 'phone') {
            linkPanel.hidden = true;
            form.hidden = false;
            return;
        }

        const data = contactChannels[channel];
        form.hidden = true;
        linkPanel.hidden = false;
        linkPanel.querySelector('h3').textContent = data.title;
        linkPanel.querySelector('.contact-qr').src = qrUrl(data.url);
        linkPanel.querySelector('.contact-qr').alt = `${data.title} QR Code`;
        linkPanel.querySelector('p').textContent = data.note;
        linkPanel.querySelector('.contact-open-link').href = data.url;
        linkPanel.querySelector('.contact-open-link').setAttribute('aria-label', `開啟 ${data.title} 連結`);
    }

    function openModal() {
        previousFocus = document.activeElement;
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
    }

    function closeModal() {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        if (previousFocus) previousFocus.focus();
    }

    contactLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            openModal();
        });
    });

    channelButtons.forEach(button => {
        button.addEventListener('click', function () {
            showChannel(button.dataset.contactChannel);
        });
    });

    closeButton.addEventListener('click', closeModal);

    modal.addEventListener('click', function (event) {
        if (event.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
        }
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const phone = encodeURIComponent(form.phone.value.trim());
        const message = encodeURIComponent(form.message.value.trim());
        window.location.href = `mailto:aq.webdesign@example.com?subject=網站諮詢&body=電話：${phone}%0A訊息：${message}`;
    });
});
