if (!customElements.get('ekko-image-comparison')) {
  customElements.define('ekko-image-comparison', class extends HTMLElement {
    connectedCallback() {
      if (this.initialized) return;
      this.initialized = true;
      this.handle = this.querySelector('.comparison__button');
      if (!this.handle) return;

      this.startPosition = this.clamp(Number.parseFloat(this.dataset.startPosition) || 50);
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.onPointerDown = this.pointerDown.bind(this);
      this.onPointerMove = this.pointerMove.bind(this);
      this.onPointerUp = this.pointerUp.bind(this);
      this.onKeyDown = this.keyDown.bind(this);
      this.handle.addEventListener('pointerdown', this.onPointerDown);
      this.handle.addEventListener('pointermove', this.onPointerMove);
      this.handle.addEventListener('pointerup', this.onPointerUp);
      this.handle.addEventListener('pointercancel', this.onPointerUp);
      this.handle.addEventListener('lostpointercapture', this.onPointerUp);
      this.handle.addEventListener('keydown', this.onKeyDown);

      if (this.reduceMotion || !('IntersectionObserver' in window)) {
        this.setPosition(this.startPosition);
        return;
      }

      this.setPosition(10);
      this.observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer.disconnect();
        this.classList.add('animating');
        requestAnimationFrame(() => requestAnimationFrame(() => this.setPosition(this.startPosition)));
        this.animationTimer = window.setTimeout(() => this.classList.remove('animating'), 900);
      }, { threshold: 0.2 });
      this.observer.observe(this);
    }

    disconnectedCallback() {
      this.observer?.disconnect();
      window.clearTimeout(this.animationTimer);
      this.handle?.removeEventListener('pointerdown', this.onPointerDown);
      this.handle?.removeEventListener('pointermove', this.onPointerMove);
      this.handle?.removeEventListener('pointerup', this.onPointerUp);
      this.handle?.removeEventListener('pointercancel', this.onPointerUp);
      this.handle?.removeEventListener('lostpointercapture', this.onPointerUp);
      this.handle?.removeEventListener('keydown', this.onKeyDown);
    }

    get horizontal() {
      return this.dataset.layout === 'horizontal';
    }

    clamp(value) {
      return Math.min(95, Math.max(5, value));
    }

    setPosition(value) {
      this.position = this.clamp(value);
      this.style.setProperty('--percent', `${this.position}%`);
      this.handle.setAttribute('aria-valuenow', String(Math.round(this.position)));
    }

    pointerDown(event) {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      event.preventDefault();
      this.classList.remove('animating');
      this.setAttribute('data-dragging', '');
      this.handle.setPointerCapture(event.pointerId);
      this.updateFromPointer(event);
    }

    pointerMove(event) {
      if (!this.hasAttribute('data-dragging')) return;
      event.preventDefault();
      this.updateFromPointer(event);
    }

    pointerUp(event) {
      if (!this.hasAttribute('data-dragging')) return;
      this.removeAttribute('data-dragging');
      if (this.handle.hasPointerCapture?.(event.pointerId)) this.handle.releasePointerCapture(event.pointerId);
    }

    updateFromPointer(event) {
      const rect = this.getBoundingClientRect();
      const distance = this.horizontal ? event.clientX - rect.left : event.clientY - rect.top;
      const size = this.horizontal ? rect.width : rect.height;
      if (size > 0) this.setPosition((distance / size) * 100);
    }

    keyDown(event) {
      const largeStep = event.shiftKey ? 10 : 2;
      let next = this.position;
      if (event.key === 'Home') next = 5;
      else if (event.key === 'End') next = 95;
      else if (event.key === 'PageDown') next -= 10;
      else if (event.key === 'PageUp') next += 10;
      else if (this.horizontal && event.key === 'ArrowLeft') next -= largeStep;
      else if (this.horizontal && event.key === 'ArrowRight') next += largeStep;
      else if (!this.horizontal && event.key === 'ArrowUp') next -= largeStep;
      else if (!this.horizontal && event.key === 'ArrowDown') next += largeStep;
      else return;
      event.preventDefault();
      this.classList.remove('animating');
      this.setPosition(next);
    }
  });
}
