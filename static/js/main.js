const EJEMPLOS = {
  clasico: { num_procesos: 5, num_instancias: 12, asignado: [2, 3, 2, 1, 0], maximo: [9, 3, 9, 2, 2] },
  simple: { num_procesos: 3, num_instancias: 10, asignado: [2, 3, 2], maximo: [9, 5, 7] },
  inseguro: { num_procesos: 4, num_instancias: 10, asignado: [3, 2, 3, 1], maximo: [9, 8, 7, 4] },
};
// Ejemplos predefinidos para cargar rápidamente configuraciones en la interfaz

let MODO = 'example'; // 'example' | 'manual'

function setModo(m) {
  MODO = m;
  const exBtns = document.querySelectorAll('.ex-btn');
  const inputProcesos = document.getElementById('num-procesos');
  const inputInst = document.getElementById('num-instancias');
  const btnGenerar = document.getElementById('btn-generar');

  if (MODO === 'example') {
    // Deshabilitar edición manual
    exBtns.forEach(b => b.classList.remove('muted'));
    inputProcesos.disabled = true;
    inputInst.disabled = true;
    if (btnGenerar) btnGenerar.disabled = true;
    // Deshabilitar inputs por fila
    document.querySelectorAll('#proc-inputs input').forEach(i => i.disabled = true);
    // Marcar visualmente los botones de ejemplo como activos
    exBtns.forEach(b => b.disabled = false);
  } else if (MODO === 'manual') {
    // Modo manual: deshabilitar botones de ejemplo
    exBtns.forEach(b => b.classList.add('muted'));
    inputProcesos.disabled = false;
    inputInst.disabled = false;
    if (btnGenerar) btnGenerar.disabled = false;
    document.querySelectorAll('#proc-inputs input').forEach(i => i.disabled = false);
    exBtns.forEach(b => b.disabled = true);
  } else if (MODO === 'neutral') {
    // Ambos modos disponibles: habilitar todo para que el usuario elija
    exBtns.forEach(b => b.classList.remove('muted'));
    inputProcesos.disabled = false;
    inputInst.disabled = false;
    if (btnGenerar) btnGenerar.disabled = false;
    document.querySelectorAll('#proc-inputs input').forEach(i => i.disabled = false);
    exBtns.forEach(b => b.disabled = false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  generarFilas();
  cargarEjemplo('clasico');
});
// Al cargar la página, genera los campos de entrada y carga el ejemplo clásico por defecto

function placeholder(icono, texto) {
  return `<div class="placeholder"><div class="placeholder-icon">${icono}</div><p>${texto}</p></div>`;
}
// Genera un HTML de placeholder para mostrar mensajes informativos

function generarFilas(n) {
  const inputProcesos = document.getElementById('num-procesos');
  let num = n !== undefined ? n : (parseInt(inputProcesos.value, 10) || 3);
  num = Math.min(Math.max(num, 1), 10);
  inputProcesos.value = num;

  const container = document.getElementById('proc-inputs');
  container.innerHTML = '';

  for (let i = 0; i < num; i++) {
    const row = document.createElement('div');
    row.className = 'proc-row';
    row.innerHTML = `
      <div class="proc-label">P${i}</div>
      <input type="number" id="asignado-${i}" min="0" max="100" value="0" placeholder="0">
      <input type="number" id="maximo-${i}" min="0" max="100" value="0" placeholder="0">
    `;
    container.appendChild(row);
  }
  // Si se llamó sin argumento, asumimos que el usuario quiere modo manual
  if (n === undefined) setModo('manual');
  attachRowListeners();
}
// Genera dinámicamente las filas de entrada para cada proceso

function cargarEjemplo(clave) {
  const ej = EJEMPLOS[clave];
  document.getElementById('num-procesos').value = ej.num_procesos;
  document.getElementById('num-instancias').value = ej.num_instancias;
  generarFilas(ej.num_procesos);
  ej.asignado.forEach((v, i) => (document.getElementById(`asignado-${i}`).value = v));
  ej.maximo.forEach((v, i) => (document.getElementById(`maximo-${i}`).value = v));
  limpiar();
  setModo('example');
}
// Carga un ejemplo predefinido en los campos de entrada

async function ejecutar() {
  const errorEl = document.getElementById('error-container');
  errorEl.innerHTML = '';

  const num_procesos = parseInt(document.getElementById('num-procesos').value, 10);
  const num_instancias = parseInt(document.getElementById('num-instancias').value, 10);
  const asignado = [];
  const maximo = [];

  if (Number.isNaN(num_procesos) || num_procesos < 1 || num_procesos > 10) {
    mostrarError('El número de procesos debe estar entre 1 y 10.');
    return;
  }

  for (let i = 0; i < num_procesos; i++) {
    const a = parseInt(document.getElementById(`asignado-${i}`)?.value, 10);
    const m = parseInt(document.getElementById(`maximo-${i}`)?.value, 10);
    if (Number.isNaN(a) || Number.isNaN(m)) {
      mostrarError(`Completa todos los campos del proceso P${i}.`);
      return;
    }
    asignado.push(a);
    maximo.push(m);
  }

  document.getElementById('tabla-container').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  document.getElementById('resultado-container').innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  document.getElementById('pasos-container').innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  try {
    const resp = await fetch('/api/ejecutar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_procesos, num_instancias, asignado, maximo }),
    });

    const data = await resp.json();
    if (!resp.ok || data.error) {
      mostrarError(data.error || 'No se pudo ejecutar el algoritmo.');
      limpiar();
      return;
    }
    renderResultado(data);
  } catch (error) {
    mostrarError(`Error de conexión: ${error.message}`);
    limpiar();
  }
}
// Ejecuta el algoritmo del banquero enviando los datos al backend y muestra el resultado

