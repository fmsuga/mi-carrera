import test from 'node:test';
import assert from 'node:assert/strict';
import { SUBJECTS } from '../js/core.js';
import { createMilestoneTracker, MILESTONE_KEY } from '../js/milestones.js';
class Storage {
  data = new Map();
  fail = false;
  writes = 0;
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key,value) { if (this.fail) throw new Error('QuotaExceededError'); this.data.set(key,value); this.writes++; }
}
const approved = count => Object.fromEntries(SUBJECTS.slice(0,count).map(m => [m.n,{e:'aprobada',nota:null,exs:[]}]));

test('first actual crossing of 40% is recorded once without touching academic data',async() => {
  const storage=new Storage(), tracker=createMilestoneTracker(storage), before=approved(13), after=approved(14);
  const original=JSON.stringify(after);
  await tracker.observe(before); assert.equal(storage.writes,0);
  assert.deepEqual(tracker.command(before,after,{type:'approve'}).map(g => g.percent),[40]);
  assert.deepEqual(JSON.parse(storage.getItem(MILESTONE_KEY)).reached,[40]);
  assert.equal(JSON.stringify(after),original);
  assert.deepEqual([...storage.data.keys()],[MILESTONE_KEY]);
  assert.deepEqual(tracker.command(before,after,{type:'approve'}),[]);
  assert.equal(storage.writes,1);
});
test('equivalence counts as a real approval for the celebration',() => {
  const tracker=createMilestoneTracker(new Storage());
  assert.deepEqual(tracker.command(approved(13),approved(14),{type:'equivalence'}).map(g => g.id),['pc']);
});
test('no rounded thresholds: 13/33 and 23/33 do not reach 40% or 70%',() => {
  const tracker=createMilestoneTracker(new Storage());
  assert.deepEqual(tracker.command(approved(12),approved(13),{type:'approve'}),[]);
  assert.deepEqual(tracker.command(approved(22),approved(23),{type:'approve'}),[]);
  assert.deepEqual(tracker.command(approved(23),approved(24),{type:'approve'}).map(g => g.percent),[70]);
});
test('grade edits and unrelated commands do not celebrate',() => {
  const tracker=createMilestoneTracker(new Storage());
  assert.deepEqual(tracker.command(approved(14),approved(14),{type:'approve'}),[]);
  assert.deepEqual(tracker.command(approved(23),approved(24),{type:'exam-grade'}),[]);
});
test('existing data and reloads are silent, including reversals and later recrossings',async() => {
  const storage=new Storage(), tracker=createMilestoneTracker(storage);
  await tracker.observe(approved(24));
  assert.deepEqual(JSON.parse(storage.getItem(MILESTONE_KEY)).reached,[40,70]);
  tracker.command(approved(24),approved(13),{type:'revert'});
  const reloaded=createMilestoneTracker(storage);
  assert.deepEqual(reloaded.command(approved(13),approved(14),{type:'approve'}),[]);
  assert.deepEqual(reloaded.command(approved(23),approved(24),{type:'approve'}),[]);
});
test('imported/migrated progress is observed silently and cannot celebrate on recrossing',async() => {
  const storage=new Storage(), tracker=createMilestoneTracker(storage);
  await tracker.observe(approved(13));
  await tracker.observe(approved(14));
  assert.deepEqual(tracker.command(approved(14),approved(13),{type:'revert'}),[]);
  assert.deepEqual(tracker.command(approved(13),approved(14),{type:'equivalence'}),[]);
});
test('historically started or accredited requirements suppress an old achievement',async() => {
  const storage=new Storage(), tracker=createMilestoneTracker(storage);
  await tracker.observe({...approved(13),_otro_pc:'en-curso'});
  assert.deepEqual(tracker.command(approved(13),approved(14),{type:'approve'}),[]);
});
test('quiet cross-tab observations wait for the originating command to claim its milestone',async() => {
  const storage=new Storage(); let release;
  const held=new Promise(resolve => { release=resolve; });
  const origin=createMilestoneTracker(storage);
  const other=createMilestoneTracker(storage,async fn => { await held; return fn(); });
  const observation=other.observe(approved(14));
  assert.deepEqual(origin.command(approved(13),approved(14),{type:'approve'}).map(g => g.percent),[40]);
  release(); await observation;
  assert.deepEqual(other.command(approved(13),approved(14),{type:'approve'}),[]);
});
test('UI storage errors never trigger an unrecorded celebration or throw into a command',async() => {
  const storage=new Storage(), tracker=createMilestoneTracker(storage); storage.fail=true;
  assert.deepEqual(tracker.command(approved(13),approved(14),{type:'approve'}),[]);
  assert.equal(await tracker.observe(approved(24)),false);
  assert.equal(storage.getItem(MILESTONE_KEY),null);
});
test('invalid or future UI histories are preserved and suppress celebrations',async() => {
  for(const raw of ['{broken','null','{"version":2,"reached":[]}','{"version":1,"reached":[99]}']) {
    const storage=new Storage(); storage.setItem(MILESTONE_KEY,raw);
    const tracker=createMilestoneTracker(storage);
    assert.deepEqual(tracker.command(approved(13),approved(14),{type:'approve'}),[]);
    assert.equal(await tracker.observe(approved(24)),false);
    assert.equal(storage.getItem(MILESTONE_KEY),raw);
  }
});
