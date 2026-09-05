document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = Array.from(document.querySelectorAll('.dropdown'));

    const closeDropdown = (dropdown) => {
        dropdown.classList.remove('open');
        dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
    };

    dropdowns.forEach((dropdown) => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        if (!toggle) return;

        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const shouldOpen = !dropdown.classList.contains('open');

            dropdowns.forEach(closeDropdown);
            if (shouldOpen) {
                dropdown.classList.add('open');
                toggle.setAttribute('aria-expanded', 'true');
            }
        });

        dropdown.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDropdown(dropdown);
                toggle.focus();
            }
        });
    });

    document.addEventListener('click', () => {
        dropdowns.forEach(closeDropdown);
    });
});
