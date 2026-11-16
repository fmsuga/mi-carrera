import test from 'node:test';
import assert from 'node:assert/strict';
import { EDITABLE_SUBJECTS, stats } from '../js/core.js';
class Storage {
  data = new Map();
  failBackup = false;
  failWrite = false;
  getItem(k) { return this.data.get(k) ?? null; }
  setItem(k,v) { if ((this.failBackup && k.startsWith('ap2_backup_')) || (this.failWrite && k === 'ap2_state')) throw new Error('QuotaExceededError'); this.data.set(k,String(v)); }
}
let serial=0;
async function setup(raw) {
  globalThis.localStorage=new Storage();
  if(raw !== undefined) localStorage.setItem('ap2_state',raw);
  globalThis.window=new EventTarget();
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{}});
  const s=await import('../js/state.js?test='+serial++);
  return {s,storage:localStorage};
}
test('startup migration makes exact backup, preserves all fields, persists IDs',async() => {
  const raw=JSON.stringify({'Inglés I':{e:'en-curso',nota:null,exs:[{tipo:'Final',fecha:'2026-12-01',nota:7}],unknown:'keep'},_otro_pc:'acreditado'});
  const {s,storage}=await setup(raw);
  assert.equal(s.getReadError(),'');
  const backups=[...storage.data.keys()].filter(k => k.startsWith('ap2_backup_'));
  assert.equal(backups.length,1); assert.equal(storage.getItem(backups[0]),raw);
  const migrated=storage.getItem('ap2_state'); s.readLocal();
  assert.equal(storage.getItem('ap2_state'),migrated);
  assert.equal(s.getState()['Inglés I'].unknown,'keep');
});
test('malformed JSON or schema never overwrites original storage, and blocks writes',async() => {
  for(const raw of ['{"broken"','null','[]','{"Álgebra":{"e":"invalid"}}']) {
    const {s,storage}=await setup(raw);
    assert.ok(s.getReadError()); assert.equal(storage.getItem('ap2_state'),raw);
    await assert.rejects(s.dispatch({type:'equivalence',subject:'inf'}));
    assert.equal(storage.getItem('ap2_state'),raw);
  }
});
test('migration quota failure leaves original bytes intact',async() => {
  const {s,storage}=await setup('{}');
  const raw='{"Inglés I":{"exs":[{"tipo":"Final","fecha":"","nota":null}]}}';
  storage.setItem('ap2_state',raw); storage.failBackup=true; s.readLocal();
  assert.ok(s.getReadError()); assert.equal(storage.getItem('ap2_state'),raw);
});
test('failed persistence never publishes a success or changes current state',async() => {
  const {s,storage}=await setup('{}'); let events=0; s.subscribe(() => events++);
  storage.failWrite=true;
  await assert.rejects(s.dispatch({type:'equivalence',subject:'inf'}));
  assert.deepEqual(s.getState(),{}); assert.equal(storage.getItem('ap2_state'),'{}'); assert.equal(events,0);
});
test('valid import backs up previous bytes; failed backup aborts replacement',async() => {
  const raw='{"Inglés I":{"e":"aprobada","nota":7,"exs":[]}}';
  const {s,storage}=await setup(raw);
  storage.failBackup=true; await assert.rejects(s.replaceLocal({}));
  assert.equal(storage.getItem('ap2_state'),raw);
  storage.failBackup=false; await s.replaceLocal({});
  assert.deepEqual(s.getState(),{});
  assert.ok([...storage.data.entries()].some(([k,v]) => k.includes('pre_import') && v === raw));
});
test('updates use latest storage, emit once and storage events synchronize views',async() => {
  const {s,storage}=await setup('{}'); let events=0; s.subscribe(() => events++);
  storage.setItem('ap2_state','{"Inglés I":{"e":"aprobada","nota":8,"exs":[]}}');
  await s.dispatch({type:'equivalence',subject:'inf'});
  assert.equal(s.getState()['Inglés I'].nota,8); assert.equal(events,1);
  storage.setItem('ap2_state','{"Inglés II":{"e":"aprobada","nota":9}}');
  const event=new Event('storage'); event.key='ap2_state'; window.dispatchEvent(event);
  assert.equal(s.getState()['Inglés II'].nota,9); assert.equal(events,2);
});

