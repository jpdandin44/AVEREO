import { requireReportContent, requireEditableNumbers, verifyCompleteDownload } from '../reportFiles.js';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const OAUTH_ATTEMPT_KEY = 'avereo-rapport-oauth-attempt';

async function request(path, { token = '', body, method = 'GET', signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.ok) {
    const error = new Error(payload?.message || `Erreur API (${response.status}).`);
    error.status = response.status;
    error.code = payload?.error || 'api_error';
    if (/^[a-f0-9]{32}$/.test(payload?.reportId || '')) error.reportId = payload.reportId;
    throw error;
  }
  return payload;
}

function base64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomValue(size = 32) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

export async function getAuthConfig() {
  const payload = await request('auth.php?action=config');
  return payload.auth;
}

export async function startOAuthLogin(config) {
  if (!config?.configured || !config.authorizeUrl || !config.clientId || !config.redirectUri) {
    throw new Error("La configuration OAuth n'est pas complete.");
  }

  const verifier = randomValue(48);
  const state = randomValue(24);
  const challenge = base64Url(await sha256(verifier));
  sessionStorage.setItem(OAUTH_ATTEMPT_KEY, JSON.stringify({ verifier, state, redirectUri: config.redirectUri }));

  const url = new URL(config.authorizeUrl);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', config.redirectUri);
  url.searchParams.set('scope', config.scope || 'openid profile email');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  window.location.assign(url.toString());
}

export async function completeOAuthLogin() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  if (!code) return null;

  const rawAttempt = sessionStorage.getItem(OAUTH_ATTEMPT_KEY);
  sessionStorage.removeItem(OAUTH_ATTEMPT_KEY);
  if (!rawAttempt) throw new Error('Tentative OAuth locale introuvable ou expiree.');

  const attempt = JSON.parse(rawAttempt);
  if (!returnedState || returnedState !== attempt.state) {
    throw new Error('Etat OAuth invalide.');
  }

  const payload = await request('auth.php?action=token', {
    method: 'POST',
    body: {
      code,
      codeVerifier: attempt.verifier,
      redirectUri: attempt.redirectUri,
    },
  });

  window.history.replaceState({}, document.title, window.location.pathname);
  return payload.token?.accessToken || null;
}

export async function getCurrentUser(token) {
  const payload = await request('auth.php?action=me', { token });
  return payload.user;
}

export async function saveOnlineReport(report, token, id = '', { signal } = {}) {
  const payload = await request('reports.php', {
    method: 'POST',
    token,
    body: { id, report },
    signal,
  });
  return payload.report;
}

export async function listOnlineReports(token, options = {}) {
  return (await onlineReportPage(token, options)).reports || [];
}

export async function onlineReportPage(token, { limit = 50, query = '', signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (query.trim()) params.set('q', query.trim());
  return request('reports.php?' + params, { token, signal });
}

export async function listOrganizationExports(reference, signal) {
  const result = await request('exports.php?' + new URLSearchParams({ reference }), { signal });
  return result.reports;
}

export async function downloadOrganizationReport(id, purpose) {
  const response = await fetch(`${API_BASE_URL}/exports.php`, {
    method: 'POST', credentials: 'same-origin', redirect: 'error',
    headers: { 'Content-Type': 'application/json', 'X-Avereo-Export': '1' },
    body: JSON.stringify({ id, purpose }),
  });
  if (!response.ok || !response.headers.get('Content-Disposition')?.startsWith('attachment;')) {
    throw new Error('Export refusé ou dossier indisponible.');
  }
  return response.blob();
}

export async function loadOnlineReport(id, token, { signal } = {}) {
  const payload = await request(`reports.php?id=${encodeURIComponent(id)}`, { token, signal });
  requireReportContent(payload.report?.payload);
  requireEditableNumbers(payload.report.payload);
  return payload.report;
}

export async function downloadOnlineReport(id, token, { signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}/reports.php?${new URLSearchParams({ id, download: '1' })}`, {
    credentials: 'same-origin', redirect: 'error', signal, headers,
  });
  return verifyCompleteDownload(response);
}
