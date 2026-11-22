export const REPORT_ACTIONS = ['read', 'create', 'update', 'delete', 'export'];

export function canReportAction(user, action) {
  const access = user?.profileAccess;
  return !access?.managed || (Array.isArray(access.actions) && access.actions.includes(action));
}

export function sameAccount(first, second) {
  return Boolean(first && second && first.provider === second.provider && String(first.id) === String(second.id));
}

export function administeredMissionDefault(user) {
  const profile = user?.profileAccess?.profile;
  if (user?.provider !== 'avereo_connect' || !/^[1-9]\d*$/.test(String(user?.id || '')) || !user.profileAccess?.managed
      || !['habitologue', 'architecte', 'maitre_oeuvre'].includes(profile?.template)) return null;
  return { profile: profile.template,
    notice: `Le parcours du profil administré ${profile.name} a été proposé à la création. Vous pouvez adapter le profil de cette mission dans Dossier.` };
}