test('presentation events identify successful commands, reads and imports precisely',async() => {
  const {s,storage}=await setup('{}'); const events=[];
  s.subscribe(event => { events.push(event); assert.deepEqual(JSON.parse(storage.getItem('ap2_state')),s.getState()); });
  await s.dispatch({type:'equivalence',subject:'inf'});
  assert.equal(events[0].source,'command'); assert.equal(events[0].command.type,'equivalence');
  assert.deepEqual(events[0].previous,{});
  s.readLocal(); assert.equal(events[1].source,'read');
  await s.replaceLocal({}); assert.equal(events[2].source,'import');
  storage.failWrite=true;
  await assert.rejects(s.dispatch({type:'equivalence',subject:'inf'}));
  assert.equal(events.length,3);
});

const legacyData = withIds => ({
  'Preliminares de Matemática':{e:'aprobada',nota:8,exs:[]},
  ...Object.fromEntries(['Inglés I','Inglés II','Inglés III'].map((name,i)=>[name,{e:i===1?'en-curso':'aprobada',nota:i===1?null:String(7+i),extra:{keep:true},exs:[{...(withIds?{id:'ex-original-'+i}:{}),tipo:'Final',fecha:'2026-12-01',nota:6,custom:'keep'}]}])),
  'Base de Datos II':{e:'aprobada',nota:10,exs:[{tipo:'Final',fecha:'2026-12-01',nota:10}],extra:{keep:true}},
  'Proyecto Final II':{e:'en-curso',exs:[{id:'original-outside-id',tipo:'Final',fecha:'2026-12-01',nota:null}]},
  'Registro sin correspondencia':{original:[1,{preserve:true}]},
  _otro_pc:'acreditado',_otro_eps:'en-curso',
});
test('V1 to corrected plan: exact prior backup; only editable exam IDs added',async() => {
  const old=legacyData(false),raw=JSON.stringify(old,null,2),{s,storage}=await setup(raw);
  assert.equal(s.getReadError(),'');
  assert.ok([...storage.data.entries()].some(([k,v])=>k.includes('pre_migration')&&v===raw));
  const restored=structuredClone(s.getState());
  for(const m of EDITABLE_SUBJECTS) for(const ex of restored[m.n]?.exs||[]) { assert.ok(ex.id); delete ex.id; }
  assert.deepEqual(restored,old);
  const migrated=storage.getItem('ap2_state');s.readLocal();assert.equal(storage.getItem('ap2_state'),migrated);
  assert.equal(stats(s.getState()).ap,1);assert.equal(stats(s.getState()).prom,8);
});
test('V2 to corrected plan: category changes never rewrite any academic bytes',async() => {
  const old=legacyData(true),raw=JSON.stringify(old,null,2),{s,storage}=await setup(raw);
  assert.equal(s.getReadError(),'');assert.deepEqual(s.getState(),old);
  assert.equal(storage.getItem('ap2_state'),raw);assert.equal(storage.data.size,1);
  s.readLocal();assert.equal(storage.getItem('ap2_state'),raw);
});
test('old JSON import keeps English, historical and unmapped records, with exact prior backup',async() => {
  const previous='{"Preliminares de Matemática":{"e":"aprobada","nota":8}}';
  const {s,storage}=await setup(previous),old=legacyData(true);
  await s.replaceLocal(old);assert.deepEqual(s.getState(),old);
  assert.ok([...storage.data.entries()].some(([k,v])=>k.includes('pre_import')&&v===previous));
  assert.equal(stats(s.getState()).ap,1);
  await s.dispatch({type:'equivalence',subject:'inf'});
  for(const name of ['Inglés I','Inglés II','Inglés III','Base de Datos II','Proyecto Final II','Registro sin correspondencia']) assert.deepEqual(s.getState()[name],old[name]);
});
test('empty profile is never initialized with an empty state or sample data',async() => {
  const {s,storage}=await setup();assert.deepEqual(s.getState(),{});assert.equal(storage.getItem('ap2_state'),null);assert.equal(storage.data.size,0);
});
