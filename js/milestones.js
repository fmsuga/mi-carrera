import { OTROS, TOTAL_M, stats } from './core.js';

// Presentation history only. The academic state and exported JSON stay intact.
export const MILESTONE_KEY = 'ap2_ui_milestones_v1';
const goals = OTROS.map(req => ({...req,percent:Math.round(req.threshold*100),count:Math.ceil(TOTAL_M*req.threshold)}));

export function createMilestoneTracker(storage,withStateLock = fn => Promise.resolve().then(fn)) {
  function read() {
    try {
      const raw = storage.getItem(MILESTONE_KEY);
      if (raw === null) return [];
      const value = JSON.parse(raw);
      if (value?.version !== 1 || !Array.isArray(value.reached) || !value.reached.every(p => goals.some(g => g.percent === p))) return null;
      return value.reached;
    } catch { return null; }
  }
  function observed(data) {
    const count = stats(data).ap;
    return goals.filter(g => count >= g.count || ['en-curso','acreditado'].includes(data['_otro_'+g.id])).map(g => g.percent);
  }
  function save(previous,next) {
    if (next.length === previous.length && previous.every(p => next.includes(p))) return true;
    try { storage.setItem(MILESTONE_KEY,JSON.stringify({version:1,reached:next})); return true; }
    catch { return false; } // Never celebrate if the one-time record cannot be saved.
  }
  return {
    async observe(data) {
      const known = observed(data);
      try {
        // Reads/imports wait for an in-flight command to claim its milestone.
        return await withStateLock(() => {
          const previous = read();
          return previous !== null && save(previous,[...new Set([...previous,...known])]);
        });
      } catch { return false; }
    },
    command(before,after,command) {
      const previous = read();
      if (previous === null) return [];
      const known = new Set([...previous,...observed(before)]);
      const from = stats(before).ap, to = stats(after).ap;
      const crossed = ['approve','equivalence'].includes(command.type)
        ? goals.filter(g => from < g.count && to >= g.count && !known.has(g.percent)) : [];
      const next = [...new Set([...known,...observed(after)])];
      // Called synchronously by dispatch's post-persistence event, under its lock.
      return save(previous,next) ? crossed : [];
    },
  };
}
