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
    const progressBar = document.getElementById('scrollProgress');
    const hero = document.getElementById('home');
    const parallaxEls = reduceMotion ? [] : document.querySelectorAll('[data-speed]');
    let ticking = false;
    let lastY = window.scrollY;

    function onScroll() {
        const y = window.scrollY;
        const vh = window.innerHeight;
        const max = document.documentElement.scrollHeight - vh;
        const p = max > 0 ? Math.min(y / max, 1) : 0;

        nav.classList.toggle('is-scrolled', y > 30);
        backToTop.classList.toggle('is-visible', y > 700);
        progressBar.style.setProperty('--p', p.toFixed(4));
        backToTop.style.setProperty('--p', p.toFixed(4));

        // Hide the nav while reading down, bring it back on any scroll up
        if (!document.body.classList.contains('menu-open')) {
            if (y > lastY + 6 && y > 400) nav.classList.add('is-hidden');
            else if (y < lastY - 6 || y <= 400) nav.classList.remove('is-hidden');
        }

        if (!reduceMotion) {
            // Hero content drifts up and fades as you leave it
            if (y < vh * 1.2) hero.style.setProperty('--hp', Math.min(y / vh, 1).toFixed(3));

            parallaxEls.forEach(function (el) {
                const offset = el._center - y - vh / 2;
                if (Math.abs(offset) > vh * 1.5) return;
                el.style.setProperty('--py', (offset * -el._speed).toFixed(1) + 'px');
            });
        }

        lastY = y;
        ticking = false;
    }

    // Cache each parallax element's resting centre (page coords, without its own shift)
    function measureParallax() {
        parallaxEls.forEach(function (el) {
            el.style.setProperty('--py', '0px');
            const r = el.getBoundingClientRect();
            el._center = r.top + window.scrollY + r.height / 2;
            el._speed = parseFloat(el.dataset.speed) || 0;
        });
    }

    measureParallax();
    window.addEventListener('resize', function () { measureParallax(); onScroll(); });

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
    // Wrap every word of .split headings so each can rise from a mask
    function splitWords(el) {
        let i = 0;
        (function walk(node) {
            Array.prototype.slice.call(node.childNodes).forEach(function (child) {
                if (child.nodeType === 1) { walk(child); return; }
                if (child.nodeType !== 3 || !child.textContent.trim()) return;
                const frag = document.createDocumentFragment();
                child.textContent.split(/(\s+)/).forEach(function (part) {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                    const w = document.createElement('span');
                    const inner = document.createElement('span');
                    w.className = 'w';
                    inner.className = 'w-i';
                    inner.style.setProperty('--i', i++);
                    inner.textContent = part;
                    w.appendChild(inner);
                    frag.appendChild(w);
                });
                node.replaceChild(frag, child);
            });
        })(el);
    }

    document.querySelectorAll('.split').forEach(splitWords);

    // Per-item index for chips and bullet points
    document.querySelectorAll('.index-items, .j-points').forEach(function (list) {
        Array.prototype.forEach.call(list.children, function (item, i) {
            item.style.setProperty('--ci', i);
        });
    });

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
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('is-in');
            revealObserver.unobserve(el);
            // Drop the stagger delay once in, so hover effects respond instantly
            if (el.classList.contains('reveal')) {
                setTimeout(function () { el.style.setProperty('--d', '0ms'); }, 2400);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) { revealObserver.observe(el); });
    document.querySelectorAll('.split').forEach(function (el) { revealObserver.observe(el); });

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
    // LOCAL TIME (hero meta row)
    // ========================================
    const timeEl = document.getElementById('localTime');

    if (timeEl) {
        const fmt = new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
        const tickTime = function () { timeEl.textContent = fmt.format(new Date()); };
        tickTime();
        setInterval(tickTime, 15000);
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

        // 3D tilt with a glare that follows the pointer
        document.querySelectorAll('.tilt').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;
                card.classList.add('is-tilting');
                card.style.setProperty('--mx', px * 100 + '%');
                card.style.setProperty('--my', py * 100 + '%');
                card.style.transform = 'perspective(1000px) rotateX(' + ((0.5 - py) * 6).toFixed(2) +
                    'deg) rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg) translateY(-6px)';
            });
            card.addEventListener('pointerleave', function () {
                card.classList.remove('is-tilting');
                card.style.transform = '';
            });
        });

        // Cursor follower ring — grows on links, becomes a "View" bubble on projects
        const cursor = document.getElementById('cursor');
        let cx = -100, cy = -100, tx = -100, ty = -100;

        document.addEventListener('pointermove', function (e) {
            tx = e.clientX;
            ty = e.clientY;
            cursor.classList.add('is-active');
            const target = e.target.closest ? e.target : null;
            cursor.classList.toggle('is-view', !!(target && target.closest('a.pcard')));
            cursor.classList.toggle('is-link', !!(target && target.closest('a, button, label, input, textarea')) &&
                !cursor.classList.contains('is-view'));
        });
        document.addEventListener('pointerleave', function () { cursor.classList.remove('is-active'); });

        (function follow() {
            cx += (tx - cx) * 0.2;
            cy += (ty - cy) * 0.2;
            cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px, ' + cy.toFixed(1) + 'px)';
            requestAnimationFrame(follow);
        })();
    }

    // ========================================
    // MARQUEE reacts to scroll speed and direction
    // ========================================
    const marquee = document.getElementById('marquee');
    const marqueeTrack = marquee && marquee.querySelector('.marquee-track');
    const marqueeAnim = marqueeTrack && marqueeTrack.getAnimations ? marqueeTrack.getAnimations()[0] : null;

    if (marqueeAnim && !reduceMotion) {
        let prevY = window.scrollY;
        let velocity = 0;
        let rate = 1;

        (function loop() {
            const y = window.scrollY;
            velocity += ((y - prevY) - velocity) * 0.15;
            prevY = y;
            const boost = Math.max(-6, Math.min(6, velocity * 0.25));
            const dir = boost < -0.2 ? -1 : 1;
            const next = Math.round(dir * (1 + Math.abs(boost)) * 20) / 20;
            if (next !== rate) {
                rate = next;
                if (marqueeAnim.updatePlaybackRate) marqueeAnim.updatePlaybackRate(rate);
                else marqueeAnim.playbackRate = rate;
            }
            marquee.style.setProperty('--skew', Math.max(-12, Math.min(12, -velocity * 0.4)).toFixed(2) + 'deg');
            requestAnimationFrame(loop);
        })();
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
