import { subscribe, getState } from './state.js';
import { SUBJECTS, ms } from './core.js';
import { renderAll, renderMats, renderBackups } from './render.js';
import { initActions } from './actions.js';
import { hydrateIcons } from './ui.js';
const $=id => document.getElementById(id);
let currentPage;
const pageScroll = new Map();
function navigate() {
  if (location.hash === '#main') return;
  const page=['inicio','materias','configuracion'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
  if (currentPage && currentPage !== page) pageScroll.set(currentPage,window.scrollY);
  document.querySelectorAll('.page').forEach(el => { el.hidden=el.id !== 'page-'+page; el.classList.toggle('active',!el.hidden); });
  document.querySelectorAll('.tab').forEach(el => { const active=el.dataset.page === page; el.classList.toggle('active',active); if (active) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
  if (page === 'configuracion') renderBackups();
  if (currentPage !== page) window.scrollTo({top:pageScroll.get(page) || 0,behavior:'instant'});
  currentPage = page;
}
function filter() {
  const open = [...document.querySelectorAll('#mat-list details[open]')].map(el => el.id);
  renderMats();
  open.forEach(id => { const el=$(id); if (el) el.open=true; });
}
hydrateIcons(); initActions();
subscribe(renderAll); renderAll();
const initialSubject = SUBJECTS.find(m => ms(getState(),m.n).e === 'en-curso') || SUBJECTS.find(m => ms(getState(),m.n).e !== 'aprobada') || SUBJECTS.at(-1);
$('year-' + (initialSubject.n.startsWith('Inglés') ? 'ing' : initialSubject.a)).open=true;
$('today-label').textContent=new Intl.DateTimeFormat('es-AR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
$('search').addEventListener('input',filter);
$('status-filter').addEventListener('change',filter);
window.addEventListener('hashchange',navigate); navigate();
// Old browser-held Telegram secrets are obsolete. Academic state is untouched.
try { localStorage.removeItem('ap2_tgt'); localStorage.removeItem('ap2_tgc'); } catch { /* State reader already reports unavailable storage. */ }
