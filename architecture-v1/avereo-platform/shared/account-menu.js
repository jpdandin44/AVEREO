/* Source commune AVEREO. Les copies publiques sont produites par prepare-account-menu.mjs. */
(() => {
  'use strict';
  if (customElements.get('avereo-account-menu')) return;

  function portalFor(element) {
    let value = element.getAttribute('portal');
    if (!value) {
      try { value = window.parent.document.querySelector('meta[name="avereo-connect-portal"]')?.content; } catch (_) { /* Isolated iframe. */ }
      value ||= document.querySelector('meta[name="avereo-connect-portal"]')?.content;
    }
    if (!value) return null;
    try {
      const url = new URL(value, location.href);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.origin === location.origin;
      if (url.username || url.password || !(url.protocol === 'https:' && (url.hostname === 'avereo.fr' || url.hostname.endsWith('.avereo.fr')) || local)) return null;
      url.search = ''; url.hash = '';
      return url.href.replace(/\/$/, '');
    } catch (_) { return null; }
  }

  class AvereoAccountMenu extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).innerHTML = `
        <style>
          :host { display:block; flex-shrink:0; font:14px/1.4 system-ui,sans-serif; color:#f1f5f9; }
          :host([hidden]), [hidden] { display:none!important; }
          :host([placement="sidebar"]) { margin-top:auto; width:100%; }
          * { box-sizing:border-box; }
          button,a { font:inherit; }
          .trigger { display:flex; align-items:center; gap:12px; width:100%; min-height:64px; padding:12px 16px; border:0; border-radius:10px; background:#0f172a; color:#fff; cursor:pointer; text-align:left; }
          :host([placement="sidebar"]) .trigger { border-top:1px solid #334155; border-radius:0; padding:16px; }
          .trigger:hover { background:#1e293b; }
          .avatar { display:grid; place-items:center; width:40px; height:40px; flex-shrink:0; border:2px solid #a5b4fc; border-radius:50%; background:#6366f1; color:white; font-size:13px; font-weight:750; }
          .label { display:grid; gap:2px; white-space:nowrap; }
          strong { font-size:14px; font-weight:650; }
          small { color:#a5b4fc; font-size:10px; letter-spacing:.06em; text-transform:uppercase; }
          nav { display:none; position:fixed; inset:auto; margin:0; width:272px; max-width:calc(100vw - 24px); max-height:calc(100dvh - 24px); overflow:auto; padding:10px; border:1px solid #334155; border-radius:12px; background:#0f172a; color:#f1f5f9; box-shadow:0 12px 30px #02061755; z-index:50; }
          nav:popover-open { display:block; }
          nav.fallback-open { display:block; }
          nav p { margin:0; padding:6px 10px 10px; color:#94a3b8; font-size:12px; }
          a,::slotted(a),::slotted(button) { display:block; width:100%; margin:0; padding:11px 12px; border:0; border-radius:7px; background:transparent; color:#f1f5f9; text-align:left; text-decoration:none; font:14px/1.4 system-ui,sans-serif; cursor:pointer; box-sizing:border-box; }
          /* App resets (Tailwind, legacy button styles) must not alter shared hit targets. */
          ::slotted(a),::slotted(button) { display:block!important; width:100%!important; margin:0!important; padding:11px 12px!important; border:0!important; border-radius:7px!important; background:transparent!important; color:#f1f5f9!important; text-align:left!important; text-decoration:none!important; font:14px/1.4 system-ui,sans-serif!important; cursor:pointer!important; box-sizing:border-box!important; }
          a:hover,::slotted(a:hover),::slotted(button:hover) { background:#334155; }
          ::slotted(a:hover),::slotted(button:hover) { background:#334155!important; }
          ::slotted(:disabled) { opacity:.55!important; cursor:not-allowed!important; }
          ::slotted([hidden]) { display:none!important; }
          :focus-visible,::slotted(:focus-visible) { outline:3px solid #93c5fd; outline-offset:2px; }
          .logout { border-top:1px solid #334155; margin-top:6px; }
          .local { padding:8px 10px; color:#cbd5e1; font-size:12px; }
          :host([compact="always"]) .label { display:none; }
          :host([compact="always"]) .trigger { justify-content:center; padding:12px 8px; }
          @media(max-width:1023px) { :host([compact="sidebar"]) .label { display:none; } :host([compact="sidebar"]) .trigger { justify-content:center; padding:12px 8px; } }
          @media(max-width:600px) { :host(:not([placement="sidebar"])) .label { display:none; } :host(:not([placement="sidebar"])) .trigger { padding:8px; min-height:52px; } }
          @media print { :host { display:none!important; } }
        </style>
        <button class="trigger" type="button" aria-label="Mon espace : ouvrir le menu du compte" aria-expanded="false" aria-controls="panel">
          <span class="avatar" aria-hidden="true">MOI</span><span class="label"><strong>Mon espace</strong><small>Compte AVEREO</small></span>
        </button>
        <nav id="panel" popover="auto" aria-label="Menu de Mon espace">
          <p>Mon espace</p>
          <slot name="items"></slot>
          <slot name="account"><a class="account" target="_blank" rel="noopener noreferrer">Mon compte</a></slot>
          <slot name="applications"><a class="applications" target="_blank" rel="noopener noreferrer">Mes applications</a></slot>
          <slot name="administration"></slot>
          <slot name="logout"><a class="logout" target="_top">Se déconnecter</a></slot>
          <p class="local">Les fonctions de compte en ligne ne sont pas disponibles ici.</p>
        </nav>`;
      this.trigger = this.shadowRoot.querySelector('.trigger');
      this.panel = this.shadowRoot.querySelector('nav');
      this.trigger.addEventListener('click', () => { this.open = !this.open; });
      this.panel.addEventListener('toggle', event => {
        this.trigger.setAttribute('aria-expanded', String(event.newState === 'open'));
      });
      this.addEventListener('keydown', event => {
        if (event.key === 'Escape' && this.open) { event.preventDefault(); this.open = false; this.trigger.focus(); }
      });
      this.panel.addEventListener('click', event => {
        if (event.composedPath().some(item => item?.matches?.('a,button'))) this.open = false;
      });
      this.outside = event => { if (!event.composedPath().includes(this)) this.open = false; };
      this.reposition = () => { if (this.open) this.positionPanel(); };
    }

    connectedCallback() {
      this.refreshLinks();
      document.addEventListener('pointerdown', this.outside);
      window.addEventListener('resize', this.reposition);
      // Capture scrolling containers too; the panel stays attached to its trigger.
      document.addEventListener('scroll', this.reposition, true);
    }
    disconnectedCallback() {
      this.open = false;
      document.removeEventListener('pointerdown', this.outside);
      window.removeEventListener('resize', this.reposition);
      document.removeEventListener('scroll', this.reposition, true);
    }
    refreshLinks() {
      const portal = portalFor(this);
      for (const [selector, suffix] of [['.account', '/#profile'], ['.applications', '/']]) {
        const link = this.shadowRoot.querySelector(selector);
        link.hidden = !portal;
        if (portal) link.href = portal + suffix;
      }
      const logout = this.shadowRoot.querySelector('.logout');
      logout.hidden = !portal || this.hasAttribute('no-logout');
      // RGA owns its cookie and its logout route; no switch to the Rapport gate.
      const path = this.getAttribute('logout-path') || '/connect/logout.php';
      if (/^\/(?!\/)[a-z0-9/_.-]+$/i.test(path)) logout.href = path;
      else logout.hidden = true;
      this.shadowRoot.querySelector('.local').hidden = !!portal || this.hasAttribute('local-account');
    }
    get open() { return this.trigger.getAttribute('aria-expanded') === 'true'; }
    set open(value) {
      if (!value) {
        if (typeof this.panel.hidePopover === 'function' && this.panel.matches(':popover-open')) this.panel.hidePopover();
        this.panel.classList.remove('fallback-open');
      } else if (this.isConnected) {
        if (typeof this.panel.showPopover === 'function') this.panel.showPopover();
        else this.panel.classList.add('fallback-open');
        this.positionPanel();
      }
      this.trigger.setAttribute('aria-expanded', String(!!value && this.isConnected));
    }
    positionPanel() {
      const rect = this.trigger.getBoundingClientRect();
      const width = this.panel.offsetWidth, height = this.panel.offsetHeight;
      const above = this.getAttribute('placement') === 'sidebar' || rect.bottom + height + 8 > innerHeight;
      this.panel.style.left = Math.max(12, Math.min(rect.left, innerWidth - width - 12)) + 'px';
      this.panel.style.top = Math.max(12, Math.min(above ? rect.top - height - 8 : rect.bottom + 8, innerHeight - height - 12)) + 'px';
    }
    get portal() { return portalFor(this); }
  }
  customElements.define('avereo-account-menu', AvereoAccountMenu);
})();
