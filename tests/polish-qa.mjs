import assert from 'node:assert/strict';
import {capture} from './browser-qa.mjs';
const base='http://127.0.0.1:4173/mi-carrera/';
export async function runVisualPolishQA(page) {
  const results=[], errors=[];
  const check=(condition,message) => { assert.ok(condition,message); results.push(message); };
  page.on('pageerror',error => errors.push(error.message));
  await page.addInitScript(() => {
    window.__motionCalls=[];
    const animate=Element.prototype.animate;
    Element.prototype.animate=function(frames,options) {
      window.__motionCalls.push({key:this.dataset.progressKey,frames,options});
      return animate.call(this,frames,options);
    };
  });
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base);
  await page.evaluate(async() => {
    const {SUBJECTS}=await import('./js/core.js');
    localStorage.setItem('ap2_state',JSON.stringify(Object.fromEntries(SUBJECTS.slice(0,8).map(m => [m.n,{e:'aprobada',nota:null,exs:[]}]))));
  });
  await page.reload();
  await page.waitForSelector('.academic-hero');
  const initial=await page.evaluate(() => ({raw:localStorage.getItem('ap2_state'),calls:window.__motionCalls}));
  check(await page.locator('#header-progress,.mode-label').count() === 0,'Header sin porcentaje duplicado');
  check(initial.calls.some(c => c.key === 'career-ring' && c.frames[0].strokeDasharray === '0 100') && initial.calls.some(c => c.key === 'hero-hours'),'Anillo y barras tienen una entrada finita desde cero');
  check(initial.calls.every(c => c.options.duration <= 1000 && (c.options.iterations ?? 1) === 1),'Todas las animaciones de indicadores son breves y sin bucles');
  await page.waitForFunction(() => document.getAnimations().length === 0);
  const rendered=await page.locator('.ring-progress').evaluate(el => parseFloat(getComputedStyle(el).strokeDasharray));
  check(Math.abs(rendered-8/22*100) < .01 && await page.locator('.ring-value').innerText() === '36,4%','La entrada termina en el porcentaje real y el número siempre muestra el valor correcto');
  check(await page.evaluate(raw => localStorage.getItem('ap2_state') === raw,initial.raw),'Las animaciones no modifican registros académicos');
  check(await page.locator('#milestone-notice').isHidden(),'La carga de datos existentes no dispara celebraciones');
  const ringsBefore=await page.evaluate(() => window.__motionCalls.filter(c => c.key === 'career-ring').length);
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  check(await page.evaluate(() => window.__motionCalls.filter(c => c.key === 'career-ring').length) === ringsBefore,'Navegar entre vistas no reinicia el anillo sin cambios de progreso');
  check(await page.locator('#progress-info > p').isHidden(),'La aclaración oficial se presenta de forma discreta');
  await page.locator('#progress-info-summary').click();
  check(await page.locator('#progress-info > p').isVisible() && (await page.locator('#progress-info > p').innerText()).includes('no constituye certificación oficial'),'La explicación del cálculo y su alcance están disponibles por teclado o clic');

  const watcher=await page.context().newPage(); await watcher.goto(base);
  await page.bringToFront();
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.locator('#year-2').evaluate(el => el.open=true);
  await page.locator('#subject-eda > summary').click();
  await page.locator('#detail-eda [data-action="activate"]').click();
  check(await page.evaluate(() => window.__motionCalls.filter(c => c.key === 'career-ring').length) === ringsBefore,'Una operación sin cambio de porcentaje no vuelve a animar el anillo');
  await page.locator('#detail-eda [data-action="approve"]').click();
  await page.locator('#final-grade').fill('8'); await page.locator('#modal-submit').click();
  await page.waitForSelector('#milestone-notice:not([hidden])');
  check((await page.locator('#milestone-notice strong').innerText()).includes('40%'),'Una aprobación que cruza 40% celebra el hito real');
  await watcher.waitForFunction(() => document.querySelector('.hero-subjects .hero-metric-value').textContent.trim() === '9 / 22');
  check(await watcher.locator('#milestone-notice').isHidden(),'La celebración se muestra únicamente en la pestaña que realizó la aprobación');
  await watcher.close();
  check(await page.locator('#progress-info').evaluate(el => el.open),'La explicación abierta conserva su estado tras actualizar datos');
  await page.locator('#progress-info').evaluate(el => el.open=false);
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  await page.evaluate(() => window.scrollTo(0,0));
  await capture(page,'hito-40-desktop');
  await page.waitForFunction(() => document.getElementById('milestone-notice').hidden);
  check(true,'La celebración se retira sola y no bloquea controles');
  await page.reload();
  check(await page.locator('#milestone-notice').isHidden(),'Recargar después del 40% no repite la celebración');
  await page.evaluate(async() => {
    const s=await import('./js/state.js');
    await s.dispatch({type:'revert',subject:'eda'});
    await s.dispatch({type:'approve',subject:'eda',grade:9});
  });
  check(await page.locator('#milestone-notice').isHidden(),'Revertir y volver a cruzar un hito ya registrado no lo celebra otra vez');

  await page.evaluate(async() => {
    const c=await import('./js/core.js'), s=await import('./js/state.js');
    await s.replaceLocal(Object.fromEntries([...c.SUBJECTS.slice(0,15),...c.LANGUAGES].map(m => [m.n,{e:'aprobada',nota:null,exs:[]}])));
  });
  await page.setViewportSize({width:390,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(() => { window.__motionCalls=[]; });
  await page.evaluate(async() => (await import('./js/state.js')).dispatch({type:'approve',subject:'red',grade:8}));
  await page.waitForSelector('#milestone-notice:not([hidden])');
  check((await page.locator('#milestone-notice strong').innerText()).includes('70%'),'El cruce real de 70% también se celebra en mobile');
  check(await page.evaluate(() => window.__motionCalls.length === 0 && document.getAnimations().length === 0),'Movimiento reducido desactiva entrada, transiciones y animación de la celebración');
  await page.evaluate(() => window.scrollTo(0,0));
  await capture(page,'hito-70-mobile');
  await page.reload();
  check(await page.locator('#milestone-notice').isHidden() && await page.evaluate(() => window.__motionCalls.length === 0),'Recargar con movimiento reducido mantiene todo estático y no repite hitos');

  await page.evaluate(async() => {
    const c=await import('./js/core.js'), s=await import('./js/state.js');
    localStorage.removeItem('ap2_ui_milestones_v1');
    await s.replaceLocal({});
    await s.replaceLocal(Object.fromEntries(c.SUBJECTS.slice(0,16).map(m => [m.n,{e:'aprobada',nota:null,exs:[]}])));
  });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap2_ui_milestones_v1'))?.reached.includes(70));
  check(await page.locator('#milestone-notice').isHidden(),'Importar datos que superan ambos umbrales no dispara celebraciones');
  await page.evaluate(async() => {
    const {SUBJECTS}=await import('./js/core.js');
    const legacy=Object.fromEntries(SUBJECTS.slice(0,16).map(m => [m.n,{e:'aprobada',nota:null,exs:[]}]));
    legacy['Introducción a la Informática'].exs=[{tipo:'Final',fecha:'2026-12-10',nota:7}];
    localStorage.setItem('ap2_state',JSON.stringify(legacy)); localStorage.removeItem('ap2_ui_milestones_v1');
  });
  await page.reload();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap2_ui_milestones_v1'))?.reached.includes(70));
  check(await page.locator('#milestone-notice').isHidden() && await page.evaluate(() => !!JSON.parse(localStorage.getItem('ap2_state'))['Introducción a la Informática'].exs[0].id),'Una migración real de exámenes antiguos conserva los datos y no celebra hitos');
  check(errors.length === 0,'Sin errores JavaScript en las pruebas de acabados y celebraciones');
  return {checks:results.length,results,errors};
}
