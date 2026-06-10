/**
 * render.js
 * Funciones que leen el estado y construyen/actualizan el DOM.
 * No modifica state directamente. No toca localStorage.
 */

// ── Dashboard ─────────────────────────────────────────────────

function renderDash() {
  const s = stats();
  const pEl = document.getElementById('hero-promedio');

  if (s.prom !== null) {
    pEl.innerHTML = s.prom.toFixed(2) + '<small> / 10</small>';
    document.getElementById('hero-sub').textContent =
      s.ap === 1 ? '1 materia aprobada' : s.ap + ' materias aprobadas';
  } else {
    pEl.innerHTML = '—<small> / 10</small>';
    document.getElementById('hero-sub').textContent = 'Cargá tu primera materia aprobada';
  }

  const pctMat = (s.ap / TOTAL_M * 100).toFixed(1);
  const pctCH  = (s.hAp / TOTAL_H * 100).toFixed(1);

  document.getElementById('prog-mat').style.width = pctMat + '%';
  document.getElementById('prog-ch').style.width  = pctCH  + '%';
  document.getElementById('prog-mat-lbl').textContent = s.ap + ' / ' + TOTAL_M;
  document.getElementById('prog-ch-lbl').textContent  = s.hAp + 'h / ' + TOTAL_H + 'h';

  document.getElementById('s-aprobadas').textContent = s.ap;
  document.getElementById('s-cursando').textContent  = s.cur;
  document.getElementById('s-pendientes').textContent = s.pen;

  renderProximos();
}

function renderProximos() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const list = [];

  PLAN.forEach(m => {
    const s = ms(m.n);
    (s.exs || []).forEach(ex => {
      if (!ex.fecha || ex.nota) return;
      const f = new Date(ex.fecha + 'T00:00:00');
      const d = Math.round((f - hoy) / 86400000);
      if (d >= -1 && d <= 30) list.push({ nombre: m.n, tipo: ex.tipo, fecha: ex.fecha, d });
    });
  });

  list.sort((a, b) => a.d - b.d);
  const wrap = document.getElementById('proximos-wrap');
  if (!list.length) { wrap.innerHTML = ''; return; }

  wrap.innerHTML = '<div class="section-title">Próximos exámenes</div>' +
    list.map(p => {
      const iconCls = p.d <= 0 ? 'today' : p.d <= 5 ? 'near' : 'far';
      const badgeCls = p.d < 0 ? 'past' : p.d === 0 ? 'today' : p.d <= 5 ? 'soon' : 'far';
      const lbl = p.d < 0 ? `hace ${Math.abs(p.d)}d` : p.d === 0 ? 'Hoy' : `en ${p.d}d`;
      const emoji = p.tipo.includes('Final') ? '🎓' : '📝';
      return `<div class="exam-card">
        <div class="exam-icon ${iconCls}">${emoji}</div>
        <div class="exam-info">
          <div class="exam-name">${p.nombre}</div>
          <div class="exam-sub">${p.tipo} · ${fmt(p.fecha)}</div>
        </div>
        <span class="exam-badge badge-${badgeCls}">${lbl}</span>
      </div>`;
    }).join('');
}

// ── Sección Materias ──────────────────────────────────────────

