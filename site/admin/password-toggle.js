(() => {
  document.querySelectorAll('[data-password-toggle]').forEach(button => {
    const input = document.getElementById(button.getAttribute('data-password-toggle'));
    if (!input) return;
    button.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      const label = showing ? '顯示密碼' : '隱藏密碼';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
    });
  });
})();
