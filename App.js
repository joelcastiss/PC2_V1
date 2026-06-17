/**
 * MediRegistro – app.js
 * Conexión con Supabase (REST API directa, sin SDK)
 * ─────────────────────────────────────────────────
 */

// ── Configuración Supabase ────────────────────────────────────────────────
const SUPABASE_URL = "https://tlofhyivpmkuskwakcwb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRsb2ZoeWl2cG1rdXNrd2FrY3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MTUxMDgsImV4cCI6MjA5NzI5MTEwOH0.hhgJ5gEfvnziR2CBDvIvBmUNLUVoGHalywHLNaGOF5s";

const HEADERS = {
  "Content-Type": "application/json",
  "apikey":        SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer":        "return=minimal",
};

// ── Helper: fetch Supabase ────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: HEADERS,
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}

// ── Carga dinámica de catálogos ───────────────────────────────────────────
async function cargarCatalogo(tabla, selectId, labelVacio) {
  const sel = document.getElementById(selectId);
  sel.innerHTML = `<option value="">Cargando…</option>`;

  const { ok, data } = await sbFetch(`${tabla}?select=id,nombre&activo=eq.true&order=id.asc`);

  if (!ok || !Array.isArray(data)) {
    sel.innerHTML = `<option value="">Error al cargar</option>`;
    return;
  }

  sel.innerHTML = `<option value="">${labelVacio}</option>`;
  data.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.nombre;
    sel.appendChild(opt);
  });
}

// ── Mostrar / ocultar tipo de seguro ──────────────────────────────────────
function initSeguroToggle() {
  const radios   = document.querySelectorAll('input[name="cuenta_seguro"]');
  const grupo    = document.getElementById("grupo_tipo_seguro");
  const selTipo  = document.getElementById("tipo_seguro");

  radios.forEach(r => {
    r.addEventListener("change", () => {
      const tieneSeguro = r.value === "si" && r.checked;
      grupo.style.display = tieneSeguro ? "flex" : "none";
      if (!tieneSeguro) selTipo.value = "";
    });
  });
}

// ── Validaciones ──────────────────────────────────────────────────────────
const REGLAS = {
  nombres:  { msg: "El nombre no puede estar vacío.",        test: v => v.trim().length > 0 },
  apellidos:{ msg: "Los apellidos no pueden estar vacíos.",  test: v => v.trim().length > 0 },
  dni:      { msg: "El DNI debe tener exactamente 8 dígitos.", test: v => /^\d{8}$/.test(v.trim()) },
  correo:   { msg: "Ingrese un correo electrónico válido.",  test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
  celular:  { msg: "El celular debe tener al menos 9 dígitos.", test: v => /^\d{9,15}$/.test(v.trim()) },
  grado:    { msg: "Seleccione un grado académico.",         test: v => v !== "" },
  enfermedad:{ msg: "Seleccione una enfermedad preexistente.", test: v => v !== "" },
};

function setFieldState(inputEl, errId, valid, msg = "") {
  const errEl = document.getElementById(errId);
  if (!errEl) return;
  if (valid) {
    inputEl.classList.remove("invalid");
    inputEl.classList.add("valid");
    errEl.textContent = "";
  } else {
    inputEl.classList.remove("valid");
    inputEl.classList.add("invalid");
    errEl.textContent = msg;
  }
  return valid;
}

function validarFormulario() {
  const campos = [
    { id: "nombres",                 errId: "err-nombres",   regla: REGLAS.nombres    },
    { id: "apellidos",               errId: "err-apellidos", regla: REGLAS.apellidos  },
    { id: "dni",                     errId: "err-dni",       regla: REGLAS.dni        },
    { id: "correo",                  errId: "err-correo",    regla: REGLAS.correo     },
    { id: "celular",                 errId: "err-celular",   regla: REGLAS.celular    },
    { id: "grado_academico_id",      errId: "err-grado",     regla: REGLAS.grado      },
    { id: "enfermedad_preexistente_id", errId: "err-enfermedad", regla: REGLAS.enfermedad },
  ];

  let ok = true;
  campos.forEach(({ id, errId, regla }) => {
    const el = document.getElementById(id);
    const valido = setFieldState(el, errId, regla.test(el.value), regla.msg);
    if (!valido) ok = false;
  });
  return ok;
}

// ── Mostrar mensaje de estado ─────────────────────────────────────────────
function mostrarEstado(tipo, texto) {
  // tipo: 'success' | 'error' | 'warning'
  const el = document.getElementById("statusMsg");
  el.className = `status-msg show ${tipo}`;
  el.textContent = texto;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });

  if (tipo === "success") {
    setTimeout(() => {
      el.className = "status-msg";
      el.textContent = "";
    }, 5000);
  }
}

function ocultarEstado() {
  const el = document.getElementById("statusMsg");
  el.className = "status-msg";
  el.textContent = "";
}

// ── Limpiar formulario ────────────────────────────────────────────────────
function limpiarFormulario() {
  const form = document.getElementById("formPaciente");
  form.reset();

  // Limpiar estados visuales
  form.querySelectorAll("input, select, textarea").forEach(el => {
    el.classList.remove("valid", "invalid");
  });
  form.querySelectorAll(".field-error").forEach(el => {
    el.textContent = "";
  });

  // Recargar catálogos (para restablecer el placeholder)
  cargarCatalogo("grados_academicos",         "grado_academico_id",         "Seleccionar grado…");
  cargarCatalogo("enfermedades_preexistentes","enfermedad_preexistente_id",  "Seleccionar enfermedad…");

  // Ocultar tipo de seguro
  document.getElementById("grupo_tipo_seguro").style.display = "none";
}

