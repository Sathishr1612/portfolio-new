(function () {
    'use strict';

    const root = document.documentElement;
    root.classList.add('js');

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    // ========================================
    // THEME TOGGLE
    // ========================================
    const themeToggle = document.getElementById('themeToggle');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        if (themeMeta) themeMeta.setAttribute('content', theme === 'light' ? '#f6f3ee' : '#0d0c0b');
    }

    applyTheme(root.getAttribute('data-theme') || 'dark');

    themeToggle.addEventListener('click', function () {
        const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        applyTheme(next);
        try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
    });

    // ========================================
    // MOBILE MENU
    // ========================================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    function setMenu(open) {
        navLinks.classList.toggle('is-open', open);
        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    menuToggle.addEventListener('click', function () {
        setMenu(!navLinks.classList.contains('is-open'));
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () { setMenu(false); });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('is-open')) setMenu(false);
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth > 991 && navLinks.classList.contains('is-open')) setMenu(false);
    });

    // ========================================
    // SCROLL: NAV STATE, BACK TO TOP
    // ========================================
    const nav = document.getElementById('nav');
    const backToTop = document.getElementById('backToTop');
    let ticking = false;

    function onScroll() {
        const y = window.scrollY;
        nav.classList.toggle('is-scrolled', y > 30);
        backToTop.classList.toggle('is-visible', y > 700);
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    // ========================================
    // ACTIVE NAV LINK
    // ========================================
    const linkMap = {};
    document.querySelectorAll('.nav-link').forEach(function (link) {
        linkMap[link.getAttribute('href').slice(1)] = link;
    });

    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            Object.values(linkMap).forEach(function (l) { l.classList.remove('is-active'); });
            const link = linkMap[entry.target.id];
            if (link) link.classList.add('is-active');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    document.querySelectorAll('section[id]').forEach(function (s) { sectionObserver.observe(s); });

    // ========================================
    // REVEAL ON SCROLL (with sibling stagger)
    // ========================================
    const reveals = document.querySelectorAll('.reveal');

    reveals.forEach(function (el) {
        const siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
            return c.classList.contains('reveal');
        });
        const i = siblings.indexOf(el);
        if (i > 0) el.style.setProperty('--d', Math.min(i, 6) * 80 + 'ms');
    });

    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { revealObserver.observe(el); });

    // ========================================
    // COUNTERS + SKILL BARS
    // ========================================
    function animateCount(el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (reduceMotion) { el.textContent = target; return; }
        const duration = 1400;
        const start = performance.now();
        (function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }

    const oneShot = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (el.hasAttribute('data-count')) animateCount(el);
            oneShot.unobserve(el);
        });
    }, { threshold: 0.4 });

    document.querySelectorAll('[data-count]').forEach(function (el) { oneShot.observe(el); });

    // ========================================
    // TYPEWRITER
    // ========================================
    const roles = ['Frontend Developer', 'UI/UX Designer', 'WordPress Developer'];
    const typeEl = document.getElementById('typewriter');

    if (typeEl && !reduceMotion) {
        let roleIndex = 0;
        let charIndex = roles[0].length;
        let deleting = true;

        function type() {
            const word = roles[roleIndex];
            charIndex += deleting ? -1 : 1;
            typeEl.textContent = word.substring(0, charIndex);

            let delay = deleting ? 45 : 95;
            if (!deleting && charIndex === word.length) {
                delay = 2200;
                deleting = true;
            } else if (deleting && charIndex === 0) {
                deleting = false;
                roleIndex = (roleIndex + 1) % roles.length;
                delay = 350;
            }
            setTimeout(type, delay);
        }

        setTimeout(type, 2400);
    }

    // ========================================
    // PROJECT FILTER
    // ========================================
    const filters = document.querySelectorAll('.filter');
    const workItems = document.querySelectorAll('.pcard');

    filters.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const cat = btn.getAttribute('data-filter');
            filters.forEach(function (b) {
                const active = b === btn;
                b.classList.toggle('is-active', active);
                b.setAttribute('aria-selected', String(active));
            });
            workItems.forEach(function (w) {
                const show = cat === 'all' || w.getAttribute('data-cat') === cat;
                w.classList.toggle('is-hidden', !show);
                if (show) w.classList.add('is-in');
            });
        });
    });

    // ========================================
    // CARD SPOTLIGHT + MAGNETIC BUTTONS (mouse only)
    // ========================================
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.spotlight').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });

        document.querySelectorAll('.magnetic').forEach(function (btn) {
            btn.addEventListener('pointermove', function (e) {
                const r = btn.getBoundingClientRect();
                const x = (e.clientX - r.left - r.width / 2) * 0.18;
                const y = (e.clientY - r.top - r.height / 2) * 0.3;
                btn.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
            });
            btn.addEventListener('pointerleave', function () {
                btn.style.transform = '';
            });
        });
    }

    // ========================================
    // TOAST + COPY EMAIL
    // ========================================
    const toast = document.getElementById('toast');
    let toastTimer;

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 3000);
    }

    document.querySelectorAll('[data-copy]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const text = btn.getAttribute('data-copy');
            const done = function () {
                showToast('Email copied to clipboard');
                const icon = btn.querySelector('i');
                icon.className = 'fas fa-check';
                setTimeout(function () { icon.className = 'far fa-copy'; }, 2000);
            };
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(done, function () { showToast(text); });
            } else {
                showToast(text);
            }
        });
    });

    // ========================================
    // CONTACT FORM → opens the visitor's email app
    // ========================================
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        let valid = true;

        form.querySelectorAll('[required]').forEach(function (input) {
            const ok = input.checkValidity() && input.value.trim() !== '';
            input.parentElement.classList.toggle('has-error', !ok);
            if (!ok && valid) { input.focus(); valid = false; }
        });

        if (!valid) {
            showToast('Please fill in all fields correctly');
            return;
        }

        const data = new FormData(form);
        const body = data.get('message') + '\n\n— ' + data.get('name') + ' (' + data.get('email') + ')';
        window.location.href = 'mailto:rrsathish65@gmail.com'
            + '?subject=' + encodeURIComponent(data.get('subject'))
            + '&body=' + encodeURIComponent(body);

        showToast('Opening your email app…');
    });

    form.querySelectorAll('input, textarea').forEach(function (input) {
        input.addEventListener('input', function () {
            input.parentElement.classList.remove('has-error');
        });
    });

    // ========================================
    // FOOTER YEAR
    // ========================================
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
})();
