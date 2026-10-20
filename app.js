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

  // ░ Carousels (add-ons, gallery, reviews) ░
  // Slow auto-scroll on a real scroll container, so visitors can also swipe
  // (touch), drag (mouse), use the trackpad or the ‹ › arrows to go faster.
  // The items are tripled; the scroll position is kept in the middle copy so
  // the loop is seamless in both directions.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const arrowSvg = d => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  $$('[data-marquee]').forEach(slider => {
    const track = slider.querySelector('.slider__track');
    const originals = Array.from(track.children);
    for (let k = 0; k < 2; k++) {
      originals.forEach(child => {
        const clone = child.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.removeAttribute('id');
        clone.querySelectorAll('a, button').forEach(el => el.setAttribute('tabindex', '-1'));
        track.appendChild(clone);
      });
    }
    track.querySelectorAll('img').forEach(img => img.setAttribute('draggable', 'false'));

    // Wrapper holding the arrows (the slider itself scrolls)
    const wrap = document.createElement('div');
    wrap.className = 'slider-wrap';
    slider.before(wrap);
    wrap.appendChild(slider);
    wrap.style.marginTop = getComputedStyle(slider).marginTop;
    slider.style.marginTop = '0';
    const prev = document.createElement('button');
    const next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.className = 'slider__arrow slider__arrow--prev';
    next.className = 'slider__arrow slider__arrow--next';
    prev.setAttribute('aria-label', 'Previous');
    next.setAttribute('aria-label', 'Next');
    prev.innerHTML = arrowSvg('M15 18l-6-6 6-6');
    next.innerHTML = arrowSvg('M9 18l6-6-6-6');
    wrap.append(prev, next);

    const set = () => track.scrollWidth / 3;          // width of one copy
    const durationSec = parseFloat(getComputedStyle(slider).getPropertyValue('--speed')) || 70;
    let pos = 0;
    const normalize = () => {
      const H = set();
      let s = slider.scrollLeft;
      while (s >= 2 * H) s -= H;
      while (s < H) s += H;
      if (s !== slider.scrollLeft) slider.scrollLeft = s;
      pos = slider.scrollLeft;
    };
    requestAnimationFrame(() => { slider.scrollLeft = set(); pos = slider.scrollLeft; });

    // Pause while the visitor is hovering / touching / dragging, resume after
    let hovering = false, holdUntil = 0, visible = true;
    const hold = (ms = 2500) => { holdUntil = performance.now() + ms; };
    slider.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
    slider.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovering = false; normalize(); } });
    slider.addEventListener('touchstart', () => hold(4000), { passive: true });
    slider.addEventListener('wheel', e => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) hold(); }, { passive: true });
    let idle;
    slider.addEventListener('scroll', () => {
      clearTimeout(idle);
      idle = setTimeout(normalize, 250);
    }, { passive: true });
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(slider);

    // Mouse drag
    let drag = null, moved = false;
    slider.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, s: slider.scrollLeft };
      moved = false;
      slider.setPointerCapture(e.pointerId);
      slider.classList.add('is-dragging');
    });
    slider.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) moved = true;
      slider.scrollLeft = drag.s - dx;
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      slider.classList.remove('is-dragging');
      normalize();
      hold();
    };
    slider.addEventListener('pointerup', endDrag);
    slider.addEventListener('pointercancel', endDrag);
    slider.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    // Arrows: one "page" per click, with room made beforehand so the
    // smooth scroll never hits the end of the copies
    const page = dir => {
      const H = set();
      const step = Math.max(240, slider.clientWidth * 0.75);
      const max = 3 * H - slider.clientWidth;
      if (dir > 0 && slider.scrollLeft + step > max) slider.scrollLeft -= H;
      if (dir < 0 && slider.scrollLeft - step < 0) slider.scrollLeft += H;
      hold(3500);
      slider.scrollBy({ left: dir * step, behavior: 'smooth' });
    };
    prev.addEventListener('click', () => page(-1));
    next.addEventListener('click', () => page(1));

    // Auto-scroll loop
    let last = performance.now();
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const H = set();
      const running = !reduceMotion && visible && !hovering && !drag && now > holdUntil && H > 0;
      if (running) {
        pos += (H / durationSec) * dt;
        if (pos >= 2 * H) pos -= H;
        slider.scrollLeft = pos;
      } else {
        pos = slider.scrollLeft;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

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
