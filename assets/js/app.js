// ═══ CLIENT CONFIG ═════════════════════════════════════════
const PORTAL_CONFIG = window.LEGACY_PORTAL_CONFIG || {};
const CLIENT_NAME = PORTAL_CONFIG.clientName || 'Nouveau Client';
const CLIENT_SLUG = PORTAL_CONFIG.clientSlug || CLIENT_NAME.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';
const COACH_NAME = PORTAL_CONFIG.coachName || 'Coach';
const BRAND_NAME = PORTAL_CONFIG.brandName || 'Father Empowering';
const PROGRAM_TITLE = PORTAL_CONFIG.programTitle || 'Legacy Protocol';
const PROGRAM_SUBTITLE = PORTAL_CONFIG.programSubtitle || '100 jours';
const APP_VERSION = PORTAL_CONFIG.appVersion || 'Generic V1';
const BRAND = PORTAL_CONFIG.brand || {};
const COPY = PORTAL_CONFIG.copy || {};

function cfgText(key, fallback) {
  return COPY && COPY[key] ? COPY[key] : fallback;
}

function getCoachShortName() {
  return String(COACH_NAME).split(/\s+/)[0] || COACH_NAME;
}

function getProgramWeekCount() {
  const configured = Number(PORTAL_CONFIG.weekCount || 0);
  if(configured > 0) return configured;
  const weekNums = Object.keys(WEEKS || {}).map(Number).filter(Number.isFinite);
  return weekNums.length ? Math.max(...weekNums) : 12;
}

async function applyPortalConfig() {
  document.title = PROGRAM_TITLE + ' - ' + CLIENT_NAME;
  const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if(appleTitle) appleTitle.setAttribute('content', PROGRAM_TITLE);
  const theme = document.querySelector('meta[name="theme-color"]');
  if(theme && BRAND.themeColor) theme.setAttribute('content', BRAND.themeColor);

  const colors = BRAND.colors || {};
  const root = document.documentElement;
  Object.keys(colors).forEach(key => root.style.setProperty('--' + key, colors[key]));

  const iconLinks = [
    ['link[rel="apple-touch-icon"]', BRAND.appleTouchIcon],
    ['link[rel="icon"][sizes="32x32"]', BRAND.favicon32],
    ['link[rel="icon"][sizes="16x16"]', BRAND.favicon16],
    ['link[rel="manifest"]', BRAND.manifest]
  ];
  iconLinks.forEach(([selector, href]) => {
    const el = document.querySelector(selector);
    if(el && href) el.setAttribute('href', href);
  });

  const headerProtocol = document.querySelector('.hdr-protocol');
  if(headerProtocol) headerProtocol.textContent = cfgText('homeProtocol', (PROGRAM_TITLE + ' - ' + PROGRAM_SUBTITLE).toUpperCase());
  const headerName = document.getElementById('hdr-name');
  if(headerName) headerName.textContent = CLIENT_NAME.toUpperCase();
  const logo = document.querySelector('#faem-logo-wrap img');
  if(logo && BRAND.logoSrc) {
    logo.src = BRAND.logoSrc;
    logo.alt = BRAND_NAME + ' logo';
  }
  const weekSig = document.querySelector('.week-msg-sig');
  if(weekSig) weekSig.textContent = '-- ' + getCoachShortName();

  const reportSub = document.querySelector('.report-btn-sub');
  if(reportSub) reportSub.textContent = cfgText('sendCheckinSub', 'Sauvegarde, deverrouille la semaine suivante et envoie au coach');

  await loadNutritionPanel();
}

async function loadNutritionPanel() {
  const nutrition = document.getElementById('panel-nutrition');
  if(!nutrition) return;
  if(PORTAL_CONFIG.nutritionHtml) {
    nutrition.innerHTML = PORTAL_CONFIG.nutritionHtml;
    return;
  }
  const source = nutrition.getAttribute('data-nutrition-source');
  if(!source || nutrition.dataset.loaded === 'true') return;
  try {
    const response = await fetch(source, { cache: 'no-cache' });
    if(!response.ok) throw new Error('HTTP ' + response.status);
    nutrition.innerHTML = await response.text();
    nutrition.dataset.loaded = 'true';
  } catch(e) {
    nutrition.innerHTML = `<div class="card"><div class="card-hdr"><div class="cdot" style="background:var(--orange)"></div><div class="ctitle">Nutrition</div></div><div style="padding:16px;color:var(--txt2);line-height:1.7">Le plan nutrition n'a pas pu etre charge. Verifiez le fichier assets/data/nutrition.html.</div></div>`;
    console.warn('Nutrition load failed:', e);
  }
}

// ═══ STORAGE KEY ═══════════════════════════════════════════
const SK = PORTAL_CONFIG.storageKey || 'faem_client_template_v1';

// ═══ PRELOAD (only if fresh install) ══════════════════════
const DEFAULT_PRELOAD = { seances: {}, checkins: [], photos: {} };
const PRELOAD = PORTAL_CONFIG.preloadData || DEFAULT_PRELOAD;

// ═══ LOAD / SAVE ═══════════════════════════════════════════
function load() {
  try {
    const raw = localStorage.getItem(SK);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return JSON.parse(JSON.stringify(PRELOAD));
}
function save() {
  try {
    localStorage.setItem(SK, JSON.stringify(D));
    return true;
  } catch(e) {
    console.warn('Save failed:', e);
    showSaveError();
    return false;
  }
}

function showSaveError() {
  let toast = document.getElementById('save-error-toast');
  if(!toast) {
    toast = document.createElement('div');
    toast.id = 'save-error-toast';
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#c0392b;color:#fff;padding:12px 20px;border-radius:10px;font-size:12px;font-family:"DM Sans",sans-serif;text-align:center;z-index:999;max-width:320px;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.4);display:none';
    document.body.appendChild(toast);
  }
  toast.textContent = 'Sauvegarde impossible: espace local plein. Exportez vos données ou supprimez des photos.';
  toast.style.display = 'block';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 6000);
}

// ═══ INDEXEDDB — STOCKAGE PHOTOS ═══════════════════════════
const IDB_NAME = PORTAL_CONFIG.photoDbName || (SK + '_photos_v1');
const IDB_STORE = 'photos';
let _idb = null;

function openIDB() {
  return new Promise((resolve, reject) => {
    if(_idb) { resolve(_idb); return; }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = e => { _idb = e.target.result; resolve(_idb); };
    req.onerror = e => reject(e.target.error);
  });
}

async function idbPut(key, value) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = e => reject(e.target.error);
  });
}

async function idbGet(key) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = e => reject(e.target.error);
  });
}

async function idbClearAll() {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = e => reject(e.target.error);
    });
  } catch(e) { console.warn('IDB clear failed:', e); }
}
let D = load();

async function migrateLegacyPhotosToIDB() {
  if(!D.photos || typeof D.photos !== 'object') return;
  let changed = false;
  const weeks = Object.keys(D.photos);
  for(const weekSlot of weeks) {
    const slots = D.photos[weekSlot];
    if(!slots || typeof slots !== 'object') continue;
    for(const slot of Object.keys(slots)) {
      const value = slots[slot];
      const legacyData = typeof value === 'string' && value.indexOf('data:image/') === 0;
      if(!legacyData) continue;
      const photoKey = 'photo_' + weekSlot + '_' + slot;
      try {
        await idbPut(photoKey, value);
        D.photos[weekSlot][slot] = photoKey;
        changed = true;
      } catch(e) {
        console.warn('Photo migration failed:', e);
      }
    }
  }
  if(changed) save();
}

