const actionLabels = { read: 'Consulter les dossiers', create: 'Créer un dossier', update: 'Modifier les dossiers', delete: 'Supprimer un dossier', export: 'Exporter les livrables' };
const templateLabels = { habitologue: 'Habitologue', architecte: 'Architecte', maitre_oeuvre: 'Maître d’œuvre' };
const element = (tag, text, parent) => { const node = document.createElement(tag); if (text) node.textContent = text; parent?.append(node); return node; };

export async function mountProfileAdministration({ panel, usersList, organizationId, getJson, mutation, confirm, refresh }) {
  const previous = document.getElementById('profiles-management');
  const wasOpen = previous?.querySelector('details')?.open;
  previous?.remove();
  let data;
  try { data = (await getJson('/api/v1/admin/profiles')).data; }
  catch { return; } // Older installations and organization administrators retain their existing screen.
  const section = element('section'); section.id = 'profiles-management';
  section.style.cssText = 'margin:20px 0;padding:16px;border:1px solid #d6deea;border-radius:12px';
  panel.querySelector('.admin-summary').after(section);
  const outer = element('details', '', section);
  outer.open = Boolean(wasOpen);
  element('summary', 'Types de profils et droits — catalogue commun AVEREO', outer);
  element('p', 'Créez vos types de profils, puis affectez-les aux comptes. Les applications du profil limitent les accès déjà attribués au compte ; ses dates et les autorisations de son organisation restent applicables.', outer);
  const status = element('p', '', outer); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const reload = element('button', 'Actualiser le catalogue', outer); reload.type = 'button';
  reload.onclick = async () => { if (await confirm('Actualiser le catalogue ? Les modifications non enregistrées de ses formulaires seront abandonnées.')) await refresh(); };
  let saving = false;
  function beginSave() {
    if (saving) return false;
    saving = true; section.inert = true; usersList.inert = true; panel.setAttribute('aria-busy', 'true');
    panel.querySelector('#admin-status').textContent = 'Enregistrement du profil en cours…';
    return true;
  }
  function endSave() {
    saving = false; section.inert = false; usersList.inert = false; panel.removeAttribute('aria-busy');
  }

  function textField(parent, title, value = '', textarea = false) {
    const label = element('label', title, parent);
    label.style.cssText = 'display:grid;gap:6px;margin:12px 0';
    const input = element(textarea ? 'textarea' : 'input', '', label); input.value = value;
    input.style.cssText = 'padding:8px;border:1px solid #bac9da;border-radius:6px;font:inherit';
    return input;
  }
  function checkbox(parent, title, checked) {
    const label = element('label', '', parent); label.style.cssText = 'display:block;margin:8px 0';
    const input = element('input', '', label); input.type = 'checkbox'; input.checked = checked;
    label.append(document.createTextNode(` ${title}`)); return input;
  }
  function profileEditor(profile) {
    const details = element('details', '', outer);
    element('summary', profile ? `${profile.name}${profile.active ? '' : ' — désactivé'}` : 'Créer un type de profil', details);
    const form = element('form', '', details);
    const name = textField(form, 'Nom du type de profil', profile?.name); name.required = true; name.maxLength = 80;
    const description = textField(form, 'Description', profile?.description, true); description.maxLength = 1000;
    const label = element('label', 'Parcours Rapport de référence', form);
    const template = element('select', '', form);
    template.id = `profile-template-${profile?.id || 'new'}`; label.htmlFor = template.id;
    for (const [key, text] of Object.entries(templateLabels)) template.add(new Option(text, key));
    template.value = profile?.template || 'habitologue';
    const active = checkbox(form, 'Type de profil actif', profile?.active ?? true);
    const apps = element('fieldset', '', form); element('legend', 'Applications permises par ce profil', apps);
    const appInputs = new Map(data.applications.map(app => [app.code, checkbox(apps, app.name, profile?.applications.includes(app.code))]));
    const rights = element('fieldset', '', form); element('legend', 'Actions dans Rapport', rights);
    const actionInputs = new Map(Object.entries(actionLabels).map(([key, text]) => [key, checkbox(rights, text, profile?.reportActions.includes(key))]));
    for (const [key, input] of actionInputs) input.onchange = () => {
      if (key !== 'read' && input.checked) actionInputs.get('read').checked = true;
      if (key === 'read' && !input.checked) for (const other of actionInputs.values()) other.checked = false;
      if (input.checked && appInputs.has('rapport')) appInputs.get('rapport').checked = true;
    };
    if (appInputs.has('rapport')) appInputs.get('rapport').onchange = () => {
      if (!appInputs.get('rapport').checked) for (const input of actionInputs.values()) input.checked = false;
      else actionInputs.get('read').checked = true;
    };
    element('p', 'La désactivation retire l’accès des comptes affectés au profil, sans supprimer leurs dossiers. Les fichiers déjà téléchargés restent sur les appareils.', form);
    const button = element('button', profile ? 'Enregistrer ce profil' : 'Créer le profil', form); button.type = 'submit';
    const cancel = element('button', 'Annuler les modifications', form); cancel.type = 'button'; cancel.onclick = () => refresh();
    form.onsubmit = async event => {
      event.preventDefault(); if (button.disabled) return;
      const count = profile ? Object.values(data.assignments).filter(id => id === profile.id).length : 0;
      if (!await confirm(profile ? `Enregistrer ce profil commun ? Les droits de ${count} compte(s) affecté(s) seront recalculés.` : 'Créer ce type de profil commun ? Aucun compte ne lui sera affecté automatiquement.')) return;
      if (!beginSave()) return;
      button.disabled = true; status.textContent = '';
      try {
        await mutation(profile ? `/api/v1/admin/profiles/${encodeURIComponent(profile.id)}` : '/api/v1/admin/profiles', profile ? 'PUT' : 'POST', {
          revision: data.revision, name: name.value.trim(), description: description.value, template: template.value,
          active: active.checked, applications: [...appInputs].filter(([, input]) => input.checked).map(([key]) => key),
          reportActions: [...actionInputs].filter(([, input]) => input.checked).map(([key]) => key),
        });
        await refresh('Profil enregistré. Les droits des comptes affectés ont été actualisés.');
      } catch (error) { status.textContent = error.userMessage || 'Enregistrement impossible. Rechargez le catalogue avant de réessayer.'; outer.open = true; }
      finally { button.disabled = false; endSave(); }
    };
  }
  for (const profile of data.profiles) profileEditor(profile);
  profileEditor(null);

  for (const card of usersList.querySelectorAll('[data-account-id]')) {
    card.querySelector('[data-profile-assignment]')?.remove();
    const id = Number(card.dataset.accountId);
    const current = data.assignments[id] || '';
    const profile = data.profiles.find(p => p.id === current);
    const details = element('details', '', card); details.dataset.profileAssignment = ''; details.style.gridColumn = '1 / -1';
    element('summary', `Profil et droits : ${profile?.name || 'accès existants, sans profil administré'}`, details);
    if (id === data.actorId || !['owner', 'admin', 'member', 'viewer'].includes(card.dataset.accountRole)) {
      element('p', 'Compte protégé : son affectation n’est pas modifiable par ce parcours.', details); continue;
    }
    const label = element('label', 'Profil administré du compte', details);
    const select = element('select', '', details); select.id = `profile-assignment-${id}`; label.htmlFor = select.id;
    select.add(new Option('Sans profil — conserver les accès existants', ''));
    for (const p of data.profiles.filter(p => p.active || p.id === current)) {
      const option = new Option(p.name + (p.active ? '' : ' — désactivé'), p.id); option.disabled = !p.active; select.add(option);
    }
    select.value = current;
    const preview = element('p', '', details);
    const selectedProfile = () => data.profiles.find(p => p.id === select.value);
    const describeProfile = p => `Applications du profil : ${p.applications.map(code => data.applications.find(app => app.code === code)?.name || code).join(', ') || 'aucune'}. Actions Rapport : ${p.reportActions.map(key => actionLabels[key]).join(', ') || 'aucune'}.`;
    const updatePreview = () => {
      const selected = selectedProfile();
      preview.textContent = selected ? `Parcours de référence : ${templateLabels[selected.template]}. ${describeProfile(selected)}${selected.applications.length ? '' : ' Ce profil ne permet aucun accès applicatif.'}` : 'Sans profil administré : les accès antérieurs du compte seront conservés ou rétablis.';
    };
    select.onchange = updatePreview; updatePreview();
    const button = element('button', 'Enregistrer le profil du compte', details); button.type = 'button';
    const feedback = element('p', '', details); feedback.setAttribute('role', 'status');
    button.onclick = async () => {
      const selected = selectedProfile();
      if (button.disabled || !await confirm(selected ? `Affecter « ${selected.name} » au compte ? ${describeProfile(selected)} Les dates et les dossiers sont conservés.` : 'Retirer le profil administré ? Les accès et droits antérieurs du compte seront rétablis.')) return;
      if (!beginSave()) return;
      button.disabled = true;
      try {
        await mutation(`/api/v1/admin/organizations/${organizationId}/users/${id}/profile`, 'PUT', { revision: data.revision, profileId: select.value || null });
        await refresh('Profil du compte enregistré.');
      } catch (error) { feedback.textContent = error.userMessage || 'Affectation impossible. Rechargez le catalogue.'; }
      finally { button.disabled = false; endSave(); }
    };
  }
  const history = element('details', '', outer); element('summary', 'Dernières modifications', history);
  const list = element('ul', '', history);
  for (const entry of data.audit.slice(-10).reverse()) {
    const verb = entry.event === 'profile.assign' ? `affectation du compte ${entry.accountId}` : entry.event === 'profile.create' ? 'création de profil' : 'modification de profil';
    element('li', `${new Date(entry.at).toLocaleString('fr-FR')} — ${verb} — compte administrateur ${entry.actorId}`, list);
  }
  if (!data.audit.length) element('p', 'Aucune modification enregistrée.', history);
}
