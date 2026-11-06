import { createRgaProjects } from './project-library.js';

const preferences = [
  { key: 'sort', label: 'Ordre des départements', type: 'select', default: 'code', options: [{ value: 'code', label: 'Numéro de département' }, { value: 'nom', label: 'Nom du département' }] },
  { key: 'opacity', label: 'Intensité de la couche RGA', type: 'select', default: '40', options: [{ value: '20', label: 'Discrète — 20 %' }, { value: '40', label: 'Standard — 40 %' }, { value: '60', label: 'Renforcée — 60 %' }] },
];

customElements.whenDefined('avereo-account-menu').then(() => {
  const menu = document.querySelector('avereo-account-menu');
  if (!menu) return;
  menu.setAttribute('preferences-app', 'rga');
  menu.setAttribute('preferences-label', 'RGA');
  menu.setAttribute('preferences-fields', JSON.stringify(preferences));
  menu.refreshLinks();
  function apply() {
    for (const [id, value, event] of [['sort', menu.settings.sort, 'change'], ['rga-opacity', menu.settings.opacity, 'input']]) {
      const control = document.getElementById(id);
      if (control) { control.value = value; control.dispatchEvent(new Event(event, { bubbles: true })); }
    }
  }
  document.addEventListener('avereo-preferences-change', event => { if (event.detail.app === 'rga') apply(); });
  window.addEventListener('storage', event => { if (event.key === 'avereo.rga.preferences.v1') apply(); });
  if (document.readyState === 'complete') apply(); else window.addEventListener('load', apply, { once: true });
});

export function setupRgaProjects({ getPoint, openPoint }) {
  const button = document.getElementById('rga-projects');
  if (!button) return;
  const projects = createRgaProjects(localStorage);
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'rga-projects-title');
  dialog.style.cssText = 'width:min(620px,calc(100vw - 32px));max-height:85vh;overflow:auto;border:1px solid #b6c7ca;border-radius:12px;padding:24px;color:#183344;background:white';
  dialog.innerHTML = `<h2 id="rga-projects-title">Mes projets — RGA</h2>
    <p>Retrouvez les biens repérés dans ce navigateur. Les résultats Géorisques sont actualisés à l’ouverture ; cette liste n’est pas synchronisée en ligne.</p>
    <form><label>Nom du projet <input name="name" maxlength="150" required style="display:block;width:100%;box-sizing:border-box;margin:8px 0;padding:10px"></label><button type="submit">Enregistrer le point sélectionné</button></form>
    <p role="status" class="project-status"></p><ul style="padding:0;list-style:none"></ul><button type="button" class="close-projects">Fermer</button>`;
  document.body.append(dialog);
  const status = dialog.querySelector('.project-status'), list = dialog.querySelector('ul');
  function render() {
    list.replaceChildren();
    try {
      const items = projects.list();
      if (!items.length) status.textContent = 'Aucun projet RGA enregistré. Sélectionnez une adresse sur la carte pour commencer.';
      for (const item of items.slice().reverse()) {
        const row = document.createElement('li'); row.style.cssText = 'padding:12px 0;border-bottom:1px solid #d8e2e4';
        const text = document.createElement('p'); text.textContent = `${item.name} — ${item.point.label}`;
        const open = document.createElement('button'); open.type = 'button'; open.textContent = 'Ouvrir';
        open.addEventListener('click', () => { dialog.close(); openPoint(item.point); });
        row.append(text, open); list.append(row);
      }
    } catch { status.textContent = 'La liste ne peut pas être lue. Son contenu est conservé sans remplacement.'; }
  }
  function show() {
    status.textContent = '';
    const point = getPoint();
    dialog.querySelector('[name=name]').value = point?.label || '';
    dialog.querySelector('[type=submit]').disabled = !point;
    render(); dialog.showModal();
  }
  button.addEventListener('click', show);
  dialog.querySelector('.close-projects').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.querySelector('avereo-account-menu')?.shadowRoot.querySelector('.trigger')?.focus());
  dialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    try { projects.save(getPoint(), dialog.querySelector('[name=name]').value); render(); status.textContent = 'Projet enregistré dans ce navigateur.'; }
    catch (error) { status.textContent = error.message || 'Enregistrement impossible. Vérifiez le stockage de ce navigateur.'; }
  });
  if (new URLSearchParams(location.hash.slice(1)).has('projects')) {
    show();
    const hash = new URLSearchParams(location.hash.slice(1)); hash.delete('projects');
    history.replaceState(null, '', '#' + hash);
  }
}
