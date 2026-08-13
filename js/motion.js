/* ==========================================
   SCHOOL TRANSPORT SYSTEM - MOTION & MICRO-INTERACTION ENGINE
   ========================================== */

class MotionEngine {
  constructor() {
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = null;
    this.init();
  }

  init() {
    this.setupGlobalInteractions();
    this.setupScrollObserver();
    this.listenToMediaQueries();
  }

  listenToMediaQueries() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', () => {
      this.isReducedMotion = mediaQuery.matches;
    });
  }

  /* ----------------------------------------------------
     1. GLOBAL RIPPLE & PRESS MICRO-INTERACTIONS
     ---------------------------------------------------- */
  setupGlobalInteractions() {
    document.addEventListener('pointerdown', (e) => {
      if (this.isReducedMotion) return;

      const target = e.target.closest('.btn-primary, .btn-secondary, .btn-danger, .nav-item, .demo-pill, .notification-bell-btn, .user-profile-menu, .tab-pill, .icon-btn, .header-back-btn');
      if (!target) return;

      this.createRipple(e, target);
    });

    // Handle form input micro-focus effects
    document.addEventListener('focusin', (e) => {
      const formControl = e.target.closest('.form-control');
      if (formControl) {
        const parentGroup = formControl.closest('.form-group, .input-with-icon');
        if (parentGroup) parentGroup.classList.add('focused-within');
      }
    });

    document.addEventListener('focusout', (e) => {
      const formControl = e.target.closest('.form-control');
      if (formControl) {
        const parentGroup = formControl.closest('.form-group, .input-with-icon');
        if (parentGroup) parentGroup.classList.remove('focused-within');
      }
    });
  }

  createRipple(event, element) {
    // Avoid double ripples
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'motion-ripple';
    
    const size = Math.max(rect.width, rect.height) * 1.8;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    element.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /* ----------------------------------------------------
     2. STAGGERED PAGE & CARD ENTRANCES
     ---------------------------------------------------- */
  onPageTransition(pageId) {
    const pageEl = document.getElementById(`${pageId}-view`);
    if (!pageEl) return;

    if (this.isReducedMotion) {
      this.animateMetricValues(pageEl);
      return;
    }

    // Trigger staggered entry for child components
    this.applyStaggeredDelays(pageEl);
    this.animateMetricValues(pageEl);
    this.observePageCards(pageEl);
  }

  applyStaggeredDelays(container) {
    const items = container.querySelectorAll('.metric-card, .card, .section-header, .controls-bar, .table-container, tr.table-row');
    items.forEach((item, index) => {
      const delay = Math.min(index * 0.04, 0.4); // Cap max stagger delay at 400ms
      item.style.animationDelay = `${delay}s`;
      item.classList.remove('motion-stagger-in');
      // Trigger reflow to restart CSS animation
      void item.offsetWidth;
      item.classList.add('motion-stagger-in');
    });
  }

  /* ----------------------------------------------------
     3. ANIMATED METRIC COUNTERS
     ---------------------------------------------------- */
  animateMetricValues(container) {
    const metricEls = container.querySelectorAll('.metric-value');
    metricEls.forEach(el => {
      const originalText = el.innerText.trim();
      if (!originalText || el.dataset.animating === 'true') return;

      // Extract currency, percentage, or plain integer numbers
      const isCurrency = originalText.includes('₹');
      const isPercent = originalText.includes('%');
      const numMatch = originalText.replace(/[^0-9.]/g, '');
      
      if (!numMatch) return;

      const targetValue = parseFloat(numMatch);
      if (isNaN(targetValue)) return;

      el.dataset.animating = 'true';
      const duration = 750; // ms
      const startTime = performance.now();

      const updateCount = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // EaseOutExpo curve for snappy professional count-up
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentValue = Math.floor(easeProgress * targetValue);

        if (isCurrency && typeof window.formatCurrency === 'function') {
          el.innerText = window.formatCurrency(currentValue);
        } else if (isPercent) {
          el.innerText = `${(easeProgress * targetValue).toFixed(1)}%`;
        } else {
          el.innerText = currentValue.toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          el.innerText = originalText;
          delete el.dataset.animating;
        }
      };

      requestAnimationFrame(updateCount);
    });
  }

  /* ----------------------------------------------------
     4. SCROLL REVEAL OBSERVER
     ---------------------------------------------------- */
  setupScrollObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('motion-visible');
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });
  }

  observePageCards(pageEl) {
    if (!this.observer) return;
    const cards = pageEl.querySelectorAll('.card, .table-container');
    cards.forEach(card => {
      card.classList.add('motion-reveal');
      this.observer.observe(card);
    });
  }

  /* ----------------------------------------------------
     5. FORM ERROR SHAKE & SUCCESS FEEDBACK
     ---------------------------------------------------- */
  shakeElement(element) {
    if (!element || this.isReducedMotion) return;
    element.classList.remove('motion-shake');
    void element.offsetWidth;
    element.classList.add('motion-shake');
    setTimeout(() => element.classList.remove('motion-shake'), 450);
  }

  /* ----------------------------------------------------
     6. TABLE ROW ANIMATED DELETION
     ---------------------------------------------------- */
  animateRowDeletion(rowElement, onCompleteCallback) {
    if (!rowElement) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    if (this.isReducedMotion) {
      if (onCompleteCallback) onCompleteCallback();
      return;
    }

    rowElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    rowElement.style.opacity = '0';
    rowElement.style.transform = 'scale(0.96) translateX(12px)';
    rowElement.style.height = `${rowElement.offsetHeight}px`;
    
    setTimeout(() => {
      rowElement.style.height = '0px';
      rowElement.style.paddingTop = '0px';
      rowElement.style.paddingBottom = '0px';
      setTimeout(() => {
        if (onCompleteCallback) onCompleteCallback();
      }, 150);
    }, 200);
  }

  /* ----------------------------------------------------
     7. BUTTON LOADING FEEDBACK
     ---------------------------------------------------- */
  setButtonLoading(btn, isLoading, loadingText = 'Processing...') {
    if (!btn) return;

    if (isLoading) {
      // Store only the plain-text label and icon class — never raw HTML
      btn.dataset.originalText  = btn.textContent.trim();
      btn.dataset.originalIcon  = btn.querySelector('i')?.className || '';
      btn.disabled = true;
      btn.classList.add('btn-loading');

      btn.textContent = '';
      const spinner = document.createElement('i');
      spinner.className = 'fa-solid fa-circle-notch fa-spin';
      const label = document.createTextNode(\` ${loadingText}\`);
      btn.appendChild(spinner);
      btn.appendChild(label);
    } else {
      btn.textContent = '';
      if (btn.dataset.originalIcon) {
        const icon = document.createElement('i');
        icon.className = btn.dataset.originalIcon;
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(\` ${btn.dataset.originalText || ''}\`));
      } else {
        btn.textContent = btn.dataset.originalText || '';
      }
      delete btn.dataset.originalText;
      delete btn.dataset.originalIcon;
      btn.disabled = false;
      btn.classList.remove('btn-loading');
    }
  }
}

// Global Export
window.motion = new MotionEngine();