// ═══ SAFE DATE / DATA HELPERS ═════════════════════════════
function localDateString(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function parseLocalDate(dateStr) {
  if(typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function daysBetweenDates(a, b) {
  return Math.floor((parseLocalDate(a) - parseLocalDate(b)) / 86400000);
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if(!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function hasChartLibrary() {
  return typeof Chart !== 'undefined';
}

let WEEKS = PORTAL_CONFIG.programWeeks || window.LEGACY_WEEKS || {};

// ═══ STATE ═════════════════════════════════════════════════
let currentWeek = 1;
let currentSeanceId = 'a';
let currentNutriPlan = 'plan1';
let timerInterval = null;
let timerSeconds = 0;
let curSlot = 0;
let hwChart = null, wChart = null, cChart = null, bChart = null;

// ═══ ACTIVE WEEK (basé sur check-ins) ══════════════════════
function getActiveWeek() {
  const n = (D.checkins || []).length;
  return Math.min(n + 1, getProgramWeekCount());
}

// ═══ CLOCK ═════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2,'0');
  const m = String(now.getMinutes()).padStart(2,'0');
  const s = String(now.getSeconds()).padStart(2,'0');
  const el = document.getElementById('clock');
  if(el) el.textContent = h + ':' + m + ':' + s;
  const days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const de = document.getElementById('clock-date');
  if(de) de.textContent = days[now.getDay()] + ' ' + now.getDate() + ' ' + months[now.getMonth()];
}
setInterval(updateClock, 1000);
updateClock();

// ═══ NAVIGATION ════════════════════════════════════════════
function showPanel(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if(panel) panel.classList.add('active');
  if(btn) btn.classList.add('active');
  if(id === 'entrainement') {
    // Keep currentWeek if already set, else default to active week
    if(!currentWeek) currentWeek = getActiveWeek();
    renderEntrainementWeek();
  }
  if(id === 'accueil') {
    updateHomeStats(); // Always reflect currentWeek when returning home
    updateStatus();
  }
  if(id === 'progression') renderCharts();
  if(id === 'historique') renderHistorique();
  if(id === 'accueil') updateHomeStats();
}

function showSeance(id, btn) {
  currentSeanceId = id;
  // FIX: scope to panel-entrainement only — prevents wiping nutrition sub-panels
  const entPanel = document.getElementById('panel-entrainement');
  if(entPanel) {
    entPanel.querySelectorAll('.sub-btn').forEach(b => b.classList.remove('active'));
    entPanel.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
  }
  if(btn) btn.classList.add('active');
  const panel = document.getElementById('sub-' + id);
  if(panel) panel.classList.add('active');
}

function showNutriPlan(plan, btn) {
  // Switch between Plan 1 and Plan 2
  document.querySelectorAll('#panel-nutrition > .sub-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#panel-nutrition > .sub-nav .sub-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById('nutri-' + plan);
  if(target) target.classList.add('active');
  if(btn) btn.classList.add('active');
  // Reset to first day of the selected plan
  const prefix = plan === 'plan2' ? 'p2' : 'p1';
  document.querySelectorAll('#nutri-' + plan + ' .sub-panel').forEach(p => p.classList.remove('active'));
  const firstPanel = document.getElementById('nutri-' + prefix + '-dim');
  if(firstPanel) firstPanel.classList.add('active');
  document.querySelectorAll('#nutri-' + plan + ' .sub-nav .sub-btn').forEach(b => b.classList.remove('active'));
  const firstBtn = document.querySelector('#nutri-' + plan + ' .sub-nav .sub-btn');
  if(firstBtn) firstBtn.classList.add('active');
}

function showNutri(id, btn, plan) {
  const prefix = (plan === 'plan2') ? 'p2' : 'p1';
  const container = document.getElementById('nutri-' + plan);
  if(!container) return;
  container.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
  container.querySelectorAll('.sub-nav .sub-btn').forEach(b => b.classList.remove('active'));
  const target = document.getElementById('nutri-' + prefix + '-' + id);
  if(target) target.classList.add('active');
  if(btn) btn.classList.add('active');
}

// ═══ WEEK NAV BUILD ═════════════════════════════════════════
function buildWeekNav() {
  const nav = document.getElementById('week-nav-entrainement');
  if(!nav) return;
  const activeW = getActiveWeek();
  nav.innerHTML = '';
  for(let w = 1; w <= getProgramWeekCount(); w++) {
    const isUnlocked = w <= activeW;
    const btn = document.createElement('button');
    btn.className = 'week-nav-btn' + (w === currentWeek ? ' active' : '');
    const lockIcon = isUnlocked ? '' : '<span class="lock-icon">🔒</span>';
    btn.innerHTML = 'S' + w + lockIcon;
    const ww = w;
    btn.addEventListener('click', () => {
      if(!isUnlocked) { alert('Complète le check-in de la semaine ' + (ww-1) + ' pour déverrouiller.'); return; }
      currentWeek = ww;
      document.querySelectorAll('.week-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderEntrainementWeek();
      updateHomeStats(); // Sync accueil with selected week
      updateStatus();    // Sync status indicators
    });
    nav.appendChild(btn);
  }
}

// ═══ SEANCE HTML BUILDER ═══════════════════════════════════
function getPreviousExerciseValue(weekNum, seanceId, key) {
  if(!key) return null;
  for(let w = weekNum - 1; w >= 1; w--) {
    if(!WEEKS[w]) continue;
    const wk = WEEKS[w].seancesKey;
    const record = D.seances && D.seances[wk + '_' + seanceId];
    const value = record && record.charges ? record.charges[key] : null;
    if(value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function getExerciseTarget(ex, weekNum, seanceId) {
  const previous = getPreviousExerciseValue(weekNum, seanceId, ex.key);
  if(previous) return 'Base: ' + previous + ' ' + (ex.unit || 'lbs');
  return ex.target || '';
}

function formatExerciseBadge(ex) {
  return String(ex.sets) + 'x' + String(ex.reps);
}

function buildExCard(exs, weekNum, seanceId) {
  let h = `<div class="ex-card">
    <div class="ex-thead">
      <div class="ex-th" style="text-align:left">EXERCICE</div>
      <div class="ex-th">SÉR</div><div class="ex-th">REP</div>
      <div class="ex-th">CIBLE</div><div class="ex-th">RÉEL</div>
    </div>`;
  exs.forEach(ex => {
    const repsStr = String(ex.reps);
    const numericReps = /^\d+(\.\d+)?$/.test(repsStr);
    const repsHtml = numericReps
      ? `<input class="ex-editable-rep" type="number" value="${ex.reps}" min="1" max="120" data-field="reps">`
      : `<div style="font-size:10px;color:var(--txt2);text-align:center;padding:4px 2px">${ex.reps}</div>`;
    const target = getExerciseTarget(ex, weekNum, seanceId);
    const targetHtml = target
      ? `<div class="ex-target">${target}</div>`
      : `<div class="ex-target" style="opacity:0.4">—</div>`;
    const inputHtml = ex.key
      ? `<div class="ex-input-wrap"><input class="ex-input" type="number" placeholder="—" data-key="${ex.key}"></div>`
      : `<div class="ex-input-wrap disabled"><input class="ex-input" placeholder="—" disabled></div>`;
    h += `<div class="ex-row">
      <div>
        <div class="ex-name">${ex.name}</div>
        ${ex.note ? `<div class="ex-note">${ex.note}</div>` : ''}
      </div>
      <div><input class="ex-editable" type="number" value="${ex.sets}" min="1" max="9" data-field="sets"></div>
      <div>${repsHtml}</div>
      ${targetHtml}
      ${inputHtml}
    </div>`;
  });
  return h + '</div>';
}

function buildFinisherCard(fin, weekNum, seanceId) {
  let h = `<div class="finisher-card">`;
  fin.exs.forEach(ex => {
    const target = getExerciseTarget(ex, weekNum, seanceId);
    const inputHtml = ex.key
      ? `<div class="ex-input-wrap" style="width:72px"><input class="ex-input" type="number" placeholder="lbs" data-key="${ex.key}"></div>`
      : '';
    const timerHtml = (ex.unit === 'sec' || ex.unit === 'min')
      ? `<button class="timer-btn" onclick="startTimer(${ex.unit==='sec'?parseInt(ex.target)||60:60},'${ex.name}')">⏱</button>`
      : '';
    h += `<div class="fin-row">
      <div>
        <div class="fin-name">${ex.name}</div>
        ${ex.note ? `<div class="fin-note">${ex.note}</div>` : ''}
        ${target ? `<div class="fin-note">Cible: ${target}</div>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="fin-badge">${formatExerciseBadge(ex)}</div>
        ${inputHtml}
        ${timerHtml}
      </div>
    </div>`;
  });
  return h + '</div>';
}

function buildTacxCard(seance) {
  let h = `<div class="finisher-card" style="margin:14px 14px 0">
    <div style="font-size:9px;letter-spacing:2px;color:rgba(255,255,255,0.65);font-weight:700;margin-bottom:10px;font-family:'Bebas Neue',sans-serif">${seance.tacxLabel}</div>`;
  seance.tacxRows.forEach(row => {
    h += `<div class="fin-row">
      <div>
        <div class="fin-name">${row.label}</div>
        <div class="fin-note">${row.desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <div class="fin-badge">${row.badge}</div>
        <button class="timer-btn" onclick="startTimer(${row.secs},'${row.label}')">⏱</button>
      </div>
    </div>`;
  });
  return h + '</div>';
}

function buildSeanceHTML(weekNum, seanceId) {
  const w = WEEKS[weekNum];
  if(!w) return '<div style="padding:20px;color:red">Semaine introuvable</div>';
  const s = w.seances[seanceId];
  if(!s) return '<div style="padding:20px;color:red">Seance introuvable</div>';
  const wk = w.seancesKey;
  let h = '';

  // Warmup
  h += `<div class="warmup">
    <div class="warmup-label">ÉCHAUFFEMENT — 5 À 10 MIN</div>
    <div class="warmup-txt">${s.warmup}</div>
  </div>`;

  if(s.isC) {
    // Tacx card
    h += buildTacxCard(s);
    // Circuit
    if(s.circuitExs && s.circuitExs.length) {
      h += `<div class="bloc-hdr"><div class="bloc-line"></div><div class="bloc-label">${s.circuitLabel}</div><div class="bloc-line"></div></div>`;
      h += buildExCard(s.circuitExs, weekNum, seanceId);
    }
  } else {
    // Regular blocs
    s.blocs.forEach(bloc => {
      h += `<div class="bloc-hdr"><div class="bloc-line"></div><div class="bloc-label">${bloc.label}</div><div class="bloc-line"></div></div>`;
      h += buildExCard(bloc.exs, weekNum, seanceId);
    });
  }

  // Finisher
  if(s.finisher && s.finisher.exs && s.finisher.exs.length) {
    h += `<div class="bloc-hdr"><div class="bloc-line"></div><div class="bloc-label" style="color:var(--orange)">${s.finisher.label}</div><div class="bloc-line"></div></div>`;
    h += buildFinisherCard(s.finisher, weekNum, seanceId);
  }

  // Notes + Save
  const savedDone = D.seances && D.seances[wk+'_'+seanceId] && D.seances[wk+'_'+seanceId].done;
  h += `<div class="notes-card">
    <div class="notes-label">NOTES — SÉANCE ${seanceId.toUpperCase()}</div>
    <textarea class="notes-area" id="notes-${seanceId}" placeholder="Comment tu te sens ? Charges, sensations..."></textarea>
  </div>`;
  h += `<button class="save-btn" id="savebtn-${seanceId}" onclick="saveSeance('${seanceId}')" style="${savedDone?'background:var(--green)':''}">
    <div class="save-btn-label">${savedDone ? '✓ SÉANCE ' + seanceId.toUpperCase() + ' COMPLÉTÉE' : 'SÉANCE ' + seanceId.toUpperCase() + ' COMPLÉTÉE'}</div>
  </button>`;
  h += '<div class="spacer"></div>';
  return h;
}

// ═══ RENDER WEEK (FIX: uses currentWeek) ═══════════════════
function renderEntrainementWeek() {
  const w = WEEKS[currentWeek];
  if(!w) return;
  // Update header
  const pEl = document.getElementById('ent-protocol');
  const tEl = document.getElementById('ent-title');
  const phEl = document.getElementById('ent-phase');
  const dEl = document.getElementById('ent-desc');
  if(pEl) pEl.textContent = w.protocol;
  if(tEl) tEl.textContent = w.label;
  if(phEl) phEl.textContent = w.phase;
  if(dEl) dEl.textContent = w.desc;
  // Build week nav
  buildWeekNav();
  // Build seance panels
  ['a','b','c'].forEach(id => {
    const panel = document.getElementById('sub-' + id);
    if(panel) {
      panel.innerHTML = buildSeanceHTML(currentWeek, id);
      restoreSeanceFields(currentWeek, id);
      wireSeanceInputs(id);
    }
  });
}

// ═══ RESTORE FIELDS (FIX: new function) ════════════════════
function restoreSeanceFields(weekNum, id) {
  const wk = WEEKS[weekNum] ? WEEKS[weekNum].seancesKey : 's1';
  const s = D.seances && D.seances[wk + '_' + id];
  if(!s) return;
  const panel = document.getElementById('sub-' + id);
  // Restore charge inputs
  if(s.charges) {
    Object.keys(s.charges).forEach(key => {
      const el = document.querySelector('#sub-' + id + ' [data-key="' + key + '"]');
      if(el) el.value = s.charges[key];
    });
  }
  if(panel && s.edits) {
    const rows = panel.querySelectorAll('.ex-row');
    Object.keys(s.edits).forEach(index => {
      const row = rows[parseInt(index, 10)];
      const edit = s.edits[index];
      if(!row || !edit) return;
      const setsEl = row.querySelector('[data-field="sets"]');
      const repsEl = row.querySelector('[data-field="reps"]');
      if(setsEl && edit.sets) setsEl.value = edit.sets;
      if(repsEl && edit.reps) repsEl.value = edit.reps;
    });
  }
  // Restore notes
  const notesEl = document.getElementById('notes-' + id);
  if(notesEl && s.notes) notesEl.value = s.notes;
}

function persistSeanceFields(panel, record) {
  if(!panel || !record) return;
  if(!record.charges) record.charges = {};
  panel.querySelectorAll('.ex-input[data-key]').forEach(el => {
    const val = String(el.value || '').trim();
    if(val) record.charges[el.dataset.key] = val;
    else delete record.charges[el.dataset.key];
  });

  const edits = {};
  panel.querySelectorAll('.ex-row').forEach((row, index) => {
    const rowEdit = {};
    const setsEl = row.querySelector('[data-field="sets"]');
    const repsEl = row.querySelector('[data-field="reps"]');
    if(setsEl && String(setsEl.value || '').trim()) rowEdit.sets = setsEl.value;
    if(repsEl && String(repsEl.value || '').trim()) rowEdit.reps = repsEl.value;
    if(Object.keys(rowEdit).length) edits[index] = rowEdit;
  });
  record.edits = edits;

  const notesEl = panel.querySelector('.notes-area');
  if(notesEl) record.notes = notesEl.value;
}

// ═══ WIRE AUTOSAVE (FIX: uses currentWeek) ═════════════════
function wireSeanceInputs(id) {
  const panel = document.getElementById('sub-' + id);
  if(!panel) return;
  panel.querySelectorAll('.ex-input, .ex-editable, .ex-editable-rep, .notes-area').forEach(el => {
    el.addEventListener('input', () => autosaveDraft(id));
  });
}

// ═══ AUTOSAVE DRAFT (FIX: uses currentWeek) ════════════════
function autosaveDraft(id) {
  const w = currentWeek; // FIX: was getActiveWeek()
  const wk = WEEKS[w] ? WEEKS[w].seancesKey : 's1';
  const key = wk + '_' + id;
  if(!D.seances) D.seances = {};
  if(!D.seances[key]) D.seances[key] = { done: false, charges: {}, notes: '' };
  const panel = document.getElementById('sub-' + id);
  persistSeanceFields(panel, D.seances[key]);
  save();
}

// ═══ SAVE SEANCE (FIX: uses currentWeek) ═══════════════════
function saveSeance(id) {
  const w = currentWeek; // FIX: was getActiveWeek()
  const wk = WEEKS[w] ? WEEKS[w].seancesKey : 's1';
  const key = wk + '_' + id;
  if(!D.seances) D.seances = {};
  if(!D.seances[key]) D.seances[key] = { done: false, charges: {}, notes: '' };
  const panel = document.getElementById('sub-' + id);
  persistSeanceFields(panel, D.seances[key]);
  D.seances[key].done = true;
  D.seances[key].date = localDateString();
  if(!save()) return;
  // Update button
  const btn = document.getElementById('savebtn-' + id);
  if(btn) {
    btn.style.background = 'var(--green)';
    btn.querySelector('.save-btn-label').textContent = '✓ SÉANCE ' + id.toUpperCase() + ' COMPLÉTÉE';
  }
  updateStatus();
}

// ═══ UPDATE STATUS (FIX: uses activeWeek on home) ══════════
function updateStatus() {
  // Show completion status for currently selected week
  const aw = currentWeek || getActiveWeek();
  const wk = WEEKS[aw] ? WEEKS[aw].seancesKey : 's1';
  ['a','b','c'].forEach(id => {
    const el = document.getElementById('ws-' + id);
    if(!el) return;
    const s = D.seances && D.seances[wk + '_' + id];
    if(s && s.done) {
      el.classList.add('ws-done');
      el.innerHTML = '✓';
    } else {
      el.classList.remove('ws-done');
      el.innerHTML = '◯';
    }
  });
}

// ═══ SLIDER ════════════════════════════════════════════════
function updateSlider(key, val) {
  const v = parseInt(val);
  const el = document.getElementById('ci-' + key + '-val');
  if(!el) return;
  el.textContent = v;
  const colors = key === 'douleur'
    ? (v <= 2 ? '#27ae60' : v <= 5 ? '#e67e22' : '#c0392b')
    : (v <= 3 ? '#c0392b' : v <= 6 ? '#e67e22' : '#27ae60');
  el.style.color = colors;
}

function getCheckinFormEntry() {
  const poidsEl = document.getElementById('ci-poids');
  const poids = parseFloat(poidsEl ? poidsEl.value : 0);
  if(!poids || poids < 100 || poids > 400) return null;
  const energie = parseInt(document.getElementById('ci-energie').value);
  const sommeil = parseInt(document.getElementById('ci-sommeil').value);
  const stress = parseInt(document.getElementById('ci-stress').value);
  const douleur = parseInt(document.getElementById('ci-douleur').value);
  const note = document.getElementById('ci-note').value;
  return { week: getActiveWeek(), date: localDateString(), poids, energie, sommeil, stress, douleur, note };
}

function hasCheckinDraft() {
  const poidsEl = document.getElementById('ci-poids');
  const noteEl = document.getElementById('ci-note');
  return !!(
    (poidsEl && String(poidsEl.value || '').trim()) ||
    (noteEl && String(noteEl.value || '').trim())
  );
}

// ═══ SAVE CHECK-IN (FIX: reset form + show ref) ════════════
function saveCheckin(options = {}) {
  const poidsEl = document.getElementById('ci-poids');
  const entry = getCheckinFormEntry();
  if(!entry) { alert('Entre ton poids en lbs (ex: 198.6)'); return false; }
  if(!D.checkins) D.checkins = [];
  // Bloquer au-delà de 12 semaines
  if(D.checkins.length >= getProgramWeekCount()) {
    alert('Le programme est complet.');
    return false;
  }
  // Chaque soumission valide complete la semaine active et debloque la suivante.
  // On ne remplace plus selon la date, sinon un test le meme jour renvoie S1 au lieu de S2.
  // Nouveau check-in : déverrouille la semaine suivante
  D.checkins.push(entry);
  if(!save()) {
    D.checkins.pop();
    return false;
  }
  currentWeek = getActiveWeek();
  _resetCheckinForm(poidsEl);
  if(!options.silent) alert('Check-in enregistré! Semaine ' + getActiveWeek() + ' active.');
  return true;
}

function _resetCheckinForm(poidsEl) {
  if(poidsEl) poidsEl.value = '';
  ['energie','sommeil','stress'].forEach(k => {
    const sl = document.getElementById('ci-' + k);
    if(sl) { sl.value = 5; updateSlider(k, 5); }
  });
  const douleurSl = document.getElementById('ci-douleur');
  if(douleurSl) { douleurSl.value = 0; updateSlider('douleur', 0); }
  const noteEl = document.getElementById('ci-note');
  if(noteEl) noteEl.value = '';
  currentWeek = getActiveWeek();
  renderEntrainementWeek();
  showLastCheckinRef();
  updateStatus();
  updateHomeStats();
  loadPhotos(currentWeek);
}

// ═══ ESCAPE HTML (XSS prevention) ═════════════════════════
function escapeHTML(str) {
  if(!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ═══ SHOW LAST CHECK-IN REF ════════════════════════════════
function showLastCheckinRef() {
  if(!D.checkins || !D.checkins.length) return;
  const last = D.checkins[D.checkins.length - 1];
  const el = document.getElementById('ci-last-ref');
  const content = document.getElementById('ci-last-ref-content');
  if(!el || !content) return;
  const d = parseLocalDate(last.date);
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  const douleur = last.douleur !== undefined ? last.douleur : 0;
  content.innerHTML = `<strong>${escapeHTML(last.poids)} lbs</strong> · Énergie ${escapeHTML(last.energie)}/10 · Sommeil ${escapeHTML(last.sommeil)}/10 · Stress ${escapeHTML(last.stress)}/10 · Douleur épaule ${escapeHTML(douleur)}/10<br><span style="font-size:11px;color:var(--txt3)">${escapeHTML(dateStr)}</span>`;
  el.style.display = 'block';
}

// ═══ HOME STATS ════════════════════════════════════════════
function updateHomeStats() {
  // Use currentWeek for display — synced with entrainement tab selection
  const aw = currentWeek || getActiveWeek();
  const w = WEEKS[aw] || WEEKS[1];
  const wEl = document.getElementById('home-week-label');
  const phEl = document.getElementById('home-phase-label');
  const msgEl = document.getElementById('week-msg-body');
  if(wEl) wEl.textContent = w.label;
  if(phEl) phEl.textContent = w.phase;
  if(msgEl) msgEl.textContent = w.msg;
  // Update ent panel header
  const entProt = document.getElementById('ent-protocol');
  if(entProt) entProt.textContent = w.protocol;
  // Count seances
  let seanceCount = 0;
  for(let ww = 1; ww <= getProgramWeekCount(); ww++) {
    if(!WEEKS[ww]) continue;
    const wk = WEEKS[ww].seancesKey;
    ['a','b','c'].forEach(id => {
      if(D.seances && D.seances[wk+'_'+id] && D.seances[wk+'_'+id].done) seanceCount++;
    });
  }
  const scEl = document.getElementById('stat-seances');
  if(scEl) scEl.textContent = seanceCount;
  const ciEl = document.getElementById('stat-checkins');
  if(ciEl) ciEl.textContent = (D.checkins || []).length;
  const cis = D.checkins || [];
  if(cis.length >= 1) {
    const first = cis[0].poids;
    const last = cis[cis.length-1].poids;
    const delta = (first - last).toFixed(1);
    const pdEl = document.getElementById('stat-poids');
    if(pdEl) pdEl.textContent = delta > 0 ? '-' + delta : '+' + Math.abs(delta);
    const progD = document.getElementById('prog-debut');
    const progA = document.getElementById('prog-actuel');
    const progDelta = document.getElementById('prog-delta');
    if(progD) progD.textContent = first + ' lbs';
    if(progA) progA.textContent = last + ' lbs';
    if(progDelta) progDelta.textContent = (delta > 0 ? '-' : '+') + Math.abs(delta) + ' lbs';
    const trend = document.getElementById('prog-trend');
    if(trend) trend.textContent = delta > 0 ? '▼ Baisse' : '▲ Hausse';
  }
  updateStatus();
  // Home weight chart
  renderHomeChart();
}

function showChartOverlay(container, message) {
  if(!container) return;
  let empty = container.querySelector('.chart-empty-overlay');
  if(!empty) {
    empty = document.createElement('div');
    empty.className = 'chart-empty-overlay';
    empty.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.className = 'chart-empty';
    box.style.width = '100%';
    const txt = document.createElement('span');
    txt.className = 'chart-empty-txt';
    box.appendChild(txt);
    empty.appendChild(box);
    container.style.position = 'relative';
    container.appendChild(empty);
  }
  const txt = empty.querySelector('.chart-empty-txt');
  if(txt) txt.textContent = message;
  empty.style.display = 'flex';
}

function hideChartOverlay(container) {
  if(!container) return;
  const empty = container.querySelector('.chart-empty-overlay');
  if(empty) empty.style.display = 'none';
}

// ═══ HOME CHART ════════════════════════════════════════════
function renderHomeChart() {
  const cis = D.checkins || [];
  const container = document.querySelector('.chart-wrap .chart-container');
  // FIX: Never destroy the canvas element — toggle empty state instead
  let canvas = document.getElementById('homeWeightChart');
  if(!cis.length) {
    // Show empty state as overlay, keep canvas in DOM
    showChartOverlay(container, 'Aucun check-in enregistré');
    if(hwChart) { hwChart.destroy(); hwChart = null; }
    return;
  }
  if(!hasChartLibrary()) {
    showChartOverlay(container, 'Graphique indisponible hors ligne');
    if(hwChart) { hwChart.destroy(); hwChart = null; }
    return;
  }
  // Remove empty overlay if present
  hideChartOverlay(container);
  // Recreate canvas if it was removed (safety)
  if(!canvas && container) {
    canvas = document.createElement('canvas');
    canvas.id = 'homeWeightChart';
    container.appendChild(canvas);
  }
  if(!canvas) return;
  if(hwChart) { hwChart.destroy(); hwChart = null; }
  const labels = cis.map((c,i) => 'S' + (i+1));
  const data = cis.map(c => c.poids);
  hwChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Poids', data, borderColor: '#C85A00', backgroundColor: 'rgba(200,90,0,0.08)', tension: 0.3, fill: true, pointRadius: 4, pointBackgroundColor: '#C85A00' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } }
      }
    }
  });
}

// ═══ CHARTS ════════════════════════════════════════════════
function renderCharts() {
  const cis = D.checkins || [];
  if(wChart) wChart.destroy();
  if(cChart) cChart.destroy();
  if(bChart) bChart.destroy();
  const labels = cis.map((c,i) => 'S' + (i+1));
  const wCanvas = document.getElementById('weightChart');
  const cCanvas = document.getElementById('chargesChart');
  const bCanvas = document.getElementById('bilanChart');
  if(!hasChartLibrary()) {
    [wCanvas, cCanvas, bCanvas].forEach(canvas => {
      if(canvas) showChartOverlay(canvas.parentElement, 'Graphique indisponible hors ligne');
    });
    return;
  }
  [wCanvas, cCanvas, bCanvas].forEach(canvas => {
    if(canvas) hideChartOverlay(canvas.parentElement);
  });
  if(wCanvas && cis.length) {
    wChart = new Chart(wCanvas, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Poids (lbs)', data: cis.map(c=>c.poids), borderColor:'#C85A00', tension:.3, fill:false, pointRadius:5, pointBackgroundColor:'#C85A00' }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ticks:{font:{size:10}}}, y:{ticks:{font:{size:10}}} } }
    });
  }
  // Charges chart - collect data per week
  const beltData = [], rdlData = [], legData = [], sledData = [], carryData = [], weekLabels = [];
  for(let w=1;w<=getProgramWeekCount();w++) {
    if(!WEEKS[w]) continue;
    const wk = WEEKS[w].seancesKey;
    const sa = D.seances && D.seances[wk+'_a'];
    const sc = D.seances && D.seances[wk+'_c'];
    if((sa && sa.done) || (sc && sc.done)) {
      weekLabels.push('S'+w);
      const beltVal = sa && sa.charges && sa.charges.a_belt_squat;
      const rdlVal = sa && sa.charges && sa.charges.a_rdl_straps;
      const sledVal = sa && sa.charges && sa.charges.a_sled_push;
      const legVal = sc && sc.charges && sc.charges.c_leg_press;
      const carryVal = sc && sc.charges && sc.charges.c_farmer_carry;
      beltData.push(beltVal ? parseFloat(beltVal) : null);
      rdlData.push(rdlVal ? parseFloat(rdlVal) : null);
      legData.push(legVal ? parseFloat(legVal) : null);
      sledData.push(sledVal ? parseFloat(sledVal) : null);
      carryData.push(carryVal ? parseFloat(carryVal) : null);
    }
  }
  if(cCanvas && weekLabels.length) {
    cChart = new Chart(cCanvas, {
      type: 'line',
      data: { labels: weekLabels, datasets: [
        { label:'Belt Squat', data:beltData, borderColor:'#C85A00', tension:.3, spanGaps:true, pointRadius:4, pointBackgroundColor:'#C85A00' },
        { label:'RDL', data:rdlData, borderColor:'#4CAF50', tension:.3, spanGaps:true, pointRadius:4, pointBackgroundColor:'#4CAF50' },
        { label:'Leg Press', data:legData, borderColor:'#2196F3', tension:.3, spanGaps:true, pointRadius:4, pointBackgroundColor:'#2196F3' },
        { label:'Sled Push', data:sledData, borderColor:'#8e44ad', tension:.3, spanGaps:true, pointRadius:4, pointBackgroundColor:'#8e44ad' },
        { label:'Farmer Carry', data:carryData, borderColor:'#16a085', tension:.3, spanGaps:true, pointRadius:4, pointBackgroundColor:'#16a085' },
      ]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ticks:{font:{size:10}}}, y:{ticks:{font:{size:10}}} } }
    });
  }
  if(bCanvas && cis.length) {
    bChart = new Chart(bCanvas, {
      type: 'line',
      data: { labels, datasets: [
        { label:'Énergie', data:cis.map(c=>c.energie), borderColor:'#C85A00', tension:.3, pointRadius:4, pointBackgroundColor:'#C85A00' },
        { label:'Sommeil', data:cis.map(c=>c.sommeil), borderColor:'#4CAF50', tension:.3, pointRadius:4, pointBackgroundColor:'#4CAF50' },
        { label:'Stress', data:cis.map(c=>c.stress), borderColor:'#c0392b', tension:.3, pointRadius:4, pointBackgroundColor:'#c0392b' },
        { label:'Douleur épaule', data:cis.map(c=>c.douleur !== undefined ? c.douleur : 0), borderColor:'#8e44ad', tension:.3, pointRadius:4, pointBackgroundColor:'#8e44ad' },
      ]},
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ticks:{font:{size:10}}}, y:{min:0,max:10,ticks:{font:{size:10}}} } }
    });
  }
}

// ═══ HISTORIQUE ════════════════════════════════════════════
function renderHistorique() {
  const container = document.getElementById('historique-container');
  if(!container) return;
  let html = '';
  let hasData = false;
  for(let w=getProgramWeekCount();w>=1;w--) {
    if(!WEEKS[w]) continue;
    const wk = WEEKS[w].seancesKey;
    const seances = ['a','b','c'].map(id => ({ id, s: D.seances && D.seances[wk+'_'+id] })).filter(x => x.s && x.s.done);
    const cis = (D.checkins || []).filter((c,i) => i+1 === w || (i+1 >= w && i+1 < w+1));
    if(!seances.length && !cis.length) continue;
    hasData = true;
    html += `<div class="hist-week-divider"><div class="hist-week-divider-line"></div><div class="hist-week-divider-txt">SEMAINE ${w}</div><div class="hist-week-divider-line"></div></div>`;
    seances.forEach(x => {
      const charges = x.s.charges || {};
      const vals = Object.values(charges).map(v=>parseFloat(v)).filter(v=>!isNaN(v));
      const maxLoad = vals.length ? Math.max(...vals) : 0;
      const totalVol = vals.reduce((a,b)=>a+b, 0);
      html += `<div class="hist-seance-entry">
        <div class="hist-seance-hdr">
          <div class="hist-seance-label">SÉANCE ${x.id.toUpperCase()} — ${WEEKS[w].label}</div>
          <div class="hist-seance-date">${x.s.date || ''}</div>
        </div>
        <div class="hist-seance-stats">
          <div class="hist-seance-stat"><div class="hist-seance-stat-n">${Object.keys(charges).length}</div><div class="hist-seance-stat-l">EXERCICES</div></div>
          <div class="hist-seance-stat"><div class="hist-seance-stat-n">${maxLoad || '—'}</div><div class="hist-seance-stat-l">MAX LBS</div></div>
          <div class="hist-seance-stat"><div class="hist-seance-stat-n">${Math.round(totalVol)}</div><div class="hist-seance-stat-l">VOLUME</div></div>
        </div>
        ${x.s.notes ? `<div style="padding:10px 16px"><div class="hist-note">${escapeHTML(x.s.notes)}</div></div>` : ''}
      </div>`;
    });
    cis.forEach(c => {
      html += `<div class="hist-entry">
        <div class="hist-date">CHECK-IN — ${c.date || ''}</div>
        <div class="hist-row"><span class="hist-label">Poids</span><span class="hist-val">${c.poids} lbs</span></div>
        <div class="hist-row"><span class="hist-label">Énergie</span><span class="hist-val">${c.energie}/10</span></div>
        <div class="hist-row"><span class="hist-label">Sommeil</span><span class="hist-val">${c.sommeil}/10</span></div>
        <div class="hist-row"><span class="hist-label">Stress</span><span class="hist-val">${c.stress}/10</span></div>
        <div class="hist-row"><span class="hist-label">Douleur épaule</span><span class="hist-val">${c.douleur !== undefined ? c.douleur : 0}/10</span></div>
        ${c.note ? `<div class="hist-note">${escapeHTML(c.note)}</div>` : ''}
      </div>`;
    });
  }
  if(!hasData) html = '<div class="chart-empty" style="margin:20px 14px"><span class="chart-empty-txt">Aucune donnée enregistrée</span></div>';
  container.innerHTML = html;
}

// ═══ TIMER ═════════════════════════════════════════════════
function startTimer(seconds, name) {
  if(timerInterval) clearInterval(timerInterval);
  timerSeconds = seconds;
  const nameEl = document.getElementById('timer-exname');
  if(nameEl) nameEl.textContent = name || 'REPOS';
  document.getElementById('timer-modal').classList.add('show');
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if(timerSeconds <= 0) { clearInterval(timerInterval); timerInterval = null; }
  }, 1000);
}
function updateTimerDisplay() {
  const m = Math.floor(Math.abs(timerSeconds)/60);
  const s = Math.abs(timerSeconds) % 60;
  const el = document.getElementById('timer-display');
  if(el) el.textContent = (timerSeconds<0?'-':'') + m + ':' + String(s).padStart(2,'0');
}
function closeTimer() { if(timerInterval){clearInterval(timerInterval);timerInterval=null;} document.getElementById('timer-modal').classList.remove('show'); }

// ═══ PHOTOS (FIX: per-week + compression) ══════════════════
// ═══ PHOTOS (IndexedDB + compression) ═════════════════════
function triggerPhoto(slot) { curSlot = slot; document.getElementById('photo-input').click(); }

function handlePhoto(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const maxW = 700;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      const weekSlot = 's' + getActiveWeek();
      // Clé IDB unique par semaine + slot
      const photoKey = 'photo_' + weekSlot + '_' + curSlot;
      try {
        await idbPut(photoKey, compressed);
      } catch(e) {
        alert('Impossible de sauvegarder la photo. Espace insuffisant.');
        return;
      }
      // D.photos stocke seulement la référence (clé), pas le blob
      if(!D.photos) D.photos = {};
      if(!D.photos[weekSlot]) D.photos[weekSlot] = {};
      D.photos[weekSlot][curSlot] = photoKey;
      if(!save()) return;
      loadPhotos(getActiveWeek());
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function loadPhotos(weekNum) {
  const weekSlot = 's' + weekNum;
  const refs = (D.photos && D.photos[weekSlot]) || {};
  for(let i = 0; i < 3; i++) {
    const imgEl = document.getElementById('photo-' + i);
    if(!imgEl) continue;
    const wrapper = imgEl.parentElement;
    const plus = wrapper ? wrapper.querySelector('.photo-slot-plus') : null;
    const label = wrapper ? wrapper.querySelector('.photo-slot-label') : null;
    const key = refs[i];
    if(key) {
      try {
        const data = await idbGet(key);
        if(data) {
          imgEl.src = data;
          imgEl.style.display = 'block';
          if(plus) plus.style.display = 'none';
          if(label) label.style.display = 'none';
        } else {
          imgEl.style.display = 'none';
          if(plus) plus.style.display = 'block';
          if(label) label.style.display = 'block';
        }
      } catch(e) {
        imgEl.style.display = 'none';
        if(plus) plus.style.display = 'block';
        if(label) label.style.display = 'block';
      }
    } else {
      imgEl.style.display = 'none';
      if(plus) plus.style.display = 'block';
      if(label) label.style.display = 'block';
    }
  }
}

// ═══ RESET MODAL ════════════════════════════════════════════
function openResetModal() { /* accessed via hdr-name long press */ }
function startPress() {
  const el = document.getElementById('hdr-name');
  if(el) el.classList.add('pressing');
  window._pressTimer = setTimeout(() => { openResetModalFull(); }, 3000);
}
function endPress() {
  const el = document.getElementById('hdr-name');
  if(el) el.classList.remove('pressing');
  if(window._pressTimer) clearTimeout(window._pressTimer);
}

function openResetModalFull() {
  document.getElementById('reset-modal').classList.add('show');
  const btn = document.getElementById('reset-confirm-btn');
  const cd = document.getElementById('reset-countdown');
  if(btn) btn.disabled = true;
  if(cd) cd.textContent = 'Attendre 3 secondes...';
  let count = 3;
  const interval = setInterval(() => {
    count--;
    if(count <= 0) { clearInterval(interval); if(btn)btn.disabled=false; if(cd)cd.textContent=''; }
    else if(cd) cd.textContent = 'Attendre ' + count + ' seconde' + (count>1?'s':'') + '...';
  }, 1000);
}
function closeResetModal() { document.getElementById('reset-modal').classList.remove('show'); }
async function confirmReset() {
  // Reset only this client's storage key. Do not remove other faem/legacy keys.
  localStorage.removeItem(SK);
  // Reset D to factory empty state (no preload — truly blank)
  D = { seances: {}, checkins: [], photos: {} };
  // FIX: Attendre que IDB soit vidé AVANT le reload
  await idbClearAll();
  save(); // Save empty state BEFORE reload
  closeResetModal();
  location.reload();
}

// ═══ EXPORT / IMPORT DES DONNÉES ═══════════════════════════
function exportData() {
  // IMPORTANT: Les photos sont stockées dans IndexedDB sur cet appareil.
  // Elles NE SONT PAS incluses dans ce JSON (trop volumineuses).
  // Le JSON contient: séances, check-ins, et références de photos (clés IDB).
  // Pour récupérer les photos, rester sur le même appareil/navigateur.
  const exportPayload = {
    backupNote: 'Backup texte seulement, les photos restent sur cet appareil.',
    exportedAt: new Date().toISOString(),
    storageKey: SK,
    photoDbName: IDB_NAME,
    ...D
  };
  const json = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = localDateString();
  a.download = CLIENT_SLUG + '-legacy-' + dateStr + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  // Avertir après le téléchargement
  setTimeout(() => {
    alert('Export téléchargé.\n\nBackup texte seulement, les photos restent sur cet appareil.');
  }, 300);
}

function normalizeImportedData(imported) {
  if(!imported || typeof imported !== 'object') return null;
  if(!Array.isArray(imported.checkins)) return null;

  const cleanCheckins = imported.checkins.slice(0, getProgramWeekCount()).map(c => {
    if(!c || typeof c !== 'object') return null;
    const poids = clampNumber(c.poids, 100, 400, NaN);
    if(!Number.isFinite(poids)) return null;
    return {
      date: typeof c.date === 'string' ? c.date : localDateString(),
      poids,
      energie: Math.round(clampNumber(c.energie, 1, 10, 5)),
      sommeil: Math.round(clampNumber(c.sommeil, 1, 10, 5)),
      stress: Math.round(clampNumber(c.stress, 1, 10, 5)),
      douleur: Math.round(clampNumber(c.douleur, 0, 10, 0)),
      note: typeof c.note === 'string' ? c.note.slice(0, 2000) : ''
    };
  }).filter(Boolean);

  const cleanSeances = imported.seances && typeof imported.seances === 'object' && !Array.isArray(imported.seances)
    ? imported.seances
    : {};
  const cleanPhotos = imported.photos && typeof imported.photos === 'object' && !Array.isArray(imported.photos)
    ? imported.photos
    : {};

  return { seances: cleanSeances, checkins: cleanCheckins, photos: cleanPhotos };
}

function importData() {
  document.getElementById('import-input').click();
}

function handleImport(event) {
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const imported = normalizeImportedData(JSON.parse(ev.target.result));
      if(!imported) {
        alert('Fichier invalide. Ce fichier ne contient pas de données Legacy Protocol.');
        return;
      }
      const ok = confirm(
        'Cette action va remplacer TOUTES tes données actuelles.\n\n' +
        'Note: Les photos du fichier importé (références IDB) ne seront restaurées que si tu es sur le même appareil/navigateur.\n\n' +
        'Continuer?'
      );
      if(!ok) return;
      D = imported;
      save();
      alert('Données importées. La page va se recharger.');
      location.reload();
    } catch(e) {
      alert('Erreur de lecture du fichier: ' + e.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ═══ TELEGRAM REPORT ═══════════════════════════════════════
// CONFIGURATION REQUISE AVANT LIVRAISON:
// Remplacer REPORT_ENDPOINT par l'URL de votre fonction serverless.
// La fonction reçoit { message: string } en POST et l'envoie au bot Telegram.
// Exemple Netlify:  /.netlify/functions/send-report
// Exemple Vercel:   /api/send-report
// BOT_TOKEN et CHAT_ID restent côté serveur, jamais dans ce fichier.
const REPORT_ENDPOINT = PORTAL_CONFIG.reportEndpoint || '';

function isReportEndpointConfigured() {
  return REPORT_ENDPOINT && REPORT_ENDPOINT !== '/api/send-report';
}

async function copyReportToClipboard(text) {
  try {
    if(navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch(e) {}

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch(e) {
    return false;
  }
}

function getReportWeek() {
  const cis = D.checkins || [];
  if(cis.length) {
    const last = cis[cis.length - 1];
    return Math.min(Number(last.week) || cis.length, getProgramWeekCount());
  }
  return currentWeek || getActiveWeek();
}

function getSeanceExercises(weekNum, seanceId) {
  const week = WEEKS[weekNum];
  const seance = week && week.seances ? week.seances[seanceId] : null;
  if(!seance) return [];
  const exs = [];
  if(seance.isC && seance.circuitExs) exs.push(...seance.circuitExs);
  if(seance.blocs) seance.blocs.forEach(bloc => exs.push(...(bloc.exs || [])));
  if(seance.finisher && seance.finisher.exs) exs.push(...seance.finisher.exs);
  return exs;
}

function formatSeanceDetails(weekNum, seanceId, record) {
  const label = seanceId.toUpperCase();
  const lines = [];
  if(!record) {
    lines.push('Séance ' + label + ': aucune donnée enregistrée');
    return lines;
  }

  lines.push((record.done ? '✅' : '📝') + ' Séance ' + label + (record.date ? ' — ' + record.date : ''));
  if(record.notes) lines.push('Notes: ' + record.notes);

  const charges = record.charges || {};
  const edits = record.edits || {};
  const exs = getSeanceExercises(weekNum, seanceId);
  const usedKeys = {};
  exs.forEach((ex, index) => {
    const detail = edits[index] || {};
    const value = ex.key ? charges[ex.key] : null;
    if(ex.key) usedKeys[ex.key] = true;
    if(!value && !detail.sets && !detail.reps) return;
    const parts = [];
    if(detail.sets || detail.reps) {
      parts.push((detail.sets || ex.sets) + 'x' + (detail.reps || ex.reps));
    }
    if(value) parts.push('réel: ' + value + ' ' + (ex.unit || 'lbs'));
    lines.push('- ' + ex.name + ': ' + parts.join(' · '));
  });

  Object.keys(charges).forEach(key => {
    if(usedKeys[key]) return;
    lines.push('- ' + key + ': ' + charges[key]);
  });

  if(!record.notes && !Object.keys(charges).length && !Object.keys(edits).length) {
    lines.push('- Aucune note ou charge détaillée');
  }
  return lines;
}

async function collectWeeklyPhotos(weekNum) {
  const labels = ['FACE', 'PROFIL', 'DOS'];
  const weekSlot = 's' + weekNum;
  const refs = (D.photos && D.photos[weekSlot]) || {};
  const photos = [];
  for(let i = 0; i < 3; i++) {
    const value = refs[i];
    if(!value) continue;
    let dataUrl = null;
    if(typeof value === 'string' && value.indexOf('data:image/') === 0) dataUrl = value;
    else {
      try { dataUrl = await idbGet(value); } catch(e) { dataUrl = null; }
    }
    if(dataUrl) photos.push({ slot: i, label: labels[i], key: value, dataUrl });
  }
  return photos;
}

function getMostRecentSeance(id) {
  // FIX: Search from most recent week to oldest
  for(let w=getProgramWeekCount();w>=1;w--) {
    if(!WEEKS[w]) continue;
    const wk = WEEKS[w].seancesKey;
    const s = D.seances && D.seances[wk+'_'+id];
    if(s && s.done) return { s, weekNum: w };
  }
  return null;
}

function buildReportLines(photos, photoWeek) {
  const reportWeek = getReportWeek();
  const wk = WEEKS[reportWeek] ? WEEKS[reportWeek].seancesKey : 's1';
  const checkin = (D.checkins || [])[reportWeek - 1] || null;
  const photoWeekLabel = photoWeek && photoWeek !== reportWeek ? ' (photos trouvées dans S' + photoWeek + ')' : '';
  const lines = [];
  lines.push('📊 ' + cfgText('reportTitlePrefix', 'CHECK-IN HEBDOMADAIRE') + ' — ' + CLIENT_NAME.toUpperCase());
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Semaine complétée: S' + reportWeek + ' | ' + (WEEKS[reportWeek] ? WEEKS[reportWeek].phase : ''));
  lines.push('Semaine maintenant active: S' + getActiveWeek());
  lines.push('');

  lines.push('CHECK-IN CLIENT');
  const cis = D.checkins || [];
  if(checkin) {
    lines.push('Date: ' + checkin.date);
    lines.push('Poids: ' + checkin.poids + ' lbs');
    if(cis.length >= 2) {
      const prev = cis[reportWeek - 2];
      if(prev) lines.push('Variation depuis dernier check-in: ' + (checkin.poids - prev.poids).toFixed(1) + ' lbs');
      lines.push('Variation totale: ' + (checkin.poids - cis[0].poids).toFixed(1) + ' lbs');
    }
    lines.push('Énergie: ' + checkin.energie + '/10');
    lines.push('Sommeil: ' + checkin.sommeil + '/10');
    lines.push('Stress: ' + checkin.stress + '/10');
    lines.push('Douleur épaule: ' + (checkin.douleur !== undefined ? checkin.douleur : 0) + '/10');
    lines.push('Note check-in: ' + (checkin.note || 'Aucune note'));
  } else {
    lines.push('Aucun check-in enregistré pour cette semaine.');
  }

  lines.push('');
  lines.push('SÉANCES ET NOTES DE LA SEMAINE');
  ['a','b','c'].forEach(id => {
    const record = D.seances && D.seances[wk + '_' + id];
    lines.push(...formatSeanceDetails(reportWeek, id, record));
    lines.push('');
  });

  lines.push('PHOTOS DE PROGRESSION');
  if(photos && photos.length) {
    lines.push('Photos jointes au payload backend: ' + photos.map(p => p.label).join(', ') + photoWeekLabel);
    lines.push('Mode manuel: envoyer ces photos séparément dans Telegram.');
  } else {
    lines.push('Aucune photo enregistrée pour S' + reportWeek + '.');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(cfgText('reportFooter', 'Envoye depuis ' + PROGRAM_TITLE + ' ' + APP_VERSION));
  return lines.join('\n');
}

async function buildWeeklyReportPayload() {
  const reportWeek = getReportWeek();
  const activeWeek = getActiveWeek();
  let photoWeek = reportWeek;
  let photos = await collectWeeklyPhotos(reportWeek);
  if(!photos.length && activeWeek !== reportWeek) {
    const activePhotos = await collectWeeklyPhotos(activeWeek);
    if(activePhotos.length) {
      photoWeek = activeWeek;
      photos = activePhotos.map(photo => ({ ...photo, week: photoWeek }));
    }
  }
  return {
    message: buildReportLines(photos, photoWeek),
    week: reportWeek,
    activeWeek,
    photoWeek,
    photos
  };
}

async function sendWeeklyReport() {
  if(!hasCheckinDraft()) {
    alert('Remplis ton check-in hebdomadaire avant de l’envoyer.');
    return;
  }

  if(!getCheckinFormEntry()) {
    alert('Entre ton poids en lbs (ex: 198.6) avant d’envoyer ton check-in.');
    return;
  }

  const confirmed = confirm(
    '⚠️ Voulez-vous vraiment envoyer votre check-in hebdomadaire?\n\n' +
    'Une fois envoyé, ce check-in sera sauvegardé et la semaine suivante sera déverrouillée.'
  );
  if(!confirmed) return;

  const saved = saveCheckin({ silent: true });
  if(!saved) return;

  const payload = await buildWeeklyReportPayload();
  const text = payload.message;
  if(!isReportEndpointConfigured()) {
    const copied = await copyReportToClipboard(text);
    if(copied) {
      const photoNote = payload.photos.length ? '\n\nPhotos détectées: ' + payload.photos.map(p => p.label).join(', ') + '. Elles devront être envoyées séparément jusqu’au backend.' : '';
      alert('Rapport complet copié.\n\nCollez-le dans Telegram pour l’envoyer manuellement.' + photoNote + '\n\nPour l’envoi automatique avec photos, il faudra ajouter un endpoint serveur sécurisé.');
    } else {
      alert('Rapport généré, mais la copie automatique est bloquée par le navigateur.\n\nOuvrez l’export ou configurez un endpoint serveur pour l’envoi automatique.');
    }
    return;
  }
  try {
    const r = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if(r.ok) {
      const photoStatus = payload.photos.length
        ? '\nPhotos envoyées: ' + (typeof data.sentPhotos === 'number' ? data.sentPhotos : payload.photos.length) + '/' + payload.photos.length
        : '\nAucune photo détectée pour ce rapport.';
      alert(cfgText('checkinSentAlert', 'Rapport envoye au coach!') + '\nSemaine active: S' + getActiveWeek() + photoStatus);
    } else {
      alert('Erreur d\'envoi (' + r.status + '): ' + (data.error || 'Vérifiez la configuration du endpoint.'));
    }
  } catch(e) {
    alert('Erreur réseau: ' + e.message + '\n\nVérifiez que REPORT_ENDPOINT est configuré.');
  }
}

// ═══ RESTORE (INIT) ════════════════════════════════════════
async function restore() {
  await applyPortalConfig();
  // Init state
  currentWeek = getActiveWeek();
  await migrateLegacyPhotosToIDB();
  // Home
  updateHomeStats();
  // Check-in: show last ref if exists
  showLastCheckinRef();
  // Load photos for active week
  loadPhotos(getActiveWeek());
  // Entrainement (pre-build)
  renderEntrainementWeek();
  // Status
  updateStatus();
  // Home chart
  renderHomeChart();
}

window.addEventListener('load', restore);
