const profiles = ['', 'habitologue', 'architecte', 'maitre_oeuvre'];
const activeForms = new WeakMap();

// A declared account default, never an application permission or a professional accreditation.
export async function setupProfessionalProfile({ form, accountId, getJson, session }) {
  const state = {};
  activeForms.set(form, state);
  const current = () => activeForms.get(form) === state;
  const select = form.querySelector('select');
  const submit = form.querySelector('[type=submit]');
  const cancel = form.querySelector('[type=button]');
  const status = form.querySelector('[role=status]');
  let saved = '', context = '';
  const enable = value => { select.disabled = submit.disabled = cancel.disabled = !value; };
  enable(false);
  status.textContent = 'Chargement de votre profil professionnel…';
  try {
    const { data } = await getJson('/api/v1/me/preferences');
    if (!current()) return;
    if (String(data?.accountId) !== String(accountId) || !profiles.includes(data?.professionalProfile)
        || !/^[a-f0-9]{64}$/.test(data?.accountContext || '')) throw Error('Compte ou préférences indisponibles. Rouvrez Mon compte.');
    saved = select.value = data.professionalProfile;
    let assigned = form.querySelector('[data-admin-profile]');
    if (!assigned) { assigned = document.createElement('p'); assigned.dataset.adminProfile = ''; form.append(assigned); }
    assigned.textContent = data.accessProfile ? `Profil d’accès administré : ${data.accessProfile.name}. Ses droits se gèrent dans Gérer les comptes.` : 'Aucun profil d’accès administré affecté à ce compte.';
    context = data.accountContext;
    enable(true);
    status.textContent = 'Ce défaut est enregistré sur votre compte CONNECT. Vos dossiers existants restent inchangés.';
  } catch (error) {
    if (current()) status.textContent = error.userMessage || error.message || 'Profil indisponible. Réessayez depuis Mon compte.';
  }
  cancel.onclick = () => { select.value = saved; status.textContent = 'Modification annulée. Le profil enregistré est conservé.'; };
  form.onsubmit = async event => {
    event.preventDefault();
    if (!current() || !context || submit.disabled) return;
    const value = select.value;
    enable(false);
    try {
      if (!profiles.includes(value)) throw Error('Choisissez un profil proposé.');
      const fresh = (await session()).data;
      if (!fresh?.approved || !fresh.csrfToken) throw Error('Reconnectez-vous à CONNECT.');
      const { data } = await getJson('/api/v1/me/preferences', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': fresh.csrfToken, 'X-Account-Context': context },
        body: JSON.stringify({ professionalProfile: value }),
      });
      if (!current()) return;
      if (data?.professionalProfile !== value) throw Error('La confirmation du profil est invalide.');
      saved = value;
      status.textContent = 'Profil enregistré. Il sera proposé pour les nouveaux dossiers Rapport ; chaque dossier conserve ensuite son choix.';
      enable(true);
    } catch (error) {
      if (!current()) return;
      // A changed session requires a fresh context; keep editing disabled until the page is reopened.
      context = '';
      status.textContent = (error.userMessage || error.message || 'Enregistrement indisponible.') + ' Rouvrez Mon compte avant de réessayer.';
    }
  };
}
