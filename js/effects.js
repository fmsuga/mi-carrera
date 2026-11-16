import { getState, subscribe } from './state.js';
import { createMilestoneTracker } from './milestones.js';
import { icon } from './ui.js';

export function initVisualEffects() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const values = new Map(), running = new Set();
  let noticeTimer;
  const tracker = createMilestoneTracker({
    getItem:key => localStorage.getItem(key),
    setItem:(key,value) => localStorage.setItem(key,value),
  },fn => navigator.locks ? navigator.locks.request('ap2-state-write',fn) : Promise.resolve().then(fn));

  function cancelMotion() {
    running.forEach(animation => animation.cancel());
    running.clear();
  }
  function animateIndicators() {
    running.forEach(animation => { if (!animation.effect.target.isConnected) animation.cancel(); });
    document.querySelectorAll('[data-progress-key]').forEach(el => {
      if (!el.getClientRects().length) return;
      const key = el.dataset.progressKey, target = Number(el.dataset.progressValue);
      const previous = values.get(key) ?? 0;
      values.set(key,target);
      if (reduced.matches || document.hidden || previous === target) return;
      const frames = el.classList.contains('ring-progress')
        ? [{strokeDasharray:`${previous} 100`},{strokeDasharray:`${target} 100`}]
        : [{width:previous+'%'},{width:target+'%'}];
      const animation = el.animate(frames,{duration:850,easing:'cubic-bezier(.2,.7,.2,1)'});
      running.add(animation);
      animation.finished.catch(() => {}).finally(() => running.delete(animation));
    });
  }
  function celebrate(goal) {
    if (document.hidden) return;
    const notice = document.getElementById('milestone-notice');
    clearTimeout(noticeTimer);
    notice.querySelector('.milestone-notice-icon').innerHTML = icon('cap');
    notice.querySelector('strong').textContent = `Alcanzaste el ${goal.percent}% de tu carrera`;
    notice.querySelector('p').textContent = goal.id === 'pc' ? 'Ya podés iniciar Prácticas Comunitarias.' : 'Ya podés iniciar la Experiencia Profesional Supervisada.';
    notice.hidden = false;
    noticeTimer = setTimeout(() => { notice.hidden = true; },4800);
  }

  void tracker.observe(getState());
  animateIndicators();
  subscribe(event => {
    animateIndicators();
    if (event?.source === 'command') {
      const crossed = tracker.command(event.previous,getState(),event.command);
      if (crossed.length) celebrate(crossed.at(-1));
    } else void tracker.observe(getState());
  });
  window.addEventListener('hashchange',animateIndicators);
  document.getElementById('mat-list').addEventListener('toggle',animateIndicators,true);
  document.getElementById('dashboard').addEventListener('toggle',animateIndicators,true);
  reduced.addEventListener('change',() => { if (reduced.matches) cancelMotion(); });
  document.addEventListener('visibilitychange',() => { if (document.hidden) cancelMotion(); });
}
