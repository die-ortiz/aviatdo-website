// AviatDo — shared site script (countdown + main interaction/animation logic).
// Shared by index.html (EN) and index-es.html (ES); language-specific strings
// branch on document.documentElement.lang at runtime.

  (function(){
    var isES = document.documentElement.lang === 'es';
    var EVENT_START = new Date('2027-09-28T00:00:00');
    var el = document.getElementById('days-to-go-360');
    if (!el) return;
    var today = new Date();
    today.setHours(0,0,0,0);
    var diffDays = Math.ceil((EVENT_START - today) / 86400000);
    if (diffDays > 1) el.textContent = diffDays + (isES ? ' días para el evento' : ' days to go');
    else if (diffDays === 1) el.textContent = isES ? '1 día para el evento' : '1 day to go';
    else if (diffDays === 0) el.textContent = isES ? 'Comienza hoy' : 'Starts today';
    else el.textContent = isES ? 'En curso' : 'Now underway';
  })();

class DCLogic {}

class Component extends DCLogic {
  componentDidMount() {
    const isES = document.documentElement.lang === 'es';
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    // Read once at mount: which of the two CSS distance/spacing tiers below
    // is active, so the JS-driven scroll-scrubbed motion (reveal distances,
    // stagger offset, parallax strength, carousel centering) always matches
    // whichever set of .reveal/.reveal-slide/etc starting values the phone
    // breakpoint's CSS put in play, instead of the desktop numbers bleeding
    // through on a narrow viewport or vice versa.
    const isPhone = window.matchMedia && window.matchMedia('(max-width: 767px)').matches;

    // --- Footer copyright year — keeps "© 2026 AviatDo..." current
    // without editing it by hand every January. ---
    document.querySelectorAll('#copyright-year').forEach((el) => {
      el.textContent = new Date().getFullYear();
    });

    // --- Mobile nav — hamburger toggles the off-canvas #nav-panel drawer
    // (see the CSS above: #nav-panel is `display:contents` — and so
    // invisible to layout — above 900px, then becomes a fixed slide-in
    // panel below it). One shared <nav>, no duplicated markup. ---
    (function () {
      const navToggle = document.getElementById('nav-toggle');
      const navPanel = document.getElementById('nav-panel');
      const navBackdrop = document.getElementById('nav-backdrop');
      if (!navToggle || !navPanel) return;
      const setOpen = (open) => {
        document.documentElement.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? (isES ? 'Cerrar menú' : 'Close menu') : (isES ? 'Abrir menú' : 'Open menu'));
      };
      navToggle.addEventListener('click', () => {
        setOpen(!document.documentElement.classList.contains('nav-open'));
      });
      if (navBackdrop) navBackdrop.addEventListener('click', () => setOpen(false));
      navPanel.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
      const collapseMQ = window.matchMedia('(min-width: 901px)');
      const onCollapseChange = (e) => { if (e.matches) setOpen(false); };
      if (collapseMQ.addEventListener) collapseMQ.addEventListener('change', onCollapseChange);
      else if (collapseMQ.addListener) collapseMQ.addListener(onCollapseChange);
    })();

    // --- Why-AviatDo dot-map — the decorative background SVG uses a
    // tighter viewBox crop on phones (set here, matching mobile.html's own
    // narrower crop) so the dot texture reads at that size instead of
    // shrinking the whole 1600-wide map into a sliver. ---
    (function () {
      const dotMap = document.querySelector('#why-aviatdo svg[viewBox]');
      if (!dotMap) return;
      const applyViewBox = () => {
        const phone = window.matchMedia('(max-width: 767px)').matches;
        dotMap.setAttribute('viewBox', phone ? '220 0 500 560' : '0 0 1600 560');
      };
      applyViewBox();
      window.addEventListener('resize', applyViewBox);
    })();

    // --- Smooth scroll — the whole page glides with a touch of inertia
    // instead of jumping straight to the raw wheel/trackpad position. The
    // real (invisible) scrollbar still owns the true scroll range — via the
    // #smooth-spacer ghost below — while #page-root is nudged toward that
    // real position every frame with a lerp. Everything scroll-linked past
    // this point reads scrollState.y or registers into frameCallbacks
    // instead of listening for 'scroll' directly, so its motion stays
    // exactly in sync with what's actually on screen — including while the
    // page is still easing to a stop after the input itself has stopped.
    // Skipped entirely under reduced motion: that lag is exactly the kind
    // of motion the preference exists to suppress. ---
    const scrollState = { y: window.scrollY };
    const frameCallbacks = [];
    const pageRoot = document.getElementById('page-root');
    // Skipped at drawer-capable widths (<=900px, matching the nav-drawer
    // breakpoint): giving #page-root a transform makes it the CSS containing
    // block for any position:fixed descendant, including the off-canvas nav
    // drawer/backdrop nested inside it (needed there so the same nav markup
    // can serve both the inline desktop nav and the mobile drawer without
    // duplication). That very briefly mis-places the drawer/backdrop while
    // the lerp is still catching up after a fast programmatic scroll jump.
    // Native scrolling on phones/tablets is the better default anyway, so
    // this custom inertia effect is desktop-only.
    const allowSmoothScroll = window.matchMedia && window.matchMedia('(min-width: 901px)').matches;
    const useSmoothTransform = !!(pageRoot && !reduceMotion && allowSmoothScroll);
    if (useSmoothTransform) {
      const spacer = document.createElement('div');
      spacer.id = 'smooth-spacer';
      spacer.setAttribute('aria-hidden', 'true');
      pageRoot.insertAdjacentElement('afterend', spacer);
      pageRoot.classList.add('smooth-active');

      const syncSpacerHeight = () => { spacer.style.height = pageRoot.scrollHeight + 'px'; };
      syncSpacerHeight();
      window.addEventListener('resize', syncSpacerHeight);
      window.addEventListener('load', syncSpacerHeight);
      setTimeout(syncSpacerHeight, 600); // late webfonts/images can still grow the page
    }
    // The RAF ticker itself (scrollState + frameCallbacks) still runs at
    // drawer-capable widths even though the page-root transform above is
    // skipped there — reveal animations, parallax and the progress bar all
    // read scrollState.y/frameCallbacks, not the transform, so they keep
    // working; scrollState.y just tracks the native scroll position 1:1
    // instead of lagging behind it with the desktop-only inertia lerp.
    if (!reduceMotion) {
      const LERP = 0.085; // lower = silkier and more lag; matched to feel weighty, not sluggish
      const smoothLoop = () => {
        const target = window.scrollY;
        if (useSmoothTransform) {
          scrollState.y += (target - scrollState.y) * LERP;
          if (Math.abs(target - scrollState.y) < 0.05) scrollState.y = target;
          // Rounded to the nearest pixel before it hits the transform — the lerp
          // above needs float precision to settle smoothly, but feeding a
          // fractional value straight into translate3d forces every line of
          // text on the page onto a sub-pixel offset every frame, which reads
          // as a soft blur while scrolling (most visible on type). Rounding
          // here keeps the easing feel while keeping text crisp.
          pageRoot.style.transform = `translate3d(0, ${-Math.round(scrollState.y)}px, 0)`;
        } else {
          scrollState.y = target;
        }
        for (const fn of frameCallbacks) fn();
        requestAnimationFrame(smoothLoop);
      };
      requestAnimationFrame(smoothLoop);
    }

