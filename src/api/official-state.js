export const ABS3_API_STORAGE = Object.freeze({
  url: 'abs3.api.url',
  lastMonths: 'abs3.api.lastMonths',
  seed: 'abs3.api.seed',
  officialDate: 'abs3.api.officialDate'
});

/** Acepta únicamente implementaciones HTTPS oficiales de Apps Script. */
export function normalizeApiUrl(value) {
  const url = new URL(String(value || '').trim());
  const validPath = /^\/macros\/s\/[^/]+\/(exec|dev)$/.test(url.pathname);
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || !validPath) {
    throw new Error('Usa la URL HTTPS de Apps Script terminada en /exec.');
  }
  url.search = '';
  url.hash = '';
  return url.toString();
}

export function validateOfficialState(payload) {
  if (!payload || payload.ok !== true) {
    const message = payload?.error?.message || 'La API no devolvió un estado válido.';
    throw new Error(message);
  }
  if (payload.timeZone !== 'America/Merida') {
    throw new Error('La API no está configurada en America/Merida.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(payload.officialDate || ''))) {
    throw new Error('La fecha oficial tiene un formato inválido.');
  }
  const unlockedMonths = Number(payload.unlockedMonths);
  if (!Number.isInteger(unlockedMonths) || unlockedMonths < 0) {
    throw new Error('El número de meses desbloqueados es inválido.');
  }
  const seed = String(payload.seed || '');
  if (!seed || seed.length > 128) throw new Error('La semilla oficial es inválida.');

  const newMonths = Array.isArray(payload.newMonths)
    ? payload.newMonths.filter((month) => Number.isInteger(month) && month > 0 && month <= unlockedMonths)
    : [];
  return Object.freeze({ ...payload, seed, unlockedMonths, newMonths });
}

export async function fetchOfficialState(apiUrl, lastSeenMonths = 0, fetchImpl = fetch) {
  const url = normalizeApiUrl(apiUrl);
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), 15000) : null;
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'sync',
        lastSeenMonths: Math.max(0, Math.floor(Number(lastSeenMonths) || 0))
      }),
      redirect: 'follow',
      cache: 'no-store',
      signal: controller?.signal
    });
    if (!response.ok) throw new Error(`Apps Script respondió ${response.status}.`);
    return validateOfficialState(await response.json());
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Apps Script tardó demasiado en responder.');
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function loadApiSettings(storage = globalThis.localStorage) {
  try {
    const url = storage?.getItem(ABS3_API_STORAGE.url) || '';
    const rawMonths = storage?.getItem(ABS3_API_STORAGE.lastMonths);
    const lastMonths = rawMonths == null ? null : Math.max(0, Math.floor(Number(rawMonths) || 0));
    return {
      url,
      lastMonths,
      seed: storage?.getItem(ABS3_API_STORAGE.seed) || '',
      officialDate: storage?.getItem(ABS3_API_STORAGE.officialDate) || ''
    };
  } catch (error) {
    return { url: '', lastMonths: null, seed: '', officialDate: '' };
  }
}

export function saveApiSettings(state, apiUrl, storage = globalThis.localStorage) {
  try {
    storage?.setItem(ABS3_API_STORAGE.url, normalizeApiUrl(apiUrl));
    storage?.setItem(ABS3_API_STORAGE.lastMonths, String(state.unlockedMonths));
    storage?.setItem(ABS3_API_STORAGE.seed, state.seed);
    storage?.setItem(ABS3_API_STORAGE.officialDate, state.officialDate);
    return true;
  } catch (error) {
    return false;
  }
}
