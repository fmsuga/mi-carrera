import { SUBJECTS, OTROS, TOTAL_M, TOTAL_H, STATUS, ms, stats, bloqueoActivar, upcoming, daysUntil } from './core.js';
import { getState, getReadError } from './state.js';
import { icon, html, fmt, pct } from './ui.js';
const $ = id => document.getElementById(id);
const color = s => s === 'aprobada' ? 'green' : s === 'en-curso' ? 'yellow' : s === 'desaprobada' ? 'red' : 'muted';
const bar = value => `<div class="track"><span style="width:${Math.min(100,Math.max(0,value))}%"></span></div>`;
const action = (type, label, subject, cls = '', extra = '') => `<button class="btn ${cls}" data-action="${type}" data-subject="${subject}" ${extra}>${label}</button>`;

function examAgenda(list) {
  if (!list.length) return `<div class="empty-state"><h3>No hay exámenes programados</h3><p>Agregá un examen desde la materia que estás cursando para organizar tu próxima fecha.</p><a href="#materias" class="btn">Ir a Materias ${icon('arrow')}</a></div>`;
  let previousGroup;
  return `<div class="exam-list">${list.map(ex => {
    const days = daysUntil(ex.fecha);
    const group = days <= 7 ? 'En los próximos 7 días' : 'Más adelante';
    const heading = group !== previousGroup ? `<h3 class="agenda-group">${group}</h3>` : '';
    previousGroup = group;
    const month = new Date(ex.fecha+'T12:00:00').toLocaleDateString('es-AR',{month:'short'}).replace('.','');
    return `${heading}<div class="exam-item">
      <time class="exam-date" datetime="${ex.fecha}"><strong>${ex.fecha.slice(8)}</strong><span>${month}</span></time>
      <div class="exam-info"><h3>${html(ex.name)}</h3><p>${html(ex.tipo)} · ${fmt(ex.fecha)}</p></div>
      <span class="exam-timing ${days === 0 ? 'red' : days <= 7 ? 'yellow' : 'muted'}">${days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`}</span>
      <button class="icon-btn" data-action="exam-edit" data-subject="${ex.subjectId}" data-id="${html(ex.id)}" aria-label="Editar ${html(ex.tipo)} de ${html(ex.name)}">${icon('edit')}</button>
    </div>`;
  }).join('')}</div>`;
}

export function renderDash() {
  const data = getState(), s = stats(data), list = upcoming(data);
  $('header-progress').textContent = pct(s.pct) + '%';
  const counts = [ ['green',s.ap,'Aprobadas'],['yellow',s.cur,'En curso'],['muted',s.pen,'Pendientes'],[s.des ? 'red' : 'muted',s.des,'Desaprobadas'] ];
  $('dashboard').innerHTML = `
    <div class="hero-grid">
      <article class="panel progress-card">
        <div class="ring" role="img" aria-label="${pct(s.pct)} por ciento de materias aprobadas">
          <svg viewBox="0 0 180 180" aria-hidden="true"><circle class="ring-track" cx="90" cy="90" r="78"/><circle class="ring-progress" cx="90" cy="90" r="78" pathLength="100" stroke-opacity="${s.ap ? 1 : 0}" stroke-dasharray="${s.pct} 100"/></svg>
          <div class="ring-center"><div class="ring-value">${pct(s.pct)}<small>%</small></div><span class="ring-caption">DE LA CARRERA</span></div>
        </div>
        <div class="progress-copy">
          <div class="card-kicker">Materias aprobadas</div>
          <h2>${s.ap} <span>de ${TOTAL_M}</span></h2>
          <p>${s.ap === TOTAL_M ? 'Completaste las materias del plan.' : `Te ${TOTAL_M - s.ap === 1 ? 'queda 1 materia' : `quedan ${TOTAL_M - s.ap} materias`} del plan.`}</p>
          <div class="hours"><div class="bar-label"><span>Horas académicas</span><strong>${s.hAp.toLocaleString('es-AR')} / ${TOTAL_H.toLocaleString('es-AR')} h</strong></div>${bar(s.hourPct)}</div>
        </div>
        <p class="caption progress-note">Porcentaje sobre las ${TOTAL_M} materias del plan. Sin validez de certificación oficial.</p>
      </article>
      <article class="panel average-card">
        <div class="average-heading"><h2>Promedio general</h2><div class="average-value">${s.prom === null ? '—' : s.prom.toFixed(2).replace('.',',')} <small>/ 10</small></div></div>
        <p class="average-note">${s.graded ? `Sobre ${s.graded} ${s.graded === 1 ? 'materia con nota final' : 'materias con nota final'}.` : 'Todavía no hay notas finales.'} Las aprobaciones sin nota no alteran el promedio.</p>
        <dl class="stats-grid">${counts.map(([c,n,label]) => `<div class="stat-card"><dt>${label}</dt><dd class="${c}">${n}</dd></div>`).join('')}</dl>
      </article>
    </div>
    <div class="lower-grid">
      <article class="panel agenda-card">
        <div class="section-head"><div><h2>Próximos exámenes</h2><p>${list.length ? `${list.length} ${list.length === 1 ? 'examen pendiente de rendir' : 'exámenes pendientes de rendir'}` : 'Tu agenda académica'}</p></div><a class="text-link" href="#materias">Ver materias ${icon('arrow')}</a></div>
        ${examAgenda(list)}
      </article>
      <article class="panel milestones-card">
        <div class="section-head"><div><h2>Hitos del plan</h2><p>Avance requerido para habilitar otros requisitos.</p></div></div>
        <div class="milestones">${OTROS.map(r => {
          const goal = Math.ceil(TOTAL_M * r.threshold), left = Math.max(0,goal - s.ap);
          return `<div class="milestone"><div class="milestone-title"><span class="milestone-percentage">${r.threshold * 100}%</span><h3>${r.n}</h3></div>
            ${bar(s.ap / goal * 100)}
            <div class="milestone-status"><p class="${left ? 'muted' : 'green'}">${left ? `Faltan ${left} ${left === 1 ? 'materia' : 'materias'}` : 'Requisito habilitado'}</p><span>${Math.min(s.ap,goal)} / ${goal} aprobadas</span></div></div>`;
        }).join('')}</div>
      </article>
    </div>
    <section class="year-overview" aria-label="Avance por año">
      <div class="year-overview-head"><div><h2>Avance por año</h2><p>Incluye las materias de idiomas de cada año.</p></div></div>
      <div class="year-mini-grid">${[1,2,3,4].map(year => {
        const mats = SUBJECTS.filter(m => m.a === year), ap = mats.filter(m => ms(data,m.n).e === 'aprobada').length;
        return `<div class="year-mini"><div class="bar-label"><strong>${['Primer','Segundo','Tercer','Cuarto'][year-1]} año</strong><span>${pct(ap / mats.length * 100)}%</span></div>${bar(ap / mats.length * 100)}<p>${ap} de ${mats.length} aprobadas</p></div>`;
      }).join('')}</div>
    </section>`;
}

function subjectRow(m, data) {
  const s = ms(data,m.n), reason = bloqueoActivar(data,m.n);
  const primary = [], secondary = [], stateActions = [];
  if (s.e !== 'aprobada' && s.e !== 'en-curso') primary.push(action('activate',s.e === 'desaprobada' ? 'Reintentar cursada' : 'Iniciar cursada',m.id,'primary',reason ? 'disabled' : ''));
  if (s.e === 'en-curso') {
    primary.push(action('exam-add',icon('plus')+'Agregar examen',m.id,'primary'));
    primary.push(action('approve','Aprobar',m.id,'success',reason ? 'disabled' : ''));
    stateActions.push(action('fail','Desaprobar',m.id,'quiet danger'));
  }
  if (s.e === 'aprobada') primary.push(action(s.equivalencia ? 'equivalence' : 'approve','Editar aprobación',m.id));
  if (s.e !== 'aprobada') secondary.push(action('equivalence','Aprobar por equivalencia',m.id,'quiet'));
  if (s.e !== 'pendiente') stateActions.push(action('revert',s.e === 'aprobada' ? 'Revertir aprobación' : 'Volver a pendiente',m.id,'quiet danger'));
  return `<details class="subject ${s.e}" id="subject-${m.id}">
    <summary class="subject-summary" aria-controls="detail-${m.id}">
      <span class="subject-name">${html(m.n)}</span>
      <span class="subject-hours"><span class="sr-only">Carga horaria: </span>${m.h} h</span>
      <span class="subject-status ${color(s.e)}">${s.equivalencia && s.e === 'aprobada' ? 'Equivalencia' : STATUS[s.e]}</span>
      <span class="subject-grade ${color(s.e)}"><span class="sr-only">Nota final: </span>${s.nota == null ? '—' : html(s.nota)}</span>
      <span class="chevron">${icon('chevron')}</span>
    </summary>
    <div class="subject-detail" id="detail-${m.id}" role="region" aria-label="Detalle de ${html(m.n)}">
      <div class="subject-detail-heading"><h3>${html(m.n)}</h3><button class="icon-btn" data-action="close-subject" data-subject="${m.id}" aria-label="Cerrar detalle de ${html(m.n)}">${icon('close')}</button></div>
      <div class="subject-actions">
        <div class="button-row subject-primary-actions${primary.length === 1 ? ' single-action' : ''}" role="group" aria-label="Acciones principales">${primary.join('')}</div>
        ${secondary.length || stateActions.length ? `<div class="subject-secondary-actions" role="group" aria-label="Otras acciones">${secondary.join('')}${stateActions.length ? `<div class="button-row subject-state-actions" role="group" aria-label="Cambios de estado">${stateActions.join('')}</div>` : ''}</div>` : ''}
      </div>
      ${reason && s.e !== 'aprobada' ? `<p class="notice">${icon('lock')} ${html(reason)}${s.e === 'en-curso' ? ' Se conserva tu cursada registrada.' : ''}</p>` : ''}
      <div class="detail-grid">
        <div><h3>Correlativas</h3><div class="corr-list">${m.r.length ? m.r.map(n => `<span class="${ms(data,n).e === 'aprobada' ? 'green' : 'muted'}">${icon(ms(data,n).e === 'aprobada' ? 'check' : 'circle')}${html(n)}</span>`).join('') : '<p>Sin correlativas del plan.</p>'}</div></div>
        <div><h3>Exámenes registrados</h3>${s.exs.length ? s.exs.map(ex => `<div class="exam-record"><div><strong>${html(ex.tipo)}${ex.cancelado ? ' · Cancelado' : ''}</strong><p>${fmt(ex.fecha)} · ${ex.nota == null ? 'Sin calificar' : 'Nota: '+html(ex.nota)}</p></div><div class="exam-record-actions"><button class="icon-btn" data-action="exam-edit" data-subject="${m.id}" data-id="${html(ex.id)}" aria-label="Editar ${html(ex.tipo)}">${icon('edit')}</button><button class="icon-btn" data-action="exam-delete" data-subject="${m.id}" data-id="${html(ex.id)}" aria-label="Eliminar ${html(ex.tipo)}">${icon('trash')}</button></div></div>`).join('') : '<p class="caption">Todavía no registraste exámenes.</p>'}</div>
      </div>
    </div>
  </details>`;
}

function semesterColumn(mats, label, data) {
  return `<section class="semester"><h3 class="semester-label">${label}</h3>
    <div class="column-labels" aria-hidden="true"><span>Materia</span><span>Horas</span><span>Estado</span><span>Nota</span><span></span></div>
    ${mats.map(m => subjectRow(m,data)).join('')}</section>`;
}

export function renderMats() {
  const data = getState(), query = $('search').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(), filter = $('status-filter').value;
  const matches = m => {
    const s = ms(data,m.n);
    return m.n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query) && (filter === 'all' || (filter === 'equivalencia' ? s.e === 'aprobada' && s.equivalencia : s.e === filter));
  };
  const visible = SUBJECTS.filter(matches);
  const filtering = query.length > 0 || filter !== 'all';
  $('result-count').hidden = !filtering;
  $('result-count').textContent = filtering ? `${visible.length} de ${TOTAL_M} materias` : '';
  $('plan-count').textContent = `${TOTAL_M} materias · ${TOTAL_H.toLocaleString('es-AR')} horas`;
  const groups = [1,2,3,4,'ing'].map(year => {
    const all = SUBJECTS.filter(m => year === 'ing' ? m.n.startsWith('Inglés') : m.a === year && !m.n.startsWith('Inglés'));
    const mats = all.filter(matches), ap = all.filter(m => ms(data,m.n).e === 'aprobada').length;
    if (!mats.length) return '';
    const columns = year === 'ing'
      ? semesterColumn(mats,'Idiomas del plan',data)
      : [1,2].map(c => {
        const cm = mats.filter(m => m.c === c);
        return cm.length ? semesterColumn(cm,`${c === 1 ? 'Primer' : 'Segundo'} cuatrimestre`,data) : '';
      }).join('');
    return `<details class="panel year-block" id="year-${year}" ${query || filter !== 'all' ? 'open' : ''}>
      <summary class="year-summary"><div class="year-name"><h2>${year === 'ing' ? 'Idiomas' : ['Primer','Segundo','Tercer','Cuarto'][year-1]+' año'}</h2><p>${ap} de ${all.length} materias aprobadas</p></div><div class="year-progress"><div class="bar-label"><strong><span class="sr-only">Avance: </span>${pct(ap/all.length*100)}%</strong></div>${bar(ap/all.length*100)}</div><span class="chevron">${icon('chevron')}</span></summary>
      <div class="semester-grid ${year === 'ing' || new Set(mats.map(m => m.c)).size === 1 ? 'single-semester' : ''}">${columns}</div>
      <div class="year-subject-details" hidden></div>
    </details>`;
  }).join('');
  $('mat-list').innerHTML = (visible.length ? groups : `<div class="panel empty-state"><h3>No encontramos materias</h3><p>Probá otro nombre o cambiá el filtro.</p></div>`) + renderOtros(data);
}

// Reuse the same detail DOM and controls at both widths. On desktop the open
// regions sit below both terms, so one expanded row cannot stretch its column.
export function syncSubjectDetails() {
  const active = document.activeElement;
  const wide = window.matchMedia('(min-width: 1051px)').matches;
  document.querySelectorAll('.year-block').forEach(year => {
    const host = year.querySelector('.year-subject-details');
    year.querySelectorAll('.subject').forEach(row => {
      const detail = $(row.querySelector('summary').getAttribute('aria-controls'));
      const target = wide && row.open ? host : row;
      if (detail.parentElement !== target) target.append(detail);
    });
    host.hidden = !host.children.length;
  });
  if (active?.isConnected && active.closest('.subject-detail') && active.getClientRects().length && document.activeElement !== active) active.focus({preventScroll:true});
}

function renderOtros(data) {
  const s = stats(data);
  return `<div class="requirements-title"><h2>Otros requisitos</h2><p>Adicionales a las materias y horas del plan.</p></div><div class="requirements-grid">${OTROS.map(r => {
    const e = data['_otro_'+r.id] || 'pendiente', left = Math.max(0,Math.ceil(TOTAL_M*r.threshold)-s.ap);
    return `<details class="panel requirement" id="req-${r.id}">
      <summary class="subject-summary"><div class="req-title"><strong>${r.n}</strong><p>${r.h} h · ${left ? `Faltan ${left} materias para habilitarlo` : 'Porcentaje requerido alcanzado'}</p></div><span class="subject-status ${e === 'acreditado' ? 'green' : e === 'en-curso' ? 'yellow' : 'muted'}">${e === 'acreditado' ? 'Acreditado' : e === 'en-curso' ? 'En curso' : 'Pendiente'}</span><span class="chevron">${icon('chevron')}</span></summary>
      <div class="subject-detail"><p class="caption">${r.cond}</p><div class="button-row requirement-actions">${e === 'pendiente' ? `<button class="btn primary" data-action="requirement" data-id="${r.id}" data-status="en-curso" ${left ? 'disabled' : ''}>Iniciar</button>` : e === 'en-curso' ? `<button class="btn success" data-action="requirement" data-id="${r.id}" data-status="acreditado" ${left ? 'disabled' : ''}>Acreditar</button>` : ''}${e !== 'pendiente' ? `<button class="btn" data-action="requirement" data-id="${r.id}" data-status="pendiente">Volver a pendiente</button>` : ''}</div></div>
    </details>`;
  }).join('')}</div>`;
}

export function renderAll() {
  const openIds = new Set([...document.querySelectorAll('#mat-list details[open]')].map(el => el.id));
  const active = document.activeElement;
  const focus = active && { id:active.id, action:active.dataset.action, subject:active.dataset.subject, exam:active.dataset.id, details:active.dataset.subject ? 'subject-'+active.dataset.subject : active.closest('details')?.id };
  const scroll = window.scrollY;
  renderDash(); renderMats();
  openIds.forEach(id => { const el = $(id); if (el) el.open = true; });
  syncSubjectDetails();
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
  $('backup-list').innerHTML = keys.length ? keys.map(key => {
    const date = new Date(Number(key.split('_')[2])).toLocaleString('es-AR');
    const reason = key.includes('pre_import') ? 'Antes de importar' : key.includes('migration') ? 'Antes de migrar a V2' : 'Copia de seguridad';
    return `<div class="backup-item"><div><strong>${date}</strong><span>${reason}</span></div><button class="btn small" data-action="backup-download" data-id="${html(key)}" aria-label="Descargar copia del ${html(date)} en JSON">${icon('download')}JSON</button></div>`;
  }).join('') : '<div class="backup-empty"><h3>Todavía no hay copias guardadas</h3><p>Cuando importes datos o se actualice su formato, el estado anterior aparecerá acá. Podés exportar una copia manual en cualquier momento.</p></div>';
}
