import { useState } from 'react';
import { AUTHORITIES, CLIENT, CONFIDENCE, DOMAINS, ORIGINS, RIGHTS, SOURCE_REGISTRY, TYPES, registryFor } from '../config/referentiels.js';
import { fmtDate, todayISO } from '../utils/text.js';

// Statuts qu'on peut choisir à la saisie. Approuver ou refuser passe par « À valider »
// pour que chaque décision soit tracée (validated_by, validated_at, note).
const EDITABLE_CLIENT = ['NOT_EVALUATED', 'INTERNAL_ONLY', 'ELIGIBLE_FOR_REVIEW'];

const blank = () => ({
  type: 'Lien', domain: 'Non classé', origin: 'Web', authority: 'Formation', title: '', text: '', tags: '',
  src: { org: '', formation: '', module: '', lesson: '', url: '', loc: '' },
  date: todayISO(), rights: 'RIGHTS_UNKNOWN', client: 'INTERNAL_ONLY', conf: 'MEDIUM', conflict: '', need: '',
});

// initial : ressource existante (modification) · prefill : champs pré-remplis d'une nouvelle ressource
export default function ResourceForm({ initial, prefill, onSave, onCancel, onDelete }) {
  const [f, setF] = useState(() => (initial ? { ...initial, tags: initial.tags.join(', '), src: { ...initial.src } } : { ...blank(), ...(prefill || {}) }));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [registryNote, setRegistryNote] = useState('');
  const isNew = !initial;
  const decided = !EDITABLE_CLIENT.includes(f.client);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const setSrc = (k, v) => setF(p => ({ ...p, src: { ...p.src, [k]: v } }));

  const applyRegistry = org => {
    const reg = registryFor(org);
    if (!reg || !isNew) return;
    setF(p => ({ ...p, origin: reg.origin, authority: reg.authority, rights: reg.rights, client: EDITABLE_CLIENT.includes(reg.client) ? reg.client : 'INTERNAL_ONLY' }));
    setRegistryNote(`Règles du registre appliquées pour ${reg.org} : ${reg.rule}.`);
  };

  const submit = e => {
    e.preventDefault();
    if (!f.title.trim()) return;
    onSave({ ...f, tags: f.tags.split(',').map(t => t.trim()).filter(Boolean) });
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label className="span-2">Titre *
          <input id="rf-title" required value={f.title} onChange={e => set('title', e.target.value)} placeholder="ex. Fiche AQC – Condensation sur parois froides" />
        </label>
        <label>Type
          <select id="rf-type" value={f.type} onChange={e => set('type', e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</select>
        </label>
        <label>Domaine
          <select id="rf-domain" value={f.domain} onChange={e => set('domain', e.target.value)}>{DOMAINS.map(t => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="span-2">Extrait ou information à retrouver
          <textarea id="rf-text" rows={5} value={f.text} onChange={e => set('text', e.target.value)} placeholder="Le passage exact, le seuil, la définition… (c'est ce texte qui sera cité)" />
        </label>
        <label className="span-2">Mots-clés <small>(séparés par des virgules)</small>
          <input id="rf-tags" value={f.tags} onChange={e => set('tags', e.target.value)} placeholder="pont thermique, condensation, ITE" />
        </label>
      </div>

      <fieldset>
        <legend>Source</legend>
        <div className="form-grid">
          <label>Organisme
            <input id="rf-org" list="registry-orgs" value={f.src.org} onChange={e => setSrc('org', e.target.value)} onBlur={e => applyRegistry(e.target.value)} placeholder="AQC, ADEME, organisme de formation…" />
            <datalist id="registry-orgs">{SOURCE_REGISTRY.map(r => <option key={r.id} value={r.org} />)}</datalist>
          </label>
          <label>Lien (URL)
            <input id="rf-url" type="url" value={f.src.url} onChange={e => setSrc('url', e.target.value)} placeholder="https://…" />
          </label>
          <label>Formation / collection
            <input id="rf-formation" value={f.src.formation} onChange={e => setSrc('formation', e.target.value)} />
          </label>
          <label>Module / rubrique
            <input id="rf-module" value={f.src.module} onChange={e => setSrc('module', e.target.value)} />
          </label>
          <label>Leçon / document
            <input id="rf-lesson" value={f.src.lesson} onChange={e => setSrc('lesson', e.target.value)} />
          </label>
          <label>Localisation <small>(page, timestamp, figure)</small>
            <input id="rf-loc" value={f.src.loc} onChange={e => setSrc('loc', e.target.value)} placeholder="p. 12 · 00:12:34–00:14:08 · Figure 4" />
          </label>
          <label>Date de consultation
            <input id="rf-date" type="date" value={f.date} onChange={e => set('date', e.target.value)} />
          </label>
        </div>
        {registryNote && <p className="hint ok">{registryNote}</p>}
      </fieldset>

      <fieldset>
        <legend>Qualification</legend>
        <div className="form-grid">
          <label>Origine
            <select id="rf-origin" value={f.origin} onChange={e => set('origin', e.target.value)}>{ORIGINS.map(t => <option key={t}>{t}</option>)}</select>
          </label>
          <label>Autorité
            <select id="rf-authority" value={f.authority} onChange={e => set('authority', e.target.value)}>{Object.entries(AUTHORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </label>
          <label>Droits
            <select id="rf-rights" value={f.rights} onChange={e => set('rights', e.target.value)}>{Object.entries(RIGHTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </label>
          <label>Usage client
            {decided ? (
              <input id="rf-client" readOnly value={`${CLIENT[f.client].label}${f.validation ? ` — ${fmtDate(f.validation.at)}` : ''} (voir « À valider »)`} />
            ) : (
              <select id="rf-client" value={f.client} onChange={e => set('client', e.target.value)}>{EDITABLE_CLIENT.map(k => <option key={k} value={k}>{CLIENT[k].label}</option>)}</select>
            )}
          </label>
          <label>Fiabilité
            <select id="rf-conf" value={f.conf} onChange={e => set('conf', e.target.value)}>{Object.entries(CONFIDENCE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
          </label>
          <label className="span-2">Contradiction connue <small>(optionnel)</small>
            <input id="rf-conflict" value={f.conflict} onChange={e => set('conflict', e.target.value)} placeholder="ex. Un autre support indique 15 °C au lieu de 10 °C" />
          </label>
        </div>
      </fieldset>

      <div className="actions">
        <button type="submit" className="btn primary">{isNew ? 'Enregistrer la ressource' : 'Enregistrer les modifications'}</button>
        {onCancel && <button type="button" className="btn" onClick={onCancel}>Annuler</button>}
        <span className="actions-sep" />
        {onDelete && !confirmDelete && <button type="button" className="btn danger-ghost" onClick={() => setConfirmDelete(true)}>Supprimer…</button>}
        {onDelete && confirmDelete && (
          <span className="confirm">
            Supprimer définitivement cette ressource ?
            <button type="button" className="btn danger" onClick={onDelete}>Oui, supprimer</button>
            <button type="button" className="btn" onClick={() => setConfirmDelete(false)}>Non</button>
          </span>
        )}
      </div>
    </form>
  );
}
