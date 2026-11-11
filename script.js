document.documentElement.classList.add('js');

// Where contact form submissions go (FormSubmit: free, no account needed).
// The first submission sends a one-time activation email to this address.
const CONTACT_EMAIL = 'goodnessokechukwu80@gmail.com';

document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  const toTop = document.getElementById('toTop');

  document.getElementById('year').textContent = new Date().getFullYear();

  // Light / dark theme toggle (the starting theme is set in <head> to avoid a flash)
  const root = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const syncThemeUI = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#12001b' : '#34014e');
  };
  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    syncThemeUI();
  };
  if (themeBtn) {
    syncThemeUI();
    themeBtn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !reduce) {
        // Grow the new theme as a circle out of the button
        const r = themeBtn.getBoundingClientRect();
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        root.style.setProperty('--tx', x + 'px');
        root.style.setProperty('--ty', y + 'px');
        root.style.setProperty('--tr', Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 'px');
        document.startViewTransition(() => setTheme(next));
      } else if (!reduce) {
        root.classList.add('theme-fade');
        setTheme(next);
        setTimeout(() => root.classList.remove('theme-fade'), 550);
      } else {
        setTheme(next);
      }
    });
    // Follow the device setting until the visitor picks a theme themselves
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      let saved = null;
      try { saved = localStorage.getItem('theme'); } catch (err) {}
      if (!saved) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncThemeUI(); }
    });
  }

  // Hero intro: split the name into letters, then start the sequence
  document.querySelectorAll('[data-split]').forEach((el) => {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-hidden', 'true');
    [...text].forEach((ch, i) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.style.setProperty('--i', i);
      span.textContent = ch;
      el.appendChild(span);
    });
  });
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('hero-in')));

  // Reduced motion: no swinging, but the card still flips on click / Enter
  const idCardEl = document.getElementById('idcard');
  if (idCardEl && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const simpleFlip = () => idCardEl.setAttribute('aria-pressed', String(idCardEl.classList.toggle('is-flipped')));
    idCardEl.addEventListener('click', (e) => { if (!e.target.closest('a')) simpleFlip(); });
    idCardEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); simpleFlip(); } });
  }

  // Dangling ID card: a simple pendulum you can grab, swing and let go
  const swing = document.getElementById('lanyardSwing');
  const card = document.getElementById('idcard');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (swing && card && !calm) {
    let angle = 0.32;          // radians; starts tilted so it swings in after dropping
    let velocity = 0;
    let dragging = false;
    let running = false;
    let last = 0;
    const STIFFNESS = 14;      // pull back to centre
    const DAMPING = 1.1;       // how quickly the swing settles
    const MAX = 1.1;           // never swing past ~63deg

    const render = () => {
      swing.style.setProperty('--swing', `${angle * 57.2958}deg`);
      card.style.setProperty('--shine', `${-60 + angle * 160}%`);
    };
    const step = (now) => {
      const dt = Math.min((now - last) / 1000, 0.032);
      last = now;
      if (!dragging) {
        velocity += (-STIFFNESS * Math.sin(angle) - DAMPING * velocity) * dt;
        angle = Math.max(-MAX, Math.min(MAX, angle + velocity * dt));
      }
      render();
      if (dragging || Math.abs(angle) > 0.0005 || Math.abs(velocity) > 0.0005) {
        requestAnimationFrame(step);
      } else {
        running = false;
      }
    };
    const kick = () => {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(step);
    };

    // Drop in and start swinging when the card scrolls into view
    render();
    const lanyard = document.getElementById('lanyard');
    const dropIO = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      lanyard.classList.add('is-dropped');
      setTimeout(kick, 350);
      dropIO.disconnect();
    }, { threshold: 0.35 });
    dropIO.observe(lanyard);

    // Drag: the card points from the pivot towards the pointer
    const pivot = () => {
      const r = swing.getBoundingClientRect();
      const box = swing.parentElement.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: Math.min(r.top, box.top) };
    };
    let prevAngle = 0;
    let prevTime = 0;
    let grabOffset = 0;        // keeps the card from jumping when grabbed
    let downX = 0, downY = 0, downTime = 0, moved = false;

    const flip = () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', String(flipped));
      velocity += flipped ? 0.5 : -0.5;   // a little wobble as it turns
      kick();
    };
    const pointerAngle = (e) => {
      const p = pivot();
      return Math.atan2(p.x - e.clientX, e.clientY - p.y);
    };

    card.addEventListener('pointerdown', (e) => {
      if (e.target.closest('a')) return;  // let the "work together" link work normally
      dragging = true;
      moved = false;
      downX = e.clientX; downY = e.clientY; downTime = performance.now();
      card.setPointerCapture(e.pointerId);
      grabOffset = angle - pointerAngle(e);
      prevAngle = angle;
      prevTime = downTime;
      kick();
    });
    card.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      if (!moved && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) return;
      moved = true;
      angle = Math.max(-MAX, Math.min(MAX, pointerAngle(e) + grabOffset));
      const now = performance.now();
      const dt = Math.max((now - prevTime) / 1000, 0.008);
      velocity = (angle - prevAngle) / dt;
      prevAngle = angle;
      prevTime = now;
    });
    const release = (e) => {
      if (!dragging) return;
      dragging = false;
      if (!moved && e.type === 'pointerup' && performance.now() - downTime < 500) {
        flip();                           // a quick tap flips the card
        return;
      }
      velocity = Math.max(-6, Math.min(6, velocity));
      kick();
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
    });

    // A little sway when the page scrolls
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      const r = lanyard.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        velocity += Math.max(-0.6, Math.min(0.6, dy * 0.012));
        kick();
      }
    }, { passive: true });
  }

  // Nav background + back-to-top button on scroll
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    toTop.classList.toggle('is-visible', y > 700);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  const setMenu = (open) => {
    links.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Seamless marquee: duplicate the list once
  const track = document.querySelector('.marquee__track');
  const list = track.querySelector('.marquee__list');
  const clone = list.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.appendChild(clone);

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        // small stagger for siblings
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  // Count-up numbers in Results
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const from = parseFloat(el.dataset.from || '0');
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        const start = performance.now();
        const dur = 1600;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (from + (target - from) * eased).toFixed(decimals);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countIO.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIO.observe(el));
  }

  // Project cards: staggered entrance (also triggers the growth chart)
  const pcards = document.querySelectorAll('.pcard');
  if ('IntersectionObserver' in window && !reduceMotion) {
    pcards.forEach((card, i) => card.style.setProperty('--delay', `${(i % 2) * 0.12 + (i > 1 ? 0.1 : 0)}s`));
    const cardIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        cardIO.unobserve(entry.target);
      });
    }, { threshold: 0.2 });
    pcards.forEach((c) => cardIO.observe(c));
  } else {
    pcards.forEach((c) => c.classList.add('is-in'));
  }

  // 3D tilt + cursor spotlight (mouse/trackpad only)
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const bindTilt = (el, max) => {
      let frame = 0;
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width;
          const y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
          el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
          el.style.setProperty('--mx', `${x * 100}%`);
          el.style.setProperty('--my', `${y * 100}%`);
        });
      });
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    };
    document.querySelectorAll('[data-tilt]').forEach((el) => bindTilt(el, 22));
    document.querySelectorAll('[data-tilt-soft]').forEach((el) => bindTilt(el, 7));
  }

  // Highlight the nav link of the section in view
  const navAnchors = [...links.querySelectorAll('a[href^="#"]:not(.btn)')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const secIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => secIO.observe(s));
  }

  // Contact form
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = form.querySelector('button[type="submit"]');

  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = `form__status ${type ? `is-${type}` : ''}`;
  };

  const validate = () => {
    let firstBad = null;
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    ['name', 'email', 'message'].forEach((n) => {
      const el = form.elements[n];
      if (!el.checkValidity() || !el.value.trim()) { el.classList.add('is-invalid'); firstBad ||= el; }
    });
    if (!form.querySelector('input[name="service"]:checked')) {
      const fs = form.querySelector('fieldset.field');
      fs.classList.add('is-invalid');
      firstBad ||= fs.querySelector('input');
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  };

  form.addEventListener('input', (e) => e.target.classList.remove('is-invalid'));
  form.addEventListener('change', (e) => {
    if (e.target.name === 'service') form.querySelector('fieldset.field').classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.elements._honey.value) return; // bot
    if (!validate()) { setStatus('Please fill in the required fields.', 'error'); return; }

    const data = Object.fromEntries(new FormData(form));
    delete data._honey;
    const payload = {
      ...data,
      budget: data.budget ? `${data.currency} ${data.budget}` : 'Not specified',
      _subject: `New portfolio inquiry from ${data.name}`,
      _replyto: data.email,
      _template: 'table',
    };
    delete payload.currency;

    submitBtn.disabled = true;
    setStatus('Sending…');
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      setStatus('Thank you! Your inquiry has been sent. I’ll be in touch soon ✦', 'success');
    } catch {
      // Fallback: open the visitor's email app with the message pre-filled
      const body = Object.entries(payload)
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v}`)
        .join('\n');
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
      setStatus('Opening your email app so you can send this directly…', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
});
