/**
 * actions.js
 * Lógica de negocio: qué pasa cuando el usuario hace algo.
 * Llama a state.js para persistir y a render.js para actualizar el DOM.
 * Aquí van las reglas académicas (bloqueos, correlativas, Inglés).
 */

// ── Reglas de bloqueo ─────────────────────────────────────────

/**
 * Devuelve un string con el motivo de bloqueo si la materia no puede activarse,
 * o null si está habilitada.
 */
function bloqueoActivar(nombre) {
  const m = PLAN.find(x => x.n === nombre);
  if (!m) return null;

  // Correlativas sin aprobar
  const corrFaltante = m.r.find(c => ms(c).e !== 'aprobada');
  if (corrFaltante) return `Correlativa pendiente: ${corrFaltante}`;

  // Inglés I → bloquea 2° cuatrimestre de 2° año
  if (m.a === 2 && m.c === 2 && !m.n.startsWith('Inglés')) {
    if (ms('Inglés I').e !== 'aprobada')
      return 'Requiere Inglés I aprobado (condición para cursar el 2° cuatrimestre de 2° año).';
  }
  // Inglés II → bloquea 1° cuatrimestre de 3° año
  if (m.a === 3 && m.c === 1 && !m.n.startsWith('Inglés')) {
    if (ms('Inglés II').e !== 'aprobada')
      return 'Requiere Inglés II aprobado (condición para cursar el 1° cuatrimestre de 3° año).';
  }
  // Inglés III → bloquea 2° cuatrimestre de 3° año
  if (m.a === 3 && m.c === 2 && !m.n.startsWith('Inglés')) {
    if (ms('Inglés III').e !== 'aprobada')
      return 'Requiere Inglés III aprobado (condición para cursar el 2° cuatrimestre de 3° año).';
  }
  // Inglés II requiere Inglés I
  if (m.n === 'Inglés II' && ms('Inglés I').e !== 'aprobada')
    return 'Requiere Inglés I aprobado.';
  // Inglés III requiere Inglés II
  if (m.n === 'Inglés III' && ms('Inglés II').e !== 'aprobada')
    return 'Requiere Inglés II aprobado.';

  return null;
}

// ── Acciones sobre materias ───────────────────────────────────

function activar(nombre) {
  const bloqueo = bloqueoActivar(nombre);
  if (bloqueo) { toast('🔒 ' + bloqueo); return; }
  setMs(nombre, { e: 'en-curso' });
  refreshMat(nombre);
  renderDash();
  toast(nombre + ' activada');
}

function revertir(nombre) {
  setMs(nombre, { e: 'pendiente', nota: null, exs: [] });
  refreshMat(nombre);
  renderDash();
  toast('Revertida a pendiente');
}

function desaprobar(nombre) {
  setMs(nombre, { e: 'desaprobada', nota: null });
  refreshMat(nombre);
  renderDash();
  toast('Marcada como desaprobada');
}

function aprobar(nombre) {
  openModal('Aprobar materia', `
    <div class="field-group">
      <label class="field-label">Nota final (4 a 10)</label>
      <input class="field-input" type="number" id="ni" min="4" max="10" step="0.25" placeholder="ej: 7">
    </div>`, [
    { l: 'Cancelar', c: 'btn', f: closeModal },
    { l: '✓ Aprobar', c: 'btn primary', f: () => {
        const v = parseFloat(document.getElementById('ni').value);
        if (!v || v < 4 || v > 10) { toast('Nota inválida'); return; }
        setMs(nombre, { e: 'aprobada', nota: v });
        closeModal();
        refreshMat(nombre);
        renderDash();
        toast('¡' + nombre + ' aprobada con ' + v + '!');
      }
    },
  ]);
  setTimeout(() => document.getElementById('ni')?.focus(), 120);
}

// ── Acciones sobre exámenes ───────────────────────────────────

