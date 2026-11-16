/**
 * plan.js
 * Datos estáticos del plan de estudios.
 * Si cambia una materia, correlativa o requisito: editar solo este archivo.
 *
 * Campos de cada materia:
 *   id → identificador corto permanente (web y futuro bot)
 *   a  → año (1–4)
 *   c  → cuatrimestre (1 o 2)
 *   n  → nombre completo
 *   h  → carga horaria
 *   r  → array de correlativas (nombres exactos)
 */

export const PLAN = [
  // ── 1° Año · 1° Cuatrimestre ─────────────────────────────────
  { id:'pre', a:1, c:1, n:"Preliminares de Matemática",     h:60,  r:[] },
  { id:'alg', a:1, c:1, n:"Álgebra",                         h:112, r:["Preliminares de Matemática"] },
  { id:'ama', a:1, c:1, n:"Análisis Matemático I - a",       h:80,  r:["Preliminares de Matemática"] },
  { id:'inf', a:1, c:1, n:"Introducción a la Informática",   h:96,  r:[] },
  { id:'in1', a:1, c:1, n:"Inglés I",                        h:70,  r:[] },

  // ── 1° Año · 2° Cuatrimestre ─────────────────────────────────
  { id:'amb', a:1, c:2, n:"Análisis Matemático I - b",       h:64,  r:["Análisis Matemático I - a"] },
  { id:'dis', a:1, c:2, n:"Matemática Discreta",             h:88,  r:["Álgebra","Análisis Matemático I - a"] },
  { id:'pro', a:1, c:2, n:"Programación Procedural",         h:120, r:["Introducción a la Informática"] },

  // ── 2° Año · 1° Cuatrimestre ─────────────────────────────────
  { id:'diu', a:2, c:1, n:"Diseño de Interfaces de Usuario", h:80,  r:["Programación Procedural"] },
  { id:'eda', a:2, c:1, n:"Estructuras de Datos y Algoritmos",h:96, r:["Matemática Discreta","Programación Procedural"] },
  { id:'syo', a:2, c:1, n:"Sistemas y Organizaciones",       h:120, r:["Introducción a la Informática"] },
  { id:'in2', a:2, c:1, n:"Inglés II",                       h:100, r:["Inglés I"] },

  // ── 2° Año · 2° Cuatrimestre ─────────────────────────────────
  { id:'ads1', a:2, c:2, n:"Análisis y Diseño de Sistemas I", h:96,  r:["Estructuras de Datos y Algoritmos","Sistemas y Organizaciones"] },
  { id:'arq', a:2, c:2, n:"Arquitectura de Computadoras",    h:96,  r:["Estructuras de Datos y Algoritmos"] },
  { id:'lia', a:2, c:2, n:"Laboratorio de Inteligencia Artificial", h:64, r:["Estructuras de Datos y Algoritmos","Sistemas y Organizaciones"] },
  { id:'pye', a:2, c:2, n:"Probabilidad y Estadística",      h:88,  r:["Álgebra","Análisis Matemático I - b"] },

  // ── 3° Año · 1° Cuatrimestre ─────────────────────────────────
  { id:'bd1', a:3, c:1, n:"Base de Datos I",                 h:96,  r:["Análisis y Diseño de Sistemas I"] },
  { id:'red', a:3, c:1, n:"Introducción a Redes y Comunicaciones", h:96, r:["Arquitectura de Computadoras"] },
  { id:'poo', a:3, c:1, n:"Programación Orientada a Objetos",h:88,  r:["Análisis y Diseño de Sistemas I"] },
  { id:'so', a:3, c:1, n:"Sistemas Operativos",             h:112, r:["Arquitectura de Computadoras"] },
  { id:'in3', a:3, c:1, n:"Inglés III",                      h:80,  r:["Inglés II"] },

  // ── 3° Año · 2° Cuatrimestre ─────────────────────────────────
  { id:'ads2', a:3, c:2, n:"Análisis y Diseño de Sistemas II",h:96,  r:["Base de Datos I","Programación Orientada a Objetos"] },
  { id:'lrc', a:3, c:2, n:"Laboratorio de Redes y Comunicaciones", h:96, r:["Introducción a Redes y Comunicaciones","Sistemas Operativos"] },
  { id:'lam', a:3, c:2, n:"Laboratorio Orientado a Aplicaciones Móviles", h:96, r:["Base de Datos I","Programación Orientada a Objetos"] },
  { id:'web', a:3, c:2, n:"Programación Orientada a la Web", h:104, r:["Base de Datos I","Programación Orientada a Objetos"] },

  // ── 4° Año · 1° Cuatrimestre ─────────────────────────────────
  { id:'bd2', a:4, c:1, n:"Base de Datos II",                h:96,  r:["Base de Datos I"] },
  { id:'is1', a:4, c:1, n:"Ingeniería de Software I",        h:96,  r:["Análisis y Diseño de Sistemas II"] },
  { id:'ia', a:4, c:1, n:"Inteligencia Artificial",         h:96,  r:["Probabilidad y Estadística","Laboratorio de Inteligencia Artificial"] },
  { id:'seg', a:4, c:1, n:"Seguridad Informática",           h:80,  r:["Sistemas Operativos"] },

  // ── 4° Año · 2° Cuatrimestre ─────────────────────────────────
  { id:'is2', a:4, c:2, n:"Ingeniería de Software II",       h:96,  r:["Ingeniería de Software I"] },
  { id:'pf1', a:4, c:2, n:"Proyecto Final I",                h:96,  r:["Ingeniería de Software I"] },
  { id:'te', a:4, c:2, n:"Tecnologías Emergentes",          h:64,  r:[] },
  { id:'pf2', a:4, c:2, n:"Proyecto Final II",               h:96,  r:["Proyecto Final I"] },
];

// Totales calculados una sola vez al cargar
export const TOTAL_H = PLAN.reduce((sum, m) => sum + m.h, 0);
export const TOTAL_M = PLAN.length;

/**
 * Otros requisitos no curriculares.
 * threshold → proporción de materias aprobadas requerida para habilitarlo.
 */
export const OTROS = [
  {
    id: 'pc',
    n: 'Prácticas Comunitarias',
    h: 40,
    cond: 'Requiere el 40% de la carrera aprobada.',
    threshold: 0.40,
    readyMsg: 'Superaste el 40% de la carrera ✓',
  },
  {
    id: 'eps',
    n: 'Experiencia Profesional Supervisada',
    h: 70,
    cond: 'Requiere el 70% de la carrera aprobada.',
    threshold: 0.70,
    readyMsg: 'Superaste el 70% de la carrera ✓',
  },
];