function mostrarError(mensaje) {
  document.getElementById('error-container').innerHTML = `<div class="error-msg">⚠ ${mensaje}</div>`;
}
// Muestra un mensaje de error en la interfaz

function renderResultado(data) {
  renderTabla(data);
  renderBanner(data);
  renderSecuencia(data);
  renderPasos(data.pasos);
}

function renderTabla(d) {
  const rows = d.asignado.map((a, i) => `
    <tr><td class="p-name">P${i}</td><td>${d.maximo[i]}</td><td>${a}</td><td>${d.necesita[i]}</td></tr>
  `).join('');

  document.getElementById('tabla-container').innerHTML = `
    <table><thead><tr><th>Proceso</th><th>Máximo</th><th>Asignado</th><th>Necesita</th></tr></thead><tbody>${rows}</tbody></table>
    <div style="margin-top:12px;font-family:var(--mono);font-size:.8rem;color:var(--muted)">
      Instancias totales: <span style="color:var(--accent)">${d.num_instancias}</span> &nbsp;|&nbsp;
      Disponible inicial: <span style="color:var(--green)">${d.disponible_inicial}</span>
    </div>`;
}
// Muestra la tabla de procesos con sus valores

function renderBanner(d) {
  const cls = d.seguro ? 'seguro' : 'inseguro';
  const icon = d.seguro ? '✅' : '🔴';
  const title = d.seguro ? 'Estado SEGURO' : 'Estado INSEGURO';
  const sub = d.seguro ? `Secuencia: ${d.secuencia.map((p) => `P${p}`).join(' → ')}` : 'El sistema puede caer en interbloqueo. No existe secuencia segura.';

  document.getElementById('resultado-container').innerHTML = `
    <div class="result-banner ${cls}"><div class="result-icon">${icon}</div><div><div class="result-title ${cls}">${title}</div><div class="result-seq">${sub}</div></div></div>`;
}
// Muestra un banner con el estado final (seguro/inseguro) y la secuencia encontrada
function renderSecuencia(d) {
  const panel = document.getElementById('panel-secuencia');
  if (!d.seguro) {
    panel.classList.add('hidden');
    return;
  }
  panel.classList.remove('hidden');
  document.getElementById('seq-viz').innerHTML = d.secuencia.map((p, idx) => `
    ${idx > 0 ? '<span class="seq-arrow">→</span>' : ''}<div class="seq-node" style="animation-delay:${idx * 0.1}s">P${p}</div>
  `).join('');
}

