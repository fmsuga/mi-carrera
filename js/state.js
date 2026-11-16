import { normalizeState, applyCommand } from './core.js';
export const STORAGE_KEY = 'ap2_state';
let current = {};
let readError = '';
const listeners = new Set();
export const getState = () => current;
export const getReadError = () => readError;
export const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const emit = () => listeners.forEach(fn => fn());
export function backup(raw = localStorage.getItem(STORAGE_KEY) || '{}', reason = 'manual') {
  const key = `ap2_backup_${Date.now()}_${crypto.randomUUID()}_${reason}`;
  localStorage.setItem(key, raw);
  return key;
}
export function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw === null ? {} : JSON.parse(raw);
    const next = normalizeState(parsed);
    if (JSON.stringify(next) !== JSON.stringify(parsed)) {
      backup(raw, 'pre_migration_v2');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    current = next;
    readError = '';
  } catch (err) { readError = 'No se pudo leer o migrar el estado. Los datos originales siguen intactos. Exportá una copia para revisarlos. ' + err.message; }
  emit();
}
export async function dispatch(cmd) {
  if (readError) throw new Error('La escritura está protegida por un error de lectura. Exportá los datos originales.');
  const write = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const latest = normalizeState(JSON.parse(raw || '{}'));
    const next = applyCommand(latest,cmd);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    current = next; emit();
  };
  if (navigator.locks) return navigator.locks.request('ap2-state-write',write);
  return write();
}
export async function replaceLocal(data) {
  const next = normalizeState(data, true);
  const write = () => {
    backup(undefined,'pre_import');
    localStorage.setItem(STORAGE_KEY,JSON.stringify(next));
    current = next; readError = ''; emit();
  };
  if (navigator.locks) return navigator.locks.request('ap2-state-write',write);
  return write();
}
export function downloadJSON(raw, name) {
  const url = URL.createObjectURL(new Blob([raw],{type:'application/json'}));
  const a = document.createElement('a'); a.href=url; a.download=name; a.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
}
export function exportData() {
  const raw = readError ? localStorage.getItem(STORAGE_KEY) || '{}' : JSON.stringify(current,null,2);
  downloadJSON(raw,`mi-carrera-${new Date().toISOString().slice(0,10)}.json`);
}
window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY || event.key === null) { readLocal(); }
});
readLocal();
