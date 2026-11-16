// Shared by the browser and Edge Functions. No DOM, storage or network access.
import { PLAN, OTROS, TOTAL_M, TOTAL_H } from './plan.js';
export { PLAN, OTROS, TOTAL_M, TOTAL_H };

// Explicit IDs: never derive bot identifiers from an array position.
export const SUBJECTS = PLAN;
export const EXAM_TYPES = ['Parcial 1','Parcial 2','Recuperatorio 1','Recuperatorio 2','Final'];
export const STATUS = { pendiente: 'Pendiente', 'en-curso': 'En curso', aprobada: 'Aprobada', desaprobada: 'Desaprobada' };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const grade = (value, min = 1) => (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= 10;
export const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value;
export function ms(data, name) { return { e: 'pendiente', nota: null, exs: [], ...data[name] }; }
export function stats(data) {
  let ap = 0, cur = 0, des = 0, hAp = 0, sum = 0, graded = 0;
  for (const m of SUBJECTS) {
    const s = ms(data, m.n);
    if (s.e === 'aprobada') { ap++; hAp += m.h; if (grade(s.nota, 4)) { sum += Number(s.nota); graded++; } }
    if (s.e === 'en-curso') cur++;
    if (s.e === 'desaprobada') des++;
  }
  return { ap, cur, des, pen: TOTAL_M - ap - cur - des, hAp, graded, prom: graded ? sum / graded : null, pct: ap / TOTAL_M * 100, hourPct: hAp / TOTAL_H * 100 };
}
export function bloqueoActivar(data, name) {
  const m = SUBJECTS.find(m => m.n === name);
  if (!m) return 'Materia desconocida.';
  const missing = m.r.filter(n => ms(data, n).e !== 'aprobada');
  if (missing.length) return 'Requiere aprobar: ' + missing.join(', ') + '.';
  const language = m.a === 2 && m.c === 2 ? 'Inglés I' : m.a === 3 && m.c === 1 ? 'Inglés II' : m.a === 3 && m.c === 2 ? 'Inglés III' : null;
  if (language && !m.n.startsWith('Inglés') && ms(data, language).e !== 'aprobada') return `Requiere ${language} aprobado para este cuatrimestre.`;
  return null;
}
function hash(text) { let h = 2166136261; for (let i=0; i<text.length; i++) h = Math.imul(h ^ text.charCodeAt(i),16777619); return (h >>> 0).toString(36); }
export function newExamId() { return 'ex-' + crypto.randomUUID(); }

// Additive migration only: retain every existing property, including unknown keys.
// Invalid input throws; callers must preserve its original bytes and stop writes.
export function normalizeState(input, strict = false) {
  if (!object(input)) throw new Error('El archivo debe contener un objeto de estado.');
  const data = structuredClone(input);
  const ids = new Set();
  for (const key of Object.keys(data)) {
    if (['__proto__','constructor','prototype'].includes(key)) throw new Error('Clave de datos no permitida.');
    const known = SUBJECTS.some(m => m.n === key);
    if (key.startsWith('_otro_')) {
      if (!['pendiente','en-curso','acreditado'].includes(data[key])) throw new Error(`Requisito inválido: ${key}.`);
      continue;
    }
    if (!known) { if (strict) throw new Error(`Registro desconocido: ${key}.`); continue; }
    const s = data[key];
    if (!object(s) || (s.e !== undefined && !Object.hasOwn(STATUS, s.e))) throw new Error(`Estado inválido en ${key}.`);
    if (s.nota != null && !grade(s.nota)) throw new Error(`Nota inválida en ${key}.`);
    if (s.equivalencia !== undefined && typeof s.equivalencia !== 'boolean') throw new Error(`Equivalencia inválida en ${key}.`);
    if (s.exs !== undefined && !Array.isArray(s.exs)) throw new Error(`Exámenes inválidos en ${key}.`);
    for (const [i, ex] of (s.exs || []).entries()) {
      if (!object(ex) || typeof ex.tipo !== 'string' || !ex.tipo.trim() || ex.tipo.length > 100 || (ex.fecha && !validDate(ex.fecha)) || (ex.nota != null && !grade(ex.nota))) throw new Error(`Examen inválido en ${key}.`);
      if (ex.cancelado !== undefined && typeof ex.cancelado !== 'boolean') throw new Error('Cancelación inválida.');
      if (!ex.id) ex.id = 'ex-' + hash(key + ':' + i + ':' + JSON.stringify(ex));
      if (typeof ex.id !== 'string' || !/^ex-[a-zA-Z0-9-]{1,80}$/.test(ex.id) || ids.has(ex.id)) throw new Error('Identificador de examen inválido o duplicado.');
      ids.add(ex.id);
    }
  }
  return data;
}
export function todayISO(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Argentina/Salta',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now);
  return ['year','month','day'].map(k => parts.find(p => p.type === k).value).join('-');
}
export function daysUntil(date, today = todayISO()) { return Math.round((Date.parse(date) - Date.parse(today)) / 86400000); }
export function exams(data) {
  return SUBJECTS.flatMap(m => ms(data,m.n).exs.map(ex => ({ ...ex, subjectId:m.id, name:m.n }))).sort((a,b) => (a.fecha || '9999').localeCompare(b.fecha || '9999'));
}
export function upcoming(data, today = todayISO()) { return exams(data).filter(ex => ex.fecha && ex.nota == null && !ex.cancelado && daysUntil(ex.fecha,today) >= 0); }

// Historical records survive a prerequisite reversal; new transitions recheck it.
export function applyCommand(input, cmd) {
  const data = normalizeState(input);
  if (!object(cmd)) throw new Error('Operación inválida.');
  if (cmd.type === 'requirement') {
    const req = OTROS.find(r => r.id === cmd.id);
    if (!req || !['pendiente','en-curso','acreditado'].includes(cmd.status)) throw new Error('Requisito inválido.');
    if (cmd.status !== 'pendiente' && stats(data).ap < Math.ceil(TOTAL_M * req.threshold)) throw new Error(req.cond);
    data['_otro_' + req.id] = cmd.status;
    return data;
  }
  const m = SUBJECTS.find(m => m.id === cmd.subject);
  if (!m) throw new Error('Identificador de materia desconocido. Consultá /materias.');
  const s = ms(data,m.n);
  const requireUnlocked = () => { const reason = bloqueoActivar(data,m.n); if (reason) throw new Error(reason); };
  if (cmd.type === 'activate') { requireUnlocked(); if (s.e === 'aprobada') throw new Error('Primero revertí la aprobación.'); s.e = 'en-curso'; }
  else if (cmd.type === 'approve' || cmd.type === 'equivalence') {
    // Equivalences certify prior studies and may unlock prerequisites themselves.
    if (cmd.type === 'approve') { requireUnlocked(); if (!grade(cmd.grade,4)) throw new Error('La nota final debe estar entre 4 y 10.'); }
    if (cmd.type === 'equivalence' && cmd.grade != null && !grade(cmd.grade,4)) throw new Error('La nota de equivalencia debe estar entre 4 y 10, o quedar vacía.');
    s.e = 'aprobada'; s.equivalencia = cmd.type === 'equivalence'; s.nota = cmd.grade == null ? null : Number(cmd.grade);
  } else if (cmd.type === 'revert') { s.e = 'pendiente'; s.nota = null; s.equivalencia = false; }
  else if (cmd.type === 'fail') { if (s.e !== 'en-curso') throw new Error('La materia debe estar en curso.'); s.e = 'desaprobada'; s.nota = null; s.equivalencia = false; }
  else if (cmd.type === 'exam-add') {
    requireUnlocked();
    if (s.e !== 'en-curso') throw new Error('Iniciá la cursada antes de agregar un examen.');
    if (!EXAM_TYPES.includes(cmd.kind) || !validDate(cmd.date)) throw new Error('Elegí un tipo y una fecha de examen válidos.');
    if (!cmd.id) throw new Error('Falta el identificador del examen.');
    s.exs = [...s.exs, { id:cmd.id, tipo:cmd.kind, fecha:cmd.date, nota:null }];
  } else if (['exam-edit','exam-delete','exam-grade'].includes(cmd.type)) {
    const ex = s.exs.find(ex => ex.id === cmd.id);
    if (!ex) throw new Error('El examen ya no existe. Actualizá la vista.');
    if (cmd.type === 'exam-delete') s.exs = s.exs.filter(ex => ex.id !== cmd.id);
    else if (cmd.type === 'exam-grade') { if (cmd.grade !== null && !grade(cmd.grade)) throw new Error('La nota debe estar entre 1 y 10.'); ex.nota = cmd.grade === null ? null : Number(cmd.grade); }
    else {
      if (!EXAM_TYPES.includes(cmd.kind) || !validDate(cmd.date) || (cmd.grade != null && !grade(cmd.grade))) throw new Error('Revisá tipo, fecha y nota (1 a 10).');
      ex.tipo = cmd.kind; ex.fecha = cmd.date; ex.nota = cmd.grade == null ? null : Number(cmd.grade);
    }
  } else throw new Error('Operación desconocida.');
  data[m.n] = s;
  return normalizeState(data);
}
