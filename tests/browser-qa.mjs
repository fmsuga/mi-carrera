// Run with an isolated Playwright page against scripts/serve.mjs.
// The fixtures below are test data, never the user's GitHub Pages storage.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const base='http://127.0.0.1:4173/mi-carrera/';
export async function runBrowserQA(page) {
  const results=[], errors=[];
  page.on('pageerror',err => errors.push(err.message));
  const check=(condition,message) => { assert.ok(condition,message); results.push(message); };
  await page.goto(base);
  const old={'Preliminares de Matemática':{e:'aprobada',nota:8,exs:[]},'Introducción a la Informática':{e:'en-curso',nota:null,exs:[{tipo:'Parcial 1',fecha:'2026-12-10',nota:null}]},'_otro_pc':'pendiente'};
  const original=JSON.stringify(old);
  await page.evaluate(raw => localStorage.setItem('ap2_state',raw),original);
  await page.reload();
  const migrated=await page.evaluate(() => JSON.parse(localStorage.getItem('ap2_state')));
  check(!!migrated['Introducción a la Informática'].exs[0].id,'Migración preserva los exámenes y asigna IDs');
  check(await page.evaluate(raw => Object.keys(localStorage).filter(k => k.startsWith('ap2_backup_')).some(k => localStorage.getItem(k) === raw),original),'Backup previo conserva los bytes originales');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.locator('#subject-alg > summary').click();
  check(await page.locator('#subject-alg [data-action="activate"]').isEnabled(),'Correlativa aprobada habilita Álgebra');
  await page.locator('#subject-alg [data-action="activate"]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap2_state'))['Álgebra']?.e === 'en-curso');
  check(await page.locator('#subject-alg').getAttribute('open') !== null,'Operación conserva acordeones abiertos');
  await page.locator('#subject-alg [data-action="approve"]').click();
  await page.locator('#final-grade').fill('9'); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.locator('#subject-inf > summary').click();
  await page.locator('#subject-inf [data-action="exam-edit"]').click();
  await page.locator('#exam-date').fill('2026-12-11');
  await page.locator('#exam-kind').selectOption('Final');
  await page.locator('#exam-grade').fill('7'); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  check(await page.locator('.average-value').innerText() === '8,50 / 10','Promedio se actualiza inmediatamente');
  check(await page.locator('.exam-item').count() === 0,'Calificar un examen lo quita de próximos sin recargar');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.locator('#subject-inf [data-action="exam-edit"]').click();
  await page.locator('#exam-grade').fill(''); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('ap2_state'))['Introducción a la Informática'].exs[0].id) === migrated['Introducción a la Informática'].exs[0].id,'Edición y calificación conservan ID estable');
  await page.locator('#subject-pre > summary').click();
  await page.locator('#subject-pre [data-action="revert"]').click(); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.locator('#subject-alg [data-action="revert"]').click(); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  check(await page.locator('#subject-alg [data-action="activate"]').isDisabled(),'Revertir correlativa actualiza bloqueos al instante');
  await page.locator('#search').fill('ingles');
  check(await page.locator('#result-count').innerText() === '3 de 33 materias','Búsqueda ignora tildes y mantiene el foco');
  check(await page.locator('#search').evaluate(el => el === document.activeElement),'Buscador conserva foco');
  await page.locator('#search').fill('');
  await page.locator('#status-filter').selectOption('en-curso');
  check(await page.locator('#result-count').innerText() === '1 de 33 materias','Filtro por estado funcional');
  await page.locator('#status-filter').selectOption('all');
  const second=await page.context().newPage(); await second.goto(base+'#materias');
  await page.evaluate(async() => { const s=await import('./js/state.js'); await s.dispatch({type:'equivalence',subject:'pre'}); });
  await second.waitForFunction(() => document.querySelector('#subject-pre .pill')?.textContent === 'Equivalencia');
  check(true,'Evento storage sincroniza dos pestañas reales');
  await second.close();
  await page.reload();
  check(await page.locator('#subject-pre .pill').innerText() === 'Equivalencia','Estado persiste al volver a abrir la página');
  await page.getByRole('link',{name:'Configuración',exact:true}).click();
  const before=await page.evaluate(() => localStorage.getItem('ap2_state'));
  await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"Álgebra":{"e":"invalid"}}')});
  check(await page.evaluate(() => !document.querySelector('#modal').open),'Importación inválida no abre confirmación ni cambia datos');
  check(await page.evaluate(() => localStorage.getItem('ap2_state')) === before,'Importación inválida preserva el estado');
  await page.locator('#import-file').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from('{"Inglés I":{"e":"aprobada","nota":6,"exs":[]}}')});
  await page.waitForFunction(() => document.querySelector('#modal').open);
  await page.locator('#modal-submit').click();
  check(await page.locator('#modal').evaluate(el => el.open),'Importación requiere confirmación explícita');
  await page.locator('#import-confirm').check(); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  check(await page.evaluate(raw => Object.keys(localStorage).filter(k => k.includes('pre_import')).some(k => localStorage.getItem(k) === raw),before),'Importación válida crea copia anterior recuperable');
  // Accessibility: native dialog focus containment, Escape and labelled fields.
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.locator('#subject-pre > summary').click();
  await page.locator('#subject-pre [data-action="equivalence"]').click();
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.closest('dialog') !== null),'Modal mantiene navegación con teclado dentro del diálogo');
  await page.keyboard.press('Escape');
  check(await page.locator('#modal').evaluate(el => !el.open),'Escape cierra el modal');
  // Seed a complete, labelled-in-report fixture for responsive screenshots.
  await page.evaluate(async() => {
    const c=await import('./js/core.js'); let data={};
    for(const m of c.SUBJECTS.slice(0,14)) data=c.applyCommand(data,{type:'equivalence',subject:m.id});
    for(const id of ['pre','alg','ama','inf','in1','amb','dis','pro','diu','eda','syo','in2','ads1']) data=c.applyCommand(data,{type:'approve',subject:id,grade:8});
    for(const id of ['lia','pye']) data=c.applyCommand(data,{type:'activate',subject:id});
    const today=c.todayISO(); const date=days => new Date(Date.parse(today)+days*86400000).toISOString().slice(0,10);
    data=c.applyCommand(data,{type:'exam-add',subject:'lia',id:'ex-qa-near',kind:'Parcial 2',date:date(3)});
    data=c.applyCommand(data,{type:'exam-add',subject:'pye',id:'ex-qa-far',kind:'Final',date:date(18)});
    localStorage.setItem('ap2_state',JSON.stringify(data)); (await import('./js/state.js')).readLocal();
  });
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  const dimensions=[];
  for(const width of [1920,1440,1280,768,390]) {
    await page.setViewportSize({width,height:1000});
    for(const route of ['inicio','materias','configuracion']) {
      await page.goto(base+'#'+route);
      if(route === 'materias') { await page.locator('#subject-pre > summary').click(); }
      const sizes=await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(sizes.scroll <= sizes.client,`Horizontal overflow ${width} ${route}: ${JSON.stringify(sizes)}`);
      dimensions.push(`${width}:${route}`);
    }
  }
  check(dimensions.length === 15,'Sin desborde en 1920, 1440, 1280, 768 y 390 px en las tres vistas');
  for(const [width,name] of [[1440,'desktop'],[390,'mobile']]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(base+'#inicio');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#toast')).opacity === '0');
    await page.screenshot({path:fileURLToPath(new URL('../docs/dashboard-'+name+'.png',import.meta.url)),fullPage:true});
    await page.goto(base+'#materias'); await page.locator('#subject-pre').evaluate(el => el.open=true);
    await page.screenshot({path:fileURLToPath(new URL('../docs/materias-'+name+'.png',import.meta.url)),fullPage:true});
    await page.goto(base+'#configuracion');
    await page.screenshot({path:fileURLToPath(new URL('../docs/configuracion-'+name+'.png',import.meta.url)),fullPage:true});
  }
  for(const path of ['assets/favicon.svg','assets/favicon-16.png','assets/favicon-32.png','assets/apple-touch-icon.png','assets/icon-192.png','assets/icon-512.png','manifest.webmanifest','js/app.js','css/styles.css']) {
    const response=await page.request.get(base+path); assert.equal(response.status(),200,path);
  }
  check(true,'SVG, PNG, iconos móviles, manifest y módulos responden 200 bajo /mi-carrera/');
  await page.evaluate(async() => {
    const c=await import('./js/core.js'); let data={};
    for(const m of c.SUBJECTS) data=c.applyCommand(data,{type:'equivalence',subject:m.id});
    localStorage.setItem('ap2_state',JSON.stringify(data)); (await import('./js/state.js')).readLocal();
  });
  await page.goto(base+'#inicio');
  check((await page.locator('.ring-value').innerText()).includes('100'),'Dashboard llega al 100% con todas las materias aprobadas');
  await page.goto(base+'#materias');
  await page.locator('#req-eps > summary').click();
  check(await page.locator('#req-eps [data-status="en-curso"]').isEnabled(),'Requisito EPS se habilita automáticamente al superar el 70%');
  await page.evaluate(async() => {
    const c=await import('./js/core.js'), s=await import('./js/state.js');
    for(const m of c.SUBJECTS.slice(13)) await s.dispatch({type:'revert',subject:m.id});
  });
  check(await page.locator('#req-eps [data-status="en-curso"]').isDisabled(),'EPS vuelve a bloquearse al bajar del porcentaje requerido');
  await page.locator('#req-pc > summary').click();
  check(await page.locator('#req-pc [data-status="en-curso"]').isDisabled(),'Prácticas Comunitarias se bloquea por debajo de 14 aprobadas');
  await page.evaluate(async() => (await import('./js/state.js')).dispatch({type:'equivalence',subject:'arq'}));
  check(await page.locator('#req-pc [data-status="en-curso"]').isEnabled(),'Prácticas Comunitarias se actualiza al alcanzar 14 aprobadas');
  // Corrupt state must remain byte-for-byte intact even after opening the app.
  await page.evaluate(() => localStorage.setItem('ap2_state','{broken'));
  await page.reload();
  check(await page.locator('#data-warning').isVisible(),'Lectura corrupta muestra protección de datos');
  check(await page.evaluate(() => localStorage.getItem('ap2_state')) === '{broken','Lectura corrupta no sobrescribe los bytes originales');
  check(errors.length === 0,'Sin errores JavaScript en las pruebas del navegador');
  return {checks:results.length,results,dimensions,errors};
}
