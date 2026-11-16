import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SUBJECTS, LANGUAGES, EDITABLE_SUBJECTS, HISTORICAL_SUBJECTS, retainedRecords, TOTAL_M, TOTAL_H, OTROS, ms, normalizeState, stats, bloqueoActivar, applyCommand, upcoming, todayISO, daysUntil } from '../js/core.js';
const equiv = (data,id) => applyCommand(data,{type:'equivalence',subject:id});
test('official 2025 plan: 22 subjects, 2044 hours, three years and stable IDs',() => {
  assert.equal(TOTAL_M,22); assert.equal(TOTAL_H,2044);
  assert.equal(new Set(SUBJECTS.map(m => m.id)).size,22);
  assert.deepEqual([1,2,3].map(year => SUBJECTS.filter(m => m.a === year).length),[7,7,8]);
  assert.ok(SUBJECTS.every(m => m.a <= 3));
  assert.deepEqual(LANGUAGES.map(m => [m.id,m.n,m.h,m.r]),[['in1','Inglés I',70,[]],['in2','Inglés II',100,[]],['in3','Inglés III',80,[]]]);
  assert.equal(new Set([...EDITABLE_SUBJECTS,...HISTORICAL_SUBJECTS].map(m => m.id)).size,33);
  for(const m of SUBJECTS) for(const n of m.r) assert.ok(SUBJECTS.some(x => x.n === n));
  assert.deepEqual(OTROS.map(r => [r.id,r.h,r.threshold]),[['pc',40,.4],['eps',70,.7]]);
});
test('0%, intermediate and 100%; equivalents count hours and exclude ungraded averages',() => {
  assert.equal(stats({}).pct,0); assert.equal(stats({}).prom,null);
  let data=applyCommand({},{type:'approve',subject:'pre',grade:8});
  data=equiv(data,'inf');
  assert.equal(stats(data).prom,8); assert.equal(stats(data).ap,2); assert.equal(stats(data).hAp,156);
  assert.equal(stats(data).pct,2/22*100);
  for(const m of SUBJECTS) data=equiv(data,m.id);
  assert.equal(stats(data).pct,100); assert.equal(stats(data).hAp,2044); assert.equal(stats(data).prom,null);
});
test('numeric legacy grades and approvals without a grade',() => {
  const data={'Álgebra':{e:'aprobada',nota:'7',exs:[]},'Inglés I':{e:'aprobada',nota:null}};
  assert.equal(stats(data).prom,7); assert.equal(stats(data).graded,1);
  const equivalent=applyCommand(data,{type:'equivalence',subject:'inf',grade:9});
  assert.equal(stats(equivalent).prom,8); assert.equal(stats(equivalent).graded,2);
});
test('legacy migration is additive, deterministic and idempotent',() => {
  const old={'Introducción a la Informática':{e:'en-curso',nota:null,custom:'keep',exs:[{tipo:'Final',fecha:'2026-12-01',nota:null},{tipo:'Parcial 1',fecha:'',nota:6}]},_otro_pc:'en-curso',custom:{retained:true}};
  const migrated=normalizeState(old);
  assert.equal(old['Introducción a la Informática'].exs[0].id,undefined);
  assert.ok(migrated['Introducción a la Informática'].exs[0].id.startsWith('ex-'));
  assert.deepEqual(normalizeState(migrated),migrated); assert.deepEqual(normalizeState(old),migrated);
  assert.equal(migrated.custom.retained,true); assert.equal(migrated['Introducción a la Informática'].custom,'keep');
});
test('reject malformed imports without mutating input',() => {
  for(const data of [null,[],42,{'Álgebra':{e:'wrong'}},{'Álgebra':{exs:{}}},{'Álgebra':{nota:11}},{'Álgebra':{exs:[{tipo:'Final',fecha:'2026-02-30'}]}}]) assert.throws(() => normalizeState(data,true));
  assert.throws(() => normalizeState(JSON.parse('{"__proto__":{}}')));
});
test('prerequisites and language constraints re-evaluate after reversals',() => {
  let data={}; assert.ok(bloqueoActivar(data,'Álgebra'));
  data=equiv(data,'pre'); assert.equal(bloqueoActivar(data,'Álgebra'),null);
  data=applyCommand(data,{type:'activate',subject:'alg'});
  data=applyCommand(data,{type:'revert',subject:'pre'});
  assert.ok(bloqueoActivar(data,'Álgebra')); assert.equal(ms(data,'Álgebra').e,'en-curso');
  assert.throws(() => applyCommand(data,{type:'approve',subject:'alg',grade:8}));
  for(const m of SUBJECTS.filter(m => !m.n.startsWith('Inglés'))) data=equiv(data,m.id);
  assert.match(bloqueoActivar(data,'Arquitectura de Computadoras'),/Inglés I/);
  assert.match(bloqueoActivar(data,'Base de Datos I'),/Inglés II/);
  assert.match(bloqueoActivar(data,'Programación Orientada a la Web'),/Inglés III/);
  for(const id of ['in1','in2','in3']) data=equiv(data,id);
  assert.equal(bloqueoActivar(data,'Base de Datos I'),null);
});
test('40% and 70% thresholds, including re-locking without erasing requirements',() => {
  let data={};
  for(const m of SUBJECTS.slice(0,8)) data=equiv(data,m.id);
  assert.throws(() => applyCommand(data,{type:'requirement',id:'pc',status:'en-curso'}));
  data=equiv(data,SUBJECTS[8].id);
  data=applyCommand(data,{type:'requirement',id:'pc',status:'en-curso'});
  data=applyCommand(data,{type:'revert',subject:SUBJECTS[8].id});
  assert.equal(data._otro_pc,'en-curso');
  assert.throws(() => applyCommand(data,{type:'requirement',id:'pc',status:'acreditado'}));
  for(const m of SUBJECTS.slice(0,16)) data=equiv(data,m.id);
  data=applyCommand(data,{type:'requirement',id:'eps',status:'en-curso'});
  assert.equal(data._otro_eps,'en-curso');
});
test('exam IDs survive edits, ordering, grades, reverts and deletion',() => {
  let data=applyCommand({},{type:'activate',subject:'inf'});
  data=applyCommand(data,{type:'exam-add',subject:'inf',id:'ex-abc',kind:'Final',date:'2026-12-20'});
  data=applyCommand(data,{type:'exam-add',subject:'inf',id:'ex-def',kind:'Parcial 1',date:'2026-12-01'});
  assert.equal(upcoming(data,'2026-11-16')[0].id,'ex-def');
  data=applyCommand(data,{type:'exam-edit',subject:'inf',id:'ex-abc',kind:'Parcial 2',date:'2026-11-30',grade:9});
  assert.equal(upcoming(data,'2026-11-16').length,1);
  data=applyCommand(data,{type:'exam-grade',subject:'inf',id:'ex-abc',grade:null});
  assert.equal(upcoming(data,'2026-11-16')[0].id,'ex-abc');
  data=applyCommand(data,{type:'revert',subject:'inf'}); assert.equal(ms(data,'Introducción a la Informática').exs.length,2);
  data=applyCommand(data,{type:'exam-delete',subject:'inf',id:'ex-abc'});
  assert.equal(ms(data,'Introducción a la Informática').exs[0].id,'ex-def');
  assert.throws(() => applyCommand(data,{type:'exam-delete',subject:'inf',id:'ex-abc'}));
});
test('strict command validation and no mutation on error',() => {
  const data={};
  assert.throws(() => applyCommand(data,{type:'activate',subject:'alg'}));
  assert.throws(() => applyCommand(data,{type:'approve',subject:'inf',grade:3}));
  assert.throws(() => applyCommand(data,{type:'exam-add',subject:'inf',id:'ex-a',kind:'Final',date:'2026-12-10'}));
  assert.deepEqual(data,{});
});
test('Salta day boundary and chronological next exams beyond 30 days',() => {
  assert.equal(todayISO(new Date('2026-11-17T01:00:00Z')),'2026-11-16');
  assert.equal(daysUntil('2026-11-17','2026-11-16'),1);
  const data={'Inglés I':{e:'en-curso',exs:[{id:'ex-a',tipo:'Final',fecha:'2027-04-01',nota:null},{id:'ex-b',tipo:'Final',fecha:'2026-11-17',nota:null,cancelado:true},{id:'ex-c',tipo:'Final',fecha:'2026-11-18',nota:8}]}};
  assert.deepEqual(upcoming(data,'2026-11-16').map(ex => ex.id),['ex-a']);
});
test('GitHub Pages paths and no destructive reset action',() => {
  const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(index,/href="\.\/assets\/favicon.svg"/);
  assert.match(index,/apple-touch-icon/);
  assert.doesNotMatch(index,/maximum-scale|confirmReset|Restablecer|tg-token/);
  for(const file of ['app','state','actions','render']) assert.doesNotMatch(readFileSync(new URL('../js/'+file+'.js',import.meta.url),'utf8'),/location\.reload|resetState|confirmReset/);
});

