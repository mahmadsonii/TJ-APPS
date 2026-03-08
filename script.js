/* ════════════════════════════════════════════
   TJ APPS — script.js  (clean build)
   ════════════════════════════════════════════ */

// ── CONFIG (танҳо инҷо иваз кунед) ──────────
const GH_USER = 'mahmadsonii';
const GH_REPO = 'TJ-APPS-';
// ─────────────────────────────────────────────

const EMOJIS = '📦 📱 💬 🎮 🎵 🎬 📷 🌐 🔧 📊 🗺️ 🛒 💳 📚 🔐 🏥 ✈️ 🎯 🔥 ⭐ 💡 🎨 🖥️ 📡 🎁 🎤 📰 🏋️ 🍔 🚗 💰 🎲 🧩 📺 🔋 📍 🌙 ☀️ 🎉 🦁 🐉 ⚽ 🏀 🎾 🏆 🕹️ 🧸 🦊 🐼 🌊'.split(' ');
const COLORS = ['#0d2b1f','#0d1f2b','#1f0d2b','#2b1f0d','#0d2b2b','#1a0d0d','#0d0d2b','#1a1a0d'];

let CFG   = {};
let apps  = [];
let admin = false;
let selIcon = '📦';
let selImgUrl = null;

// ── HELPERS ──────────────────────────────────
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
const rndColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

function ytId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

// ── TOAST ─────────────────────────────────────
let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast');
  clearTimeout(toastTimer);
  t.textContent = msg;
  t.className = 'toast on' + (err ? ' err' : '');
  toastTimer = setTimeout(() => { t.className = 'toast'; }, 2800);
}

// ── OVERLAY ───────────────────────────────────
function openOv(id)  { $('#' + id).classList.add('on'); }
function closeOv(id) { $('#' + id).classList.remove('on'); }

// ── GITHUB ────────────────────────────────────
function rawUrl() {
  return `https://raw.githubusercontent.com/${GH_USER}/${GH_REPO}/main/data.json?t=${Date.now()}`;
}
function apiUrl() {
  return `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/data.json`;
}

async function loadApps() {
  showLoader();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(rawUrl(), { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const txt = await res.text();
    apps = txt.trim() ? JSON.parse(txt) : [];
  } catch (e) {
    apps = [];
    if (e.name === 'AbortError') toast('⚠️ Интернет суст — дубора кӯшиш кунед', true);
  }
  renderAll();
}

async function saveGH() {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(apps, null, 2))));
  let sha = '';
  try {
    const r = await fetch(apiUrl(), {
      headers: { Authorization: `token ${CFG.token}`, Accept: 'application/vnd.github.v3+json' }
    });
    if (r.ok) sha = (await r.json()).sha;
  } catch {}

  const body = { message: 'update', content };
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
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || 'GitHub хато');
  }
}

// ── RENDER ────────────────────────────────────
function showLoader() {
  const h = `<div class="loader"><div class="spinner"></div>Бор мешавад...</div>`;
  $('#apps-list').innerHTML = h;
  $('#games-list').innerHTML = h;
}

function renderAll() {
  $('#apps-list').innerHTML  = buildGrid(apps.filter(a => a.cat === 'app'))  || empty('Ҳоло барномае нест');
  $('#games-list').innerHTML = buildGrid(apps.filter(a => a.cat === 'game')) || empty('Ҳоло бозие нест');
}

function buildGrid(list) {
  if (!list.length) return '';
  return `<div class="grid">${list.map(a => cellHTML(a, apps.indexOf(a))).join('')}</div>`;
}

function cellHTML(a, idx) {
  const ico = a.iconUrl ? `<img src="${esc(a.iconUrl)}" alt="">` : (a.icon || '📦');
  return `
    <div class="cell" onclick="openDetail(${idx})">
      ${a.version ? `<div class="cell-ver">v${esc(a.version)}</div>` : ''}
      <div class="cell-icon" style="background:${a.color || '#161616'}">${ico}</div>
      <div class="cell-name">${esc(a.name)}</div>
      ${a.size ? `<div class="cell-size">${esc(a.size)}</div>` : ''}
    </div>`;
}

