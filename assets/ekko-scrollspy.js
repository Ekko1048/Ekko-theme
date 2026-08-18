if (!customElements.get('ekko-scrollspy')) {
  customElements.define('ekko-scrollspy', class extends HTMLElement {
    connectedCallback() {
      this.links = Array.from(this.querySelectorAll('[data-scrollspy-link]'));
      this.linkContainer = this.querySelector('.ekko-scrollspy__links');
      this.nav = this.querySelector('.ekko-scrollspy__nav');
      this.groups = this.links.map((link) => ({
        link,
        targets: link.dataset.target
          .split(',')
          .map((id) => this.resolveTarget(id))
          .filter(Boolean)
      })).filter((group) => group.targets.length);
      this.onClick = this.handleClick.bind(this);
      this.onScroll = this.scheduleUpdate.bind(this);
      this.onResize = this.scheduleUpdate.bind(this);
      this.onEditorSelect = this.handleEditorSelect.bind(this);
      this.sectionRoot = this.closest('.shopify-section');
      this.addEventListener('click', this.onClick);
      this.addEventListener('shopify:block:select', this.onEditorSelect);
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.scheduleUpdate();
    }

    disconnectedCallback() {
      this.removeEventListener('click', this.onClick);
      this.removeEventListener('shopify:block:select', this.onEditorSelect);
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      cancelAnimationFrame(this.frame);
    }

    resolveTarget(rawId) {
      const id = rawId.trim().replace(/^#/, '');
      if (!id) return null;
      return document.getElementById(id)
        || document.getElementById(`shopify-section-${id}`)
        || document.querySelector(`[id^="shopify-section-"][id$="__${CSS.escape(id)}"]`)
        || document.querySelector(`[data-section-id="${CSS.escape(id)}"]`);
    }

    get reduceMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    getOffset() {
      const floatGap = Number.parseFloat(getComputedStyle(this).marginBlockStart) || 0;
      return this.getStickyTop() + floatGap + (this.nav?.offsetHeight || 0) + 16;
    }

    getStickyTop() {
      const root = getComputedStyle(document.documentElement);
      const configuredHeader = Number.parseFloat(root.getPropertyValue('--sticky-header-height')) || 0;
      const stickyHeader = document.querySelector('.header-section.header-sticky');
      const visibleHeaderBottom = stickyHeader ? Math.max(0, stickyHeader.getBoundingClientRect().bottom) : 0;
      const extra = this.sectionRoot ? Number.parseFloat(getComputedStyle(this.sectionRoot).getPropertyValue('--ekko-scrollspy-extra-offset')) || 0 : 0;
      const top = Math.max(configuredHeader, visibleHeaderBottom) + extra;
      this.sectionRoot?.style.setProperty('--ekko-scrollspy-sticky-top', `${top}px`);
      return top;
    }

    handleClick(event) {
      const topButton = event.target.closest('[data-back-to-top]');
      if (topButton) {
        window.scrollTo({ top: 0, behavior: this.reduceMotion ? 'auto' : 'smooth' });
        return;
      }

      const link = event.target.closest('[data-scrollspy-link]');
      if (!link) return;
      const group = this.groups.find((entry) => entry.link === link);
      const target = group?.targets[0];
      if (!target) return;
      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - this.getOffset();
      window.scrollTo({ top: Math.max(0, top), behavior: this.reduceMotion ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${encodeURIComponent(target.id)}`);
      this.setActive(group);
    }

    handleEditorSelect(event) {
      const link = event.target.closest('[data-scrollspy-link]');
      const group = this.groups.find((entry) => entry.link === link);
      if (group) this.setActive(group);
    }

    scheduleUpdate() {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        this.update();
      });
    }

    update() {
      if (!this.groups.length) return;
      const threshold = this.getOffset() + 2;
      const probe = Math.max(threshold + 1, window.innerHeight * 0.45);
      let active = this.groups[0];
      for (const group of this.groups) {
        const top = Math.min(...group.targets.map((target) => target.getBoundingClientRect().top));
        const bottom = Math.max(...group.targets.map((target) => target.getBoundingClientRect().bottom));
        if (top <= probe && bottom > probe) active = group;
        else if (top <= threshold) active = group;
      }
      const stickyTop = this.getStickyTop();
      const rootTop = this.sectionRoot?.getBoundingClientRect().top ?? this.getBoundingClientRect().top;
      this.toggleAttribute('data-stuck', rootTop <= stickyTop + 1 && window.scrollY > 0);
      this.setActive(active);
    }

    setActive(active) {
      this.groups.forEach((group) => {
        const selected = group === active;
        if (selected) group.link.setAttribute('aria-current', 'location');
        else group.link.removeAttribute('aria-current');
      });
      if (this.linkContainer && this.linkContainer.scrollWidth > this.linkContainer.clientWidth) {
        const centered = active.link.offsetLeft - (this.linkContainer.clientWidth - active.link.offsetWidth) / 2;
        this.linkContainer.scrollTo({ left: Math.max(0, centered), behavior: this.reduceMotion ? 'auto' : 'smooth' });
      }
    }
  });
}
