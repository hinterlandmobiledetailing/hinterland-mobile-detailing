/* Hinterland Mobile Detailing — interactions */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Footer year
  $('#year').textContent = new Date().getFullYear();

  // ░ Mobile nav ░
  const toggle = $('.nav__toggle');
  const links  = $('.nav__links');
  toggle?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // Services dropdown (accordion on touch, hover on desktop)
  const dropItem    = $('.nav__item.has-dropdown');
  const dropTrigger = dropItem?.querySelector('.nav__trigger');
  const isTouchNav  = () => !window.matchMedia('(hover: hover)').matches;
  dropTrigger?.addEventListener('click', e => {
    if (isTouchNav()) {
      e.preventDefault();
      const open = dropItem.classList.toggle('is-open');
      dropTrigger.setAttribute('aria-expanded', String(open));
    }
  });

  links?.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a.classList.contains('nav__trigger')) return; // handled above
    links.classList.remove('is-open');
    dropItem?.classList.remove('is-open');
    dropTrigger?.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-expanded', 'false');
  });

  // ░ Sticky nav state + scroll progress ░
  const nav = $('.nav');
  const progress = $('.scroll-progress span');
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('is-stuck', y > 40);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      ticking = false;
    });
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // ░ Reveal on scroll ░
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  const revealSelectors = [
    '.reveal', '[data-image-reveal]',
    '.value', '.feature-card',
    '.section-head', '.about__body > *', '.about__media',
    '.contact__intro > *', '.contact__form .field', '.contact__form button',
    '.ambient__copy > *', '.ambient__media',
    '.intro__statement', '.cat-item'
  ];
  $$(revealSelectors.join(',')).forEach(el => {
    if (!el.classList.contains('reveal') && !el.hasAttribute('data-image-reveal')) {
      el.classList.add('reveal');
    }
    io.observe(el);
  });

  // ░ Stagger reveal delays for groups ░
  $$('.value').forEach((el, i) => el.style.setProperty('--d', (i * 0.08) + 's'));
  $$('.feature-card').forEach((el, i) => el.style.setProperty('--d', (i * 0.1) + 's'));
  $$('.about__bullets li').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', (i * 0.05) + 's');
    io.observe(el);
  });
  $$('.cat-item').forEach((el, i) => el.style.setProperty('--d', (i * 0.05) + 's'));

  // ░ Marquee sliders: duplicate the items once for a seamless loop ░
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('[data-marquee] .slider__track').forEach(track => {
      Array.from(track.children).forEach(child => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('id');
        clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
        track.appendChild(clone);
      });
    });
  }

  // ░ Counter animation (hero stats) ░
  const counters = $$('[data-count]');
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      function step(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => countObs.observe(c));

  // ░ Interactive catalogue (Section 01) ░
  const items = $$('.cat-item');
  const cards = $$('.cat-card');
  const catalogue = $('.catalogue');
  const stacked = () => window.matchMedia('(max-width: 1100px)').matches;
  const canHover = () => window.matchMedia('(hover: hover)').matches;

  function closeMore(card) {
    const more = card.querySelector('.cat-card__more');
    if (more) more.hidden = true;
    card.querySelector('.cat-card__more-btn')?.setAttribute('aria-expanded', 'false');
  }

  function activate(targetId) {
    items.forEach(i => {
      const on = i.dataset.target === targetId;
      i.classList.toggle('is-active', on);
      i.setAttribute('aria-selected', String(on));
    });
    cards.forEach(c => {
      const on = c.id === targetId;
      if (!on) closeMore(c);
      c.classList.toggle('is-active', on);
    });
  }

  // Narrow screens: a service's detail opens in a pop-up, on click only
  const modal = $('#svc-modal');
  const modalBody = modal?.querySelector('.svc-modal__body');
  const root = document.documentElement;
  function openModal(id) {
    const card = $('#' + CSS.escape(id));
    if (!modal || !card) return;
    const clone = card.cloneNode(true);
    clone.removeAttribute('id');
    clone.removeAttribute('role');
    clone.classList.add('is-active');
    closeMore(clone);
    modalBody.replaceChildren(clone);
    modal.setAttribute('aria-label', card.querySelector('h3')?.textContent.trim() || 'Service details');
    root.classList.add('modal-open');
    modal.showModal();
    modalBody.scrollTop = 0;
  }
  function closeModal() {
    root.classList.remove('modal-open');
    if (modal?.open) modal.close();
  }
  modal?.addEventListener('close', () => {
    root.classList.remove('modal-open');
    modalBody.replaceChildren();
  });
  modal?.addEventListener('click', e => {
    if (e.target === modal || e.target.closest('.svc-modal__close')) closeModal();
    else if (e.target.closest('a[href^="#"]')) closeModal(); // "Book this" → contact form
  });

  items.forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      activate(item.dataset.target);
      if (stacked()) openModal(item.dataset.target);
    });
    // Wide layout only: hover / keyboard focus preview the card on the right
    item.addEventListener('mouseenter', () => { if (canHover() && !stacked()) activate(item.dataset.target); });
    item.addEventListener('focus', () => { if (!stacked()) activate(item.dataset.target); });
  });

  // Wide layout: the service crossing 40% of the screen height becomes active
  const spy = new IntersectionObserver(entries => {
    if (stacked()) return;
    entries.forEach(e => { if (e.isIntersecting) activate(e.target.dataset.target); });
  }, { rootMargin: '-40% 0px -60% 0px' });
  items.forEach(i => spy.observe(i));

  // "The process & why" panel inside each card (also works inside the pop-up)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.cat-card__more-btn');
    if (btn) {
      const more = btn.closest('.cat-card').querySelector('.cat-card__more');
      more.hidden = !more.hidden;
      btn.setAttribute('aria-expanded', String(!more.hidden));
      return;
    }
    const x = e.target.closest('.cat-card__close');
    if (x) closeMore(x.closest('.cat-card'));
  });

  // Menu / footer links to a service: show it (pop-up on narrow screens)
  function showService(id) {
    const card = $('#' + CSS.escape(id));
    if (!card?.classList.contains('cat-card')) return false;
    activate(id);
    if (stacked()) openModal(id);
    else catalogue?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#svc-"]');
    if (a && showService(a.getAttribute('href').slice(1))) {
      e.preventDefault();
      history.replaceState(null, '', a.getAttribute('href'));
    }
  });
  if (location.hash) showService(location.hash.slice(1));

  // ░ Contact form — AJAX submit to Formspree ░
  const form = $('.contact__form[data-ajax]');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const label  = button.querySelector('.btn__label');
      const success = form.querySelector('.form__success');
      const error   = form.querySelector('.form__error');
      success.hidden = true;
      error.hidden = true;

      const originalText = label.textContent;
      label.textContent = 'Sending…';
      button.disabled = true;

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          form.reset();
          success.hidden = false;
          label.textContent = 'Sent ✓';
          setTimeout(() => { label.textContent = originalText; button.disabled = false; }, 2400);
        } else {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Network error');
        }
      } catch (err) {
        console.error('[form]', err);
        error.hidden = false;
        label.textContent = originalText;
        button.disabled = false;
      }
    });
  }

})();
