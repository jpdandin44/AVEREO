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

  // Each app marks its existing save controls. Their original handlers own data and permissions.
  function nativeAction(menu, kind) {
    if (menu.hasAttribute('signed-out')) return null;
    if (kind === 'logout') {
      const slotted = menu.querySelector('[slot="logout"]');
      const target = slotted || menu.shadowRoot.querySelector('a.logout');
      return target && !target.hidden && !target.disabled && target.matches('a[href],button')
        && /déconnecter/i.test(target.textContent) ? target : null;
    }
    return Array.from(document.querySelectorAll('[data-avereo-save="' + kind + '"]')).find(
      element => !element.disabled && !element.closest('[hidden], .hidden') &&
        (element.getClientRects().length || (element.hasAttribute('data-avereo-proxy') &&
          element.closest('details,avereo-account-menu')?.getClientRects().length))
    );
  }

  let appearanceRequest;
  let currentAppearance;
  let personalBadge = 'MOI';
  let preferenceGeneration = 0;
  const validBadge = value => typeof value === 'string' && /^[\p{L}\p{Nd}]{1,3}$/u.test(value);
  function showPersonalBadge(value) {
    personalBadge = validBadge(value) ? value : 'MOI';
    for (const menu of document.querySelectorAll('avereo-account-menu')) {
      if (menu.shadowRoot && !document.querySelector('meta[name="avereo-offline-appearance"]')) menu.shadowRoot.querySelector('.avatar').textContent = personalBadge;
    }
  }
  async function refreshPersonalBadge(menu) {
    const generation = ++preferenceGeneration;
    showPersonalBadge('MOI');
    if (!menu.portal || menu.hasAttribute('signed-out') || location.protocol === 'file:' || document.querySelector('meta[name="avereo-offline-appearance"]')) return null;
    try {
      const code = menu.getAttribute('preferences-app') || '';
      const response = await fetch(menu.portal + '/api/v1/me/preferences?application=' + encodeURIComponent(code),
        {credentials:'include', cache:'no-store', referrerPolicy:'no-referrer'});
      if (!response.ok) throw Error('Préférences indisponibles');
      const result = await response.json();
      if (!validBadge(result?.data?.accountBadge)) throw Error('Préférences invalides');
      if (generation !== preferenceGeneration || menu.hasAttribute('signed-out')) return null;
      showPersonalBadge(result.data.accountBadge);
      return result.data;
    } catch (_) { return null; } // No cached identity or public-model badge after a session failure.
  }
  function appearance(menu) {
    if (!menu.portal || location.protocol === 'file:') return;
    appearanceRequest ||= Promise.resolve().then(() => fetch(menu.portal + '/api/v1/appearance',
      {credentials:'omit', referrerPolicy:'no-referrer'}))
      .then(response => response.ok ? response.json() : null)
      .then(result => { if (!currentAppearance) applyAppearance(result?.data); }).catch(() => {});
  }
  function applyAppearance(settings) {
    if (!settings) return;
    currentAppearance = settings;
    for (const menu of document.querySelectorAll('avereo-account-menu')) {
      if (menu.shadowRoot) menu.shadowRoot.querySelector('.avatar').textContent = document.querySelector('meta[name="avereo-offline-appearance"]') ? (settings.accountBadge || 'MOI') : personalBadge;
    }
    const style = document.documentElement.style;
    if ([56,68,84].includes(settings.headerHeight)) style.setProperty('--av-header', settings.headerHeight + 'px');
    if ([100,116,136].includes(settings.logoWidth)) style.setProperty('--av-logo', settings.logoWidth + 'px');
    style.setProperty('--av-account', settings.accountTone === 'white' ? '#fff' : '#eef3f6');
  }
  document.addEventListener('avereo-appearance', event => applyAppearance(event.detail));

  function reserveSpace() {
    if (document.getElementById('avereo-shell-layout')) return;
    const style = document.createElement('style');
    style.id = 'avereo-shell-layout';
    style.textContent = `@media screen {
      html[data-avereo-shell] body { box-sizing:border-box; padding-top:var(--av-header-used,68px); padding-bottom:52px; }
      html[data-avereo-shell] { scroll-padding-top:var(--av-header-used,68px); scroll-padding-bottom:52px; }
      html[data-avereo-shell] .h-screen:not(body) { height:calc(100dvh - var(--av-header-used,68px) - 52px); }
    }`;
    document.head.append(style);
  }

  class AvereoAccountMenu extends HTMLElement {
    static observedAttributes = ['no-missions', 'signed-out'];
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
          dialog select, dialog input[type=text] { width:100%; padding:10px; border:1px solid #94a3b8; border-radius:7px; background:white; color:#142033; font:inherit; }
          dialog input[type=checkbox] { width:20px; height:20px; }
          dialog footer { display:flex; gap:12px; justify-content:flex-end; flex-wrap:wrap; }
          dialog button { padding:10px 14px; border:1px solid #cbd5e1; border-radius:7px; background:#eef3f9; color:#142033; cursor:pointer; }
          dialog button[type=submit] { background:#155eef; color:white; }
          .settings-error { color:#b91c1c; }
          :host([compact="always"]) .label { display:none; }
          :host([compact="always"]) .trigger { justify-content:center; padding:12px 8px; }
          @media(max-width:1023px) { :host([compact="sidebar"]) .label { display:none; } :host([compact="sidebar"]) .trigger { justify-content:center; padding:12px 8px; } }
          @media(max-width:600px) { :host(:not([placement="sidebar"])) .label { display:none; } :host(:not([placement="sidebar"])) .trigger { padding:8px; min-height:52px; } }
          :host, :host([placement="sidebar"]) {position:fixed;left:8px;bottom:4px;width:max-content;margin:0;z-index:45}
          .trigger, :host([placement]) .trigger, :host([compact]) .trigger {min-height:44px;width:auto;padding:6px 14px;gap:8px;border:1px solid #bdccd5;border-radius:8px;background:var(--av-account,#eef3f6);color:#002b45}
          .trigger:hover {background:#e1eaf0}
          .trigger .avatar {width:max-content;min-width:26px;padding:0 2px;height:26px;color:#002b45;background:#fff;border-color:#a8bcc7;font-size:10px}
          .trigger small {display:none}
          :host .trigger .label, :host([compact]) .trigger .label {display:grid}
          .shell {position:fixed;inset:0 0 auto;min-height:var(--av-header,68px);display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;padding:8px 14px;background:white;color:#002b45;border-bottom:1px solid #c8d6dd;font:14px/1.35 Inter,system-ui,sans-serif}
          .brand,.actions {display:flex;align-items:center;gap:8px}
          .brand img {width:var(--av-logo,116px);height:auto;max-height:46px;object-fit:contain}
          .actions {margin-left:auto;justify-content:flex-end}
          .actions button {min-height:38px;padding:6px 10px;border-radius:8px;border:1px solid #bdccd5;background:#fff;color:#002b45;font:inherit;cursor:pointer}
          .actions [data-action="online"] {color:white;background:#002b45}
          .actions [aria-disabled=true] {opacity:.65}
          .notice {position:fixed;top:var(--av-header-used,68px);right:8px;max-width:calc(100vw - 16px);padding:8px;background:#fff;color:#002b45;border:1px solid #bdccd5;border-radius:6px}
          nav {background:var(--av-account,#eef3f6);color:#002b45;border-color:#bacbd5}
          nav p,.local {color:#405b6c}
          nav a, ::slotted(a), ::slotted(button) {color:#002b45!important}
          nav a:hover,.preferences:hover,::slotted(a:hover),::slotted(button:hover) {background:#d6e3ea!important}
          .shell {margin:0;width:100%;border:0;border-bottom:1px solid #c8d6dd}
          .trigger {position:fixed;inset:auto auto max(4px,env(safe-area-inset-bottom)) 8px;margin:0}
          .signed-out {display:none}
          :host([signed-out]) nav > :not(.signed-out) {display:none!important}
          :host([signed-out]) nav > .signed-out {display:block}
          .shell[popover]:not(:popover-open), .trigger[popover]:not(:popover-open) {display:none}
          .notice:empty {display:none}
          @media(max-width:620px){.shell{padding:4px 8px}.actions{max-width:100%;gap:4px}.actions button{min-height:44px;flex:1;padding:3px 6px;font-size:12px}}
          @media print { :host { display:none!important; } }
        </style>
        <header class="shell"><div class="brand"><img alt="AVEREO"><strong></strong></div>
          <div class="actions"><button type="button" data-action="online">Enregistrer en ligne</button>
          <button type="button" data-action="local">Enregistrer en local</button>
          <button type="button" data-action="logout">Se déconnecter</button></div>
          <div class="notice" role="status"></div></header>
        <button class="trigger" type="button" aria-label="Mon compte : ouvrir le menu du compte" aria-expanded="false" aria-controls="panel">
          <span class="avatar" aria-hidden="true">MOI</span><span class="label"><strong>Mon compte</strong><small>Compte AVEREO</small></span>
        </button>
        <nav id="panel" popover="auto" aria-label="Menu de Mon compte">
          <p>Mon compte</p><p class="signed-out">Aucune session ouverte.</p>
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
          <fieldset class="account-preferences" hidden><legend>Votre compte — toutes vos applications</legend>
            <p>Le médaillon est enregistré sur votre compte CONNECT. Les autres réglages ci-dessous restent locaux.</p>
            <label>Texte du médaillon<input type="text" name="personalAccountBadge" maxlength="6" autocomplete="off" disabled></label>
            <p class="account-preferences-status" role="status"></p>
          </fieldset><div class="settings-fields"></div><p class="settings-error" role="alert"></p>
          <footer><button type="button" class="settings-cancel">Annuler</button><button type="submit">Enregistrer</button></footer>
        </form></dialog>`;
      this.trigger = this.shadowRoot.querySelector('.trigger');
      this.panel = this.shadowRoot.querySelector('nav');
      this.trigger.addEventListener('click', () => { this.open = !this.open; });
      this.header = this.shadowRoot.querySelector('.shell');
      this.notice = this.header.querySelector('.notice');
      const reasons = {online:'Enregistrement en ligne indisponible pour cette vue ou cette session.',
        local:'Aucune sauvegarde locale disponible dans cette vue.', logout:'Aucune session à déconnecter.'};
      this.updateActions = () => {
        for (const button of this.header.querySelectorAll('[data-action]')) {
          const kind = button.dataset.action;
          const available = !!nativeAction(this, kind);
          button.setAttribute('aria-disabled', String(!available));
          button.title = available ? '' : reasons[kind];
        }
      };
      this.header.addEventListener('click', event => {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const kind = button.dataset.action;
        const target = nativeAction(this, kind);
        this.notice.textContent = target ? '' : reasons[kind];
        if (target) target.click();
      });
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
      this.settingsDialog.querySelector('form').addEventListener('submit', async event => {
        event.preventDefault();
        if (this.savingPreferences) return;
        const fields = this.preferenceFields, values = {};
        for (const field of fields) {
          const input = this.settingsDialog.querySelector(`[name="${field.key}"]`);
          values[field.key] = field.type === 'checkbox' ? input.checked : input.value;
        }
        let badgeSaved = false;
        try {
          this.savingPreferences = true;
          const accountField = this.settingsDialog.querySelector('.account-preferences');
          if (!accountField.hidden) {
            const input = accountField.querySelector('input');
            const submittedContext = this.accountPreferenceContext;
            if (input.disabled || !validBadge(input.value)) throw Error('Le médaillon doit contenir de 1 à 3 lettres ou chiffres.');
            const sessionResponse = await fetch(this.portal + '/api/v1/session', {credentials:'include', cache:'no-store'});
            if (!sessionResponse.ok) throw Error('Reconnectez-vous à CONNECT pour enregistrer.');
            const session = (await sessionResponse.json()).data;
            if (!session?.approved || !session.csrfToken) throw Error('Reconnectez-vous à CONNECT pour enregistrer.');
            const response = await fetch(this.portal + '/api/v1/me/preferences', {method:'PUT', credentials:'include', cache:'no-store',
              headers:{'Content-Type':'application/json', 'X-CSRF-Token':session.csrfToken, 'X-Account-Context':submittedContext}, body:JSON.stringify({accountBadge:input.value})});
            if (!response.ok) throw Error('Le médaillon n’a pas pu être enregistré sur votre compte.');
            const saved = (await response.json()).data;
            if (!validBadge(saved?.accountBadge)) throw Error('Réponse de préférences invalide.');
            if (this.accountPreferenceContext !== submittedContext || this.hasAttribute('signed-out')) return;
            ++preferenceGeneration;
            showPersonalBadge(saved.accountBadge);
            badgeSaved = true;
          }
          localStorage.setItem(`avereo.${this.getAttribute('preferences-app')}.preferences.v1`, JSON.stringify(values));
          this.dispatchEvent(new CustomEvent('avereo-preferences-change', { bubbles:true, composed:true,
            detail:{ app:this.getAttribute('preferences-app'), values } }));
          this.closePreferences();
        } catch (error) { this.shadowRoot.querySelector('.settings-error').textContent =
          (badgeSaved ? 'Le médaillon est enregistré sur votre compte, mais les préférences locales n’ont pas pu être enregistrées. ' : 'Les préférences n’ont pas pu être enregistrées. ')
          + (error.message || 'Réessayez.'); }
        finally { this.savingPreferences = false; }
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

    attributeChangedCallback(name) {
      if (name === 'signed-out') {
        ++preferenceGeneration;
        showPersonalBadge('MOI');
        this.closePreferences();
        if (this.isConnected && !this.hasAttribute('signed-out')) refreshPersonalBadge(this);
      }
      const disabled = this.hasAttribute('no-missions');
      this.missionsButton.hidden = disabled;
      this.missionsButton.disabled = disabled;
      this.shadowRoot.querySelector('.mission-error').hidden = true;
    }
    connectedCallback() {
      this.refreshLinks();
      let nestedMap = false;
      try {
        nestedMap = this.getAttribute('app-name') === 'RGA' && window.parent !== window &&
          !!window.parent.document.querySelector('avereo-account-menu[app-name="RGA"]');
      } catch { /* Cross-origin frames keep their own shell. */ }
      if (nestedMap) {
        this.header.hidden = true;
        this.trigger.hidden = true;
      }
      this.shadowRoot.querySelector('.avatar').textContent = personalBadge;
      reserveSpace();
      this.header.querySelector('.brand img').src = document.querySelector('meta[name="avereo-shell-logo"]')?.content || '/assets/avereo-logo.png';
      this.header.querySelector('.brand strong').textContent = this.getAttribute('app-name') || this.getAttribute('preferences-label') || document.title;
      const measure = () => {
        const height = this.header.getBoundingClientRect().height;
        if (height) {
          document.documentElement.dataset.avereoShell = '';
          document.documentElement.style.setProperty('--av-header-used', height + 'px');
        } else if (!document.querySelector('avereo-account-menu:not([hidden])')) {
          delete document.documentElement.dataset.avereoShell;
        }
      };
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(measure);
        this.resizeObserver.observe(this.header);
      }
      // Hoist both landmarks into the browser's top layer. Transformed and sticky
      // ancestors otherwise make position:fixed relative to individual app panels.
      const syncChrome = () => {
        const visible = !nestedMap && this.isConnected && this.getClientRects().length > 0
          && !this.closest('[hidden]');
        for (const element of [this.header, this.trigger]) {
          if (!element.showPopover) continue;
          element.setAttribute('popover','manual');
          if (visible && !element.matches(':popover-open')) element.showPopover();
          if (!visible && element.matches(':popover-open')) element.hidePopover();
        }
        this.updateActions();
      };
      this.controlsObserver = new MutationObserver(syncChrome);
      this.controlsObserver.observe(document.body, {childList:true,subtree:true,attributes:true,
        attributeFilter:['disabled','hidden','class','open','data-avereo-save','signed-out','style']});
      syncChrome();
      measure();
      const offlineModel = document.querySelector('meta[name="avereo-offline-appearance"]');
      if (offlineModel) {
        try { applyAppearance(JSON.parse(offlineModel.content)); } catch { /* Default model. */ }
      } else { appearance(this); refreshPersonalBadge(this); }
      this.refreshPersonal = () => { if (!document.hidden) { this.closePreferences(); refreshPersonalBadge(this); } };
      window.addEventListener('focus', this.refreshPersonal);
      window.addEventListener('pageshow', this.refreshPersonal);
      document.addEventListener('visibilitychange', this.refreshPersonal);
      document.addEventListener('pointerdown', this.outside);
      window.addEventListener('resize', this.reposition);
      // Capture scrolling containers too; the panel stays attached to its trigger.
      document.addEventListener('scroll', this.reposition, true);
    }
    disconnectedCallback() {
      this.open = false;
      this.closePreferences();
      this.resizeObserver?.disconnect();
      this.controlsObserver?.disconnect();
      window.removeEventListener('focus', this.refreshPersonal);
      window.removeEventListener('pageshow', this.refreshPersonal);
      document.removeEventListener('visibilitychange', this.refreshPersonal);
      if (!document.querySelector('avereo-account-menu:not([hidden])')) delete document.documentElement.dataset.avereoShell;
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
    async openPreferences() {
      if (!this.preferenceFields.length) return;
      this.open = false;
      const fields = this.shadowRoot.querySelector('.settings-fields'), values = this.settings;
      fields.replaceChildren();
      this.shadowRoot.querySelector('#settings-title').textContent = 'Préférences — ' + (this.getAttribute('preferences-label') || this.getAttribute('preferences-app'));
      this.shadowRoot.querySelector('.settings-error').textContent = '';
      const accountField = this.settingsDialog.querySelector('.account-preferences');
      accountField.hidden = !(this.getAttribute('preferences-app') === 'connect' && this.portal
        && new URL(this.portal).origin === location.origin && !this.hasAttribute('signed-out'));
      const badgeInput = accountField.querySelector('input');
      badgeInput.disabled = true;
      badgeInput.value = '';
      this.accountPreferenceContext = '';
      this.settingsDialog.querySelector('form > p').textContent = accountField.hidden
        ? 'Ces réglages concernent uniquement cette application, dans ce navigateur. Ils ne modifient pas vos projets ni votre compte AVEREO.'
        : 'Le médaillon suit votre compte dans les applications rattachées. Les autres préférences restent propres à ce navigateur.';
      for (const field of this.preferenceFields) {
        const label = document.createElement('label'); label.textContent = field.label;
        const input = document.createElement(field.type === 'checkbox' ? 'input' : 'select'); input.name = field.key;
        if (field.type === 'checkbox') { input.type = 'checkbox'; input.checked = values[field.key]; }
        else { for (const item of field.options) { const option = document.createElement('option'); option.value = item.value; option.textContent = item.label; input.append(option); } input.value = values[field.key]; }
        label.append(input); fields.append(label);
      }
      if (this.settingsDialog.showModal) this.settingsDialog.showModal(); else this.settingsDialog.setAttribute('open','');
      if (!accountField.hidden) {
        accountField.querySelector('[role=status]').textContent = 'Chargement du médaillon du compte…';
        const preferences = await refreshPersonalBadge(this);
        if (!this.settingsDialog.open) return;
        if (preferences && typeof preferences.accountContext === 'string' && /^[a-f0-9]{64}$/.test(preferences.accountContext)) {
          this.accountPreferenceContext = preferences.accountContext;
          badgeInput.value = preferences.accountBadge;
          badgeInput.disabled = false;
          accountField.querySelector('[role=status]').textContent = 'De 1 à 3 lettres ou chiffres. Annuler ne modifie pas le compte.';
        } else accountField.querySelector('[role=status]').textContent = 'Compte ou préférences indisponibles. Reconnectez-vous à CONNECT puis réessayez.';
      }
    }
    closePreferences() {
      this.accountPreferenceContext = '';
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
