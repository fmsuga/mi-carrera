import { SUBJECTS, EXAM_TYPES, normalizeState, ms, newExamId, stats } from './core.js';
import { getState, dispatch, exportData, replaceLocal, downloadJSON } from './state.js';
import { html } from './ui.js';
import { renderBackups, syncSubjectDetails } from './render.js';
const $ = id => document.getElementById(id);
let submitHandler = null, returnFocus = null, busy = false;
export function toast(message) {
  $('toast').textContent = message; $('toast').classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => $('toast').classList.remove('show'),4000);
}
export function openModal(title, body, label, handler) {
  const el = document.activeElement;
  returnFocus = { el, details:el.dataset.subject ? 'subject-'+el.dataset.subject : el.closest('details')?.id, action:el.dataset.action, subject:el.dataset.subject, exam:el.dataset.id };
  $('modal-title').textContent=title; $('modal-body').innerHTML=body;
  $('modal-submit').textContent=label; $('modal-error').textContent='';
  submitHandler=handler; $('modal').showModal();
  $('modal-body').querySelector('input,select,button')?.focus();
}
function closeModal() {
  if (busy) return;
  $('modal').close(); submitHandler=null;
  const target = returnFocus?.el.isConnected ? returnFocus.el : [...document.querySelectorAll('[data-action]')].find(el => el.dataset.action === returnFocus?.action && el.dataset.subject === returnFocus?.subject && el.dataset.id === returnFocus?.exam);
  (target || $(returnFocus?.details)?.querySelector('summary'))?.focus({preventScroll:true});
}
const field = (id,label,type,value='',extra='') => `<div class="field-group"><label for="${id}">${label}</label><input class="field-input" id="${id}" type="${type}" value="${html(value)}" ${extra}></div>`;
export function initActions() {
  $('modal-close').addEventListener('click',closeModal);
  $('modal-cancel').addEventListener('click',closeModal);
  $('modal').addEventListener('cancel',event => { event.preventDefault(); closeModal(); });
  $('modal').addEventListener('keydown',event => {
    if (event.key !== 'Tab') return;
    const items = [...$('modal').querySelectorAll('button,input,select,a[href]')].filter(el => !el.disabled && !el.hidden && el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  $('modal-form').addEventListener('submit',async event => {
    event.preventDefault(); if (busy || !submitHandler) return;
    busy=true; $('modal-submit').disabled=true; $('modal-error').textContent='';
    try { await submitHandler(); busy=false; closeModal(); }
    catch(err) { $('modal-error').textContent=err.message; }
    finally { busy=false; $('modal-submit').disabled=false; }
  });
  document.addEventListener('click',async event => {
    const button=event.target.closest('[data-action]'); if (!button || button.disabled) return;
    const {action, subject, id, status} = button.dataset;
    const m=SUBJECTS.find(m => m.id === subject);
    try {
      if (action === 'export') { exportData(); toast('Backup exportado'); }
      else if (action === 'close-subject') {
        const row=$('subject-'+subject);
        row.open=false;
        syncSubjectDetails();
        row.querySelector('summary').focus({preventScroll:true});
      }
      else if (action === 'import') $('import-file').click();
      else if (action === 'backup-download') downloadJSON(localStorage.getItem(id),id+'.json');
      else if (action === 'activate' || action === 'fail') { await dispatch({type:action,subject}); toast(action === 'activate' ? 'Cursada iniciada' : 'Estado actualizado'); }
      else if (action === 'requirement') { await dispatch({type:action,id,status}); toast('Requisito actualizado'); }
      else if (action === 'revert') openModal('Volver a pendiente',`<p class="modal-copy">${html(m.n)} volverá a pendiente y su nota final dejará de contarse. Los exámenes se conservan. Los bloqueos y requisitos se recalcularán.</p>`,'Confirmar',async() => { await dispatch({type:'revert',subject}); toast('Materia actualizada'); });
      else if (action === 'equivalence') openModal('Aprobar por equivalencia',`<p class="modal-copy">${html(m.n)} se registrará como aprobada por equivalencia. Sumará materias y horas, y habilitará sus correlativas. La nota es opcional.</p>`+field('equivalence-grade','Nota de equivalencia (opcional)','number',ms(getState(),m.n).equivalencia ? ms(getState(),m.n).nota ?? '' : '', 'min="4" max="10" step="0.01"'),'Confirmar equivalencia',async() => { await dispatch({type:'equivalence',subject,grade:$('equivalence-grade').value === '' ? null : Number($('equivalence-grade').value)}); toast('Equivalencia registrada'); });
      else if (action === 'approve') openModal('Aprobación de materia',`<p class="caption" style="margin-bottom:16px">${html(m.n)}</p>`+field('final-grade','Nota final (4 a 10)','number',ms(getState(),m.n).nota ?? '', 'required min="4" max="10" step="0.01"'),'Guardar aprobación',async() => { await dispatch({type:'approve',subject,grade:Number($('final-grade').value)}); toast('Aprobación guardada'); });
      else if (action === 'exam-add' || action === 'exam-edit') {
        const existing=action === 'exam-edit' ? ms(getState(),m.n).exs.find(ex => ex.id === id) : null;
        if (action === 'exam-edit' && !existing) throw new Error('Este examen ya no existe.');
        const examId=existing?.id || newExamId();
        const kinds = [...new Set([...EXAM_TYPES,...(existing && !EXAM_TYPES.includes(existing.tipo) ? [existing.tipo] : [])])];
        openModal(existing ? 'Editar examen' : 'Agregar examen',`<p class="caption" style="margin-bottom:16px">${html(m.n)}</p><div class="field-group"><label for="exam-kind">Tipo de examen</label><select id="exam-kind">${kinds.map(k => `<option ${k === existing?.tipo ? 'selected' : ''}>${html(k)}</option>`).join('')}</select></div>`+field('exam-date','Fecha','date',existing?.fecha || '', 'required')+(existing ? field('exam-grade','Nota (1 a 10, opcional)','number',existing.nota ?? '', 'min="1" max="10" step="0.01"')+'<p class="caption">Dejá la nota vacía si todavía no está calificado.</p>' : ''),existing ? 'Guardar cambios' : 'Agregar',async() => {
          await dispatch({type:existing ? 'exam-edit' : 'exam-add',subject,id:examId,kind:$('exam-kind').value,date:$('exam-date').value,grade:existing && $('exam-grade').value !== '' ? Number($('exam-grade').value) : null});
          toast('Examen guardado');
        });
      } else if (action === 'exam-delete') openModal('Eliminar examen', '<p class="modal-copy">Se eliminará este examen y su nota registrada. Esta acción no cambia la aprobación de la materia.</p>','Eliminar examen',async() => { await dispatch({type:'exam-delete',subject,id}); toast('Examen eliminado'); });
    } catch(err) { toast('No se guardó el cambio. '+err.message); }
  });
  $('import-file').addEventListener('change',async event => {
    const file=event.target.files[0]; event.target.value=''; if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('El archivo supera los 5 MB.');
      const next=normalizeState(JSON.parse(await file.text()),true), s=stats(next);
      openModal('Revisar importación',`<p class="modal-copy">Archivo: <strong>${html(file.name)}</strong><br>${Object.keys(next).length} registros · ${s.ap} materias aprobadas · ${s.cur} en curso.</p><p class="notice warning" style="margin-top:16px">Esta importación sustituirá el estado actual. Guardaremos antes una copia completa en este navegador. Si no se puede guardar la copia, no se importará.</p><label class="modal-copy"><input id="import-confirm" type="checkbox" required> Confirmo que quiero sustituir mis registros con este archivo.</label>`,'Importar y guardar copia',async() => { if (!$('import-confirm').checked) throw new Error('Confirmá la sustitución.'); await replaceLocal(next); renderBackups(); toast('Datos importados. Copia anterior guardada.'); });
    } catch(err) { toast('Archivo no importado. '+err.message); }
  });
}