function empty(msg) {
  return `<div class="empty"><div class="eico">📭</div><div class="etxt">${msg}<br><small style="opacity:.4;font-size:.75rem">Admin шавед ва APK илова кунед</small></div></div>`;
}

// ── TABS ──────────────────────────────────────
function switchTab(name, el) {
  $$('.tab').forEach(t => t.classList.remove('on'));
  $$('.nbtn').forEach(b => b.classList.remove('on'));
  $('#tab-' + name).classList.add('on');
  el.classList.add('on');
  if (name === 'search') setTimeout(() => $('#sinput').focus(), 200);
}

// ── SEARCH ────────────────────────────────────
function doSearch() {
  const q = $('#sinput').value.toLowerCase().trim();
  if (!q) { $('#sresults').innerHTML = ''; return; }
  const found = apps.filter(a => a.name.toLowerCase().includes(q));
  $('#sresults').innerHTML = found.length
    ? buildGrid(found)
    : `<div class="empty"><div class="eico">🔍</div><div class="etxt">"${esc(q)}" ёфт нашуд</div></div>`;
}

// ── ADMIN / SETUP ─────────────────────────────
function loadCFG() {
  try { CFG = JSON.parse(localStorage.getItem('tjapps') || '{}'); } catch { CFG = {}; }
  CFG.user = GH_USER;
  CFG.repo = GH_REPO;
}

function saveCFG() {
  localStorage.setItem('tjapps', JSON.stringify(CFG));
}

function openAdmin() {
  if (!CFG.token || !CFG.pass) {
    openOv('ov-setup'); return;
  }
  $('#pinput').value = '';
  $('#perr').style.display = 'none';
  openOv('ov-pass');
  setTimeout(() => $('#pinput').focus(), 280);
}

function saveSetup() {
  const tok  = $('#setup-token').value.trim();
  const pass = $('#setup-pass').value.trim();
  if (!tok || !pass) { toast('❌ Token ва Паролро ворид кунед!', true); return; }
  CFG.token = tok;
  CFG.pass  = pass;
  saveCFG();
  closeOv('ov-setup');
  toast('✅ Танзим сохта шуд!');
  $('#pinput').value = '';
  $('#perr').style.display = 'none';
  openOv('ov-pass');
  setTimeout(() => $('#pinput').focus(), 280);
}

function checkPass() {
  if ($('#pinput').value === CFG.pass) {
    admin = true;
    closeOv('ov-pass');
    $('#hbtn').classList.add('on');
    openAdd();
  } else {
    $('#perr').style.display = 'block';
    $('#pinput').value = '';
    $('#pinput').focus();
  }
}

// ── ADD APP ───────────────────────────────────
function openAdd() {
  $('#f-name').value = '';
  $('#f-ver').value  = '';
  $('#f-size').value = '';
  $('#f-url').value  = '';
  $('#f-desc').value = '';
  $('#f-vid').value  = '';
  $('#f-cat').value  = 'app';
  selIcon = '📦'; selImgUrl = null;
  $('#icprev').innerHTML = '<span>📦</span>';
  $('#epicker').style.display = 'none';
  $('#srow').classList.remove('on');
  $('#addbtn').disabled = false;
  openOv('ov-add');
}

async function addApp() {
  const name = $('#f-name').value.trim();
  if (!name) { toast('❌ Ном ворид кунед!', true); return; }

  const app = {
    name,
    icon:    selImgUrl ? '' : selIcon,
    iconUrl: selImgUrl || null,
    version: $('#f-ver').value.trim(),
    size:    $('#f-size').value.trim(),
    cat:     $('#f-cat').value,
    url:     $('#f-url').value.trim(),
    desc:    $('#f-desc').value.trim(),
    video:   $('#f-vid').value.trim(),
    color:   rndColor(),
    added:   Date.now()
  };

  $('#addbtn').disabled = true;
  $('#srow').classList.add('on');

  try {
    apps.unshift(app);
    await saveGH();
    renderAll();
    closeOv('ov-add');
    toast('✅ ' + app.name + ' илова шуд!');
  } catch (e) {
    apps.shift();
    toast('❌ ' + e.message, true);
  } finally {
    $('#addbtn').disabled = false;
    $('#srow').classList.remove('on');
  }
}

