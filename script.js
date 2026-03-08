/* ============================================================
   TJ APPS — script.js
   ============================================================ */

// ── CONFIG ─────────────────────────────────────────────────
// ⬇ ИНҶО НОМИ ХУДРО НАВИСЕД (як маротиба)
const GITHUB_USER = 'mahmadsonii';   // ← GitHub username
const GITHUB_REPO = 'TJ-APPS-';     // ← Repository номи

// Admin танзимоти (танҳо браузери Admin)
let CFG = JSON.parse(localStorage.getItem('tjapps_cfg') || '{}');
CFG.user  = GITHUB_USER;
CFG.repo  = GITHUB_REPO;

let apps = [];
let isAdmin = false;
let selectedIcon = '📦';
let iconDataUrl = null;
let currentDetailIdx = null;

const EMOJIS = [
  '📦','📱','💬','🎮','🎵','🎬','📷','🌐','🔧','📊',
  '🗺️','🛒','💳','📚','🔐','🏥','✈️','🎯','🔥','⭐',
  '💡','🎨','🖥️','📡','🎁','🎤','📰','🏋️','🍔','🚗',
  '💰','🎲','🧩','📺','🔋','📍','🌙','☀️','🎉','🦁',
  '🐉','⚽','🏀','🎾','🏆','🕹️','🧸','🦊','🐼','🌊'
];

const COLORS = [
  '#0d2b1f','#0d1f2b','#1f0d2b','#2b1f0d',
  '#0d2b2b','#1a0d0d','#0d0d2b','#1a1a0d'
];

// ── INIT ──────────────────────────────────────────────────
function init() {
  renderEmojiGrid();
  setupSwipeGesture();
  setupOverlayClose();

  // Ҳама меҳмонон APK-ҳоро мебинанд — Setup лозим нест
  loadApps();
}

// ── GITHUB API ────────────────────────────────────────────
function rawUrl() {
  return `https://raw.githubusercontent.com/${CFG.user}/${CFG.repo}/main/data.json?t=${Date.now()}`;
}
function apiUrl() {
  return `https://api.github.com/repos/${CFG.user}/${CFG.repo}/contents/data.json`;
}

async function loadApps() {
  showLoader();
  try {
    const res = await fetch(rawUrl());
    if (!res.ok) throw new Error();
    apps = await res.json();
  } catch {
    apps = [];
  }
  renderApps();
}

