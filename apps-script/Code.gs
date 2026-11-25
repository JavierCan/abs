/**
 * abs<3 · Fase 5.4.1
 * Aplicación móvil y API de fecha oficial, semilla y desbloqueo mensual.
 *
 * La app cliente nunca decide cuántos meses están disponibles. Ese valor se
 * calcula aquí usando America/Merida y se guarda de forma idempotente.
 */

const ABS3_CONFIG = Object.freeze({
  API_VERSION: '5.4.1',
  TIME_ZONE: 'America/Merida',
  RELATION_START: '2026-03-15',
  FIRST_UNLOCK: '2026-04-15',
  FIRST_UNLOCK_YEAR: 2026,
  FIRST_UNLOCK_MONTH: 4,
  UNLOCK_DAY: 15,
  DEFAULT_SEED: 'a3f1c07d',
  SEED_PROPERTY: 'ABS3_SEED',
  MONTHS_PROPERTY: 'ABS3_UNLOCKED_MONTHS',
  UPDATED_PROPERTY: 'ABS3_UPDATED_AT',
  TOUCH_ICON_FILE_ID_PROPERTY: 'ABS3_TOUCH_ICON_180_FILE_ID',
  ICON_192_FILE_ID_PROPERTY: 'ABS3_TOUCH_ICON_192_FILE_ID',
  ICON_512_FILE_ID_PROPERTY: 'ABS3_TOUCH_ICON_512_FILE_ID'
});

/**
 * La URL limpia sirve la experiencia final. Los GET con action conservan la
 * API de diagnóstico y `?asset=manifest` sirve el manifiesto instalable.
 */
function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  if (String(p.asset || '').toLowerCase() === 'manifest') return manifestOutput_();
  if (p.action || p.api) return respond_(requestFromGet_(e));
  return renderApp_();
}

/**
 * POST de sincronización. El cliente debe enviarlo como text/plain para que
 * una PWA de otro origen no provoque una solicitud CORS preflight.
 */
function doPost(e) {
  try {
    return respond_(requestFromPost_(e));
  } catch (error) {
    return jsonOutput_(errorPayload_('INVALID_JSON', 'El cuerpo de la solicitud no es JSON válido.'));
  }
}

/** Puente privado usado por Index.html mediante google.script.run. */
function getClientState(lastSeenMonths) {
  return synchronizeState_(new Date(), normalizeMonth_(lastSeenMonths, 0));
}

