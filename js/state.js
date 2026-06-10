/**
 * state.js
 * Toda la lógica de persistencia y acceso al estado de la app.
 * Nada aquí toca el DOM. Nada de render.js toca localStorage directamente.
 *
 * Estructura de state[nombreMateria]:
 *   e    → 'pendiente' | 'en-curso' | 'aprobada' | 'desaprobada'
 *   nota → number | null
 *   exs  → [{ tipo, fecha, nota }]
 *
 * Otros requisitos se guardan como state['_otro_<id>']:
 *   valor → 'pendiente' | 'en-curso' | 'acreditado'
 */

const STORAGE_KEY = 'ap2_state';

// Estado global en memoria — se hidrata desde localStorage al init
let state = _loadFromStorage();

function _loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ── Materias ──────────────────────────────────────────────────

/** Devuelve el estado de una materia (con defaults si no existe). */
function ms(nombre) {
  return state[nombre] || { e: 'pendiente', nota: null, exs: [] };
}

/** Actualiza parcialmente el estado de una materia y persiste. */
function setMs(nombre, datos) {
  state[nombre] = { ...ms(nombre), ...datos };
  saveState();
}

// ── Otros requisitos ──────────────────────────────────────────

function stateOtro(id) {
  return state['_otro_' + id] || 'pendiente';
}

function setOtro(id, estado) {
  state['_otro_' + id] = estado;
  saveState();
}

// ── Estadísticas globales ─────────────────────────────────────

/**
 * Calcula stats sobre las materias del PLAN principal (excluye _otro_).
 * Retorna: { ap, cur, pen, prom, hAp }
 */
function stats() {
  let ap = 0, cur = 0, sumaNotas = 0, hAp = 0;

  PLAN.forEach(m => {
    const s = ms(m.n);
    if (s.e === 'aprobada') {
      ap++;
      hAp += m.h;
      if (s.nota) sumaNotas += s.nota;
    }
    if (s.e === 'en-curso') cur++;
  });

  return {
    ap,
    cur,
    pen: TOTAL_M - ap - cur,
    prom: ap > 0 ? sumaNotas / ap : null,
    hAp,
  };
}

// ── Import / Export ───────────────────────────────────────────

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'mi_carrera_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  toast('Backup exportado');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      state = JSON.parse(ev.target.result);
      saveState();
      renderDash();
      renderMats();
      toast('Datos importados');
    } catch {
      toast('Archivo inválido');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function resetState() {
  state = {};
  saveState();
}