function renderMats() {
  const ingles = PLAN.filter(m => m.n.startsWith('Inglés'));
  const ingAp  = ingles.filter(m => ms(m.n).e === 'aprobada').length;

  const yearBlocks = [1, 2, 3, 4].map(a => {
    const mats = PLAN.filter(m => m.a === a && !m.n.startsWith('Inglés'));
    const ap   = mats.filter(m => ms(m.n).e === 'aprobada').length;
    const rows = [1, 2].map(c => {
      const cm = mats.filter(m => m.c === c);
      if (!cm.length) return '';
      return `<tr><td colspan="4" class="cuatri-sep">${c === 1 ? 'Primer' : 'Segundo'} Cuatrimestre</td></tr>`
        + cm.map(m => _matRow(m)).join('');
    }).join('');

    return `<div class="year-block">
      <div class="year-heading" onclick="toggleYear(${a})">
        <span class="year-name-text">${['Primer','Segundo','Tercer','Cuarto'][a-1]} Año</span>
        <span class="year-prog-mini">${ap} de ${mats.length} aprobadas</span>
      </div>
      <div class="year-table-wrap${a === 1 ? ' open' : ''}" id="yb-${a}">
        <table class="mat-table">
          <thead><tr>
            <th style="padding-left:23px">Materia</th>
            <th style="text-align:right">Hs.</th>
            <th style="text-align:right">Nota</th>
            <th style="width:16px"></th>
          </tr></thead>
          <tbody id="tbody-${a}">${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  const idiomasBlock = `<div class="year-block">
    <div class="year-heading" onclick="toggleYear('ing')">
      <span class="year-name-text">Idiomas</span>
      <span class="year-prog-mini">${ingAp} de ${ingles.length} aprobadas</span>
    </div>
    <div class="year-table-wrap" id="yb-ing">
      <table class="mat-table">
        <thead><tr>
          <th style="padding-left:23px">Materia</th>
          <th style="text-align:right">Hs.</th>
          <th style="text-align:right">Nota</th>
          <th style="width:16px"></th>
        </tr></thead>
        <tbody>${ingles.map(m => _matRow(m)).join('')}</tbody>
      </table>
    </div>
  </div>`;

  document.getElementById('mat-list').innerHTML = yearBlocks + idiomasBlock + renderOtros();
}

/** Construye el <tr> de una materia. */
function _matRow(m) {
  const s = ms(m.n);
  const notaHTML = s.nota ? `<span class="mat-nota-inline ${notaCls(s.nota)}">${s.nota}</span>` : '';
  return `<tr class="${s.e}" id="mc-${eid(m.n)}">
    <td colspan="4" style="padding:0">
      <div class="mat-row-header" onclick="toggleMat('${esc(m.n)}')">
        <div class="mat-state-bar"></div>
        <span class="mat-nombre">${m.n}</span>
        <span class="mat-ch">${m.h}h</span>
        ${notaHTML}
        <span class="mat-chevron" id="mch-${eid(m.n)}">▼</span>
      </div>
      <div class="mat-detail" id="mb-${eid(m.n)}">${_matBody(m, s)}</div>
    </td>
  </tr>`;
}

/** Construye el panel expandido de detalle de materia. */
function _matBody(m, s) {
  // Correlativas
  const corrHTML = m.r.length
    ? m.r.map(c => {
        const ok = ms(c).e === 'aprobada';
        return `<div class="${ok ? 'corr-ok' : 'corr-pending'}">${ok ? '✓' : '○'} ${c}</div>`;
      }).join('')
    : '<div style="color:var(--text3)">Sin correlativas</div>';

  // Tabla de exámenes
  const exHTML = (s.exs || []).length ? `
    <table class="ex-table">
      <thead><tr><th>Examen</th><th>Fecha</th><th>Nota</th><th></th></tr></thead>
      <tbody>${(s.exs || []).map((ex, i) => {
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        const f = ex.fecha ? new Date(ex.fecha + 'T00:00:00') : null;
        const d = f ? Math.round((f - hoy) / 86400000) : null;
        const badge = (d !== null && !ex.nota)
          ? `<span class="exam-badge badge-${d<=0?'past':d<=5?'soon':'far'}" style="font-size:10px;padding:2px 7px">${d===0?'Hoy':d<0?`hace ${Math.abs(d)}d`:`en ${d}d`}</span>`
          : '';
        const notaCell = ex.nota
          ? `<span class="mat-nota ${notaCls(ex.nota)}">${ex.nota}</span>`
          : `<button class="btn small" onclick="notaEx('${esc(m.n)}',${i})">+ Nota</button>`;
        return `<tr>
          <td class="ex-tipo">${ex.tipo}</td>
          <td class="ex-fecha">${ex.fecha ? fmt(ex.fecha) : '—'} ${badge}</td>
          <td>${notaCell}</td>
          <td><button class="icon-btn" onclick="delEx('${esc(m.n)}',${i})">✕</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table>` : '';

  // Botones de acción según estado
  const bloqueo = bloqueoActivar(m.n);
  const acts = {
    'pendiente': bloqueo
      ? `<button class="btn" disabled title="${bloqueo}">Bloqueada</button>
         <div style="font-size:11px;color:var(--text3);margin-top:6px">${bloqueo}</div>`
      : `<button class="btn primary" onclick="activar('${esc(m.n)}')">▶ Activar</button>`,
    'en-curso': `
      <button class="btn" onclick="addEx('${esc(m.n)}')">+ Agregar examen</button>
      <button class="btn success" onclick="aprobar('${esc(m.n)}')">✓ Aprobar</button>
      <button class="btn danger"  onclick="desaprobar('${esc(m.n)}')">✗ Desaprobar</button>
      <button class="btn small"   onclick="revertir('${esc(m.n)}')">Desactivar</button>`,
    'aprobada':    `<button class="btn small danger" onclick="revertir('${esc(m.n)}')">Revertir</button>`,
    'desaprobada': bloqueo
      ? `<button class="btn" disabled>Bloqueada</button>
         <div style="font-size:11px;color:var(--text3);margin-top:6px">${bloqueo}</div>`
      : `<button class="btn primary" onclick="activar('${esc(m.n)}')">↺ Reintentar</button>`,
  };

  return `<div class="action-row">${acts[s.e] || ''}</div>
    ${exHTML}
    <div style="margin-top:12px">
      <div style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">Correlativas</div>
      <div class="corr-list">${corrHTML}</div>
    </div>`;
}

/**
 * Refresca un <tr> de materia sin re-renderizar toda la lista.
 * Llamar después de cambiar el estado de una materia.
 */
function refreshMat(nombre) {
  const m = PLAN.find(x => x.n === nombre); if (!m) return;
  const s = ms(nombre);
  const row = document.getElementById('mc-' + eid(nombre)); if (!row) return;
  const open = document.getElementById('mb-' + eid(nombre))?.classList.contains('open');
  const notaHTML = s.nota ? `<span class="mat-nota-inline ${notaCls(s.nota)}">${s.nota}</span>` : '';
  row.className = s.e;
  row.innerHTML = `<td colspan="4" style="padding:0">
    <div class="mat-row-header" onclick="toggleMat('${esc(nombre)}')">
      <div class="mat-state-bar"></div>
      <span class="mat-nombre">${m.n}</span>
      <span class="mat-ch">${m.h}h</span>
      ${notaHTML}
      <span class="mat-chevron" id="mch-${eid(nombre)}"${open ? ' style="transform:rotate(180deg)"' : ''}>▼</span>
    </div>
    <div class="mat-detail${open ? ' open' : ''}" id="mb-${eid(nombre)}">${_matBody(m, s)}</div>
  </td>`;
}

// ── Otros requisitos ──────────────────────────────────────────

function renderOtros() {
  const items = OTROS.map(r => {
    const e = stateOtro(r.id);
    const unlocked = r.unlock();
    const lockTxt  = typeof r.lockMsg === 'function' ? r.lockMsg() : r.lockMsg;
    const condLabel = e === 'acreditado'
      ? `<span class="req-cond ok">Acreditado ✓</span>`
      : unlocked
        ? `<span class="req-cond ok">${r.readyMsg}</span>`
        : `<span class="req-cond locked">${lockTxt}</span>`;
    const acts = e === 'pendiente'
      ? (unlocked
          ? `<button class="btn primary" onclick="activarOtro('${r.id}')">▶ Iniciar</button>`
          : `<button class="btn" disabled>Bloqueado</button>
             <div style="font-size:11px;color:var(--text3);margin-top:6px">${lockTxt}</div>`)
      : e === 'en-curso'
        ? `<button class="btn success" onclick="acreditarOtro('${r.id}')">✓ Acreditar</button>
           <button class="btn small"   onclick="revertirOtro('${r.id}')">Desactivar</button>`
        : `<button class="btn small danger" onclick="revertirOtro('${r.id}')">Revertir</button>`;

    return `<div class="req-${e}" id="req-${r.id}">
      <div class="req-row" onclick="toggleReq('${r.id}')">
        <div class="req-state-bar"></div>
        <div class="req-body">
          <div class="req-nombre">${r.n}</div>
          <div class="req-meta">
            <span class="req-h">${r.h}h</span>
            ${condLabel}
          </div>
        </div>
        <span class="req-chevron" id="reqch-${r.id}">▼</span>
      </div>
      <div class="req-detail" id="reqb-${r.id}">
        <div class="req-cond-full">${r.cond}</div>
        <div class="action-row">${acts}</div>
      </div>
    </div>`;
  }).join('');

  return `<div class="otros-block">
    <div class="otros-heading">
      <span class="otros-heading-text">Otros Requisitos</span>
      <span class="otros-heading-sub">${OTROS.filter(r => stateOtro(r.id) === 'acreditado').length} de ${OTROS.length} acreditados</span>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-top:none;border-radius:0 0 12px 12px">${items}</div>
  </div>`;
}

function refreshOtros() {
  const existing = document.querySelector('.otros-block');
  if (!existing) return;
  const tmp = document.createElement('div');
  tmp.innerHTML = renderOtros();
  existing.replaceWith(tmp.firstElementChild);
}

// ── Modal ─────────────────────────────────────────────────────

function openModal(title, bodyHTML, actions) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  const foot = document.getElementById('modal-foot');
  foot.innerHTML = '';
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className  = a.c;
    btn.textContent = a.l;
    btn.onclick    = a.f;
    foot.appendChild(btn);
  });
  document.getElementById('modal-bg').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-bg').classList.remove('open');
}

function closeOnBg(e) {
  if (e.target === document.getElementById('modal-bg')) closeModal();
}

// ── Telegram badge ────────────────────────────────────────────

function updTGBadge() {
  const ok = localStorage.getItem('ap2_tgt') && localStorage.getItem('ap2_tgc');
  const b  = document.getElementById('tg-badge');
  if (ok) {
    b.className = 'tg-status tg-connected';
    b.innerHTML = '<span class="tg-status-dot"></span> Conectado';
  } else {
    b.className = 'tg-status tg-disconnected';
    b.innerHTML = '<span class="tg-status-dot"></span> Sin configurar';
  }
}