async function deleteApp(idx) {
  if (!confirm('Нест кунед?')) return;
  const removed = apps.splice(idx, 1);
  try {
    await saveGH();
    renderAll();
    closeOv('ov-detail');
    toast('🗑️ Нест шуд');
  } catch (e) {
    apps.splice(idx, 0, ...removed);
    toast('❌ ' + e.message, true);
  }
}

// ── DETAIL ────────────────────────────────────
function openDetail(idx) {
  const a = apps[idx];
  if (!a) return;

  const ico = a.iconUrl ? `<img src="${esc(a.iconUrl)}" alt="">` : (a.icon || '📦');

  const dlBtn = a.url
    ? `<a href="${esc(a.url)}" class="bdl" target="_blank" rel="noopener">⬇ СКАЧАТИ APK${a.size ? ' — ' + esc(a.size) : ''}</a>`
    : `<button class="bdl off">⬇ Линк нест</button>`;

  let videoHTML = '';
  if (a.video) {
    const vid = ytId(a.video);
    videoHTML = vid
      ? `<div class="vwrap"><iframe src="https://www.youtube.com/embed/${vid}" frameborder="0" allowfullscreen allow="autoplay;encrypted-media"></iframe></div>`
      : `<div class="vwrap"><video controls playsinline><source src="${esc(a.video)}"></video></div>`;
  }

  const descHTML = a.desc ? `<div class="adesc">${esc(a.desc)}</div>` : '';
  const adminBtns = admin ? `<div class="sep"></div><button class="bd" onclick="deleteApp(${idx})">🗑️ Нест кардан</button>` : '';

  $('#detail-content').innerHTML = `
    <div class="dtop">
      <div class="dico" style="background:${a.color || '#161616'}">${ico}</div>
      <div>
        <div class="dname">${esc(a.name)}</div>
        <div class="dcat">${a.cat === 'game' ? '🎮 Бозӣ' : '📱 Барнома'}</div>
      </div>
    </div>
    <div class="dmeta">
      <div class="dmc"><div class="dml">Версия</div><div class="dmv">${esc(a.version) || '—'}</div></div>
      <div class="dmc"><div class="dml">Андоза</div><div class="dmv">${esc(a.size) || '—'}</div></div>
      <div class="dmc"><div class="dml">Навъ</div><div class="dmv">${a.cat === 'game' ? '🎮' : '📱'}</div></div>
    </div>
    ${dlBtn}
    ${videoHTML}
    ${descHTML}
    ${adminBtns}
    <button class="bs" onclick="closeOv('ov-detail')" style="margin-top:10px">✕ Пӯшидан</button>
  `;
  openOv('ov-detail');
}

// ── ICON PICKER ───────────────────────────────
function handleImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    selImgUrl = e.target.result;
    $('#icprev').innerHTML = `<img src="${selImgUrl}" alt="">`;
  };
  reader.readAsDataURL(file);
}

function buildEmojiGrid() {
  $('#egrid').innerHTML = EMOJIS.map(e =>
    `<button class="ebtn" onclick="pickEmoji('${e}')">${e}</button>`
  ).join('');
}

function toggleEp() {
  const p = $('#epicker');
  p.style.display = p.style.display === 'none' ? 'block' : 'none';
}

function pickEmoji(e) {
  selIcon = e; selImgUrl = null;
  $('#icprev').innerHTML = `<span>${e}</span>`;
  $('#epicker').style.display = 'none';
  $$('.ebtn').forEach(b => b.classList.remove('sel'));
}

