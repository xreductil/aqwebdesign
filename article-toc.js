(function () {
    const toc = document.querySelector('.article-toc');
    const toggle = document.querySelector('.article-toc-toggle');
    const links = Array.from(document.querySelectorAll('.article-toc a'));
    const sections = links
        .map((link) => document.querySelector(link.hash))
        .filter(Boolean);

    if (!toc || !links.length || !sections.length) return;

    if (toggle) {
        const closeToc = () => {
            toc.classList.remove('is-open');
            toggle.setAttribute('aria-expanded', 'false');
        };

        toggle.addEventListener('click', () => {
            const isOpen = toc.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        links.forEach((link) => {
            link.addEventListener('click', closeToc);
        });

        document.addEventListener('click', (event) => {
            if (!toc.contains(event.target)) closeToc();
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeToc();
        });
    }

    const updateActiveSection = () => {
        let currentSection = sections[0];

        sections.forEach((section) => {
            if (section.getBoundingClientRect().top <= 140) {
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
