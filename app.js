/**
 * app.js
 * Punto de entrada: inicialización, navegación entre páginas,
 * toggles de acordeón, recordatorios y funciones utilitarias.
 */

// ── Utilidades ────────────────────────────────────────────────

/** Convierte un nombre de materia en un ID válido para el DOM. */
function eid(s) { return s.replace(/[^a-zA-Z0-9]/g, '_'); }

/** Escapa comillas simples para usar el nombre en atributos onclick. */
function esc(s) { return s.replace(/'/g, "\\'"); }

/** Formatea una fecha ISO (YYYY-MM-DD) como DD/MM/YYYY. */
function fmt(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Devuelve la clase CSS de color según la nota. */
function notaCls(n) {
  return n >= 7 ? 'nota-green' : n >= 4 ? 'nota-yellow' : 'nota-red';
}

// ── Toast ─────────────────────────────────────────────────────

let _toastTimer;

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── Navegación ────────────────────────────────────────────────

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── Acordeones ────────────────────────────────────────────────

function toggleYear(a) {
  document.getElementById('yb-' + a)?.classList.toggle('open');
}

function toggleMat(nombre) {
  const body = document.getElementById('mb-' + eid(nombre));
  body.classList.toggle('open');
  const chevron = document.getElementById('mch-' + eid(nombre));
  if (chevron) chevron.style.transform = body.classList.contains('open') ? 'rotate(180deg)' : '';
}

function toggleReq(id) {
  const body    = document.getElementById('reqb-' + id);
  const chevron = document.getElementById('reqch-' + id);
  body.classList.toggle('open');
  if (chevron) chevron.style.transform = body.classList.contains('open') ? 'rotate(180deg)' : '';
}

// ── Recordatorios por Telegram ────────────────────────────────

/**
 * Se ejecuta una vez por día (al abrir la app).
 * Envía mensaje a Telegram si hay examen hoy o mañana.
 */
function checkRecordatorios() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const hoyStr = hoy.toISOString().slice(0, 10);
  const KEY = 'ap2_last_chk';
  if (localStorage.getItem(KEY) === hoyStr) return; // ya se chequeó hoy
  localStorage.setItem(KEY, hoyStr);

  PLAN.forEach(m => {
    const s = ms(m.n);
    (s.exs || []).forEach(ex => {
      if (!ex.fecha || ex.nota) return;
      const f = new Date(ex.fecha + 'T00:00:00');
      const d = Math.round((f - hoy) / 86400000);
      if (d === 0) sendTG(`📝 Hoy tenés ${ex.tipo} de ${m.n}. Mucho ánimo.`);
      if (d === 1) sendTG(`📅 Mañana tenés ${ex.tipo} de ${m.n}. ¡A repasar!`);
    });
  });
}

// ── Inicialización ────────────────────────────────────────────

function init() {
  // Renderizar vistas
  renderDash();
  renderMats();

  // Restaurar campos de Telegram si ya estaban guardados
  const tgToken  = localStorage.getItem('ap2_tgt');
  const tgChatId = localStorage.getItem('ap2_tgc');
  if (tgToken)  document.getElementById('tg-token').value  = tgToken;
  if (tgChatId) document.getElementById('tg-chatid').value = tgChatId;
  updTGBadge();

  // Recordatorios (solo si Telegram está configurado)
  checkRecordatorios();
}

init();