// ── PULL TO REFRESH ───────────────────────────
function setupPull() {
  let sy = 0, pulling = false;
  const ind = $('#pull');

  document.addEventListener('touchstart', e => {
    if (window.scrollY === 0 && !$$('.ov.on').length) sy = e.touches[0].clientY;
    else sy = 0;
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    if (!sy) return;
    const dy = e.touches[0].clientY - sy;
    if (dy > 10 && dy < 110) {
      pulling = true;
      ind.style.opacity = Math.min(dy / 60, 1);
      ind.style.transform = `translateX(-50%) translateY(${Math.min(dy - 10, 50)}px)`;
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!sy) return;
    const dy = e.changedTouches[0].clientY - sy;
    ind.style.opacity = '0';
    ind.style.transform = 'translateX(-50%) translateY(0)';
    if (pulling && dy > 65) { loadApps(); toast('🔄 Навсозӣ...'); }
    sy = 0; pulling = false;
  }, { passive: true });
}

// ── SWIPE & DRAG ──────────────────────────────
function setupGestures() {
  let sx = 0, sy = 0, st = 0;
  let dragSheet = null, dragSY = 0;
  const hint = $('#shint');

  function topSheet() {
    const ovs = $$('.ov.on');
    return ovs.length ? ovs[ovs.length - 1].querySelector('.sheet') : null;
  }

  function closeTop(animated = true) {
    const ovs = $$('.ov.on');
    if (!ovs.length) return;
    const ov = ovs[ovs.length - 1];
    const sh = ov.querySelector('.sheet');
    if (animated && sh) {
      sh.style.transition = 'transform .25s ease';
      sh.style.transform  = 'translateY(115%)';
      setTimeout(() => {
        ov.classList.remove('on');
        sh.style.transition = '';
        sh.style.transform  = '';
      }, 240);
    } else {
      ov.classList.remove('on');
    }
  }

  document.addEventListener('touchstart', e => {
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    st = Date.now();
    dragSheet = null;

    // Sheet handle drag
    const sh = topSheet();
    if (sh) {
      const rect = sh.getBoundingClientRect();
      if (e.touches[0].clientY <= rect.top + 60) {
        dragSheet = sh;
        dragSY = e.touches[0].clientY;
        sh.style.transition = 'none';
      }
    }
    if (sx < 36) hint.classList.add('on');
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    // Sheet drag
    if (dragSheet) {
      const moved = e.touches[0].clientY - dragSY;
      if (moved > 0) dragSheet.style.transform = `translateY(${moved}px)`;
      return;
    }
    // Edge hint
    if (sx < 36) {
      const dx = e.touches[0].clientX - sx;
      if (dx > 0) hint.style.width = Math.min(dx / 2.5, 14) + 'px';
    }
  }, { passive: true });

  document.addEventListener('touchend', e => {
    hint.classList.remove('on');
    hint.style.width = '4px';

    const ex = e.changedTouches[0].clientX;
    const ey = e.changedTouches[0].clientY;
    const dx = ex - sx;
    const dy = Math.abs(ey - sy);
    const dt = Date.now() - st;

    // Sheet drag release
    if (dragSheet) {
      const moved = ey - dragSY;
      dragSheet.style.transition = '';
      if (moved > 90 || (moved > 40 && dt < 300)) {
        dragSheet.style.transform = '';
        const ov = dragSheet.closest('.ov');
        if (ov) {
          ov.style.transition = 'opacity .2s';
          ov.style.opacity = '0';
          setTimeout(() => { ov.classList.remove('on'); ov.style.opacity = ''; ov.style.transition = ''; }, 200);
        }
      } else {
        dragSheet.style.transform = '';
      }
      dragSheet = null;
      return;
    }

    // Edge swipe back
    if (sx < 36 && dx > 55 && dy < 90) closeTop(true);
  }, { passive: true });

  // Android back button
  history.pushState({ tj: 1 }, '');
  window.addEventListener('popstate', () => {
    if ($$('.ov.on').length) {
      closeTop(true);
    }
    history.pushState({ tj: 1 }, '');
  });
}

// ── OVERLAY BACKGROUND CLOSE ──────────────────
function setupOvClose() {
  $$('.ov').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.remove('on');
    });
  });
}

// ── INIT ──────────────────────────────────────
function init() {
  loadCFG();
  buildEmojiGrid();
  setupGestures();
  setupPull();
  setupOvClose();
  loadApps();
}

document.addEventListener('DOMContentLoaded', init);
   
