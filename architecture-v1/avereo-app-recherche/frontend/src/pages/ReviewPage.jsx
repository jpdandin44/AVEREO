import { useState } from 'react';
import { ResourceBadges } from '../components/Badges.jsx';
import { OWNER } from '../config/referentiels.js';
import { useStore } from '../hooks/useStore.js';
import { provenanceChain } from '../services/resource.js';
import { fmtDate } from '../utils/text.js';

function ReviewItem({ r }) {
  const { decide, showToast } = useStore.getState();
  const [note, setNote] = useState('');
  const [evidence, setEvidence] = useState('');
  const act = decision => {
    decide(r.id, decision, note, evidence);
    showToast(decision === 'APPROVED_FOR_CLIENT_USE' ? `${r.id} validé pour usage client` : `${r.id} refusé pour usage client`);
  };
  return (
    <article className="res">
      <div className="kind">{r.type} · {r.domain} · {r.id}</div>
      <h3>{r.title}</h3>
      {r.text && <p className="excerpt">{r.text}</p>}
      <div className="prov"><strong>{r.src.org || 'Source non renseignée'}</strong>{provenanceChain(r).map((c, i) => <span key={i}><span className="sep">›</span> {c}</span>)}{r.src.loc && <><span className="sep">·</span>{r.src.loc}</>}</div>
      <ResourceBadges r={r} />
      <div className="form-grid">
        <label>Justification de la décision
          <input id={`note-${r.id}`} value={note} onChange={e => setNote(e.target.value)} placeholder="ex. Reformulé par AVEREO, source citée" />
        </label>
        <label>Preuve des droits <small>(rights_evidence)</small>
          <input id={`evidence-${r.id}`} value={evidence} onChange={e => setEvidence(e.target.value)} placeholder="ex. Mentions légales du site, licence, accord écrit" />
        </label>
      </div>
      <div className="actions">
        <button className="btn primary" onClick={() => act('APPROVED_FOR_CLIENT_USE')}>Valider pour usage client</button>
        <button className="btn" onClick={() => act('REJECTED_FOR_CLIENT_USE')}>Refuser</button>
        {r.src.url && <a className="btn ghost" href={r.src.url} target="_blank" rel="noopener noreferrer">Vérifier la source ↗</a>}
      </div>
    </article>
  );
}

export default function ReviewPage() {
  const resources = useStore(s => s.resources);
  const pending = resources.filter(r => r.client === 'ELIGIBLE_FOR_REVIEW');
  const decided = resources.filter(r => r.validation).sort((a, b) => String(b.validation.at).localeCompare(String(a.validation.at)));

  return (
    <section className="page">
      <h2>À valider pour usage client</h2>
      <p className="lead">
        Décideur actuel : <strong>{OWNER.label}</strong>. Seuls les contenus validés ici peuvent être repris <em>tels quels</em> dans un rapport client ;
        les autres sont cités en « référence seule ». Un relecteur expert pourra être ajouté en V3.
      </p>
      {!pending.length && <p className="okbox">Rien en attente. Pour proposer un contenu, cliquez sur « Demander la validation client » dans un résultat de recherche.</p>}
      <div className="results">{pending.map(r => <ReviewItem key={r.id} r={r} />)}</div>

      {decided.length > 0 && (
        <>
          <h3>Historique des décisions</h3>
          <div className="tbl">
            <table>
              <thead><tr><th>Ressource</th><th>Décision</th><th>Par</th><th>Le</th><th>Justification</th><th>Preuve des droits</th></tr></thead>
              <tbody>
                {decided.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.id}</strong><br />{r.title}</td>
                    <td>{r.validation.decision === 'APPROVED_FOR_CLIENT_USE' ? 'Validé' : 'Refusé'}{r.client !== r.validation.decision && <><br /><small>(statut actuel : à revalider)</small></>}</td>
                    <td>{r.validation.by}</td>
                    <td>{fmtDate(r.validation.at)}</td>
                    <td>{r.validation.note || '—'}</td>
                    <td>{r.validation.evidence || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
