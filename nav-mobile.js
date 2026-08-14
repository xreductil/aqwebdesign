document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navBar = document.querySelector('.nav-bar');

    if (!navToggle || !navMenu) return;

    const setMenuOpen = (open) => {
        navMenu.classList.toggle('active', open);
        navToggle.classList.toggle('open', open);
        navBar?.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? '關閉選單' : '開啟選單');
    };

    navToggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        setMenuOpen(!navMenu.classList.contains('active'));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) setMenuOpen(false);
    });
});
