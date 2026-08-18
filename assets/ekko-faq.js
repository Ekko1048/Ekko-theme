if (!customElements.get('ekko-faq')) {
  customElements.define('ekko-faq', class extends HTMLElement {
    connectedCallback() {
      this.onToggle = this.handleToggle.bind(this);
      this.onEditorSelect = this.handleEditorSelect.bind(this);
      this.addEventListener('toggle', this.onToggle, true);
      this.addEventListener('shopify:block:select', this.onEditorSelect);
    }

    disconnectedCallback() {
      this.removeEventListener('toggle', this.onToggle, true);
      this.removeEventListener('shopify:block:select', this.onEditorSelect);
    }

    handleToggle(event) {
      if (this.dataset.single !== 'true' || !event.target.matches('[data-faq-item]') || !event.target.open) return;
      this.querySelectorAll('[data-faq-item][open]').forEach((item) => {
        if (item !== event.target) item.open = false;
      });
    }

    handleEditorSelect(event) {
      const item = event.target.closest('[data-faq-item]');
      if (!item) return;
      item.open = true;
      if (this.dataset.single === 'true') {
        this.querySelectorAll('[data-faq-item][open]').forEach((other) => {
          if (other !== item) other.open = false;
        });
      }
    }
  });
}
