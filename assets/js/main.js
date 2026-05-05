// SWANSGREEN INFRA — interactions

document.addEventListener('DOMContentLoaded', () => {

    // Sticky nav state + scroll-to-top button
    const nav = document.querySelector('.nav');
    const floatTop = document.querySelector('.float-top');
    const onScroll = () => {
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 80);
        if (floatTop) floatTop.classList.toggle('show', window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    if (floatTop) {
        floatTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Mobile hamburger toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        const closeMenu = () => {
            navToggle.classList.remove('open');
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
            navToggle.setAttribute('aria-label', 'Open menu');
            document.body.classList.remove('menu-open');
        };
        const openMenu = () => {
            navToggle.classList.add('open');
            navMenu.classList.add('open');
            navToggle.setAttribute('aria-expanded', 'true');
            navToggle.setAttribute('aria-label', 'Close menu');
            document.body.classList.add('menu-open');
        };
        navToggle.addEventListener('click', () => {
            navMenu.classList.contains('open') ? closeMenu() : openMenu();
        });
        // Close on link tap
        navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
        // Close menu when the in-drawer Book a Visit button is tapped
        const navMenuBook = navMenu.querySelector('.nav-menu-book');
        if (navMenuBook) navMenuBook.addEventListener('click', closeMenu);
        // Close on resize back to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 980 && navMenu.classList.contains('open')) closeMenu();
        });
        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) closeMenu();
        });
    }

    // Reveal on scroll (with fallback for old browsers)
    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        document.querySelectorAll('.reveal, .reveal-line').forEach(el => io.observe(el));
    } else {
        document.querySelectorAll('.reveal, .reveal-line').forEach(el => el.classList.add('in'));
    }

    // Amenity slider sync
    const amItems = document.querySelectorAll('.am-item');
    const amSlides = document.querySelectorAll('.am-vis .slide');
    let amIndex = 0;
    const setAm = (i) => {
        amIndex = i;
        amItems.forEach((it, idx) => it.classList.toggle('active', idx === i));
        amSlides.forEach((sl, idx) => sl.classList.toggle('active', idx === i));
    };
    amItems.forEach((it, i) => {
        it.addEventListener('mouseenter', () => setAm(i));
        it.addEventListener('click', () => setAm(i));
    });
    const amPrev = document.querySelector('.am-nav-prev');
    const amNext = document.querySelector('.am-nav-next');
    const amCounter = document.querySelector('.am-nav-current');
    const updateAmCounter = () => { if (amCounter) amCounter.textContent = String(amIndex + 1).padStart(2, '0'); };
    if (amPrev) amPrev.addEventListener('click', () => { setAm((amIndex - 1 + amItems.length) % amItems.length); updateAmCounter(); });
    if (amNext) amNext.addEventListener('click', () => { setAm((amIndex + 1) % amItems.length); updateAmCounter(); });
    if (amItems.length) {
        setAm(0);
        updateAmCounter();
        setInterval(() => { setAm((amIndex + 1) % amItems.length); updateAmCounter(); }, 4200);
    }

    // ===== Booking Popup =====
    const popup = document.getElementById('popup-visit');
    if (popup) {
        const form = popup.querySelector('.popup-form');
        const success = popup.querySelector('.popup-success');
        let lastFocus = null;

        const openPopup = () => {
            lastFocus = document.activeElement;
            popup.hidden = false;
            requestAnimationFrame(() => popup.classList.add('open'));
            document.body.classList.add('popup-open');
            const firstField = popup.querySelector('input,select,textarea');
            setTimeout(() => firstField && firstField.focus(), 350);
        };
        const closePopup = () => {
            popup.classList.remove('open');
            document.body.classList.remove('popup-open');
            setTimeout(() => {
                popup.hidden = true;
                if (form && success) {
                    form.style.display = '';
                    success.hidden = true;
                    form.reset();
                }
                if (lastFocus) lastFocus.focus();
            }, 380);
        };

        document.querySelectorAll('[data-open-popup="visit"]').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); openPopup(); });
        });
        popup.querySelectorAll('[data-close-popup]').forEach(el => {
            el.addEventListener('click', closePopup);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && popup.classList.contains('open')) closePopup();
        });

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const required = form.querySelectorAll('[required]');
                let valid = true;
                required.forEach(f => {
                    if (!f.value.trim()) { f.style.borderColor = '#c0392b'; valid = false; }
                    else { f.style.borderColor = ''; }
                });
                if (!valid) return;
                // Simulated submission — replace with real endpoint
                form.style.display = 'none';
                if (success) success.hidden = false;
            });
        }
    }

    // ===== Voices / Testimonials Stage =====
    const voxChips = document.querySelectorAll('.vox-chip');
    const voxQuotes = document.querySelectorAll('.vox-q');
    const voxNames = document.querySelectorAll('.vox-name');
    const voxBgs = document.querySelectorAll('.vox-bg-img');

    if (voxChips.length) {
        let voxIndex = 0;
        let voxTimer = null;
        const VOX_DURATION = 6000;
        const VISIBLE = 3;
        const voxTrack = document.querySelector('.vox-chip-track');
        const voxUp = document.querySelector('.vox-arrow-up');
        const voxDown = document.querySelector('.vox-arrow-down');
        let voxOffset = 0; // Index of first visible chip

        const updateTrack = () => {
            if (!voxTrack || !voxChips[0]) return;
            const chipH = voxChips[0].offsetHeight;
            const gap = 8;
            voxTrack.style.transform = `translateY(-${voxOffset * (chipH + gap)}px)`;
            if (voxUp) voxUp.disabled = voxOffset <= 0;
            if (voxDown) voxDown.disabled = voxOffset >= voxChips.length - VISIBLE;
        };
        const ensureVisible = (idx) => {
            const max = voxChips.length - VISIBLE;
            if (idx < voxOffset) voxOffset = Math.max(0, idx);
            else if (idx >= voxOffset + VISIBLE) voxOffset = Math.min(max, idx - VISIBLE + 1);
            updateTrack();
        };
        if (voxUp) voxUp.addEventListener('click', () => { voxOffset = Math.max(0, voxOffset - 1); updateTrack(); });
        if (voxDown) voxDown.addEventListener('click', () => { voxOffset = Math.min(voxChips.length - VISIBLE, voxOffset + 1); updateTrack(); });
        window.addEventListener('resize', updateTrack);
        setTimeout(updateTrack, 50);

        const counterEl = document.querySelector('.vox-counter-current');
        const setActive = (sel, idx) => sel.forEach((el, i) => el.classList.toggle('active', i === idx));
        const goVox = (idx) => {
            voxIndex = idx;
            setActive(voxChips, idx);
            setActive(voxQuotes, idx);
            setActive(voxNames, idx);
            setActive(voxBgs, idx);
            if (counterEl) counterEl.textContent = String(idx + 1).padStart(2, '0');
            ensureVisible(idx);
            // Restart progress animation on the active chip
            const activeProgress = voxChips[idx].querySelector('.vox-chip-progress span');
            if (activeProgress) {
                activeProgress.style.animation = 'none';
                void activeProgress.offsetWidth; // force reflow
                activeProgress.style.animation = '';
            }
        };
        const startVoxAuto = () => {
            stopVoxAuto();
            voxTimer = setInterval(() => goVox((voxIndex + 1) % voxChips.length), VOX_DURATION);
        };
        const stopVoxAuto = () => { if (voxTimer) { clearInterval(voxTimer); voxTimer = null; } };

        voxChips.forEach((chip, i) => {
            chip.addEventListener('click', () => { goVox(i); startVoxAuto(); });
            chip.addEventListener('mouseenter', () => { if (i !== voxIndex) { goVox(i); } stopVoxAuto(); });
        });

        // Mobile prev/next — keeps counter in sync via vox-counter-current observer
        const voxMPrev = document.querySelector('.vox-mnav-prev');
        const voxMNext = document.querySelector('.vox-mnav-next');
        const voxMCurrent = document.querySelector('.vox-mnav-current');
        if (voxMPrev) voxMPrev.addEventListener('click', () => { goVox((voxIndex - 1 + voxChips.length) % voxChips.length); startVoxAuto(); });
        if (voxMNext) voxMNext.addEventListener('click', () => { goVox((voxIndex + 1) % voxChips.length); startVoxAuto(); });
        if (voxMCurrent && counterEl) {
            new MutationObserver(() => { voxMCurrent.textContent = counterEl.textContent; })
                .observe(counterEl, { childList: true, characterData: true, subtree: true });
        }

        const voxSection = document.querySelector('.vox');
        if (voxSection) {
            voxSection.addEventListener('mouseleave', startVoxAuto);
        }
        startVoxAuto();
    }

    // Experience moments — highlight active step on mobile while scrolling
    const expMoments = document.querySelectorAll('.exp-mt');
    if (expMoments.length && 'IntersectionObserver' in window) {
        const setActiveMoment = (target) => {
            expMoments.forEach(el => el.classList.toggle('active', el === target));
        };
        const expIO = new IntersectionObserver((entries) => {
            // Pick the entry closest to the viewport vertical center
            let best = null;
            let bestDist = Infinity;
            const center = window.innerHeight / 2;
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const r = e.target.getBoundingClientRect();
                const d = Math.abs((r.top + r.height / 2) - center);
                if (d < bestDist) { bestDist = d; best = e.target; }
            });
            if (best) setActiveMoment(best);
        }, { threshold: [0.25, 0.5, 0.75], rootMargin: '-20% 0px -20% 0px' });
        expMoments.forEach(el => expIO.observe(el));
    }

    // ===== Contact-page form (contact.html) — validate then submit to thank-you.html =====
    const contactPageForm = document.querySelector('.contact-page-form');
    if (contactPageForm) {
        contactPageForm.addEventListener('submit', (e) => {
            const required = contactPageForm.querySelectorAll('[required]');
            let valid = true;
            required.forEach(f => {
                if (!f.value.trim()) { f.style.borderColor = '#c0392b'; valid = false; }
                else { f.style.borderColor = ''; }
            });
            if (!valid) e.preventDefault();
        });
    }

    // ===== Inline contact form (property-detail.html sidebar) =====
    const contactForm = document.querySelector('.contact-card .contact-form');
    const contactSuccess = document.querySelector('.contact-card .contact-form-success');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const required = contactForm.querySelectorAll('[required]');
            let valid = true;
            required.forEach(f => {
                if (!f.value.trim()) { f.style.borderColor = '#c0392b'; valid = false; }
                else { f.style.borderColor = ''; }
            });
            if (!valid) return;
            contactForm.style.display = 'none';
            if (contactSuccess) contactSuccess.hidden = false;
        });
    }

    // ===== Gallery Lightbox (property-detail.html) =====
    const lightbox = document.getElementById('lightbox');
    const galleryItems = document.querySelectorAll('.gallery .g');
    if (lightbox && galleryItems.length) {
        const lbImg = lightbox.querySelector('.lb-img');
        const lbCounter = lightbox.querySelector('.lb-counter');
        const lbTitle = lightbox.querySelector('.lb-title');
        const lbPrev = lightbox.querySelector('.lb-prev');
        const lbNext = lightbox.querySelector('.lb-next');
        const lbClose = lightbox.querySelector('.lb-close');
        const slides = Array.from(galleryItems).map(g => {
            const img = g.querySelector('img');
            return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '' };
        });
        let lbIndex = 0;
        const total = slides.length;
        const renderLb = () => {
            const s = slides[lbIndex];
            lbImg.src = s.src;
            lbImg.alt = s.alt;
            if (lbCounter) lbCounter.textContent = `${String(lbIndex + 1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
            if (lbTitle) lbTitle.textContent = s.alt;
        };
        const openLb = (i) => {
            lbIndex = i;
            renderLb();
            lightbox.hidden = false;
            requestAnimationFrame(() => lightbox.classList.add('open'));
            document.body.classList.add('lb-open');
        };
        const closeLb = () => {
            lightbox.classList.remove('open');
            document.body.classList.remove('lb-open');
            setTimeout(() => { lightbox.hidden = true; }, 350);
        };
        const stepLb = (dir) => { lbIndex = (lbIndex + dir + total) % total; renderLb(); };

        galleryItems.forEach((g, i) => {
            g.setAttribute('role', 'button');
            g.setAttribute('tabindex', '0');
            g.addEventListener('click', () => openLb(i));
            g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
        });
        if (lbPrev) lbPrev.addEventListener('click', () => stepLb(-1));
        if (lbNext) lbNext.addEventListener('click', () => stepLb(1));
        if (lbClose) lbClose.addEventListener('click', closeLb);
        lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLb(); });
        document.addEventListener('keydown', (e) => {
            if (lightbox.hidden) return;
            if (e.key === 'Escape') closeLb();
            else if (e.key === 'ArrowRight') stepLb(1);
            else if (e.key === 'ArrowLeft') stepLb(-1);
        });
    }

    // Number counter
    const counters = document.querySelectorAll('[data-count]');
    if ('IntersectionObserver' in window) {
        const countIO = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const el = e.target;
                const target = parseFloat(el.dataset.count);
                const dec = (el.dataset.count.split('.')[1] || '').length;
                const dur = 1800;
                const start = performance.now();
                const tick = (now) => {
                    const t = Math.min((now - start) / dur, 1);
                    const eased = 1 - Math.pow(1 - t, 3);
                    el.textContent = (target * eased).toFixed(dec);
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
                countIO.unobserve(el);
            });
        }, { threshold: 0.4 });
        counters.forEach(c => countIO.observe(c));
    }
});

