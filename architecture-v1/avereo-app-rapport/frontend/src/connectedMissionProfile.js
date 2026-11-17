import { recognizedMissionProfile, missionProfileLabel } from './reportProfiles.js';

export async function readConnectedMissionProfile({ portal, user, fetchImpl = fetch, timeoutMs = 2500 }) {
  if (user?.provider !== 'avereo_connect' || !/^[1-9]\d*$/.test(String(user?.id || '')) || !portal) {
    return { profile: '', notice: 'Choisissez le profil de cette mission dans Dossier.' };
  }
  // portal comes exclusively from the shared account menu's validated public portal getter.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(portal + '/api/v1/me/preferences?application=rapport', {
      credentials: 'include', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal,
    });
    if (!response.ok) throw Error('Preferences unavailable');
    const { data } = await response.json();
    if (String(data?.accountId) !== String(user.id) || (data?.professionalProfile !== '' && !recognizedMissionProfile(data?.professionalProfile))) {
      throw Error('Different account or unsupported profile');
    }
    const assigned = data.accessProfile?.active === true && recognizedMissionProfile(data.accessProfile?.template) ? data.accessProfile : null;
    const profile = data.professionalProfile || assigned?.template || '';
    const label = data.professionalProfile ? missionProfileLabel({ profil_metier: profile }) : assigned?.name;
    return { profile, notice: profile
      ? `Le profil ${label} de votre compte CONNECT a été proposé à la création. Vous pouvez adapter le profil de cette mission dans Dossier.`
      : 'Aucun profil professionnel par défaut dans CONNECT. Choisissez le profil de cette mission dans Dossier.' };
  } catch {
    return { profile: '', notice: 'Le profil CONNECT n’a pas pu être repris. Choisissez le profil de cette mission dans Dossier ; vos autres dossiers sont conservés.' };
  } finally { clearTimeout(timer); }
}