function renderApp_() {
  const webAppUrl = ScriptApp.getService().getUrl();
  const template = HtmlService.createTemplateFromFile('Index');
  const iconAssets = getInstallIconAssets_();
  template.manifestUrl = webAppUrl + '?asset=manifest';
  template.touchIconUrl = iconAssets.appleTouchIcon;
  template.icon192Url = iconAssets.icon192;
  template.icon512Url = iconAssets.icon512;
  return template
    .evaluate()
    .setTitle('abs<3')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function manifestOutput_() {
  const webAppUrl = ScriptApp.getService().getUrl();
  return ContentService
    .createTextOutput(JSON.stringify(buildManifest_(webAppUrl, getInstallIconAssets_())))
    .setMimeType(ContentService.MimeType.JSON);
}

function respond_(request) {
  try {
    const action = String(request.action || 'state').toLowerCase();
    if (action === 'health') return jsonOutput_(healthState_(new Date()));
    if (action !== 'state' && action !== 'sync') {
      return jsonOutput_(errorPayload_('UNKNOWN_ACTION', 'Acción no reconocida.'));
    }

    const lastSeenMonths = normalizeMonth_(request.lastSeenMonths, 0);
    return jsonOutput_(synchronizeState_(new Date(), lastSeenMonths));
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonOutput_(errorPayload_('INTERNAL_ERROR', 'No se pudo sincronizar abs<3.'));
  }
}

function requestFromGet_(e) {
  const p = e && e.parameter ? e.parameter : {};
  return {
    action: p.action || 'state',
    lastSeenMonths: p.lastSeenMonths
  };
}

function requestFromPost_(e) {
  const p = e && e.parameter ? e.parameter : {};
  const raw = e && e.postData && e.postData.contents
    ? String(e.postData.contents).trim()
    : '';
  if (!raw) {
    return {
      action: p.action || 'sync',
      lastSeenMonths: p.lastSeenMonths
    };
  }
  try {
    const body = JSON.parse(raw);
    return {
      action: body.action || 'sync',
      lastSeenMonths: body.lastSeenMonths
    };
  } catch (error) {
    throw new Error('INVALID_JSON');
  }
}

/**
 * Inicialización manual opcional. La API también se inicializa sola en la
 * primera solicitud, por lo que olvidar este paso no rompe el despliegue.
 */
function setupAbs3() {
  const result = synchronizeState_(new Date(), 0);
  const icons = setupAbs3Assets();
  const payload = { state: result, icons };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

/** Diagnóstico útil desde el editor de Apps Script, sin aceptar fecha cliente. */
function getAbs3Diagnostics() {
  const result = synchronizeState_(new Date(), 0);
  const icons = getInstallIconAssets_();
  const payload = { state: result, icons };
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

function synchronizeState_(now, lastSeenMonths) {
  const parts = officialParts_(now);
  const eligibleMonths = eligibleMonthsForParts_(parts.year, parts.month, parts.day);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const properties = PropertiesService.getScriptProperties();
    let seed = properties.getProperty(ABS3_CONFIG.SEED_PROPERTY);
    if (!seed) seed = ABS3_CONFIG.DEFAULT_SEED;

    const storedMonths = normalizeMonth_(
      properties.getProperty(ABS3_CONFIG.MONTHS_PROPERTY),
      0
    );
    // El estado solo avanza. Nunca se reduce por reloj, recarga o concurrencia.
    const unlockedMonths = Math.max(storedMonths, eligibleMonths);
    const newlyCommittedMonths = monthRange_(storedMonths + 1, unlockedMonths);
    const officialTimestamp = Utilities.formatDate(
      now,
      ABS3_CONFIG.TIME_ZONE,
      "yyyy-MM-dd'T'HH:mm:ssZ"
    );

    if (!properties.getProperty(ABS3_CONFIG.SEED_PROPERTY) || unlockedMonths !== storedMonths) {
      properties.setProperties({
        [ABS3_CONFIG.SEED_PROPERTY]: seed,
        [ABS3_CONFIG.MONTHS_PROPERTY]: String(unlockedMonths),
        [ABS3_CONFIG.UPDATED_PROPERTY]: officialTimestamp
      }, false);
    }

    const next = nextUnlockForParts_(parts.year, parts.month, parts.day);
    const safeLastSeen = Math.min(normalizeMonth_(lastSeenMonths, 0), unlockedMonths);
    return {
      ok: true,
      source: 'apps-script',
      apiVersion: ABS3_CONFIG.API_VERSION,
      timeZone: ABS3_CONFIG.TIME_ZONE,
      officialDate: parts.ymd,
      officialTimestamp,
      relationStart: ABS3_CONFIG.RELATION_START,
      firstUnlockDate: ABS3_CONFIG.FIRST_UNLOCK,
      unlockDay: ABS3_CONFIG.UNLOCK_DAY,
      unlockToday: eligibleMonths > 0 && parts.day === ABS3_CONFIG.UNLOCK_DAY,
      seed,
      eligibleMonths,
      unlockedMonths,
      newlyCommittedMonths,
      newMonths: monthRange_(safeLastSeen + 1, unlockedMonths),
      nextUnlockDate: next.date,
      nextUnlockMonth: unlockedMonths + 1,
      cacheKey: seed + ':' + unlockedMonths
    };
  } finally {
    lock.releaseLock();
  }
}

function healthState_(now) {
  const parts = officialParts_(now);
  return {
    ok: true,
    source: 'apps-script',
    apiVersion: ABS3_CONFIG.API_VERSION,
    timeZone: ABS3_CONFIG.TIME_ZONE,
    officialDate: parts.ymd
  };
}

function officialParts_(date) {
  const ymd = Utilities.formatDate(date, ABS3_CONFIG.TIME_ZONE, 'yyyy-MM-dd');
  const values = ymd.split('-').map(Number);
  return { year: values[0], month: values[1], day: values[2], ymd };
}

/** Función pura: abril de 2026 es el mes 1 y cada día 15 suma uno. */
function eligibleMonthsForParts_(year, month, day) {
  if (year < ABS3_CONFIG.FIRST_UNLOCK_YEAR) return 0;
  if (year === ABS3_CONFIG.FIRST_UNLOCK_YEAR && month < ABS3_CONFIG.FIRST_UNLOCK_MONTH) return 0;
  if (
    year === ABS3_CONFIG.FIRST_UNLOCK_YEAR &&
    month === ABS3_CONFIG.FIRST_UNLOCK_MONTH &&
    day < ABS3_CONFIG.UNLOCK_DAY
  ) return 0;

  const elapsedCalendarMonths =
    (year - ABS3_CONFIG.FIRST_UNLOCK_YEAR) * 12 +
    (month - ABS3_CONFIG.FIRST_UNLOCK_MONTH);
  return Math.max(0, elapsedCalendarMonths + (day >= ABS3_CONFIG.UNLOCK_DAY ? 1 : 0));
}

/** Función pura: calcula el próximo día 15 sin depender de la zona del cliente. */
function nextUnlockForParts_(year, month, day) {
  if (eligibleMonthsForParts_(year, month, day) === 0) {
    return { date: ABS3_CONFIG.FIRST_UNLOCK };
  }
  let nextYear = year;
  let nextMonth = month;
  if (day >= ABS3_CONFIG.UNLOCK_DAY) {
    nextMonth += 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear += 1;
    }
  }
  return { date: ymd_(nextYear, nextMonth, ABS3_CONFIG.UNLOCK_DAY) };
}

function ymd_(year, month, day) {
  return [year, pad2_(month), pad2_(day)].join('-');
}

function pad2_(value) {
  return String(value).padStart(2, '0');
}

function normalizeMonth_(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function monthRange_(start, end) {
  const values = [];
  for (let month = start; month <= end; month += 1) values.push(month);
  return values;
}

function errorPayload_(code, message) {
  return {
    ok: false,
    source: 'apps-script',
    apiVersion: ABS3_CONFIG.API_VERSION,
    error: { code, message }
  };
}


function setupAbs3Assets() {
  const assets = publishInstallIconAssets_();
  console.log(JSON.stringify(assets, null, 2));
  return assets;
}

function getInstallIconAssets_() {
  const stored = readStoredInstallIconAssets_();
  return {
    appleTouchIcon: stored.appleTouchIcon || ABS3_INLINE_ASSETS_.appleTouchIcon,
    icon192: stored.icon192 || ABS3_INLINE_ASSETS_.icon192,
    icon512: stored.icon512 || ABS3_INLINE_ASSETS_.icon512
  };
}

function readStoredInstallIconAssets_() {
  const props = PropertiesService.getScriptProperties();
  return {
    appleTouchIcon: buildDriveDirectUrl_(props.getProperty(ABS3_CONFIG.TOUCH_ICON_FILE_ID_PROPERTY), 180),
    icon192: buildDriveDirectUrl_(props.getProperty(ABS3_CONFIG.ICON_192_FILE_ID_PROPERTY), 192),
    icon512: buildDriveDirectUrl_(props.getProperty(ABS3_CONFIG.ICON_512_FILE_ID_PROPERTY), 512)
  };
}

function publishInstallIconAssets_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const props = PropertiesService.getScriptProperties();
    const published = {
      appleTouchIcon: ensureDrivePngAsset_(props, ABS3_CONFIG.TOUCH_ICON_FILE_ID_PROPERTY, ABS3_ICON_BASE64_180, 'abs3-touch-icon-180.png', 180),
      icon192: ensureDrivePngAsset_(props, ABS3_CONFIG.ICON_192_FILE_ID_PROPERTY, ABS3_ICON_BASE64_192, 'abs3-icon-192.png', 192),
      icon512: ensureDrivePngAsset_(props, ABS3_CONFIG.ICON_512_FILE_ID_PROPERTY, ABS3_ICON_BASE64_512, 'abs3-icon-512.png', 512)
    };
    return published;
  } finally {
    lock.releaseLock();
  }
}

function ensureDrivePngAsset_(properties, propertyName, base64Value, fileName, sizeHint) {
  let fileId = properties.getProperty(propertyName);
  let file = null;
  if (fileId) {
    try {
      file = DriveApp.getFileById(fileId);
    } catch (_) {
      file = null;
    }
  }

  if (!file) {
    const bytes = Utilities.base64Decode(base64Value);
    const blob = Utilities.newBlob(bytes, 'image/png', fileName);
    file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    fileId = file.getId();
    properties.setProperty(propertyName, fileId);
  } else {
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  }

  return buildDriveDirectUrl_(fileId, sizeHint);
}

function buildDriveDirectUrl_(fileId, sizeHint) {
  if (!fileId) return '';
  const size = Number(sizeHint) || 0;
  return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId) + (size ? '&sz=w' + size : '');
}

function jsonOutput_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
