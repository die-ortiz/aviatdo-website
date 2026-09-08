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

    // --- Scroll-scrubbed reveal: opacity/translateY (and, where present, the
    // accent underline and photo curtain-wipe) are driven directly from live
    // layout position every frame, so the motion is pinned 1:1 to how far
    // the visitor has scrolled — never a fixed-duration timer that can
    // finish before they notice it, and automatically in sync with the
    // smoothed scroll above since getBoundingClientRect reflects it. ---
    const targets = Array.from(document.querySelectorAll('.reveal:not(.reveal-no-fade)'));
    if (targets.length) {
      if (reduceMotion) {
        targets.forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
          const bar = el.querySelector('.accent-bar');
          if (bar) bar.style.transform = 'scaleX(1)';
          const photo = el.querySelector('.photo-wipe');
          if (photo) photo.style.clipPath = 'inset(0 0 0 0)';
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
            photo: el.querySelector('.photo-wipe'),
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
            if (item.photo) {
              item.photo.style.clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
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
    // as everything else instead of jumping ahead of it ---
    if (!reduceMotion) {
      const parallax = document.querySelector('.hero-parallax');
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
      const prevBtn = document.getElementById('booking-prev-month');
      const nextBtn = document.getElementById('booking-next-month');
      const monthLabel = document.getElementById('booking-month-label');
      const calendarBody = document.getElementById('booking-calendar-body');
      const timesSection = document.getElementById('booking-times-section');
      const timesWrap = document.getElementById('booking-times');
      const confirmBtn = document.getElementById('booking-confirm');
      const pickView = document.getElementById('booking-pick-view');
      const successView = document.getElementById('booking-success-view');
      const summaryEl = document.getElementById('booking-summary');
      const weekdaysRow = overlay.querySelector('.booking-weekdays');

      const WEEKDAY_LABELS = isES ? ['D', 'L', 'M', 'M', 'J', 'V', 'S'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const TIME_SLOTS = ['09:00', '10:30', '13:00', '14:30', '16:00'];
      const monthFormatter = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
      const dateFormatter = new Intl.DateTimeFormat(isES ? 'es-ES' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      if (weekdaysRow) weekdaysRow.innerHTML = WEEKDAY_LABELS.map((d) => `<span>${d}</span>`).join('');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const maxMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

      let viewDate = new Date(minMonth);
      let selectedDate = null;
      let selectedTime = null;
      let lastFocused = null;

      const sameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
      // Deterministic pseudo-availability, purely for visual realism — no
      // real scheduling data exists yet, so every future weekday being open
      // would read as fake. A handful of dates/slots per month show as
      // already booked instead.
      const isDateBooked = (d) => d.getDate() % 9 === 0;
      const isTimeBooked = (d, idx) => (d.getDate() + idx) % 5 === 0;

      function renderCalendar() {
        monthLabel.textContent = monthFormatter.format(viewDate);
        prevBtn.disabled = viewDate.getFullYear() === minMonth.getFullYear() && viewDate.getMonth() === minMonth.getMonth();
        nextBtn.disabled = viewDate.getFullYear() === maxMonth.getFullYear() && viewDate.getMonth() === maxMonth.getMonth();

        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let html = '';
        for (let i = 0; i < firstWeekday; i++) html += '<span class="booking-day-empty" aria-hidden="true"></span>';
        for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month, d);
          const disabled = date < today || date.getDay() === 0 || date.getDay() === 6 || isDateBooked(date);
          const classes = ['booking-day'];
          if (sameDay(date, today)) classes.push('is-today');
          if (sameDay(date, selectedDate)) classes.push('is-selected');
          const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          html += `<button type="button" class="${classes.join(' ')}" data-date="${iso}"${disabled ? ' disabled' : ''}>${d}</button>`;
        }
        calendarBody.innerHTML = html;
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
        confirmBtn.disabled = !(selectedDate && selectedTime);
      }

      function resetBooking() {
        viewDate = new Date(minMonth);
        selectedDate = null;
        selectedTime = null;
        pickView.hidden = false;
        successView.hidden = true;
        renderCalendar();
        renderTimes();
        updateConfirmState();
      }

      function onKeydown(e) {
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled]), [href]')).filter((el) => el.offsetParent !== null);
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
      prevBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderCalendar(); });
      nextBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderCalendar(); });

      calendarBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.booking-day:not(:disabled)');
        if (!btn) return;
        const [y, m, d] = btn.dataset.date.split('-').map(Number);
        selectedDate = new Date(y, m - 1, d);
        selectedTime = null;
        renderCalendar();
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
        if (!selectedDate || !selectedTime) return;
        const dateStr = dateFormatter.format(selectedDate);
        summaryEl.textContent = isES ? `${dateStr} a las ${selectedTime}` : `${dateStr} at ${selectedTime}`;
        pickView.hidden = true;
        successView.hidden = false;
      });
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
