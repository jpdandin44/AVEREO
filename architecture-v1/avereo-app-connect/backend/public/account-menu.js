/* Source commune AVEREO. Les copies publiques sont produites par prepare-account-menu.mjs. */
(() => {
  'use strict';
  if (customElements.get('avereo-account-menu')) return;
  const moduleUrl = document.currentScript?.src ? new URL('assets/missions.js', document.currentScript.src).href : '/assets/missions.js';
  let loadingMissions;
  function loadMissions() {
    if (window.avereoOpenMission) return Promise.resolve();
    if (!loadingMissions) loadingMissions = new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = moduleUrl;
      script.onload = () => window.avereoOpenMission ? resolve() : reject(Error('Module indisponible'));
      script.onerror = () => reject(Error('Module indisponible'));
      document.head.append(script);
    }).catch(error => { loadingMissions = undefined; throw error; });
    return loadingMissions;
  }

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
    static observedAttributes = ['no-missions'];
    static readSettings(app, fields) {
      let saved = {};
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(app)) return {};
      try { saved = JSON.parse(localStorage.getItem(`avereo.${app}.preferences.v1`) || '{}') || {}; } catch (_) { /* Usable defaults; no business data touched. */ }
      return Object.fromEntries(fields.map(field => [field.key,
        field.type === 'checkbox' ? (typeof saved[field.key] === 'boolean' ? saved[field.key] : field.default) :
          (field.options.some(option => option.value === saved[field.key]) ? saved[field.key] : field.default)]));
    }
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
          .preferences { width:100%; padding:11px 12px; border:0; border-radius:7px; background:transparent; color:inherit; text-align:left; cursor:pointer; }
          .preferences:hover { background:#334155; }
          dialog { position:fixed; inset:0; margin:auto; width:min(480px,calc(100vw - 24px)); max-height:calc(100dvh - 32px); overflow:auto; padding:24px; border:1px solid #cbd5e1; border-radius:14px; background:#fff; color:#142033; box-shadow:0 20px 70px #0005; }
          dialog::backdrop { background:#0f172a88; }
          dialog h2 { margin:0 0 12px; font-size:21px; }
          dialog p { line-height:1.5; }
          dialog label { display:grid; gap:8px; margin:20px 0; }
          dialog select { width:100%; padding:10px; border:1px solid #94a3b8; border-radius:7px; background:white; color:#142033; font:inherit; }
          dialog input[type=checkbox] { width:20px; height:20px; }
          dialog footer { display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap; }
          dialog button { padding:10px 14px; border:1px solid #cbd5e1; border-radius:7px; background:#eef3f9; color:#142033; cursor:pointer; }
          dialog button[type=submit] { background:#155eef; color:white; }
          .settings-error { color:#b91c1c; }
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
          <button type="button" class="preferences" hidden>Préférences</button>
          <button type="button" class="preferences missions">Missions</button>
          <p class="mission-error" role="status" hidden>Le module Missions est indisponible. Réessayez depuis ce menu.</p>
          <slot name="account"><a class="account" target="_blank" rel="noopener noreferrer">Mon compte</a></slot>
          <slot name="applications"><a class="applications" target="_blank" rel="noopener noreferrer">Mes applications</a></slot>
          <slot name="administration"></slot>
          <slot name="logout"><a class="logout" target="_top">Se déconnecter</a></slot>
          <p class="local">Les fonctions de compte en ligne ne sont pas disponibles ici.</p>
        </nav>
        <dialog aria-labelledby="settings-title"><form>
          <h2 id="settings-title">Préférences</h2>
          <p>Ces réglages concernent uniquement cette application, dans ce navigateur. Ils ne modifient pas vos projets ni votre compte AVEREO.</p>
          <div class="settings-fields"></div><p class="settings-error" role="alert"></p>
          <footer><button type="button" class="settings-cancel">Annuler</button><button type="submit">Enregistrer</button></footer>
        </form></dialog>`;
      this.trigger = this.shadowRoot.querySelector('.trigger');
      this.panel = this.shadowRoot.querySelector('nav');
      this.trigger.addEventListener('click', () => { this.open = !this.open; });
      this.settingsDialog = this.shadowRoot.querySelector('dialog');
      this.shadowRoot.querySelector('.preferences').addEventListener('click', () => this.openPreferences());
      this.missionsButton = this.shadowRoot.querySelector('.missions');
      this.missionsButton.addEventListener('click', async () => {
        if (this.missionsButton.disabled) return;
        const error = this.shadowRoot.querySelector('.mission-error');
        error.hidden = true;
        try { await loadMissions(); await window.avereoOpenMission(this); }
        catch {
          if (this.missionsButton.disabled) return;
          this.open = true;
          error.hidden = false;
        }
      });
      this.shadowRoot.querySelector('.settings-cancel').addEventListener('click', () => this.closePreferences());
      this.settingsDialog.addEventListener('close', () => this.trigger.focus());
      this.settingsDialog.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const fields = this.preferenceFields, values = {};
        for (const field of fields) {
          const input = this.settingsDialog.querySelector(`[name="${field.key}"]`);
          values[field.key] = field.type === 'checkbox' ? input.checked : input.value;
        }
        try {
          localStorage.setItem(`avereo.${this.getAttribute('preferences-app')}.preferences.v1`, JSON.stringify(values));
          this.dispatchEvent(new CustomEvent('avereo-preferences-change', { bubbles:true, composed:true,
            detail:{ app:this.getAttribute('preferences-app'), values } }));
          this.closePreferences();
        } catch (_) { this.shadowRoot.querySelector('.settings-error').textContent = 'Les préférences n’ont pas pu être enregistrées. Vérifiez le stockage de ce navigateur.'; }
      });
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

    attributeChangedCallback() {
      const disabled = this.hasAttribute('no-missions');
      this.missionsButton.hidden = disabled;
      this.missionsButton.disabled = disabled;
      this.shadowRoot.querySelector('.mission-error').hidden = true;
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
      this.closePreferences();
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
      this.shadowRoot.querySelector('.preferences').hidden = !this.preferenceFields.length;
    }
    get preferenceFields() {
      if (!/^[a-z][a-z0-9-]{0,31}$/.test(this.getAttribute('preferences-app') || '')) return [];
      try {
        const fields = JSON.parse(this.getAttribute('preferences-fields') || '[]');
        if (!Array.isArray(fields) || fields.length > 12 || !fields.every(f => f && /^[a-z][a-zA-Z0-9]{0,31}$/.test(f.key)
          && typeof f.label === 'string' && (f.type === 'checkbox' ? typeof f.default === 'boolean' :
            f.type === 'select' && Array.isArray(f.options) && f.options.length > 0 && f.options.length <= 20
            && f.options.every(o => typeof o.value === 'string' && typeof o.label === 'string')
            && f.options.some(o => o.value === f.default))) || new Set(fields.map(f => f.key)).size !== fields.length) return [];
        return fields;
      } catch (_) { return []; }
    }
    get settings() { return AvereoAccountMenu.readSettings(this.getAttribute('preferences-app'), this.preferenceFields); }
    openPreferences() {
      if (!this.preferenceFields.length) return;
      this.open = false;
      const fields = this.shadowRoot.querySelector('.settings-fields'), values = this.settings;
      fields.replaceChildren();
      this.shadowRoot.querySelector('#settings-title').textContent = 'Préférences — ' + (this.getAttribute('preferences-label') || this.getAttribute('preferences-app'));
      this.shadowRoot.querySelector('.settings-error').textContent = '';
      for (const field of this.preferenceFields) {
        const label = document.createElement('label'); label.textContent = field.label;
        const input = document.createElement(field.type === 'checkbox' ? 'input' : 'select'); input.name = field.key;
        if (field.type === 'checkbox') { input.type = 'checkbox'; input.checked = values[field.key]; }
        else { for (const item of field.options) { const option = document.createElement('option'); option.value = item.value; option.textContent = item.label; input.append(option); } input.value = values[field.key]; }
        label.append(input); fields.append(label);
      }
      if (this.settingsDialog.showModal) this.settingsDialog.showModal(); else this.settingsDialog.setAttribute('open','');
    }
    closePreferences() {
      if (!this.settingsDialog?.hasAttribute('open')) return;
      if (this.settingsDialog.close) this.settingsDialog.close(); else { this.settingsDialog.removeAttribute('open'); this.trigger.focus(); }
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
