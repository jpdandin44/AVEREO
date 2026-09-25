import { useState } from 'react';
import ResourceForm from '../components/ResourceForm.jsx';
import { useStore } from '../hooks/useStore.js';
import { importFiles } from '../services/importers.js';

function ImportPanel({ navigate }) {
  const { importResources, showToast } = useStore.getState();
  const [report, setReport] = useState(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async files => {
    if (!files?.length) return;
    setBusy(true);
    const parsed = await importFiles(files);
    const { added, skipped } = importResources(parsed.resources);
    setReport({ added, skipped, errors: parsed.errors });
    setBusy(false);
    if (added) showToast(`${added} ressource${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}`);
  };

  return (
    <div className="import">
      <label htmlFor="import-files" className={`dropzone${drag ? ' drag' : ''}`}
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}>
        <strong>{busy ? 'Import en cours…' : 'Déposez vos fichiers ici, ou cliquez pour les choisir'}</strong>
        <span>Fiches Markdown de Collector (.md), notes texte (.txt), sauvegarde de cette application (.json)</span>
        <input id="import-files" type="file" multiple accept=".md,.markdown,.txt,.json" onChange={e => { handle(e.target.files); e.target.value = ''; }} />
      </label>
      <div className="hint-block">
        <p>Les fiches Markdown au format Collector sont reconnues automatiquement : titre, lignes <code>Formation :</code>, <code>Module :</code>, <code>Leçon :</code>, <code>Organisme :</code>, <code>URL source :</code>, <code>Date de collecte :</code>, sections <code>## Résumé</code> et <code>## Concepts clés</code>.</p>
        <p>Par défaut, tout ce qui est importé est classé <strong>Interne uniquement</strong> et <strong>Droits inconnus</strong>, sauf pour un organisme du registre, dont les règles sont appliquées. Rien n'est envoyé sur internet : les fichiers sont lus dans votre navigateur.</p>
      </div>
      {report && (
        <div className={report.errors.length ? 'warnbox' : 'okbox'}>
          <p><strong>{report.added}</strong> ajoutée{report.added > 1 ? 's' : ''}{report.skipped ? `, ${report.skipped} déjà présente${report.skipped > 1 ? 's' : ''} (ignorée${report.skipped > 1 ? 's' : ''})` : ''}.</p>
          {report.errors.map(e => <p key={e}>{e}</p>)}
          {report.added > 0 && <button className="btn small" onClick={() => navigate('recherche')}>Voir dans la recherche</button>}
        </div>
      )}
    </div>
  );
}

export default function AddPage({ params, navigate }) {
  const resources = useStore(s => s.resources);
  const { upsertResource, deleteResource, showToast } = useStore.getState();
  const editing = params.id ? resources.find(r => r.id === params.id) : null;
  const [tab, setTab] = useState(params.tab === 'import' && !editing ? 'import' : 'form');

  if (params.id && !editing) {
    return <section className="empty"><h2>Ressource introuvable</h2><button className="btn" onClick={() => navigate('recherche')}>Retour à la recherche</button></section>;
  }

  return (
    <section className="page">
      <h2>{editing ? `Modifier ${editing.id}` : 'Ajouter au corpus'}</h2>
      {!editing && (
        <nav className="subtabs" role="tablist">
          <button role="tab" aria-selected={tab === 'form'} onClick={() => setTab('form')}>Saisir une ressource</button>
          <button role="tab" aria-selected={tab === 'import'} onClick={() => setTab('import')}>Importer des fichiers</button>
        </nav>
      )}
      {tab === 'import' && !editing ? <ImportPanel navigate={navigate} /> : (
        <ResourceForm
          key={editing?.id || params.title || 'new'}
          initial={editing}
          prefill={params.title ? { title: params.title, tags: params.title } : null}
          onCancel={() => navigate('recherche')}
          onDelete={editing ? () => { deleteResource(editing.id); showToast('Ressource supprimée'); navigate('recherche'); } : null}
          onSave={data => {
            // Une validation client ne couvre que l'extrait validé : s'il change, elle est à refaire.
            const invalidated = editing?.client === 'APPROVED_FOR_CLIENT_USE' && data.text.trim() !== editing.text.trim();
            const r = upsertResource(editing ? { ...editing, ...data, ...(invalidated ? { client: 'ELIGIBLE_FOR_REVIEW' } : {}) } : data);
            showToast(invalidated ? "L'extrait a changé : la validation client est à refaire (voir « À valider »)"
              : editing ? 'Modifications enregistrées' : `Ressource ${r.id} ajoutée`);
            navigate('recherche');
          }}
        />
      )}
    </section>
  );
}
