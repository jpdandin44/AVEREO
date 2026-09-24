import { AUTHORITIES, CLIENT, CONFIDENCE, RIGHTS } from '../config/referentiels.js';

export function Badge({ tone = 'neutral', children, title }) {
  return <span className={`badge b-${tone}`} title={title}>{children}</span>;
}

export function ResourceBadges({ r }) {
  const auth = AUTHORITIES[r.authority];
  return (
    <div className="badges">
      {auth?.badge && <Badge tone="auth">{auth.label}</Badge>}
      <Badge tone={RIGHTS[r.rights].tone} title="Droits (rights_status)">{RIGHTS[r.rights].label}</Badge>
      <Badge tone={CLIENT[r.client].tone} title="Usage client (client_reuse_status)">{CLIENT[r.client].label}</Badge>
      <Badge tone="neutral">{CONFIDENCE[r.conf].label}</Badge>
      {r.need && <Badge tone="info">{r.need}</Badge>}
      {r.demo && <Badge tone="warn">Exemple</Badge>}
    </div>
  );
}
