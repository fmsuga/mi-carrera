/**
 * plan.js
 * Datos estáticos del plan de estudios.
 * Si cambia una materia, correlativa o requisito: editar solo este archivo.
 *
 * Campos de cada materia:
 *   a  → año (1–4)
 *   c  → cuatrimestre (1 o 2)
 *   n  → nombre completo
 *   h  → carga horaria
 *   r  → array de correlativas (nombres exactos)
 */

const PLAN = [
  // ── 1° Año · 1° Cuatrimestre ─────────────────────────────────
  { a:1, c:1, n:"Preliminares de Matemática",     h:60,  r:[] },
  { a:1, c:1, n:"Álgebra",                         h:112, r:["Preliminares de Matemática"] },
  { a:1, c:1, n:"Análisis Matemático I - a",       h:80,  r:["Preliminares de Matemática"] },
  { a:1, c:1, n:"Introducción a la Informática",   h:96,  r:[] },
  { a:1, c:1, n:"Inglés I",                        h:70,  r:[] },

  // ── 1° Año · 2° Cuatrimestre ─────────────────────────────────
  { a:1, c:2, n:"Análisis Matemático I - b",       h:64,  r:["Análisis Matemático I - a"] },
  { a:1, c:2, n:"Matemática Discreta",             h:88,  r:["Álgebra","Análisis Matemático I - a"] },
  { a:1, c:2, n:"Programación Procedural",         h:120, r:["Introducción a la Informática"] },

  // ── 2° Año · 1° Cuatrimestre ─────────────────────────────────
  { a:2, c:1, n:"Diseño de Interfaces de Usuario", h:80,  r:["Programación Procedural"] },
  { a:2, c:1, n:"Estructuras de Datos y Algoritmos",h:96, r:["Matemática Discreta","Programación Procedural"] },
  { a:2, c:1, n:"Sistemas y Organizaciones",       h:120, r:["Introducción a la Informática"] },
  { a:2, c:1, n:"Inglés II",                       h:100, r:["Inglés I"] },

  // ── 2° Año · 2° Cuatrimestre ─────────────────────────────────
  { a:2, c:2, n:"Análisis y Diseño de Sistemas I", h:96,  r:["Estructuras de Datos y Algoritmos","Sistemas y Organizaciones"] },
  { a:2, c:2, n:"Arquitectura de Computadoras",    h:96,  r:["Estructuras de Datos y Algoritmos"] },
  { a:2, c:2, n:"Laboratorio de Inteligencia Artificial", h:64, r:["Estructuras de Datos y Algoritmos","Sistemas y Organizaciones"] },
  { a:2, c:2, n:"Probabilidad y Estadística",      h:88,  r:["Álgebra","Análisis Matemático I - b"] },

  // ── 3° Año · 1° Cuatrimestre ─────────────────────────────────
  { a:3, c:1, n:"Base de Datos I",                 h:96,  r:["Análisis y Diseño de Sistemas I"] },
  { a:3, c:1, n:"Introducción a Redes y Comunicaciones", h:96, r:["Arquitectura de Computadoras"] },
  { a:3, c:1, n:"Programación Orientada a Objetos",h:88,  r:["Análisis y Diseño de Sistemas I"] },
  { a:3, c:1, n:"Sistemas Operativos",             h:112, r:["Arquitectura de Computadoras"] },
  { a:3, c:1, n:"Inglés III",                      h:80,  r:["Inglés II"] },

  // ── 3° Año · 2° Cuatrimestre ─────────────────────────────────
  { a:3, c:2, n:"Análisis y Diseño de Sistemas II",h:96,  r:["Base de Datos I","Programación Orientada a Objetos"] },
  { a:3, c:2, n:"Laboratorio de Redes y Comunicaciones", h:96, r:["Introducción a Redes y Comunicaciones","Sistemas Operativos"] },
  { a:3, c:2, n:"Laboratorio Orientado a Aplicaciones Móviles", h:96, r:["Base de Datos I","Programación Orientada a Objetos"] },
  { a:3, c:2, n:"Programación Orientada a la Web", h:104, r:["Base de Datos I","Programación Orientada a Objetos"] },

  // ── 4° Año · 1° Cuatrimestre ─────────────────────────────────
  { a:4, c:1, n:"Base de Datos II",                h:96,  r:["Base de Datos I"] },
  { a:4, c:1, n:"Ingeniería de Software I",        h:96,  r:["Análisis y Diseño de Sistemas II"] },
  { a:4, c:1, n:"Inteligencia Artificial",         h:96,  r:["Probabilidad y Estadística","Laboratorio de Inteligencia Artificial"] },
  { a:4, c:1, n:"Seguridad Informática",           h:80,  r:["Sistemas Operativos"] },

  // ── 4° Año · 2° Cuatrimestre ─────────────────────────────────
  { a:4, c:2, n:"Ingeniería de Software II",       h:96,  r:["Ingeniería de Software I"] },
  { a:4, c:2, n:"Proyecto Final I",                h:96,  r:["Ingeniería de Software I"] },
  { a:4, c:2, n:"Tecnologías Emergentes",          h:64,  r:[] },
  { a:4, c:2, n:"Proyecto Final II",               h:96,  r:["Proyecto Final I"] },
];

// Totales calculados una sola vez al cargar
const TOTAL_H = PLAN.reduce((sum, m) => sum + m.h, 0);
const TOTAL_M = PLAN.length;

/**
 * Otros requisitos no curriculares.
 * unlock() → función que evalúa si el requisito está desbloqueado.
 * lockMsg() → mensaje a mostrar cuando está bloqueado.
 */
const OTROS = [
  {
    id: 'pc',
    n: 'Prácticas Comunitarias',
    h: 40,
    cond: 'Requiere el 40% de la carrera aprobada.',
    unlock:   () => { const s = stats(); return s.ap / TOTAL_M >= 0.40; },
    lockMsg:  () => { const s = stats(); return `Necesitás ${Math.ceil(TOTAL_M * 0.40)} materias aprobadas (tenés ${s.ap}).`; },
    readyMsg: 'Superaste el 40% de la carrera ✓',
  },
  {
    id: 'eps',
    n: 'Experiencia Profesional Supervisada',
    h: 70,
    cond: 'Requiere el 70% de la carrera aprobada.',
    unlock:   () => { const s = stats(); return s.ap / TOTAL_M >= 0.70; },
    lockMsg:  () => { const s = stats(); return `Necesitás ${Math.ceil(TOTAL_M * 0.70)} materias aprobadas (tenés ${s.ap}).`; },
    readyMsg: 'Superaste el 70% de la carrera ✓',
  },
];