test('English and historical grades/hours never enter assignment statistics',() => {
  const data={
    'Preliminares de Matemática':{e:'aprobada',nota:8,exs:[]},
    'Inglés I':{e:'aprobada',nota:10,exs:[]},
    'Inglés II':{e:'en-curso',nota:null,exs:[{id:'ex-english',tipo:'Final',fecha:'2026-12-01',nota:null}]},
    'Base de Datos II':{e:'aprobada',nota:4,exs:[]},
    'Proyecto Final II':{e:'en-curso',exs:[{tipo:'Final',fecha:'2026-12-01',nota:null}]},
  };
  const s=stats(data);
  assert.equal(s.ap,1); assert.equal(s.hAp,60); assert.equal(s.prom,8); assert.equal(s.graded,1); assert.equal(s.cur,0);
  assert.deepEqual(upcoming(data,'2026-11-01').map(ex=>ex.subjectId),['in2']);
  assert.deepEqual(normalizeState(data)['Proyecto Final II'],data['Proyecto Final II']);
});

test('English gates match the three official terms, with no invented level prerequisites',() => {
  let data=Object.fromEntries(SUBJECTS.map(m=>[m.n,{e:'aprobada',nota:8,exs:[]}]));
  for(const m of SUBJECTS) {
    const required=m.a===2&&m.c===2?'Inglés I':m.a===3&&m.c===1?'Inglés II':m.a===3&&m.c===2?'Inglés III':null;
    assert.equal(bloqueoActivar(data,m.n),required?`Requiere ${required} acreditado para este cuatrimestre.`:null);
  }
  for(const m of LANGUAGES) assert.equal(bloqueoActivar({},m.n),null);
  for(const m of LANGUAGES) data=equiv(data,m.id);
  for(const m of SUBJECTS) assert.equal(bloqueoActivar(data,m.n),null);
  assert.throws(()=>applyCommand(data,{type:'approve',subject:'bd2',grade:9}));
});

test('old imports preserve historical and unmapped entries verbatim and report conflicts',() => {
  const data={'Base de Datos II':{e:'aprobada',nota:10,exs:[{id:'legacy-original',custom:[1,2]}]},'Nombre sin mapa':{e:'aprobada',nota:9,nested:{keep:true}},_otro_desconocido:{keep:true}};
  assert.deepEqual(normalizeState(data,true),data);
  assert.deepEqual(retainedRecords(data),[{key:'Base de Datos II',historical:true},{key:'Nombre sin mapa',historical:false},{key:'_otro_desconocido',historical:false}]);
  const updated=equiv(data,'pre');
  for(const key of Object.keys(data)) assert.deepEqual(updated[key],data[key]);
  assert.equal(stats(updated).ap,1);
});