    // --- Hash-link scrolling — native anchor jumps (href="#contact" etc.)
    // silently do nothing here: the target lives inside #page-root, which is
    // position:fixed on desktop for the smooth-scroll effect above, and
    // browsers can't compute a native scroll offset for an element behind a
    // fixed ancestor. The click still updates location.hash, so the bug
    // reads as "the button does nothing" rather than an obvious error.
    // Intercept same-page hash clicks and drive window.scrollTo ourselves;
    // the existing smoothLoop already lerps #page-root toward
    // window.scrollY every frame, so this gets the same eased motion as a
    // real wheel scroll for free. Also handles landing on a page with a
    // hash already in the URL (e.g. services.html linking to
    // index.html#contact), where the browser's own on-load scroll-to-hash
    // has the identical problem. ---
    (function () {
      const scrollToHash = (id, behavior) => {
        const target = document.getElementById(id);
        if (!target) return false;
        // rect.top + window.scrollY only equals the absolute target position
        // once #page-root's transform is in sync with window.scrollY — true
        // after a real scroll (the in-page click case below), but NOT yet
        // true right when a page first loads with the hash already in the
        // URL: #page-root has just gone position:fixed with no transform
        // applied yet, so it's still rendering at its raw, untransformed
        // document position. Adding window.scrollY on top of that double-
        // counts the offset and overshoots — observed as the link landing
        // near the footer regardless of which section it pointed to.
        // Measuring relative to #page-root's own rect sidesteps this: both
        // rects move together under any transform, so their difference is
        // always the target's constant offset from #page-root's top, which
        // itself sits at document y0 (the fixed header/progress bar take no
        // flow space).
        const y = useSmoothTransform
          ? target.getBoundingClientRect().top - pageRoot.getBoundingClientRect().top
          : target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, left: 0, behavior: behavior || 'auto' });
        return true;
      };
      document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((link) => {
        link.addEventListener('click', (e) => {
          const id = link.getAttribute('href').slice(1);
          if (scrollToHash(id)) {
            e.preventDefault();
            history.pushState(null, '', '#' + id);
          }
        });
      });
      if (location.hash.length > 1) {
        const id = location.hash.slice(1);
        scrollToHash(id);
        // Layout (fonts/images/the smooth-spacer height) may still be
        // settling right after the first attempt — redo it once everything
        // has finished loading.
        window.addEventListener('load', () => scrollToHash(id));
      }
    })();

    // --- Scroll progress bar — a status indicator, kept live regardless of reduced-motion ---
    const progressBar = document.getElementById('scroll-progress-bar');
    if (progressBar) {
      const updateProgressBar = () => {
        const doc = document.documentElement;
        const max = (doc.scrollHeight || document.body.scrollHeight) - window.innerHeight;
        const y = reduceMotion ? window.scrollY : scrollState.y;
        const pct = max > 0 ? Math.min(100, Math.max(0, (y / max) * 100)) : 0;
        progressBar.style.width = pct + '%';
      };
      if (reduceMotion) {
        window.addEventListener('scroll', updateProgressBar, { passive: true });
        window.addEventListener('resize', updateProgressBar);
      } else {
        frameCallbacks.push(updateProgressBar);
        window.addEventListener('resize', updateProgressBar);
      }
      updateProgressBar();
    }

    // --- Sticky header background — #site-header is fixed at every width
    // (see the HTML comment above it for why it lives outside #page-root),
    // floating transparent over the hero until scrolled, then flips to a
    // solid/blurred background via the .scrolled class so nav text stays
    // legible over whatever's now behind it. Same reduceMotion fallback
    // pattern as the progress bar above, since this doesn't need the RAF
    // loop's precision — a plain scroll listener reads the threshold fine. ---
    const siteHeader = document.getElementById('site-header');
    if (siteHeader) {
      const SCROLLED_THRESHOLD = 24;
      const headerLogo = siteHeader.querySelector('.header-logo');
      const updateHeaderScrolled = () => {
        const y = reduceMotion ? window.scrollY : scrollState.y;
        const scrolled = y > SCROLLED_THRESHOLD;
        siteHeader.classList.toggle('scrolled', scrolled);
        if (headerLogo) {
          const nextSrc = scrolled ? headerLogo.dataset.dark : headerLogo.dataset.light;
          if (headerLogo.getAttribute('src') !== nextSrc) headerLogo.setAttribute('src', nextSrc);
        }
      };
      if (reduceMotion) {
        window.addEventListener('scroll', updateHeaderScrolled, { passive: true });
      } else {
        frameCallbacks.push(updateHeaderScrolled);
      }
      updateHeaderScrolled();
    }

    // --- The Venue hero video — some mobile browsers (in-app webviews,
    // data-saver mode) ignore the autoplay/muted attributes and leave the
    // video parked on its poster frame. Force muted+play on load, then
    // retry once on the first tap/scroll in case the browser was waiting
    // on a user gesture before it would allow playback. ---
    (function () {
      const heroVideo = document.querySelector('.venue-hero-video');
      if (!heroVideo) return;
      const tryPlay = () => { heroVideo.muted = true; heroVideo.play().catch(() => {}); };
      tryPlay();
      const resumeOnGesture = () => {
        if (heroVideo.paused) tryPlay();
        window.removeEventListener('touchstart', resumeOnGesture);
        window.removeEventListener('scroll', resumeOnGesture);
        window.removeEventListener('click', resumeOnGesture);
      };
      window.addEventListener('touchstart', resumeOnGesture, { passive: true, once: true });
      window.addEventListener('scroll', resumeOnGesture, { passive: true, once: true });
      window.addEventListener('click', resumeOnGesture, { once: true });
    })();

    // --- Home "Our Experts" preview — finger/trackpad-scrollable, looping
    // infinitely in either direction. The track holds the 8-card set three
    // times (see index.html): a hidden decorative copy, the real
    // accessible one, another hidden decorative copy. Scrolling starts in
    // the middle (real) copy; whenever scroll strays into a buffer copy,
    // scrollLeft silently jumps back by exactly one set's width — since
    // the copies are pixel-identical, the jump lands on the same visual
    // frame and reads as an endless track instead of a seam or dead end. ---
    (function () {
      const expertsCarousel = document.getElementById('experts-carousel');
      if (!expertsCarousel) return;
      // (scrollWidth + gap) / 3, not scrollWidth / 3: 24 cards in a row only
      // have 23 gaps between them, so a plain three-way split undercounts by
      // one gap and the wrap would land a few pixels short of the identical
      // card underneath it.
      const setWidth = () => {
        const gap = parseFloat(getComputedStyle(expertsCarousel).columnGap || getComputedStyle(expertsCarousel).gap) || 0;
        return (expertsCarousel.scrollWidth + gap) / 3;
      };
      const recenter = () => { expertsCarousel.scrollLeft = setWidth(); };
      requestAnimationFrame(recenter);
      let pending = false;
      expertsCarousel.addEventListener('scroll', () => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          const w = setWidth();
          if (expertsCarousel.scrollLeft < w) expertsCarousel.scrollLeft += w;
          else if (expertsCarousel.scrollLeft >= w * 2) expertsCarousel.scrollLeft -= w;
          pending = false;
        });
      }, { passive: true });
      window.addEventListener('resize', recenter);

      // Native overflow-x:auto only picks up wheel/trackpad/touch input —
      // a plain mouse has no built-in way to drag-scroll it, so without
      // this a desktop mouse user is stuck (trackpad/touch users never
      // noticed anything was missing). Standard click-and-drag: track the
      // pointer while the primary button is held, translate horizontal
      // movement 1:1 into scrollLeft, and suppress the click that would
      // otherwise fire on mouseup after a real drag (so dragging across a
      // card doesn't also trigger it as a click).
      let isDown = false;
      let dragged = false;
      let startX = 0;
      let startScroll = 0;
      expertsCarousel.addEventListener('mousedown', (e) => {
        isDown = true;
        dragged = false;
        startX = e.pageX;
        startScroll = expertsCarousel.scrollLeft;
        expertsCarousel.classList.add('is-dragging');
      });
      window.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const delta = e.pageX - startX;
        if (Math.abs(delta) > 3) dragged = true;
        expertsCarousel.scrollLeft = startScroll - delta;
      });
      window.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        expertsCarousel.classList.remove('is-dragging');
      });
      expertsCarousel.addEventListener('click', (e) => {
        if (dragged) { e.preventDefault(); e.stopPropagation(); }
      }, true);
    })();

    // --- Scroll-scrubbed reveal: opacity/translateY (and, where present, the
    // accent underline) are driven directly from live layout position every
    // frame, so the motion is pinned 1:1 to how far the visitor has
    // scrolled — never a fixed-duration timer that can finish before they
    // notice it, and automatically in sync with the smoothed scroll above
    // since getBoundingClientRect reflects it. (Portrait/photo frames used
    // to also clip-path curtain-wipe here, scrubbed the same way — dropped
    // because arriving via a direct link/anchor could land mid-progress,
    // cropping a face or photo rather than reading as a reveal.) ---
    const targets = Array.from(document.querySelectorAll('.reveal:not(.reveal-no-fade)'));
    if (targets.length) {
      if (reduceMotion) {
        targets.forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
          const bar = el.querySelector('.accent-bar');
          if (bar) bar.style.transform = 'scaleX(1)';
        });
      } else {
        // Matches whichever tier of the CSS .reveal/.reveal-slide/etc starting
        // transforms is active (see isPhone above) — desktop's wider distances
        // above 767px, mobile.html's tighter ones at/below it.
        const DIST = isPhone ? 36 : 40; // px each element travels — matches the CSS .reveal starting transform
        const SLIDE_DIST = isPhone ? 44 : 60; // px the .reveal-slide row travels horizontally
        const SLIDE_RIGHT_DIST = isPhone ? 52 : 72; // px the .reveal-slide-right card travels horizontally
        const RISE_DIST = isPhone ? 64 : 96; // px the .reveal-rise contact block travels vertically
        const items = targets.map((el) => {
          // Elements that were staggered via an inline animation-delay keep that
          // stagger here too, expressed as a scroll-distance offset instead of time.
          const delaySec = parseFloat(el.style.animationDelay || getComputedStyle(el).animationDelay) || 0;
          return {
            el,
            offset: delaySec * (isPhone ? 220 : 260),
            bar: el.querySelector('.accent-bar'),
            slide: el.classList.contains('reveal-slide'),
            slideRight: el.classList.contains('reveal-slide-right'),
            rise: el.classList.contains('reveal-rise'),
          };
        });

        const update = () => {
          const vh = window.innerHeight;
          // The reveal window: starts when an element's top is 88% down the
          // viewport, finishes once it has scrolled up to 42% — a wide window
          // so the fade+rise plays out visibly across real scroll distance
          // instead of snapping shut in a fraction of a wheel-tick.
          const startLine = vh * (isPhone ? 0.9 : 0.88);
          const endLine = vh * (isPhone ? 0.4 : 0.42);
          for (const item of items) {
            const rect = item.el.getBoundingClientRect();
            const top = rect.top + item.offset;
            let progress = (startLine - top) / (startLine - endLine);
            if (progress < 0) progress = 0;
            else if (progress > 1) progress = 1;
            item.el.style.opacity = String(progress);
            // Rounded for the same reason as the page-root transform above —
            // an un-rounded px value here would put each card's own text on
            // a sub-pixel offset for the length of its entrance.
            let translate;
            if (item.slide) translate = `translateX(${Math.round((1 - progress) * -SLIDE_DIST)}px)`;
            else if (item.slideRight) translate = `translateX(${Math.round((1 - progress) * SLIDE_RIGHT_DIST)}px)`;
            else if (item.rise) translate = `translateY(${Math.round((1 - progress) * RISE_DIST)}px)`;
            else translate = `translateY(${Math.round((1 - progress) * DIST)}px)`;
            item.el.style.transform = progress >= 1 ? 'none' : translate;
            if (item.bar) {
              const barProgress = Math.max(0, Math.min(1, (progress - 0.35) / 0.65));
              item.bar.style.transform = `scaleX(${barProgress})`;
            }
          }
        };
        frameCallbacks.push(update);
        window.addEventListener('resize', update);
        update();
      }
    }

    // --- Stats counters — decoupled from scroll position on purpose: the row
    // above is always fully visible (no fade), so the digits get their own
    // fixed-duration count-up, triggered once when the row enters view, that
    // always finishes at the true value instead of stalling at whatever
    // scroll-scrubbed progress happened to be computed at page-load. ---
    const counterEls = Array.from(document.querySelectorAll('.reveal-no-fade .stat-counter'));
    if (counterEls.length) {
      // Always animate, even under prefers-reduced-motion: a numeric count-up has
      // none of the vestibular risk of the parallax/slide effects reduced motion
      // is meant to suppress, and skipping it made the row look like it never loaded.
      {
        const COUNT_DURATION = 3200; // ms
        const START_DELAY = 700; // ms — lets the page settle first so the count-up
                                  // reads as a deliberate animation instead of finishing
                                  // before the visitor's eye has actually landed on it
        const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
        const animateCounter = (counter) => {
          const target = parseInt(counter.dataset.target, 10) || 0;
          setTimeout(() => {
            const start = performance.now();
            const step = (now) => {
              const t = Math.min(1, (now - start) / COUNT_DURATION);
              counter.textContent = String(Math.round(easeOutQuad(t) * target));
              if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }, START_DELAY);
        };
        if ('IntersectionObserver' in window) {
          const counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.4 });
          counterEls.forEach((counter) => counterObserver.observe(counter));
        } else {
          // No IntersectionObserver support — count up right away.
          counterEls.forEach(animateCounter);
        }
      }
    }

    // --- Hero parallax — the photo drifts slower than the page for a sense
    // of depth, reading scrollState.y so it drifts on the same eased motion
    // as everything else instead of jumping ahead of it. Same treatment for
    // services.html/experts.html's page-header banner photo — it's the
    // first section in #page-root just like the home hero, so it's anchored
    // to scrollY 0 the same way rather than the mid-page #aviatdo-360
    // approach below. ---
    if (!reduceMotion) {
      const parallax = document.querySelector('.hero-parallax, .page-header-photo');
      if (parallax) {
        const updateParallax = () => {
          const y = isPhone ? Math.min(scrollState.y * 0.15, 70) : Math.min(scrollState.y * 0.18, 90);
          parallax.style.transform = `translate3d(0, ${y}px, 0)`;
        };
        frameCallbacks.push(updateParallax);
        updateParallax();
      }
    }

    // --- AviatDo 360 parallax — same drifting-background technique as the hero,
    // anchored to this section's own scroll offset since it sits mid-page rather
    // than at scrollY 0 ---
    if (!reduceMotion) {
      const s360Section = document.getElementById('aviatdo-360');
      const s360Parallax = s360Section && s360Section.querySelector('.s360-parallax');
      if (s360Section && s360Parallax) {
        const s360Cap = isPhone ? 40 : 70;
        const s360Strength = isPhone ? 0.08 : 0.12;
        const updateS360Parallax = () => {
          const traveled = scrollState.y - s360Section.offsetTop;
          const y = Math.max(-s360Cap, Math.min(traveled * s360Strength, s360Cap));
          s360Parallax.style.transform = `translate3d(0, ${y}px, 0)`;
        };
        frameCallbacks.push(updateS360Parallax);
        updateS360Parallax();
      }
    }

    // --- Partners double carousel — ported from the Jack portfolio technique: two
    // rows drift in opposite directions as a function of scroll position, rather
    // than looping at a fixed CSS-animation speed. ---
    if (!reduceMotion) {
      const partnerSection = document.getElementById('partners');
      const row1 = partnerSection && partnerSection.querySelector('.partner-row[data-row="1"]');
      const row2 = partnerSection && partnerSection.querySelector('.partner-row[data-row="2"]');
      if (row1 && row2) {
        const updateCarousel = () => {
          const sectionTop = partnerSection.offsetTop;
          const shift = isPhone ? 140 : 200;
          const offset = (scrollState.y - sectionTop + window.innerHeight) * 0.15;
          row1.style.transform = `translateX(${offset - shift}px)`;
          row2.style.transform = `translateX(${-(offset - shift)}px)`;
        };
        frameCallbacks.push(updateCarousel);
        updateCarousel();
      }
    }

    // --- Magnetic CTA — nudges toward the cursor, desktop pointer only ---
    if (!reduceMotion && finePointer) {
      document.querySelectorAll('.magnetic').forEach((btn) => {
        const strength = 8;
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const relX = e.clientX - (rect.left + rect.width / 2);
          const relY = e.clientY - (rect.top + rect.height / 2);
          btn.style.transform = `translate3d(${relX / strength}px, ${relY / strength}px, 0)`;
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    }

    // --- Services card tilt — a light 3D tilt toward the cursor, desktop pointer only ---
    if (!reduceMotion && finePointer) {
      document.querySelectorAll('.tilt-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width - 0.5;
          const relY = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(800px) rotateX(${relY * -6}deg) rotateY(${relX * 6}deg) scale3d(1.03, 1.03, 1.03)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'none';
        });
      });
    }

    // --- Booking modal — mockup scheduling calendar opened from the hero
    // "Book a consultation" CTA (#book-consultation-btn). Entirely
    // client-side: picking a date + time and confirming just swaps in an
    // inline success message — there's no live calendar or backend behind
    // it yet, matching the rest of the site's demo-stage scope. ---
    (function () {
      const trigger = document.getElementById('book-consultation-btn');
      const overlay = document.getElementById('booking-overlay');
      if (!trigger || !overlay) return;
      const modal = overlay.querySelector('.booking-modal');
      const closeBtn = document.getElementById('booking-close');
      const doneBtn = document.getElementById('booking-done');
      const stripPrevBtn = document.getElementById('booking-strip-prev');
      const stripNextBtn = document.getElementById('booking-strip-next');
      const stripEl = document.getElementById('booking-day-strip');
      const timesSection = document.getElementById('booking-times-section');
      const timesWrap = document.getElementById('booking-times');
      const confirmBtn = document.getElementById('booking-confirm');
      const pickView = document.getElementById('booking-pick-view');
      const successView = document.getElementById('booking-success-view');
      const summaryEl = document.getElementById('booking-summary');
      const expertRow = document.getElementById('booking-expert-row');
      const successExpertEl = document.getElementById('booking-success-expert');
      const nameInput = document.getElementById('booking-name');
      const emailInput = document.getElementById('booking-email');
      const phoneInput = document.getElementById('booking-phone');
      const successNote = document.getElementById('booking-success-note');

      const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00'];
      // How many upcoming days the horizontal strip renders — enough to
      // scroll through, no month-jump navigation needed.
      const STRIP_DAYS = 60;
      // All 8 team members from Our Experts — full roster, matching the
      // dedicated experts.html page now that every one of them has a
      // real photo/bio (originally just the 4-person #experts preview
      // set, before Marina Pistarini and Allyson Kukel were added).
      const EXPERTS = [
        { name: 'Ana Persiani', role: isES ? 'Cofundadora y CEO' : 'Co-Founder & CEO', img: 'images/ana-persiani.jpg' },
        { name: 'Alfredo Sol', role: isES ? 'Estrategias Financieras' : 'Financial Strategies', img: 'images/alfredo-sol.jpg' },
        { name: 'Armando Portillo', role: isES ? 'Consultor de Operaciones de Vuelo' : 'Flight Ops Consultant', img: 'images/armando-portillo.jpg' },
        { name: 'Gessica Gomez', role: isES ? 'Consultora de Entrenamiento' : 'Training Consultant', img: 'images/gessica-gomez.jpg' },
        { name: 'José Miguel Rivera', role: isES ? 'Consultor de Operaciones de Vuelo' : 'Flight Ops Consultant', img: 'images/jose-miguel-rivera.jpg' },
        { name: 'Regina Blanco', role: isES ? 'Oficial de Comunicaciones' : 'Communications Officer', img: 'images/regina-blanco.jpg' },
        { name: 'Marina Pistarini', role: isES ? 'Desarrollo de Negocios' : 'Business Development', img: 'images/marina-pistarini.jpg' },
        { name: 'Allyson Kukel', role: isES ? 'Consultora' : 'Consultant', img: 'images/allyson-kukel.jpg' },
      ];
      const dateFormatter = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      const dowFormatter = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { weekday: 'short' });
      const monthAbbrFormatter = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { month: 'short' });
      if (expertRow) {
        expertRow.innerHTML = EXPERTS.map((ex, idx) => `
          <button type="button" class="booking-expert-card" role="option" aria-selected="false" data-idx="${idx}">
            <span class="booking-avatar"><img src="${ex.img}" alt="" loading="lazy"></span>
            <span class="booking-expert-card-name">${ex.name}</span>
            <span class="booking-expert-card-role">${ex.role}</span>
          </button>`).join('');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let selectedDate = null;
      let selectedTime = null;
      let selectedExpert = null;
      let lastFocused = null;

      const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      // Deterministic pseudo-availability, purely for visual realism — no
      // real scheduling data exists yet, so every future weekday being open
      // would read as fake. A handful of dates/slots per month show as
      // already booked instead.
      const isDateBooked = (d) => d.getDate() % 9 === 0;
      const isTimeBooked = (d, idx) => (d.getDate() + idx) % 5 === 0;
      const isValidEmail = (v) => /^\S+@\S+\.\S+$/.test(v.trim());
      const escapeHtml = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

      function renderStrip() {
        let html = '';
        for (let i = 0; i < STRIP_DAYS; i++) {
          const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
          const disabled = date.getDay() === 0 || date.getDay() === 6 || isDateBooked(date);
          const isSelected = sameDay(date, selectedDate);
          const classes = ['booking-date-chip'];
          if (sameDay(date, today)) classes.push('is-today');
          if (isSelected) classes.push('is-selected');
          const isFirstOfMonth = i === 0 || date.getDate() === 1;
          const monthLabel = isFirstOfMonth ? monthAbbrFormatter.format(date).replace('.', '') : '';
          const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          html += `<button type="button" class="${classes.join(' ')}" data-date="${iso}"${disabled ? ' disabled' : ''} role="option" aria-selected="${isSelected ? 'true' : 'false'}"><span class="booking-date-chip-month">${monthLabel}</span><span class="booking-date-chip-dow">${dowFormatter.format(date).replace('.', '')}</span><span class="booking-date-chip-num">${date.getDate()}</span></button>`;
        }
        stripEl.innerHTML = html;
      }

      function renderTimes() {
        if (!selectedDate) { timesSection.hidden = true; timesWrap.innerHTML = ''; return; }
        timesSection.hidden = false;
        timesWrap.innerHTML = TIME_SLOTS.map((t, idx) => {
          const disabled = isTimeBooked(selectedDate, idx);
          const selected = t === selectedTime;
          return `<button type="button" class="booking-time${selected ? ' is-selected' : ''}" data-time="${t}"${disabled ? ' disabled' : ''}>${t}</button>`;
        }).join('');
      }

      function updateConfirmState() {
        const nameOk = !!(nameInput && nameInput.value.trim());
        const emailOk = !!(emailInput && isValidEmail(emailInput.value));
        confirmBtn.disabled = !(selectedExpert && selectedDate && selectedTime && nameOk && emailOk);
      }
      if (nameInput) nameInput.addEventListener('input', updateConfirmState);
      if (emailInput) emailInput.addEventListener('input', updateConfirmState);

      function selectExpert(idx) {
        selectedExpert = EXPERTS[idx];
        if (expertRow) expertRow.querySelectorAll('.booking-expert-card').forEach((card, i) => {
          card.classList.toggle('is-selected', i === idx);
          card.setAttribute('aria-selected', i === idx ? 'true' : 'false');
        });
        updateConfirmState();
      }

      function resetBooking() {
        selectedDate = null;
        selectedTime = null;
        selectedExpert = null;
        pickView.hidden = false;
        successView.hidden = true;
        if (expertRow) expertRow.querySelectorAll('.booking-expert-card').forEach((card) => {
          card.classList.remove('is-selected');
          card.setAttribute('aria-selected', 'false');
        });
        if (nameInput) nameInput.value = '';
        if (emailInput) emailInput.value = '';
        if (phoneInput) phoneInput.value = '';
        renderStrip();
        renderTimes();
        updateConfirmState();
        if (stripEl) stripEl.scrollLeft = 0;
      }

      function onKeydown(e) {
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled])')).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }

      function openModal() {
        lastFocused = document.activeElement;
        resetBooking();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('booking-open');
        closeBtn.focus();
        document.addEventListener('keydown', onKeydown);
      }

      function closeModal() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('booking-open');
        document.removeEventListener('keydown', onKeydown);
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      }

      trigger.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
      closeBtn.addEventListener('click', closeModal);
      doneBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      if (stripPrevBtn) stripPrevBtn.addEventListener('click', () => { stripEl.scrollBy({ left: -208, behavior: 'smooth' }); });
      if (stripNextBtn) stripNextBtn.addEventListener('click', () => { stripEl.scrollBy({ left: 208, behavior: 'smooth' }); });

      if (expertRow) {
        expertRow.addEventListener('click', (e) => {
          const card = e.target.closest('.booking-expert-card');
          if (!card) return;
          selectExpert(Number(card.dataset.idx));
        });
      }

      stripEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.booking-date-chip:not(:disabled)');
        if (!btn) return;
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        selectedDate = new Date(y, m - 1, d);
        selectedTime = null;
        renderStrip();
        renderTimes();
        updateConfirmState();
      });

      timesWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.booking-time:not(:disabled)');
        if (!btn) return;
        selectedTime = btn.dataset.time;
        renderTimes();
        updateConfirmState();
      });

      confirmBtn.addEventListener('click', () => {
        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        if (!selectedExpert || !selectedDate || !selectedTime || !name || !isValidEmail(email)) return;
        const dateStr = dateFormatter.format(selectedDate);
        summaryEl.textContent = isES ? `${dateStr} a las ${selectedTime}` : `${dateStr} at ${selectedTime}`;
        if (successExpertEl) {
          successExpertEl.innerHTML = `
            <span class="booking-avatar"><img src="${selectedExpert.img}" alt="" loading="lazy"></span>
            <span class="booking-expert-chip-text">
              <span class="booking-expert-chip-name">${selectedExpert.name}</span>
              <span class="booking-expert-chip-role">${selectedExpert.role}</span>
            </span>`;
        }
        if (successNote) {
          const emailSafe = escapeHtml(email);
          successNote.innerHTML = isES
            ? `Te confirmamos el horario por email a <strong>${emailSafe}</strong> en breve.`
            : `We'll confirm your slot by email at <strong>${emailSafe}</strong> shortly.`;
        }
        pickView.hidden = true;
        successView.hidden = false;
      });
    })();

    // --- Contact form (#contact) — same "no real backend" mockup pattern
    // as the booking modal above: submitting today would otherwise let the
    // browser GET-submit the form to itself (index.html?FirstName=...),
    // since there's no action/method/handler. Intercept it and show an
    // inline success message instead. ---
    (function () {
      const form = document.getElementById('contact-form');
      if (!form) return;
      const fields = document.getElementById('contact-form-fields');
      const success = document.getElementById('contact-success');
      const emailInput = document.getElementById('contact-email');
      const successEmail = document.getElementById('contact-success-email');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (successEmail) successEmail.textContent = (emailInput && emailInput.value) || (isES ? 'tu email' : 'your email');
        // fields carries an inline display:flex, which beats the [hidden]
        // UA rule's display:none — set display directly instead of relying
        // on the hidden property here.
        if (fields) fields.style.display = 'none';
        if (success) success.hidden = false;
      });
    })();

    // --- Sponsorship inquiry modal (AviatDo 360° Sponsorship page) — a
    // single shared modal opened by every "Ask about..." CTA across the
    // pricing tiers, Contributing add-ons and exhibit-space cards. The
    // clicked card's package name (data-package) is written into every
    // .sponsor-package-name element, so the same span feeds both the
    // modal heading and the fake-success sentence. Same sibling-of-
    // #page-root placement and no-backend mockup pattern as the booking
    // modal and contact form above. ---
    (function () {
      const overlay = document.getElementById('sponsor-overlay');
      if (!overlay) return;
      const modal = overlay.querySelector('.booking-modal');
      const closeBtn = document.getElementById('sponsor-close');
      const form = document.getElementById('sponsor-form');
      const successView = document.getElementById('sponsor-success-view');
      const packageNameEls = document.querySelectorAll('.sponsor-package-name');
      const emailInput = document.getElementById('sponsor-email');
      const successEmailEl = document.getElementById('sponsor-success-email');
      let lastFocused = null;

      function resetForm() {
        form.reset();
        form.hidden = false;
        successView.hidden = true;
      }

      function onKeydown(e) {
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled])')).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }

      function openModal(packageName) {
        lastFocused = document.activeElement;
        resetForm();
        packageNameEls.forEach((el) => { el.textContent = packageName; });
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('booking-open');
        closeBtn.focus();
        document.addEventListener('keydown', onKeydown);
      }

      function closeModal() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('booking-open');
        document.removeEventListener('keydown', onKeydown);
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      }

      document.querySelectorAll('.sponsor-cta').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(btn.dataset.package || '');
        });
      });

      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (successEmailEl) successEmailEl.textContent = (emailInput && emailInput.value) || (isES ? 'tu email' : 'your email');
        form.hidden = true;
        successView.hidden = false;
      });
    })();

    // --- Resource download gate (Resources page) — a single shared modal
    // opened by every "Download" link, across both cards. Asks for an
    // email, then opens the real PDF the visitor originally clicked.
    // No backend behind the email capture (same mockup scope as the
    // booking and sponsorship modals above); the download itself is real.
    (function () {
      const overlay = document.getElementById('resource-gate-overlay');
      if (!overlay) return;
      const modal = overlay.querySelector('.booking-modal');
      const closeBtn = document.getElementById('resource-gate-close');
      const form = document.getElementById('resource-gate-form');
      const successView = document.getElementById('resource-gate-success-view');
      const fallbackLink = document.getElementById('resource-gate-fallback-link');
      let lastFocused = null;
      let pendingUrl = null;

      function resetForm() {
        form.reset();
        form.hidden = false;
        successView.hidden = true;
      }

      function onKeydown(e) {
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), [href], input:not([disabled])')).filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }

      function openModal(url) {
        lastFocused = document.activeElement;
        pendingUrl = url;
        resetForm();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('booking-open');
        closeBtn.focus();
        document.addEventListener('keydown', onKeydown);
      }

      function closeModal() {
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('booking-open');
        document.removeEventListener('keydown', onKeydown);
        if (lastFocused && lastFocused.focus) lastFocused.focus();
      }

      document.querySelectorAll('[data-resource-gate]').forEach((link) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(link.href);
        });
      });

      closeBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (pendingUrl) {
          window.open(pendingUrl, '_blank', 'noopener');
          if (fallbackLink) fallbackLink.href = pendingUrl;
        }
        form.hidden = true;
        successView.hidden = false;
      });
    })();

    // --- AviatDo 360° Program page — day-by-day schedule tabs. Only exists
    // on aviatdo-360-program.html / -es.html; a no-op elsewhere since
    // .day-tab isn't in the DOM. ---
    (function () {
      const tabs = document.querySelectorAll('.day-tab');
      if (!tabs.length) return;
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const day = tab.getAttribute('data-day');
          tabs.forEach((t) => {
            const active = t === tab;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', active ? 'true' : 'false');
          });
          document.querySelectorAll('.day-panel').forEach((panel) => {
            const active = panel.id === 'day-panel-' + day;
            panel.classList.toggle('active', active);
            panel.hidden = !active;
          });
        });
      });
    })();

    // --- AviatDo 360° Register page — category qty picker, order summary
    // and a 3-step on-page registration flow (Add your details ->
    // Registration details -> Payment) mirroring the live site's real Wix
    // checkout steps, minus an actual card form: step 3 is a "we'll follow
    // up to arrange payment" notice instead, same mockup scope as the
    // booking modal (no backend, but the interaction itself works). Only
    // exists on aviatdo-360-register.html / -es.html; a no-op elsewhere
    // since #ticket-step-tickets isn't in the DOM. ---
    (function () {
      const stepTickets = document.getElementById('ticket-step-tickets');
      if (!stepTickets) return;
      const stepDetails = document.getElementById('ticket-step-details');
      const stepAttendee = document.getElementById('ticket-step-attendee');
      const stepPayment = document.getElementById('ticket-step-payment');
      const stepSuccess = document.getElementById('ticket-step-success');
      const rows = document.querySelectorAll('.ticket-row[data-ticket]');
      const checkoutBtn = document.getElementById('ticket-checkout-btn');
      const step1Form = document.getElementById('ticket-step1-form');
      const step2Form = document.getElementById('ticket-step2-form');
      const submitBtn = document.getElementById('ticket-submit-btn');
      const backToCategoriesBtn = document.getElementById('ticket-back-to-categories-btn');
      const backToDetailsBtn = document.getElementById('ticket-back-to-details-btn');
      const backToAttendeeBtn = document.getElementById('ticket-back-to-attendee-btn');

      function goTo(step) {
        [stepTickets, stepDetails, stepAttendee, stepPayment, stepSuccess].forEach((el) => {
          if (el) el.hidden = el !== step;
        });
        // Two desktop-only quirks from the #page-root smooth-scroll transform
        // (see componentDidMount above): 1) the #smooth-spacer sibling that
        // drives native scroll range has its height measured once at mount/
        // resize, so swapping to a step of very different height without
        // re-measuring leaves stale scroll range — blank space (or a cut-off
        // page) below the footer once you're past the shortest step; 2)
        // step.scrollIntoView() can't compute an offset for an element behind
        // a position:fixed ancestor, so it silently does nothing. Same fix
        // for both: resize event to force the spacer to re-measure, then
        // scroll manually the same way the existing hash-link handler does.
        window.dispatchEvent(new Event('resize'));
        const y = step.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, left: 0, behavior: 'smooth' });
      }

      function renderSummaryInto(linesEl, emptyText) {
        linesEl.innerHTML = '';
        let total = 0;
        let any = false;
        rows.forEach((row) => {
          const qty = parseInt(row.querySelector('.qty-value').textContent, 10) || 0;
          if (!qty) return;
          any = true;
          const price = parseFloat(row.getAttribute('data-price'));
          const name = row.getAttribute('data-name');
          total += price * qty;
          const line = document.createElement('div');
          line.className = 'order-summary-line';
          line.innerHTML = '<span class="order-summary-line-name">' + name + ' &times; ' + qty + '</span><span class="order-summary-line-price">$' + (price * qty) + '</span>';
          linesEl.appendChild(line);
        });
        if (!any) {
          const empty = document.createElement('p');
          empty.style.margin = '0';
          empty.style.fontSize = '14px';
          empty.style.color = 'var(--muted)';
          empty.textContent = emptyText;
          linesEl.appendChild(empty);
        }
        return total;
      }

      const emptyEl = document.getElementById('ticket-summary-empty');
      const emptyText = emptyEl ? emptyEl.textContent : '';

      function updateSummary() {
        let total = 0;
        document.querySelectorAll('.ticket-summary-lines').forEach((linesEl) => {
          total = renderSummaryInto(linesEl, emptyText);
        });
        document.querySelectorAll('.ticket-summary-total').forEach((el) => {
          el.textContent = '$' + total;
        });
        if (checkoutBtn) checkoutBtn.disabled = total === 0;
      }

      rows.forEach((row) => {
        const qtyEl = row.querySelector('.qty-value');
        row.querySelectorAll('.qty-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            let qty = parseInt(qtyEl.textContent, 10) || 0;
            qty = btn.getAttribute('data-action') === 'inc' ? Math.min(qty + 1, 20) : Math.max(qty - 1, 0);
            qtyEl.textContent = qty;
            updateSummary();
          });
        });
      });

      if (checkoutBtn) checkoutBtn.addEventListener('click', () => goTo(stepDetails));
      if (backToCategoriesBtn) backToCategoriesBtn.addEventListener('click', () => goTo(stepTickets));
      if (backToDetailsBtn) backToDetailsBtn.addEventListener('click', () => goTo(stepDetails));
      if (backToAttendeeBtn) backToAttendeeBtn.addEventListener('click', () => goTo(stepAttendee));

      if (step1Form) {
        step1Form.addEventListener('submit', (e) => {
          e.preventDefault();
          goTo(stepAttendee);
        });
      }

      if (step2Form) {
        step2Form.addEventListener('submit', (e) => {
          e.preventDefault();
          goTo(stepPayment);
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', () => {
          const firstName = document.getElementById('ticket-first-name');
          const lastName = document.getElementById('ticket-last-name');
          const email = document.getElementById('ticket-email');
          document.getElementById('ticket-success-name').textContent = (firstName ? firstName.value : '') + ' ' + (lastName ? lastName.value : '');
          document.getElementById('ticket-success-email').textContent = email ? email.value : '';
          goTo(stepSuccess);
        });
      }

      updateSummary();
    })();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    const c = new Component();
    if (c.componentDidMount) c.componentDidMount();
  } catch (e) {
    console.error('AviatDo mount error', e);
  }
});
