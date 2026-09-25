import { useMemo, useState } from 'react';
import { CLIENT } from '../config/referentiels.js';
import { useStore } from '../hooks/useStore.js';
import { makeBackup, parseJson } from '../services/importers.js';
import { downloadFile } from '../utils/browser.js';
import { fmtDate, norm, todayISO } from '../utils/text.js';

function Backup() {
  const resources = useStore(s => s.resources);
  const { restoreBackup, showToast } = useStore.getState();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');

  const exportNow = () => {
    downloadFile(`avereo-recherche-sauvegarde-${todayISO()}.json`, makeBackup(useStore.getState()));
    showToast('Sauvegarde téléchargée');
  };
  const pick = async file => {
    setError('');
    if (!file) return;
    try { setPending(parseJson(await file.text())); } catch (e) { setError(e.message); }
  };

  return (
    <div className="panel">
      <h3>Sauvegarde</h3>
      <p>Vos {resources.length} ressources sont enregistrées <strong>dans ce navigateur uniquement</strong>. Téléchargez régulièrement une sauvegarde et rangez-la dans <code>GED_AVEREO</code> : elle sert aussi à passer sur un autre poste.</p>
      <div className="actions">
        <button className="btn primary" onClick={exportNow} disabled={!resources.length}>Télécharger une sauvegarde (.json)</button>
        <label className="btn" htmlFor="restore-file">Restaurer une sauvegarde…</label>
        <input id="restore-file" type="file" accept=".json" hidden onChange={e => { pick(e.target.files[0]); e.target.value = ''; }} />
      </div>
      {error && <p className="warnbox">{error}</p>}
      {pending && (
        <div className="warnbox">
          Remplacer les {resources.length} ressources actuelles par les {pending.resources.length} de la sauvegarde ?
          <div className="actions">
            <button className="btn danger" onClick={() => { restoreBackup(pending); setPending(null); showToast('Sauvegarde restaurée'); }}>Oui, remplacer</button>
            <button className="btn" onClick={() => setPending(null)}>Annuler</button>
          </div>
          <p className="hint">Pour ajouter sans rien remplacer, utilisez plutôt Ajouter › Importer des fichiers.</p>
        </div>
      )}
    </div>
  );
}

export default function ImprovePage({ navigate }) {
  const resources = useStore(s => s.resources);
  const log = useStore(s => s.log);
  const { addSuggestion, removeSuggestion, clearUsageLog, removeDemo, loadDemo, requestReview, showToast } = useStore.getState();
  const [idea, setIdea] = useState('');
  const byId = useMemo(() => new Map(resources.map(r => [r.id, r])), [resources]);
  const demoCount = resources.filter(r => r.demo).length;

  const zero = useMemo(() => {
    const m = new Map();
    log.zeroResults.forEach(({ q, at }) => {
      const k = norm(q);
      const e = m.get(k) || { q, n: 0, last: at };
      e.n++; if (at > e.last) e.last = at;
      m.set(k, e);
    });
    return [...m.values()].sort((a, b) => b.n - a.n || b.last.localeCompare(a.last));
  }, [log.zeroResults]);

  const topCopied = Object.entries(log.copies).filter(([id]) => byId.has(id)).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <section className="page">
      <h2>Amélioration</h2>
      <p className="lead">Ce que l'usage révèle : quoi collecter en priorité, quoi faire valider, quoi améliorer dans l'outil. Aucun secret ni aucune donnée client n'est enregistré ici.</p>

      <div className="panels">
        <div className="panel">
          <h3>Recherches sans résultat <span className="badge b-neutral">{zero.length}</span></h3>
          {!zero.length ? <p className="hint">Aucune pour l'instant.</p> : (
            <ul className="list">
              {zero.slice(0, 20).map(z => (
                <li key={z.q}>
                  <span>« {z.q} » <small>× {z.n} · {fmtDate(z.last)}</small></span>
                  <button className="btn small" onClick={() => navigate('ajouter', { title: z.q })}>Ajouter une ressource</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Les plus copiés</h3>
          <p className="hint">Candidats prioritaires à la validation client.</p>
          {!topCopied.length ? <p className="hint">Aucune copie pour l'instant.</p> : (
            <ul className="list">
              {topCopied.map(([id, n]) => {
                const r = byId.get(id);
                const canRequest = r.client === 'INTERNAL_ONLY' || r.client === 'NOT_EVALUATED';
                return (
                  <li key={id}>
                    <span>{r.title} <small>× {n} · {CLIENT[r.client].label}</small></span>
                    {canRequest && <button className="btn small" onClick={() => { requestReview(id); showToast('Ajouté à « À valider »'); }}>Demander la validation</button>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Résultats jugés « pas utiles »</h3>
          {!log.notUseful.length ? <p className="hint">Aucun signalement.</p> : (
            <ul className="list">
              {log.notUseful.slice(0, 20).map(x => (
                <li key={x.at}><span>{byId.get(x.id)?.title || x.id} <small>pour « {x.q} » · {fmtDate(x.at)}</small></span></li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Idées d'amélioration de l'outil</h3>
          <form className="inline-form" onSubmit={e => { e.preventDefault(); if (idea.trim()) { addSuggestion(idea); setIdea(''); showToast('Idée notée'); } }}>
            <input id="idea" value={idea} onChange={e => setIdea(e.target.value)} placeholder="ex. Pouvoir filtrer par formation" aria-label="Nouvelle idée" />
            <button className="btn primary" type="submit">Noter</button>
          </form>
          <ul className="list">
            {log.suggestions.map(s => (
              <li key={s.at}><span>{s.text} <small>{fmtDate(s.at)}</small></span><button className="btn small ghost" aria-label="Supprimer l'idée" onClick={() => removeSuggestion(s.at)}>×</button></li>
            ))}
          </ul>
        </div>
      </div>

      <Backup />

      <div className="panel">
        <h3>Données d'exemple</h3>
        {demoCount ? (
          <div className="actions"><span>{demoCount} ressources d'exemple (fictives) dans le corpus.</span><button className="btn" onClick={() => { removeDemo(); showToast("Exemples supprimés"); }}>Supprimer les exemples</button></div>
        ) : (
          <div className="actions"><span>Aucun exemple chargé.</span><button className="btn" onClick={() => { const r = loadDemo(); showToast(`${r.added} exemples chargés`); }}>Charger les exemples</button></div>
        )}
        <div className="actions"><button className="btn ghost small" onClick={() => { clearUsageLog(); showToast("Journal d'usage effacé (idées conservées)"); }}>Effacer le journal d'usage</button></div>
      </div>
    </section>
  );
}