async function saveToGitHub() {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(apps, null, 2))));
  let sha = '';
  try {
    const r = await fetch(apiUrl(), {
      headers: {
        Authorization: `token ${CFG.token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    if (r.ok) sha = (await r.json()).sha;
  } catch {}

  const body = { message: 'update apps', content };
  if (sha) body.sha = sha;

  const res = await fetch(apiUrl(), {
    method: 'PUT',
    headers: {
      Authorization: `token ${CFG.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'GitHub хато');
  }
}

// ── SETUP ─────────────────────────────────────────────────
function saveSetup() {
  const token = qs('#ghToken').value.trim();
  const pass  = qs('#setupPass').value.trim();

  if (!token || !pass) {
    toast('❌ Token ва Паролро ворид кунед!', true); return;
  }
  CFG.token = token;
  CFG.pass  = pass;
  localStorage.setItem('tjapps_cfg', JSON.stringify(CFG));
  closeOverlay('setupOverlay');
  toast('✅ Танзим сохта шуд!');
  // Пароль пурсидан
  qs('#passInput').value = '';
  qs('#passError').style.display = 'none';
  openOverlay('passOverlay');
  setTimeout(() => qs('#passInput').focus(), 300);
}

// ── RENDER ────────────────────────────────────────────────
function showLoader() {
  const html = `<div class="loader"><div class="spinner"></div>Бор мешавад...</div>`;
  qs('#apps-list').innerHTML = html;
  qs('#games-list').innerHTML = html;
}

function renderApps() {
  const appList  = apps.filter(a => a.cat === 'app');
  const gameList = apps.filter(a => a.cat === 'game');
  qs('#apps-list').innerHTML  = appList.length  ? buildGrid(appList)  : emptyHTML('Ҳоло барномае нест');
  qs('#games-list').innerHTML = gameList.length ? buildGrid(gameList) : emptyHTML('Ҳоло бозие нест');
}

function buildGrid(list) {
  const items = list.map(app => {
    const idx = apps.indexOf(app);
    const iconHTML = app.iconUrl
      ? `<img src="${app.iconUrl}" alt="">`
      : (app.icon || '📦');
    return `
      <div class="app-item" onclick="openDetail(${idx})">
        ${app.version ? `<div class="app-ver">v${app.version}</div>` : ''}
        <div class="app-icon-wrap" style="background:${app.color || '#161616'}">${iconHTML}</div>
        <div class="app-name">${esc(app.name)}</div>
        ${app.size ? `<div class="app-size">${esc(app.size)}</div>` : ''}
      </div>`;
  }).join('');
  return `<div class="apps-grid">${items}</div>`;
}

function emptyHTML(msg) {
  return `<div class="empty">
    <div class="empty-icon">📭</div>
    <div class="empty-text">${msg}<br><span style="font-size:0.75rem;opacity:.5">Admin шавед ва APK илова кунед</span></div>
  </div>`;
}

// ── TABS ──────────────────────────────────────────────────
function switchTab(tab, el) {
  qsa('.tab-content').forEach(t => t.classList.remove('active'));
  qsa('.nav-btn').forEach(b => b.classList.remove('active'));
  qs('#tab-' + tab).classList.add('active');
  el.classList.add('active');
  if (tab === 'search') setTimeout(() => qs('#searchInput').focus(), 220);
}

// ── SEARCH ────────────────────────────────────────────────
function doSearch() {
  const q = qs('#searchInput').value.toLowerCase().trim();
  if (!q) { qs('#search-results').innerHTML = ''; return; }
  const found = apps.filter(a => a.name.toLowerCase().includes(q));
  qs('#search-results').innerHTML = found.length
    ? buildGrid(found)
    : `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">"${esc(q)}" ёфт нашуд</div></div>`;
}

// ── ADMIN ─────────────────────────────────────────────────
function openAdmin() {
  // Агар Token ё Пароль нест — Setup нишон диҳ
  if (!CFG.token || !CFG.pass) {
    openOverlay('setupOverlay');
    return;
  }
  qs('#passInput').value = '';
  qs('#passError').style.display = 'none';
  openOverlay('passOverlay');
  setTimeout(() => qs('#passInput').focus(), 300);
}

function checkPass() {
  if (qs('#passInput').value === CFG.pass) {
    isAdmin = true;
    closeOverlay('passOverlay');
    qs('.icon-btn[onclick="openAdmin()"]').classList.add('active-admin');
    openAddSheet();
  } else {
    qs('#passError').style.display = 'block';
    qs('#passInput').value = '';
    qs('#passInput').focus();
  }
}

function openAddSheet() {
  qs('#appName').value = '';
  qs('#appVersion').value = '';
  qs('#appSize').value = '';
  qs('#appUrl').value = '';
  qs('#appDesc').value = '';
  qs('#appVideo').value = '';
  qs('#appCat').value = 'app';
  selectedIcon = '📦'; iconDataUrl = null;
  qs('#iconPreview').innerHTML = '<span>📦</span>';
  qs('#emojiPicker').style.display = 'none';
  qs('#savingRow').classList.remove('show');
  qs('#addBtn').disabled = false;
  openOverlay('adminOverlay');
}

async function addApp() {
  const name = qs('#appName').value.trim();
  if (!name) { toast('❌ Ном ворид кунед!', true); return; }

  const app = {
    name,
    icon: iconDataUrl ? '' : selectedIcon,
    iconUrl: iconDataUrl || null,
    version: qs('#appVersion').value.trim(),
    size: qs('#appSize').value.trim(),
    cat: qs('#appCat').value,
    url: qs('#appUrl').value.trim(),
    desc: qs('#appDesc').value.trim(),
    video: qs('#appVideo').value.trim(),
    color: randColor(),
    added: Date.now()
  };

  qs('#addBtn').disabled = true;
  qs('#savingRow').classList.add('show');

  try {
    apps.unshift(app);
    await saveToGitHub();
    renderApps();
    closeOverlay('adminOverlay');
    toast('✅ ' + app.name + ' илова шуд!');
  } catch (e) {
    apps.shift();
    toast('❌ ' + e.message, true);
  } finally {
    qs('#addBtn').disabled = false;
    qs('#savingRow').classList.remove('show');
  }
}

async function deleteApp(idx) {
  if (!confirm('Нест кунед?')) return;
  const removed = apps.splice(idx, 1);
  try {
    await saveToGitHub();
    renderApps();
    closeOverlay('detailOverlay');
    toast('🗑️ Нест шуд');
  } catch (e) {
    apps.splice(idx, 0, ...removed);
    toast('❌ ' + e.message, true);
  }
}

// ── DETAIL ────────────────────────────────────────────────
function openDetail(idx) {
  currentDetailIdx = idx;
  const app = apps[idx];
  const iconHTML = app.iconUrl
    ? `<img src="${app.iconUrl}" alt="">`
    : (app.icon || '📦');

  // Тавсиф
  const descHTML = app.desc
    ? `<div class="app-desc">${esc(app.desc)}</div>` : '';

  // Видео (YouTube embed)
  let videoHTML = '';
  if (app.video) {
    const ytId = getYouTubeId(app.video);
    if (ytId) {
      videoHTML = `
        <div class="video-wrap">
          <iframe
            src="https://www.youtube.com/embed/${ytId}"
            frameborder="0"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>`;
    } else {
      videoHTML = `
        <div class="video-wrap">
          <video controls playsinline style="width:100%;border-radius:12px;">
            <source src="${app.video}">
          </video>
        </div>`;
    }
  }
    ? `<a href="${app.url}" class="btn-download" target="_blank">⬇ СКАЧАТИ APK${app.size ? ' — ' + esc(app.size) : ''}</a>`
    : `<button class="btn-download disabled">⬇ Линк нест</button>`;

  const adminBtns = isAdmin ? `
    <div class="sep" style="margin-top:4px"></div>
    <button class="btn-danger" onclick="deleteApp(${idx})">🗑️ Нест кардан</button>` : '';

  qs('#detailContent').innerHTML = `
    <div class="detail-top">
      <div class="detail-icon" style="background:${app.color || '#161616'}">${iconHTML}</div>
      <div>
        <div class="detail-name">${esc(app.name)}</div>
        <div class="detail-cat">${app.cat === 'game' ? '🎮 Бозӣ' : '📱 Барнома'}</div>
      </div>
    </div>
    <div class="detail-meta">
      <div class="meta-card">
        <div class="meta-label">Версия</div>
        <div class="meta-val">${esc(app.version) || '—'}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Андоза</div>
        <div class="meta-val">${esc(app.size) || '—'}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Навъ</div>
        <div class="meta-val">${app.cat === 'game' ? '🎮' : '📱'}</div>
      </div>
    </div>
    ${dlBtn}
    ${videoHTML}
    ${descHTML}
    ${adminBtns}
    <button class="btn-secondary" onclick="closeOverlay('detailOverlay')" style="margin-top:10px">✕ Пӯшидан</button>
  `;
  openOverlay('detailOverlay');
}

// ── ICON PICKER ───────────────────────────────────────────
function handleIcon(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    iconDataUrl = e.target.result;
    qs('#iconPreview').innerHTML = `<img src="${iconDataUrl}" alt="">`;
  };
  reader.readAsDataURL(file);
}

function renderEmojiGrid() {
  qs('#emojiGrid').innerHTML = EMOJIS.map(e =>
    `<button class="emoji-btn" onclick="selectEmoji('${e}')">${e}</button>`
  ).join('');
}

function toggleEmojiPicker() {
  const p = qs('#emojiPicker');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function selectEmoji(e) {
  selectedIcon = e; iconDataUrl = null;
  qs('#iconPreview').innerHTML = `<span>${e}</span>`;
  qs('#emojiPicker').style.display = 'none';
  qsa('.emoji-btn').forEach(b => b.classList.remove('sel'));
  event.target.classList.add('sel');
}

// ── OVERLAY HELPERS ───────────────────────────────────────
function openOverlay(id) {
  qs('#' + id).classList.add('open');
}
function closeOverlay(id) {
  qs('#' + id).classList.remove('open');
}

function setupOverlayClose() {
  qsa('.overlay').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target === el) el.classList.remove('open');
    });
  });
}

