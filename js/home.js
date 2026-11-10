(() => {
  'use strict';
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.getElementById('homeNav');
  const closeMenu = () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'メニューを開く');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    nav.classList.toggle('is-open', open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.home-header')) closeMenu();
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  document.querySelectorAll('[data-wave]').forEach(wave => {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 145; i++) {
      const bar = document.createElement('span');
      const envelope = Math.pow(Math.sin(i / 144 * Math.PI), .7);
      const modulation = .2 + .8 * Math.abs(Math.sin(i * .71) * Math.cos(i * .19));
      bar.style.setProperty('--bar-height', `${10 + envelope * modulation * 230}px`);
      bar.style.setProperty('--bar-opacity', `${.25 + modulation * .65}`);
      bar.style.setProperty('--bar-delay', `${-i * .09}s`);
      fragment.appendChild(bar);
    }
    wave.appendChild(fragment);
  });
})();
