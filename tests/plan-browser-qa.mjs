import assert from 'node:assert/strict';
import {capture} from './browser-qa.mjs';
const base='http://127.0.0.1:4173/mi-carrera/';
export async function runPlanQA(page) {
  const results=[],errors=[];
  const check=(condition,message)=>{assert.ok(condition,message);results.push(message);};
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForSelector('.academic-hero');
  check(await page.evaluate(()=>localStorage.getItem('ap2_state'))===null,'Un perfil vacío no recibe estado inicial ni datos de prueba');
  const original=await page.evaluate(async()=>{
    const {SUBJECTS}=await import('./js/core.js');
    const data=Object.fromEntries(SUBJECTS.slice(0,9).map((m,i)=>[m.n,{e:'aprobada',nota:i===0?7:null,exs:[]}]));
    Object.assign(data,{
      'Inglés I':{e:'aprobada',nota:10,exs:[{tipo:'Final',fecha:'2026-02-01',nota:10}],keep:{all:true}},
      'Inglés II':{e:'en-curso',nota:null,exs:[{tipo:'Final',fecha:'2027-02-01',nota:null}]},
      'Inglés III':{e:'aprobada',nota:'9',exs:[]},
      'Base de Datos II':{e:'aprobada',nota:2,exs:[{tipo:'Registro histórico',custom:{keep:true}}]},
      'Proyecto Final II':{e:'en-curso',exs:[{id:'old-outside-id',tipo:'Final',fecha:'2027-01-01',nota:null}]},
      'Nombre sin mapa <b>':{keep:[1,2,{all:true}]},_otro_pc:'acreditado',_otro_eps:'en-curso',
    });
    const raw=JSON.stringify(data,null,2);localStorage.setItem('ap2_state',raw);return raw;
  });
  await page.reload();await page.waitForSelector('.academic-hero');
  const migration=await page.evaluate(async()=>{
    const {EDITABLE_SUBJECTS}=await import('./js/core.js');
    const saved=JSON.parse(localStorage.getItem('ap2_state')),withoutIds=structuredClone(saved);
    for(const m of EDITABLE_SUBJECTS) for(const ex of withoutIds[m.n]?.exs||[]) delete ex.id;
    return {saved,withoutIds,backups:Object.keys(localStorage).filter(k=>k.includes('pre_migration')).map(k=>localStorage.getItem(k))};
  });
  check(JSON.stringify(migration.withoutIds)===JSON.stringify(JSON.parse(original))&&migration.backups.includes(original),'V1 conserva todos los campos y guarda una copia exacta antes de agregar IDs');
  check(migration.saved['Base de Datos II'].exs[0].id===undefined&&migration.saved['Proyecto Final II'].exs[0].id==='old-outside-id','Los exámenes históricos se conservan literalmente y no cambian de identificador');
  check(await page.locator('.hero-subjects .hero-metric-value').innerText()==='9 / 22'&&(await page.locator('.average-value').innerText()).includes('7,00'),'Estadísticas solo sobre 22 asignaturas: Inglés e históricos no alteran cantidad ni promedio');
  check(await page.locator('#milestone-notice').isHidden(),'Recalcular el plan o migrar datos no celebra umbrales');
  check(await page.locator('.year-mini').count()===3&&await page.locator('#year-4').count()===0,'Solo existen tres años de avance y ningún cuarto año activo');
  await page.getByRole('link',{name:'Materias',exact:true}).click();
  const counts=await Promise.all([1,2,3].map(y=>page.locator('#year-'+y+' .subject').count()));
  check(JSON.stringify(counts)==='[7,7,8]'&&await page.locator('#year-ing .subject').count()===3,'La interfaz separa 7, 7 y 8 asignaturas de los tres niveles de Inglés');
  check((await page.locator('#subject-in1 .subject-grade').innerText()).endsWith('10')&&(await page.locator('#subject-in3 .subject-grade').innerText()).endsWith('9'),'Inglés mantiene estados, notas y controles bajo sus IDs originales');
  check(await page.locator('#mapping-warning').isVisible(),'Los registros sin correspondencia se señalan sin descartarlos');
  await page.getByRole('link',{name:'Configuración',exact:true}).click();
  await page.locator('#retained-records summary').click();
  check((await page.locator('#retained-records').innerText()).includes('Nombre sin mapa <b>')&&await page.locator('#retained-records b').count()===0,'Configuración permite revisar históricos y conflictos con nombres escapados');
  const downloadPromise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();
  const stream=await(await downloadPromise).createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
  const exported=JSON.parse(Buffer.concat(chunks).toString('utf8'));
  check(JSON.stringify(exported)===JSON.stringify(migration.saved),'Exportar JSON incluye Inglés, todos los históricos y los registros desconocidos');
  const v2Raw=JSON.stringify(exported,null,3);
  await page.evaluate(raw=>localStorage.setItem('ap2_state',raw),v2Raw);await page.goto(base);await page.waitForSelector('.academic-hero');
  check(await page.evaluate(()=>localStorage.getItem('ap2_state'))===v2Raw,'V2 con IDs se reconoce automáticamente sin reescribir los bytes');
  await page.reload();await page.waitForSelector('.academic-hero');
  check(await page.evaluate(()=>localStorage.getItem('ap2_state'))===v2Raw,'Reabrir la versión corregida mantiene el estado V2 intacto');
  await page.evaluate(async()=>{await(await import('./js/state.js')).dispatch({type:'approve',subject:'in3',grade:6});});
  check((await page.locator('.average-value').innerText()).includes('7,00')&&(await page.locator('.hero-subjects .hero-metric-value').innerText())==='9 / 22','Editar una nota de Inglés actualiza el requisito sin cambiar las estadísticas de asignaturas');
  await page.getByRole('link',{name:'Configuración',exact:true}).click();
  const beforeImport=await page.evaluate(()=>localStorage.getItem('ap2_state'));
  await page.locator('#import-file').setInputFiles({name:'backup-v1.json',mimeType:'application/json',buffer:Buffer.from(original)});
  await page.waitForFunction(()=>document.querySelector('#modal').open);
  check((await page.locator('#modal-body').innerText()).includes('registros fuera del plan activo'),'La confirmación de importación avisa que conservará los registros fuera del plan');
  await page.locator('#import-confirm').check();await page.locator('#modal-submit').click();
  await page.waitForFunction(()=>!document.querySelector('#modal').open);
  const imported=await page.evaluate(()=>({data:JSON.parse(localStorage.getItem('ap2_state')),backups:Object.keys(localStorage).filter(k=>k.includes('pre_import')).map(k=>localStorage.getItem(k))}));
  check(JSON.stringify(imported.data)===JSON.stringify(migration.saved)&&imported.backups.includes(beforeImport),'Importar V1 conserva todos sus registros, con copia exacta del estado anterior');
  check(await page.locator('#year-4').count()===0&&await page.locator('#subject-bd2').count()===0,'Importar un backup antiguo no reincorpora el cuarto año al plan');
  const stored=await page.evaluate(()=>localStorage.getItem('ap2_state'));
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('toast')).opacity==='0');
  for(const [width,name] of [[1440,'desktop'],[390,'mobile']]) {
    await page.setViewportSize({width,height:1000});await page.goto(base+'#materias');
    await page.locator('#mat-list details').evaluateAll(els=>els.forEach(el=>el.open=false));
    await page.locator('#year-ing').evaluate(el=>el.open=true);await page.locator('#subject-in2').evaluate(el=>el.open=true);
    await page.waitForFunction(w=>document.getElementById('detail-in2').parentElement.classList.contains(w>=1051?'year-subject-details':'subject'),width);
    await page.evaluate(()=>window.scrollTo(0,0));await capture(page,'requisitos-'+name);
    if(width===1440) {
      await page.goto(base+'#configuracion');await page.locator('#retained-records details').evaluate(el=>el.open=true);
      await page.evaluate(()=>window.scrollTo(0,0));await capture(page,'registros-conservados');
    }
  }
  check(await page.evaluate(()=>localStorage.getItem('ap2_state'))===stored,'Consultar requisitos y registros conservados en desktop y mobile no modifica sus datos');
  check(errors.length===0,'Sin errores de navegador en compatibilidad, exportación e importación conservadoras');
  return {checks:results.length,results,errors};
}