// ── Registro del paciente ─────────────────────────────────────────────────
async function registrarPaciente(payload) {
  const { ok, status, data } = await sbFetch("pacientes", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { ...HEADERS, "Prefer": "return=minimal" },
  });

  // Supabase devuelve 201 en éxito con return=minimal
  if (ok || status === 201) return { exito: true };

  // Detectar duplicado (violación de UNIQUE)
  const msg = data?.message || data?.msg || "";
  if (status === 409 || msg.includes("duplicate") || msg.includes("unique") || msg.includes("violates")) {
    const campo = msg.includes("dni") ? "DNI" : msg.includes("correo") ? "correo electrónico" : "dato";
    return { exito: false, duplicado: true, campo };
  }

  return { exito: false, duplicado: false, detalle: msg };
}

// ── Construir payload desde el formulario ────────────────────────────────
function construirPayload() {
  const g  = id => document.getElementById(id);
  const val = id => g(id)?.value?.trim() ?? "";

  const cuentaSeguroRadio = document.querySelector('input[name="cuenta_seguro"]:checked');
  const cuentaSeguro      = cuentaSeguroRadio?.value === "si";

  return {
    nombres:                    val("nombres")                   || null,
    apellidos:                  val("apellidos")                 || null,
    dni:                        val("dni")                       || null,
    fecha_nacimiento:           val("fecha_nacimiento")          || null,
    edad:                       val("edad")     ? parseInt(val("edad"), 10) : null,
    sexo:                       val("sexo")                      || null,
    celular:                    val("celular")                   || null,
    correo:                     val("correo")                    || null,
    direccion:                  val("direccion")                 || null,
    distrito:                   val("distrito")                  || null,
    estado_civil:               val("estado_civil")              || null,
    grado_academico_id:         parseInt(val("grado_academico_id"), 10) || null,
    enfermedad_preexistente_id: parseInt(val("enfermedad_preexistente_id"), 10) || null,
    cuenta_seguro:              cuentaSeguro,
    tipo_seguro:                cuentaSeguro ? (val("tipo_seguro") || null) : null,
    observaciones:              val("observaciones")             || null,
  };
}

// ── Submit handler ────────────────────────────────────────────────────────
async function onSubmit(e) {
  e.preventDefault();
  ocultarEstado();

  if (!validarFormulario()) {
    mostrarEstado("error", "⚠ Revise los campos marcados en rojo antes de continuar.");
    return;
  }

  // Estado loading
  const btn = document.getElementById("btnRegistrar");
  btn.disabled = true;
  btn.classList.add("loading");

  const payload    = construirPayload();
  const resultado  = await registrarPaciente(payload);

  btn.disabled = false;
  btn.classList.remove("loading");

  if (resultado.exito) {
    mostrarEstado("success", `✅ Paciente registrado correctamente. Los datos han sido guardados.`);
    limpiarFormulario();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (resultado.duplicado) {
    mostrarEstado("warning", `⚠ Usuario ya registrado: ya existe un paciente con ese ${resultado.campo}.`);
  } else {
    mostrarEstado("error", `❌ No se pudo registrar el paciente. Verifique los datos ingresados.`);
    console.error("Error Supabase:", resultado.detalle);
  }
}

// ── Validación inline (blur) ──────────────────────────────────────────────
function initValidacionInline() {
  const mapa = [
    { id: "nombres",                 errId: "err-nombres",    regla: REGLAS.nombres    },
    { id: "apellidos",               errId: "err-apellidos",  regla: REGLAS.apellidos  },
    { id: "dni",                     errId: "err-dni",        regla: REGLAS.dni        },
    { id: "correo",                  errId: "err-correo",     regla: REGLAS.correo     },
    { id: "celular",                 errId: "err-celular",    regla: REGLAS.celular    },
    { id: "grado_academico_id",      errId: "err-grado",      regla: REGLAS.grado      },
    { id: "enfermedad_preexistente_id", errId: "err-enfermedad", regla: REGLAS.enfermedad },
  ];

  mapa.forEach(({ id, errId, regla }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", () => {
      if (el.value !== "") {
        setFieldState(el, errId, regla.test(el.value), regla.msg);
      }
    });
    el.addEventListener("input", () => {
      if (el.classList.contains("invalid")) {
        setFieldState(el, errId, regla.test(el.value), regla.msg);
      }
    });
  });
}

// ── Calcular edad automáticamente ────────────────────────────────────────
function initAutoEdad() {
  document.getElementById("fecha_nacimiento").addEventListener("change", function () {
    if (!this.value) return;
    const nacimiento = new Date(this.value);
    const hoy        = new Date();
    let edad         = hoy.getFullYear() - nacimiento.getFullYear();
    const m          = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    document.getElementById("edad").value = edad >= 0 ? edad : "";
  });
}

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Cargar catálogos dinámicos desde Supabase
  cargarCatalogo("grados_academicos",         "grado_academico_id",         "Seleccionar grado…");
  cargarCatalogo("enfermedades_preexistentes","enfermedad_preexistente_id",  "Seleccionar enfermedad…");

  // Inicializar comportamientos
  initSeguroToggle();
  initValidacionInline();
  initAutoEdad();

  // Submit
  document.getElementById("formPaciente").addEventListener("submit", onSubmit);
});