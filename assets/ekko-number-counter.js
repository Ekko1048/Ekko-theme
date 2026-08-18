if (!customElements.get('ekko-number-counter')) {
  customElements.define('ekko-number-counter', class extends HTMLElement {
    connectedCallback() {
      this.finalText = this.dataset.value.trim();
      const normalized = this.finalText.replace(/\s/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '');
      this.value = Number.parseFloat(normalized.replace(',', '.'));
      if (!Number.isFinite(this.value)) return;
      this.card = this.closest('.ekko-counter-card');
      this.section = this.closest('.shopify-section');
      this.onBlockSelect = this.handleBlockSelect.bind(this);
      this.section?.addEventListener('shopify:block:select', this.onBlockSelect);
      this.setAttribute('aria-label', this.finalText);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.textContent = this.finalText;
        this.setAttribute('data-animated', '');
        return;
      }
      const decimals = (this.finalText.match(/[.,](\d+)$/)?.[1] || '').length;
      this.formatter = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
      this.textContent = this.formatter.format(0);
      if (!('IntersectionObserver' in window)) {
        this.animate();
        return;
      }
      this.observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer.disconnect();
        this.animate();
      }, { rootMargin: '0px 0px -5% 0px', threshold: 0.15 });
      this.observer.observe(this);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      cancelAnimationFrame(this.frame);
      this.section?.removeEventListener('shopify:block:select', this.onBlockSelect);
    }

    handleBlockSelect(event) {
      if (!this.card?.contains(event.target)) return;
      this.observer?.disconnect();
      this.animate();
    }

    animate() {
      cancelAnimationFrame(this.frame);
      this.removeAttribute('data-animated');
      this.card?.removeAttribute('data-counting');
      void this.card?.offsetWidth;
      this.card?.setAttribute('data-counting', '');
      this.textContent = this.formatter.format(0);
      const duration = Math.max(0.1, Number.parseFloat(this.dataset.duration) || 2) * 1000;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        this.textContent = progress === 1 ? this.finalText : this.formatter.format(this.value * eased);
        if (progress < 1) this.frame = requestAnimationFrame(tick);
        else {
          this.setAttribute('data-animated', '');
          this.card?.removeAttribute('data-counting');
        }
      };
      this.frame = requestAnimationFrame(tick);
    }
  });
}
