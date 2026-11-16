import test from 'node:test';
import assert from 'node:assert/strict';
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
