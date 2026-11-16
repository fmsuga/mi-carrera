import { subscribe } from './state.js';
import { renderAll, renderMats, renderBackups } from './render.js';
import { initActions } from './actions.js';
import { hydrateIcons } from './ui.js';
const $=id => document.getElementById(id);
function navigate() {
  const page=['inicio','materias','configuracion'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
  document.querySelectorAll('.page').forEach(el => { el.hidden=el.id !== 'page-'+page; el.classList.toggle('active',!el.hidden); });
  document.querySelectorAll('.tab').forEach(el => { const active=el.dataset.page === page; el.classList.toggle('active',active); if (active) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  if (page === 'configuracion') renderBackups();
}
function filter() {
  const open = [...document.querySelectorAll('#mat-list details[open]')].map(el => el.id);
  renderMats();
  open.forEach(id => { const el=$(id); if (el) el.open=true; });
}
hydrateIcons(); initActions();
subscribe(renderAll); renderAll();
$('year-1').open=true;
$('today-label').textContent=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
$('search').addEventListener('input',filter);
$('status-filter').addEventListener('change',filter);
window.addEventListener('hashchange',navigate); navigate();
// Old browser-held Telegram secrets are obsolete. Academic state is untouched.
try { localStorage.removeItem('ap2_tgt'); localStorage.removeItem('ap2_tgc'); } catch { /* State reader already reports unavailable storage. */ }
