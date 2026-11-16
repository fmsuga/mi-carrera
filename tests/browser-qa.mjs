// Run with an isolated Playwright page against scripts/serve.mjs.
// The fixtures below are test data, never the user's GitHub Pages storage.
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const base='http://127.0.0.1:4173/mi-carrera/';
export async function capture(page,name) {
  const path=fileURLToPath(new URL('../docs/'+name+'.png',import.meta.url));
  await page.mouse.move(0,0);
  await page.evaluate(async() => { await Promise.allSettled(document.getAnimations().map(animation => animation.finished)); });
  const buffer=await page.screenshot({fullPage:true});
  try { if (buffer.equals(await fs.readFile(path))) return; }
  catch(err) { if (err.code !== 'ENOENT') throw err; }
  // Replace completed images atomically; do not truncate a preview being read.
  const temporary=path+'.tmp';
  await fs.writeFile(temporary,buffer);
  try { await fs.rename(temporary,path); }
  finally { await fs.rm(temporary,{force:true}); }
}
export async function runBrowserQA(page,{dashboardOnly=false}={}) {
  const results=[], errors=[], externalRequests=[];
  page.on('pageerror',err => errors.push(err.message));
  page.on('request',req => { if (!req.url().startsWith(new URL(base).origin)) externalRequests.push(req.url()); });
  const check=(condition,message) => { assert.ok(condition,message); results.push(message); };
  await page.goto(base);
  const old={'Preliminares de Matemática':{e:'aprobada',nota:8,exs:[]},'Introducción a la Informática':{e:'en-curso',nota:null,exs:[{tipo:'Parcial 1',fecha:'2026-12-10',nota:null}]},'_otro_pc':'pendiente'};
  const original=JSON.stringify(old);
  await page.evaluate(raw => localStorage.setItem('ap2_state',raw),original);
  await page.reload();
  const migrated=await page.evaluate(() => JSON.parse(localStorage.getItem('ap2_state')));
  const hero=page.locator('.academic-hero');
  check(await hero.count() === 1 && await hero.locator('.panel').count() === 0,'Un único resumen principal sin tarjetas internas');
  check(await hero.locator('.hero-subjects .hero-metric-value').innerText() === '1 / 22' && await hero.locator('.hero-hours .hero-metric-value').innerText() === '60 / 2.044 h','Materias y horas reales integradas en la hero card');
  check(await hero.locator('.average-value').innerText() === '8,00 / 10' && await hero.locator('.ring-value').isVisible(),'Promedio y porcentaje visibles en la misma superficie');
  check(!!migrated['Introducción a la Informática'].exs[0].id,'Migración preserva los exámenes y asigna IDs');
  check(await page.evaluate(raw => Object.keys(localStorage).filter(k => k.startsWith('ap2_backup_')).some(k => localStorage.getItem(k) === raw),original),'Backup previo conserva los bytes originales');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  check(await page.locator('#result-count').isHidden(),'Contador de resultados oculto sin búsqueda ni filtros');
  await page.locator('#search').fill('   ');
  check(await page.locator('#result-count').isHidden(),'Una búsqueda vacía con espacios no activa el contador');
  await page.locator('#search').fill('');
  await page.evaluate(() => window.scrollTo(0,260));
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  check(await page.evaluate(() => window.scrollY === 0),'Cambiar de vista abre Inicio en su posición inicial');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  check(await page.evaluate(() => window.scrollY >= 250),'Volver a Materias conserva su posición de lectura');
  await page.evaluate(() => window.scrollTo(0,0));
  await page.locator('#subject-alg > summary').click();
  check(await page.locator('#detail-alg [data-action="activate"]').isEnabled(),'Correlativa aprobada habilita Álgebra');
  await page.locator('#detail-alg [data-action="activate"]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('ap2_state'))['Álgebra']?.e === 'en-curso');
  check(await page.locator('#subject-alg').getAttribute('open') !== null,'Operación conserva acordeones abiertos');
  await page.locator('#detail-alg [data-action="approve"]').click();
  await page.locator('#final-grade').fill('9'); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.locator('#subject-inf > summary').click();
  await page.locator('#detail-inf [data-action="exam-edit"]').click();
  await page.locator('#exam-date').fill('2026-12-11');
  await page.locator('#exam-kind').selectOption('Final');
  await page.locator('#exam-grade').fill('7'); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  check(await page.locator('.average-value').innerText() === '8,50 / 10','Promedio se actualiza inmediatamente');
  check(await page.locator('.exam-item').count() === 0,'Calificar un examen lo quita de próximos sin recargar');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  await page.locator('#detail-inf [data-action="exam-edit"]').click();
  await page.locator('#exam-grade').fill(''); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('ap2_state'))['Introducción a la Informática'].exs[0].id) === migrated['Introducción a la Informática'].exs[0].id,'Edición y calificación conservan ID estable');
  await page.locator('#subject-pre > summary').click();
  await page.locator('#detail-pre [data-action="revert"]').click(); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  await page.locator('#detail-alg [data-action="revert"]').click(); await page.locator('#modal-submit').click();
  await page.waitForFunction(() => !document.querySelector('#modal').open);
  check(await page.locator('#detail-alg [data-action="activate"]').isDisabled(),'Revertir correlativa actualiza bloqueos al instante');
  await page.locator('#search').fill('ingles');
  check(await page.locator('#result-count').isVisible(),'Contador visible al buscar materias');
  check(await page.locator('#result-count').innerText() === '0 de 22 asignaturas · 3 de 3 niveles de Inglés','Búsqueda ignora tildes y mantiene el foco');
  check(await page.locator('#search').evaluate(el => el === document.activeElement),'Buscador conserva foco');
  await page.locator('#search').fill('');
  await page.locator('#status-filter').selectOption('en-curso');
  check(await page.locator('#result-count').innerText() === '1 de 22 asignaturas · 0 de 3 niveles de Inglés','Filtro por estado funcional');
  await page.locator('#status-filter').selectOption('all');
  check(await page.locator('#result-count').isHidden(),'Quitar todos los filtros vuelve a ocultar el contador');
  const second=await page.context().newPage(); await second.goto(base+'#materias');
  await page.evaluate(async() => { const s=await import('./js/state.js'); await s.dispatch({type:'equivalence',subject:'pre'}); });
  await second.waitForFunction(() => document.querySelector('#subject-pre .subject-status')?.textContent === 'Equivalencia');
  check(true,'Evento storage sincroniza dos pestañas reales');
  await second.close();
  await page.reload();
  check(await page.locator('#subject-pre .subject-status').innerText() === 'Equivalencia','Estado persiste al volver a abrir la página');
  await page.getByRole('link',{name:'Configuración',exact:true}).click();
  check(await page.getByRole('heading',{name:'Copias de seguridad',exact:true}).isVisible(),'Historial titulado Copias de seguridad');
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
  await page.locator('#detail-pre [data-action="equivalence"]').click();
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
  check(await page.evaluate(() => document.activeElement.closest('dialog') !== null),'Modal mantiene navegación con teclado dentro del diálogo');
  await page.keyboard.press('Escape');
  check(await page.locator('#modal').evaluate(el => !el.open),'Escape cierra el modal');
  // Seed a complete, labelled-in-report fixture for responsive screenshots.
  await page.evaluate(async() => {
    const c=await import('./js/core.js'); let data={};
    for(const m of c.SUBJECTS.slice(0,11)) data=c.applyCommand(data,{type:'equivalence',subject:m.id});
    for(const id of ['pre','alg','ama','inf','in1','amb','dis','pro','diu','eda','syo']) data=c.applyCommand(data,{type:'approve',subject:id,grade:8});
    for(const id of ['lia','pye']) data=c.applyCommand(data,{type:'activate',subject:id});
    const today=c.todayISO(); const date=days => new Date(Date.parse(today)+days*86400000).toISOString().slice(0,10);
    data=c.applyCommand(data,{type:'exam-add',subject:'lia',id:'ex-qa-near',kind:'Parcial 2',date:date(3)});
    data=c.applyCommand(data,{type:'exam-add',subject:'pye',id:'ex-qa-far',kind:'Final',date:date(18)});
    localStorage.setItem('ap2_state',JSON.stringify(data)); (await import('./js/state.js')).readLocal();
  });
  await page.reload();
  check(await page.locator('#year-2').evaluate(el => el.open),'Materias abre automáticamente el año con cursadas activas');
  check(await page.locator('.year-number,.subject-code,.state-mark,.pill').count() === 0,'Sin recuadros numerados, abreviaturas, barras laterales ni pills redundantes');
  await page.getByRole('link',{name:'Inicio',exact:true}).click();
  // Shared desktop detail: no term expands vertically, and mobile keeps it inline.
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(base+'#materias');
  const savedBeforeLayout=await page.evaluate(() => localStorage.getItem('ap2_state'));
  const termHeights=await page.locator('#year-2 .semester').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
  await page.locator('#subject-lia > summary').click();
  await page.waitForFunction(() => document.querySelector('#detail-lia').parentElement.classList.contains('year-subject-details'));
  const desktopDetail=await page.locator('#year-2').evaluate(el => {
    const grid=el.querySelector('.semester-grid').getBoundingClientRect(), body=el.querySelector('#detail-lia').getBoundingClientRect();
    return {width:body.width,gridWidth:grid.width,x:body.x,gridX:grid.x,y:body.y,gridBottom:grid.bottom,heights:[...el.querySelectorAll('.semester')].map(s => s.getBoundingClientRect().height)};
  });
  check(desktopDetail.heights.every((h,i) => Math.abs(h-termHeights[i]) < 1),'Expandir el cuatrimestre derecho no estira ninguna columna');
  check(Math.abs(desktopDetail.width-desktopDetail.gridWidth) < 1 && Math.abs(desktopDetail.x-desktopDetail.gridX) < 1 && desktopDetail.y >= desktopDetail.gridBottom,'Detalle desktop a ancho completo debajo de ambos cuatrimestres');
  await page.locator('#subject-diu > summary').click();
  await page.waitForFunction(() => document.querySelector('#detail-diu').parentElement.classList.contains('year-subject-details'));
  check(await page.locator('#year-2 .year-subject-details > .subject-detail').count() === 2,'Se conservan múltiples detalles abiertos sin duplicar controles');
  await page.locator('#subject-diu > summary').click();
  await page.locator('#detail-lia [data-action="close-subject"]').click();
  check(await page.locator('#subject-lia').evaluate(el => !el.open && el.querySelector('summary') === document.activeElement),'Cerrar el detalle desktop devuelve el foco a su materia');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => document.querySelector('#subject-lia').open);
  await page.setViewportSize({width:390,height:1000});
  await page.waitForFunction(() => document.querySelector('#detail-lia').parentElement.id === 'subject-lia');
  check(await page.locator('#detail-lia .subject-primary-actions button').count() === 2,'Agregar examen y Aprobar permanecen directos en mobile');
  const actionGroups=await page.locator('#detail-lia').evaluate(el => {
    const primary=el.querySelector('.subject-primary-actions').getBoundingClientRect(), secondary=el.querySelector('.subject-secondary-actions').getBoundingClientRect();
    return {separate:secondary.top > primary.bottom,destructiveInPrimary:!!el.querySelector('.subject-primary-actions [data-action="fail"],.subject-primary-actions [data-action="revert"]')};
  });
  check(actionGroups.separate && !actionGroups.destructiveInPrimary,'Acciones secundarias y cambios de estado separados de las principales en mobile');
  await page.locator('#detail-lia [data-action="exam-add"]').focus();
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForFunction(() => document.querySelector('#detail-lia').parentElement.classList.contains('year-subject-details'));
  check(await page.locator('#detail-lia [data-action="exam-add"]').evaluate(el => el === document.activeElement),'Cambiar entre mobile y desktop conserva detalle abierto y foco');
  check(await page.evaluate(() => localStorage.getItem('ap2_state')) === savedBeforeLayout,'Abrir, cerrar y redistribuir detalles no modifica los datos guardados');
  const dimensions=[];
  for(const width of [1920,1440,1280,768,390]) {
    await page.setViewportSize({width,height:1000});
    for(const route of ['inicio','materias','configuracion']) {
      await page.goto(base+'#'+route);
      if (route === 'inicio') {
        const layout=await hero.evaluate(el => {
          const box=el.getBoundingClientRect(), dashboard=el.parentElement.getBoundingClientRect();
          return {fullWidth:Math.abs(box.width-dashboard.width) < 1,inside:[...el.querySelectorAll('.ring,.hero-subjects,.hero-hours,.hero-average')].every(metric => { const m=metric.getBoundingClientRect(); return m.left >= box.left && m.right <= box.right && m.top >= box.top && m.bottom <= box.bottom; })};
        });
        assert.ok(layout.fullWidth && layout.inside,`Resumen integrado sin desbordes a ${width}px`);
      }
      if(route === 'materias') {
        await page.locator('#year-1').evaluate(el => el.open=true);
        await page.locator('#year-2').evaluate(el => el.open=true);
        await page.locator('#subject-pre').evaluate(el => el.open=true);
        if (width === 390) check(await page.locator('#search').evaluate(el => el.clientWidth >= 200),'Buscador mobile conserva un ancho útil para escribir y leer');
        if (width === 1440) {
          const terms = await page.locator('#year-2 .semester').evaluateAll(els => els.map(el => ({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y})));
          check(terms[1].x > terms[0].x && Math.abs(terms[1].y - terms[0].y) < 1,'Cuatrimestres alineados en dos columnas en desktop');
        }
      }
      const sizes=await page.evaluate(() => ({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert.ok(sizes.scroll <= sizes.client,`Horizontal overflow ${width} ${route}: ${JSON.stringify(sizes)}`);
      dimensions.push(`${width}:${route}`);
    }
  }
  check(dimensions.length === 15,'Sin desborde en 1920, 1440, 1280, 768 y 390 px en las tres vistas');
  check(true,'Hero a ancho completo con las cuatro métricas contenidas en desktop, tablet y mobile');
  for(const [width,name] of [[1920,'desktop-1920'],[1440,'desktop'],[1280,'desktop-1280'],[390,'mobile']]) {
    await page.setViewportSize({width,height:1000});
    await page.goto(base+'#inicio');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('#toast')).opacity === '0');
    await page.evaluate(() => window.scrollTo(0,0));
    await page.evaluate(() => document.fonts.ready);
    await capture(page,'dashboard-'+name);
    if (dashboardOnly) continue;
    await page.goto(base+'#materias');
    await page.locator('#mat-list details').evaluateAll(els => els.forEach(el => el.open=false));
    await page.locator('#year-2').evaluate(el => el.open=true);
    await page.locator('#subject-lia').evaluate(el => el.open=true);
    await page.evaluate(() => window.scrollTo(0,0));
    await capture(page,'materias-'+name);
    await page.goto(base+'#configuracion');
    await page.evaluate(() => window.scrollTo(0,0));
    await capture(page,'configuracion-'+name);
  }
  check(await page.evaluate(() => document.fonts.check('400 14px Inter') && document.fonts.check('500 24px "Source Serif"')),'Tipografías locales cargadas y disponibles');
  for(const path of ['assets/favicon.svg','assets/favicon-16.png','assets/favicon-32.png','assets/apple-touch-icon.png','assets/icon-192.png','assets/icon-512.png','manifest.webmanifest','js/app.js','css/styles.css','assets/fonts/InterVariable.woff2','assets/fonts/SourceSerif4Variable.woff2']) {
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
    for(const m of c.SUBJECTS.slice(8)) await s.dispatch({type:'revert',subject:m.id});
  });
  check(await page.locator('#req-eps [data-status="en-curso"]').isDisabled(),'EPS vuelve a bloquearse al bajar del porcentaje requerido');
  await page.locator('#req-pc > summary').click();
  check(await page.locator('#req-pc [data-status="en-curso"]').isDisabled(),'Prácticas Comunitarias se bloquea por debajo de 9 aprobadas');
  await page.evaluate(async() => (await import('./js/state.js')).dispatch({type:'equivalence',subject:'arq'}));
  check(await page.locator('#req-pc [data-status="en-curso"]').isEnabled(),'Prácticas Comunitarias se actualiza al alcanzar 9 aprobadas');
  // Corrupt state must remain byte-for-byte intact even after opening the app.
  await page.evaluate(() => localStorage.setItem('ap2_state','{broken'));
  await page.reload();
  check(await page.locator('#data-warning').isVisible(),'Lectura corrupta muestra protección de datos');
  check(await page.evaluate(() => localStorage.getItem('ap2_state')) === '{broken','Lectura corrupta no sobrescribe los bytes originales');
  check(errors.length === 0,'Sin errores JavaScript en las pruebas del navegador');
  check(externalRequests.length === 0,'La aplicación no realiza solicitudes a servicios externos');
  return {checks:results.length,results,dimensions,errors,externalRequests};
}
