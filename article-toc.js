(function () {
    const toc = document.querySelector('.article-toc');
    const toggle = document.querySelector('.article-toc-toggle');
    const links = Array.from(document.querySelectorAll('.article-toc a'));
    const sections = links
        .map((link) => document.querySelector(link.hash))
        .filter(Boolean);

    if (!toc || !links.length || !sections.length) return;

    const isMobileLayout = () => window.matchMedia('(max-width: 900px)').matches;
    const closeToc = () => {
        toc.classList.remove('is-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle) {
        toggle.addEventListener('click', () => {
            const isOpen = toc.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!toc.contains(event.target)) closeToc();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeToc();
        });
    }

    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.hash);

            if (!target || !isMobileLayout()) {
                closeToc();
                return;
            }

            event.preventDefault();
            closeToc();

            window.requestAnimationFrame(() => {
                const offset = 132;
                const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: 'smooth'
                });
                window.history.pushState(null, '', link.hash);
            });
        });
    });

    const updateActiveSection = () => {
        let currentSection = sections[0];

        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= 145) {
                currentSection = section;
            }
        });

        links.forEach((link) => {
            link.classList.toggle('is-active', link.hash === `#${currentSection.id}`);
        });
    };

    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
})();
