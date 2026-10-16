(function () {
    const links = Array.from(document.querySelectorAll('.article-toc a'));
    const sections = links
        .map((link) => document.querySelector(link.hash))
        .filter(Boolean);

    if (!links.length || !sections.length) return;

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
