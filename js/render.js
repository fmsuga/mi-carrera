import { SUBJECTS, OTROS, TOTAL_M, TOTAL_H, STATUS, ms, stats, bloqueoActivar, upcoming, daysUntil } from './core.js';
import { getState, getReadError } from './state.js';
import { icon, html, fmt, pct } from './ui.js';
const $ = id => document.getElementById(id);
const color = s => s === 'aprobada' ? 'green' : s === 'en-curso' ? 'yellow' : s === 'desaprobada' ? 'red' : 'muted';
const bar = value => `<div class="track"><span style="width:${Math.min(100,Math.max(0,value))}%"></span></div>`;
const action = (type, label, subject, cls = '', extra = '') => `<button class="btn ${cls}" data-action="${type}" data-subject="${subject}" ${extra}>${label}</button>`;

export function renderDash() {
  const data = getState(), s = stats(data);
  $('header-progress').textContent = pct(s.pct) + '%';
  const list = upcoming(data);
  const counts = [ ['check','green',s.ap,'Aprobadas'],['clock','yellow',s.cur,'En curso'],['book','blue',s.pen,'Pendientes'],['close','red',s.des,'Desaprobadas'] ];
  $('dashboard').innerHTML = `
    <div class="hero-grid">
      <article class="panel progress-card"><div class="ring" role="img" aria-label="${pct(s.pct)} por ciento de materias aprobadas"><svg viewBox="0 0 180 180" aria-hidden="true"><circle class="ring-track" cx="90" cy="90" r="78"/><circle class="ring-progress" cx="90" cy="90" r="78" pathLength="100" stroke-opacity="${s.ap ? 1 : 0}" stroke-dasharray="${s.pct} 100"/></svg><div class="ring-center"><div class="ring-value">${pct(s.pct)}<small>%</small></div><span class="ring-caption">DE TU CARRERA</span></div></div><div class="progress-copy"><div class="card-kicker">PROGRESO ACADÉMICO</div><h2>${s.ap} de ${TOTAL_M} materias</h2><p>${s.ap === TOTAL_M ? 'Completaste las materias del plan.' : 'aprobadas. Seguí construyendo tu camino.'}</p><div class="hours"><div class="bar-label"><span>Horas académicas</span><strong>${s.hAp.toLocaleString('es-AR')} / ${TOTAL_H.toLocaleString('es-AR')} h</strong></div>${bar(s.hourPct)}</div></div><p class="caption progress-note">Calculado sobre las ${TOTAL_M} materias del plan. Indicador informativo, sin validez de certificación oficial.</p></article>
      <article class="panel average-card"><div class="average-heading"><span class="card-kicker">PROMEDIO GENERAL</span>${icon('award')}</div><div class="average-value">${s.prom === null ? '—' : s.prom.toFixed(2).replace('.',',')} <small>/ 10</small></div><p class="average-note">${s.graded ? `Sobre ${s.graded} ${s.graded === 1 ? 'materia con nota final' : 'materias con nota final'}.` : 'Todavía no hay notas finales registradas.'}</p><div class="average-footer">Las aprobaciones sin nota no alteran tu promedio.</div></article>
    </div>
    <div class="stats-grid">${counts.map(([i,c,n,label]) => `<article class="panel stat-card"><div class="stat-icon ${c}">${icon(i)}</div><div><div class="stat-value">${n}</div><div class="stat-label">${label}</div></div></article>`).join('')}</div>
    <div class="lower-grid">
      <article class="panel"><div class="section-head"><div><h2>Próximos exámenes</h2><p>Tu agenda, en orden de prioridad.</p></div><a class="text-link" href="#materias">Ver materias ${icon('arrow')}</a></div>${list.length ? `<div class="exam-list">${list.map(ex => { const d = daysUntil(ex.fecha); const month = new Date(ex.fecha+'T12:00:00').toLocaleDateString('es-AR',{month:'short'}).replace('.',''); return `<div class="exam-item"><div class="exam-date"><strong>${ex.fecha.slice(8)}</strong><span>${month}</span></div><div class="exam-info"><h3>${html(ex.name)}</h3><p>${html(ex.tipo)} · ${fmt(ex.fecha)}</p></div><span class="pill ${d === 0 ? 'red' : d <= 7 ? 'yellow' : 'blue'}">${d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`}</span><button class="icon-btn" data-action="exam-edit" data-subject="${ex.subjectId}" data-id="${html(ex.id)}" aria-label="Editar ${html(ex.tipo)} de ${html(ex.name)}">${icon('edit')}</button></div>`; }).join('')}</div>` : `<div class="empty-state"><div class="empty-icon">${icon('calendar')}</div><h3>Un espacio para lo que viene</h3><p>Cuando registres un examen, vas a encontrar acá su fecha y cuánto falta.</p><a href="#materias" class="btn">${icon('plus')}Ir a mis materias</a></div>`}</article>
      <article class="panel"><div class="section-head"><div><h2>Hitos de tu carrera</h2><p>Dos objetivos que abren nuevas posibilidades.</p></div>${icon('cap')}</div><div class="milestones">${OTROS.map(r => { const goal = Math.ceil(TOTAL_M * r.threshold), left = Math.max(0,goal - s.ap); return `<div class="milestone"><div class="milestone-title"><span class="milestone-percentage">${r.threshold * 100}%</span><h3>${r.n}</h3>${icon(left ? 'lock' : 'check')}</div>${bar(s.ap / goal * 100)}<p>${left ? `Te ${left === 1 ? 'falta 1 materia' : `faltan ${left} materias`} para alcanzar este hito.` : '<span class="green">Hito alcanzado · Requisito habilitado</span>'} <span class="muted">${Math.min(s.ap,goal)} / ${goal}</span></p></div>`; }).join('')}</div></article>
    </div>
    <article class="panel year-overview"><div class="year-overview-head"><h2>Tu avance por año</h2><a class="text-link" href="#materias">Explorar plan ${icon('arrow')}</a></div><div class="year-mini-grid">${[1,2,3,4].map(year => { const mats = SUBJECTS.filter(m => m.a === year), ap = mats.filter(m => ms(data,m.n).e === 'aprobada').length; return `<div class="year-mini"><div class="bar-label"><strong>${year}.º año</strong><span>${pct(ap / mats.length * 100)}%</span></div>${bar(ap / mats.length * 100)}<p>${ap} de ${mats.length} aprobadas · Incluye idiomas</p></div>`; }).join('')}</div></article>`;
}
function subjectRow(m, data) {
  const s = ms(data,m.n), reason = bloqueoActivar(data,m.n);
  const btns = [];
  if (s.e !== 'aprobada' && s.e !== 'en-curso') btns.push(action('activate',icon('plus') + (s.e === 'desaprobada' ? 'Reintentar cursada' : 'Iniciar cursada'),m.id,'primary',reason ? 'disabled' : ''));
  if (s.e === 'en-curso') { btns.push(action('exam-add',icon('plus')+'Agregar examen',m.id)); btns.push(action('approve',icon('check')+'Aprobar',m.id,'success',reason ? 'disabled' : '')); btns.push(action('fail','Desaprobar',m.id,'danger')); }
  if (s.e === 'aprobada') btns.push(action(s.equivalencia ? 'equivalence' : 'approve','Editar aprobación',m.id));
  if (s.e !== 'aprobada') btns.push(action('equivalence','Aprobar por equivalencia',m.id));
  if (s.e !== 'pendiente') btns.push(action('revert',s.e === 'aprobada' ? 'Revertir aprobación' : 'Volver a pendiente',m.id,'small'));
  return `<details class="subject ${s.e}" id="subject-${m.id}"><summary class="subject-summary"><span class="state-mark"></span><span class="subject-name">${html(m.n)}<span class="subject-code">${m.id}</span></span><span class="subject-hours">${m.h} h</span><span class="pill ${color(s.e)}">${s.equivalencia && s.e === 'aprobada' ? 'Equivalencia' : STATUS[s.e]}</span><span class="subject-grade ${color(s.e)}">${s.nota == null ? '' : html(s.nota)}</span><span class="chevron">${icon('chevron')}</span></summary><div class="subject-detail"><div class="button-row">${btns.join('')}</div>${reason && s.e !== 'aprobada' ? `<p class="notice">${icon('lock')} ${html(reason)}${s.e === 'en-curso' ? ' Se conserva tu cursada registrada.' : ''}</p>` : ''}<div class="detail-grid"><div><h3>Correlativas</h3><div class="corr-list">${m.r.length ? m.r.map(n => `<span class="${ms(data,n).e === 'aprobada' ? 'green' : 'muted'}">${icon(ms(data,n).e === 'aprobada' ? 'check' : 'circle')}${html(n)}</span>`).join('') : '<p>Sin correlativas del plan.</p>'}</div></div><div><h3>Exámenes registrados</h3>${s.exs.length ? s.exs.map(ex => `<div class="exam-record"><div><strong>${html(ex.tipo)}${ex.cancelado ? ' · Cancelado' : ''}</strong><p>${fmt(ex.fecha)} · ${ex.nota == null ? 'Sin calificar' : 'Nota: '+html(ex.nota)}</p><code>${html(ex.id)}</code></div><div class="exam-record-actions"><button class="icon-btn" data-action="exam-edit" data-subject="${m.id}" data-id="${html(ex.id)}" aria-label="Editar ${html(ex.tipo)}">${icon('edit')}</button><button class="icon-btn" data-action="exam-delete" data-subject="${m.id}" data-id="${html(ex.id)}" aria-label="Eliminar ${html(ex.tipo)}">${icon('trash')}</button></div></div>`).join('') : '<p class="caption">Todavía no registraste exámenes.</p>'}</div></div></div></details>`;
}
export function renderMats() {
  const data = getState(), query = $('search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(), filter = $('status-filter').value;
  const matches = m => { const s = ms(data,m.n); return m.n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query) && (filter === 'all' || (filter === 'equivalencia' ? s.e === 'aprobada' && s.equivalencia : s.e === filter)); };
  const visible = SUBJECTS.filter(matches);
  $('result-count').textContent = `${visible.length} de ${TOTAL_M} materias`;
  $('plan-count').textContent = `${TOTAL_M} materias · ${TOTAL_H.toLocaleString('es-AR')} horas`;
  const groups = [1,2,3,4,'ing'].map(year => {
    const all = SUBJECTS.filter(m => year === 'ing' ? m.n.startsWith('Inglés') : m.a === year && !m.n.startsWith('Inglés'));
    const mats = all.filter(matches), ap = all.filter(m => ms(data,m.n).e === 'aprobada').length;
    if (!mats.length) return '';
    return `<details class="panel year-block" id="year-${year}" ${query || filter !== 'all' ? 'open' : ''}><summary class="year-summary"><span class="year-number">${year === 'ing' ? icon('book') : '0'+year}</span><div class="year-name"><h2>${year === 'ing' ? 'Idiomas' : ['Primer','Segundo','Tercer','Cuarto'][year-1]+' año'}</h2><p>${ap} de ${all.length} materias aprobadas</p></div><div class="year-progress"><div class="bar-label"><span>Avance</span><strong>${pct(ap/all.length*100)}%</strong></div>${bar(ap/all.length*100)}</div><span class="chevron">${icon('chevron')}</span></summary>${(year === 'ing' ? [null] : [1,2]).map(c => { const cm = mats.filter(m => c === null || m.c === c); return cm.length ? `${c ? `<div class="semester-label">${c === 1 ? 'Primer' : 'Segundo'} cuatrimestre</div>` : ''}${cm.map(m => subjectRow(m,data)).join('')}` : ''; }).join('')}</details>`;
  }).join('');
  $('mat-list').innerHTML = (visible.length ? groups : '<div class="panel empty-state"><div class="empty-icon">'+icon('search')+'</div><h3>No encontramos materias</h3><p>Probá otro nombre o cambiá el filtro.</p></div>') + renderOtros(data);
}
function renderOtros(data) {
  const s = stats(data);
  return `<div class="requirements-title"><h2>Otros requisitos</h2><p>Adicionales al total de materias y horas del plan.</p></div><div class="panel">${OTROS.map(r => { const e = data['_otro_'+r.id] || 'pendiente', left = Math.max(0,Math.ceil(TOTAL_M*r.threshold)-s.ap); return `<details class="subject" id="req-${r.id}"><summary class="subject-summary"><span class="state-mark"></span><div class="req-title"><strong>${r.n}</strong><p>${r.h} h · ${left ? `Faltan ${left} materias para habilitarlo` : 'Porcentaje requerido alcanzado'}</p></div><span class="pill ${e === 'acreditado' ? 'green' : e === 'en-curso' ? 'yellow' : 'muted'}">${e === 'acreditado' ? 'Acreditado' : e === 'en-curso' ? 'En curso' : 'Pendiente'}</span><span class="chevron">${icon('chevron')}</span></summary><div class="subject-detail"><p class="caption">${r.cond}</p><div class="button-row" style="margin-top:14px">${e === 'pendiente' ? `<button class="btn primary" data-action="requirement" data-id="${r.id}" data-status="en-curso" ${left ? 'disabled' : ''}>Iniciar</button>` : e === 'en-curso' ? `<button class="btn success" data-action="requirement" data-id="${r.id}" data-status="acreditado" ${left ? 'disabled' : ''}>Acreditar</button>` : ''}${e !== 'pendiente' ? `<button class="btn" data-action="requirement" data-id="${r.id}" data-status="pendiente">Volver a pendiente</button>` : ''}</div></div></details>`; }).join('')}</div>`;
}
export function renderAll() {
  const openIds = new Set([...document.querySelectorAll('#mat-list details[open]')].map(el => el.id));
  const active = document.activeElement;
  const focus = active && { id:active.id, action:active.dataset.action, subject:active.dataset.subject, exam:active.dataset.id, details:active.closest('details')?.id };
  const scroll = window.scrollY;
  renderDash(); renderMats();
  openIds.forEach(id => { const el = $(id); if (el) el.open = true; });
  $('data-warning').hidden = !getReadError(); $('data-warning').textContent = getReadError();
  if (!$('page-configuracion').hidden) renderBackups();
  if (focus && !active.isConnected) {
    const next = focus.id ? $(focus.id) : [...document.querySelectorAll('[data-action]')].find(el => el.dataset.action === focus.action && el.dataset.subject === focus.subject && el.dataset.id === focus.exam);
    (next || $(focus.details)?.querySelector('summary'))?.focus({preventScroll:true});
  }
  window.scrollTo({top:scroll,behavior:'instant'});
}
export function renderBackups() {
  let keys;
  try { keys = Object.keys(localStorage).filter(k => k.startsWith('ap2_backup_')).sort().reverse(); }
  catch { $('backup-list').textContent = 'El navegador no permite acceder al almacenamiento.'; return; }
  $('backup-list').innerHTML = keys.length ? keys.map((key) => `<div class="backup-item"><span>${new Date(Number(key.split('_')[2])).toLocaleString('es-AR')}<br>${key.includes('pre_import') ? 'Antes de importar' : key.includes('migration') ? 'Antes de migrar a V2' : 'Copia de seguridad'}</span><button class="btn small" data-action="backup-download" data-id="${html(key)}">Descargar JSON</button></div>`).join('') : '<p>No hay copias automáticas todavía.</p>';
}
