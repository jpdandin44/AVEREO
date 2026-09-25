import { AUTHORITIES, CLIENT, RIGHTS, SOURCE_REGISTRY, registryFor } from '../config/referentiels.js';
import { useStore } from '../hooks/useStore.js';

export default function RegistryPage() {
  const resources = useStore(s => s.resources);
  const countFor = org => resources.filter(r => registryFor(r.src.org)?.org === org).length;

  return (
    <section className="page">
      <h2>Registre des sources de référence</h2>
      <p className="lead">
        Les règles ci-dessous s'appliquent automatiquement quand vous saisissez ou importez une ressource de ces organismes.
        Pour une question de seuil ou de réglementation, les textes officiels puis les sources institutionnelles passent devant les supports de formation.
        Les droits réels se vérifient toujours document par document.
      </p>
      <div className="tbl">
        <table>
          <thead><tr><th>Organisme</th><th>Publications utiles</th><th>Autorité</th><th>Droits par défaut</th><th>Usage client par défaut</th><th>Règle</th><th>Dans le corpus</th></tr></thead>
          <tbody>
            {SOURCE_REGISTRY.map(r => (
              <tr key={r.id}>
                <td><strong>{r.org}</strong>{r.site && <><br /><a href={r.site} target="_blank" rel="noopener noreferrer">{r.site.replace(/^https?:\/\/(www\.)?/, '')}</a></>}</td>
                <td>{r.publications}</td>
                <td>{AUTHORITIES[r.authority].label}</td>
                <td>{RIGHTS[r.rights].label}</td>
                <td>{CLIENT[r.client].label}</td>
                <td>{r.rule}</td>
                <td className="num">{countFor(r.org)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint">Collecte en V0 : téléchargez les PDF depuis le site de l'organisme, déposez-les dans <code>GED_AVEREO/00_INBOX</code>, puis saisissez ici l'extrait utile avec sa page. La veille automatique des nouvelles publications est prévue en V2.</p>
    </section>
  );
}