function addEx(nombre) {
  openModal('Agregar examen', `
    <div class="field-group">
      <label class="field-label">Tipo de examen</label>
      <select class="field-input" id="et">
        <option>Parcial 1</option><option>Parcial 2</option>
        <option>Recuperatorio 1</option><option>Recuperatorio 2</option>
        <option>Final</option>
      </select>
    </div>
    <div class="field-group">
      <label class="field-label">Fecha</label>
      <input class="field-input" type="date" id="ef">
    </div>`, [
    { l: 'Cancelar', c: 'btn', f: closeModal },
    { l: 'Agregar', c: 'btn primary', f: () => {
        const tipo  = document.getElementById('et').value;
        const fecha = document.getElementById('ef').value;
        const s = ms(nombre);
        setMs(nombre, { exs: [...(s.exs || []), { tipo, fecha, nota: null }] });
        closeModal();
        refreshMat(nombre);
        renderDash();
        toast('Examen agregado');
      }
    },
  ]);
}

function notaEx(nombre, idx) {
  openModal('Nota del examen', `
    <div class="field-group">
      <label class="field-label">Nota (1 a 10)</label>
      <input class="field-input" type="number" id="nei" min="1" max="10" step="0.25" placeholder="ej: 6">
    </div>`, [
    { l: 'Cancelar', c: 'btn', f: closeModal },
    { l: 'Guardar', c: 'btn primary', f: () => {
        const v = parseFloat(document.getElementById('nei').value);
        if (!v || v < 1 || v > 10) { toast('Nota inválida'); return; }
        const s = ms(nombre);
        s.exs[idx].nota = v;
        setMs(nombre, { exs: s.exs });
        closeModal();
        refreshMat(nombre);
        toast('Nota guardada');
      }
    },
  ]);
  setTimeout(() => document.getElementById('nei')?.focus(), 120);
}

function delEx(nombre, idx) {
  const s = ms(nombre);
  s.exs.splice(idx, 1);
  setMs(nombre, { exs: s.exs });
  refreshMat(nombre);
  renderDash();
  toast('Examen eliminado');
}

// ── Otros requisitos ──────────────────────────────────────────

function activarOtro(id) {
  const r = OTROS.find(x => x.id === id);
  if (r && !r.unlock()) {
    toast('🔒 ' + (typeof r.lockMsg === 'function' ? r.lockMsg() : r.lockMsg));
    return;
  }
  setOtro(id, 'en-curso');
  refreshOtros();
  toast('Iniciado');
}

function acreditarOtro(id) {
  setOtro(id, 'acreditado');
  refreshOtros();
  toast('¡Acreditado!');
}

function revertirOtro(id) {
  setOtro(id, 'pendiente');
  refreshOtros();
  toast('Revertido a pendiente');
}

// ── Telegram ──────────────────────────────────────────────────

function saveTG() {
  const t = document.getElementById('tg-token').value.trim();
  const c = document.getElementById('tg-chatid').value.trim();
  localStorage.setItem('ap2_tgt', t);
  localStorage.setItem('ap2_tgc', c);
  updTGBadge();
  toast('Guardado');
}

function clearTG() {
  localStorage.removeItem('ap2_tgt');
  localStorage.removeItem('ap2_tgc');
  document.getElementById('tg-token').value = '';
  document.getElementById('tg-chatid').value = '';
  updTGBadge();
  toast('Credenciales eliminadas');
}

async function testTG() {
  const t = localStorage.getItem('ap2_tgt');
  const c = localStorage.getItem('ap2_tgc');
  if (!t || !c) { toast('Configurá token y chat ID primero'); return; }
  try {
    const res = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: c, text: '✅ Todo funcionando. Tu tracker de la carrera está conectado.' }),
    });
    const data = await res.json();
    data.ok ? toast('Mensaje enviado') : toast('Error: ' + data.description);
  } catch {
    toast('No se pudo conectar con Telegram');
  }
}

/** Envía un mensaje silencioso al bot (para recordatorios). */
async function sendTG(texto) {
  const t = localStorage.getItem('ap2_tgt');
  const c = localStorage.getItem('ap2_tgc');
  if (!t || !c) return;
  fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: c, text: texto }),
  }).catch(() => {});
}

// ── Backup ────────────────────────────────────────────────────

function confirmReset() {
  openModal('Borrar todos los datos',
    `<p style="color:var(--text2);font-size:14px;line-height:1.6">
      Esto elimina permanentemente todas las notas, estados y exámenes.<br>No se puede deshacer.
    </p>`, [
    { l: 'Cancelar', c: 'btn', f: closeModal },
    { l: 'Sí, borrar todo', c: 'btn danger', f: () => {
        resetState();
        closeModal();
        renderDash();
        renderMats();
        toast('Datos borrados');
      }
    },
  ]);
}
