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