// ── TOAST ─────────────────────────────────────────────────
function toast(msg, isErr = false) {
  const t = qs('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ── SWIPE GESTURE — пурра ─────────────────────────────────
function setupSwipeGesture() {
  let startX = 0, startY = 0, startTime = 0;
  let dragging = false;
  let activeSheet = null;
  let sheetStartY = 0;
  const hint = qs('#swipeHint');
  const EDGE = 35;       // лаби чап (px)
  const MIN_DX = 55;     // ҳадди ақали кашидан
  const MAX_DY = 90;     // ҳадди ақали амудӣ

  // ── SHEET DRAG (поён кашидан барои пӯшидан) ──
  function getTopSheet() {
    const all = [...qsa('.overlay.open')];
    return all.length ? all[all.length - 1].querySelector('.sheet') : null;
  }

  document.addEventListener('touchstart', e => {
    startX    = e.touches[0].clientX;
    startY    = e.touches[0].clientY;
    startTime = Date.now();
    dragging  = false;
    activeSheet = null;

    // Sheet drag — агар touch дар sheet handle ё боло бошад
    const sheet = getTopSheet();
    if (sheet) {
      const rect = sheet.getBoundingClientRect();
      const touchY = e.touches[0].clientY;
      // 60px боло — drag zone
      if (touchY >= rect.top && touchY <= rect.top + 60) {
        activeSheet = sheet;
        sheetStartY = touchY;
        sheet.style.transition = 'none';
      }
    }

    // Swipe лаб
    if (startX < EDGE) hint.classList.add('show');
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // Sheet drag поён
    if (activeSheet) {
      const moved = e.touches[0].clientY - sheetStartY;
      if (moved > 0) {
        activeSheet.style.transform = `translateY(${moved}px)`;
        dragging = true;
      }
      return;
    }

    // Swipe лаб — indicator
    if (startX < EDGE && dx > 0) {
      hint.style.width = Math.min(dx / 2.5, 14) + 'px';
      dragging = true;
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const endX  = e.changedTouches[0].clientX;
    const endY  = e.changedTouches[0].clientY;
    const dx    = endX - startX;
    const dy    = Math.abs(endY - startY);
    const dt    = Date.now() - startTime;

    // Reset hint
    hint.classList.remove('show');
    hint.style.width = '4px';

    // ── Sheet drag release ──
    if (activeSheet) {
      const moved = endY - sheetStartY;
      activeSheet.style.transition = '';
      if (moved > 100 || (moved > 40 && dt < 250)) {
        // Пӯшидан
        activeSheet.style.transform = '';
        const overlay = activeSheet.closest('.overlay');
        if (overlay) {
          overlay.style.transition = 'opacity 0.2s';
          overlay.style.opacity   = '0';
          setTimeout(() => {
            overlay.classList.remove('open');
            overlay.style.opacity = '';
            overlay.style.transition = '';
          }, 200);
        }
      } else {
        // Бозгашт
        activeSheet.style.transform = '';
      }
      activeSheet = null;
      return;
    }

    // ── Swipe аз лаби чап ──
    if (startX < EDGE && dx > MIN_DX && dy < MAX_DY) {
      const opened = [...qsa('.overlay.open')];
      if (opened.length) {
        // Overlay пӯшидан бо animation
        const top = opened[opened.length - 1];
        const sh  = top.querySelector('.sheet');
        if (sh) {
          sh.style.transition = 'transform 0.25s ease';
          sh.style.transform  = 'translateY(110%)';
          setTimeout(() => {
            top.classList.remove('open');
            sh.style.transition = '';
            sh.style.transform  = '';
          }, 250);
        } else {
          top.classList.remove('open');
        }
      }
    }

    dragging = false;
  }, { passive: true });

  // ── Hardware back button (Android) ──
  window.addEventListener('popstate', () => {
    const opened = [...qsa('.overlay.open')];
    if (opened.length) {
      opened[opened.length - 1].classList.remove('open');
    }
  });

  // History entry барои back button
  history.pushState({ tjapps: true }, '');
  window.addEventListener('popstate', () => {
    history.pushState({ tjapps: true }, '');
  });
}

// ── UTILS ─────────────────────────────────────────────────
const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function getYouTubeId(url) {
  const r = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return r ? r[1] : null;
}

function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ── START ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
     