// Visualiza gráficamente la secuencia segura encontrada
function renderPasos(pasos) {
  const tagLabels = { inicio: 'INICIO', evaluacion: 'EVALUAR', completado: '✓ LISTO', interbloqueo: '✗ BLOQUEO', resultado: 'RESULTADO' };
  const html = pasos.map((p, idx) => {
    let detalle = '';
    if (p.tipo === 'evaluacion') {
      detalle = `Necesita=${p.necesita_i} | Trabajo=${p.trabajo} → ${p.puede ? '✓ puede continuar' : '✗ espera'}`;
    } else {
      detalle = p.mensaje || '';
    }
    return `<div class="step ${p.tipo}" style="animation-delay:${idx * 0.04}s"><div class="step-header"><span class="step-tag ${p.tipo}">${tagLabels[p.tipo] || p.tipo.toUpperCase()}</span>${p.proceso !== undefined ? `<span style="font-family:var(--mono);font-size:.8rem;color:var(--accent)">P${p.proceso}</span>` : ''}${p.iteracion ? `<span style="font-family:var(--mono);font-size:.75rem;color:var(--muted)">iter ${p.iteracion}</span>` : ''}</div>${detalle ? `<div class="step-detail">${detalle}</div>` : ''}</div>`;
  }).join('');
  document.getElementById('pasos-container').innerHTML = `<div class="steps-list">${html}</div>`;
}

// Muestra el detalle paso a paso de la ejecución del algoritmo
function limpiar() {
  document.getElementById('tabla-container').innerHTML = placeholder('📊', 'Configura los datos y ejecuta el algoritmo para ver el estado del sistema.');
  document.getElementById('resultado-container').innerHTML = placeholder('🔒', 'El resultado del análisis de seguridad aparecerá aquí.');
  document.getElementById('pasos-container').innerHTML = placeholder('📋', 'Aquí verás cada paso del algoritmo de seguridad explicado.');
  const panelSecuencia = document.getElementById('panel-secuencia');
  if (panelSecuencia) {
    panelSecuencia.classList.add('hidden');
  }
  document.getElementById('error-container').innerHTML = '';
  // Al limpiar, reactivar ambas opciones para que el usuario elija
  setModo('neutral');
}
// Limpia los resultados y deja la interfaz en estado inicial

window.generarFilas = generarFilas;
window.cargarEjemplo = cargarEjemplo;
window.ejecutar = ejecutar;
window.limpiar = limpiar;
// Expone las funciones principales al ámbito global para que puedan ser usadas desde el HTML

// Adjunta listeners a inputs por fila para cambiar al modo manual cuando el usuario edita
function attachRowListeners() {
  const numProcesosEl = document.getElementById('num-procesos');
  const numInstEl = document.getElementById('num-instancias');
  if (numProcesosEl) numProcesosEl.addEventListener('input', () => setModo('manual'));
  if (numInstEl) numInstEl.addEventListener('input', () => setModo('manual'));

  document.querySelectorAll('#proc-inputs input').forEach(inp => {
    // evitar duplicar listeners
    inp.removeEventListener('input', onRowInput);
    inp.addEventListener('input', onRowInput);
  });
}

function onRowInput() {
  setModo('manual');
}

// Inicializar estado visual al cargar
document.addEventListener('DOMContentLoaded', () => {
  // Asegurar que los botones de ejemplo disparen setModo('example') además de cargarEjemplo
  document.querySelectorAll('.ex-btn').forEach(b => b.addEventListener('click', () => setModo('example')));
  // Attach listeners inicialmente
  attachRowListeners();
  // Aplicar modo actual (por defecto cargado al iniciar)
  setModo(MODO);
});