export const paths = {
 grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
 book:'M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Zm0 0v15',
 settings:'m9 3-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
 search:'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
 check:'m5 12 4 4L19 6',
 circle:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
 close:'m6 6 12 12M6 18 18 6',
 arrow:'M4 12h16m-6-6 6 6-6 6',
 chevron:'m6 9 6 6 6-6',
 award:'m8 15-2 7 6-3 6 3-2-7M19 9A7 7 0 1 1 5 9a7 7 0 0 1 14 0',
 calendar:'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2',
 lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
 shield:'m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Zm-5 9 3 3 6-6',
 download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 upload:'M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5',
 send:'m22 2-7 20-4-9-9-4 20-7ZM11 13 22 2',
 edit:'m15 4 5 5M3 21l5-1L21 7l-5-5L3 15z',
 trash:'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
 plus:'M12 5v14M5 12h14',
 cap:'m2 8 10-5 10 5-10 5L2 8Zm4 3v6q6 5 12 0v-6M22 8v10',
};
export function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.circle}"/></svg>`; }
export function hydrateIcons(root = document) { root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
export const html = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fmt = date => date ? date.split('-').reverse().join('/') : 'Sin fecha';
export const pct = value => new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(value);
