import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";

// ═══════════════════════════════════════════════════════════════════
// GOOGLE CALENDAR — Google Identity Services (GIS)
// ═══════════════════════════════════════════════════════════════════
const GOOGLE_CLIENT_ID = "73188297798-gspn2aoro2amhvmb3b98rk4vtv5i2v6s.apps.googleusercontent.com";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events";

let _googleToken = null;

function cargarGISScript() {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

async function obtenerTokenGoogle() {
  await cargarGISScript();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_SCOPE,
      callback: (resp) => {
        if (resp.error) { reject(resp); return; }
        _googleToken = resp.access_token;
        resolve(resp.access_token);
      },
    });
    if (_googleToken) { resolve(_googleToken); return; }
    client.requestAccessToken({ prompt: "consent" });
  });
}

async function agregarEventoCalendar(titulo, descripcion, fecha) {
  try {
    const token = await obtenerTokenGoogle();
    const fechaISO = fecha.includes("/")
      ? fecha.split("/").reverse().join("-")
      : fecha;
    const evento = {
      summary: titulo,
      description: descripcion,
      start: { date: fechaISO },
      end:   { date: fechaISO },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 },
          { method: "email", minutes: 1440 },
        ],
      },
    };
    const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(evento),
    });
    if (!res.ok) {
      const err = await res.json();
      // Token expirado — limpiar y reintentar
      if (err.error?.code === 401) {
        _googleToken = null;
        return agregarEventoCalendar(titulo, descripcion, fecha);
      }
      throw new Error(err.error?.message || "Error al crear evento");
    }
    const data = await res.json();
    return { ok: true, id: data.id, link: data.htmlLink };
  } catch (err) {
    console.error("Google Calendar error:", err);
    return { ok: false, error: err.message };
  }
}

// Fallback: generar archivo .ics descargable
function descargarICS(titulo, descripcion, fecha) {
  const fechaISO = (fecha.includes("/") ? fecha.split("/").reverse().join("-") : fecha).replace(/-/g,"");
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//CRM Seguros//ES",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${fechaISO}`,
    `DTEND;VALUE=DATE:${fechaISO}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${descripcion.replace(/\n/g,"\\n")}`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], {type:"text/calendar;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "evento_poliza.ics"; a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════════════
// CATÁLOGO RAMOS / SUBRAMOS
// ═══════════════════════════════════════════════════════════════════
const RAMOS_SUBRAMOS = {
  Autos: ["Individual", "Flotilla"],
  Vida: ["Vida Individual", "Vida Grupo", "Vida Universal"],
  "Gastos Médicos": ["Tradicional", "PMM (Plan Médico Mayor)", "Accidentes Personales", "Segurviaje", "Escolar"],
  Daños: ["Hogar", "Empresarial", "Responsabilidad Civil", "Transporte", "Incendio"],
};

const ASEGURADORAS = ["GNP","AXA","HDI","SURA","Citibanamex","Qualitas","Zurich","Mapfre","Allianz","MetLife","Inbursa","Atlas","Bupa","Monterrey","Chubb","BBVA Seguros"];
const ESTADOS_MX = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];

// ═══════════════════════════════════════════════════════════════════
// DATOS INICIALES
// ═══════════════════════════════════════════════════════════════════
const CLIENTES_INIT = [
  { id:1, nombre:"María", apellidoPaterno:"González", apellidoMaterno:"Ruiz", rfc:"GORM850312HDF", email:"maria@email.com", telefono:"5512345678", whatsapp:"5512345678", sexo:"F", fechaNacimiento:"12/03/1985", calle:"Insurgentes Sur", numero:"1234", colonia:"Del Valle", cp:"03100", ciudad:"Benito Juárez", estado:"Ciudad de México", polizas:3 },
  { id:2, nombre:"Carlos", apellidoPaterno:"Mendoza", apellidoMaterno:"López", rfc:"MELC780901HNL", email:"carlos@email.com", telefono:"8198765432", whatsapp:"8198765432", sexo:"M", fechaNacimiento:"01/09/1978", calle:"Av. Constitución", numero:"456", colonia:"Centro", cp:"64000", ciudad:"Monterrey", estado:"Nuevo León", polizas:1 },
  { id:3, nombre:"Ana Sofía", apellidoPaterno:"Torres", apellidoMaterno:"Vega", rfc:"TOSA920415MDF", email:"ana@email.com", telefono:"3355551234", whatsapp:"3355551234", sexo:"F", fechaNacimiento:"15/04/1992", calle:"López Mateos", numero:"789", colonia:"Jardines", cp:"44100", ciudad:"Guadalajara", estado:"Jalisco", polizas:0 },
  { id:4, nombre:"Roberto", apellidoPaterno:"Sánchez", apellidoMaterno:"Vega", rfc:"SAVR670820HDF", email:"roberto@email.com", telefono:"5588889999", whatsapp:"5588889999", sexo:"M", fechaNacimiento:"20/08/1967", calle:"Reforma", numero:"100", colonia:"Lomas", cp:"11000", ciudad:"Miguel Hidalgo", estado:"Ciudad de México", polizas:2 },
  { id:5, nombre:"Lucía", apellidoPaterno:"Ramírez", apellidoMaterno:"Flores", rfc:"RAFL910305MNL", email:"lucia@email.com", telefono:"8177773333", whatsapp:"8177773333", sexo:"F", fechaNacimiento:"05/03/1991", calle:"San Pedro", numero:"321", colonia:"Contry", cp:"64860", ciudad:"Monterrey", estado:"Nuevo León", polizas:2 },
  // ── Clientes reales importados de pólizas MAPFRE ──
  { id:6, nombre:"Guadalupe Nadyna", apellidoPaterno:"Gutiérrez", apellidoMaterno:"Rodríguez", rfc:"GURG600714G32", email:"", telefono:"8112859048", whatsapp:"8112859048", sexo:"F", fechaNacimiento:"14/07/1960", calle:"Av. Olimpia", numero:"1514", colonia:"Nueva Lindavista", cp:"67110", ciudad:"Guadalupe", estado:"Nuevo León", polizas:1 },
  { id:7, nombre:"Cristina", apellidoPaterno:"Rodríguez", apellidoMaterno:"Sánchez", rfc:"ROSC660724D91", email:"", telefono:"8712197590", whatsapp:"8712197590", sexo:"F", fechaNacimiento:"24/07/1966", calle:"Blvd. Revolución Pte.", numero:"1818 Bis", colonia:"Centro", cp:"27000", ciudad:"Torreón", estado:"Coahuila", polizas:2 },
  { id:8, nombre:"Lucero Paloma", apellidoPaterno:"Simental", apellidoMaterno:"Aldaba", rfc:"SIAL780112K89", email:"", telefono:"6182111402", whatsapp:"6182111402", sexo:"F", fechaNacimiento:"12/01/1978", calle:"Calle San Marcos", numero:"S/N", colonia:"Fracc. San Antonio", cp:"35015", ciudad:"Gómez Palacio", estado:"Durango", polizas:1 },
];

const POLIZAS_INIT = [
  { id:1, clienteId:1, cliente:"María González Ruiz", emailCliente:"maria@email.com", telefonoCliente:"5512345678", numero:"GNP-2024-001234", aseguradora:"GNP", ramo:"Vida", subramo:"Vida Individual", prima:8400, frecuencia:"Anual", inicio:"2024-01-15", vencimiento:"2025-01-15", status:"activa", coberturas:["Muerte natural","Muerte accidental","Invalidez total"] },
  { id:2, clienteId:1, cliente:"María González Ruiz", emailCliente:"maria@email.com", telefonoCliente:"5512345678", numero:"AXA-2023-998877", aseguradora:"AXA", ramo:"Gastos Médicos", subramo:"Tradicional", prima:24000, frecuencia:"Anual", inicio:"2023-06-01", vencimiento:"2025-06-01", status:"activa", coberturas:["Hospitalización","Cirugía","Maternidad","Urgencias"] },
  { id:3, clienteId:2, cliente:"Carlos Mendoza López", emailCliente:"carlos@email.com", telefonoCliente:"8198765432", numero:"HDI-2024-445566", aseguradora:"HDI", ramo:"Autos", subramo:"Individual", prima:6200, frecuencia:"Semestral", inicio:"2024-03-10", vencimiento:"2024-09-10", status:"vencida", coberturas:["Daños materiales","Robo total","RC"] },
  { id:4, clienteId:4, cliente:"Roberto Sánchez Vega", emailCliente:"roberto@email.com", telefonoCliente:"5588889999", numero:"SURA-2024-112233", aseguradora:"SURA", ramo:"Daños", subramo:"Hogar", prima:3800, frecuencia:"Anual", inicio:"2024-02-20", vencimiento:"2025-02-20", status:"activa", coberturas:["Incendio","Robo con violencia","Daños por agua"] },
  { id:5, clienteId:5, cliente:"Lucía Ramírez Flores", emailCliente:"lucia@email.com", telefonoCliente:"8177773333", numero:"BANAMEX-2024-667788", aseguradora:"Citibanamex", ramo:"Vida", subramo:"Vida Universal", prima:12000, frecuencia:"Anual", inicio:"2024-04-05", vencimiento:"2025-04-05", status:"activa", coberturas:["Muerte natural","Muerte accidental","Enfermedades graves"] },
  { id:6, clienteId:1, cliente:"María González Ruiz", emailCliente:"maria@email.com", telefonoCliente:"5512345678", numero:"GNP-2024-339900", aseguradora:"GNP", ramo:"Autos", subramo:"Individual", prima:5600, frecuencia:"Semestral", inicio:"2024-07-01", vencimiento:"2025-01-01", status:"por vencer", coberturas:["Daños materiales","Robo total","RC","Asistencia vial"] },

  // ── Pólizas reales MAPFRE ──────────────────────────────────────────
  {
    id:7, clienteId:6,
    cliente:"Guadalupe Nadyna Gutiérrez Rodríguez",
    emailCliente:"", telefonoCliente:"8112859048",
    numero:"2832600000315", endoso:"0",
    aseguradora:"Mapfre", ramo:"Gastos Médicos", subramo:"Accidentes Personales",
    fechaEmision:"2026-01-05",
    inicio:"2026-01-15", vencimiento:"2026-01-31",
    formaPago:"Contado",
    primaNeta:2040, gastosExpedicion:0, iva:0, primaTotal:2040,
    status:"activa",
    coberturas:[
      "Muerte accidental $25,000","Muerte accidental transporte $25,000",
      "Responsabilidad civil en viaje $10,000","Segurviaje Plan Silver Mundial",
      "Asistencia médica emergencia 50,000 USD","Traslado médico 20,000 USD",
      "Cancelación de viaje 1,000 USD","Pérdida de equipaje 1,200 USD"
    ],
    notas:"Plan Silver · Origen: México · Destino: Mundial · 17 días de vigencia",
    documentoPoliza:null, documentoNombre:"", documentoTipo:"", pagos:[]
  },
  {
    id:8, clienteId:7,
    cliente:"Cristina Rodríguez Sánchez",
    emailCliente:"", telefonoCliente:"8712197590",
    numero:"1002000005366", endoso:"6",
    aseguradora:"Mapfre", ramo:"Vida", subramo:"Vida Individual",
    fechaEmision:"2025-06-05",
    inicio:"2025-06-05", vencimiento:"2040-06-05",
    formaPago:"Anual",
    primaNeta:4452.23, gastosExpedicion:0, iva:0, primaTotal:4452.23,
    status:"activa",
    coberturas:[
      "Vida $400,000 (15 años, pago 15 años)","Servicios funerarios (amparada)","Exención pago primas por invalidez total y permanente"
    ],
    notas:"Plan Tiempo Seguro 20 MN · Folio 1200739033398 · Cliente Mapfre: 231CRS",
    documentoPoliza:null, documentoNombre:"", documentoTipo:"", pagos:[]
  },
  {
    id:9, clienteId:7,
    cliente:"Cristina Rodríguez Sánchez",
    emailCliente:"", telefonoCliente:"8712197590",
    numero:"1042000001328", endoso:"6",
    aseguradora:"Mapfre", ramo:"Vida", subramo:"Vida Individual",
    fechaEmision:"2025-06-25",
    inicio:"2025-06-25", vencimiento:"2067-06-25",
    formaPago:"Anual",
    primaNeta:17664.54, gastosExpedicion:0, iva:0, primaTotal:17664.54,
    status:"activa",
    coberturas:[
      "Vida $600,000 (47 años, pagos limitados 10 años)","Exención pago primas por invalidez total y permanente por accidente"
    ],
    notas:"Plan Vida Entera Pagos Limitados 10 Constante MN · Folio 1200739038176 · Cliente Mapfre: 215AOR",
    documentoPoliza:null, documentoNombre:"", documentoTipo:"", pagos:[]
  },
  {
    id:10, clienteId:8,
    cliente:"Lucero Paloma Simental Aldaba",
    emailCliente:"", telefonoCliente:"6182111402",
    numero:"2902500003778", endoso:"0",
    aseguradora:"Mapfre", ramo:"Gastos Médicos", subramo:"Accidentes Personales",
    fechaEmision:"2025-11-25",
    inicio:"2025-11-25", vencimiento:"2026-11-25",
    formaPago:"Contado",
    primaNeta:13572.31, gastosExpedicion:500, iva:2251.57, primaTotal:16323.88,
    status:"activa",
    coberturas:[
      "Muerte accidental $30,000","Reembolso gastos médicos $25,000 (ded. $200)","Fractura de huesos por accidente $20,000",
      "Contact Center","Asistencia Visión","Asistencia Funeraria"
    ],
    notas:"APC Simplificada Escolar · Plan Guarderías · 98 asegurados · Administración simplificada",
    documentoPoliza:null, documentoNombre:"", documentoTipo:"", pagos:[]
  },
];

const SUBAGENTES_INIT = [
  { id:1, nombre:"Carlos", apellidoPaterno:"Fuentes", apellidoMaterno:"Mora", email:"cfuentes@gmail.com", telefono:"8111234567", whatsapp:"8111234567", activo:true, notas:"" },
  { id:2, nombre:"Patricia", apellidoPaterno:"Luna", apellidoMaterno:"Ibarra", email:"pluna@gmail.com", telefono:"8119876543", whatsapp:"8119876543", activo:true, notas:"" },
];

const PIPELINE_INIT = [
  { id:1, cliente:"Ana Sofía Torres", tipo:"Gastos Médicos Familiar", valor:18000, etapa:"Cotización", probabilidad:40, seguimiento:"2025-01-20", agente:"María Teresa Rodríguez", telefono:"3355551234", email:"ana@email.com", notas:"" },
  { id:2, cliente:"Juan Pablo Reyes", tipo:"Vida Universal", valor:35000, etapa:"Propuesta", probabilidad:65, seguimiento:"2025-01-18", agente:"María Teresa Rodríguez", telefono:"", email:"", notas:"" },
  { id:3, cliente:"Diana Morales", tipo:"Autos Individual", valor:7200, etapa:"Contacto", probabilidad:20, seguimiento:"2025-01-22", agente:"", telefono:"", email:"", notas:"" },
  { id:4, cliente:"Fernando Castro", tipo:"Daños + Vida", valor:15000, etapa:"Negociación", probabilidad:80, seguimiento:"2025-01-17", agente:"María Teresa Rodríguez", telefono:"5588889999", email:"fernando@email.com", notas:"Muy interesado, recontactar viernes" },
  { id:5, cliente:"Valeria Gutiérrez", tipo:"GMM Individual", valor:9600, etapa:"Cierre", probabilidad:95, seguimiento:"2025-01-16", agente:"María Teresa Rodríguez", telefono:"5511112222", email:"valeria@email.com", notas:"Listo para firmar" },
];

const TAREAS_INIT = [
  { id:1, titulo:"Llamar a Ana Torres para cotización GMM", fecha:"2025-01-18", tipo:"llamada", done:false, prioridad:"alta" },
  { id:2, titulo:"Enviar renovación póliza GNP-2024-339900", fecha:"2025-01-20", tipo:"email", done:false, prioridad:"alta" },
  { id:3, titulo:"Cita con Fernando Castro - Negociación", fecha:"2025-01-17", tipo:"cita", done:false, prioridad:"media" },
  { id:4, titulo:"Revisar documentación Roberto Sánchez", fecha:"2025-01-22", tipo:"doc", done:true, prioridad:"baja" },
  { id:5, titulo:"Seguimiento Valeria Gutiérrez - cierre", fecha:"2025-01-16", tipo:"llamada", done:false, prioridad:"alta" },
];

const USUARIOS_INIT = [
  { id:1, nombre:"Administrador", username:"admin", password:"admin123", email:"admin@seguros.com", rol:"admin", status:"activo", telefono:"", clave:"AGT-001" },
];

const PAI_METAS_INIT = [];

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const nombreCompleto = (c) => `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno || ""}`.trim();

const RAMO_COLORS = { Vida:"#7c3aed", "Gastos Médicos":"#059669", Autos:"#2563eb", Daños:"#d97706", default:"#6b7280" };
const ramoColor = (r) => RAMO_COLORS[r] || RAMO_COLORS.default;

// ═══════════════════════════════════════════════════════════════════
// RFC AUTOMÁTICO — reglas SAT México
// ═══════════════════════════════════════════════════════════════════
const PALABRAS_VACIAS = ["DE","DEL","LA","LAS","LOS","Y","EL","EN","CON","POR","AL","MI"];
const CONSONANTES = /[BCDFGHJKLMNÑPQRSTVWXYZ]/i;
const VOCALES = /[AEIOU]/i;

function generarRFC(nombre, apellidoP, apellidoM, fechaNacimiento) {
  // fechaNacimiento esperado: DD/MM/AAAA
  if (!nombre || !apellidoP) return "";

  // Limpiar y normalizar
  const norm = (s) => (s||"").toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // quitar tildes
    .replace(/[^A-ZÑ\s]/g,"").trim();

  const apP = norm(apellidoP);
  const apM = norm(apellidoM);
  const nom = norm(nombre).split(/\s+/)[0]; // primer nombre

  // Filtrar palabras vacías en apellidos
  const filtrarVacia = (s) => {
    const partes = s.split(/\s+/);
    const filtrado = partes.filter(p => !PALABRAS_VACIAS.includes(p));
    return filtrado.length > 0 ? filtrado[0] : partes[0];
  };

  const ap1 = filtrarVacia(apP);
  const ap2 = filtrarVacia(apM||"X");

  // Reglas: 1ª letra del ApP + 1ª vocal interna ApP + 1ª letra ApM + 1ª letra Nombre
  let parte1 = "";
  if (ap1.length >= 2) {
    // Primera letra del ApP
    parte1 += ap1[0];
    // Primera vocal interna del ApP (posición 1 en adelante)
    const vocalInterna = ap1.slice(1).split("").find(c => VOCALES.test(c));
    parte1 += vocalInterna || "X";
  } else {
    parte1 += (ap1[0]||"X") + "X";
  }
  parte1 += (ap2[0] || "X");
  parte1 += (nom[0] || "X");

  // Palabras inconvenientes → sustituir 4ª letra por X
  const INCONVENIENTES = ["BACA","BAKA","BUEI","BUEY","CACA","CACO","CAGA","CAGO","CAKA","CAKO","COGE","COGI","COJA","COJE","COJI","COJO","COLA","CULO","FALO","FETO","GETA","GUEI","GUEY","JETA","JOTO","KACA","KACO","KAGA","KAGO","KAKA","KAKO","KOGE","KOGI","KOJA","KOJE","KOJI","KOJO","KOLA","KULO","LELO","LOCA","LOCO","LOKA","LOKO","MAME","MAMO","MEAR","MEAS","MEON","MIAR","MION","MOCO","MOKO","MULA","MULO","NACA","NACO","PEDA","PEDO","PENE","PIPI","PITO","POPO","PUTA","PUTO","QULO","RATA","ROBA","ROBE","ROBO","RUIN","SENO","TETA","VACA","VAGA","VAGO","VAKA","VUEI","VUEY","WUEI","WUEY"];
  if (INCONVENIENTES.includes(parte1)) parte1 = parte1.slice(0,3) + "X";

  // Fecha AAMMDD
  let parteFecha = "000000";
  if (fechaNacimiento) {
    const partes = fechaNacimiento.split("/");
    if (partes.length === 3) {
      const [dd, mm, aaaa] = partes;
      const aa = (aaaa||"").slice(-2);
      parteFecha = `${aa}${(mm||"").padStart(2,"0")}${(dd||"").padStart(2,"0")}`;
    }
  }

  // Retornar solo 10 caracteres: 4 letras + 6 fecha (SIN homoclave)
  return `${parte1}${parteFecha}`;
}

// Formatea input de fecha con slashes automáticos DD/MM/AAAA
function formatearFechaInput(raw) {
  const digits = raw.replace(/\D/g,"").slice(0,8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0,2)+"/"+digits.slice(2);
  return digits.slice(0,2)+"/"+digits.slice(2,4)+"/"+digits.slice(4);
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENTES BASE
// ═══════════════════════════════════════════════════════════════════
const Icon = ({ name, size=18 }) => {
  const paths = {
    dashboard:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>,
    clients:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>,
    policies:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>,
    pipeline:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>,
    tasks:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>,
    users:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>,
    coverage:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
    scan:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>,
    bell:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>,
    plus:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>,
    search:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>,
    check:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>,
    alert:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>,
    trend:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>,
    shield:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>,
    x:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>,
    edit:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>,
    upload:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>,
    spark:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z"/>,
    mail:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>,
    whatsapp:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>,
    copy:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>,
    lock:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>,
    trophy:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>,
    eye:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>,
    send:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>,
    calendar:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>,
    car:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 6h-2l-2 5H5l-1 1v3h1a2 2 0 104 0h4a2 2 0 104 0h1v-3l-1-1h-4l-2-5z"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">{paths[name]}</svg>;
};

const Badge = ({ status }) => {
  const map = {
    activa:{bg:"#d1fae5",color:"#065f46",label:"Activa"}, vencida:{bg:"#fee2e2",color:"#991b1b",label:"Vencida"},
    "por vencer":{bg:"#fef3c7",color:"#92400e",label:"Por vencer"},
    alta:{bg:"#fee2e2",color:"#991b1b",label:"Alta"}, media:{bg:"#fef3c7",color:"#92400e",label:"Media"}, baja:{bg:"#d1fae5",color:"#065f46",label:"Baja"},
    admin:{bg:"#ede9fe",color:"#5b21b6",label:"Admin"}, agente:{bg:"#dbeafe",color:"#1e40af",label:"Agente"}, asistente:{bg:"#f3f4f6",color:"#374151",label:"Asistente"},
    M:{bg:"#dbeafe",color:"#1e40af",label:"Masculino"}, F:{bg:"#fce7f3",color:"#9d174d",label:"Femenino"},
  };
  const s = map[status] || {bg:"#f3f4f6",color:"#4b5563",label:status};
  return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{s.label}</span>;
};

const KPICard = ({ label, value, sub, icon, accent }) => (
  <div style={{background:"#fff",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",borderTop:`3px solid ${accent}`,display:"flex",flexDirection:"column",gap:6,position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",right:14,top:14,background:accent+"15",color:accent,borderRadius:10,padding:7,display:"flex"}}>
      <Icon name={icon} size={18}/>
    </div>
    <span style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</span>
    <div style={{fontSize:30,fontWeight:700,color:"#0f172a",fontFamily:"'Inter',sans-serif",lineHeight:1.1,letterSpacing:"-0.5px"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:accent,fontWeight:600}}>{sub}</div>}
  </div>
);

const Modal = ({ title, onClose, children, wide, maxW }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:maxW||(wide?760:500),maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 28px 16px",borderBottom:"1px solid #f3f4f6",flexShrink:0,background:"#fff",borderRadius:"20px 20px 0 0"}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",display:"flex",flexShrink:0}}><Icon name="x" size={22}/></button>
      </div>
      <div style={{overflowY:"auto",padding:"20px 28px 28px",flex:1}}>
        {children}
      </div>
    </div>
  </div>
);

const Inp = ({ label, ...p }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:12,fontWeight:600,color:"#374151"}}>{label}</label>}
    <input {...p} style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 13px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",...p.style}}/>
  </div>
);

const Sel = ({ label, children, ...p }) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:12,fontWeight:600,color:"#374151"}}>{label}</label>}
    <select {...p} style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 13px",fontSize:13,outline:"none",fontFamily:"inherit",background:"#fff",...p.style}}>{children}</select>
  </div>
);

const Btn = ({ children, onClick, color="#1d4ed8", icon, style:s, outline, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{background:outline?"transparent":disabled?"#e5e7eb":color,color:outline?color:disabled?"#9ca3af":"#fff",border:outline?`2px solid ${color}`:"none",borderRadius:10,padding:"9px 17px",fontWeight:600,fontSize:13,cursor:disabled?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:7,fontFamily:"inherit",opacity:disabled?0.7:1,...s}}>
    {icon&&<Icon name={icon} size={15}/>}{children}
  </button>
);

const ProgressBar = ({ value, max, color, height=8 }) => {
  const pct = Math.min((value/max)*100,100);
  return (
    <div style={{background:"#f3f4f6",borderRadius:99,height,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width .6s ease"}}/>
    </div>
  );
};

const SectionTitle = ({ title, sub }) => (
  <div style={{marginBottom:4}}>
    <h2 style={{margin:0,fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#111827"}}>{title}</h2>
    {sub&&<p style={{margin:"3px 0 0",color:"#6b7280",fontSize:13}}>{sub}</p>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════
// DASHBOARD con gráficas
// ═══════════════════════════════════════════════════════════════════
function Dashboard({ clientes, polizas, pipeline, tareas, paiMetas, onVerPoliza }) {
  const getStDash = (p) => {
    if(p.status==="cancelada") return "cancelada";
    if(!p.vencimiento) return p.status||"activa";
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    const fv=new Date(p.vencimiento.includes("/")?p.vencimiento.split("/").reverse().join("-"):p.vencimiento);
    fv.setHours(0,0,0,0);
    const diff=Math.round((fv-hoy)/86400000);
    if(diff<0) return "vencida";
    if(diff<=30) return "por vencer";
    return "activa";
  };
  const activas    = polizas.filter(p=>getStDash(p)==="activa");
  const vencidas   = polizas.filter(p=>getStDash(p)==="vencida");
  const porVencer  = polizas.filter(p=>getStDash(p)==="por vencer");
  const sumPrima   = arr => arr.reduce((a,p)=>a+(parseFloat(p.primaTotal)||parseFloat(p.prima)||0),0);
  const primaVigente   = sumPrima(activas);
  const primaVencida   = sumPrima(vencidas);
  const primaPorVencer = sumPrima(porVencer);
  const primaCobrada   = polizas.filter(p=>p.ultimoPago||p.comisionPagada).reduce((a,p)=>a+(parseFloat(p.primaTotal)||parseFloat(p.prima)||0),0);
  const fmt = n => n>=1000000?`$${(n/1000000).toFixed(1)}M`:n>=1000?`$${(n/1000).toFixed(0)}K`:`$${Math.round(n).toLocaleString("es-MX")}`;
  const totalMeta    = paiMetas.reduce((a,m)=>a+m.metaBono,0);
  const totalCobrado = paiMetas.reduce((a,m)=>a+m.cobrado,0);
  const pctPAI       = Math.round((totalCobrado/totalMeta)*100)||0;
  const [alertaDetalle, setAlertaDetalle] = useState(null);

  // Data gráfica cobrado vs vencido por ramo
  const ramos = [...new Set(polizas.map(p=>p.ramo))];
  const barData = ramos.map(r => ({
    ramo: r.length > 10 ? r.slice(0,9)+"…" : r,
    cobrado: polizas.filter(p=>p.ramo===r&&p.status==="activa").reduce((a,p)=>a+p.prima,0),
    vencido: polizas.filter(p=>p.ramo===r&&p.status==="vencida").reduce((a,p)=>a+p.prima,0),
    "por vencer": polizas.filter(p=>p.ramo===r&&p.status==="por vencer").reduce((a,p)=>a+p.prima,0),
  }));

  // Data gráfica PAI
  const paiData = paiMetas.map(m => ({
    ramo: m.ramo.length>10?m.ramo.slice(0,9)+"…":m.ramo,
    meta: m.metaBono,
    cobrado: m.cobrado,
    faltante: m.metaBono-m.cobrado,
  }));

  // Pie por ramo
  const pieData = ramos.map(r => ({
    name: r,
    value: polizas.filter(p=>p.ramo===r&&p.status==="activa").reduce((a,p)=>a+p.prima,0),
  })).filter(d=>d.value>0);
  const PIE_COLORS = ["#7c3aed","#059669","#2563eb","#d97706","#dc2626","#0891b2"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active||!payload?.length) return null;
    return (
      <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 14px",fontSize:12,boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
        <div style={{fontWeight:700,marginBottom:6}}>{label}</div>
        {payload.map(p=><div key={p.name} style={{color:p.color,marginBottom:2}}>{p.name}: <strong>${Number(p.value).toLocaleString()}</strong></div>)}
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div>
        <h2 style={{margin:0,fontSize:24,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#111827"}}>Panel Principal</h2>
        <p style={{margin:"3px 0 0",color:"#6b7280",fontSize:13}}>Resumen operativo — 2025</p>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:11}}>
        <KPICard label="Por Vencer" value={porVencer.length} sub="≤30 días" icon="shield" accent="#d97706"/>
        <KPICard label="Vencidas" value={vencidas.length} sub="Sin renovar" icon="shield" accent="#dc2626"/>
        <KPICard label="Prima Vigente" value={fmt(primaVigente)} sub="Pólizas activas" icon="trend" accent="#059669"/>
        <KPICard label="Prima Por Vencer" value={fmt(primaPorVencer)} sub="En riesgo" icon="trend" accent="#d97706"/>
        <KPICard label="Prima Vencida" value={fmt(primaVencida)} sub="Sin renovar" icon="trend" accent="#dc2626"/>
        <KPICard label="Prima Cobrada" value={fmt(primaCobrada)} sub="Con pago confirmado" icon="trend" accent="#7c3aed"/>
      </div>

      {/* GRÁFICAS ROW 1 */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:18}}>

        {/* Barra: cobrado vs vencido por ramo */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Prima por Ramo — Cobrado vs Vencido</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>Distribución de cartera por estado</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{top:0,right:10,left:-10,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
              <XAxis dataKey="ramo" tick={{fontSize:11,fill:"#6b7280"}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10,fill:"#6b7280"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}K`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{fontSize:11,paddingTop:8}}/>
              <Bar dataKey="cobrado" name="Cobrado" fill="#059669" radius={[4,4,0,0]}/>
              <Bar dataKey="por vencer" name="Por vencer" fill="#f59e0b" radius={[4,4,0,0]}/>
              <Bar dataKey="vencido" name="Vencido" fill="#ef4444" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie por ramo */}
        <div style={{background:"#fff",borderRadius:16,padding:"22px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>Cartera por Ramo</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>Prima activa total</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((_, i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip formatter={(v)=>`$${Number(v).toLocaleString()}`}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>
            {pieData.map((d,i)=>(
              <div key={d.name} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:PIE_COLORS[i%PIE_COLORS.length],flexShrink:0}}/>
                <span style={{fontSize:11,color:"#374151",fontWeight:500}}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRÁFICA PAI */}
      <div style={{background:"#fff",borderRadius:16,padding:"22px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
        <div style={{marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:"#111827"}}>🏆 Avance de Bono PAI por Ramo — Q1 2025</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>Meta vs cobrado acumulado en el período</div>
          </div>
          <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:12,padding:"8px 16px",color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:10,color:"#94a3b8",letterSpacing:"0.05em"}}>GLOBAL</div>
            <div style={{fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif",color:pctPAI>=80?"#4ade80":pctPAI>=50?"#fbbf24":"#f87171"}}>{pctPAI}%</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={paiData} layout="vertical" margin={{top:0,right:30,left:60,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/>
            <XAxis type="number" tick={{fontSize:10,fill:"#6b7280"}} axisLine={false} tickLine={false} tickFormatter={v=>`$${v/1000}K`}/>
            <YAxis type="category" dataKey="ramo" tick={{fontSize:11,fill:"#374151",fontWeight:600}} axisLine={false} tickLine={false} width={70}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{fontSize:11,paddingTop:8}}/>
            <Bar dataKey="cobrado" name="Cobrado" fill="#059669" radius={[0,4,4,0]} stackId="a"/>
            <Bar dataKey="faltante" name="Faltante" fill="#e5e7eb" radius={[0,4,4,0]} stackId="a"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {alertaDetalle&&(
        <Modal title={`Póliza ${alertaDetalle.numero}`} onClose={()=>setAlertaDetalle(null)} wide maxW={620}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:`linear-gradient(135deg,${ramoColor(alertaDetalle.ramo)},${ramoColor(alertaDetalle.ramo)}bb)`,borderRadius:12,padding:"14px 18px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,opacity:.8,fontWeight:700}}>{alertaDetalle.ramo?.toUpperCase()}{alertaDetalle.subramo?" · "+alertaDetalle.subramo.toUpperCase():""} · {alertaDetalle.aseguradora}</div>
                <div style={{fontSize:18,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{alertaDetalle.numero}</div>
                <div style={{fontSize:12,opacity:.9,marginTop:2}}>{alertaDetalle.cliente}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,opacity:.7}}>PRIMA TOTAL</div>
                <div style={{fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>${(parseFloat(alertaDetalle.primaTotal)||parseFloat(alertaDetalle.prima)||0).toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[["Aseguradora",alertaDetalle.aseguradora||"—"],["Forma de pago",alertaDetalle.formaPago||alertaDetalle.frecuencia||"—"],["Inicio vigencia",alertaDetalle.inicio||"—"],["Fin vigencia",alertaDetalle.vencimiento||"—"],["Prima neta",alertaDetalle.primaNeta?`$${Number(alertaDetalle.primaNeta).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],["Agente",alertaDetalle.agentePoliza||"—"],["Moneda",alertaDetalle.moneda||"MXN"]].map(([l,v])=>(
                <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{v}</div>
                </div>
              ))}
            </div>
            {alertaDetalle.coberturas?.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:9,padding:"10px 13px"}}>
                <div style={{fontSize:9,color:"#065f46",fontWeight:700,marginBottom:6}}>COBERTURAS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{alertaDetalle.coberturas.map(c=><span key={c} style={{background:"#d1fae5",color:"#065f46",fontSize:11,padding:"2px 8px",borderRadius:14,fontWeight:600}}>{c}</span>)}</div>
              </div>
            )}
            {alertaDetalle.documentoPoliza&&(
              <a href={alertaDetalle.documentoPoliza} download={alertaDetalle.documentoNombre||"poliza.pdf"}
                style={{display:"inline-flex",alignItems:"center",gap:8,background:"#2563eb",color:"#fff",padding:"9px 18px",borderRadius:9,fontSize:12,fontWeight:700,textDecoration:"none",width:"fit-content"}}>
                📄 Ver / Descargar póliza adjunta
              </a>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CLIENTES — campo a campo completo
// ═══════════════════════════════════════════════════════════════════
const FORM_CLIENTE_INIT = {
  nombre:"", apellidoPaterno:"", apellidoMaterno:"",
  rfc:"", email:"", telefono:"", whatsapp:"",
  sexo:"", fechaNacimiento:"",
  calle:"", numero:"", colonia:"", cp:"", ciudad:"", estado:"",
};

// ═══════════════════════════════════════════════════════════════════
// DETALLE CLIENTE MODAL
// ═══════════════════════════════════════════════════════════════════
function DetalleClienteModal({ cliente, polizas=[], onClose, onGuardar, onRegistrarPago }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({...cliente});
  const [guardado, setGuardado] = useState(false);
  const [polizaVer, setPolizaVer] = useState(null);
  const [polizaPago, setPolizaPago] = useState(null);

  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const guardar = () => {
    onGuardar(form);
    setGuardado(true);
    setTimeout(()=>setGuardado(false), 2500);
    setEditando(false);
  };

  const polizasCliente = polizas.filter(p=>
    p.clienteId===cliente.id || p.cliente===nombreCompleto(cliente)
  );
  const getStatusLocal = (p) => {
    if(p.status==="cancelada") return "cancelada";
    const hoy=new Date(); hoy.setHours(0,0,0,0);
    if(!p.vencimiento) return p.status||"activa";
    const fv=new Date(p.vencimiento.includes("/")?p.vencimiento.split("/").reverse().join("-"):p.vencimiento);
    fv.setHours(0,0,0,0);
    const diff=Math.round((fv-hoy)/86400000);
    if(diff<0) return "vencida";
    if(diff<=10) return "por vencer";
    return "activa";
  };
  const stColors={activa:"#059669","por vencer":"#d97706",vencida:"#dc2626",cancelada:"#6b7280"};
  const stLabels={activa:"✓ Vigente","por vencer":"⚠ Por vencer",vencida:"✗ Vencida",cancelada:"○ Cancelada"};

  const inpStyle={border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:12,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:"#fff",color:"#111827"};
  const inpFocusStyle="1.5px solid #2563eb";

  return(
    <Modal title={nombreCompleto(editando?form:cliente)} onClose={onClose} wide maxW={820}>
      <div style={{display:"flex",flexDirection:"column",gap:18}}>

        {/* Toggle Ver / Editar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:10,padding:3}}>
            {[["ver","👁 Ver datos"],["edit","✏️ Editar"]].map(([m,l])=>(
              <button key={m} onClick={()=>{ setEditando(m==="edit"); if(m==="edit") setForm({...cliente}); }}
                style={{background:((m==="edit"&&editando)||(m==="ver"&&!editando))?"#fff":"none",border:"none",
                  borderRadius:8,padding:"7px 20px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                  color:((m==="edit"&&editando)||(m==="ver"&&!editando))?"#111827":"#6b7280",
                  boxShadow:((m==="edit"&&editando)||(m==="ver"&&!editando))?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                {l}
              </button>
            ))}
          </div>
          {guardado&&<span style={{color:"#059669",fontWeight:700,fontSize:13}}>✅ Cambios guardados</span>}
        </div>

        {/* MODO VER */}
        {!editando&&(
          <>
            <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:12}}>INFORMACIÓN PERSONAL</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                {[
                  ["Nombre",nombreCompleto(cliente)],
                  ["RFC",cliente.rfc||"—"],
                  ["Fecha de Nacimiento",cliente.fechaNacimiento||"—"],
                  ["Sexo",cliente.sexo==="M"?"Masculino":cliente.sexo==="F"?"Femenino":"—"],
                  ["Email",cliente.email||"—"],
                  ["Teléfono",cliente.telefono||"—"],
                  ["WhatsApp",cliente.whatsapp||"—"],
                  ["Ciudad",cliente.ciudad||"—"],
                  ["Estado",cliente.estado||"—"],
                ].map(([l,v])=>(
                  <div key={l} style={{background:"#fff",borderRadius:9,padding:"9px 12px"}}>
                    <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                    <div style={{fontSize:12,fontWeight:600,color:v==="—"?"#d1d5db":"#111827"}}>{v}</div>
                  </div>
                ))}
              </div>
              {(cliente.calle||cliente.colonia||cliente.cp)&&(
                <div style={{marginTop:10,background:"#fff",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>DOMICILIO</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>
                    {[cliente.calle,cliente.numero,cliente.colonia,cliente.cp].filter(Boolean).join(", ")||"—"}
                  </div>
                </div>
              )}
              {cliente.whatsapp&&(
                <div style={{marginTop:12}}>
                  <Btn onClick={()=>window.open("https://wa.me/52"+cliente.whatsapp.replace(/\D/g,""),"_blank")} color="#25d366" icon="whatsapp">
                    Abrir WhatsApp
                  </Btn>
                </div>
              )}
            </div>
          </>
        )}

        {/* MODO EDITAR */}
        {editando&&(
          <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
            <div style={{fontSize:11,fontWeight:800,color:"#2563eb",letterSpacing:"0.08em",marginBottom:4}}>✏️ EDITAR INFORMACIÓN PERSONAL</div>

            {/* Nombre */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>NOMBRE(S) *</div>
                <input value={form.nombre||""} onChange={e=>upd("nombre",e.target.value)} style={inpStyle} placeholder="Nombre(s)"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>APELLIDO PATERNO *</div>
                <input value={form.apellidoPaterno||""} onChange={e=>upd("apellidoPaterno",e.target.value)} style={inpStyle} placeholder="Apellido paterno"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>APELLIDO MATERNO</div>
                <input value={form.apellidoMaterno||""} onChange={e=>upd("apellidoMaterno",e.target.value)} style={inpStyle} placeholder="Apellido materno"/>
              </div>
            </div>

            {/* Datos personales */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>RFC</div>
                <input value={form.rfc||""} onChange={e=>upd("rfc",e.target.value.toUpperCase())} style={inpStyle} placeholder="RFC"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>FECHA DE NACIMIENTO</div>
                <input type="date" value={form.fechaNacimiento||""} onChange={e=>upd("fechaNacimiento",e.target.value)} style={inpStyle}/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>SEXO</div>
                <select value={form.sexo||""} onChange={e=>upd("sexo",e.target.value)} style={inpStyle}>
                  <option value="">— Seleccionar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            {/* Contacto */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>EMAIL</div>
                <input type="email" value={form.email||""} onChange={e=>upd("email",e.target.value)} style={inpStyle} placeholder="correo@email.com"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>TELÉFONO</div>
                <input value={form.telefono||""} onChange={e=>upd("telefono",e.target.value)} style={inpStyle} placeholder="55 0000 0000"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>WHATSAPP</div>
                <input value={form.whatsapp||""} onChange={e=>upd("whatsapp",e.target.value)} style={inpStyle} placeholder="55 0000 0000"/>
              </div>
            </div>

            {/* Domicilio */}
            <div style={{fontSize:10,color:"#6b7280",fontWeight:800,marginTop:4,marginBottom:2,letterSpacing:"0.06em"}}>DOMICILIO</div>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>CALLE</div>
                <input value={form.calle||""} onChange={e=>upd("calle",e.target.value)} style={inpStyle} placeholder="Nombre de calle"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>NÚMERO EXT.</div>
                <input value={form.numero||""} onChange={e=>upd("numero",e.target.value)} style={inpStyle} placeholder="123"/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>COLONIA</div>
                <input value={form.colonia||""} onChange={e=>upd("colonia",e.target.value)} style={inpStyle} placeholder="Colonia"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>C.P.</div>
                <input value={form.cp||""} onChange={e=>upd("cp",e.target.value)} style={inpStyle} placeholder="00000"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>CIUDAD</div>
                <input value={form.ciudad||""} onChange={e=>upd("ciudad",e.target.value)} style={inpStyle} placeholder="Ciudad"/>
              </div>
              <div>
                <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>ESTADO</div>
                <input value={form.estado||""} onChange={e=>upd("estado",e.target.value)} style={inpStyle} placeholder="Estado"/>
              </div>
            </div>

            {/* Notas */}
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:4}}>NOTAS</div>
              <textarea value={form.notas||""} onChange={e=>upd("notas",e.target.value)} rows={2}
                placeholder="Observaciones, comentarios..." style={{...inpStyle,resize:"none",lineHeight:1.6}}/>
            </div>

            {/* Botones guardar */}
            <div style={{display:"flex",gap:10,marginTop:4,paddingTop:12,borderTop:"1px solid #e5e7eb"}}>
              <button onClick={()=>setEditando(false)}
                style={{background:"#f3f4f6",border:"none",borderRadius:9,padding:"9px 22px",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#6b7280"}}>
                Cancelar
              </button>
              <button onClick={guardar}
                style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:9,padding:"9px 28px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginLeft:"auto"}}>
                💾 Guardar cambios
              </button>
            </div>
          </div>
        )}

        {/* Pólizas — siempre visible */}
        <div>
          <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:10}}>
            PÓLIZAS ({polizasCliente.length})
          </div>
          {polizasCliente.length===0?(
            <div style={{background:"#f9fafb",borderRadius:10,padding:"24px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
              Este cliente no tiene pólizas registradas
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {polizasCliente.map(p=>{
                const st=getStatusLocal(p);
                const stColor=stColors[st]||"#6b7280";
                const ultimoPago = p.pagos?.length>0 ? p.pagos[p.pagos.length-1] : null;
                const totalPagado = (p.pagos||[]).reduce((a,pg)=>a+(parseFloat(pg.monto)||0),0);
                const prima = parseFloat(p.primaTotal)||parseFloat(p.prima)||0;
                const saldoPendiente = prima - totalPagado;
                return(
                  <div key={p.id} style={{background:"#fff",borderRadius:12,border:`1.5px solid ${stColor}33`,overflow:"hidden"}}>
                    {/* Header póliza */}
                    <div style={{background:`${stColor}10`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${stColor}22`}}>
                      <div style={{display:"flex",alignItems:"center",gap:9}}>
                        <div style={{width:9,height:9,borderRadius:"50%",background:stColor,flexShrink:0}}/>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:"#111827",fontFamily:"monospace"}}>{p.numero||"Sin número"}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{p.ramo}{p.subramo?" · "+p.subramo:""} · {p.aseguradora}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{background:stColor+"20",color:stColor,padding:"2px 9px",borderRadius:6,fontSize:10,fontWeight:700}}>{stLabels[st]}</span>
                        <button onClick={()=>setPolizaVer(p)}
                          style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",color:"#1d4ed8",fontFamily:"inherit"}}>
                          👁 Ver
                        </button>
                      </div>
                    </div>
                    {/* Detalle póliza */}
                    <div style={{padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
                      <div>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>PRIMA TOTAL</div>
                        <div style={{fontSize:13,fontWeight:800,color:"#059669"}}>${prima.toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
                        <div style={{fontSize:10,color:"#9ca3af"}}>{p.formaPago||p.frecuencia||"—"}</div>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>VIGENCIA</div>
                        <div style={{fontSize:11,fontWeight:600,color:"#374151"}}>{p.inicio||"—"}</div>
                        <div style={{fontSize:11,color:"#9ca3af"}}>al {p.vencimiento||"—"}</div>
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>ÚLTIMO PAGO</div>
                        {ultimoPago?(
                          <>
                            <div style={{fontSize:11,fontWeight:700,color:"#059669"}}>${Number(ultimoPago.monto||0).toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
                            <div style={{fontSize:10,color:"#9ca3af"}}>{ultimoPago.fechaPago}</div>
                          </>
                        ):(
                          <div style={{fontSize:11,color:"#d1d5db"}}>Sin pagos</div>
                        )}
                      </div>
                      <div>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>SALDO</div>
                        <div style={{fontSize:13,fontWeight:800,color:saldoPendiente>0?"#dc2626":"#059669"}}>
                          {saldoPendiente>0?`$${saldoPendiente.toLocaleString("es-MX",{maximumFractionDigits:0})} pendiente`:"✓ Al corriente"}
                        </div>
                      </div>
                    </div>
                    {/* Historial de pagos mini */}
                    {(p.pagos||[]).length>0&&(
                      <div style={{padding:"0 14px 10px"}}>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:5}}>HISTORIAL DE PAGOS</div>
                        <div style={{display:"flex",flexDirection:"column",gap:4}}>
                          {[...(p.pagos||[])].reverse().slice(0,3).map((pg,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#f0fdf4",borderRadius:7,padding:"5px 10px"}}>
                              <div style={{fontSize:11,color:"#374151"}}>
                                {pg.reciboNum&&<span style={{background:"#7c3aed",color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:9,fontWeight:800,marginRight:5}}>R{pg.reciboNum}</span>}
                                {pg.fechaPago} · {pg.formaPago}
                              </div>
                              <div style={{fontSize:12,fontWeight:700,color:"#059669"}}>${Number(pg.monto||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
                            </div>
                          ))}
                          {(p.pagos||[]).length>3&&<div style={{fontSize:10,color:"#9ca3af",textAlign:"center"}}>+{(p.pagos||[]).length-3} pagos más</div>}
                        </div>
                      </div>
                    )}
                    {/* Botón registrar pago */}
                    {st!=="cancelada"&&(
                      <div style={{padding:"0 14px 12px"}}>
                        <button onClick={()=>setPolizaPago(p)}
                          style={{width:"100%",background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",
                            borderRadius:9,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",
                            fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                          💳 Registrar Pago
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal registrar pago desde perfil cliente */}
      {polizaPago&&(
        <Modal title={`Registrar Pago — ${polizaPago.numero}`} onClose={()=>setPolizaPago(null)}>
          <ModalPago
            poliza={polizaPago}
            onGuardar={(pago)=>{
              onRegistrarPago(polizaPago.id, pago);
              setPolizaPago(null);
            }}
            onEliminarPago={(pgId)=>{
              onRegistrarPago(polizaPago.id, null, pgId);
            }}
            onClose={()=>setPolizaPago(null)}
          />
        </Modal>
      )}

      {polizaVer&&(
        <Modal title={`Póliza ${polizaVer.numero}`} onClose={()=>setPolizaVer(null)} wide maxW={680}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:`linear-gradient(135deg,${ramoColor(polizaVer.ramo)},${ramoColor(polizaVer.ramo)}bb)`,borderRadius:12,padding:"14px 18px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,opacity:.8,fontWeight:700}}>{polizaVer.ramo?.toUpperCase()}{polizaVer.subramo?" · "+polizaVer.subramo.toUpperCase():""} · {polizaVer.aseguradora}</div>
                <div style={{fontSize:18,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{polizaVer.numero}</div>
                <div style={{fontSize:12,opacity:.9,marginTop:2}}>{polizaVer.cliente}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,opacity:.7}}>PRIMA TOTAL</div>
                <div style={{fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>${(parseFloat(polizaVer.primaTotal)||parseFloat(polizaVer.prima)||0).toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
                <div style={{fontSize:11,opacity:.8,marginTop:2}}>{polizaVer.formaPago||polizaVer.frecuencia}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[["Aseguradora",polizaVer.aseguradora||"—"],["Forma de Pago",polizaVer.formaPago||polizaVer.frecuencia||"—"],["Inicio Vigencia",polizaVer.inicio||"—"],["Fin Vigencia",polizaVer.vencimiento||"—"],["Prima Neta",polizaVer.primaNeta?`$${Number(polizaVer.primaNeta).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],["Agente",polizaVer.agentePoliza||"—"],["Beneficiario",polizaVer.beneficiarioPreferente||"—"]].map(([l,v])=>(
                <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{v}</div>
                </div>
              ))}
            </div>
            {polizaVer.coberturas?.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:9,padding:"10px 13px"}}>
                <div style={{fontSize:9,color:"#065f46",fontWeight:700,marginBottom:6}}>COBERTURAS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{polizaVer.coberturas.map(c=><span key={c} style={{background:"#d1fae5",color:"#065f46",fontSize:11,padding:"2px 8px",borderRadius:14,fontWeight:600}}>{c}</span>)}</div>
              </div>
            )}
            {polizaVer.documentoPoliza?(
              <div style={{background:"#eff6ff",borderRadius:12,padding:14,border:"1.5px solid #bfdbfe"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#1e40af",marginBottom:10}}>📄 DOCUMENTO DE PÓLIZA ADJUNTO</div>
                {polizaVer.documentoTipo?.startsWith("image/")?(
                  <img src={polizaVer.documentoPoliza} alt="Póliza" style={{maxWidth:"100%",borderRadius:9,border:"1px solid #e5e7eb"}}/>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:10,padding:"12px 16px",border:"1px solid #e5e7eb"}}>
                    <span style={{fontSize:36}}>📄</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{polizaVer.documentoNombre||"Documento de póliza"}</div>
                      <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{polizaVer.documentoTipo}</div>
                    </div>
                    <a href={polizaVer.documentoPoliza} download={polizaVer.documentoNombre||"poliza.pdf"}
                      style={{background:"#2563eb",color:"#fff",padding:"8px 16px",borderRadius:9,fontSize:12,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6}}>
                      ⬇ Descargar
                    </a>
                  </div>
                )}
              </div>
            ):(
              <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 16px",border:"1px dashed #d1d5db",fontSize:12,color:"#9ca3af",textAlign:"center"}}>
                📎 No hay documento digital adjunto para esta póliza
              </div>
            )}
          </div>
        </Modal>
      )}
    </Modal>
  );
}

function Clientes({ clientes, setClientes, polizas=[], setPolizas }) {
  const [busqueda, setBusqueda] = useState("");
  const [viewModeC, setViewModeC] = useState("cards");
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(null);
  const [form, setForm] = useState(FORM_CLIENTE_INIT);
  const [errores, setErrores] = useState({});

  const registrarPagoDesdeCliente = (polizaId, pago, eliminarPagoId) => {
    if (eliminarPagoId) {
      setPolizas(prev=>prev.map(p=>p.id===polizaId?{...p,pagos:(p.pagos||[]).filter(pg=>pg.id!==eliminarPagoId)}:p));
    } else if (pago) {
      setPolizas(prev=>prev.map(p=>p.id===polizaId?{...p,pagos:[...(p.pagos||[]),pago],ultimoPago:pago}:p));
    }
  };

  const filtrados = clientes.filter(c => {
    const nc = nombreCompleto(c).toLowerCase();
    return nc.includes(busqueda.toLowerCase()) || (c.email||"").toLowerCase().includes(busqueda.toLowerCase());
  });

  const f = (k) => (v) => setForm(p=>({...p,[k]:v}));

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Requerido";
    if (!form.apellidoPaterno.trim()) e.apellidoPaterno = "Requerido";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Email inválido";
    if (form.fechaNacimiento && !/^\d{2}\/\d{2}\/\d{4}$/.test(form.fechaNacimiento)) e.fechaNacimiento = "Formato DD/MM/AAAA";
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    const nombreNuevo = `${form.nombre} ${form.apellidoPaterno} ${form.apellidoMaterno||""}`.trim().toLowerCase();
    const rfcNuevo = (form.rfc||"").trim().toUpperCase();
    const duplicado = clientes.find(c => {
      if (rfcNuevo && c.rfc) return c.rfc.trim().toUpperCase() === rfcNuevo;
      return `${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno||""}`.trim().toLowerCase() === nombreNuevo;
    });
    if (duplicado) {
      const msg = rfcNuevo ? `RFC "${rfcNuevo}"` : `nombre "${nombreNuevo}"`;
      alert(`⚠️ Ya existe un cliente con ${msg}. No se puede guardar duplicado.`);
      return;
    }
    setClientes(prev=>[...prev,{...form,id:Date.now(),polizas:0}]);
    setShowModal(false);
    setForm(FORM_CLIENTE_INIT);
    setErrores({});
  };

  const ErrMsg = ({k}) => errores[k]?<span style={{fontSize:11,color:"#dc2626",marginTop:2}}>{errores[k]}</span>:null;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionTitle title="Clientes" sub={`${clientes.length} registros en cartera`}/>
        <Btn onClick={()=>setShowModal(true)} icon="plus">Nuevo Cliente</Btn>
      </div>

      <div style={{background:"#fff",borderRadius:16,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",overflow:"hidden"}}>
        <div style={{padding:"12px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <Icon name="search"/><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por nombre o email..." autoComplete="off" style={{border:"none",outline:"none",fontSize:14,flex:1,fontFamily:"inherit",background:"transparent"}}/>
          <div style={{display:"flex",gap:3,marginLeft:8}}>
            {[["cards","⊞"],["table","☰"]].map(([m,ic])=>(
              <button key={m} onClick={()=>setViewModeC(m)} style={{padding:"3px 9px",borderRadius:6,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,
                background:viewModeC===m?"#e0e7ff":"transparent",color:viewModeC===m?"#1d4ed8":"#9ca3af",fontWeight:viewModeC===m?700:400}}>{ic}</button>
            ))}
          </div>
        </div>
        {viewModeC==="cards"&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14,padding:16}}>
            {filtrados.map(c=>(
              <div key={c.id} style={{background:"#f8fafc",borderRadius:12,padding:"16px",border:"1.5px solid #e5e7eb",cursor:"pointer",transition:"box-shadow .2s"}}
                onClick={()=>setShowDetalle(c)}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <div style={{width:42,height:42,borderRadius:"50%",background:c.sexo==="F"?"#fce7f3":"#dbeafe",
                    color:c.sexo==="F"?"#9d174d":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15}}>
                    {(c.nombre[0]||"")+((c.apellidoPaterno||"")[0]||"")}
                  </div>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{nombreCompleto(c)}</div>
                    <div style={{fontSize:11,color:"#9ca3af"}}>{c.email||c.telefono||"Sin contacto"}</div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:11,color:"#6b7280",fontFamily:"monospace"}}>{c.rfc||"Sin RFC"}</div>
                  <span style={{background:"#dbeafe",color:"#1d4ed8",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>
                    {c.polizas||0} póliza{c.polizas!==1?"s":""}
                  </span>
                </div>
                {c.ciudad&&<div style={{fontSize:11,color:"#9ca3af",marginTop:6}}>📍 {c.ciudad}, {c.estado}</div>}
              </div>
            ))}
            {filtrados.length===0&&<div style={{gridColumn:"1/-1",padding:32,textAlign:"center",color:"#9ca3af"}}>No se encontraron clientes</div>}
          </div>
        )}
        {viewModeC==="table"&&<table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:"#f9fafb"}}>
            {["Cliente","RFC","Contacto / WhatsApp","Dirección","Nacimiento","Pólizas",""].map(h=>(
              <th key={h} style={{padding:"11px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",letterSpacing:"0.04em"}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtrados.map((c,i)=>(
              <tr key={c.id} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                <td style={{padding:"13px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:c.sexo==="F"?"#fce7f3":"#dbeafe",color:c.sexo==="F"?"#9d174d":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>
                      {(c.nombre[0]||"")+((c.apellidoPaterno||"")[0]||"")}
                    </div>
                    <div>
                      <div style={{fontWeight:700,fontSize:13,color:"#111827"}}>{nombreCompleto(c)}</div>
                      <div style={{fontSize:11,color:"#9ca3af"}}>{c.sexo==="F"?"♀ Femenino":c.sexo==="M"?"♂ Masculino":""}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding:"13px 14px",fontSize:12,color:"#6b7280",fontFamily:"monospace"}}>{c.rfc||"—"}</td>
                <td style={{padding:"13px 14px"}}>
                  <div style={{fontSize:12,color:"#374151"}}>{c.email||"—"}</div>
                  <div style={{fontSize:12,color:"#374151"}}>📞 {c.telefono||"—"}</div>
                  {c.whatsapp&&<div style={{fontSize:12,color:"#15803d"}}>💬 {c.whatsapp}</div>}
                </td>
                <td style={{padding:"13px 14px",fontSize:12,color:"#374151",maxWidth:160}}>
                  {c.calle?<div>{c.calle} {c.numero}, {c.colonia}</div>:<div style={{color:"#9ca3af"}}>—</div>}
                  {c.ciudad&&<div style={{color:"#6b7280"}}>{c.cp} {c.ciudad}, {c.estado}</div>}
                </td>
                <td style={{padding:"13px 14px",fontSize:12,color:"#374151"}}>{c.fechaNacimiento||"—"}</td>
                <td style={{padding:"13px 14px"}}>
                  <span style={{background:"#dbeafe",color:"#1d4ed8",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:700}}>{c.polizas}</span>
                </td>
                <td style={{padding:"13px 14px"}}>
                  <button onClick={()=>setShowDetalle(c)} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"#374151",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
                    <Icon name="eye" size={13}/> Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>

      {/* Modal nuevo cliente */}
      {showModal&&(
        <Modal title="Nuevo Cliente" onClose={()=>{setShowModal(false);setErrores({});setForm(FORM_CLIENTE_INIT);}} wide>
          <div style={{display:"flex",flexDirection:"column",gap:18}}>

            {/* Datos personales */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:12}}>DATOS PERSONALES</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div>
                  <Inp label="Nombre(s) *" value={form.nombre} onChange={e=>{
                    const v=e.target.value;
                    const rfc=generarRFC(v,form.apellidoPaterno,form.apellidoMaterno,form.fechaNacimiento);
                    setForm(p=>({...p,nombre:v,rfc}));
                  }} placeholder="María"/>
                  <ErrMsg k="nombre"/>
                </div>
                <div>
                  <Inp label="Apellido Paterno *" value={form.apellidoPaterno} onChange={e=>{
                    const v=e.target.value;
                    const rfc=generarRFC(form.nombre,v,form.apellidoMaterno,form.fechaNacimiento);
                    setForm(p=>({...p,apellidoPaterno:v,rfc}));
                  }} placeholder="González"/>
                  <ErrMsg k="apellidoPaterno"/>
                </div>
                <Inp label="Apellido Materno" value={form.apellidoMaterno} onChange={e=>{
                  const v=e.target.value;
                  const rfc=generarRFC(form.nombre,form.apellidoPaterno,v,form.fechaNacimiento);
                  setForm(p=>({...p,apellidoMaterno:v,rfc}));
                }} placeholder="Ruiz"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginTop:12}}>
                <div>
                  <Inp label="Fecha de Nacimiento" value={form.fechaNacimiento}
                    onChange={e=>{
                      const fmt = formatearFechaInput(e.target.value);
                      const rfcAuto = generarRFC(form.nombre, form.apellidoPaterno, form.apellidoMaterno, fmt);
                      setForm(p=>({...p, fechaNacimiento:fmt, rfc:rfcAuto}));
                    }}
                    placeholder="DD/MM/AAAA" maxLength={10}/>
                  <ErrMsg k="fechaNacimiento"/>
                </div>
                <Sel label="Sexo" value={form.sexo} onChange={e=>f("sexo")(e.target.value)}>
                  <option value="">Seleccionar</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </Sel>
                <div>
                  <Inp label="RFC (auto-generado)" value={form.rfc}
                    onChange={e=>f("rfc")(e.target.value.toUpperCase())}
                    placeholder="Se genera automáticamente"/>
                  <div style={{fontSize:10,color:"#059669",marginTop:3}}>✓ Generado por nombre + fecha</div>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:12}}>DATOS DE CONTACTO</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                <div><Inp label="Email" type="email" value={form.email} onChange={e=>f("email")(e.target.value)} placeholder="correo@email.com"/><ErrMsg k="email"/></div>
                <Inp label="Teléfono" value={form.telefono} onChange={e=>f("telefono")(e.target.value)} placeholder="55 1234 5678"/>
                <Inp label="WhatsApp" value={form.whatsapp} onChange={e=>f("whatsapp")(e.target.value)} placeholder="55 1234 5678"/>
              </div>
            </div>

            {/* Dirección */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"16px 18px"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:12}}>DIRECCIÓN</div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
                <Inp label="Calle" value={form.calle} onChange={e=>f("calle")(e.target.value)} placeholder="Insurgentes Sur"/>
                <Inp label="Número" value={form.numero} onChange={e=>f("numero")(e.target.value)} placeholder="1234"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 2fr",gap:12}}>
                <Inp label="Colonia" value={form.colonia} onChange={e=>f("colonia")(e.target.value)} placeholder="Del Valle"/>
                <Inp label="C.P." value={form.cp} onChange={e=>f("cp")(e.target.value)} placeholder="03100"/>
                <Inp label="Ciudad / Municipio" value={form.ciudad} onChange={e=>f("ciudad")(e.target.value)} placeholder="Benito Juárez"/>
                <Sel label="Estado" value={form.estado} onChange={e=>f("estado")(e.target.value)}>
                  <option value="">Seleccionar estado</option>
                  {ESTADOS_MX.map(es=><option key={es}>{es}</option>)}
                </Sel>
              </div>
            </div>

            <Btn onClick={guardar} style={{width:"100%",justifyContent:"center"}}>Guardar Cliente</Btn>
          </div>
        </Modal>
      )}

      {/* Detalle cliente */}
      {showDetalle&&<DetalleClienteModal
        cliente={showDetalle}
        polizas={polizas}
        onClose={()=>setShowDetalle(null)}
        onGuardar={(clienteEditado)=>{
          setClientes(prev=>prev.map(c=>c.id===clienteEditado.id?clienteEditado:c));
          setShowDetalle(clienteEditado);
        }}
        onRegistrarPago={registrarPagoDesdeCliente}
      />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PÓLIZAS — ramo + subramo dinámico
// ═══════════════════════════════════════════════════════════════════
// ── Coberturas Autos predefinidas ─────────────────────────────────
const COBERTURAS_AUTOS = [
  {key:"danosMateriales", label:"Daños Materiales", deducible:"5%"},
  {key:"espejos", label:"Espejos Laterales", deducible:"30%"},
  {key:"roboTotal", label:"Robo Total", deducible:"10%"},
  {key:"rcBienes", label:"RC a Terceros en sus Bienes", deducible:"0 UMA"},
  {key:"rcPersonas", label:"RC a Terceros en sus Personas", deducible:"0 UMA"},
  {key:"extensionRc", label:"Extensión de RC", deducible:"N/A"},
  {key:"gastosMedicos", label:"Gastos Médicos Ocupantes", deducible:"N/A"},
  {key:"accidentesConductor", label:"Accidentes al Conductor", deducible:"N/A"},
  {key:"asistencia", label:"Asistencia Vial", deducible:"N/A"},
  {key:"defensaJuridica", label:"Defensa Jurídica", deducible:"N/A"},
  {key:"rcCatastrofica", label:"RC Catastrófica Muerte Accidental", deducible:"N/A"},
  {key:"cobIntExtranjero", label:"Cobertura Integral en el Extranjero", deducible:"N/A"},
];

// ── Catálogos GMM ─────────────────────────────────────────────────
const PLANES_GMM = {
  "Tradicional": ["Básico","Plus","Platino","Élite"],
  "PMM (Plan Médico Mayor)": ["Esencial","Alta Protección","Máxima Protección","Óptima"],
  "Accidentes Personales": ["Básico","Amplio"],
  "Seguviaje": ["Nacional","Internacional"],
};

const PARENTESCOS_GMM = ["Titular","Cónyuge","Hijo(a)","Padre","Madre","Contratante","Dependiente"];

const ZONAS_GMM = ["1","2","3","4","5","Nacional"];
const HOSPITALES_GMM = ["A","B","C","BC","BC+","Óptima","Premium"];

const COBERTURAS_GMM_BASE = [
  { key:"coberturBasica",    label:"Cobertura Básica",               tipo:"deducible" },
  { key:"emergExtranjer",    label:"Emergencia en el Extranjero",    tipo:"usd" },
  { key:"muerteAccidental",  label:"Muerte Accidental",              tipo:"suma" },
  { key:"perdidasOrganicas", label:"Pérdidas Orgánicas",             tipo:"suma" },
  { key:"gastosSepel",       label:"Gastos de Sepelio",              tipo:"suma" },
  { key:"elimDedAccidente",  label:"Elim. de Ded. por Accidente",    tipo:"amparada" },
  { key:"centralMedica",     label:"Central Médica",                  tipo:"amparada" },
  { key:"asistenciaViaje",   label:"Asistencia en Viaje",            tipo:"amparada" },
  { key:"dental",            label:"Dental",                          tipo:"plan" },
  { key:"vision",            label:"Visión",                          tipo:"plan" },
];

const COBERTURAS_PMM_BASE = [
  { key:"elemental",         label:"Elemental",                       tipo:"deducible" },
  { key:"gastosHosp",        label:"Gastos Hospitalarios",            tipo:"amparada" },
  { key:"honorariosMed",     label:"Honorarios Médicos",              tipo:"amparada" },
  { key:"auxiliaresDiag",    label:"Auxiliares de Diagnóstico",       tipo:"amparada" },
  { key:"medicamentos",      label:"Medicamentos",                    tipo:"amparada" },
  { key:"ambulancia",        label:"Ambulancia",                      tipo:"amparada" },
  { key:"redHospitalaria",   label:"Red Hospitalaria",                tipo:"plan" },
  { key:"complicacionesNC",  label:"Complicaciones de gastos no cubiertos", tipo:"suma" },
  { key:"preexistDeclared",  label:"Recaídas preexistentes declarados", tipo:"amparada" },
  { key:"preexistNoDeclared",label:"Recaídas preexistentes no declarados", tipo:"suma" },
  { key:"emergExtranjer",    label:"Emergencia en el Extranjero",     tipo:"usd" },
  { key:"reducDedAccidente", label:"Reducción de deducible por accidente", tipo:"suma" },
  { key:"asistTelefonica",   label:"Asistencia Telefónica",           tipo:"amparada" },
  { key:"asistViaje",        label:"Asistencia en Viaje",             tipo:"amparada" },
  { key:"rehabilitaciones",  label:"Rehabilitaciones",                tipo:"amparada" },
  { key:"tratDentales",      label:"Tratamientos Dentales",           tipo:"amparada" },
  { key:"procVanguardia",    label:"Procedimientos de Vanguardia",    tipo:"amparada" },
];

const ASEGURADO_GMM_INIT = {
  id: null, nombre:"", sexo:"", fechaNacimiento:"", parentesco:"Titular",
  edad:"", antiguedad:"", antiguedadReconocida:"",
  beneficiario:"", pctBeneficiario:"100",
};

const FORM_POLIZA_INIT = {
  // Paso 1 — Cliente
  clienteId:"", cliente:"", emailCliente:"", telefonoCliente:"",
  // Paso 2 — Datos generales
  numero:"", endoso:"0", aseguradora:"", fechaEmision:"",
  ramo:"", subramo:"", agentePoliza:"",
  // Paso 3 — Vigencia
  inicio:"", vencimiento:"", status:"activa",
  // Paso 4 — Datos económicos
  formaPago:"Anual", moneda:"MXN", primaNeta:"", gastosExpedicion:"", porcentajeRecargo:0, recargoPago:"", iva:"", primaTotal:"",
  porcentajeIva:16, montoIva:"",
  // Paso 5 — Vehículo (solo Autos Individual)
  vehiculoDescripcion:"", vehiculoMarca:"", vehiculoSerie:"", vehiculoAnio:"", vehiculoUso:"Particular", vehiculoClase:"Automóvil",
  // Paso 5b — Coberturas Autos detalladas
  coberturasAutos:{},
  // Paso 5c — Coberturas otros ramos
  coberturas:[],
  // Flotilla — lista de incisos
  incisos:[],
  // GMM — campos específicos
  planGMM:"", sumaAsegurada:"", deducibleGMM:"", coaseguroGMM:"10", topeCoaseguroGMM:"",
  zonaGMM:"", hospitalGMM:"", tabuladorGMM:"", aseguradosGMM:[],
  coberturasGMM:{},
  // Paso 6 — Datos adicionales
  beneficiarioPreferente:"", notas:"",
  // Documento adjunto
  documentoPoliza:null, documentoNombre:"", documentoTipo:"",
  // Subagente
  subagenteId:"", subagente:"", comisionSubagente:"",
};

const INCISO_INIT = {
  numero:1, descripcion:"", marca:"", serie:"", anio:"", uso:"Particular", clase:"Automóvil",
  primaNeta:"", gastosExpedicion:"600", primaConIva:"",
  coberturasAutos:{},
};

function ModalPoliza({ clientes, subagentes, onGuardar, onClose }) {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(FORM_POLIZA_INIT);
  const [busqCliente, setBusqCliente] = useState("");
  const docRef = useRef();

  const sf = (k, v) => setForm(p => ({...p, [k]: v}));
  const ramosDisponibles = Object.keys(RAMOS_SUBRAMOS);
  const subramosDisponibles = form.ramo ? RAMOS_SUBRAMOS[form.ramo] || [] : [];
  const esAutos = form.ramo === "Autos";
  const esFlotilla = form.subramo === "Flotilla";
  const esIndividual = esAutos && !esFlotilla;
  const esGMM = form.ramo === "Gastos Médicos";
  const esPMM = form.subramo === "PMM (Plan Médico Mayor)";
  const cobertBaseGMM = esPMM ? COBERTURAS_PMM_BASE : COBERTURAS_GMM_BASE;

  // Pasos:
  // Autos Individual (6): Cliente → Póliza → Vigencia → Importes → Vehículo → Coberturas
  // Autos Flotilla  (5): Cliente → Póliza → Vigencia → Importes → Incisos
  // GMM Trad/PMM   (6): Cliente → Póliza → Vigencia → Importes → Asegurados → Coberturas
  // Otros          (5): Cliente → Póliza → Vigencia → Importes → Coberturas
  const totalPasos = (esIndividual || esGMM) ? 6 : 5;
  const pasosLabels = esIndividual
    ? ["Cliente","Póliza","Vigencia","Importes","Vehículo","Coberturas"]
    : esFlotilla
      ? ["Cliente","Póliza","Vigencia","Importes","Incisos"]
      : esGMM
        ? ["Cliente","Póliza","Vigencia","Importes","Asegurados","Coberturas"]
        : ["Cliente","Póliza","Vigencia","Importes","Coberturas"];

  // Filtra clientes por búsqueda
  const clientesFiltrados = clientes.filter(c => {
    const nc = nombreCompleto(c).toLowerCase();
    return busqCliente === "" || nc.includes(busqCliente.toLowerCase()) || (c.rfc||"").toLowerCase().includes(busqCliente.toLowerCase());
  });

  const selCliente = (c) => {
    setForm(p => ({...p, clienteId:c.id, cliente:nombreCompleto(c), emailCliente:c.email||"", telefonoCliente:c.telefono||""}));
    setBusqCliente(nombreCompleto(c));
  };

  const calcPrimaTotal = (f) => {
    const neta    = parseFloat(f.primaNeta)||0;
    const gasto   = parseFloat(f.gastosExpedicion)||0;
    const recargo = parseFloat(f.recargoPago)||0;
    const pctIva  = (parseFloat(f.porcentajeIva)||16)/100;
    const ivaBase = (neta + gasto + recargo) * pctIva;
    return (neta + gasto + recargo + ivaBase).toFixed(2);
  };

  // Calcula el desglose de recibos según forma de pago
  // Regla: en pago fraccionado el 1er recibo lleva gastos de expedición completos
  // Recibos subsecuentes: solo fracción prima neta + fracción recargo + IVA de esa fracción
  const calcRecibos = (f) => {
    const neta    = parseFloat(f.primaNeta)||0;
    const gasto   = parseFloat(f.gastosExpedicion)||0;
    const recargo = parseFloat(f.recargoPago)||0;
    const pctIva  = (parseFloat(f.porcentajeIva)||16)/100;
    const fp      = f.formaPago||"Anual";

    const numMap  = {Anual:1, Semestral:2, Trimestral:4, Mensual:12, Contado:1, "Único":1};
    const n       = numMap[fp]||1;
    const esFrac  = n > 1;

    if (!esFrac) {
      // Pago único / anual / contado — un solo recibo con todo
      const total = parseFloat(calcPrimaTotal(f));
      return [{ num:1, label:"Único", primaNeta:neta, gastos:gasto, recargo, iva:+(total - neta - gasto - recargo).toFixed(2), total:+total }];
    }

    // Fraccionado
    const netaFrac    = +(neta   / n).toFixed(2);
    const recargoFrac = +(recargo/ n).toFixed(2);
    const recibos = [];

    for (let i=1; i<=n; i++) {
      const gastoEste = i===1 ? gasto : 0;            // Gastos solo en el 1er recibo
      const base      = netaFrac + gastoEste + recargoFrac;
      const ivaEste   = +(base * pctIva).toFixed(2);
      const totalEste = +(base + ivaEste).toFixed(2);
      recibos.push({
        num:i,
        label:i===1?"1er recibo":`Recibo ${i}`,
        primaNeta:netaFrac,
        gastos:gastoEste,
        recargo:recargoFrac,
        iva:ivaEste,
        total:totalEste,
      });
    }
    return recibos;
  };

  const guardar = () => {
    let coberturasFinales = [];
    if (esFlotilla) {
      coberturasFinales = ["Flotilla — ver incisos"];
    } else if (esIndividual) {
      coberturasFinales = Object.entries(form.coberturasAutos).filter(([,v])=>v.amparada).map(([k])=> COBERTURAS_AUTOS.find(c=>c.key===k)?.label||k);
    } else if (esGMM) {
      coberturasFinales = Object.entries(form.coberturasGMM||{}).filter(([,v])=>v.amparada||v.suma||v.limite).map(([k])=> cobertBaseGMM.find(c=>c.key===k)?.label||k);
    } else {
      coberturasFinales = form.coberturas;
    }
    onGuardar({
      ...form,
      id: Date.now(),
      primaNeta: parseFloat(form.primaNeta)||0,
      primaTotal: parseFloat(form.primaTotal)||parseFloat(calcPrimaTotal(form)),
      coberturas: coberturasFinales,
    });
    onClose();
  };

  // Helpers asegurados GMM
  const addAseguradoGMM = () => {
    setForm(p=>({...p, aseguradosGMM:[...(p.aseguradosGMM||[]), {...ASEGURADO_GMM_INIT, id:Date.now()}]}));
  };
  const updAseguradoGMM = (idx, k, v) => {
    setForm(p=>{
      const arr = [...(p.aseguradosGMM||[])];
      arr[idx] = {...arr[idx], [k]:v};
      // Auto-edad si hay fecha
      if (k==="fechaNacimiento" && v.length===10) {
        const parts = v.split("/");
        if (parts.length===3) {
          const anio = parseInt(parts[2]||0);
          const edad = new Date().getFullYear() - anio;
          arr[idx].edad = edad > 0 ? String(edad) : "";
        }
      }
      return {...p, aseguradosGMM:arr};
    });
  };
  const delAseguradoGMM = (idx) => {
    setForm(p=>({...p, aseguradosGMM:(p.aseguradosGMM||[]).filter((_,i)=>i!==idx)}));
  };
  const updCobGMM = (key, campo, valor) => {
    setForm(p=>({...p, coberturasGMM:{...p.coberturasGMM, [key]:{...(p.coberturasGMM||{})[key], [campo]:valor, amparada:true}}}));
  };

  const canNext = () => {
    if (paso===1) return !!form.clienteId;
    if (paso===2) return !!form.numero && !!form.ramo;
    return true;
  };

  // Helpers para manejar incisos de flotilla
  const addInciso = () => {
    const n = (form.incisos||[]).length + 1;
    setForm(p=>({...p, incisos:[...(p.incisos||[]), {...INCISO_INIT, numero:n, id:Date.now()}]}));
  };
  const updInciso = (idx, k, v) => {
    setForm(p=>{
      const incs = [...(p.incisos||[])];
      incs[idx] = {...incs[idx], [k]:v};
      return {...p, incisos:incs};
    });
  };
  const delInciso = (idx) => {
    setForm(p=>({...p, incisos:(p.incisos||[]).filter((_,i)=>i!==idx).map((inc,i)=>({...inc, numero:i+1}))}));
  };

  const SecBox = ({title, color="#6b7280", children}) => (
    <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",border:`1px solid ${color}22`}}>
      <div style={{fontSize:10,fontWeight:800,color,letterSpacing:"0.08em",marginBottom:12}}>{title}</div>
      {children}
    </div>
  );

  return (
    <Modal title="Nueva Póliza" onClose={onClose} wide maxW={760}>
      {/* Stepper */}
      <div style={{display:"flex",alignItems:"center",marginBottom:22,gap:0}}>
        {pasosLabels.map((l,i)=>{
          const n=i+1; const activo=n===paso; const hecho=n<paso;
          return (
            <div key={l} style={{display:"flex",alignItems:"center",flex:1}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:hecho?"#059669":activo?"#2563eb":"#e5e7eb",color:hecho||activo?"#fff":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,cursor:hecho?"pointer":"default"}}
                  onClick={()=>hecho&&setPaso(n)}>
                  {hecho?"✓":n}
                </div>
                <div style={{fontSize:9,fontWeight:600,color:activo?"#2563eb":hecho?"#059669":"#9ca3af",letterSpacing:"0.04em",textAlign:"center"}}>{l.toUpperCase()}</div>
              </div>
              {i<pasosLabels.length-1&&<div style={{height:2,flex:1,background:hecho?"#059669":"#e5e7eb",marginTop:-12}}/>}
            </div>
          );
        })}
      </div>

      {/* ── PASO 1: CLIENTE ── */}
      {paso===1&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Opción lectura IA */}
          <div style={{background:"linear-gradient(135deg,#1e40af,#7c3aed)",borderRadius:12,padding:"13px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div>
              <div style={{color:"#fff",fontWeight:800,fontSize:13}}>⚡ ¿Tienes el documento PDF?</div>
              <div style={{color:"#bfdbfe",fontSize:11,marginTop:2}}>La IA lee la póliza y llena todos los datos automáticamente</div>
            </div>
            <button onClick={()=>{onClose();setTimeout(()=>document.dispatchEvent(new CustomEvent("openScan")),100);}}
              style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:9,padding:"8px 16px",
                color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>
              📄 Leer con IA
            </button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,height:1,background:"#e5e7eb"}}/>
            <span style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>O CAPTURA MANUALMENTE</span>
            <div style={{flex:1,height:1,background:"#e5e7eb"}}/>
          </div>
          <SecBox title="CLIENTE ASEGURADO" color="#1e40af">
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af",marginBottom:12}}>
              ℹ️ El cliente debe estar previamente registrado en el módulo de <strong>Clientes</strong>
            </div>
            <div style={{position:"relative",marginBottom:10}}>
              <div style={{position:"absolute",left:11,top:10,color:"#9ca3af"}}><Icon name="search" size={15}/></div>
              <input value={busqCliente} onChange={e=>{setBusqCliente(e.target.value); if(!e.target.value) setForm(p=>({...p,clienteId:"",cliente:""}));}}
                placeholder="Escribe nombre o RFC del cliente..."
                autoComplete="off"
                style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 13px 9px 34px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
            </div>
            {busqCliente && !form.clienteId && (
              <div style={{border:"1px solid #e5e7eb",borderRadius:9,overflow:"hidden",maxHeight:180,overflowY:"auto"}}>
                {clientesFiltrados.length===0
                  ? <div style={{padding:"12px 14px",fontSize:13,color:"#9ca3af",textAlign:"center"}}>Sin resultados. Verifica o registra el cliente primero.</div>
                  : clientesFiltrados.map(c=>(
                    <div key={c.id} onClick={()=>selCliente(c)}
                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f3f4f6",background:"#fff"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:c.sexo==="F"?"#fce7f3":"#dbeafe",color:c.sexo==="F"?"#9d174d":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11,flexShrink:0}}>
                        {(c.nombre[0]||"")+((c.apellidoPaterno||"")[0]||"")}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:13}}>{nombreCompleto(c)}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{c.rfc||"Sin RFC"} · {c.telefono||"Sin tel."}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
            {form.clienteId&&(
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:9,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#059669",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0}}>✓</div>
                <div>
                  <div style={{fontWeight:700,fontSize:14,color:"#065f46"}}>{form.cliente}</div>
                  <div style={{fontSize:12,color:"#059669"}}>{form.emailCliente} · 📞 {form.telefonoCliente}</div>
                </div>
                <button onClick={()=>{setForm(p=>({...p,clienteId:"",cliente:""}));setBusqCliente("");}}
                  style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#6b7280"}}><Icon name="x" size={16}/></button>
              </div>
            )}
          </SecBox>
          <SecBox title="SUBAGENTE (OPCIONAL)" color="#7c3aed">
            <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>
              Si esta póliza fue vendida por un subagente, selecciónalo para registrar su comisión.
            </div>
            {!form.subagenteId ? (
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center"}}>
                <select value={form.subagenteId} onChange={e=>{
                  const sa=subagentes.find(s=>s.id===Number(e.target.value));
                  if(sa) sf("subagenteId",sa.id),sf("subagente",`${sa.nombre} ${sa.apellidoPaterno} ${sa.apellidoMaterno||""}`.trim());
                  else sf("subagenteId",""),sf("subagente","");
                }} style={{border:"1.5px solid #e9d5ff",borderRadius:9,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",background:"#fff",color:"#374151"}}>
                  <option value="">— Ninguno / Venta directa —</option>
                  {subagentes.filter(s=>s.activo).map(s=>(
                    <option key={s.id} value={s.id}>{s.nombre} {s.apellidoPaterno} {s.apellidoMaterno||""}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:9,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:34,height:34,borderRadius:"50%",background:"#7c3aed",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0}}>
                  {form.subagente.split(" ").slice(0,2).map(w=>w[0]).join("")}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#5b21b6"}}>{form.subagente}</div>
                  <div style={{fontSize:11,color:"#7c3aed"}}>Subagente asignado a esta póliza</div>
                </div>
                <button onClick={()=>{sf("subagenteId","");sf("subagente","");sf("comisionSubagente","");}}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:16}}>✕</button>
              </div>
            )}
            {form.subagenteId&&(
              <div style={{marginTop:10}}>
                <Inp label="% Comisión subagente" value={form.comisionSubagente} onChange={e=>sf("comisionSubagente",e.target.value)} placeholder="Ej: 15"/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>El % se usa para calcular la comisión sobre la prima total.</div>
              </div>
            )}
          </SecBox>
        </div>
      )}

      {/* ── PASO 2: DATOS DE PÓLIZA ── */}
      {paso===2&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="DATOS GENERALES DE LA PÓLIZA" color="#2563eb">
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:12,marginBottom:12}}>
              <Inp label="Número de Póliza *" value={form.numero} onChange={e=>sf("numero",e.target.value)} placeholder="4102600041030"/>
              <Inp label="Endoso" value={form.endoso} onChange={e=>sf("endoso",e.target.value)} placeholder="0"/>
              <Inp label="Fecha de Emisión" type="date" value={form.fechaEmision} onChange={e=>sf("fechaEmision",e.target.value)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Aseguradora *" value={form.aseguradora} onChange={e=>sf("aseguradora",e.target.value)}>
                <option value="">Seleccionar</option>
                {ASEGURADORAS.map(a=><option key={a}>{a}</option>)}
              </Sel>
              <Sel label="Estado de la Póliza" value={form.status} onChange={e=>sf("status",e.target.value)}>
                <option value="activa">Activa</option>
                <option value="por vencer">Por vencer</option>
                <option value="vencida">Vencida</option>
              </Sel>
            </div>
            <div style={{marginTop:12}}>
              <Inp label="Agente / Clave de Agente" value={form.agentePoliza} onChange={e=>sf("agentePoliza",e.target.value)} placeholder="Nombre o clave del agente"/>
            </div>
          </SecBox>

          <SecBox title="RAMO Y SUBRAMO *" color="#7c3aed">
            {!form.ramo&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10,marginBottom:4}}>
                {ramosDisponibles.map(r=>(
                  <button key={r} onClick={()=>sf("ramo",r)}
                    style={{background:ramoColor(r)+"15",color:ramoColor(r),border:`2px solid ${ramoColor(r)}`,borderRadius:12,padding:"14px 10px",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                    <span style={{fontSize:24}}>{r==="Autos"?"🚗":r==="Vida"?"❤️":r==="Gastos Médicos"?"🏥":"🏠"}</span>
                    {r}
                  </button>
                ))}
              </div>
            )}
            {form.ramo&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                  <div style={{background:ramoColor(form.ramo)+"15",color:ramoColor(form.ramo),border:`2px solid ${ramoColor(form.ramo)}`,borderRadius:10,padding:"7px 16px",fontWeight:800,fontSize:13}}>
                    {form.ramo==="Autos"?"🚗":form.ramo==="Vida"?"❤️":form.ramo==="Gastos Médicos"?"🏥":"🏠"} {form.ramo}
                  </div>
                  <button onClick={()=>setForm(p=>({...p,ramo:"",subramo:""}))} style={{background:"none",border:"1px solid #e5e7eb",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12,color:"#6b7280",fontFamily:"inherit"}}>Cambiar</button>
                </div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {subramosDisponibles.map(s=>(
                    <button key={s} onClick={()=>sf("subramo",s)}
                      style={{background:form.subramo===s?ramoColor(form.ramo):`${ramoColor(form.ramo)}18`,color:form.subramo===s?"#fff":ramoColor(form.ramo),border:`1.5px solid ${ramoColor(form.ramo)}`,borderRadius:8,padding:"7px 14px",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </SecBox>
        </div>
      )}

      {/* ── PASO 3: VIGENCIA ── */}
      {paso===3&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="VIGENCIA DE LA PÓLIZA" color="#059669">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Inicio de vigencia *</label>
                <Inp type="date" value={form.inicio} onChange={e=>{
                  const inicio = e.target.value;
                  sf("inicio", inicio);
                  // Auto-calcular vencimiento = mismo día del año siguiente
                  if (inicio) {
                    const f = new Date(inicio+"T12:00:00");
                    f.setFullYear(f.getFullYear()+1);
                    sf("vencimiento", f.toISOString().slice(0,10));
                  }
                }}/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Desde las 12:00 hrs. del día indicado</div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fin de vigencia *</label>
                <Inp type="date" value={form.vencimiento} onChange={e=>sf("vencimiento",e.target.value)}/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Se calcula automático — puedes editarlo</div>
              </div>
            </div>
            {form.inicio&&form.vencimiento&&(
              <div style={{marginTop:14,background:"#f0fdf4",borderRadius:9,padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
                <div style={{fontSize:20}}>📅</div>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:"#065f46"}}>Vigencia calculada</div>
                  <div style={{fontSize:12,color:"#059669"}}>
                    {Math.round((new Date(form.vencimiento)-new Date(form.inicio))/(1000*60*60*24))} días · {form.inicio} → {form.vencimiento}
                  </div>
                </div>
              </div>
            )}
          </SecBox>
        </div>
      )}

      {/* ── PASO 4: IMPORTES ── */}
      {paso===4&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="CONCEPTOS ECONÓMICOS" color="#d97706">

            {/* Forma de pago + fecha emisión */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <Sel label="Forma de Pago" value={form.formaPago} onChange={e=>{
                const fp=e.target.value;
                setForm(p=>{
                  const np={...p,formaPago:fp};
                  const pctIva=(parseFloat(np.porcentajeIva)||16)/100;
                  const mIva=(((parseFloat(np.primaNeta)||0)+(parseFloat(np.gastosExpedicion)||0)+(parseFloat(np.recargoPago)||0))*pctIva).toFixed(2);
                  return {...np,montoIva:mIva,primaTotal:calcPrimaTotal({...np})};
                });
              }}>
                {["Anual","Semestral","Trimestral","Mensual","Contado","Único"].map(f=><option key={f}>{f}</option>)}
              </Sel>
              <Inp label="Fecha de Emisión (si aplica)" type="date" value={form.fechaEmision} onChange={e=>sf("fechaEmision",e.target.value)}/>
            </div>

            {/* Campos numéricos — todos recalculan automáticamente */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Prima Neta ($)" type="number" value={form.primaNeta}
                onChange={e=>{setForm(p=>{
                  const np={...p,primaNeta:e.target.value};
                  const pctIva=(parseFloat(np.porcentajeIva)||16)/100;
                  const mIva=(((parseFloat(np.primaNeta)||0)+(parseFloat(np.gastosExpedicion)||0)+(parseFloat(np.recargoPago)||0))*pctIva).toFixed(2);
                  return{...np,montoIva:mIva,primaTotal:calcPrimaTotal(np)};
                });}} placeholder="8,304.48"/>
              <Inp label="Gastos de Expedición ($)" type="number" value={form.gastosExpedicion}
                onChange={e=>{setForm(p=>{
                  const np={...p,gastosExpedicion:e.target.value};
                  const pctIva=(parseFloat(np.porcentajeIva)||16)/100;
                  const mIva=(((parseFloat(np.primaNeta)||0)+(parseFloat(np.gastosExpedicion)||0)+(parseFloat(np.recargoPago)||0))*pctIva).toFixed(2);
                  return{...np,montoIva:mIva,primaTotal:calcPrimaTotal(np)};
                });}} placeholder="350.00"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <Inp label="% Recargo Fraccionado" type="number" value={form.porcentajeRecargo}
                  onChange={e=>setForm(p=>({...p,porcentajeRecargo:e.target.value}))}
                  placeholder="7.5"/>
                <Inp label="Recargo Pago Fracc. ($)" type="number" value={form.recargoPago}
                  onChange={e=>{setForm(p=>{
                    const np={...p,recargoPago:e.target.value};
                    const pctIva=(parseFloat(np.porcentajeIva)||16)/100;
                    const mIva=(((parseFloat(np.primaNeta)||0)+(parseFloat(np.gastosExpedicion)||0)+(parseFloat(np.recargoPago)||0))*pctIva).toFixed(2);
                    return{...np,montoIva:mIva,primaTotal:calcPrimaTotal(np)};
                  });}} placeholder="622.82"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <Inp label="% I.V.A." type="number" value={form.porcentajeIva}
                  onChange={e=>{setForm(p=>{
                    const np={...p,porcentajeIva:e.target.value};
                    const pctIva=(parseFloat(e.target.value)||16)/100;
                    const mIva=(((parseFloat(np.primaNeta)||0)+(parseFloat(np.gastosExpedicion)||0)+(parseFloat(np.recargoPago)||0))*pctIva).toFixed(2);
                    return{...np,montoIva:mIva,primaTotal:calcPrimaTotal(np)};
                  });}} placeholder="16"/>
                <Inp label="I.V.A. ($)" value={form.montoIva?`$${parseFloat(form.montoIva).toFixed(2)}`:""} readOnly style={{background:"#f3f4f6",color:"#6b7280"}}/>
              </div>
            </div>

            {/* Prima total */}
            <div style={{marginTop:14,background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:12,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{color:"#94a3b8",fontSize:12,fontWeight:600}}>PRIMA TOTAL A PAGAR</div>
                <div style={{color:"#60a5fa",fontSize:11,marginTop:2}}>{form.formaPago||"Anual"} · {calcRecibos(form).length} recibo{calcRecibos(form).length>1?"s":""}</div>
              </div>
              <div style={{color:"#fff",fontSize:26,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>
                ${parseFloat(calcPrimaTotal(form)).toLocaleString("es-MX",{minimumFractionDigits:2})}
              </div>
            </div>
          </SecBox>

          {/* ── TABLA DE RECIBOS ── */}
          <SecBox title="DESGLOSE DE RECIBOS" color="#7c3aed">
            <div style={{fontSize:11,color:"#6b7280",marginBottom:12,background:"#f5f3ff",borderRadius:8,padding:"8px 12px",border:"1px solid #ede9fe"}}>
              {calcRecibos(form).length===1
                ? "✅ Pago en un solo recibo — incluye todos los conceptos."
                : `📋 Pago fraccionado en ${calcRecibos(form).length} recibos. El primer recibo incluye los Gastos de Expedición completos.`}
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#f5f3ff"}}>
                    {["Recibo","Prima Neta","Gastos Exp.","Recargo","I.V.A.","Total a Pagar"].map(h=>(
                      <th key={h} style={{padding:"8px 10px",textAlign:h==="Recibo"?"center":"right",fontWeight:800,color:"#6d28d9",fontSize:10,borderBottom:"2px solid #ede9fe",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {calcRecibos(form).map((r,i)=>(
                    <tr key={i} style={{background:i===0?"#faf5ff":"#fff",borderBottom:"1px solid #f3f4f6"}}>
                      <td style={{padding:"9px 10px",textAlign:"center",fontWeight:700,color:"#7c3aed"}}>
                        <div style={{background:"#7c3aed",color:"#fff",borderRadius:20,padding:"2px 8px",fontSize:11,display:"inline-block"}}>{r.label}</div>
                      </td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"#374151"}}>${r.primaNeta.toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:r.gastos>0?"#059669":"#9ca3af",fontWeight:r.gastos>0?700:400}}>
                        {r.gastos>0?`$${r.gastos.toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"}
                      </td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:r.recargo>0?"#d97706":"#9ca3af"}}>
                        {r.recargo>0?`$${r.recargo.toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"}
                      </td>
                      <td style={{padding:"9px 10px",textAlign:"right",color:"#6b7280"}}>${r.iva.toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                      <td style={{padding:"9px 10px",textAlign:"right",fontWeight:800,color:"#111827",background:i===0?"#ede9fe":"transparent",borderRadius:i===0?6:0}}>
                        ${r.total.toLocaleString("es-MX",{minimumFractionDigits:2})}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{borderTop:"2px solid #7c3aed"}}>
                    <td style={{padding:"8px 10px",fontWeight:800,fontSize:11,color:"#6d28d9"}}>TOTAL</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:11}}>${(parseFloat(form.primaNeta)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:11}}>${(parseFloat(form.gastosExpedicion)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:11}}>${(parseFloat(form.recargoPago)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,fontSize:11}}>${(parseFloat(form.montoIva)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontWeight:900,fontSize:13,color:"#7c3aed"}}>${parseFloat(calcPrimaTotal(form)).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SecBox>
        </div>
      )}

      {/* ── PASO 5: VEHÍCULO (solo Autos Individual) ── */}
      {paso===5&&esIndividual&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="CARACTERÍSTICAS DEL VEHÍCULO ASEGURADO" color="#2563eb">
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
              <Inp label="Descripción / Modelo" value={form.vehiculoDescripcion} onChange={e=>sf("vehiculoDescripcion",e.target.value)} placeholder="MG5 EXCITE 1.5L TA"/>
              <Inp label="Año de Fabricación" value={form.vehiculoAnio} onChange={e=>sf("vehiculoAnio",e.target.value)} placeholder="2024"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <Inp label="Marca" value={form.vehiculoMarca} onChange={e=>sf("vehiculoMarca",e.target.value)} placeholder="MG"/>
              <Inp label="Número de Serie (VIN)" value={form.vehiculoSerie} onChange={e=>sf("vehiculoSerie",e.target.value)} placeholder="LSJA36E96RZ083169"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Uso" value={form.vehiculoUso} onChange={e=>sf("vehiculoUso",e.target.value)}>
                {["Particular","Comercial","Servicio","Carga"].map(u=><option key={u}>{u}</option>)}
              </Sel>
              <Sel label="Clase" value={form.vehiculoClase} onChange={e=>sf("vehiculoClase",e.target.value)}>
                {["Automóvil","Camioneta","Pickup","Motocicleta","Camión"].map(u=><option key={u}>{u}</option>)}
              </Sel>
            </div>
          </SecBox>
        </div>
      )}

      {/* ── PASO 5: INCISOS (Flotilla) ── */}
      {paso===5&&esFlotilla&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="RESUMEN DE RIESGOS — INCISOS DE FLOTILLA" color="#2563eb">
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af",marginBottom:14}}>
              🚗 Agrega cada vehículo de la flotilla como un inciso independiente con sus propios datos y prima.
            </div>
            {(form.incisos||[]).map((inc,idx)=>(
              <div key={inc.id||idx} style={{border:"1.5px solid #e5e7eb",borderRadius:11,padding:"14px 14px 10px",marginBottom:12,background:"#fafafa"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#1e40af"}}>🔹 Inciso {inc.numero}</div>
                  <button onClick={()=>delInciso(idx)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"4px 10px",fontSize:11,color:"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>✕ Eliminar</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:8}}>
                  <Inp label="Descripción / Modelo" value={inc.descripcion} onChange={e=>updInciso(idx,"descripcion",e.target.value)} placeholder="JETTA HIGHLINE 1.4L 150HP TIP"/>
                  <Inp label="Marca" value={inc.marca} onChange={e=>updInciso(idx,"marca",e.target.value)} placeholder="VOLKSWAGEN"/>
                  <Inp label="Año" value={inc.anio} onChange={e=>updInciso(idx,"anio",e.target.value)} placeholder="2019"/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",gap:10,marginBottom:8}}>
                  <Inp label="Número de Serie (VIN)" value={inc.serie} onChange={e=>updInciso(idx,"serie",e.target.value)} placeholder="3VWTP6BU7KM266575"/>
                  <Sel label="Uso" value={inc.uso} onChange={e=>updInciso(idx,"uso",e.target.value)}>
                    {["Particular","Comercial"].map(u=><option key={u}>{u}</option>)}
                  </Sel>
                  <Sel label="Clase" value={inc.clase} onChange={e=>updInciso(idx,"clase",e.target.value)}>
                    {["Automóvil","Camioneta","Pickup"].map(u=><option key={u}>{u}</option>)}
                  </Sel>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  <Inp label="Prima Neta ($)" type="number" value={inc.primaNeta} onChange={e=>{
                    const pn=parseFloat(e.target.value)||0;
                    const ge=parseFloat(inc.gastosExpedicion)||0;
                    const total=((pn+ge)*1.16).toFixed(2);
                    updInciso(idx,"primaNeta",e.target.value);
                    updInciso(idx,"primaConIva",total);
                  }} placeholder="7,335.99"/>
                  <Inp label="Gastos Expedición ($)" type="number" value={inc.gastosExpedicion} onChange={e=>{
                    const ge=parseFloat(e.target.value)||0;
                    const pn=parseFloat(inc.primaNeta)||0;
                    const total=((pn+ge)*1.16).toFixed(2);
                    updInciso(idx,"gastosExpedicion",e.target.value);
                    updInciso(idx,"primaConIva",total);
                  }} placeholder="600.00"/>
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Prima c/IVA ($)</label>
                    <div style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,background:"#f0fdf4",color:"#065f46",fontWeight:700}}>
                      ${parseFloat(inc.primaConIva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addInciso} style={{width:"100%",border:"2px dashed #93c5fd",borderRadius:10,padding:"11px",background:"#eff6ff",color:"#2563eb",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Inciso
            </button>
            {(form.incisos||[]).length > 0 && (
              <div style={{marginTop:12,background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{color:"#94a3b8",fontSize:12}}>
                  <div style={{fontWeight:700}}>{form.incisos.length} Vehículos · Prima total flotilla</div>
                  <div style={{fontSize:10,marginTop:2}}>Suma de todas las primas con IVA</div>
                </div>
                <div style={{color:"#fff",fontSize:24,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>
                  ${(form.incisos.reduce((s,i)=>s+(parseFloat(i.primaConIva)||0),0)).toLocaleString("es-MX",{minimumFractionDigits:2})}
                </div>
              </div>
            )}
          </SecBox>
        </div>
      )}

      {/* ── PASO 5: ASEGURADOS (GMM) ── */}
      {paso===5&&esGMM&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <SecBox title="PLAN Y CONDICIONES GENERALES" color="#059669">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>
              <Sel label="Plan Contratado" value={form.planGMM} onChange={e=>sf("planGMM",e.target.value)}>
                <option value="">Seleccionar plan</option>
                {(PLANES_GMM[form.subramo]||[]).map(p=><option key={p}>{p}</option>)}
              </Sel>
              <Inp label="Suma Asegurada ($)" value={form.sumaAsegurada} onChange={e=>sf("sumaAsegurada",e.target.value)} placeholder={esPMM?"40,000,000":"Sin límite"}/>
              <Inp label="Deducible ($)" value={form.deducibleGMM} onChange={e=>sf("deducibleGMM",e.target.value)} placeholder={esPMM?"60,000":"30,000"}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
              <Inp label="Coaseguro (%)" value={form.coaseguroGMM} onChange={e=>sf("coaseguroGMM",e.target.value)} placeholder="10"/>
              <Inp label="Tope Coaseguro ($)" value={form.topeCoaseguroGMM} onChange={e=>sf("topeCoaseguroGMM",e.target.value)} placeholder={esPMM?"60,000":"40,000"}/>
              <Sel label="Zona" value={form.zonaGMM} onChange={e=>sf("zonaGMM",e.target.value)}>
                <option value="">Zona</option>
                {ZONAS_GMM.map(z=><option key={z}>{z}</option>)}
              </Sel>
              <Sel label="Red Hospitalaria" value={form.hospitalGMM} onChange={e=>sf("hospitalGMM",e.target.value)}>
                <option value="">Hospital</option>
                {HOSPITALES_GMM.map(h=><option key={h}>{h}</option>)}
              </Sel>
            </div>
            {esPMM&&(
              <div style={{marginTop:10}}>
                <Inp label="Tabulador" value={form.tabuladorGMM} onChange={e=>sf("tabuladorGMM",e.target.value)} placeholder="E"/>
              </div>
            )}
          </SecBox>

          <SecBox title="LISTA DE ASEGURADOS" color="#059669">
            <div style={{background:"#f0fdf4",borderRadius:9,padding:"9px 12px",fontSize:12,color:"#065f46",marginBottom:12}}>
              👨‍👩‍👧 Agrega a todos los asegurados de la póliza con su parentesco y fecha de nacimiento.
            </div>
            {(form.aseguradosGMM||[]).map((a,idx)=>(
              <div key={a.id||idx} style={{border:"1.5px solid #d1fae5",borderRadius:11,padding:"12px 13px 8px",marginBottom:10,background:"#f9fffe"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:a.sexo==="F"?"#fce7f3":"#dbeafe",color:a.sexo==="F"?"#9d174d":"#1d4ed8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12}}>
                      {idx+1}
                    </div>
                    <div style={{fontWeight:700,fontSize:12,color:"#065f46"}}>
                      {a.parentesco||"Asegurado"}{a.edad?` · ${a.edad} años`:""}
                    </div>
                  </div>
                  <button onClick={()=>delAseguradoGMM(idx)} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"3px 9px",fontSize:11,color:"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:9,marginBottom:8}}>
                  <Inp label="Nombre completo" value={a.nombre} onChange={e=>updAseguradoGMM(idx,"nombre",e.target.value)} placeholder="SERGIO RENATO CANTU LOZANO"/>
                  <Sel label="Parentesco" value={a.parentesco} onChange={e=>updAseguradoGMM(idx,"parentesco",e.target.value)}>
                    {PARENTESCOS_GMM.map(p=><option key={p}>{p}</option>)}
                  </Sel>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:9}}>
                  <div>
                    <Inp label="Fecha Nac." value={a.fechaNacimiento}
                      onChange={e=>updAseguradoGMM(idx,"fechaNacimiento",formatearFechaInput(e.target.value))}
                      placeholder="DD/MM/AAAA" maxLength={10}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    <label style={{fontSize:12,fontWeight:700,color:"#374151"}}>Edad</label>
                    <div style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,background:"#f3f4f6",color:"#374151",fontWeight:600,minHeight:38}}>
                      {a.edad||"—"}
                    </div>
                  </div>
                  <Sel label="Sexo" value={a.sexo} onChange={e=>updAseguradoGMM(idx,"sexo",e.target.value)}>
                    <option value="">Sexo</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </Sel>
                  <Inp label="Antigüedad MAPFRE" value={a.antiguedad}
                    onChange={e=>updAseguradoGMM(idx,"antiguedad",formatearFechaInput(e.target.value))}
                    placeholder="DD/MM/AAAA" maxLength={10}/>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:9,marginTop:8}}>
                  <Inp label="Beneficiario" value={a.beneficiario} onChange={e=>updAseguradoGMM(idx,"beneficiario",e.target.value)} placeholder="Nombre del beneficiario"/>
                  <Inp label="% Beneficio" value={a.pctBeneficiario} onChange={e=>updAseguradoGMM(idx,"pctBeneficiario",e.target.value)} placeholder="100"/>
                </div>
              </div>
            ))}
            <button onClick={addAseguradoGMM} style={{width:"100%",border:"2px dashed #6ee7b7",borderRadius:10,padding:"10px",background:"#f0fdf4",color:"#059669",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
              + Agregar Asegurado
            </button>
          </SecBox>
        </div>
      )}

      {/* ── PASO 5 (no autos / flotilla / GMM) / PASO 6 (autos individual o GMM): COBERTURAS ── */}
      {((paso===5&&!esAutos&&!esGMM)||((paso===6&&(esIndividual||esGMM))))&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {esIndividual ? (
            <SecBox title="COBERTURAS AMPARADAS — AUTOS" color="#2563eb">
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                <div style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 1fr",padding:"6px 10px",background:"#f3f4f6",borderRadius:"8px 8px 0 0",marginBottom:1}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#6b7280"}}>COBERTURA</div>
                  <div style={{fontSize:10,fontWeight:800,color:"#6b7280"}}>LÍMITE / SUMA</div>
                  <div style={{fontSize:10,fontWeight:800,color:"#6b7280"}}>AMPARADA</div>
                </div>
                {COBERTURAS_AUTOS.map((cob,i)=>{
                  const val = form.coberturasAutos[cob.key]||{};
                  const amparada = val.amparada||false;
                  return(
                    <div key={cob.key} style={{display:"grid",gridTemplateColumns:"2.5fr 1.5fr 1fr",padding:"9px 10px",background:i%2===0?"#fff":"#fafafa",borderBottom:"1px solid #f3f4f6",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{cob.label}</div>
                        <div style={{fontSize:10,color:"#9ca3af"}}>Deducible: {cob.deducible}</div>
                      </div>
                      <input value={val.limite||""} onChange={e=>setForm(p=>({...p,coberturasAutos:{...p.coberturasAutos,[cob.key]:{...val,limite:e.target.value,amparada:true}}}))}
                        placeholder={cob.key.startsWith("rc")?"$1,500,000":"Valor comercial"}
                        style={{border:"1.5px solid #e5e7eb",borderRadius:7,padding:"5px 8px",fontSize:12,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
                      <div style={{textAlign:"center"}}>
                        <button onClick={()=>setForm(p=>({...p,coberturasAutos:{...p.coberturasAutos,[cob.key]:{...val,amparada:!amparada}}}))}
                          style={{background:amparada?"#059669":"#e5e7eb",color:amparada?"#fff":"#9ca3af",border:"none",borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                          {amparada?"✓ Sí":"No"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{marginTop:12}}>
                <Inp label="Beneficiario Preferente (ej. agencia automotriz)" value={form.beneficiarioPreferente} onChange={e=>sf("beneficiarioPreferente",e.target.value)} placeholder="AUTOMOTRIZ LIMISA DE TORREON"/>
              </div>
            </SecBox>
          ): esGMM ? (
            <SecBox title={`COBERTURAS AMPARADAS — ${esPMM?"PROTECCIÓN MÉDICA A TU MEDIDA":"GMM"}`} color="#059669">
              {/* Encabezado tabla */}
              <div style={{display:"grid",gridTemplateColumns:"2.2fr 1.5fr 1fr 1fr",padding:"6px 10px",background:"#d1fae5",borderRadius:"8px 8px 0 0",marginBottom:1}}>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46"}}>COBERTURA</div>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46"}}>SUMA / LÍMITE</div>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46"}}>DEDUCIBLE</div>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46"}}>AMPARADA</div>
              </div>
              {cobertBaseGMM.map((cob,i)=>{
                const val = (form.coberturasGMM||{})[cob.key]||{};
                const amparada = val.amparada||false;
                const esSoloAmparada = cob.tipo==="amparada";
                return (
                  <div key={cob.key} style={{display:"grid",gridTemplateColumns:"2.2fr 1.5fr 1fr 1fr",padding:"8px 10px",background:i%2===0?"#fff":"#f0fdf4",borderBottom:"1px solid #d1fae5",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{cob.label}</div>
                    {esSoloAmparada
                      ? <div style={{fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>—</div>
                      : <input value={val.suma||""}
                          onChange={e=>updCobGMM(cob.key,"suma",e.target.value)}
                          placeholder={cob.tipo==="usd"?"USD 50,000":cob.tipo==="plan"?"Básico / Óptima":"$30,000"}
                          style={{border:"1.5px solid #d1fae5",borderRadius:7,padding:"4px 8px",fontSize:11,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
                    }
                    {esSoloAmparada
                      ? <div style={{fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>—</div>
                      : <input value={val.deducible||""}
                          onChange={e=>updCobGMM(cob.key,"deducible",e.target.value)}
                          placeholder={cob.tipo==="usd"?"USD 50":cob.tipo==="amparada"?"—":"$30,000"}
                          style={{border:"1.5px solid #d1fae5",borderRadius:7,padding:"4px 8px",fontSize:11,outline:"none",fontFamily:"inherit",width:"90%",boxSizing:"border-box"}}/>
                    }
                    <div style={{textAlign:"center"}}>
                      <button onClick={()=>updCobGMM(cob.key,"amparada",!amparada)}
                        style={{background:amparada?"#059669":"#e5e7eb",color:amparada?"#fff":"#9ca3af",border:"none",borderRadius:20,padding:"4px 11px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        {amparada?"✓ Sí":"No"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </SecBox>
          ):(
            <SecBox title="COBERTURAS INCLUIDAS" color={ramoColor(form.ramo)}>
              <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Lista de coberturas (separadas por coma)</label>
              <textarea value={form.coberturas.join(", ")} onChange={e=>setForm(p=>({...p,coberturas:e.target.value.split(",").map(s=>s.trim()).filter(Boolean)}))}
                rows={4} placeholder="Muerte natural, Invalidez total, Enfermedades graves..."
                style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"10px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",resize:"vertical",boxSizing:"border-box"}}/>
              <div style={{marginTop:12}}>
                <Inp label="Beneficiario" value={form.beneficiarioPreferente} onChange={e=>sf("beneficiarioPreferente",e.target.value)} placeholder="Nombre del beneficiario"/>
              </div>
            </SecBox>
          )}
          <SecBox title="DOCUMENTO DE PÓLIZA" color="#2563eb">
            <div style={{fontSize:12,color:"#374151",marginBottom:10}}>
              Sube el PDF o imagen de la póliza para consultarla directamente desde el detalle.
            </div>
            {form.documentoPoliza ? (
              <div style={{background:"#eff6ff",border:"1.5px solid #93c5fd",borderRadius:11,padding:"12px 15px",display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:28}}>{form.documentoTipo==="application/pdf"?"📄":"🖼️"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e40af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{form.documentoNombre}</div>
                  <div style={{fontSize:11,color:"#3b82f6",marginTop:2}}>✓ Documento cargado · listo para guardar</div>
                </div>
                <button onClick={()=>sf("documentoPoliza",null)}
                  style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"5px 11px",fontSize:11,color:"#dc2626",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
                  Cambiar
                </button>
              </div>
            ) : (
              <div onClick={()=>docRef.current.click()}
                style={{border:"2px dashed #93c5fd",borderRadius:11,padding:"24px 20px",textAlign:"center",cursor:"pointer",background:"#f8faff",transition:"all .2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#eff6ff"}
                onMouseLeave={e=>e.currentTarget.style.background="#f8faff"}>
                <div style={{fontSize:32,marginBottom:8}}>📎</div>
                <div style={{fontWeight:700,fontSize:13,color:"#1e40af",marginBottom:4}}>Arrastra o haz clic para subir</div>
                <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:6}}>
                  {["PDF","JPG","PNG"].map(f=>(
                    <span key={f} style={{background:"#dbeafe",color:"#1e40af",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{display:"none"}}
              onChange={e=>{
                const file=e.target.files[0]; if(!file)return;
                const r=new FileReader();
                r.onload=ev=>sf("documentoPoliza",ev.target.result);
                r.readAsDataURL(file);
                sf("documentoNombre",file.name);
                sf("documentoTipo",file.type);
              }}/>
          </SecBox>
          <SecBox title="NOTAS ADICIONALES" color="#9ca3af">
            <textarea value={form.notas} onChange={e=>sf("notas",e.target.value)} rows={2}
              placeholder="Información adicional, observaciones..."
              style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",resize:"none",boxSizing:"border-box"}}/>
          </SecBox>
        </div>
      )}

      {/* Navegación */}
      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:16,borderTop:"1px solid #f3f4f6"}}>
        <button onClick={()=>paso>1?setPaso(p=>p-1):onClose()} style={{background:"#f3f4f6",border:"none",borderRadius:9,padding:"10px 20px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
          {paso===1?"Cancelar":"← Anterior"}
        </button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:"#9ca3af"}}>Paso {paso} de {totalPasos}</span>
          {paso<totalPasos
            ? <Btn onClick={()=>canNext()&&setPaso(p=>p+1)} disabled={!canNext()} color="#2563eb">Siguiente →</Btn>
            : <Btn onClick={guardar} color="#059669" icon="check">Guardar Póliza</Btn>
          }
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VISOR DE DOCUMENTO DE PÓLIZA
// ═══════════════════════════════════════════════════════════════════
function DocumentoVisor({ src, nombre, tipo }) {
  const [abierto, setAbierto] = useState(false);
  const esPDF = tipo === "application/pdf" || nombre?.toLowerCase().endsWith(".pdf");
  const esImagen = /image\//i.test(tipo) || /\.(jpg|jpeg|png|webp|gif)$/i.test(nombre||"");
  const srcLimpio = esPDF ? `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH` : src;

  return (
    <>
      {/* Botón ojo */}
      <button
        onClick={()=>setAbierto(true)}
        title="Ver documento de póliza"
        style={{display:"inline-flex",alignItems:"center",gap:8,background:"#eff6ff",
          border:"1.5px solid #bfdbfe",borderRadius:9,padding:"8px 18px",cursor:"pointer",
          fontFamily:"inherit",fontWeight:700,fontSize:13,color:"#1d4ed8"}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        Ver documento
      </button>

      {/* Modal de pantalla completa */}
      {abierto&&(
        <div onClick={()=>setAbierto(false)}
          style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:9999,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"16px"}}>

          {/* Barra superior */}
          <div onClick={e=>e.stopPropagation()}
            style={{width:"100%",maxWidth:960,display:"flex",alignItems:"center",
              justifyContent:"space-between",marginBottom:10,padding:"0 4px"}}>
            <span style={{color:"#fff",fontWeight:700,fontSize:13,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>
              📄 {nombre||"Documento de póliza"}
            </span>
            <div style={{display:"flex",gap:8}}>
              <a href={src} download={nombre||"poliza"}
                style={{background:"rgba(255,255,255,0.15)",borderRadius:7,padding:"6px 14px",
                  fontSize:12,fontWeight:700,color:"#fff",textDecoration:"none",
                  display:"inline-flex",alignItems:"center",gap:4}}>
                ⬇ Descargar
              </a>
              <button onClick={()=>setAbierto(false)}
                style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:7,
                  padding:"6px 14px",fontSize:12,fontWeight:700,color:"#fff",
                  cursor:"pointer",fontFamily:"inherit"}}>
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Visor */}
          <div onClick={e=>e.stopPropagation()}
            style={{width:"100%",maxWidth:960,height:"85vh",borderRadius:12,
              overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
            {esPDF ? (
              <iframe
                src={srcLimpio}
                title={nombre||"Póliza"}
                style={{width:"100%",height:"100%",border:"none",display:"block"}}
              />
            ) : esImagen ? (
              <div style={{height:"100%",background:"#111",display:"flex",
                alignItems:"center",justifyContent:"center",padding:16}}>
                <img src={src} alt={nombre||"Póliza"}
                  style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain",borderRadius:8}}/>
              </div>
            ) : (
              <div style={{height:"100%",background:"#fff",display:"flex",flexDirection:"column",
                alignItems:"center",justifyContent:"center",gap:12,color:"#6b7280"}}>
                <div style={{fontSize:40}}>📎</div>
                <div style={{fontSize:14,fontWeight:600}}>No se puede previsualizar</div>
                <a href={src} download={nombre} style={{color:"#2563eb",fontSize:13}}>Descargar archivo</a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function DocAdjunto({ poliza, onSubir }) {
  const ref = useRef();
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0"}}>
      {poliza.documentoPoliza ? (
        <DocumentoVisor src={poliza.documentoPoliza} nombre={poliza.documentoNombre} tipo={poliza.documentoTipo}/>
      ) : (
        <>
          <input type="file" accept=".pdf,image/*" style={{display:"none"}} ref={ref} onChange={e=>{if(e.target.files[0])onSubir(e.target.files[0]);}}/>
          <button onClick={()=>ref.current.click()}
            style={{display:"inline-flex",alignItems:"center",gap:8,background:"#f8fafc",border:"1.5px dashed #d1d5db",
              borderRadius:9,padding:"8px 18px",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13,color:"#6b7280"}}>
            📎 Adjuntar documento de póliza (PDF o imagen)
          </button>
        </>
      )}
    </div>
  );
}

function Polizas({ polizas, setPolizas, clientes, setClientes, subagentes, setSubagentes, plantillas }) {
  const [filtro, setFiltro] = useState("todas");
  const [filtroRamo, setFiltroRamo] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  useEffect(()=>{
    const handler = () => setShowScan(true);
    document.addEventListener("openScan", handler);
    return () => document.removeEventListener("openScan", handler);
  },[]);
  const [showDetalle, setShowDetalle] = useState(null);
  const [showPago, setShowPago] = useState(null);
  const [showRenovar, setShowRenovar] = useState(null);
  const [showEditar, setShowEditar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" | "table"
  const [ordenVenc, setOrdenVenc] = useState("asc"); // "asc" | "desc" | "ninguno"
  const ramosDisponibles = Object.keys(RAMOS_SUBRAMOS);

  // Status dinámico basado en fechas
  const getStatus = (p) => {
    if (p.status === "cancelada") return "cancelada";
    const venc = p.vencimiento;
    if (!venc) return p.status || "activa";
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fv = new Date(venc.includes("/") ? venc.split("/").reverse().join("-") : venc);
    fv.setHours(0,0,0,0);
    const diff = Math.round((fv - hoy) / 86400000);
    if (diff < 0) return "vencida";
    if (diff <= 30) return "por vencer";
    return "activa";
  };

  // Días para vencer
  const diasParaVencer = (p) => {
    if (!p.vencimiento) return 9999;
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fv = new Date(p.vencimiento.includes("/") ? p.vencimiento.split("/").reverse().join("-") : p.vencimiento);
    fv.setHours(0,0,0,0);
    return Math.round((fv - hoy) / 86400000);
  };

  const STATUS_CFG = {
    activa:      { color:"#059669", bg:"#f0fdf4", label:"● Vigente",     badge:"#d1fae5" },
    "por vencer":{ color:"#d97706", bg:"#fffbeb", label:"⚠ Por vencer",  badge:"#fef3c7" },
    vencida:     { color:"#dc2626", bg:"#fef2f2", label:"✗ Vencida",     badge:"#fee2e2" },
    cancelada:   { color:"#6b7280", bg:"#f9fafb", label:"○ Cancelada",   badge:"#f3f4f6" },
  };

  const filtradas = polizas
    .filter(p => filtro === "todas" || getStatus(p) === filtro)
    .filter(p => filtroRamo === "todos" || p.ramo === filtroRamo)
    .filter(p => !busqueda || p.numero?.toLowerCase().includes(busqueda.toLowerCase()) || p.cliente?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a,b) => {
      if (ordenVenc === "asc")  return diasParaVencer(a) - diasParaVencer(b);
      if (ordenVenc === "desc") return diasParaVencer(b) - diasParaVencer(a);
      return 0;
    });

  const [polizaRecienGuardada, setPolizaRecienGuardada] = useState(null);
  const [showBienvenida, setShowBienvenida] = useState(null); // {poliza, tieneWA, tieneEmail}

  const onGuardar = (data) => {
    const normNum = (s) => (s||"").trim().toLowerCase().replace(/[\s\-_]/g,"");
    const num = normNum(data.numero);
    if (num && polizas.some(p => normNum(p.numero) === num && p.status !== "cancelada")) {
      alert(`⚠️ Ya existe una póliza con el número "${data.numero}". No se puede guardar duplicada.`);
      return;
    }
    // Si hay clienteId, vincular con cliente existente (evitar duplicados)
    if (data.clienteId) {
      setClientes(prev => prev.map(c => c.id===data.clienteId ? {...c, polizas:(c.polizas||0)+1} : c));
    }
    const id = Date.now() + Math.floor(Math.random()*9999);
    const nuevaPoliza = {...data, id};
    setPolizas(prev => [...prev, nuevaPoliza]);
    setBusqueda("");
    setFiltro("todas");
    setFiltroRamo("todos");
    setPolizaRecienGuardada(id);
    setTimeout(()=>setPolizaRecienGuardada(null), 4000);
    // Disparar bienvenida si hay WhatsApp o email
    const tieneWA = !!(data.telefonoCliente||data.whatsappCliente||"").replace(/\D/g,"");
    const tieneEmail = !!(data.emailCliente||"").trim();
    if (tieneWA || tieneEmail) {
      setTimeout(()=>setShowBienvenida({poliza:nuevaPoliza, tieneWA, tieneEmail}), 600);
    }
  };

  // Normaliza fecha de cualquier formato a YYYY-MM-DD
  const normalizarFecha = (f) => {
    if(!f) return "";
    // dd/mm/yyyy
    if(/^\d{2}\/\d{2}\/\d{4}$/.test(f)) { const [d,m,y]=f.split("/"); return `${y}-${m}-${d}`; }
    // dd-mm-yyyy
    if(/^\d{2}-\d{2}-\d{4}$/.test(f)) { const [d,m,y]=f.split("-"); return `${y}-${m}-${d}`; }
    // yyyy/mm/dd
    if(/^\d{4}\/\d{2}\/\d{2}$/.test(f)) return f.replace(/\//g,"-");
    return f; // ya es YYYY-MM-DD u otro
  };

  const onExtracted = (data, docData) => {
    // 1. Crear cliente si no existe
    let clienteId = "";
    let clienteNombre = data.cliente || "";
    if (clienteNombre) {
      const normNom = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim();
      const yaExiste = clientes.find(c => {
        const nomCompleto = normNom(`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno||""}`);
        const rfcMatch = data.rfcCliente && c.rfc && data.rfcCliente.trim().toLowerCase()===c.rfc.trim().toLowerCase();
        return rfcMatch || nomCompleto === normNom(clienteNombre);
      });
      if (yaExiste) {
        clienteId = yaExiste.id;
        // Actualizar datos faltantes del cliente existente
        setClientes(prev => prev.map(c => c.id === yaExiste.id ? {
          ...c,
          rfc: c.rfc || data.rfcCliente || "",
          fechaNacimiento: c.fechaNacimiento || data.fechaNacimiento || "",
          email:    c.email    || data.emailCliente    || "",
          telefono: c.telefono || data.telefonoCliente || "",
          whatsapp: c.whatsapp || data.whatsappCliente || data.telefonoCliente || "",
          // Dirección: solo si no tiene
          calle:    c.calle    || data.clienteCalle    || "",
          numero:   c.numero   || data.clienteNumero   || "",
          colonia:  c.colonia  || data.clienteColonia  || "",
          cp:       c.cp       || data.clienteCp       || "",
          ciudad:   c.ciudad   || data.clienteCiudad   || "",
          estado:   c.estado   || data.clienteEstado   || "",
        } : c));
      } else {
        // Dividir nombre: para apellido compuesto tomar últimas 2 palabras como apellidos
        const partes = clienteNombre.trim().split(/\s+/);
        let pNombre = "", pApellidoP = "", pApellidoM = "";
        if (partes.length === 1) { pNombre = partes[0]; }
        else if (partes.length === 2) { pNombre = partes[0]; pApellidoP = partes[1]; }
        else if (partes.length === 3) { pNombre = partes[0]; pApellidoP = partes[1]; pApellidoM = partes[2]; }
        else {
          pApellidoM = partes[partes.length-1];
          pApellidoP = partes[partes.length-2];
          pNombre = partes.slice(0, partes.length-2).join(" ");
        }
        const nuevoCliente = {
          id: Date.now(),
          nombre: pNombre,
          apellidoPaterno: pApellidoP,
          apellidoMaterno: pApellidoM,
          rfc: data.rfcCliente || "",
          fechaNacimiento: data.fechaNacimiento || "",
          calle:   data.clienteCalle   || "",
          numero:  data.clienteNumero  || "",
          colonia: data.clienteColonia || "",
          cp:      data.clienteCp      || "",
          ciudad:  data.clienteCiudad  || "",
          estado:  data.clienteEstado  || "",
          email:    data.emailCliente    || "",
          telefono: data.telefonoCliente || "",
          whatsapp: data.whatsappCliente || data.telefonoCliente || "",
          sexo: "",
          polizas: 1,
          _autoCreado: true,
        };
        setClientes(prev => [...prev, nuevoCliente]);
        clienteId = nuevoCliente.id;
      }
    }

    // 2. Validar duplicado
    const normNum = (s) => (s||"").trim().toLowerCase().replace(/[\s\-_]/g,"");
    const numNuevo = normNum(data.numero);
    if (numNuevo && polizas.some(p => normNum(p.numero) === numNuevo && p.status !== "cancelada")) {
      alert(`⚠️ Ya existe una póliza con el número "${data.numero}". No se puede guardar duplicada.`);
      return;
    }

    // 3. Construir póliza normalizando fechas
    const id = Date.now() + Math.floor(Math.random()*9999);
    const mapped = {
      ...FORM_POLIZA_INIT,
      ...data,
      id,
      clienteId,
      cliente: clienteNombre,
      rfc: data.rfcCliente || "",
      inicio: normalizarFecha(data.inicio),
      vencimiento: normalizarFecha(data.vencimiento),
      formaPago: data.formaPago || data.frecuencia || "",
      prima: parseFloat(data.primaTotal)||parseFloat(data.prima)||0,
      primaNeta: parseFloat(data.primaNeta)||0,
      gastosExpedicion: parseFloat(data.gastosExpedicion)||0,
      porcentajeRecargo: parseFloat(data.porcentajeRecargo)||0,
      recargoPago: parseFloat(data.recargoPago)||0,
      porcentajeIva: parseFloat(data.porcentajeIva)||16,
      montoIva: parseFloat(data.montoIva)||0,
      primaTotal: parseFloat(data.primaTotal)||parseFloat(data.prima)||0,
      moneda: data.moneda||"MXN",

      agentePoliza: data.agentePoliza||"",
      beneficiarioPreferente: data.beneficiarioPreferente||data.beneficiario||"",
      coberturas: Array.isArray(data.coberturas)?data.coberturas:[],
      pagos: [],
      documentoPoliza: docData?.base64full||null,
      documentoNombre: docData?.nombre||"",
      documentoTipo: docData?.tipo||"",
      // Subagente (si aplica)
      subagenteId: data.subagenteId||"",
      comisionSubagente: parseFloat(data.comisionSubagente)||0,
    };

    setPolizas(prev => [...prev, mapped]);
    setBusqueda("");
    setFiltro("todas");
    setFiltroRamo("todos");
    setPolizaRecienGuardada(id);
    setTimeout(()=>setPolizaRecienGuardada(null), 4000);
    setShowScan(false);
  };

  const cancelarPoliza = (id) => {
    if (!window.confirm("¿Cancelar esta póliza? Esta acción no se puede deshacer.")) return;
    setPolizas(prev => prev.map(p => p.id === id ? {...p, status:"cancelada"} : p));
    setShowDetalle(null);
  };

  const recuperarPoliza = (id) => {
    setPolizas(prev => prev.map(p => p.id === id ? {...p, status:"activa"} : p));
  };

  const registrarPago = (pago) => {
    setPolizas(prev => prev.map(p => p.id === showPago.id
      ? {...p, pagos:[...(p.pagos||[]), pago], ultimoPago:pago}
      : p
    ));
    setShowDetalle(prev => prev ? {...prev, pagos:[...(prev.pagos||[]), pago], ultimoPago:pago} : prev);
  };

  const eliminarPago = (polizaId, pagoId) => {
    setPolizas(prev => prev.map(p => p.id === polizaId
      ? {...p, pagos:(p.pagos||[]).filter(pg=>pg.id!==pagoId)}
      : p
    ));
    setShowDetalle(prev => prev ? {...prev, pagos:(prev.pagos||[]).filter(pg=>pg.id!==pagoId)} : prev);
    setShowPago(prev => prev && prev.id===polizaId ? {...prev, pagos:(prev.pagos||[]).filter(pg=>pg.id!==pagoId)} : prev);
  };

  const renovarPoliza = (nueva) => {
    setPolizas(prev => [...prev.map(p => p.id === showRenovar.id ? {...p, status:"vencida"} : p), nueva]);
    setShowDetalle(null);
  };

  const polizaDetalle = showDetalle ? {...showDetalle, _status: getStatus(showDetalle)} : null;

  // Bienvenida automática

  const aplicarVarsBienvenida = (tpl, p) => (tpl||"")
    .replace(/{nombre}/g, p.cliente?.split(" ")[0]||p.cliente||"")
    .replace(/{numero}/g, p.numero||"")
    .replace(/{aseguradora}/g, p.aseguradora||"")
    .replace(/{ramo}/g, p.subramo?`${p.ramo} › ${p.subramo}`:(p.ramo||""))
    .replace(/{vencimiento}/g, p.vencimiento||"")
    .replace(/{prima}/g, Number(p.primaTotal||p.prima||0).toLocaleString("es-MX"))
    .replace(/{frecuencia}/g, p.formaPago||p.frecuencia||"");

  const enviarBienvenidaWA = (p) => {
    const tpl = plantillas?.bienvenida || `Hola {nombre} 👋,\n\n¡Bienvenido/a como cliente! 🎉\n\nTu póliza ha sido registrada:\n\n📄 *Póliza:* {numero}\n🏢 *Aseguradora:* {aseguradora}\n🔖 *Ramo:* {ramo}\n📅 *Vigente hasta:* {vencimiento}\n\nEstoy a tus órdenes 😊`;
    const msg = encodeURIComponent(aplicarVarsBienvenida(tpl, p));
    const tel = (p.telefonoCliente||p.whatsappCliente||"").replace(/\D/g,"");
    window.open(`https://wa.me/${tel?`52${tel}`:""  }?text=${msg}`,"_blank");
  };

  const enviarBienvenidaEmail = (p) => {
    const tpl = plantillas?.bienvenida || `Estimado/a {nombre},\n\n¡Bienvenido/a como cliente!\n\nSu póliza ha sido registrada:\n\n• Póliza: {numero}\n• Aseguradora: {aseguradora}\n• Ramo: {ramo}\n• Vigente hasta: {vencimiento}\n\nEstamos a sus órdenes.\n\nAtentamente,\nSu Agente de Seguros`;
    const body = encodeURIComponent(aplicarVarsBienvenida(tpl, p));
    const subject = encodeURIComponent(`¡Bienvenido/a! Póliza ${p.numero} registrada`);
    window.open(`mailto:${p.emailCliente}?subject=${subject}&body=${body}`,"_blank");
  };

  // Contadores por estado
  const counts = { activa:0, "por vencer":0, vencida:0, cancelada:0 };
  polizas.forEach(p => { const s = getStatus(p); if (counts[s] !== undefined) counts[s]++; });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionTitle title="Pólizas" sub={`${polizas.length} pólizas en cartera`}/>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={()=>setShowScan(true)} color="#0f172a" icon="scan">Leer con IA</Btn>
          <Btn onClick={()=>setShowModal(true)} color="#059669" icon="plus">Nueva Póliza</Btn>
        </div>
      </div>

      {/* Tarjetas resumen estado */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[["activa","🟢"],["por vencer","⚠️"],["vencida","🔴"],["cancelada","⚫"]].map(([s,ic])=>{
          const cfg = STATUS_CFG[s];
          return (
            <div key={s} onClick={()=>setFiltro(filtro===s?"todas":s)}
              style={{background:filtro===s?cfg.bg:"#fff",borderRadius:12,padding:"12px 16px",cursor:"pointer",
                border:`2px solid ${filtro===s?cfg.color:"#e5e7eb"}`,boxShadow:"0 1px 4px rgba(0,0,0,.05)",transition:"all .15s"}}>
              <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
              <div style={{fontSize:30,fontWeight:700,color:cfg.color,fontFamily:"'Inter','DM Sans',sans-serif",lineHeight:1,letterSpacing:"-0.5px"}}>{counts[s]}</div>
              <div style={{fontSize:12,fontWeight:600,color:"#374151",marginTop:3}}>{cfg.label.replace(/[●⚠✗○] /,"")}</div>
            </div>
          );
        })}
      </div>

      {/* Filtros ramo + buscador */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
        {[["todos","Todos"],...ramosDisponibles.map(r=>[r,r])].map(([v,l])=>(
          <button key={v} onClick={()=>setFiltroRamo(v)} style={{background:filtroRamo===v?ramoColor(v)||"#1d4ed8":"#fff",color:filtroRamo===v?"#fff":"#374151",border:"1.5px solid",borderColor:filtroRamo===v?ramoColor(v)||"#1d4ed8":"#e5e7eb",borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
        ))}
        <div style={{flex:1,background:"#fff",borderRadius:10,padding:"7px 13px",display:"flex",alignItems:"center",gap:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",minWidth:200}}>
          <Icon name="search" size={14}/><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar número, cliente..." autoComplete="off" style={{border:"none",outline:"none",fontSize:13,flex:1,fontFamily:"inherit",background:"transparent"}}/>
        </div>
        {/* Botón ordenar por vencimiento */}
        <button onClick={()=>setOrdenVenc(o=>o==="asc"?"desc":o==="desc"?"ninguno":"asc")}
          style={{background:ordenVenc!=="ninguno"?"#0f172a":"#fff",color:ordenVenc!=="ninguno"?"#fff":"#374151",
            border:"1.5px solid",borderColor:ordenVenc!=="ninguno"?"#0f172a":"#e5e7eb",
            borderRadius:9,padding:"6px 13px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
            display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
          📅 Vencimiento {ordenVenc==="asc"?"↑ Próximo":ordenVenc==="desc"?"↓ Lejano":""}
        </button>
        <div style={{display:"flex",gap:4,background:"#f3f4f6",borderRadius:9,padding:3}}>
          {[["cards","⊞"],["table","☰"]].map(([m,ic])=>(
            <button key={m} onClick={()=>setViewMode(m)} style={{padding:"5px 12px",borderRadius:7,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:14,
              background:viewMode===m?"#fff":"transparent",color:viewMode===m?"#1d4ed8":"#6b7280",
              boxShadow:viewMode===m?"0 1px 4px rgba(0,0,0,0.1)":"none",fontWeight:viewMode===m?700:400}}>{ic}</button>
          ))}
        </div>
      </div>

      {/* Banner póliza recién guardada */}
      {polizaRecienGuardada&&(
        <div style={{background:"#f0fdf4",border:"1.5px solid #86efac",borderRadius:12,padding:"12px 18px",display:"flex",alignItems:"center",gap:10,fontSize:13}}>
          <span style={{fontSize:20}}>✅</span>
          <div>
            <div style={{fontWeight:800,color:"#065f46"}}>Póliza guardada correctamente</div>
            <div style={{fontSize:11,color:"#16a34a",marginTop:2}}>Los filtros se han limpiado — la póliza aparece resaltada en verde</div>
          </div>
        </div>
      )}

      {/* Vista tabla */}
      {viewMode==="table"&&(
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.08)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"#f8fafc",borderBottom:"2px solid #e5e7eb"}}>
                {["Número","Cliente","Aseguradora","Ramo","Prima Total","Inicio","Vencimiento","Estado","Pago","Acciones"].map(h=>(
                  <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p,i)=>{
                const st=getStatus(p); const cfg=STATUS_CFG[st];
                return(
                  <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa",cursor:"pointer"}}
                    onClick={()=>setShowDetalle(p)}>
                    <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:11,fontWeight:700,color:"#1d4ed8"}}>{p.numero||"—"}</td>
                    <td style={{padding:"9px 12px",fontWeight:600,color:"#111827"}}>{p.cliente||"—"}</td>
                    <td style={{padding:"9px 12px",color:"#6b7280"}}>{p.aseguradora||"—"}</td>
                    <td style={{padding:"9px 12px"}}>
                      <span style={{background:ramoColor(p.ramo)+"22",color:ramoColor(p.ramo),padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:10}}>{p.ramo||"—"}</span>
                    </td>
                    <td style={{padding:"9px 12px",fontWeight:700,color:"#059669"}}>{p.primaTotal?`$${Number(p.primaTotal).toLocaleString()}`:(p.prima?`$${Number(p.prima).toLocaleString()}`:"—")}</td>
                    <td style={{padding:"9px 12px",color:"#6b7280",fontSize:11}}>{p.inicio||"—"}</td>
                    <td style={{padding:"9px 12px",color:"#6b7280",fontSize:11}}>{p.vencimiento||"—"}</td>
                    <td style={{padding:"9px 12px"}}>
                      <span style={{background:cfg.badge,color:cfg.color,padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:10}}>{cfg.label}</span>
                    </td>
                    <td style={{padding:"9px 12px"}}>
                      {p.ultimoPago
                        ? <span style={{color:"#059669",fontWeight:700,fontSize:11}}>✓ Pagada</span>
                        : <span style={{color:"#dc2626",fontWeight:700,fontSize:11}}>⏳ Pendiente</span>}
                    </td>
                    <td style={{padding:"9px 12px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",gap:5}}>
                        <button onClick={()=>setShowDetalle(p)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #e5e7eb",background:"#fff",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Ver</button>
                        <button onClick={()=>setShowPago(p)} style={{padding:"4px 8px",borderRadius:6,border:"1px solid #059669",background:"#f0fdf4",color:"#059669",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Pago</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtradas.length===0&&<div style={{padding:40,textAlign:"center",color:"#9ca3af"}}>No hay pólizas que mostrar</div>}
        </div>
      )}

      {/* Tarjetas póliza */}
      {viewMode==="cards"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
        {filtradas.map(p=>{
          const st = getStatus(p); const cfg = STATUS_CFG[st];
          const tienePago = p.ultimoPago;
          const esNueva = polizaRecienGuardada === p.id;
          const dias = diasParaVencer(p);
          const urgente = dias >= 0 && dias <= 15 && st !== "cancelada";
          return (
            <div key={p.id} style={{background:"#fff",borderRadius:16,overflow:"hidden",
              boxShadow: esNueva ? "0 0 0 3px #059669, 0 4px 20px rgba(5,150,105,0.25)" : urgente ? "0 0 0 2px #f59e0b, 0 4px 16px rgba(245,158,11,0.2)" : "0 1px 8px rgba(0,0,0,0.08)",
              transition:"box-shadow .4s"}}>
              {/* Banner urgente */}
              {urgente&&(
                <div style={{background:"linear-gradient(90deg,#f59e0b,#d97706)",padding:"5px 14px",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:12}}>⚠️</span>
                  <span style={{fontSize:11,fontWeight:800,color:"#fff"}}>
                    {dias===0?"¡Vence HOY!":dias===1?"Vence mañana":`Vence en ${dias} días`}
                  </span>
                </div>
              )}
              {/* Header ramo */}
              <div style={{background:`linear-gradient(135deg,${ramoColor(p.ramo)},${ramoColor(p.ramo)}cc)`,padding:"13px 16px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="policies" size={16}/>
                  </div>
                  <div>
                    <div style={{fontSize:9,fontWeight:800,opacity:.75,letterSpacing:"0.1em"}}>{p.ramo?.toUpperCase()}{p.subramo?` · ${p.subramo.toUpperCase()}`:""}</div>
                    <div style={{fontSize:13,fontWeight:800,letterSpacing:"0.03em",fontFamily:"'Inter','Segoe UI',sans-serif"}}>{p.numero}</div>
                  </div>
                </div>
                <span style={{background:cfg.badge,color:cfg.color,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:800,flexShrink:0}}>
                  {cfg.label}
                </span>
              </div>
              <div style={{padding:"12px 15px"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:9}}>{p.cliente}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11,marginBottom:9}}>
                  {[["Aseguradora",p.aseguradora||"—"],["Prima total",p.primaTotal?`$${Number(p.primaTotal).toLocaleString()}`:(p.prima?`$${Number(p.prima).toLocaleString()}`:"—")],["Inicio",p.inicio||"—"],["Vencimiento",p.vencimiento||"—"]].map(([l,v])=>(
                    <div key={l} style={{background:"#f9fafb",borderRadius:7,padding:"6px 8px"}}>
                      <div style={{color:"#9ca3af",fontSize:9,marginBottom:1}}>{l.toUpperCase()}</div>
                      <div style={{fontWeight:700,color:l==="Vencimiento"&&(st==="vencida"||st==="por vencer")?cfg.color:"#111827",fontSize:11}}>{v}</div>
                    </div>
                  ))}
                </div>
                {/* GMM */}
                {p.ramo==="Gastos Médicos"&&(
                  <div style={{marginBottom:7,display:"flex",gap:4,flexWrap:"wrap"}}>
                    {p.planGMM&&<span style={{background:"#059669",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20}}>📋 {p.planGMM}</span>}
                    {p.aseguradosGMM?.length>0&&<span style={{background:"#d1fae5",color:"#065f46",fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:20}}>👥 {p.aseguradosGMM.length} aseg.</span>}
                  </div>
                )}
                {/* Autos */}
                {p.ramo==="Autos"&&p.subramo!=="Flotilla"&&p.vehiculoMarca&&(
                  <div style={{background:"#eff6ff",borderRadius:7,padding:"5px 9px",fontSize:10,color:"#1e40af",fontWeight:600,marginBottom:7}}>
                    🚗 {p.vehiculoMarca} {p.vehiculoDescripcion} · {p.vehiculoAnio}
                  </div>
                )}
                {/* Flotilla */}
                {p.subramo==="Flotilla"&&p.incisos?.length>0&&(
                  <div style={{background:"#eff6ff",borderRadius:7,padding:"5px 9px",fontSize:10,color:"#1e40af",marginBottom:7}}>
                    🚗 Flotilla · {p.incisos.length} vehículos
                  </div>
                )}
                {/* Último pago */}
                {tienePago&&(
                  <div style={{background:"#f0fdf4",borderRadius:7,padding:"5px 9px",fontSize:10,color:"#059669",fontWeight:600,marginBottom:7,display:"flex",alignItems:"center",gap:5}}>
                    <span>💳</span>
                    <span>Pago: {tienePago.fechaPago} · {tienePago.formaPago}</span>
                    {tienePago.comprobante&&<span title="Con comprobante">📎</span>}
                  </div>
                )}
                {/* Renovada de */}
                {p.renovadaDe&&(
                  <div style={{background:"#faf5ff",borderRadius:7,padding:"4px 8px",fontSize:10,color:"#7c3aed",marginBottom:7}}>
                    🔄 Renovación de {p.renovadaDe}
                  </div>
                )}
                {/* Botones acción */}
                <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                  <button onClick={()=>setShowDetalle(p)} style={{flex:1,minWidth:80,background:"#f3f4f6",border:"none",borderRadius:8,padding:"6px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                    {p.documentoPoliza&&<span title="Tiene documento adjunto">📎</span>}
                    Ver detalle
                  </button>
                  {st!=="cancelada"&&(
                    <>
                      <button onClick={(e)=>{e.stopPropagation();setShowPago(p);}} style={{flex:1,minWidth:60,background:"#f0fdf4",border:"1px solid #d1fae5",borderRadius:8,padding:"6px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#059669"}}>
                        💳 Pago
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();setShowRenovar(p);}} style={{flex:1,minWidth:60,background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:8,padding:"6px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#7c3aed"}}>
                        🔄 Renovar
                      </button>
                    </>
                  )}
                </div>
                <div style={{display:"flex",gap:6,marginTop:5}}>
                  <button onClick={(e)=>{e.stopPropagation();setShowEditar(p);}} style={{flex:1,background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:8,padding:"5px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#2563eb"}}>
                    ✏️ Editar
                  </button>
                  {st!=="cancelada"&&(
                    <button onClick={(e)=>{e.stopPropagation();if(window.confirm("¿Cancelar esta póliza?"))cancelarPoliza(p.id);}} style={{flex:1,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"5px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#dc2626"}}>
                      ✕ Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtradas.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"50px 20px",color:"#9ca3af"}}>
            <div style={{fontSize:32,marginBottom:8}}>📋</div>
            <div style={{fontWeight:600}}>Sin pólizas que coincidan</div>
          </div>
        )}
      </div>}

      {/* Modal detalle */}
      {polizaDetalle&&(
        <Modal title={`Póliza ${polizaDetalle.numero}`} onClose={()=>setShowDetalle(null)} wide maxW={720}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Header */}
            <div style={{background:`linear-gradient(135deg,${ramoColor(polizaDetalle.ramo)},${ramoColor(polizaDetalle.ramo)}aa)`,borderRadius:12,padding:"16px 20px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,opacity:.8,fontWeight:700,letterSpacing:"0.08em"}}>{polizaDetalle.ramo?.toUpperCase()}{polizaDetalle.subramo?` · ${polizaDetalle.subramo}`:""} · {polizaDetalle.aseguradora}</div>
                <div style={{fontSize:20,fontWeight:800,letterSpacing:"0.03em",fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",marginTop:2}}>{polizaDetalle.numero}</div>
                <div style={{fontSize:13,opacity:.9,marginTop:4}}>{polizaDetalle.cliente}</div>
                {polizaDetalle.renovadaDe&&<div style={{fontSize:10,opacity:.7,marginTop:2}}>🔄 Renovación de {polizaDetalle.renovadaDe}</div>}
                {polizaDetalle.documentoPoliza&&<div style={{fontSize:10,opacity:.8,marginTop:3,display:"flex",alignItems:"center",gap:4}}>📎 <span>Póliza adjunta · ver abajo</span></div>}
              </div>
              <div style={{textAlign:"right",display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
                <span style={{background:STATUS_CFG[polizaDetalle._status].badge,color:STATUS_CFG[polizaDetalle._status].color,padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:800}}>
                  {STATUS_CFG[polizaDetalle._status].label}
                </span>
                <div style={{fontSize:9,opacity:.7}}>PRIMA TOTAL</div>
                <div style={{fontSize:24,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>${Number(polizaDetalle.primaTotal||polizaDetalle.prima||0).toLocaleString()}</div>
                <div style={{fontSize:11,opacity:.8}}>{polizaDetalle.formaPago||polizaDetalle.frecuencia}</div>
              </div>
            </div>

            {/* Datos generales */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[
                ["Número de Póliza", polizaDetalle.numero||"—"],
                ["Endoso", polizaDetalle.endoso||"0"],
                ["Aseguradora", polizaDetalle.aseguradora||"—"],
                ["Forma de Pago", polizaDetalle.formaPago||polizaDetalle.frecuencia||"—"],
                ["Moneda", polizaDetalle.moneda||"MXN"],

                ["Agente", polizaDetalle.agentePoliza||"—"],
                ["Vigencia Inicio", polizaDetalle.inicio||"—"],
                ["Vigencia Fin", polizaDetalle.vencimiento||"—"],
                ["Prima Neta", polizaDetalle.primaNeta!=null&&polizaDetalle.primaNeta!==""?`$${Number(polizaDetalle.primaNeta).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],
                ["Gastos Expedición", polizaDetalle.gastosExpedicion!=null&&polizaDetalle.gastosExpedicion!==""?`$${Number(polizaDetalle.gastosExpedicion).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],
                ["% IVA", polizaDetalle.porcentajeIva!=null&&polizaDetalle.porcentajeIva!==""?`${polizaDetalle.porcentajeIva}%`:"—"],
                ["Monto IVA", polizaDetalle.montoIva!=null&&polizaDetalle.montoIva!==""?`$${Number(polizaDetalle.montoIva).toLocaleString("es-MX",{minimumFractionDigits:2})}`:(polizaDetalle.iva!=null&&polizaDetalle.iva!==""?`$${Number(polizaDetalle.iva).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—")],
                ["Prima Total", polizaDetalle.primaTotal!=null&&polizaDetalle.primaTotal!==""?`$${Number(polizaDetalle.primaTotal).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],
                ["Beneficiario", polizaDetalle.beneficiarioPreferente||"—"],
              ].map(([l,v])=>(
                <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{v}</div>
                </div>
              ))}
            </div>

            {/* Autos individual */}
            {polizaDetalle.ramo==="Autos"&&polizaDetalle.subramo!=="Flotilla"&&polizaDetalle.vehiculoMarca&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#1e40af",marginBottom:8}}>🚗 VEHÍCULO ASEGURADO</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[["Descripción",polizaDetalle.vehiculoDescripcion],["Marca",polizaDetalle.vehiculoMarca],["Año",polizaDetalle.vehiculoAnio],["No. Serie",polizaDetalle.vehiculoSerie],["Uso",polizaDetalle.vehiculoUso],["Clase",polizaDetalle.vehiculoClase]].map(([l,v])=>(
                    <div key={l}><div style={{fontSize:9,color:"#6b7280",fontWeight:700}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:"#1e40af"}}>{v||"—"}</div></div>
                  ))}
                </div>
              </div>
            )}

            {/* Flotilla */}
            {polizaDetalle.subramo==="Flotilla"&&polizaDetalle.incisos?.length>0&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#1e40af",marginBottom:10}}>🚗 FLOTILLA — {polizaDetalle.incisos.length} INCISOS</div>
                <div style={{display:"grid",gridTemplateColumns:"0.3fr 1.5fr 1fr 0.8fr 1fr",padding:"6px 8px",background:"#dbeafe",borderRadius:"7px 7px 0 0"}}>
                  {["#","Descripción","Marca/Serie","Año","Prima c/IVA"].map(h=><div key={h} style={{fontSize:9,fontWeight:800,color:"#1e40af"}}>{h}</div>)}
                </div>
                {polizaDetalle.incisos.map((inc,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"0.3fr 1.5fr 1fr 0.8fr 1fr",padding:"8px 8px",background:i%2===0?"#eff6ff":"#fff",borderBottom:"1px solid #bfdbfe",alignItems:"center"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#2563eb"}}>{inc.numero}</div>
                    <div style={{fontSize:11,fontWeight:600}}>{inc.descripcion}</div>
                    <div style={{fontSize:10,color:"#6b7280"}}>{inc.marca}<br/><span style={{fontFamily:"monospace",fontSize:9}}>{inc.serie}</span></div>
                    <div style={{fontSize:11,fontWeight:600}}>{inc.anio}</div>
                    <div style={{fontSize:12,fontWeight:800,color:"#065f46"}}>${parseFloat(inc.primaConIva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
                  </div>
                ))}
                <div style={{display:"grid",gridTemplateColumns:"0.3fr 1.5fr 1fr 0.8fr 1fr",padding:"8px",background:"#1e40af",borderRadius:"0 0 7px 7px"}}>
                  <div/><div/><div/>
                  <div style={{fontSize:10,fontWeight:800,color:"#bfdbfe"}}>TOTAL</div>
                  <div style={{fontSize:13,fontWeight:900,color:"#fff"}}>${polizaDetalle.incisos.reduce((s,i)=>s+(parseFloat(i.primaConIva)||0),0).toLocaleString("es-MX",{minimumFractionDigits:2})}</div>
                </div>
              </div>
            )}

            {/* GMM condiciones */}
            {polizaDetalle.ramo==="Gastos Médicos"&&(polizaDetalle.planGMM||polizaDetalle.sumaAsegurada||polizaDetalle.deducibleGMM)&&(
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46",marginBottom:10}}>🏥 CONDICIONES DEL PLAN</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                  {[
                    ["Plan",polizaDetalle.planGMM||"—"],
                    ["Suma Asegurada",polizaDetalle.sumaAsegurada?`$${Number(polizaDetalle.sumaAsegurada).toLocaleString("es-MX")}`:polizaDetalle.sumaAsegurada||"—"],
                    ["Deducible",polizaDetalle.deducibleGMM?`$${Number(polizaDetalle.deducibleGMM).toLocaleString("es-MX")}`:polizaDetalle.deducibleGMM||"—"],
                    ["Coaseguro",polizaDetalle.coaseguroGMM?`${polizaDetalle.coaseguroGMM}%`:"—"],
                    ["Tope Coaseguro",polizaDetalle.topeCoaseguroGMM?`$${Number(polizaDetalle.topeCoaseguroGMM).toLocaleString("es-MX")}`:polizaDetalle.topeCoaseguroGMM||"—"],
                    ["Zona",polizaDetalle.zonaGMM||"—"],
                    ["Red Hospitalaria",polizaDetalle.hospitalGMM||"—"],
                    ["Tabulador",polizaDetalle.tabuladorGMM||"—"],
                  ].map(([l,v])=>(
                    <div key={l} style={{background:"#fff",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#065f46"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GMM asegurados */}
            {polizaDetalle.ramo==="Gastos Médicos"&&polizaDetalle.aseguradosGMM?.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#065f46"}}>👨‍👩‍👧 ASEGURADOS ({polizaDetalle.aseguradosGMM.length})</div>
                  {polizaDetalle.planGMM&&<span style={{background:"#059669",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:20}}>{polizaDetalle.planGMM}</span>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 0.8fr 1.2fr 1.2fr",padding:"5px 8px",background:"#bbf7d0",borderRadius:"7px 7px 0 0"}}>
                  {["Nombre","Parentesco","Edad","F. Nacimiento","Antigüedad"].map(h=><div key={h} style={{fontSize:9,fontWeight:800,color:"#065f46"}}>{h}</div>)}
                </div>
                {polizaDetalle.aseguradosGMM.map((a,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"2.5fr 1fr 0.8fr 1.2fr 1.2fr",padding:"7px 8px",background:i%2===0?"#f0fdf4":"#fff",borderBottom:"1px solid #d1fae5",alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:600}}>{a.nombre}</div>
                    <div style={{fontSize:11,color:a.parentesco==="Titular"?"#059669":"#6b7280",fontWeight:600}}>{a.parentesco}</div>
                    <div style={{fontSize:11,fontWeight:600}}>{a.edad||"—"}</div>
                    <div style={{fontSize:11,color:"#6b7280",fontFamily:"monospace"}}>{a.fechaNacimiento||"—"}</div>
                    <div style={{fontSize:10,color:"#6b7280",fontFamily:"monospace"}}>{a.antiguedad||"—"}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Desglose de recibos */}
            {polizaDetalle.recibos?.length>0&&(
              <div style={{background:"#f5f3ff",borderRadius:10,padding:"12px 14px",border:"1px solid #ede9fe"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#6d28d9",marginBottom:8}}>
                  📋 RECIBOS — {polizaDetalle.recibos.length===1?"Pago único":`${polizaDetalle.recibos.length} recibos · ${polizaDetalle.formaPago}`}
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead><tr style={{background:"#ede9fe"}}>
                    {["#","Prima Neta","Gastos","Recargo","IVA","Total"].map(h=>(
                      <th key={h} style={{padding:"4px 7px",textAlign:h==="#"?"center":"right",fontWeight:800,color:"#6d28d9",fontSize:9,borderBottom:"1px solid #ddd8fe"}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {polizaDetalle.recibos.map((r,i)=>(
                      <tr key={i} style={{background:i%2===0?"#faf5ff":"#fff",borderBottom:"1px solid #f3f0ff"}}>
                        <td style={{padding:"5px 7px",textAlign:"center"}}><span style={{background:"#7c3aed",color:"#fff",borderRadius:20,padding:"1px 6px",fontSize:10,fontWeight:700}}>{r.num}</span></td>
                        <td style={{padding:"5px 7px",textAlign:"right"}}>${(r.primaNeta||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                        <td style={{padding:"5px 7px",textAlign:"right",color:r.gastos>0?"#059669":"#d1d5db",fontWeight:r.gastos>0?700:400}}>{r.gastos>0?`$${r.gastos.toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"}</td>
                        <td style={{padding:"5px 7px",textAlign:"right",color:r.recargo>0?"#d97706":"#d1d5db"}}>{r.recargo>0?`$${r.recargo.toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"}</td>
                        <td style={{padding:"5px 7px",textAlign:"right",color:"#6b7280"}}>${(r.iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                        <td style={{padding:"5px 7px",textAlign:"right",fontWeight:800,color:"#7c3aed"}}>${(r.total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{borderTop:"1.5px solid #7c3aed"}}>
                    <td colSpan={5} style={{padding:"5px 7px",fontWeight:800,fontSize:10,color:"#6d28d9"}}>PRIMA TOTAL</td>
                    <td style={{padding:"5px 7px",textAlign:"right",fontWeight:900,color:"#7c3aed",fontSize:12}}>${(parseFloat(polizaDetalle.primaTotal)||parseFloat(polizaDetalle.prima)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</td>
                  </tr></tfoot>
                </table>
              </div>
            )}

            {/* Coberturas */}
            {polizaDetalle.coberturas?.length>0&&polizaDetalle.coberturas[0]!=="Flotilla — ver incisos"&&(
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46",marginBottom:8}}>🛡️ COBERTURAS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {polizaDetalle.coberturas.map(c=><span key={c} style={{background:"#d1fae5",color:"#065f46",fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:600}}>{c}</span>)}
                </div>
              </div>
            )}

            {/* Historial de pagos */}
            {polizaDetalle.pagos?.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#065f46",marginBottom:10}}>💳 HISTORIAL DE PAGOS ({polizaDetalle.pagos.length})</div>
                {polizaDetalle.pagos.map((pg,i)=>(
                  <div key={i} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 10px",background:i%2===0?"#fff":"#f9fffe",borderRadius:8,marginBottom:4,border:"1px solid #d1fae5"}}>
                    <div style={{fontSize:18}}>💳</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#065f46",display:"flex",alignItems:"center",gap:6}}>
                        {pg.reciboNum&&<span style={{background:"#7c3aed",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:800}}>Recibo {pg.reciboNum}</span>}
                        {pg.fechaEsperada&&pg.fechaEsperada!==pg.fechaPago&&<span style={{background:"#fef3c7",color:"#92400e",borderRadius:12,padding:"1px 6px",fontSize:9,fontWeight:700,marginRight:3}}>Vto: {pg.fechaEsperada}</span>}
                        <span style={{fontWeight:700}}>{pg.fechaPago}</span> · {pg.formaPago}
                      </div>
                      <div style={{fontSize:11,color:"#6b7280"}}>
                        ${Number(pg.monto||0).toLocaleString("es-MX",{minimumFractionDigits:2})} {pg.referencia?`· Ref: ${pg.referencia}`:""}
                      </div>
                    </div>
                    {pg.comprobante&&(
                      <a href={pg.comprobante} download={pg.comprobanteName||"comprobante"}
                        style={{background:"#059669",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:8,textDecoration:"none"}}>
                        📎 Ver
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {polizaDetalle.notas&&(
              <div style={{background:"#fffbeb",borderRadius:10,padding:"10px 13px",fontSize:13,color:"#92400e"}}>📝 {polizaDetalle.notas}</div>
            )}

            {/* Visor / subir documento de póliza */}
            <DocAdjunto
              poliza={polizaDetalle}
              onSubir={(file)=>{
                const r = new FileReader();
                r.onload = ev => {
                  setPolizas(prev => prev.map(p => p.id===polizaDetalle.id
                    ? {...p, documentoPoliza:ev.target.result, documentoNombre:file.name, documentoTipo:file.type}
                    : p
                  ));
                  setShowDetalle(d => ({...d, documentoPoliza:ev.target.result, documentoNombre:file.name, documentoTipo:file.type}));
                };
                r.readAsDataURL(file);
              }}
            />

            {/* Acciones del detalle */}
            <div style={{display:"flex",gap:10,paddingTop:4,borderTop:"1px solid #f3f4f6"}}>
              {polizaDetalle._status!=="cancelada"?(
                <>
                  <Btn onClick={()=>{setShowPago(polizaDetalle);}} color="#059669" icon="check">💳 Registrar Pago</Btn>
                  <Btn onClick={()=>{setShowRenovar(polizaDetalle);}} color="#7c3aed">🔄 Renovar</Btn>
                  <button onClick={()=>cancelarPoliza(polizaDetalle.id)}
                    style={{marginLeft:"auto",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#dc2626"}}>
                    Cancelar póliza
                  </button>
                </>
              ):(
                <button onClick={()=>{recuperarPoliza(polizaDetalle.id);setShowDetalle(prev=>prev?{...prev,status:"activa"}:prev);}}
                  style={{flex:1,background:"#f0fdf4",border:"1.5px solid #6ee7b7",borderRadius:9,padding:"10px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#059669",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  ↩️ Recuperar póliza
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Registrar Pago */}
      {showPago&&(
        <Modal title={`Registrar Pago — ${showPago.numero}`} onClose={()=>setShowPago(null)}>
          <ModalPago poliza={showPago} onGuardar={registrarPago} onEliminarPago={(pgId)=>eliminarPago(showPago.id,pgId)} onClose={()=>setShowPago(null)}/>
        </Modal>
      )}

      {/* Modal Renovar */}
      {showRenovar&&(
        <Modal title={`Renovar Póliza — ${showRenovar.numero}`} onClose={()=>setShowRenovar(null)} wide>
          <ModalRenovar poliza={showRenovar} onGuardar={renovarPoliza} onClose={()=>setShowRenovar(null)}/>
        </Modal>
      )}

      {/* Modal Bienvenida automática */}
      {showBienvenida&&(
        <Modal title="🎉 Póliza registrada — Enviar bienvenida" onClose={()=>setShowBienvenida(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 16px",border:"1.5px solid #6ee7b7"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#065f46",marginBottom:4}}>✅ Póliza guardada correctamente</div>
              <div style={{fontSize:12,color:"#374151"}}>
                <strong>{showBienvenida.poliza.cliente}</strong> · {showBienvenida.poliza.numero} · {showBienvenida.poliza.aseguradora}
              </div>
            </div>
            <div style={{fontSize:13,color:"#374151",fontWeight:600}}>
              ¿Deseas enviar el mensaje de bienvenida al cliente?
            </div>
            <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#6b7280",whiteSpace:"pre-line",maxHeight:160,overflowY:"auto",border:"1px solid #e5e7eb"}}>
              {aplicarVarsBienvenida(plantillas?.bienvenida||`Hola {nombre} 👋,\n\n¡Bienvenido/a! Tu póliza {numero} de {aseguradora} fue registrada.\nVigente hasta: {vencimiento}\n\nEstoy a tus órdenes 😊`, showBienvenida.poliza)}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowBienvenida(null)} style={{flex:1,background:"#f3f4f6",border:"1.5px solid #e5e7eb",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
                Omitir
              </button>
              {showBienvenida.tieneWA&&(
                <button onClick={()=>{enviarBienvenidaWA(showBienvenida.poliza);setShowBienvenida(null);}} style={{flex:2,background:"#25d366",border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  💬 Enviar por WhatsApp
                </button>
              )}
              {showBienvenida.tieneEmail&&(
                <button onClick={()=>{enviarBienvenidaEmail(showBienvenida.poliza);setShowBienvenida(null);}} style={{flex:2,background:"#2563eb",border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  ✉️ Enviar por Email
                </button>
              )}
            </div>
            {showBienvenida.tieneWA&&showBienvenida.tieneEmail&&(
              <button onClick={()=>{enviarBienvenidaWA(showBienvenida.poliza);enviarBienvenidaEmail(showBienvenida.poliza);setShowBienvenida(null);}} style={{background:"#0f172a",border:"none",borderRadius:10,padding:10,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
                📤 Enviar por ambos canales
              </button>
            )}

          </div>
        </Modal>
      )}

      {/* Modal Editar Póliza */}
      {showEditar&&(
        <Modal title={`Editar Póliza — ${showEditar.numero}`} onClose={()=>setShowEditar(null)} wide>
          <ModalEditarPoliza
            poliza={showEditar}
            subagentes={subagentes}
            onGuardar={(data)=>{
              setPolizas(prev=>prev.map(p=>p.id===showEditar.id?{...p,...data}:p));
              setShowEditar(null);
            }}
            onClose={()=>setShowEditar(null)}
          />
        </Modal>
      )}

      {showModal&&<ModalPoliza clientes={clientes} subagentes={subagentes||[]} onGuardar={onGuardar} onClose={()=>setShowModal(false)}/>}
      {showScan&&<ScanPoliza onClose={()=>setShowScan(false)} onExtracted={onExtracted} subagentes={subagentes||[]}/>}
    </div>
  );
}


// ── Lector IA ─────────────────────────────────────────────────────
// ─── Resultado editable del escáner IA ──────────────────────────
function ResultadoScan({ result, editResult, setEditResult, fileData, fileName, onVolver, onConfirmar, subagentes }) {
  // Separar número y endoso si vienen juntos (ej: "2671100004205/24")
  useEffect(()=>{
    if(result && !editResult) {
      const numRaw = result.numero||"";
      const slashIdx = numRaw.indexOf("/");
      const numSolo = slashIdx>=0 ? numRaw.slice(0,slashIdx) : numRaw;
      const endosoSolo = slashIdx>=0 ? numRaw.slice(slashIdx+1) : (result.endoso||"");
      setEditResult({
        ...result,
        numero: numSolo,
        endoso: endosoSolo,
        primaTotal: result.primaTotal||result.prima||0,
        agentePoliza: result.agentePoliza||"",
        beneficiarioPreferente: result.beneficiarioPreferente||result.beneficiario||"",
      });
    }
  },[result]);

  const er = editResult || result;
  const upd = (k,v) => setEditResult(p=>({...(p||result),[k]:v}));
  const inpStyle = {border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:"#fff"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",color:"#065f46",fontWeight:600,fontSize:13}}>✅ Datos extraídos — revisa y edita si es necesario</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>NÚMERO DE PÓLIZA</div>
          <input value={er.numero||""} onChange={e=>upd("numero",e.target.value)} style={inpStyle} placeholder="Número sin endoso"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>ENDOSO</div>
          <input value={er.endoso||""} onChange={e=>upd("endoso",e.target.value)} style={inpStyle} placeholder="0"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>CLIENTE</div>
          <input value={er.cliente||""} onChange={e=>upd("cliente",e.target.value)} style={inpStyle}/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>ASEGURADORA</div>
          <input value={er.aseguradora||""} onChange={e=>upd("aseguradora",e.target.value)} style={inpStyle}/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>RAMO</div>
          <input value={er.ramo||""} onChange={e=>upd("ramo",e.target.value)} style={inpStyle}/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>SUBRAMO</div>
          <input value={er.subramo||""} onChange={e=>upd("subramo",e.target.value)} style={inpStyle}/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>PRIMA NETA</div>
          <input value={er.primaNeta||""} onChange={e=>upd("primaNeta",e.target.value)} style={inpStyle} placeholder="0.00"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>PRIMA TOTAL</div>
          <input value={er.primaTotal||""} onChange={e=>upd("primaTotal",e.target.value)} style={inpStyle} placeholder="0.00"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>INICIO VIGENCIA</div>
          <input value={er.inicio||""} onChange={e=>upd("inicio",e.target.value)} style={inpStyle} placeholder="DD/MM/AAAA"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>FIN VIGENCIA</div>
          <input value={er.vencimiento||""} onChange={e=>upd("vencimiento",e.target.value)} style={inpStyle} placeholder="YYYY-MM-DD"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>FORMA DE PAGO</div>
          <select value={er.formaPago||er.frecuencia||"Anual"} onChange={e=>upd("formaPago",e.target.value)} style={{...inpStyle,paddingRight:4}}>
            {["Anual","Semestral","Trimestral","Mensual","Contado","Único"].map(f=><option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>GASTOS EXPEDICIÓN</div>
          <input value={er.gastosExpedicion||""} onChange={e=>upd("gastosExpedicion",e.target.value)} style={inpStyle} placeholder="0.00"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>% RECARGO FRACC.</div>
          <input value={er.porcentajeRecargo||""} onChange={e=>upd("porcentajeRecargo",e.target.value)} style={inpStyle} placeholder="7.5"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>RECARGO PAGO FRACC. ($)</div>
          <input value={er.recargoPago||""} onChange={e=>upd("recargoPago",e.target.value)} style={inpStyle} placeholder="0.00"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>% IVA</div>
          <input value={er.porcentajeIva||""} onChange={e=>upd("porcentajeIva",e.target.value)} style={inpStyle} placeholder="16"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>MONTO IVA</div>
          <input value={er.montoIva||""} onChange={e=>upd("montoIva",e.target.value)} style={inpStyle} placeholder="0.00"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>RFC CLIENTE</div>
          <input value={er.rfcCliente||""} onChange={e=>upd("rfcCliente",e.target.value)} style={inpStyle} placeholder="XXXX000000XXX"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>FECHA DE NACIMIENTO</div>
          <input value={er.fechaNacimiento||""} onChange={e=>upd("fechaNacimiento",e.target.value)} style={inpStyle} placeholder="YYYY-MM-DD"/>
        </div>

        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>AGENTE</div>
          <input value={er.agentePoliza||""} onChange={e=>upd("agentePoliza",e.target.value)} style={inpStyle} placeholder="Nombre del agente"/>
        </div>
        <div>
          <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>MONEDA</div>
          <input value={er.moneda||"MXN"} onChange={e=>upd("moneda",e.target.value)} style={inpStyle}/>
        </div>
      </div>
      {/* Contacto del cliente */}
      <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 14px",border:"1.5px solid #bfdbfe"}}>
        <div style={{fontSize:11,fontWeight:800,color:"#1e40af",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          👤 Datos de contacto del cliente
          <span style={{fontSize:10,fontWeight:600,color:"#3b82f6"}}>(se guardarán en el perfil del cliente)</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9}}>
          <div>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>CORREO ELECTRÓNICO</div>
            <input value={er.emailCliente||""} onChange={e=>upd("emailCliente",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="correo@ejemplo.com"/>
          </div>
          <div>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>TELÉFONO</div>
            <input value={er.telefonoCliente||""} onChange={e=>upd("telefonoCliente",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="10 dígitos"/>
          </div>
          <div>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>WHATSAPP</div>
            <input value={er.whatsappCliente||""} onChange={e=>upd("whatsappCliente",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="10 dígitos"/>
          </div>
        </div>
        {/* Dirección del cliente */}
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px dashed #bfdbfe"}}>
          <div style={{fontSize:10,color:"#1e40af",fontWeight:800,marginBottom:8}}>📍 Dirección <span style={{fontWeight:600,color:"#3b82f6"}}>(solo se guarda si el cliente no tiene dirección registrada)</span></div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 0.8fr",gap:8,marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>CALLE</div>
              <input value={er.clienteCalle||""} onChange={e=>upd("clienteCalle",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="Nombre de la calle"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>NÚMERO</div>
              <input value={er.clienteNumero||""} onChange={e=>upd("clienteNumero",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="123"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 0.7fr",gap:8,marginBottom:8}}>
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>COLONIA</div>
              <input value={er.clienteColonia||""} onChange={e=>upd("clienteColonia",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="Colonia"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>CIUDAD</div>
              <input value={er.clienteCiudad||""} onChange={e=>upd("clienteCiudad",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="Ciudad"/>
            </div>
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>C.P.</div>
              <input value={er.clienteCp||""} onChange={e=>upd("clienteCp",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe"}} placeholder="00000"/>
            </div>
          </div>
          <div>
            <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>ESTADO</div>
            <select value={er.clienteEstado||""} onChange={e=>upd("clienteEstado",e.target.value)} style={{...inpStyle,borderColor:"#bfdbfe",paddingRight:4}}>
              <option value="">— Seleccionar estado —</option>
              {ESTADOS_MX.map(est=><option key={est}>{est}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Subagente */}
      {subagentes&&subagentes.length>0&&(
        <div style={{background:"#f5f3ff",borderRadius:10,padding:"12px 14px",border:"1.5px solid #ddd6fe"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#5b21b6",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            🤝 Subagente <span style={{fontSize:10,fontWeight:600,color:"#7c3aed"}}>(opcional — si aplica)</span>
          </div>
          <select value={er.subagenteId||""} onChange={e=>upd("subagenteId",e.target.value?Number(e.target.value):"")}
            style={{...inpStyle,borderColor:"#ddd6fe",marginBottom:er.subagenteId?8:0}}>
            <option value="">— Sin subagente —</option>
            {subagentes.filter(s=>s.activo!==false).map(s=>(
              <option key={s.id} value={s.id}>{s.nombre} {s.apellidoPaterno} {s.apellidoMaterno||""}</option>
            ))}
          </select>
          {er.subagenteId&&(
            <div>
              <div style={{fontSize:10,color:"#6b7280",fontWeight:700,marginBottom:3}}>COMISIÓN SUBAGENTE (%)</div>
              <input type="number" value={er.comisionSubagente||""} onChange={e=>upd("comisionSubagente",e.target.value)}
                style={{...inpStyle,borderColor:"#ddd6fe"}} placeholder="0"/>
            </div>
          )}
        </div>
      )}

      {(er.coberturas||[]).length>0&&<div style={{background:"#f9fafb",borderRadius:9,padding:"10px 12px"}}>
        <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:7}}>COBERTURAS DETECTADAS</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{(er.coberturas||[]).map((c,i)=><span key={i} style={{background:"#dbeafe",color:"#1e40af",fontSize:11,padding:"3px 9px",borderRadius:20}}>{c}</span>)}</div>
      </div>}
      <div style={{display:"flex",gap:10}}>
        <button onClick={onVolver} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13}}>← Volver</button>
        <Btn onClick={()=>onConfirmar(editResult || result)} color="#059669" style={{flex:2,justifyContent:"center"}}>Confirmar y guardar ✓</Btn>
      </div>
    </div>
  );
}

function ScanPoliza({ onClose, onExtracted, subagentes }) {
  const [step,setStep]=useState("upload");
  const [dragOver,setDragOver]=useState(false);
  const [fileName,setFileName]=useState("");
  const [fileData,setFileData]=useState(null);
  const [result,setResult]=useState(null);
  const [editResult,setEditResult]=useState(null);
  const [error,setError]=useState("");
  const fileRef=useRef();

  const processFile=(file)=>{if(!file)return;setFileName(file.name);const r=new FileReader();r.onload=e=>setFileData({base64:e.target.result.split(",")[1],type:file.type});r.readAsDataURL(file);};

  const analyze=async()=>{
    if(!fileData)return;setStep("analyzing");setError("");
    try{
      const block=fileData.type==="application/pdf"
        ?{type:"document",source:{type:"base64",media_type:"application/pdf",data:fileData.base64}}
        :{type:"image",source:{type:"base64",media_type:fileData.type,data:fileData.base64}};

      const prompt = [
        "Eres un extractor experto de polizas de seguros mexicanas.",
        "Extrae TODOS los datos del documento y responde UNICAMENTE con un objeto JSON valido, sin markdown ni texto adicional.",
        "",
        "CAMPOS OBLIGATORIOS A BUSCAR:",
        "- numero: busca 'No. de Poliza', 'Poliza No.', 'Numero de Poliza', 'Policy Number', 'No. Poliza'",
        "- endoso: numero de endoso si existe",
        "- cliente: nombre completo del contratante o asegurado titular",
        "- rfcCliente: RFC del contratante",
        "- aseguradora: nombre de la compania aseguradora",
        "- ramo: Autos, Vida, Gastos Medicos, Danos, Hogar, Negocio, Viaje",
        "- subramo: tipo especifico dentro del ramo",
        "- coberturas: lista de coberturas incluidas",
        "- inicio: fecha inicio vigencia en formato YYYY-MM-DD",
        "- vencimiento: fecha fin vigencia en formato YYYY-MM-DD",
        "",
        "CAMPOS ECONOMICOS — busca EXACTAMENTE estas etiquetas (pueden variar):",
        "- formaPago: busca 'FORMA DE PAGO', 'Forma de Cobro', 'Frecuencia de Pago', 'Periodicidad'. Valores: Anual, Semestral, Trimestral, Mensual, Contado, Unico",
        "- moneda: busca 'MONEDA', puede decir 'PESOS', 'DOLARES', 'UDI'. Devuelve: MXN, USD o UDI",
        "- primaNeta: busca 'PRIMA NETA', 'Prima Neta', 'Net Premium'. Solo el numero sin simbolos",
        "- gastosExpedicion: busca 'GASTO DE EXPEDICION', 'Gastos de Expedicion', 'Derechos de Poliza'. Solo el numero",
        "- porcentajeRecargo: busca '% RECARGO PAGO FRACCIONADO', 'Porcentaje Recargo', 'Recargo %'. Solo el numero (ej: 7.5)",
        "- recargoPago: busca 'RECARGO PAGO FRACCIONADO', 'Recargo por Pago Fraccionado', 'Recargo'. Solo el monto en pesos",
        "- porcentajeIva: busca '% I.V.A.', '% IVA', 'Tasa IVA'. Solo el numero (ej: 16)",
        "- montoIva: busca 'I.V.A.', 'IVA', 'Impuesto'. Solo el monto en pesos",
        "- primaTotal: busca 'PRIMA TOTAL', 'Total a Pagar', 'Prima Total con IVA', 'Total Prima'. Solo el numero",
        "",
        "OTROS CAMPOS:",
        "- agentePoliza: nombre del agente",
        "- beneficiarioPreferente: nombre del beneficiario",
        "- notas: cualquier observacion relevante",
        "IMPORTANTE: NO extraigas ni incluyas campo gestorCobro en el JSON.",
        "FECHA DE NACIMIENTO: Si tienes el RFC del cliente (formato XXXXAAMMDD...), extrae la fecha de nacimiento de las posiciones 5-10 (AAMMDD) y conviertela a formato DD/MM/AAAA. Ejemplo: RFC MERC850312XXX = nacimiento 12/03/1985. Guarda en campo fechaNacimiento.",
        
        "",
        "Formato JSON exacto (usa 0 si no encuentras el valor numerico, cadena vacia si no encuentras texto):",
        '{"numero":"","endoso":"","cliente":"","rfcCliente":"","fechaNacimiento":"DD/MM/AAAA","aseguradora":"","ramo":"","subramo":"","formaPago":"Anual","moneda":"MXN","agentePoliza":"","beneficiarioPreferente":"","primaNeta":0,"gastosExpedicion":0,"porcentajeRecargo":0,"recargoPago":0,"porcentajeIva":16,"montoIva":0,"primaTotal":0,"inicio":"YYYY-MM-DD","vencimiento":"YYYY-MM-DD","coberturas":[],"notas":""}'
      ].join("\n");

      const res=await fetch("/api/anthropic",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1500,
          messages:[{role:"user",content:[block,{type:"text",text:prompt}]}]
        })
      });
      const data=await res.json();
      if(!res.ok)throw new Error(data.error?.message||"Error en API");
      const text=data.content.map(b=>b.text||"").join("");
      // Extraer JSON robusto — busca el primer { hasta el ultimo }
      const match = text.match(/\{[\s\S]*\}/);
      if(!match) throw new Error("La IA no devolvio un JSON valido");
      const parsed = JSON.parse(match[0]);
      setResult(parsed);
      setStep("result");
    }catch(e){setError("Error: "+e.message);setStep("upload");}
  };

  return(
    <Modal title="🤖 Leer Póliza con IA" onClose={onClose} wide>
      {step==="upload"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#0f172a",borderRadius:12,padding:"12px 16px",color:"#60a5fa",fontSize:13}}>⚡ Extrae automáticamente: número, cliente, ramo, subramo, prima, fechas y coberturas</div>
          <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files[0]);}}
            onClick={()=>fileRef.current.click()}
            style={{border:`2px dashed ${dragOver?"#2563eb":"#d1d5db"}`,borderRadius:14,padding:"36px 28px",textAlign:"center",cursor:"pointer",background:dragOver?"#eff6ff":"#fafafa"}}>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{display:"none"}} onChange={e=>processFile(e.target.files[0])}/>
            <div style={{color:"#2563eb",display:"flex",justifyContent:"center",marginBottom:8}}><Icon name="upload" size={34}/></div>
            <div style={{fontWeight:700,fontSize:14}}>PDF o imagen · arrastra o haz clic</div>
          </div>
          {fileName&&<div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#f0fdf4",borderRadius:10}}>
            <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{fileName}</div></div>
            <Btn onClick={analyze} icon="spark">Analizar</Btn>
          </div>}
          {error&&<div style={{background:"#fef2f2",borderRadius:10,padding:"10px 14px",color:"#991b1b",fontSize:13}}>{error}</div>}
        </div>
      )}
      {step==="analyzing"&&(
        <div style={{textAlign:"center",padding:"50px 20px"}}>
          <div style={{fontSize:40,marginBottom:14}}>🔍</div>
          <div style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>Analizando póliza...</div>
          <style>{`@keyframes bounce{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.2);opacity:1}}`}</style>
          <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:20}}>
            {[0,1,2].map(i=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:"#2563eb",animation:`bounce 1.2s ${i*.2}s infinite`}}/>)}
          </div>
        </div>
      )}
      {step==="result"&&result&&<ResultadoScan
        result={result}
        editResult={editResult}
        setEditResult={setEditResult}
        fileData={fileData}
        fileName={fileName}
        subagentes={subagentes||[]}
        onVolver={()=>{setStep("upload");setEditResult(null);}}
        onConfirmar={(er)=>{
          onExtracted(er, fileData ? {base64full:"data:"+fileData.type+";base64,"+fileData.base64,nombre:fileName,tipo:fileData.type} : null);
          setEditResult(null);
        }}
      />}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// MÓDULO COMUNICACIÓN — WhatsApp + Correo + Plantillas + SMTP
// ═══════════════════════════════════════════════════════════════════
const PLANTILLAS_TIPOS = [
  {key:"vencimiento",  label:"Vencimiento",     icon:"📋", color:"#d97706", desc:"Póliza próxima a vencer"},
  {key:"renovacion",   label:"Renovación",      icon:"🔄", color:"#2563eb", desc:"Póliza renovada exitosamente"},
  {key:"bienvenida",   label:"Bienvenida",      icon:"👋", color:"#7c3aed", desc:"Cliente nuevo registrado"},
  {key:"pago",         label:"Pago recibido",   icon:"💳", color:"#059669", desc:"Confirmación de pago"},
  {key:"cumpleanos",   label:"Cumpleaños",      icon:"🎂", color:"#ec4899", desc:"Felicitación de cumpleaños"},
  {key:"personalizado",label:"Personalizado",   icon:"✏️", color:"#6b7280", desc:"Mensaje libre"},
];

const VARS_DISPONIBLES = ["{nombre}","{numero}","{aseguradora}","{ramo}","{vencimiento}","{prima}","{frecuencia}","{fecha}"];

function ComunicacionConfig({ plantillas, setPlantillas, plantillasDefault, clientes, polizas, config, setConfig, historialNotif, setHistorialNotif }) {
  const [canal, setCanal] = useState("notificaciones"); // "whatsapp" | "correo" | "notificaciones"
  const [tipoActivo, setTipoActivo] = useState("vencimiento");
  const [tabCorreo, setTabCorreo] = useState("plantilla");
  const [clienteDemo, setClienteDemo] = useState(null);
  const [toast, setToast] = useState(null);
  const [smtpForm, setSmtpForm] = useState({
    smtpHost: config.smtpHost||"",
    smtpPort: config.smtpPort||"587",
    smtpUser: config.smtpUser||"",
    smtpPass: config.smtpPass||"",
    smtpFromName: config.smtpFromName||"",
    smtpProvider: config.smtpProvider||"gmail",
  });
  const [testEmail, setTestEmail] = useState("");
  const [testando, setTestando] = useState(false);
  const imgRef = useRef();

  // Reglas de notificaciones — configurables
  const REGLAS_DEFAULT = {
    vencimiento15: { activo:true,  dias:15, canal:"whatsapp", label:"15 días antes del vencimiento" },
    vencimiento5:  { activo:true,  dias:5,  canal:"whatsapp", label:"5 días antes del vencimiento"  },
    vencimiento0:  { activo:true,  dias:0,  canal:"whatsapp", label:"Día del vencimiento"            },
    cumpleanos:    { activo:true,  dias:0,  canal:"whatsapp", label:"Día del cumpleaños"             },
    renovacion:    { activo:true,  dias:0,  canal:"whatsapp", label:"Al renovar póliza"              },
  };
  const [reglas, setReglas] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("crm_reglas_notif"))||REGLAS_DEFAULT; }
    catch { return REGLAS_DEFAULT; }
  });

  const guardarRegla = (key, cambios) => {
    const nuevas = {...reglas, [key]:{...reglas[key],...cambios}};
    setReglas(nuevas);
    localStorage.setItem("crm_reglas_notif", JSON.stringify(nuevas));
  };

  // Calcular pendientes del día
  const hoy = new Date(); hoy.setHours(0,0,0,0);

  const calcDias = (fecha) => {
    if (!fecha) return 9999;
    const f = new Date(fecha.includes("/") ? fecha.split("/").reverse().join("-") : fecha);
    f.setHours(0,0,0,0);
    return Math.round((f - hoy) / 86400000);
  };

  const tienePagoReciente = (p) => (p.pagos||[]).length > 0;

  const pendientes = [];

  // Vencimientos
  polizas.forEach(p => {
    if (p.status==="cancelada") return;
    const dias = calcDias(p.vencimiento);
    const pagado = tienePagoReciente(p);
    const yaEnviado = (historialNotif||[]).some(h =>
      h.polizaId===p.id && h.tipo===`vencimiento${dias<=0?0:dias<=5?5:15}` &&
      h.fecha === hoy.toLocaleDateString("es-MX")
    );
    if (yaEnviado || pagado) return;
    if (dias === 0  && reglas.vencimiento0?.activo)  pendientes.push({tipo:"vencimiento0",  label:"Vence HOY",        color:"#dc2626", poliza:p, cliente:clientes.find(c=>c.id===p.clienteId)||{nombre:p.cliente}});
    if (dias === 5  && reglas.vencimiento5?.activo)  pendientes.push({tipo:"vencimiento5",  label:"Vence en 5 días",  color:"#d97706", poliza:p, cliente:clientes.find(c=>c.id===p.clienteId)||{nombre:p.cliente}});
    if (dias === 15 && reglas.vencimiento15?.activo) pendientes.push({tipo:"vencimiento15", label:"Vence en 15 días", color:"#2563eb", poliza:p, cliente:clientes.find(c=>c.id===p.clienteId)||{nombre:p.cliente}});
  });

  // Cumpleaños
  if (reglas.cumpleanos?.activo) {
    clientes.forEach(c => {
      if (!c.fechaNacimiento) return;
      const f = new Date(c.fechaNacimiento.includes("/") ? c.fechaNacimiento.split("/").reverse().join("-") : c.fechaNacimiento);
      if (f.getMonth()===hoy.getMonth() && f.getDate()===hoy.getDate()) {
        const yaEnviado = (historialNotif||[]).some(h =>
          h.clienteId===c.id && h.tipo==="cumpleanos" && h.fecha===hoy.toLocaleDateString("es-MX")
        );
        if (!yaEnviado) pendientes.push({tipo:"cumpleanos", label:"Cumpleaños hoy", color:"#7c3aed", cliente:c, poliza:null});
      }
    });
  }

  // Registrar en historial
  const registrarEnvio = (item, canalUsado, omitido=false) => {
    const entrada = {
      id: Date.now(),
      fecha: hoy.toLocaleDateString("es-MX"),
      hora: new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
      tipo: item.tipo,
      clienteId: item.cliente?.id,
      cliente: item.cliente?.nombre+" "+(item.cliente?.apellidoPaterno||""),
      polizaId: item.poliza?.id,
      poliza: item.poliza?.numero||"—",
      canal: canalUsado,
      estado: omitido ? "omitida" : "enviada",
      label: item.label,
    };
    setHistorialNotif(prev=>[entrada,...(prev||[])].slice(0,200));
    showToast(omitido?"Notificación omitida":"Notificación enviada ✅", omitido?"#6b7280":"#059669");
  };

  // Enviar WhatsApp
  const enviarWA = (item) => {
    const tel = (item.cliente?.whatsapp||item.cliente?.telefono||item.poliza?.telefonoCliente||"").replace(/\D/g,"");
    let msg = "";
    if (item.tipo==="cumpleanos") {
      msg = plantillas.cumpleanos||`Hola ${item.cliente?.nombre}, te deseamos un feliz cumpleanos.`;
    } else {
      msg = (plantillas.vencimiento||"")
        .replace(/{nombre}/g, item.cliente?.nombre||"")
        .replace(/{numero}/g, item.poliza?.numero||"")
        .replace(/{aseguradora}/g, item.poliza?.aseguradora||"")
        .replace(/{vencimiento}/g, item.poliza?.vencimiento||"")
        .replace(/{prima}/g, (parseFloat(item.poliza?.primaTotal)||parseFloat(item.poliza?.prima)||0).toLocaleString("es-MX"))
        .replace(/{frecuencia}/g, item.poliza?.formaPago||"");
    }
    window.open(`https://wa.me/52${tel}?text=${encodeURIComponent(msg)}`, "_blank");
    registrarEnvio(item, "WhatsApp");
  };

  // Enviar correo
  const enviarCorreo = (item) => {
    const email = item.cliente?.email||item.poliza?.emailCliente||"";
    if (!email) { showToast("El cliente no tiene correo registrado","#dc2626"); return; }
    const asunto = item.tipo==="cumpleanos"
      ? `Feliz cumpleanos ${item.cliente?.nombre}!`
      : `Tu poliza ${item.poliza?.numero} vence pronto`;
    const cuerpo = item.tipo==="cumpleanos"
      ? (plantillas.email_cumpleanos||"").replace(/{nombre}/g,item.cliente?.nombre||"")
      : (plantillas.email_vencimiento||"")
          .replace(/{nombre}/g,item.cliente?.nombre||"")
          .replace(/{numero}/g,item.poliza?.numero||"")
          .replace(/{aseguradora}/g,item.poliza?.aseguradora||"")
          .replace(/{vencimiento}/g,item.poliza?.vencimiento||"");
    window.open(`mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`);
    registrarEnvio(item, "Correo");
  };

  const showToast = (msg, color="#059669") => {
    setToast({msg, color});
    setTimeout(()=>setToast(null), 3000);
  };

  // Claves de plantillas por canal
  const keyWA    = (tipo) => tipo;
  const keyEmail = (tipo) => `email_${tipo}`;
  const keyAsunto = (tipo) => `asunto_${tipo}`;

  const tipo = PLANTILLAS_TIPOS.find(t=>t.key===tipoActivo);

  // Aplicar variables a texto
  const aplicarVars = (tpl, p) => (tpl||"")
    .replace(/{nombre}/g,      p?.cliente?.split(" ")[0]||"María")
    .replace(/{numero}/g,      p?.numero||"GNP-2024-001234")
    .replace(/{aseguradora}/g, p?.aseguradora||"GNP")
    .replace(/{ramo}/g,        p?.subramo?`${p.ramo} - ${p.subramo}`:(p?.ramo||"Vida"))
    .replace(/{vencimiento}/g, p?.vencimiento||"2025-01-15")
    .replace(/{prima}/g,       (p?.primaTotal||p?.prima||8400).toLocaleString("es-MX"))
    .replace(/{frecuencia}/g,  p?.formaPago||"Anual")
    .replace(/{fecha}/g,       new Date().toLocaleDateString("es-MX"));

  const demoPoliza = clienteDemo
    ? polizas.find(p=>p.clienteId===clienteDemo.id)||{cliente:clienteDemo.nombre+" "+clienteDemo.apellidoPaterno}
    : {cliente:"María González",numero:"GNP-2024-001234",aseguradora:"GNP",ramo:"Vida",subramo:"Vida Individual",vencimiento:"2025-06-15",primaTotal:8400,formaPago:"Anual"};

  // Insertar variable en cursor
  const insertarVar = (v, editorId) => {
    const ta = document.getElementById(editorId);
    if (!ta) return;
    const s=ta.selectionStart, e=ta.selectionEnd;
    const key = canal==="whatsapp" ? keyWA(tipoActivo) : keyEmail(tipoActivo);
    const val = plantillas[key]||"";
    const nuevo = val.slice(0,s)+v+val.slice(e);
    setPlantillas(p=>({...p,[key]:nuevo}));
    setTimeout(()=>{ ta.focus(); ta.setSelectionRange(s+v.length,s+v.length); },10);
  };

  // Subir imagen para correo
  const subirImagen = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const key = keyEmail(tipoActivo);
      const img = `\n<img src="${ev.target.result}" alt="imagen" style="max-width:100%;border-radius:8px;margin:10px 0;" />\n`;
      setPlantillas(p=>({...p,[key]:(p[key]||"")+img}));
      showToast("Imagen agregada a la plantilla");
    };
    r.readAsDataURL(file);
  };

  // Test de correo
  const enviarTest = async () => {
    if (!testEmail) { showToast("Escribe un correo para la prueba","#dc2626"); return; }
    setTestando(true);
    try {
      const res = await fetch("/api/email", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          to: testEmail,
          subject: "Prueba de correo — "+( config.nombre||"CRM Seguros"),
          html: `<p>Este es un correo de prueba enviado desde tu CRM.</p><p>Si lo recibes, la configuracion SMTP esta correcta.</p>`,
          smtp: smtpForm,
        })
      });
      if (res.ok) showToast("Correo de prueba enviado correctamente");
      else showToast("Error al enviar. Verifica la configuracion SMTP","#dc2626");
    } catch { showToast("No se pudo conectar con el servidor","#dc2626"); }
    setTestando(false);
  };

  const guardarSMTP = () => {
    setConfig(p=>({...p,...smtpForm}));
    showToast("Configuracion SMTP guardada");
  };

  const SMTP_PROVIDERS = [
    {key:"gmail",   label:"Gmail",   host:"smtp.gmail.com",   port:"587"},
    {key:"outlook", label:"Outlook", host:"smtp.office365.com",port:"587"},
    {key:"yahoo",   label:"Yahoo",   host:"smtp.mail.yahoo.com",port:"587"},
    {key:"otro",    label:"Otro SMTP personalizado", host:"",port:"587"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,background:toast.color||"#059669",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>{toast.msg}</div>}

      <SectionTitle title="Comunicacion" sub="Plantillas de WhatsApp y correo electronico para tus clientes"/>

      {/* Selector de canal */}
      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:12,padding:4,width:"fit-content"}}>
        {[["notificaciones","🔔 Notificaciones"],["whatsapp","💬 WhatsApp"],["correo","✉️ Correo"]].map(([c,l])=>(
          <button key={c} onClick={()=>setCanal(c)}
            style={{background:canal===c?"#fff":"none",border:"none",borderRadius:9,padding:"9px 20px",
              fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
              color:canal===c?"#111827":"#6b7280",
              boxShadow:canal===c?"0 1px 4px rgba(0,0,0,0.1)":"none",transition:"all .15s",
              position:"relative"}}>
            {l}
            {c==="notificaciones"&&pendientes.length>0&&(
              <span style={{position:"absolute",top:4,right:4,background:"#dc2626",color:"#fff",
                borderRadius:"50%",width:16,height:16,fontSize:9,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                {pendientes.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB NOTIFICACIONES ── */}
      {canal==="notificaciones"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>

          {/* Pendientes del día */}
          <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
            <div style={{background:"#0f172a",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{color:"#f1f5f9",fontWeight:800,fontSize:14,fontFamily:"'Playfair Display',serif"}}>
                📋 Notificaciones pendientes hoy
              </div>
              {pendientes.length>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:20,padding:"2px 10px",fontSize:12,fontWeight:800}}>{pendientes.length}</span>}
            </div>
            {pendientes.length===0?(
              <div style={{padding:"32px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                <div style={{fontSize:36,marginBottom:8}}>✅</div>
                Sin notificaciones pendientes por hoy
              </div>
            ):(
              <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
                {pendientes.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                    background:"#f9fafb",borderRadius:10,border:`1.5px solid ${item.color}33`}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:item.color,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#111827"}}>
                        {item.cliente?.nombre} {item.cliente?.apellidoPaterno||""}
                      </div>
                      <div style={{fontSize:11,color:"#6b7280"}}>
                        {item.label} {item.poliza?`· ${item.poliza.numero}`:""}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>enviarWA(item)}
                        style={{background:"#25d366",color:"#fff",border:"none",borderRadius:7,
                          padding:"5px 11px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        💬 WA
                      </button>
                      <button onClick={()=>enviarCorreo(item)}
                        style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:7,
                          padding:"5px 11px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        ✉️
                      </button>
                      <button onClick={()=>registrarEnvio(item,"—",true)}
                        style={{background:"#f3f4f6",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:7,
                          padding:"5px 11px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        Omitir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reglas de notificación */}
          <div style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#111827",marginBottom:14,fontFamily:"'Playfair Display',serif"}}>
              ⚙️ Reglas de envío automático
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {Object.entries(reglas).map(([key,regla])=>(
                <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",
                  background:regla.activo?"#f0fdf4":"#f9fafb",borderRadius:10,
                  border:`1.5px solid ${regla.activo?"#86efac":"#e5e7eb"}`}}>
                  <button onClick={()=>guardarRegla(key,{activo:!regla.activo})}
                    style={{width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",
                      background:regla.activo?"#059669":"#d1d5db",position:"relative",transition:"all .2s",flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",
                      position:"absolute",top:2,transition:"all .2s",
                      left:regla.activo?20:2}}/>
                  </button>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#111827"}}>{regla.label}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {["whatsapp","correo","ambos"].map(c=>(
                      <button key={c} onClick={()=>guardarRegla(key,{canal:c})}
                        style={{background:regla.canal===c?"#0f172a":"#f3f4f6",
                          color:regla.canal===c?"#fff":"#6b7280",border:"none",
                          borderRadius:6,padding:"3px 8px",fontSize:10,fontWeight:700,
                          cursor:"pointer",fontFamily:"inherit"}}>
                        {c==="whatsapp"?"💬":c==="correo"?"✉️":"💬✉️"}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#111827",fontFamily:"'Playfair Display',serif"}}>📜 Historial de envíos</div>
              {(historialNotif||[]).length>0&&(
                <button onClick={()=>{if(window.confirm("¿Limpiar historial?"))setHistorialNotif([]);}}
                  style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,
                    padding:"4px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  Limpiar
                </button>
              )}
            </div>
            {(historialNotif||[]).length===0?(
              <div style={{padding:"24px",textAlign:"center",color:"#9ca3af",fontSize:13}}>Sin envíos registrados</div>
            ):(
              <div style={{maxHeight:320,overflowY:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f9fafb"}}>
                      {["Fecha","Cliente","Tipo","Canal","Estado"].map(h=>(
                        <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,fontWeight:700,color:"#6b7280"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(historialNotif||[]).map((h,i)=>(
                      <tr key={i} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                        <td style={{padding:"7px 12px",color:"#6b7280",whiteSpace:"nowrap"}}>{h.fecha} {h.hora}</td>
                        <td style={{padding:"7px 12px",fontWeight:600,color:"#111827"}}>{h.cliente}</td>
                        <td style={{padding:"7px 12px",color:"#6b7280"}}>{h.label}</td>
                        <td style={{padding:"7px 12px"}}>
                          <span style={{background:h.canal==="WhatsApp"?"#f0fdf4":"#eff6ff",
                            color:h.canal==="WhatsApp"?"#059669":"#2563eb",
                            padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>
                            {h.canal==="WhatsApp"?"💬 WA":"✉️ Correo"}
                          </span>
                        </td>
                        <td style={{padding:"7px 12px"}}>
                          <span style={{background:h.estado==="enviada"?"#f0fdf4":"#f9fafb",
                            color:h.estado==="enviada"?"#059669":"#6b7280",
                            padding:"1px 7px",borderRadius:10,fontSize:10,fontWeight:700}}>
                            {h.estado==="enviada"?"✅ Enviada":"⏭ Omitida"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {canal!=="notificaciones"&&(
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:18,alignItems:"start"}}>

        {/* Panel izquierdo — tipos de plantilla */}
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:10,fontWeight:800,color:"#9ca3af",letterSpacing:"0.08em",marginBottom:4}}>TIPO DE MENSAJE</div>
          {PLANTILLAS_TIPOS.map(t=>(
            <button key={t.key} onClick={()=>setTipoActivo(t.key)}
              style={{background:tipoActivo===t.key?t.color+"18":"#fff",
                border:`1.5px solid ${tipoActivo===t.key?t.color:"#e5e7eb"}`,
                borderRadius:10,padding:"10px 13px",cursor:"pointer",fontFamily:"inherit",
                textAlign:"left",transition:"all .15s"}}>
              <div style={{fontWeight:700,fontSize:12,color:tipoActivo===t.key?t.color:"#374151"}}>
                {t.icon} {t.label}
              </div>
              <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{t.desc}</div>
            </button>
          ))}

          {/* Variables */}
          <div style={{background:"#f8fafc",borderRadius:10,padding:"11px 13px",marginTop:6,border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:7,letterSpacing:"0.06em"}}>VARIABLES</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {VARS_DISPONIBLES.map(v=>(
                <span key={v} onClick={()=>insertarVar(v, canal==="whatsapp"?"editor-wa":"editor-email")}
                  style={{background:"#dbeafe",color:"#1d4ed8",fontSize:9,padding:"2px 7px",borderRadius:5,
                    fontFamily:"monospace",cursor:"pointer",fontWeight:700}}
                  title="Clic para insertar">
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Demo cliente */}
          <div style={{background:"#f8fafc",borderRadius:10,padding:"11px 13px",border:"1px solid #e5e7eb"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:7}}>VISTA PREVIA CON</div>
            <select value={clienteDemo?.id||""}
              onChange={e=>{const c=clientes.find(x=>x.id===Number(e.target.value));setClienteDemo(c||null);}}
              style={{border:"1.5px solid #e5e7eb",borderRadius:7,padding:"6px 8px",fontSize:11,outline:"none",fontFamily:"inherit",background:"#fff",width:"100%"}}>
              <option value="">Datos de ejemplo</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nombre} {c.apellidoPaterno}</option>)}
            </select>
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>

          {/* ── WHATSAPP ── */}
          {canal==="whatsapp"&&(
            <>
              <div style={{background:tipo.color+"12",borderRadius:11,padding:"12px 16px",border:`1.5px solid ${tipo.color}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:tipo.color}}>{tipo.icon} {tipo.label} — WhatsApp</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{tipo.desc} · Texto sin emojis para mayor compatibilidad</div>
                </div>
                <button onClick={()=>{setPlantillas(p=>({...p,[keyWA(tipoActivo)]:plantillasDefault[tipoActivo]}));showToast("Plantilla restaurada");}}
                  style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#6b7280"}}>
                  Restaurar
                </button>
              </div>

              <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:8,letterSpacing:"0.06em"}}>MENSAJE</div>
                <textarea id="editor-wa"
                  value={plantillas[keyWA(tipoActivo)]||""}
                  onChange={e=>setPlantillas(p=>({...p,[keyWA(tipoActivo)]:e.target.value}))}
                  rows={9}
                  placeholder="Escribe el mensaje de WhatsApp sin emojis..."
                  style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"11px 13px",
                    fontSize:13,fontFamily:"inherit",lineHeight:1.7,outline:"none",
                    boxSizing:"border-box",resize:"vertical"}}/>
                <button onClick={()=>showToast("Plantilla guardada")}
                  style={{marginTop:10,background:"#25d366",border:"none",borderRadius:8,padding:"9px 22px",
                    fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
                  Guardar plantilla
                </button>
              </div>

              {/* Preview WhatsApp */}
              <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:10}}>VISTA PREVIA</div>
                <div style={{background:"#e9fbe9",borderRadius:"0 12px 12px 12px",padding:"12px 16px",maxWidth:"85%",boxShadow:"0 1px 3px rgba(0,0,0,0.08)"}}>
                  <pre style={{margin:0,fontSize:12,color:"#111",whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.7}}>
                    {aplicarVars(plantillas[keyWA(tipoActivo)], demoPoliza)}
                  </pre>
                  <div style={{fontSize:10,color:"#6b7280",textAlign:"right",marginTop:6}}>12:00 ✓✓</div>
                </div>
                {clienteDemo?.whatsapp&&(
                  <button onClick={()=>{
                    const msg=encodeURIComponent(aplicarVars(plantillas[keyWA(tipoActivo)],demoPoliza));
                    const tel=(clienteDemo.whatsapp||"").replace(/\D/g,"");
                    window.open(`https://wa.me/52${tel}?text=${msg}`,"_blank");
                  }}
                    style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:8,background:"#25d366",border:"none",
                      borderRadius:9,padding:"9px 20px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
                    Enviar WhatsApp a {clienteDemo.nombre}
                  </button>
                )}
              </div>
            </>
          )}

          {/* ── CORREO ── */}
          {canal==="correo"&&(
            <>
              {/* Sub-tabs correo */}
              <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:10,padding:3,width:"fit-content"}}>
                {[["plantilla","📝 Plantilla"],["smtp","⚙️ Config. SMTP"]].map(([t,l])=>(
                  <button key={t} onClick={()=>setTabCorreo(t)}
                    style={{background:tabCorreo===t?"#fff":"none",border:"none",borderRadius:8,padding:"7px 18px",
                      fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",
                      color:tabCorreo===t?"#111827":"#6b7280",
                      boxShadow:tabCorreo===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
                    {l}
                  </button>
                ))}
              </div>

              {tabCorreo==="plantilla"&&(
                <>
                  <div style={{background:tipo.color+"12",borderRadius:11,padding:"12px 16px",border:`1.5px solid ${tipo.color}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14,color:tipo.color}}>{tipo.icon} {tipo.label} — Correo</div>
                      <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Puedes usar HTML basico y subir imagenes</div>
                    </div>
                    <button onClick={()=>{setPlantillas(p=>({...p,[keyEmail(tipoActivo)]:plantillasDefault[keyEmail(tipoActivo)]||""}));showToast("Plantilla restaurada");}}
                      style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#6b7280"}}>
                      Restaurar
                    </button>
                  </div>

                  {/* Asunto */}
                  <div style={{background:"#fff",borderRadius:11,padding:14,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:6}}>ASUNTO DEL CORREO</div>
                    <input value={plantillas[keyAsunto(tipoActivo)]||""}
                      onChange={e=>setPlantillas(p=>({...p,[keyAsunto(tipoActivo)]:e.target.value}))}
                      placeholder="Ej: Tu poliza {numero} vence pronto — {aseguradora}"
                      style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 13px",
                        fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>

                  {/* Cuerpo */}
                  <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <div style={{fontSize:10,fontWeight:800,color:"#6b7280"}}>CUERPO DEL CORREO</div>
                      <div style={{display:"flex",gap:7}}>
                        <input ref={imgRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>subirImagen(e.target.files[0])}/>
                        <button onClick={()=>imgRef.current.click()}
                          style={{background:"#eff6ff",border:"1.5px solid #bfdbfe",borderRadius:7,padding:"5px 12px",
                            fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#1d4ed8",display:"flex",alignItems:"center",gap:4}}>
                          🖼️ Subir imagen
                        </button>
                      </div>
                    </div>
                    <textarea id="editor-email"
                      value={plantillas[keyEmail(tipoActivo)]||""}
                      onChange={e=>setPlantillas(p=>({...p,[keyEmail(tipoActivo)]:e.target.value}))}
                      rows={12}
                      placeholder={`Estimado/a {nombre},\n\nTe informamos que tu poliza {numero} de {aseguradora} vence el {vencimiento}.\n\nPara renovar, contactanos.\n\nSaludos,\n${config.nombre||"Tu Agente de Seguros"}`}
                      style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"11px 13px",
                        fontSize:13,fontFamily:"inherit",lineHeight:1.7,outline:"none",
                        boxSizing:"border-box",resize:"vertical"}}/>
                    <div style={{fontSize:10,color:"#9ca3af",marginTop:6}}>Puedes usar HTML basico: &lt;b&gt;negrita&lt;/b&gt;, &lt;i&gt;italica&lt;/i&gt;, &lt;br&gt; para salto de linea</div>
                    <button onClick={()=>showToast("Plantilla de correo guardada")}
                      style={{marginTop:10,background:"#2563eb",border:"none",borderRadius:8,padding:"9px 22px",
                        fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
                      Guardar plantilla
                    </button>
                  </div>

                  {/* Preview correo */}
                  <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#6b7280",marginBottom:10}}>VISTA PREVIA</div>
                    <div style={{border:"1.5px solid #e5e7eb",borderRadius:10,overflow:"hidden"}}>
                      <div style={{background:"#f9fafb",padding:"10px 16px",borderBottom:"1px solid #e5e7eb"}}>
                        <div style={{fontSize:11,color:"#6b7280"}}>De: <strong>{smtpForm.smtpFromName||config.nombre||"Tu Agente"}</strong> &lt;{smtpForm.smtpUser||"tucorreo@gmail.com"}&gt;</div>
                        <div style={{fontSize:12,fontWeight:700,color:"#111827",marginTop:3}}>
                          Asunto: {aplicarVars(plantillas[keyAsunto(tipoActivo)]||"Sin asunto", demoPoliza)}
                        </div>
                      </div>
                      <div style={{padding:"14px 16px",maxHeight:200,overflowY:"auto"}}
                        dangerouslySetInnerHTML={{__html:aplicarVars(plantillas[keyEmail(tipoActivo)]||"", demoPoliza).replace(/\n/g,"<br/>")}}/>
                    </div>
                    {clienteDemo?.email&&(
                      <a href={`mailto:${clienteDemo.email}?subject=${encodeURIComponent(aplicarVars(plantillas[keyAsunto(tipoActivo)]||"", demoPoliza))}&body=${encodeURIComponent(aplicarVars(plantillas[keyEmail(tipoActivo)]||"", demoPoliza))}`}
                        style={{marginTop:12,display:"inline-flex",alignItems:"center",gap:8,background:"#2563eb",border:"none",
                          borderRadius:9,padding:"9px 20px",fontSize:13,fontWeight:700,color:"#fff",textDecoration:"none"}}>
                        Enviar correo a {clienteDemo.nombre}
                      </a>
                    )}
                  </div>
                </>
              )}

              {tabCorreo==="smtp"&&(
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div style={{background:"#eff6ff",borderRadius:11,padding:"12px 16px",border:"1.5px solid #bfdbfe",fontSize:12,color:"#1e40af"}}>
                    <strong>Como configurar Gmail:</strong> Ve a tu cuenta Google → Seguridad → Verificacion en 2 pasos (activa) → Contrasenas de aplicacion → genera una para "Correo". Usa esa contrasena aqui, no la de tu cuenta.
                  </div>

                  {/* Proveedor */}
                  <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10}}>PROVEEDOR DE CORREO</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                      {SMTP_PROVIDERS.map(p=>(
                        <button key={p.key} onClick={()=>{
                          setSmtpForm(f=>({...f,smtpProvider:p.key,smtpHost:p.host,smtpPort:p.port}));
                        }}
                          style={{background:smtpForm.smtpProvider===p.key?"#0f172a":"#f9fafb",
                            color:smtpForm.smtpProvider===p.key?"#fff":"#374151",
                            border:`1.5px solid ${smtpForm.smtpProvider===p.key?"#0f172a":"#e5e7eb"}`,
                            borderRadius:9,padding:"9px 6px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:5}}>SERVIDOR SMTP</div>
                        <input value={smtpForm.smtpHost} onChange={e=>setSmtpForm(f=>({...f,smtpHost:e.target.value}))}
                          placeholder="smtp.gmail.com"
                          style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:5}}>PUERTO</div>
                        <input value={smtpForm.smtpPort} onChange={e=>setSmtpForm(f=>({...f,smtpPort:e.target.value}))}
                          placeholder="587"
                          style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:5}}>CORREO REMITENTE</div>
                        <input value={smtpForm.smtpUser} onChange={e=>setSmtpForm(f=>({...f,smtpUser:e.target.value}))}
                          placeholder="tucorreo@gmail.com"
                          style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:5}}>CONTRASENA DE APP</div>
                        <input type="password" value={smtpForm.smtpPass} onChange={e=>setSmtpForm(f=>({...f,smtpPass:e.target.value}))}
                          placeholder="xxxx xxxx xxxx xxxx"
                          style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div style={{gridColumn:"1/-1"}}>
                        <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:5}}>NOMBRE DEL REMITENTE</div>
                        <input value={smtpForm.smtpFromName} onChange={e=>setSmtpForm(f=>({...f,smtpFromName:e.target.value}))}
                          placeholder={config.nombre||"García Seguros"}
                          style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                    </div>
                    <button onClick={guardarSMTP}
                      style={{marginTop:14,background:"#0f172a",border:"none",borderRadius:9,padding:"10px 24px",
                        fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
                      Guardar configuracion SMTP
                    </button>
                  </div>

                  {/* Test */}
                  <div style={{background:"#fff",borderRadius:11,padding:16,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
                    <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10}}>ENVIAR CORREO DE PRUEBA</div>
                    <div style={{display:"flex",gap:10}}>
                      <input value={testEmail} onChange={e=>setTestEmail(e.target.value)}
                        placeholder="correo@destino.com"
                        style={{flex:1,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                      <button onClick={enviarTest} disabled={testando}
                        style={{background:testando?"#e5e7eb":"#059669",border:"none",borderRadius:8,padding:"9px 20px",
                          fontSize:13,fontWeight:700,cursor:testando?"not-allowed":"pointer",fontFamily:"inherit",color:testando?"#9ca3af":"#fff",whiteSpace:"nowrap"}}>
                        {testando?"Enviando...":"Enviar prueba"}
                      </button>
                    </div>
                    <div style={{fontSize:11,color:"#9ca3af",marginTop:6}}>
                      Requiere que el servidor /api/email este configurado en Vercel.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
// COMISIONES
// ═══════════════════════════════════════════════════════════════════
function Comisiones({ polizas, subagentes, tablaComisiones, setTablaComisiones, pagosComision, setPagosComision, onMontarCallbacks }) {
  useEffect(()=>{ if(onMontarCallbacks) onMontarCallbacks(); },[]);
  const [tab, setTab] = useState("resumen");
  const [mesSelec, setMesSelec] = useState(new Date().getMonth());
  const [anioSelec, setAnioSelec] = useState(new Date().getFullYear());
  const [showModalTabla, setShowModalTabla] = useState(false);
  const [formTabla, setFormTabla] = useState({ramo:"Autos",aseguradora:"GNP",porcentaje:""});
  const [editandoTabla, setEditandoTabla] = useState(null);
  // Importar Excel
  const [excelFile, setExcelFile] = useState(null);
  const [excelData, setExcelData] = useState(null);  // filas extraídas
  const [procesando, setProcesando] = useState(false);
  const [resultados, setResultados] = useState([]); // pólizas encontradas
  const [aplicados, setAplicados] = useState({}); // id => aplicado
  const excelRef = useRef();

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const RAMOS_COM = ["Autos","Vida","Gastos Médicos","Daños"];
  const ASEG_COM = ["GNP","AXA","HDI","SURA","Qualitas","Zurich","Mapfre","Allianz","MetLife","Inbursa","Bupa","Chubb","BBVA Seguros","Otra"];

  const getPct = (p) => {
    const t = tablaComisiones.find(t=>t.ramo===p.ramo&&t.aseguradora===p.aseguradora)
           || tablaComisiones.find(t=>t.ramo===p.ramo&&t.aseguradora==="Otra");
    return t ? parseFloat(t.porcentaje)||0 : 0;
  };

  const polizasMes = polizas.filter(p=>{
    if (p.status==="cancelada") return false;
    return (p.pagos||[]).some(pg=>{
      const f=new Date(pg.fechaPago||"");
      return f.getMonth()===mesSelec&&f.getFullYear()===anioSelec;
    });
  });

  const comisionesMes = polizasMes.map(p=>{
    const pagosMes=(p.pagos||[]).filter(pg=>{const f=new Date(pg.fechaPago||"");return f.getMonth()===mesSelec&&f.getFullYear()===anioSelec;});
    const montoPagado=pagosMes.reduce((a,pg)=>a+(parseFloat(pg.monto)||0),0);
    const pct=getPct(p);
    const comisionBruta=montoPagado*pct/100;
    const reg=pagosComision.find(pc=>pc.polizaId===p.id&&pc.mes===mesSelec&&pc.anio===anioSelec&&!pc.subagentId);
    return {poliza:p,montoPagado,pct,comisionBruta,estado:reg?.estado||"pendiente"};
  }).filter(c=>c.comisionBruta>0);

  const totalMes=comisionesMes.reduce((a,c)=>a+c.comisionBruta,0);
  const totalPendiente=comisionesMes.filter(c=>c.estado==="pendiente").reduce((a,c)=>a+c.comisionBruta,0);
  const totalCobrado=comisionesMes.filter(c=>c.estado==="cobrada").reduce((a,c)=>a+c.comisionBruta,0);

  const comparativo=Array.from({length:6},(_,i)=>{
    const d=new Date(anioSelec,mesSelec-i,1);const m=d.getMonth();const a=d.getFullYear();
    const total=polizas.reduce((sum,p)=>{
      const pct=getPct(p);
      const pagos=(p.pagos||[]).filter(pg=>{const f=new Date(pg.fechaPago||"");return f.getMonth()===m&&f.getFullYear()===a;});
      return sum+(pagos.reduce((s,pg)=>s+(parseFloat(pg.monto)||0),0)*pct/100);
    },0);
    return {mes:`${MESES[m].slice(0,3)} ${a}`,total};
  }).reverse();
  const maxComp=Math.max(...comparativo.map(c=>c.total),1);

  const comisionesSubagentes=subagentes.map(sa=>{
    const polizasSA=polizas.filter(p=>p.subagente===sa.nombre||p.subagente===sa.id||p.subagente===String(sa.id));
    const detalle=polizasSA.map(p=>{
      const pagosMes=(p.pagos||[]).filter(pg=>{const f=new Date(pg.fechaPago||"");return f.getMonth()===mesSelec&&f.getFullYear()===anioSelec;});
      const montoPagado=pagosMes.reduce((a,pg)=>a+(parseFloat(pg.monto)||0),0);
      const pctSA=parseFloat(sa.comision)||0;
      const impuestos=parseFloat(sa.impuestos)||15;
      const comisionBruta=montoPagado*pctSA/100;
      const montoImpuestos=comisionBruta*impuestos/100;
      const comisionNeta=comisionBruta-montoImpuestos;
      const reg=pagosComision.find(pc=>pc.subagentId===sa.id&&pc.polizaId===p.id&&pc.mes===mesSelec&&pc.anio===anioSelec);
      return {poliza:p,montoPagado,comisionBruta,montoImpuestos,comisionNeta,pctSA,impuestos,estado:reg?.estado||"pendiente"};
    }).filter(d=>d.comisionBruta>0);
    return {sa,detalle,totalBruto:detalle.reduce((a,d)=>a+d.comisionBruta,0),totalImp:detalle.reduce((a,d)=>a+d.montoImpuestos,0),totalNeto:detalle.reduce((a,d)=>a+d.comisionNeta,0)};
  }).filter(c=>c.totalBruto>0);

  const aplicarPago = (r) => {
    if (!r.poliza || !r.encontrada) return;
    // Registrar pago en la póliza
    const nuevoPago = {
      id: Date.now(),
      fechaPago: r.fechaPago || new Date().toISOString().slice(0,10),
      monto: r.primaBase || 0,
      formaPago: "Transferencia",
      reciboNum: r.recibo || "",
      comisionAgente: r.importe || 0,
      origenExcel: true,
    };
    // Actualizar póliza con el pago
    if (typeof window.__setPolizasComision === "function") {
      window.__setPolizasComision(r.poliza.id, nuevoPago, r);
    }
    setAplicados(prev=>({...prev,[r.id]:true}));
  };

  // Referencia a setPolizas — se inyecta desde el prop
  useEffect(()=>{
    window.__setPolizasComision = (polizaId, pago, r) => {
      // Este callback se conecta desde afuera via prop onAplicarPago
      if (typeof window.__onAplicarPagoComision === "function") {
        window.__onAplicarPagoComision(polizaId, pago, r);
      }
    };
  },[]);

  const marcarEstado=(polizaId,estado)=>{
    const existe=pagosComision.find(pc=>pc.polizaId===polizaId&&pc.mes===mesSelec&&pc.anio===anioSelec&&!pc.subagentId);
    if(existe) setPagosComision(prev=>prev.map(pc=>pc.id===existe.id?{...pc,estado}:pc));
    else setPagosComision(prev=>[...prev,{id:Date.now(),polizaId,mes:mesSelec,anio:anioSelec,estado,fecha:new Date().toLocaleDateString("es-MX")}]);
  };

  const marcarEstadoSA=(saId,polizaId,estado)=>{
    const existe=pagosComision.find(pc=>pc.subagentId===saId&&pc.polizaId===polizaId&&pc.mes===mesSelec&&pc.anio===anioSelec);
    if(existe) setPagosComision(prev=>prev.map(pc=>pc.id===existe.id?{...pc,estado}:pc));
    else setPagosComision(prev=>[...prev,{id:Date.now(),subagentId:saId,polizaId,mes:mesSelec,anio:anioSelec,estado,fecha:new Date().toLocaleDateString("es-MX")}]);
  };

  const guardarTabla=()=>{
    if(!formTabla.ramo||!formTabla.aseguradora||!formTabla.porcentaje) return;
    if(editandoTabla) setTablaComisiones(prev=>prev.map(t=>t.id===editandoTabla?{...t,...formTabla}:t));
    else setTablaComisiones(prev=>[...prev,{...formTabla,id:Date.now()}]);
    setShowModalTabla(false); setEditandoTabla(null); setFormTabla({ramo:"Autos",aseguradora:"GNP",porcentaje:""});
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <SectionTitle title="Comisiones" sub="Control de comisiones del agente y subagentes"/>
        <div style={{display:"flex",gap:8}}>
          <select value={mesSelec} onChange={e=>setMesSelec(Number(e.target.value))}
            style={{background:"#0f172a",border:"none",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,color:"#fff",cursor:"pointer",outline:"none",appearance:"none",fontFamily:"inherit"}}>
            {MESES.map((m,i)=><option key={i} value={i} style={{background:"#0f172a"}}>{m}</option>)}
          </select>
          <select value={anioSelec} onChange={e=>setAnioSelec(Number(e.target.value))}
            style={{background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:9,padding:"8px 14px",fontSize:13,fontWeight:700,color:"#374151",cursor:"pointer",outline:"none",appearance:"none",fontFamily:"inherit"}}>
            {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[
          {label:"Comisión total del mes",value:`$${totalMes.toLocaleString("es-MX",{maximumFractionDigits:0})}`,accent:"#2563eb",icon:"trophy",sub:`${comisionesMes.length} pólizas`},
          {label:"Pendiente de cobrar",value:`$${totalPendiente.toLocaleString("es-MX",{maximumFractionDigits:0})}`,accent:"#d97706",icon:"bell",sub:`${comisionesMes.filter(c=>c.estado==="pendiente").length} pólizas`},
          {label:"Ya cobrado",value:`$${totalCobrado.toLocaleString("es-MX",{maximumFractionDigits:0})}`,accent:"#059669",icon:"clients",sub:`${comisionesMes.filter(c=>c.estado==="cobrada").length} pólizas`},
        ].map(({label,value,accent,icon,sub})=>(
          <div key={label} style={{background:"#fff",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",borderTop:`3px solid ${accent}`,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:14,top:14,background:accent+"15",color:accent,borderRadius:10,padding:7,display:"flex"}}><Icon name={icon} size={18}/></div>
            <div style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{label}</div>
            <div style={{fontSize:28,fontWeight:700,color:"#0f172a",fontFamily:"'Inter',sans-serif",letterSpacing:"-0.5px"}}>{value}</div>
            <div style={{fontSize:11,color:accent,fontWeight:600,marginTop:4}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:12,padding:4,width:"fit-content"}}>
        {[["resumen","📊 Resumen"],["tabla","⚙️ Tabla %"],["importar","📥 Importar Excel"],["subagentes","👥 Subagentes"],["historial","📜 Historial"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{background:tab===t?"#fff":"none",border:"none",borderRadius:9,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:tab===t?"#111827":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none"}}>
            {l}
          </button>
        ))}
      </div>

      {/* IMPORTAR EXCEL */}
      {tab==="importar"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#eff6ff",borderRadius:12,padding:"14px 18px",border:"1px solid #bfdbfe",fontSize:13,color:"#1e40af"}}>
            <div style={{fontWeight:800,marginBottom:4}}>📥 Lector IA de Excel de comisiones</div>
            <div style={{fontSize:12}}>Sube el reporte de actividades de tu aseguradora. La IA identificará automáticamente las pólizas, primas pagadas, comisiones e importes. Compatible con GNP NewTron, TronWeb y otros formatos.</div>
          </div>

          {/* Subir archivo */}
          {!excelData&&(
            <div style={{background:"#fff",borderRadius:14,padding:"32px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:"2px dashed #e2e8f0"}}>
              <div style={{fontSize:40,marginBottom:12}}>📊</div>
              <div style={{fontSize:14,fontWeight:700,color:"#374151",marginBottom:6}}>Sube tu Excel de comisiones</div>
              <div style={{fontSize:12,color:"#9ca3af",marginBottom:16}}>Formatos soportados: .xlsx, .xls</div>
              <input ref={excelRef} type="file" accept=".xlsx,.xls" style={{display:"none"}}
                onChange={async (e)=>{
                  const file = e.target.files[0];
                  if (!file) return;
                  setExcelFile(file.name);
                  setProcesando(true);
                  setResultados([]);
                  setAplicados({});
                  // Leer Excel con SheetJS
                  try {
                    const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
                    const buffer = await file.arrayBuffer();
                    const wb = XLSX.read(buffer);
                    // Extraer todas las hojas
                    let filas = [];
                    wb.SheetNames.forEach(sheetName=>{
                      const ws = wb.Sheets[sheetName];
                      const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:""});
                      rows.forEach(row=>{
                        // Filtrar filas con número de póliza (columna 1, index 1)
                        const polizaNum = String(row[1]||"").trim();
                        if (polizaNum && polizaNum.length >= 8 && !isNaN(polizaNum.replace(/\D/g,""))) {
                          const clave = String(row[6]||"").trim();
                          if (clave==="CT"||clave==="ct"||clave==="Ct"||clave==="") {
                            // Parsear fecha de la última columna (DDMMYYYY)
                            const fechaRaw = String(row[row.length-1]||"").trim();
                            let fechaPago = "";
                            if (/^\d{8}$/.test(fechaRaw)) {
                              fechaPago = `${fechaRaw.slice(6,8)}/${fechaRaw.slice(4,6)}/${fechaRaw.slice(0,4)}`.replace(/^(\d{2})\/(\d{2})\/(\d{4})$/,"$3-$2-$1");
                            }
                            filas.push({
                              polizaNum,
                              endoso: String(row[2]||"").trim(),
                              ramo: String(row[3]||"").trim(),
                              recibo: String(row[4]||"").trim(),
                              cliente: String(row[7]||"").trim(),
                              primaBase: parseFloat(String(row[8]||"0").replace(/[,$]/g,""))||0,
                              importe: parseFloat(String(row[9]||"0").replace(/[,$]/g,""))||0,
                              fechaPago,
                              hoja: sheetName,
                            });
                          }
                        }
                      });
                    });
                    // Buscar cada póliza en el sistema
                    const encontradas = filas.map(f=>{
                      const poliza = polizas.find(p=>{
                        const n = String(p.numero||"").replace(/[\s\-]/g,"");
                        const b = String(f.polizaNum||"").replace(/[\s\-]/g,"");
                        return n===b || n.endsWith(b) || b.endsWith(n);
                      });
                      const subagente = poliza?.subagenteId ? subagentes.find(s=>s.id===poliza.subagenteId) : null;
                      const pctSA = parseFloat(subagente?.comision||0);
                      const isrSA = parseFloat(subagente?.impuestos||15);
                      const comBruta = f.importe > 0 ? f.importe : (f.primaBase * (getPct(poliza||{})/100));
                      const comSABruta = f.primaBase * pctSA / 100;
                      const comSAIsr = comSABruta * isrSA / 100;
                      const comSANeta = comSABruta - comSAIsr;
                      return {
                        ...f,
                        id: Date.now()+Math.random(),
                        poliza,
                        subagente,
                        comisionAgente: comBruta,
                        comSABruta, comSAIsr, comSANeta, pctSA, isrSA,
                        encontrada: !!poliza,
                      };
                    });
                    setResultados(encontradas);
                    setExcelData(filas);
                    setProcesando(false);
                  } catch(err) {
                    setProcesando(false);
                    alert("Error al leer el Excel: "+err.message);
                  }
                }}/>
              <button onClick={()=>excelRef.current.click()}
                style={{background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                📂 Seleccionar archivo Excel
              </button>
            </div>
          )}

          {/* Procesando */}
          {procesando&&(
            <div style={{background:"#fff",borderRadius:14,padding:"40px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
              <div style={{fontSize:36,marginBottom:12}}>🤖</div>
              <div style={{fontWeight:700,fontSize:15,color:"#111827"}}>Procesando Excel...</div>
              <div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>Identificando pólizas y calculando comisiones</div>
            </div>
          )}

          {/* Resultados */}
          {excelData&&!procesando&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {/* Header resultados */}
              <div style={{background:"#fff",borderRadius:14,padding:"16px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontWeight:800,fontSize:14,color:"#111827"}}>{excelFile}</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
                    {resultados.length} registros · {resultados.filter(r=>r.encontrada).length} pólizas encontradas · {resultados.filter(r=>!r.encontrada).length} no encontradas
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{setExcelData(null);setExcelFile(null);setResultados([]);setAplicados({});}}
                    style={{background:"#f3f4f6",color:"#374151",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    🔄 Nuevo archivo
                  </button>
                  <button onClick={()=>{
                    // Aplicar todos los encontrados de una vez
                    resultados.filter(r=>r.encontrada&&!aplicados[r.id]).forEach(r=>{
                      aplicarPago(r);
                    });
                  }} style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    ✅ Aplicar todos
                  </button>
                </div>
              </div>

              {/* Tabla resultados */}
              <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:"#0f172a"}}>
                      {["Póliza","Cliente","Ramo","Prima base","Comisión","Fecha pago","Subagente","Com. SA neta","Estado","Acción"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#fff",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((r,i)=>(
                      <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:!r.encontrada?"#fef2f2":aplicados[r.id]?"#f0fdf4":i%2===0?"#fff":"#fafafa"}}>
                        <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:700,color:r.encontrada?"#1d4ed8":"#dc2626",fontSize:10}}>{r.polizaNum}</td>
                        <td style={{padding:"8px 12px",color:"#374151",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.cliente}</td>
                        <td style={{padding:"8px 12px",color:"#6b7280",fontSize:10}}>{r.ramo}</td>
                        <td style={{padding:"8px 12px",fontWeight:600,color:"#059669"}}>{r.primaBase>0?`$${r.primaBase.toLocaleString("es-MX",{maximumFractionDigits:2})}`:"—"}</td>
                        <td style={{padding:"8px 12px",fontWeight:700,color:"#2563eb"}}>{r.importe>0?`$${r.importe.toLocaleString("es-MX",{maximumFractionDigits:2})}`:"—"}</td>
                        <td style={{padding:"8px 12px",color:"#6b7280",fontSize:10,whiteSpace:"nowrap"}}>{r.fechaPago||"—"}</td>
                        <td style={{padding:"8px 12px",color:"#7c3aed",fontSize:10}}>{r.subagente?`${r.subagente.nombre} (${r.pctSA}%)`:"—"}</td>
                        <td style={{padding:"8px 12px",fontWeight:700,color:"#059669"}}>{r.comSANeta>0?`$${r.comSANeta.toLocaleString("es-MX",{maximumFractionDigits:2})}`:"—"}</td>
                        <td style={{padding:"8px 12px"}}>
                          {!r.encontrada?(
                            <span style={{background:"#fee2e2",color:"#dc2626",padding:"2px 7px",borderRadius:6,fontWeight:700,fontSize:9}}>No encontrada</span>
                          ):aplicados[r.id]?(
                            <span style={{background:"#d1fae5",color:"#059669",padding:"2px 7px",borderRadius:6,fontWeight:700,fontSize:9}}>✓ Aplicado</span>
                          ):(
                            <span style={{background:"#fef3c7",color:"#d97706",padding:"2px 7px",borderRadius:6,fontWeight:700,fontSize:9}}>Pendiente</span>
                          )}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          {r.encontrada&&!aplicados[r.id]&&(
                            <button onClick={()=>aplicarPago(r)}
                              style={{background:"#059669",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                              💳 Aplicar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESUMEN */}
      {tab==="resumen"&&(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#111827",fontFamily:"'Playfair Display',serif",marginBottom:16}}>📈 Comparativo últimos 6 meses</div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120}}>
              {comparativo.map((c,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#374151"}}>{c.total>0?"$"+(c.total/1000).toFixed(1)+"k":"—"}</div>
                  <div style={{width:"100%",background:i===5?"#2563eb":"#dbeafe",borderRadius:"5px 5px 0 0",height:`${Math.max((c.total/maxComp)*100,4)}%`,minHeight:4}}/>
                  <div style={{fontSize:9,color:"#94a3b8",fontWeight:600,textAlign:"center"}}>{c.mes}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:800,color:"#111827",fontFamily:"'Playfair Display',serif"}}>Comisiones — {MESES[mesSelec]} {anioSelec}</div>
              {comisionesMes.filter(c=>c.estado==="pendiente").length>0&&(
                <button onClick={()=>comisionesMes.filter(c=>c.estado==="pendiente").forEach(c=>marcarEstado(c.poliza.id,"cobrada"))}
                  style={{background:"#059669",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  ✅ Marcar todas cobradas
                </button>
              )}
            </div>
            {comisionesMes.length===0?(
              <div style={{padding:"32px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>💰</div>
                Sin comisiones para {MESES[mesSelec]} {anioSelec}
                <div style={{fontSize:11,marginTop:4,color:"#d1d5db"}}>Las comisiones se calculan automáticamente con los pagos registrados y la tabla de %</div>
              </div>
            ):(
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["Póliza","Cliente","Ramo","Aseguradora","Prima cobrada","% Com.","Comisión","Estado",""].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comisionesMes.map((c,i)=>(
                    <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:"#1d4ed8",fontSize:11}}>{c.poliza.numero}</td>
                      <td style={{padding:"9px 12px",fontWeight:600,color:"#111827",whiteSpace:"nowrap"}}>{c.poliza.cliente}</td>
                      <td style={{padding:"9px 12px",color:"#6b7280"}}>{c.poliza.ramo}</td>
                      <td style={{padding:"9px 12px",color:"#6b7280"}}>{c.poliza.aseguradora}</td>
                      <td style={{padding:"9px 12px",fontWeight:700,color:"#059669"}}>${c.montoPagado.toLocaleString("es-MX",{maximumFractionDigits:0})}</td>
                      <td style={{padding:"9px 12px",textAlign:"center"}}><span style={{background:"#eff6ff",color:"#2563eb",padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:11}}>{c.pct}%</span></td>
                      <td style={{padding:"9px 12px",fontWeight:800,color:"#0f172a",fontFamily:"'Inter',sans-serif"}}>${c.comisionBruta.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                      <td style={{padding:"9px 12px"}}><span style={{background:c.estado==="cobrada"?"#d1fae5":"#fef3c7",color:c.estado==="cobrada"?"#059669":"#d97706",padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:10}}>{c.estado==="cobrada"?"✓ Cobrada":"⏳ Pendiente"}</span></td>
                      <td style={{padding:"9px 12px"}}>
                        <button onClick={()=>marcarEstado(c.poliza.id,c.estado==="cobrada"?"pendiente":"cobrada")}
                          style={{background:c.estado==="cobrada"?"#fef2f2":"#f0fdf4",color:c.estado==="cobrada"?"#dc2626":"#059669",border:`1px solid ${c.estado==="cobrada"?"#fecaca":"#bbf7d0"}`,borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                          {c.estado==="cobrada"?"↩ Revertir":"✓ Cobrada"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{background:"#0f172a"}}>
                    <td colSpan={6} style={{padding:"10px 12px",color:"#94a3b8",fontWeight:700,fontSize:11}}>TOTAL {MESES[mesSelec].toUpperCase()} {anioSelec}</td>
                    <td style={{padding:"10px 12px",fontWeight:900,color:"#fff",fontFamily:"'Inter',sans-serif",fontSize:14}}>${totalMes.toLocaleString("es-MX",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                    <td colSpan={2}/>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TABLA % */}
      {tab==="tabla"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 16px",border:"1px solid #bfdbfe",fontSize:12,color:"#1e40af"}}>
            ⚙️ Configura tu porcentaje de comisión por ramo y aseguradora. Se aplica automáticamente al calcular comisiones del mes.
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={()=>setShowModalTabla(true)} color="#2563eb" icon="plus">Agregar porcentaje</Btn>
          </div>
          {tablaComisiones.length===0?(
            <div style={{background:"#fff",borderRadius:14,padding:"40px",textAlign:"center",color:"#9ca3af",fontSize:13,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
              <div style={{fontSize:36,marginBottom:8}}>⚙️</div>
              Agrega tu tabla de porcentajes para comenzar a calcular comisiones automáticamente
            </div>
          ):(
            <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#0f172a"}}>
                    {["Ramo","Aseguradora","% Comisión","Acciones"].map(h=>(
                      <th key={h} style={{padding:"12px 16px",textAlign:"left",color:"#fff",fontWeight:700,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tablaComisiones.map((t,i)=>(
                    <tr key={t.id} style={{borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"10px 16px",fontWeight:700,color:"#111827"}}>{t.ramo}</td>
                      <td style={{padding:"10px 16px",color:"#6b7280"}}>{t.aseguradora}</td>
                      <td style={{padding:"10px 16px"}}><span style={{background:"#dbeafe",color:"#1d4ed8",fontWeight:800,padding:"3px 12px",borderRadius:6,fontSize:13,fontFamily:"'Inter',sans-serif"}}>{t.porcentaje}%</span></td>
                      <td style={{padding:"10px 16px",display:"flex",gap:6}}>
                        <button onClick={()=>{setFormTabla({ramo:t.ramo,aseguradora:t.aseguradora,porcentaje:t.porcentaje});setEditandoTabla(t.id);setShowModalTabla(true);}}
                          style={{background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>✏️ Editar</button>
                        <button onClick={()=>setTablaComisiones(prev=>prev.filter(x=>x.id!==t.id))}
                          style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBAGENTES */}
      {tab==="subagentes"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {comisionesSubagentes.length===0?(
            <div style={{background:"#fff",borderRadius:14,padding:"40px",textAlign:"center",color:"#9ca3af",fontSize:13,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
              <div style={{fontSize:36,marginBottom:8}}>👥</div>
              Sin comisiones de subagentes para {MESES[mesSelec]} {anioSelec}
            </div>
          ):(
            comisionesSubagentes.map(({sa,detalle,totalBruto,totalImp,totalNeto})=>(
              <div key={sa.id} style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{color:"#94a3b8",fontSize:10,fontWeight:700,letterSpacing:"0.06em"}}>SUBAGENTE</div>
                    <div style={{color:"#fff",fontSize:15,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{sa.nombre}</div>
                    <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{sa.comision}% comisión · {sa.impuestos||15}% ISR</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#94a3b8",fontSize:10}}>NETO A PAGAR</div>
                    <div style={{color:"#34d399",fontSize:20,fontWeight:900,fontFamily:"'Inter',sans-serif"}}>${totalNeto.toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
                    <div style={{color:"#64748b",fontSize:10,marginTop:1}}>Bruto ${totalBruto.toLocaleString("es-MX",{maximumFractionDigits:0})} − ISR ${totalImp.toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
                  </div>
                </div>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      {["Póliza","Ramo","Prima","% SA","C. Bruta","ISR","C. Neta","Estado",""].map(h=>(
                        <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:10,whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.map((d,i)=>(
                      <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                        <td style={{padding:"8px 12px",fontFamily:"monospace",fontWeight:700,color:"#1d4ed8",fontSize:11}}>{d.poliza.numero}</td>
                        <td style={{padding:"8px 12px",color:"#6b7280"}}>{d.poliza.ramo}</td>
                        <td style={{padding:"8px 12px",fontWeight:700,color:"#059669"}}>${d.montoPagado.toLocaleString("es-MX",{maximumFractionDigits:0})}</td>
                        <td style={{padding:"8px 12px",textAlign:"center"}}><span style={{background:"#eff6ff",color:"#2563eb",padding:"2px 7px",borderRadius:6,fontWeight:700,fontSize:10}}>{d.pctSA}%</span></td>
                        <td style={{padding:"8px 12px",fontWeight:700,color:"#374151"}}>${d.comisionBruta.toLocaleString("es-MX",{maximumFractionDigits:2,minimumFractionDigits:2})}</td>
                        <td style={{padding:"8px 12px",color:"#dc2626",fontWeight:600}}>−${d.montoImpuestos.toLocaleString("es-MX",{maximumFractionDigits:2,minimumFractionDigits:2})}</td>
                        <td style={{padding:"8px 12px",fontWeight:800,color:"#059669",fontFamily:"'Inter',sans-serif"}}>${d.comisionNeta.toLocaleString("es-MX",{maximumFractionDigits:2,minimumFractionDigits:2})}</td>
                        <td style={{padding:"8px 12px"}}><span style={{background:d.estado==="pagada"?"#d1fae5":"#fef3c7",color:d.estado==="pagada"?"#059669":"#d97706",padding:"2px 7px",borderRadius:6,fontWeight:700,fontSize:10}}>{d.estado==="pagada"?"✓ Pagada":"⏳ Pendiente"}</span></td>
                        <td style={{padding:"8px 12px"}}>
                          <button onClick={()=>marcarEstadoSA(sa.id,d.poliza.id,d.estado==="pagada"?"pendiente":"pagada")}
                            style={{background:d.estado==="pagada"?"#fef2f2":"#f0fdf4",color:d.estado==="pagada"?"#dc2626":"#059669",border:`1px solid ${d.estado==="pagada"?"#fecaca":"#bbf7d0"}`,borderRadius:7,padding:"4px 9px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                            {d.estado==="pagada"?"↩ Revertir":"✓ Pagada"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* HISTORIAL */}
      {tab==="historial"&&(
        <div style={{background:"#fff",borderRadius:14,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{padding:"14px 20px",borderBottom:"1px solid #f3f4f6"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#111827",fontFamily:"'Playfair Display',serif"}}>📜 Historial de comisiones cobradas / pagadas</div>
          </div>
          {pagosComision.filter(pc=>pc.estado==="cobrada"||pc.estado==="pagada").length===0?(
            <div style={{padding:"32px",textAlign:"center",color:"#9ca3af",fontSize:13}}>Sin historial registrado aún</div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Fecha","Póliza","Tipo","Mes","Estado"].map(h=>(
                    <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:10}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...pagosComision].reverse().filter(pc=>pc.estado==="cobrada"||pc.estado==="pagada").map((pc,i)=>{
                  const poliza=polizas.find(p=>p.id===pc.polizaId);
                  const sa=pc.subagentId?subagentes.find(s=>s.id===pc.subagentId):null;
                  return(
                    <tr key={i} style={{borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                      <td style={{padding:"9px 12px",color:"#6b7280"}}>{pc.fecha}</td>
                      <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:"#1d4ed8",fontSize:11}}>{poliza?.numero||"—"}</td>
                      <td style={{padding:"9px 12px"}}><span style={{background:sa?"#ede9fe":"#dbeafe",color:sa?"#7c3aed":"#1d4ed8",padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:10}}>{sa?`SA: ${sa.nombre}`:"Comisión agente"}</span></td>
                      <td style={{padding:"9px 12px",color:"#6b7280"}}>{MESES[pc.mes]} {pc.anio}</td>
                      <td style={{padding:"9px 12px"}}><span style={{background:"#d1fae5",color:"#059669",padding:"2px 8px",borderRadius:6,fontWeight:700,fontSize:10}}>✓ {pc.estado==="cobrada"?"Cobrada":"Pagada"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal agregar/editar % */}
      {showModalTabla&&(
        <Modal title={editandoTabla?"Editar porcentaje":"Nuevo porcentaje de comisión"} onClose={()=>{setShowModalTabla(false);setEditandoTabla(null);setFormTabla({ramo:"Autos",aseguradora:"GNP",porcentaje:""});}}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>RAMO *</label>
                <select value={formTabla.ramo} onChange={e=>setFormTabla(p=>({...p,ramo:e.target.value}))}
                  style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}>
                  {RAMOS_COM.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>ASEGURADORA *</label>
                <select value={formTabla.aseguradora} onChange={e=>setFormTabla(p=>({...p,aseguradora:e.target.value}))}
                  style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}>
                  {ASEG_COM.map(a=><option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>% DE COMISIÓN *</label>
              <div style={{position:"relative"}}>
                <input type="number" min="0" max="100" step="0.5" value={formTabla.porcentaje}
                  onChange={e=>setFormTabla(p=>({...p,porcentaje:e.target.value}))} placeholder="Ej: 10.5"
                  style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 40px 9px 12px",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",fontWeight:700}}/>
                <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontWeight:700}}>%</span>
              </div>
            </div>
            {formTabla.porcentaje&&Number(formTabla.porcentaje)>0&&(
              <div style={{background:"#f0fdf4",borderRadius:9,padding:"10px 14px",fontSize:12,color:"#065f46"}}>
                💡 Por cada $1,000 cobrados → <strong>${(1000*parseFloat(formTabla.porcentaje)/100).toFixed(2)} MXN</strong> de comisión
              </div>
            )}
            <Btn onClick={guardarTabla} color="#2563eb" style={{width:"100%",justifyContent:"center"}}>
              {editandoTabla?"Guardar cambios":"Agregar porcentaje"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PAI({ paiMetas, setPaiMetas }) {
  const [showModal,setShowModal]=useState(false);
  const [showAlerta,setShowAlerta]=useState(false);
  const [alertaTexto,setAlertaTexto]=useState("");
  const [loadingAlerta,setLoadingAlerta]=useState(false);
  const [form,setForm]=useState({ramo:"Vida",periodo:"",periodicidad:"trimestral",metaBono:"",fechaInicio:"",fechaFin:"",cobrado:""});

  const ramos=Object.keys(RAMOS_SUBRAMOS);
  const ramoGrad={Vida:["#7c3aed","#a78bfa"],"Gastos Médicos":["#059669","#34d399"],Autos:["#1d4ed8","#60a5fa"],Daños:["#d97706","#fbbf24"]};
  const totalMeta=paiMetas.reduce((a,m)=>a+m.metaBono,0);
  const totalCobrado=paiMetas.reduce((a,m)=>a+m.cobrado,0);
  const pctGlobal=totalMeta>0?Math.round((totalCobrado/totalMeta)*100):0;

  const guardar=()=>{
    if(!form.metaBono)return;
    setPaiMetas(prev=>[...prev,{...form,id:Date.now(),metaBono:Number(form.metaBono),cobrado:Number(form.cobrado)||0,activa:true,cerrado:false}]);
    setShowModal(false);
    setForm({ramo:"Vida",periodo:"",periodicidad:"trimestral",metaBono:"",fechaInicio:"",fechaFin:"",cobrado:""});
  };
  const actualizarCobrado=(id,v)=>setPaiMetas(prev=>prev.map(m=>m.id===id?{...m,cobrado:Number(v)}:m));
  const eliminarMeta=(id)=>setPaiMetas(prev=>prev.filter(m=>m.id!==id));
  const cerrarTrimestre=(id)=>setPaiMetas(prev=>prev.map(m=>m.id===id?{...m,cerrado:true,activa:false}:m));
  const getEstado=(pct)=>pct>=100?{label:"🏆 Alcanzado",color:"#059669"}:pct>=80?{label:"🟢 En camino",color:"#16a34a"}:pct>=50?{label:"🟡 En proceso",color:"#d97706"}:{label:"🔴 Atención",color:"#dc2626"};

  const metasActivas=paiMetas.filter(m=>!m.cerrado);
  const metasCerradas=paiMetas.filter(m=>m.cerrado);

  // Agrupar cerradas por periodo para el resumen trimestral
  const resumenTrimestrales = metasCerradas.reduce((acc,m)=>{
    if(!acc[m.periodo]) acc[m.periodo]=[];
    acc[m.periodo].push(m);
    return acc;
  },{});

  const generarAlertaIA=async()=>{
    if(metasActivas.length===0)return;
    setShowAlerta(true);setLoadingAlerta(true);setAlertaTexto("");
    try{
      const resumen=metasActivas.map(m=>`Ramo ${m.ramo}: meta $${m.metaBono.toLocaleString()}, cobrado $${m.cobrado.toLocaleString()} (${Math.round(m.cobrado/m.metaBono*100)}%), falta $${(m.metaBono-m.cobrado).toLocaleString()}. Periodo: ${m.periodo}.`).join("\n");
      const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Eres asistente de un agente de seguros en México. Genera un reporte semanal PAI basado en:\n\n${resumen}\n\nIncluye: saludo motivacional, avance global, ramos en riesgo, 3 acciones concretas esta semana y frase de cierre. Español, máximo 260 palabras, emojis con moderación.`}]})});
      const data=await res.json();
      setAlertaTexto(data.content.map(b=>b.text||"").join(""));
    }catch{setAlertaTexto("No se pudo conectar. Verifica tu conexión.");}
    setLoadingAlerta(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <SectionTitle title="Metas" sub="Plan de acción por ramo · Seguimiento de bono"/>
        <div style={{display:"flex",gap:10}}>
          {metasActivas.length>0&&<Btn onClick={generarAlertaIA} color="#7c3aed" icon="spark">Alerta Semanal IA</Btn>}
          <Btn onClick={()=>setShowModal(true)} color="#059669" icon="plus">Nueva Meta</Btn>
        </div>
      </div>

      {paiMetas.length===0&&(
        <div style={{background:"#fff",borderRadius:16,padding:"48px 24px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{fontSize:44,marginBottom:12}}>🎯</div>
          <div style={{fontWeight:800,fontSize:16,fontFamily:"'Playfair Display',serif",marginBottom:6}}>Sin metas registradas</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Agrega tu primera meta de bono por ramo para comenzar el seguimiento</div>
          <Btn onClick={()=>setShowModal(true)} color="#059669" icon="plus">Crear primera meta</Btn>
        </div>
      )}

      {/* KPI global — solo si hay metas activas */}
      {metasActivas.length>0&&(
        <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:18,padding:"24px 28px",display:"flex",alignItems:"center",gap:28}}>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,letterSpacing:"0.1em",marginBottom:4}}>PROGRESO GLOBAL DE BONO</div>
            <div style={{fontSize:40,fontWeight:900,fontFamily:"'Playfair Display',serif",color:pctGlobal>=80?"#4ade80":pctGlobal>=50?"#fbbf24":"#f87171",lineHeight:1}}>{pctGlobal}%</div>
            <div style={{color:"#94a3b8",fontSize:13,marginTop:4}}>${totalCobrado.toLocaleString()} cobrado de ${totalMeta.toLocaleString()}</div>
            <div style={{marginTop:12}}><ProgressBar value={totalCobrado} max={totalMeta} color={pctGlobal>=80?"#4ade80":pctGlobal>=50?"#fbbf24":"#f87171"} height={10}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {[["Meta Total",`$${totalMeta.toLocaleString()}`],["Cobrado",`$${totalCobrado.toLocaleString()}`],["Faltante",`$${(totalMeta-totalCobrado).toLocaleString()}`],["Ramos",metasActivas.length]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 14px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>{l.toUpperCase()}</div>
                <div style={{fontSize:17,fontWeight:800,color:"#e2e8f0"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas activas */}
      {metasActivas.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:15}}>
          {metasActivas.map(m=>{
            const pct=m.metaBono>0?Math.round((m.cobrado/m.metaBono)*100):0;
            const faltante=m.metaBono-m.cobrado;
            const estado=getEstado(pct);
            const [c1,c2]=ramoGrad[m.ramo]||["#6b7280","#9ca3af"];
            return(
              <div key={m.id} style={{background:"#fff",borderRadius:17,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
                <div style={{background:`linear-gradient(135deg,${c1},${c2})`,padding:"16px 18px",color:"#fff"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontSize:10,opacity:.8,fontWeight:700,letterSpacing:"0.08em"}}>{m.periodicidad?.toUpperCase()||"TRIMESTRAL"} · {m.periodo||"Sin período"}</div>
                      <div style={{fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{m.ramo}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:30,fontWeight:900,fontFamily:"'Playfair Display',serif",opacity:.9}}>{pct}%</div>
                    </div>
                  </div>
                  <div style={{marginTop:10}}><div style={{background:"rgba(255,255,255,.3)",borderRadius:99,height:7}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:"#fff",borderRadius:99,transition:"width .6s"}}/></div></div>
                </div>
                <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    {[["Meta",`$${m.metaBono.toLocaleString()}`],["Cobrado",`$${m.cobrado.toLocaleString()}`],["Faltante",`$${faltante.toLocaleString()}`],["Estado",estado.label]].map(([l,v])=>(
                      <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l}</div>
                        <div style={{fontSize:13,fontWeight:700,color:l==="Estado"?estado.color:"#111827"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{borderTop:"1px solid #f3f4f6",paddingTop:10}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:5}}>ACTUALIZAR COBRADO</div>
                    <div style={{display:"flex",gap:7}}>
                      <input type="number" defaultValue={m.cobrado} onBlur={e=>actualizarCobrado(m.id,e.target.value)} style={{flex:1,border:"1.5px solid #e5e7eb",borderRadius:8,padding:"7px 10px",fontSize:13,outline:"none",fontFamily:"inherit"}}/>
                      <button onClick={e=>{const inp=e.currentTarget.previousSibling;actualizarCobrado(m.id,inp.value);inp.style.borderColor=c1;setTimeout(()=>inp.style.borderColor="#e5e7eb",900);}} style={{background:c1,color:"#fff",border:"none",borderRadius:8,padding:"7px 12px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>✓</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{ if(window.confirm(`¿Cerrar trimestre "${m.periodo}" para ${m.ramo}? Se guardará el resultado final.`)) cerrarTrimestre(m.id); }}
                      style={{flex:1,background:"#0f172a",color:"#fff",border:"none",borderRadius:8,padding:"8px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      🏁 Cerrar Trimestre
                    </button>
                    <button onClick={()=>{ if(window.confirm("¿Eliminar esta meta?")) eliminarMeta(m.id); }}
                      style={{background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fecaca",borderRadius:8,padding:"8px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resúmenes trimestrales cerrados */}
      {Object.keys(resumenTrimestrales).length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:13,fontWeight:800,color:"#374151",borderBottom:"2px solid #e5e7eb",paddingBottom:8}}>📊 Resultados por Trimestre</div>
          {Object.entries(resumenTrimestrales).map(([periodo,metas])=>{
            const metaTotal=metas.reduce((a,m)=>a+m.metaBono,0);
            const cobradoTotal=metas.reduce((a,m)=>a+m.cobrado,0);
            const pctPeriodo=metaTotal>0?Math.round((cobradoTotal/metaTotal)*100):0;
            return(
              <div key={periodo} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
                {/* Header del trimestre */}
                <div style={{background:"#0f172a",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{color:"#f1f5f9",fontWeight:800,fontSize:15,fontFamily:"'Playfair Display',serif"}}>📅 {periodo}</div>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{color:"#94a3b8",fontSize:12}}>Meta: <strong style={{color:"#e2e8f0"}}>${metaTotal.toLocaleString()}</strong></div>
                    <div style={{color:"#94a3b8",fontSize:12}}>Cobrado: <strong style={{color:"#4ade80"}}>${cobradoTotal.toLocaleString()}</strong></div>
                    <div style={{background:pctPeriodo>=100?"#059669":pctPeriodo>=80?"#16a34a":pctPeriodo>=50?"#d97706":"#dc2626",color:"#fff",borderRadius:20,padding:"3px 12px",fontWeight:800,fontSize:13}}>{pctPeriodo}%</div>
                  </div>
                </div>
                {/* Tabla de ramos */}
                <div style={{display:"grid",gridTemplateColumns:`repeat(${metas.length},1fr)`,gap:0}}>
                  {metas.map((m,i)=>{
                    const pct=m.metaBono>0?Math.round((m.cobrado/m.metaBono)*100):0;
                    const [c1]=ramoGrad[m.ramo]||["#6b7280","#9ca3af"];
                    const alcanzado=pct>=100;
                    return(
                      <div key={m.id} style={{padding:"16px 18px",borderRight:i<metas.length-1?"1px solid #f3f4f6":"none",textAlign:"center"}}>
                        <div style={{fontSize:11,fontWeight:800,color:c1,marginBottom:4}}>{m.ramo}</div>
                        <div style={{fontSize:24,fontWeight:900,fontFamily:"'Playfair Display',serif",color:alcanzado?"#059669":c1}}>{pct}%</div>
                        <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>${m.cobrado.toLocaleString()} / ${m.metaBono.toLocaleString()}</div>
                        <div style={{marginTop:8}}><div style={{height:5,background:"#f3f4f6",borderRadius:99}}><div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:alcanzado?"#059669":c1,borderRadius:99}}/></div></div>
                        <div style={{marginTop:6,fontSize:11,fontWeight:700,color:alcanzado?"#059669":"#9ca3af"}}>{alcanzado?"🏆 Meta alcanzada":"⬤ "+getEstado(pct).label.split(" ").slice(1).join(" ")}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal&&(
        <Modal title="Nueva Meta" onClose={()=>setShowModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af"}}>🎯 Define tu meta de bono por ramo y periodicidad.</div>

            {/* Periodicidad */}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:8}}>PERIODICIDAD *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
                {[["mensual","Mensual","📅"],["trimestral","Trimestral","📊"],["semestral","Semestral","📈"],["anual","Anual","🏆"]].map(([v,l,ic])=>(
                  <button key={v} onClick={()=>setForm(p=>({...p,periodicidad:v}))}
                    style={{background:form.periodicidad===v?"#0f172a":"#f9fafb",color:form.periodicidad===v?"#fff":"#374151",
                      border:`1.5px solid ${form.periodicidad===v?"#0f172a":"#e5e7eb"}`,borderRadius:9,
                      padding:"8px 6px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                    <div style={{fontSize:14,marginBottom:2}}>{ic}</div>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Ramo *" value={form.ramo} onChange={e=>setForm(p=>({...p,ramo:e.target.value}))}>
                {ramos.map(r=><option key={r}>{r}</option>)}
              </Sel>
              <Inp label="Período (ej. Enero 2025, Q2 2025)" value={form.periodo} onChange={e=>setForm(p=>({...p,periodo:e.target.value}))} placeholder={form.periodicidad==="mensual"?"Enero 2025":form.periodicidad==="trimestral"?"Q1 2025":form.periodicidad==="semestral"?"S1 2025":"2025"}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Meta de Bono ($) *" type="number" value={form.metaBono} onChange={e=>setForm(p=>({...p,metaBono:e.target.value}))} placeholder="50000"/>
              <Inp label="Ya cobrado ($)" type="number" value={form.cobrado} onChange={e=>setForm(p=>({...p,cobrado:e.target.value}))} placeholder="0"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Fecha inicio" type="date" value={form.fechaInicio} onChange={e=>setForm(p=>({...p,fechaInicio:e.target.value}))}/>
              <Inp label="Fecha fin" type="date" value={form.fechaFin} onChange={e=>setForm(p=>({...p,fechaFin:e.target.value}))}/>
            </div>
            <Btn onClick={guardar} color="#059669" style={{width:"100%",justifyContent:"center"}}>Crear Meta</Btn>
          </div>
        </Modal>
      )}

      {showAlerta&&(
        <Modal title="📊 Alerta Semanal IA — PAI" onClose={()=>setShowAlerta(false)} maxW={600}>
          {loadingAlerta?(
            <div style={{textAlign:"center",padding:"44px 20px"}}>
              <div style={{fontSize:38,marginBottom:12}}>🤖</div>
              <div style={{fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif"}}>Generando reporte...</div>
              <style>{`@keyframes b2{0%,80%,100%{transform:scale(.8);opacity:.5}40%{transform:scale(1.2);opacity:1}}`}</style>
              <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:18}}>{[0,1,2].map(i=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:"#7c3aed",animation:`b2 1.2s ${i*.2}s infinite`}}/>)}</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#0f172a",borderRadius:10,padding:"12px 14px",display:"flex",gap:8,flexWrap:"wrap"}}>
                {metasActivas.map(m=><span key={m.id} style={{background:"rgba(255,255,255,.1)",color:"#e2e8f0",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{m.ramo}: {Math.round(m.cobrado/m.metaBono*100)}%</span>)}
              </div>
              <div style={{background:"#f8fafc",borderRadius:12,padding:"18px 20px",border:"1px solid #e2e8f0"}}>
                <pre style={{margin:0,fontSize:13,color:"#1e293b",whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.7}}>{alertaTexto}</pre>
              </div>
              <div style={{display:"flex",gap:9}}>
                <button onClick={()=>navigator.clipboard.writeText(alertaTexto)} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:12}}>📋 Copiar</button>
                <Btn onClick={generarAlertaIA} color="#7c3aed" style={{flex:1,justifyContent:"center"}}>🔄 Regenerar</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PIPELINE
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// CAPTURA PROSPECTOS — formulario para redes/correo/WA
// ═══════════════════════════════════════════════════════════════════
function CapturaProspectos({ setPipeline }) {
  const [toast, setToast] = useState(null);
  const showT = (m) => { setToast(m); setTimeout(()=>setToast(null),3000); };
  const CANALES = [
    {key:"whatsapp", label:"WhatsApp",        icon:"📱", color:"#25d366"},
    {key:"email",    label:"Correo",           icon:"📧", color:"#2563eb"},
    {key:"facebook", label:"Facebook",         icon:"👍", color:"#1877f2"},
    {key:"instagram",label:"Instagram",        icon:"📸", color:"#e1306c"},
    {key:"linkedin", label:"LinkedIn",         icon:"💼", color:"#0a66c2"},
    {key:"landing",  label:"Landing Page/Web", icon:"🌐", color:"#7c3aed"},
  ];
  const [canal, setCanal] = useState("whatsapp");
  const [texto, setTexto] = useState("");
  const [form, setForm] = useState({nombre:"",telefono:"",email:"",tipo:"",notas:"",ciudad:"",edad:""});
  const [paso, setPaso] = useState(1);
  const canalCfg = CANALES.find(c=>c.key===canal)||CANALES[0];
  const fuenteMap = {whatsapp:"WhatsApp",email:"Correo",facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",landing:"Landing Page"};

  const extraerDatos = (txt) => {
    const telMatch = txt.match(/(\d{3}[\s\-]?\d{3}[\s\-]?\d{4}|\+52\s?\d{10}|\d{10})/);
    const telefono = telMatch ? telMatch[0].replace(/\D/g,"").slice(-10) : "";
    const emailMatch = txt.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i);
    const email = emailMatch ? emailMatch[0] : "";
    const lineas = txt.split(/[\n,]/).map(l=>l.trim()).filter(l=>l.length>2&&l.length<60&&!/[@:/0-9]/.test(l));
    const nombre = lineas[0]||"";
    const tiposMap = [["Autos","auto"],["Gastos Médicos","medico|gmm|salud|hospital"],["Vida","vida"],["Hogar","hogar|casa"],["Negocio","negocio|empresa"]];
    let tipo = "";
    for(const [t,rx] of tiposMap){ if(new RegExp(rx,"i").test(txt)){tipo=t;break;} }
    return {nombre, telefono, email, tipo, notas:txt.slice(0,400)};
  };

  const analizar = () => {
    if(!texto.trim()) return;
    setForm(p=>({...p,...extraerDatos(texto)}));
    setPaso(2);
  };

  const guardar = () => {
    if(!form.nombre.trim()) { showT("Agrega el nombre del prospecto"); return; }
    setPipeline(prev=>[{
      id:Date.now(), cliente:form.nombre, tipo:form.tipo, etapa:"Contacto", probabilidad:20,
      seguimiento:"", telefono:form.telefono, email:form.email, ciudad:form.ciudad,
      edad:parseInt(form.edad)||null, fuente:fuenteMap[canal]||"Otro",
      notas:form.notas, fechaAlta:new Date().toLocaleDateString("es-MX"),
    },...prev]);
    showT("Prospecto guardado correctamente");
    setTexto(""); setForm({nombre:"",telefono:"",email:"",tipo:"",notas:"",ciudad:"",edad:""}); setPaso(1);
  };

  const inpS={border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box",background:"#fff"};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,background:"#111827",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:"0 8px 24px rgba(0,0,0,.3)"}}>{toast}</div>}

      <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
        <div style={{fontWeight:800,fontSize:14,color:"#111827",marginBottom:3}}>🔗 Captura automática desde canales digitales</div>
        <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Pega el mensaje o texto de solicitud — el sistema extrae los datos del prospecto automáticamente.</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {CANALES.map(c=>(
            <button key={c.key} onClick={()=>{setCanal(c.key);setPaso(1);setTexto("");setForm({nombre:"",telefono:"",email:"",tipo:"",notas:"",ciudad:"",edad:""}); }}
              style={{background:canal===c.key?c.color+"18":"#f9fafb",border:"2px solid "+(canal===c.key?c.color:"#e5e7eb"),borderRadius:11,padding:"10px 8px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
              <div style={{fontSize:18,marginBottom:3}}>{c.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:canal===c.key?c.color:"#374151"}}>{c.label}</div>
            </button>
          ))}
        </div>
      </div>

      {paso===1&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:canalCfg.color,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:12}}>{canalCfg.icon} {canalCfg.label}</span>
            Paso 1 — Pega el mensaje o solicitud
          </div>
          <textarea value={texto} onChange={e=>setTexto(e.target.value)} rows={6}
            placeholder="Pega aquí el mensaje, correo o texto donde el cliente solicita cotización..."
            style={{...inpS,resize:"vertical"}}/>
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:12,gap:8}}>
            <button onClick={()=>{setForm(p=>({...p,notas:texto}));setPaso(2);}}
              style={{background:"#f3f4f6",border:"none",borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
              Ingresar manualmente
            </button>
            <button onClick={analizar} disabled={!texto.trim()}
              style={{background:texto.trim()?canalCfg.color:"#e5e7eb",color:texto.trim()?"#fff":"#9ca3af",border:"none",borderRadius:9,padding:"8px 18px",fontSize:13,fontWeight:700,cursor:texto.trim()?"pointer":"default",fontFamily:"inherit"}}>
              🤖 Extraer datos
            </button>
          </div>
        </div>
      )}

      {paso===2&&(
        <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{background:canalCfg.color,color:"#fff",borderRadius:8,padding:"3px 10px",fontSize:12}}>{canalCfg.icon} {canalCfg.label}</span>
            Paso 2 — Confirmar datos
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            {[["NOMBRE COMPLETO *","nombre","text","Nombre completo"],["TELÉFONO / WHATSAPP","telefono","tel","55 1234 5678"],["EMAIL","email","email","correo@email.com"],["CIUDAD","ciudad","text","Ciudad"]].map(([l,k,t,ph])=>(
              <div key={k}>
                <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:4}}>{l}</div>
                <input type={t} value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpS} placeholder={ph}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:4}}>TIPO DE SEGURO</div>
              <select value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={inpS}>
                <option value="">— Por definir —</option>
                {["Autos","Gastos Médicos","Vida","Hogar","Negocio","Viaje","Otro"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:4}}>EDAD</div>
              <input type="number" value={form.edad} onChange={e=>setForm(p=>({...p,edad:e.target.value}))} style={inpS} placeholder="Edad"/>
            </div>
          </div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:4}}>NOTAS</div>
            <textarea value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} rows={3} style={{...inpS,resize:"none"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14,paddingTop:12,borderTop:"1px solid #f3f4f6"}}>
            <button onClick={()=>setPaso(1)}
              style={{background:"#f3f4f6",border:"none",borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
              ← Volver
            </button>
            <button onClick={guardar}
              style={{background:"#7c3aed",color:"#fff",border:"none",borderRadius:9,padding:"9px 24px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
              ✅ Guardar como prospecto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Pipeline({ pipeline, setPipeline }) {
  const etapas=["Contacto","Cotización","Propuesta","Negociación","Cierre"];
  const colors={Contacto:"#6b7280",Cotización:"#2563eb",Propuesta:"#7c3aed",Negociación:"#d97706",Cierre:"#059669"};
  const [showModal,setShowModal]=useState(false);
  const [tab,setTab]=useState("kanban");
  const [tabPipeline,setTabPipeline]=useState("prospectos");
  const [prospectoHistorial,setProspectoHistorial]=useState(null); // prospecto seleccionado para historial
  const [form,setForm]=useState({cliente:"",tipo:"",etapa:"Contacto",probabilidad:20,seguimiento:"",telefono:"",email:"",ciudad:"",edad:"",fuente:"Manual",landingUrl:"",redSocial:"",notas:""});
  const fuenteOpts=["Manual","Landing Page","Facebook","Instagram","LinkedIn","Referido","WhatsApp","Otro"];
  const fuenteColor={Manual:"#6b7280","Landing Page":"#2563eb",Facebook:"#1877f2",Instagram:"#e1306c",LinkedIn:"#0a66c2",Referido:"#059669",WhatsApp:"#25d366",Otro:"#6b7280"};

  // Guardar nuevo prospecto
  const guardar=()=>{
    if(!form.cliente)return;
    setPipeline(prev=>[...prev,{
      ...form,id:Date.now(),
      probabilidad:Number(form.probabilidad),
      edad:Number(form.edad)||null,
      fechaAlta:new Date().toLocaleDateString("es-MX"),
      historial:[{
        id:Date.now(),
        tipo:"etapa",
        fecha:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}),
        hora:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
        texto:"Prospecto registrado",
        etapa:"Contacto",
      }]
    }]);
    setShowModal(false);
    setForm({cliente:"",tipo:"",etapa:"Contacto",probabilidad:20,seguimiento:"",telefono:"",email:"",ciudad:"",edad:"",fuente:"Manual",landingUrl:"",redSocial:"",notas:""});
  };

  // Agregar entrada al historial
  const agregarHistorial = (prospectoId, entrada) => {
    setPipeline(prev=>prev.map(p=>p.id===prospectoId?{
      ...p,
      historial:[...(p.historial||[]), {
        ...entrada,
        id:Date.now(),
        fecha:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}),
        hora:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
      }]
    }:p));
    // Actualizar el prospecto en el modal
    setProspectoHistorial(prev=>prev?{
      ...prev,
      historial:[...(prev.historial||[]),{
        ...entrada,
        id:Date.now()+1,
        fecha:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}),
        hora:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
      }]
    }:null);
  };

  // Cambiar etapa con registro en historial
  const cambiarEtapa = (prospectoId, nuevaEtapa) => {
    const p = pipeline.find(x=>x.id===prospectoId);
    if (!p||p.etapa===nuevaEtapa) return;
    setPipeline(prev=>prev.map(x=>x.id===prospectoId?{
      ...x,
      etapa:nuevaEtapa,
      historial:[...(x.historial||[]),{
        id:Date.now(),
        tipo:"etapa",
        fecha:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}),
        hora:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
        texto:`Etapa cambiada a ${nuevaEtapa}`,
        etapaAnterior:x.etapa,
        etapa:nuevaEtapa,
      }]
    }:x));
    setProspectoHistorial(prev=>prev&&prev.id===prospectoId?{
      ...prev,etapa:nuevaEtapa,
      historial:[...(prev.historial||[]),{
        id:Date.now()+1,tipo:"etapa",
        fecha:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"short",year:"numeric"}),
        hora:new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}),
        texto:`Etapa cambiada a ${nuevaEtapa}`,etapaAnterior:prev.etapa,etapa:nuevaEtapa,
      }]
    }:prev);
  };

  // Config de tipos de entrada en historial
  const TIPOS_HISTORIAL = [
    {key:"nota",     label:"Nota",           icon:"📝", color:"#6b7280"},
    {key:"llamada",  label:"Llamada",         icon:"📞", color:"#2563eb"},
    {key:"cita",     label:"Cita",            icon:"📅", color:"#7c3aed"},
    {key:"cotizacion",label:"Cotización",     icon:"📄", color:"#d97706"},
    {key:"etapa",    label:"Cambio de etapa", icon:"🔄", color:"#059669"},
  ];

  // Modal historial
  const ModalHistorial = ({ prospecto, onClose }) => {
    const [tipoEntrada, setTipoEntrada] = useState("nota");
    const [textoEntrada, setTextoEntrada] = useState("");
    const [nuevaEtapa, setNuevaEtapa] = useState(prospecto.etapa);
    const historial = [...(prospecto.historial||[])].reverse();

    const guardarEntrada = () => {
      if (!textoEntrada.trim() && tipoEntrada!=="etapa") return;
      if (tipoEntrada==="etapa") {
        cambiarEtapa(prospecto.id, nuevaEtapa);
        setTextoEntrada("");
        return;
      }
      const cfg = TIPOS_HISTORIAL.find(t=>t.key===tipoEntrada);
      agregarHistorial(prospecto.id, {tipo:tipoEntrada, texto:textoEntrada, icon:cfg?.icon});
      setTextoEntrada("");
    };

    return (
      <Modal title={`📋 ${prospecto.cliente}`} onClose={onClose} wide maxW={680}>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>

          {/* Header prospecto */}
          <div style={{background:`linear-gradient(135deg,${colors[prospecto.etapa]||"#6b7280"},${colors[prospecto.etapa]||"#6b7280"}bb)`,borderRadius:12,padding:"14px 18px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:11,opacity:.8,fontWeight:700,letterSpacing:"0.06em"}}>{prospecto.fuente||"MANUAL"} · {prospecto.tipo||"Por definir"}</div>
              <div style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{prospecto.cliente}</div>
              {prospecto.telefono&&<div style={{fontSize:12,opacity:.85,marginTop:2}}>📱 {prospecto.telefono}</div>}
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,opacity:.7}}>PROBABILIDAD</div>
              <div style={{fontSize:28,fontWeight:800,fontFamily:"'Inter',sans-serif"}}>{prospecto.probabilidad}%</div>
              <div style={{fontSize:11,opacity:.8}}>{prospecto.etapa}</div>
            </div>
          </div>

          {/* Cambiar etapa rápido */}
          <div style={{background:"#f9fafb",borderRadius:11,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:8}}>ETAPA ACTUAL</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {etapas.map(e=>(
                <button key={e} onClick={()=>cambiarEtapa(prospecto.id,e)}
                  style={{background:prospecto.etapa===e?colors[e]:"#fff",color:prospecto.etapa===e?"#fff":colors[e],
                    border:`2px solid ${colors[e]}`,borderRadius:20,padding:"5px 14px",fontSize:11,
                    fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Registrar nueva entrada */}
          <div style={{background:"#fff",border:"1.5px solid #e5e7eb",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:10}}>REGISTRAR ACTIVIDAD</div>
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {TIPOS_HISTORIAL.filter(t=>t.key!=="etapa").map(t=>(
                <button key={t.key} onClick={()=>setTipoEntrada(t.key)}
                  style={{background:tipoEntrada===t.key?t.color:"#f3f4f6",color:tipoEntrada===t.key?"#fff":"#374151",
                    border:"none",borderRadius:20,padding:"5px 13px",fontSize:11,fontWeight:700,
                    cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <textarea value={textoEntrada} onChange={e=>setTextoEntrada(e.target.value)}
              placeholder={tipoEntrada==="llamada"?"Ej: Llamada realizada, interesado en GMM familiar, solicita cotización...":
                tipoEntrada==="cita"?"Ej: Cita agendada para el martes a las 4pm en oficina...":
                tipoEntrada==="cotizacion"?"Ej: Cotización enviada por WhatsApp — GNP GMM $8,400 anuales...":
                "Escribe una nota sobre este prospecto..."}
              rows={3} style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,
                outline:"none",fontFamily:"inherit",width:"100%",resize:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",justifyContent:"flex-end",marginTop:10}}>
              <Btn onClick={guardarEntrada} color="#0f172a" icon="plus">Registrar</Btn>
            </div>
          </div>

          {/* Línea de tiempo */}
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:14,letterSpacing:"0.06em"}}>HISTORIAL DE ACTIVIDAD</div>
            {historial.length===0?(
              <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"24px 0"}}>Sin actividad registrada aún</div>
            ):(
              <div style={{position:"relative",paddingLeft:28}}>
                {/* Línea vertical */}
                <div style={{position:"absolute",left:9,top:4,bottom:4,width:2,background:"#e5e7eb",borderRadius:2}}/>
                {historial.map((h,i)=>{
                  const cfg = TIPOS_HISTORIAL.find(t=>t.key===h.tipo)||{icon:"📝",color:"#6b7280"};
                  return(
                    <div key={h.id||i} style={{position:"relative",marginBottom:18}}>
                      {/* Punto en la línea */}
                      <div style={{position:"absolute",left:-24,top:2,width:18,height:18,borderRadius:"50%",
                        background:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,boxShadow:`0 0 0 3px #fff, 0 0 0 4px ${cfg.color}44`}}>
                        <span style={{fontSize:10}}>{cfg.icon}</span>
                      </div>
                      {/* Contenido */}
                      <div style={{background:"#f9fafb",borderRadius:10,padding:"10px 13px",border:"1px solid #f3f4f6"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:10,fontWeight:800,color:cfg.color,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                            {cfg.icon} {TIPOS_HISTORIAL.find(t=>t.key===h.tipo)?.label||h.tipo}
                          </span>
                          <span style={{fontSize:10,color:"#9ca3af"}}>{h.fecha} {h.hora}</span>
                        </div>
                        <div style={{fontSize:13,color:"#1e293b",fontWeight:500,lineHeight:1.5}}>{h.texto}</div>
                        {h.etapaAnterior&&(
                          <div style={{marginTop:5,display:"flex",alignItems:"center",gap:6,fontSize:11}}>
                            <span style={{background:colors[h.etapaAnterior]+"22",color:colors[h.etapaAnterior],padding:"2px 9px",borderRadius:20,fontWeight:700}}>{h.etapaAnterior}</span>
                            <span style={{color:"#9ca3af"}}>→</span>
                            <span style={{background:colors[h.etapa]+"22",color:colors[h.etapa],padding:"2px 9px",borderRadius:20,fontWeight:700}}>{h.etapa}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </Modal>
    );
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
        <SectionTitle title="Prospectos" sub={`${pipeline.length} prospectos registrados`}/>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:10,padding:3}}>
            {[["prospectos","📋 Prospectos"],["captura","🔗 Captura Digital"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTabPipeline(t)}
                style={{background:tabPipeline===t?"#fff":"none",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:600,cursor:"pointer",color:tabPipeline===t?"#111827":"#6b7280",boxShadow:tabPipeline===t?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"inherit"}}>{l}
              </button>
            ))}
          </div>
          {tabPipeline==="prospectos"&&<Btn onClick={()=>setShowModal(true)} color="#7c3aed" icon="plus">Nuevo Prospecto</Btn>}
        </div>
      </div>
      {tabPipeline==="captura"&&<CapturaProspectos setPipeline={setPipeline}/>}
      {tabPipeline==="prospectos"&&<>
      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:11,padding:4,width:"fit-content"}}>
        {[["kanban","🗂 Kanban"],["lista","📋 Lista"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"#fff":"none",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:600,cursor:"pointer",color:tab===t?"#111827":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"inherit"}}>{l}</button>
        ))}
      </div>
      {tab==="kanban"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:11}}>
          {etapas.map(etapa=>{const items=pipeline.filter(p=>p.etapa===etapa);return(
            <div key={etapa} style={{background:"#f9fafb",borderRadius:13,padding:12,minHeight:260}}>
              <div style={{marginBottom:9}}><div style={{fontSize:9,fontWeight:800,color:colors[etapa],letterSpacing:"0.08em"}}>{etapa.toUpperCase()}</div><div style={{fontSize:11,color:"#9ca3af"}}>{items.length}</div></div>
              {items.map(item=>(
                <div key={item.id} style={{background:"#fff",borderRadius:9,padding:"9px 11px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",borderLeft:`3px solid ${colors[etapa]}`,marginBottom:7}}>
                  <div style={{fontSize:12,fontWeight:700}}>{item.cliente}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{item.tipo}</div>
                  {item.ciudad&&<div style={{fontSize:10,color:"#9ca3af"}}>📍 {item.ciudad}{item.edad?` · ${item.edad} años`:""}</div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                    <span style={{fontSize:10,background:(fuenteColor[item.fuente]||"#6b7280")+"20",color:fuenteColor[item.fuente]||"#6b7280",padding:"1px 6px",borderRadius:5,fontWeight:700}}>{item.fuente||"Manual"}</span>
                    <div style={{height:3,background:"#e5e7eb",borderRadius:2,width:50}}><div style={{height:"100%",width:`${item.probabilidad}%`,background:colors[etapa],borderRadius:2}}/></div>
                  </div>
                  <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{item.probabilidad}% · {item.seguimiento||"—"}</div>
                  <button onClick={()=>setProspectoHistorial(item)}
                    style={{marginTop:7,width:"100%",background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:7,
                      padding:"5px 0",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      color:"#374151",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                    📋 Ver historial {item.historial?.length?`(${item.historial.length})`:""}
                  </button>
                </div>
              ))}
            </div>
          );})}
        </div>
      )}
      {tab==="lista"&&(
        <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{background:"#f9fafb"}}>{["Nombre","Tipo","Ciudad","Edad","Fuente","Etapa","Seguimiento",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280"}}>{h}</th>)}</tr></thead>
            <tbody>{pipeline.map(p=>(
              <tr key={p.id} style={{borderTop:"1px solid #f3f4f6"}}>
                <td style={{padding:"11px 14px",fontWeight:700,fontSize:13}}>{p.cliente}</td>
                <td style={{padding:"11px 14px",fontSize:12,color:"#6b7280"}}>{p.tipo||"—"}</td>
                <td style={{padding:"11px 14px",fontSize:12}}>{p.ciudad||"—"}</td>
                <td style={{padding:"11px 14px",fontSize:12}}>{p.edad?`${p.edad} años`:"—"}</td>
                <td style={{padding:"11px 14px"}}><span style={{background:(fuenteColor[p.fuente]||"#6b7280")+"20",color:fuenteColor[p.fuente]||"#6b7280",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{p.fuente||"Manual"}</span></td>
                <td style={{padding:"11px 14px"}}><span style={{background:(colors[p.etapa]||"#6b7280")+"20",color:colors[p.etapa]||"#6b7280",padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700}}>{p.etapa}</span></td>
                <td style={{padding:"11px 14px",fontSize:12,color:"#6b7280"}}>{p.seguimiento||"—"}</td>
                <td style={{padding:"11px 14px"}}>
                  <button onClick={()=>setProspectoHistorial(p)}
                    style={{background:"#f3f4f6",border:"none",borderRadius:7,padding:"5px 12px",
                      fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#374151",
                      display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>
                    📋 Historial {p.historial?.length?`(${p.historial.length})`:""}
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {pipeline.length===0&&<div style={{textAlign:"center",padding:"32px",color:"#9ca3af",fontSize:13}}>Sin prospectos registrados</div>}
        </div>
      )}
      </>
      }
      {showModal&&(
        <Modal title="Nuevo Prospecto" onClose={()=>setShowModal(false)} maxW={560}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Inp label="Nombre completo *" value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))} placeholder="Nombre completo"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Tipo de seguro" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} placeholder="Ej: Vida Individual"/>
              <Inp label="Ciudad de residencia" value={form.ciudad} onChange={e=>setForm(p=>({...p,ciudad:e.target.value}))} placeholder="Ej: Guadalajara"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Teléfono / WhatsApp" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="55 1234 5678"/>
              <Inp label="Email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="correo@email.com"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Edad" type="number" value={form.edad} onChange={e=>setForm(p=>({...p,edad:e.target.value}))} placeholder="Ej: 35"/>
              <Sel label="Fuente / Origen" value={form.fuente} onChange={e=>setForm(p=>({...p,fuente:e.target.value}))}>{fuenteOpts.map(f=><option key={f}>{f}</option>)}</Sel>
            </div>
            {(form.fuente==="Landing Page"||form.fuente==="Facebook"||form.fuente==="Instagram"||form.fuente==="LinkedIn")&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 14px",display:"flex",flexDirection:"column",gap:9}}>
                <div style={{fontSize:11,fontWeight:700,color:"#1e40af"}}>🌐 Datos de captación digital</div>
                {form.fuente==="Landing Page"&&<Inp label="URL landing page" value={form.landingUrl} onChange={e=>setForm(p=>({...p,landingUrl:e.target.value}))} placeholder="https://mipagina.com/cotizar"/>}
                {(form.fuente==="Facebook"||form.fuente==="Instagram"||form.fuente==="LinkedIn")&&<Inp label={`Perfil en ${form.fuente}`} value={form.redSocial} onChange={e=>setForm(p=>({...p,redSocial:e.target.value}))} placeholder={`@usuario`}/>}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Sel label="Etapa" value={form.etapa} onChange={e=>setForm(p=>({...p,etapa:e.target.value}))}>{etapas.map(e=><option key={e}>{e}</option>)}</Sel>
              <Inp label="Fecha de seguimiento" type="date" value={form.seguimiento} onChange={e=>setForm(p=>({...p,seguimiento:e.target.value}))}/>
            </div>
            <div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Probabilidad de cierre: {form.probabilidad}%</label><input type="range" min={0} max={100} step={5} value={form.probabilidad} onChange={e=>setForm(p=>({...p,probabilidad:Number(e.target.value)}))} style={{width:"100%"}}/></div>
            <Inp label="Notas" value={form.notas} onChange={e=>setForm(p=>({...p,notas:e.target.value}))} placeholder="Notas adicionales..."/>
            <Btn onClick={guardar} color="#7c3aed" style={{width:"100%",justifyContent:"center"}}>Guardar Prospecto</Btn>
          </div>
        </Modal>
      )}

      {/* Modal historial prospecto */}
      {prospectoHistorial&&(
        <ModalHistorial
          prospecto={prospectoHistorial}
          onClose={()=>setProspectoHistorial(null)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAREAS
// ═══════════════════════════════════════════════════════════════════
function Tareas({ tareas, setTareas }) {
  const [showModal,setShowModal]=useState(false);
  const [form,setForm]=useState({titulo:"",fecha:"",tipo:"llamada",prioridad:"media"});
  const toggle=(id)=>setTareas(prev=>prev.map(t=>t.id===id?{...t,done:!t.done}:t));
  const guardar=()=>{if(!form.titulo)return;setTareas(prev=>[...prev,{...form,id:Date.now(),done:false}]);setShowModal(false);setForm({titulo:"",fecha:"",tipo:"llamada",prioridad:"media"});};
  const pendientes=tareas.filter(t=>!t.done);const completadas=tareas.filter(t=>t.done);
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><SectionTitle title="Agenda" sub={`${pendientes.length} pendientes`}/><Btn onClick={()=>setShowModal(true)} color="#d97706" icon="plus">Nueva Tarea</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{background:"#fff",borderRadius:15,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}><h3 style={{margin:"0 0 13px",fontSize:14,fontWeight:700}}>⏳ Pendientes</h3>
          {pendientes.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 11px",background:"#fafafa",borderRadius:9,marginBottom:7,borderLeft:`3px solid ${t.prioridad==="alta"?"#dc2626":t.prioridad==="media"?"#d97706":"#059669"}`}}><button onClick={()=>toggle(t.id)} style={{width:19,height:19,borderRadius:"50%",border:"2px solid #d1d5db",background:"none",cursor:"pointer",flexShrink:0,marginTop:2}}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{t.titulo}</div><div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>📅 {t.fecha}</div></div><span style={{fontSize:11,fontWeight:600,color:t.prioridad==="alta"?"#991b1b":t.prioridad==="media"?"#92400e":"#065f46"}}>{t.prioridad}</span></div>))}
        </div>
        <div style={{background:"#fff",borderRadius:15,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}><h3 style={{margin:"0 0 13px",fontSize:14,fontWeight:700}}>✅ Completadas</h3>
          {completadas.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"9px 11px",background:"#f0fdf4",borderRadius:9,marginBottom:7,opacity:.75}}><button onClick={()=>toggle(t.id)} style={{width:19,height:19,borderRadius:"50%",border:"none",background:"#059669",cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Icon name="check" size={10}/></button><div style={{flex:1}}><div style={{fontSize:13,color:"#6b7280",textDecoration:"line-through"}}>{t.titulo}</div><div style={{fontSize:11,color:"#9ca3af"}}>📅 {t.fecha}</div></div></div>))}
          {completadas.length===0&&<p style={{color:"#d1d5db",fontSize:13}}>Sin completadas</p>}
        </div>
      </div>
      {showModal&&(<Modal title="Nueva Tarea" onClose={()=>setShowModal(false)}><div style={{display:"flex",flexDirection:"column",gap:12}}><Inp label="Descripción *" value={form.titulo} onChange={e=>setForm(p=>({...p,titulo:e.target.value}))}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}><Sel label="Tipo" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}><option value="llamada">📞 Llamada</option><option value="email">✉️ Email</option><option value="cita">📅 Cita</option><option value="doc">📄 Doc</option></Sel><Sel label="Prioridad" value={form.prioridad} onChange={e=>setForm(p=>({...p,prioridad:e.target.value}))}><option value="alta">🔴 Alta</option><option value="media">🟡 Media</option><option value="baja">🟢 Baja</option></Sel></div><Inp label="Fecha" type="date" value={form.fecha} onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/><Btn onClick={guardar} color="#d97706" style={{width:"100%",justifyContent:"center"}}>Guardar</Btn></div></Modal>)}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════════
function Usuarios({ usuarios, setUsuarios }) {
  const [showModal,setShowModal]=useState(false);
  const [showConfirmBaja,setShowConfirmBaja]=useState(null);
  const [editando,setEditando]=useState(null);
  const [form,setForm]=useState({nombre:"",username:"",password:"",email:"",telefono:"",rol:"agente"});
  const [verPass,setVerPass]=useState({});
  const [guardando,setGuardando]=useState(false);

  const ROLES = [
    {key:"admin",      label:"Administrador", color:"#7c3aed"},
    {key:"agente",     label:"Agente",        color:"#2563eb"},
    {key:"asistente",  label:"Asistente",     color:"#059669"},
    {key:"capturista", label:"Capturista",    color:"#d97706"},
    {key:"subagente",  label:"Subagente",     color:"#6b7280"},
  ];
  const rolColor = Object.fromEntries(ROLES.map(r=>[r.key,r.color]));
  const rolLabel = Object.fromEntries(ROLES.map(r=>[r.key,r.label]));

  const usernameExiste=(u,excludeId)=>usuarios.some(x=>x.username.toLowerCase()===u.toLowerCase()&&x.id!==excludeId);

  // Hash con bcryptjs — compatible con migración futura
  const hashPass = async (pass) => {
    return await hashPasswordBcrypt(pass);
  };

  const guardar = async () => {
    if (!form.nombre||!form.username||!form.password) return;
    if (usernameExiste(form.username, editando)) {
      alert("El nombre de usuario ya existe. Elige otro."); return;
    }
    setGuardando(true);
    const passHash = await hashPass(form.password);
    if (editando) {
      setUsuarios(prev=>prev.map(u=>u.id===editando?{...u,...form,password:passHash}:u));
    } else {
      const clave = "AGT-"+String(usuarios.length+1).padStart(3,"0");
      setUsuarios(prev=>[...prev,{...form,id:Date.now(),clave,status:"activo",password:passHash}]);
    }
    setGuardando(false);
    setShowModal(false);
    setEditando(null);
    setForm({nombre:"",username:"",password:"",email:"",telefono:"",rol:"agente"});
  };

  const abrirEditar = (u) => {
    setForm({nombre:u.nombre,username:u.username,password:"",email:u.email||"",telefono:u.telefono||"",rol:u.rol});
    setEditando(u.id);
    setShowModal(true);
  };

  const darDeBaja=(id)=>{
    setUsuarios(prev=>prev.filter(u=>u.id!==id));
    setShowConfirmBaja(null);
  };

  const adminCount=usuarios.filter(u=>u.rol==="admin").length;

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionTitle title="Usuarios del Sistema" sub={`${usuarios.length} usuarios registrados — Solo el administrador puede gestionar usuarios`}/>
        <Btn onClick={()=>setShowModal(true)} color="#7c3aed" icon="plus">Nuevo Usuario</Btn>
      </div>

      <div style={{background:"#fef3c7",borderRadius:12,padding:"12px 16px",border:"1px solid #fde68a",fontSize:12,color:"#92400e"}}>
        🔐 <strong>Área restringida.</strong> Solo el Administrador puede dar de alta, modificar o eliminar usuarios del sistema.
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {usuarios.map(u=>(
          <div key={u.id} style={{background:"#fff",borderRadius:15,boxShadow:"0 1px 8px rgba(0,0,0,0.08)",borderTop:`3px solid ${rolColor[u.rol]||"#6b7280"}`,overflow:"hidden"}}>
            <div style={{padding:"16px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:14}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:`linear-gradient(135deg,${rolColor[u.rol]||"#6b7280"},${rolColor[u.rol]||"#6b7280"}88)`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,flexShrink:0}}>
                  {u.nombre.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,fontSize:14}}>{u.nombre}</div>
                  <div style={{fontSize:11,color:"#6b7280"}}>{u.email||"Sin email"}</div>
                </div>
                <span style={{background:(rolColor[u.rol]||"#6b7280")+"18",color:rolColor[u.rol]||"#6b7280",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>
                  {rolLabel[u.rol]||u.rol}
                </span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                <div style={{background:"#f9fafb",borderRadius:9,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>USUARIO</div>
                  <div style={{fontSize:13,fontWeight:800,fontFamily:"monospace",color:"#374151"}}>@{u.username}</div>
                </div>
                <div style={{background:"#f9fafb",borderRadius:9,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>CONTRASEÑA</div>
                  <div style={{fontSize:13,fontWeight:700,fontFamily:"monospace",color:"#374151"}}>
                    {u.password?.startsWith("$2")||u.password?.startsWith("h_") ? "••••••••" : u.password}
                  </div>
                </div>
              </div>
              {u.telefono&&<div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>📞 {u.telefono}</div>}
            </div>
            <div style={{borderTop:"1px solid #f3f4f6",padding:"10px 18px",display:"flex",gap:8}}>
              <button onClick={()=>abrirEditar(u)}
                style={{flex:1,background:"#eff6ff",color:"#2563eb",border:"1.5px solid #bfdbfe",borderRadius:9,padding:"8px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                ✏️ Editar
              </button>
              {!(u.rol==="admin"&&adminCount===1)&&(
                <button onClick={()=>setShowConfirmBaja(u)}
                  style={{flex:1,background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fecaca",borderRadius:9,padding:"8px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  🗑 Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Alta/Editar */}
      {showModal&&(
        <Modal title={editando?"Editar Usuario":"Nuevo Usuario"} onClose={()=>{setShowModal(false);setEditando(null);setForm({nombre:"",username:"",password:"",email:"",telefono:"",rol:"agente"});}}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af"}}>
              🔐 {editando?"Deja la contraseña en blanco para no cambiarla.":"Define usuario y contraseña para acceso al sistema."}
            </div>
            <Inp label="Nombre completo *" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Laura Pérez García"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Usuario (login) *" value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value.toLowerCase().replace(/\s/g,"")}))} placeholder="Ej: lperez"/>
              <Inp label={editando?"Nueva contraseña":"Contraseña *"} type="text" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder={editando?"Dejar vacío para no cambiar":"Mínimo 6 caracteres"}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Email" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="correo@empresa.com"/>
              <Inp label="Teléfono" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="55 0000 0000"/>
            </div>
            <Sel label="Rol" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}>
              {ROLES.map(r=><option key={r.key} value={r.key}>{r.label}</option>)}
            </Sel>
            <div style={{background:"#f9fafb",borderRadius:9,padding:"10px 13px",fontSize:11,color:"#6b7280"}}>
              <strong>Permisos del rol:</strong><br/>
              {form.rol==="admin"||form.rol==="agente" ? "Acceso completo al sistema" :
               form.rol==="asistente" ? "Clientes, pólizas, prospectos, subagentes, metas, pagos" :
               form.rol==="capturista" ? "Capturar clientes, pólizas y registrar pagos" :
               "Solo clientes y pólizas asignadas, sin dashboard"}
            </div>
            <Btn onClick={guardar} color="#7c3aed" style={{width:"100%",justifyContent:"center"}}
              disabled={!form.nombre||!form.username||(!editando&&!form.password)||guardando}>
              {guardando?"Guardando...":editando?"Guardar cambios":"Crear Usuario"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Modal confirmación baja */}
      {showConfirmBaja&&(
        <Modal title="⚠️ Confirmar eliminación" onClose={()=>setShowConfirmBaja(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"#fef2f2",borderRadius:10,padding:"14px 16px",border:"1px solid #fecaca"}}>
              <div style={{fontWeight:700,color:"#991b1b",marginBottom:6}}>¿Eliminar este usuario del sistema?</div>
              <div style={{fontSize:13,color:"#374151"}}>
                <strong>@{showConfirmBaja.username}</strong> — {showConfirmBaja.nombre}
              </div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:6}}>Esta acción no se puede deshacer. El usuario perderá acceso inmediatamente.</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowConfirmBaja(null)} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:"10px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
                Cancelar
              </button>
              <button onClick={()=>darDeBaja(showConfirmBaja.id)} style={{flex:1,background:"#dc2626",color:"#fff",border:"none",borderRadius:9,padding:"10px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// COBERTURAS
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// IMPORTADOR DE BASE DE DATOS
// ═══════════════════════════════════════════════════════════════════

const CAMPOS_CLIENTE = [
  { key:"nombre",           label:"Nombre(s)",           req:true },
  { key:"apellidoPaterno",  label:"Apellido Paterno",    req:true },
  { key:"apellidoMaterno",  label:"Apellido Materno",    req:false },
  { key:"rfc",              label:"RFC",                 req:false },
  { key:"fechaNacimiento",  label:"Fecha Nacimiento",    req:false },
  { key:"sexo",             label:"Sexo (M/F)",          req:false },
  { key:"email",            label:"Email",               req:false },
  { key:"telefono",         label:"Teléfono",            req:false },
  { key:"whatsapp",         label:"WhatsApp",            req:false },
  { key:"calle",            label:"Calle",               req:false },
  { key:"numero",           label:"Número exterior",     req:false },
  { key:"colonia",          label:"Colonia",             req:false },
  { key:"cp",               label:"C.P.",                req:false },
  { key:"ciudad",           label:"Ciudad/Municipio",    req:false },
  { key:"estado",           label:"Estado",              req:false },
];

const CAMPOS_POLIZA = [
  { key:"numero",       label:"Número de Póliza",   req:true },
  { key:"cliente",      label:"Nombre del Cliente", req:true },
  { key:"aseguradora",  label:"Aseguradora",        req:false },
  { key:"ramo",         label:"Ramo",               req:false },
  { key:"subramo",      label:"Subramo",            req:false },
  { key:"inicio",       label:"Inicio Vigencia",    req:false },
  { key:"vencimiento",  label:"Vencimiento",        req:false },
  { key:"primaNeta",    label:"Prima Neta",         req:false },
  { key:"primaTotal",   label:"Prima Total",        req:false },
  { key:"formaPago",    label:"Forma de Pago",      req:false },
  { key:"status",       label:"Estatus",            req:false },
  { key:"notas",        label:"Notas",              req:false },
];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers:[], rows:[] };
  const parseRow = (line) => {
    const result=[]; let cur=""; let inQ=false;
    for (let i=0;i<line.length;i++) {
      const c=line[i];
      if (c==='"') { inQ=!inQ; }
      else if (c===','&&!inQ) { result.push(cur.trim()); cur=""; }
      else { cur+=c; }
    }
    result.push(cur.trim());
    return result;
  };
  const headers=parseRow(lines[0]).map(h=>h.replace(/^"|"$/g,""));
  const rows=lines.slice(1).filter(l=>l.trim()).map(l=>{
    const vals=parseRow(l);
    const obj={};
    headers.forEach((h,i)=>{obj[h]=(vals[i]||"").replace(/^"|"$/g,"");});
    return obj;
  });
  return {headers,rows};
}

function sugerirMapeo(colName, campos) {
  const c=colName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ");
  const sinonimos={
    nombre:["nombre","name","nombres","first name","primer nombre"],
    apellidoPaterno:["apellido paterno","apellidopaterno","paterno","last name","apellido1","primer apellido"],
    apellidoMaterno:["apellido materno","apellidomaterno","materno","apellido2","segundo apellido"],
    rfc:["rfc","registro federal","tax id","clave fiscal"],
    fechaNacimiento:["fecha nac","nacimiento","birthdate","fecha nac","birth","dob","f nac"],
    sexo:["sexo","genero","género","gender","sex"],
    email:["email","correo","mail","correo electronico"],
    telefono:["telefono","teléfono","tel","phone","celular","movil","móvil"],
    whatsapp:["whatsapp","wha","ws","wa"],
    calle:["calle","street","domicilio","direccion","dirección"],
    numero:["numero ext","número ext","no ext","num ext","numero","número"],
    colonia:["colonia","col ","barrio","neighborhood"],
    cp:["cp","c p","codigo postal","zip","postal code"],
    ciudad:["ciudad","municipio","city","municipality","poblacion"],
    estado:["estado","state","entidad"],
    // póliza
    numero:["numero poliza","número poliza","poliza","póliza","policy","no poliza","num poliza","folio"],
    cliente:["cliente","asegurado","contratante","titular","insured","customer","nombre cliente"],
    aseguradora:["aseguradora","compañia","compañía","company","insuror","aseg"],
    ramo:["ramo","tipo seguro","tipo de seguro","branch","line","producto"],
    subramo:["subramo","subproducto","plan","subproducto"],
    inicio:["inicio","vigencia inicio","fecha inicio","start","desde","valid from","vigencia desde"],
    vencimiento:["vencimiento","vigencia fin","expiracion","expiración","end","hasta","valid to","vigencia hasta"],
    primaNeta:["prima neta","neta","net premium","prima","premium net"],
    primaTotal:["prima total","total","total premium","importe total","prima con iva"],
    formaPago:["forma pago","pago","payment","periodicidad","frecuencia"],
    status:["status","estatus","estado","vigente","active","vigencia"],
    notas:["notas","nota","obs","observaciones","comments","comentarios"],
  };
  for (const [campo,syns] of Object.entries(sinonimos)) {
    if (syns.some(s=>c.includes(s)||s.includes(c))) {
      if (campos.find(f=>f.key===campo)) return campo;
    }
  }
  return "";
}

function Importador({clientes,setClientes,polizas,setPolizas}) {
  const [tipo,setTipo]=useState("clientes");
  const [step,setStep]=useState(1);
  const [headers,setHeaders]=useState([]);
  const [rows,setRows]=useState([]);
  const [fileName,setFileName]=useState("");
  const [mapeo,setMapeo]=useState({});
  const [errores,setErrores]=useState([]);
  const [importados,setImportados]=useState([]);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef();

  const camposDestino=tipo==="clientes"?CAMPOS_CLIENTE:CAMPOS_POLIZA;

  const resetear=()=>{setStep(1);setHeaders([]);setRows([]);setFileName("");setMapeo({});setErrores([]);setImportados([]);};

  const aplicarAutoMapeo=(h,campos)=>{
    const m={};
    h.forEach(col=>{const sug=sugerirMapeo(col,campos);if(sug)m[col]=sug;});
    setMapeo(m);
  };

  const leerArchivo=(file)=>{
    if(!file)return;
    setFileName(file.name);
    const ext=file.name.split(".").pop().toLowerCase();
    const reader=new FileReader();
    if(ext==="csv"){
      reader.onload=(e)=>{
        const {headers:h,rows:r}=parseCSV(e.target.result);
        setHeaders(h);setRows(r);
        aplicarAutoMapeo(h,camposDestino);
        setStep(2);
      };
      reader.readAsText(file,"UTF-8");
    } else if(["xlsx","xls"].includes(ext)){
      reader.onload=(e)=>{
        try{
          const XLSX=window.XLSX;
          if(!XLSX){alert("Librería Excel cargando, intenta de nuevo en un momento");return;}
          const wb=XLSX.read(e.target.result,{type:"array"});
          const ws=wb.Sheets[wb.SheetNames[0]];
          const data=XLSX.utils.sheet_to_json(ws,{defval:""});
          if(!data.length){alert("El archivo está vacío");return;}
          const h=Object.keys(data[0]);
          const r=data.map(row=>{const o={};h.forEach(k=>o[k]=String(row[k]||""));return o;});
          setHeaders(h);setRows(r);
          aplicarAutoMapeo(h,camposDestino);
          setStep(2);
        }catch(err){alert("Error leyendo Excel: "+err.message);}
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato no soportado. Usa CSV o Excel (.xlsx / .xls)");
    }
  };

  const buildRegistros=()=>rows.map((row,idx)=>{
    const reg={};
    Object.entries(mapeo).forEach(([col,campo])=>{if(campo)reg[campo]=row[col]||"";});
    return {...reg,_idx:idx+2};
  });

  const validar=()=>{
    const reqs=camposDestino.filter(c=>c.req).map(c=>c.key);
    const mapeados=new Set(Object.values(mapeo).filter(Boolean));
    const faltantes=reqs.filter(r=>!mapeados.has(r));
    if(faltantes.length){
      const labels=faltantes.map(k=>camposDestino.find(c=>c.key===k)?.label||k);
      alert("Faltan campos requeridos: "+labels.join(", "));
      return false;
    }
    return true;
  };

  const ejecutarImport=()=>{
    const registros=buildRegistros();
    const errs=[]; const ok=[];
    registros.forEach((reg,i)=>{
      const fila=reg._idx;
      if(tipo==="clientes"){
        if(!reg.nombre?.trim()){errs.push(`Fila ${fila}: nombre vacío`);return;}
        if(!reg.apellidoPaterno?.trim()){errs.push(`Fila ${fila}: apellido paterno vacío`);return;}
        const rfcImp=(reg.rfc||"").trim().toUpperCase();
        const nombreImp=`${reg.nombre} ${reg.apellidoPaterno} ${reg.apellidoMaterno||""}`.trim().toLowerCase();
        if(rfcImp&&clientes.some(c=>(c.rfc||"").trim().toUpperCase()===rfcImp)){errs.push(`Fila ${fila}: RFC "${rfcImp}" ya existe en el sistema`);return;}
        if(!rfcImp&&clientes.some(c=>`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno||""}`.trim().toLowerCase()===nombreImp)){errs.push(`Fila ${fila}: cliente "${reg.nombre} ${reg.apellidoPaterno}" ya existe en el sistema`);return;}
        if(rfcImp&&ok.some(c=>(c.rfc||"").trim().toUpperCase()===rfcImp)){errs.push(`Fila ${fila}: RFC "${rfcImp}" duplicado en el archivo`);return;}
        if(!rfcImp&&ok.some(c=>`${c.nombre} ${c.apellidoPaterno} ${c.apellidoMaterno||""}`.trim().toLowerCase()===nombreImp)){errs.push(`Fila ${fila}: cliente "${reg.nombre} ${reg.apellidoPaterno}" duplicado en el archivo`);return;}
        ok.push({id:Date.now()+i,nombre:reg.nombre.trim(),apellidoPaterno:reg.apellidoPaterno.trim(),
          apellidoMaterno:(reg.apellidoMaterno||"").trim(),rfc:(reg.rfc||"").toUpperCase().trim(),
          fechaNacimiento:(reg.fechaNacimiento||"").trim(),sexo:(reg.sexo||"").toUpperCase().charAt(0),
          email:(reg.email||"").trim(),telefono:(reg.telefono||"").trim(),
          whatsapp:(reg.whatsapp||reg.telefono||"").trim(),calle:(reg.calle||"").trim(),
          numero:(reg.numero||"").trim(),colonia:(reg.colonia||"").trim(),cp:(reg.cp||"").trim(),
          ciudad:(reg.ciudad||"").trim(),estado:(reg.estado||"").trim(),polizas:0});
      } else {
        if(!reg.numero?.trim()){errs.push(`Fila ${fila}: número de póliza vacío`);return;}
        if(!reg.cliente?.trim()){errs.push(`Fila ${fila}: cliente vacío`);return;}
        const numImp=(reg.numero||"").trim().toLowerCase();
        if(polizas.some(p=>(p.numero||"").trim().toLowerCase()===numImp)){errs.push(`Fila ${fila}: número "${reg.numero}" ya existe en el sistema`);return;}
        if(ok.some(p=>(p.numero||"").trim().toLowerCase()===numImp)){errs.push(`Fila ${fila}: número "${reg.numero}" duplicado en el archivo`);return;}
        ok.push({id:Date.now()+i,numero:reg.numero.trim(),cliente:reg.cliente.trim(),
          aseguradora:(reg.aseguradora||"").trim(),ramo:(reg.ramo||"").trim(),
          subramo:(reg.subramo||"").trim(),inicio:(reg.inicio||"").trim(),
          vencimiento:(reg.vencimiento||"").trim(),
          primaNeta:parseFloat((reg.primaNeta||"").replace(/[^0-9.]/g,""))||0,
          primaTotal:parseFloat((reg.primaTotal||"").replace(/[^0-9.]/g,""))||0,
          formaPago:(reg.formaPago||"Anual").trim(),status:(reg.status||"activa").toLowerCase().trim(),
          notas:(reg.notas||"").trim(),coberturas:[]});
      }
    });
    setErrores(errs); setImportados(ok);
    if(ok.length){ tipo==="clientes"?setClientes(p=>[...p,...ok]):setPolizas(p=>[...p,...ok]); }
    setStep(4);
  };

  const registrosPrev=step>=3?buildRegistros().slice(0,5):[];
  const camposMapeados=camposDestino.filter(c=>Object.values(mapeo).includes(c.key));
  const stepLabels=["Subir archivo","Mapear columnas","Previsualizar","Resultado"];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle title="Importar Base de Datos" sub="Sube tu exportación de otro CRM — clientes y/o pólizas"/>

      <div style={{background:"#fff",borderRadius:14,padding:"20px 22px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
        {/* Selector tipo */}
        <div style={{display:"flex",gap:10,marginBottom:20}}>
          {[["clientes","👤 Importar Clientes"],["polizas","📄 Importar Pólizas"]].map(([v,l])=>(
            <button key={v} onClick={()=>{setTipo(v);resetear();}}
              style={{flex:1,padding:"11px",background:tipo===v?"#0f172a":"#f8fafc",color:tipo===v?"#fff":"#374151",
                border:`2px solid ${tipo===v?"#0f172a":"#e5e7eb"}`,borderRadius:10,fontWeight:700,fontSize:13,
                cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Stepper */}
        <div style={{display:"flex",alignItems:"center",marginBottom:24}}>
          {stepLabels.map((l,i)=>{
            const n=i+1; const hecho=n<step; const activo=n===step;
            return(
              <div key={l} style={{display:"flex",alignItems:"center",flex:1}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flex:1}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:hecho?"#059669":activo?"#2563eb":"#e5e7eb",
                    color:hecho||activo?"#fff":"#9ca3af",display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:11,fontWeight:800}}>
                    {hecho?"✓":n}
                  </div>
                  <div style={{fontSize:9,fontWeight:600,color:activo?"#2563eb":hecho?"#059669":"#9ca3af",
                    textAlign:"center",letterSpacing:"0.03em",maxWidth:60}}>{l.toUpperCase()}</div>
                </div>
                {i<3&&<div style={{height:2,flex:1,background:hecho?"#059669":"#e5e7eb",marginTop:-12}}/>}
              </div>
            );
          })}
        </div>

        {/* PASO 1: Subir */}
        {step===1&&(
          <div>
            <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);leerArchivo(e.dataTransfer.files[0]);}}
              onClick={()=>fileRef.current.click()}
              style={{border:`2px dashed ${dragOver?"#2563eb":"#d1d5db"}`,borderRadius:14,padding:"44px 20px",
                textAlign:"center",cursor:"pointer",background:dragOver?"#eff6ff":"#fafafa",transition:"all .2s"}}>
              <div style={{fontSize:44,marginBottom:10}}>📂</div>
              <div style={{fontWeight:700,fontSize:15,color:"#111827",marginBottom:6}}>Arrastra tu archivo aquí</div>
              <div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>o haz clic para explorar</div>
              <div style={{display:"flex",justifyContent:"center",gap:8}}>
                {["CSV",".xlsx",".xls"].map(f=>(
                  <span key={f} style={{background:"#d1fae5",color:"#065f46",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>{f}</span>
                ))}
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}} onChange={e=>leerArchivo(e.target.files[0])}/>
            <div style={{marginTop:14,background:"#fffbeb",borderRadius:10,padding:"11px 14px",fontSize:12,color:"#92400e"}}>
              💡 <strong>Tip:</strong> Exporta tu CRM actual a Excel o CSV desde la sección de reportes.
              Las columnas no necesitan nombre exacto — las asignarás manualmente en el siguiente paso.
            </div>
          </div>
        )}

        {/* PASO 2: Mapeo */}
        {step===2&&(
          <div>
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af",marginBottom:14}}>
              📋 <strong>{fileName}</strong> — <strong>{rows.length}</strong> registros · <strong>{headers.length}</strong> columnas detectadas
            </div>
            <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:10}}>
              Asigna cada columna de tu archivo al campo del CRM:
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,maxHeight:380,overflowY:"auto",paddingRight:2}}>
              {headers.map(col=>{
                const esMapeado=mapeo[col]&&mapeo[col]!=="";
                return(
                  <div key={col} style={{display:"flex",alignItems:"center",gap:7,background:esMapeado?"#f0fdf4":"#f9fafb",
                    borderRadius:9,padding:"8px 10px",border:`1px solid ${esMapeado?"#d1fae5":"#e5e7eb"}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>ORIGEN</div>
                      <div style={{fontSize:11,fontWeight:700,color:"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={col}>{col}</div>
                    </div>
                    <div style={{color:"#d1d5db",flexShrink:0}}>→</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>CAMPO CRM</div>
                      <select value={mapeo[col]||""} onChange={e=>setMapeo(p=>({...p,[col]:e.target.value}))}
                        style={{border:`1.5px solid ${esMapeado?"#6ee7b7":"#e5e7eb"}`,borderRadius:7,padding:"4px 6px",fontSize:11,
                          outline:"none",fontFamily:"inherit",width:"100%",background:"#fff",
                          color:esMapeado?"#059669":"#374151",fontWeight:esMapeado?700:400}}>
                        <option value="">— Ignorar —</option>
                        {camposDestino.map(c=>(
                          <option key={c.key} value={c.key}>{c.label}{c.req?" *":""}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10,background:"#f0fdf4",borderRadius:9,padding:"8px 12px",fontSize:11,color:"#065f46"}}>
              ✓ {Object.values(mapeo).filter(Boolean).length} de {headers.length} columnas mapeadas
              &nbsp;·&nbsp; Campos con * son obligatorios
            </div>
            <div style={{display:"flex",gap:10,marginTop:12}}>
              <button onClick={resetear} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:"10px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>← Volver</button>
              <Btn onClick={()=>{if(validar())setStep(3);}} color="#2563eb" style={{flex:2,justifyContent:"center"}}>Previsualizar →</Btn>
            </div>
          </div>
        )}

        {/* PASO 3: Previsualización */}
        {step===3&&(
          <div>
            <div style={{background:"#eff6ff",borderRadius:9,padding:"9px 13px",fontSize:12,color:"#1e40af",marginBottom:12}}>
              👁 Primeras {Math.min(5,rows.length)} filas de <strong>{rows.length}</strong>. Verifica que los datos sean correctos.
            </div>
            <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #e5e7eb",marginBottom:12}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"#f9fafb"}}>
                    {camposMapeados.map(c=>(
                      <th key={c.key} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#374151",
                        whiteSpace:"nowrap",borderBottom:"1px solid #e5e7eb"}}>
                        {c.label}{c.req&&<span style={{color:"#dc2626"}}>*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrosPrev.map((reg,i)=>(
                    <tr key={i} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                      {camposMapeados.map(c=>(
                        <td key={c.key} style={{padding:"7px 10px",color:reg[c.key]?"#111827":"#d1d5db"}}>
                          {reg[c.key]||<em style={{fontSize:10}}>vacío</em>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{background:"#fffbeb",borderRadius:9,padding:"9px 12px",fontSize:12,color:"#92400e",marginBottom:12}}>
              ⚠️ Se importarán <strong>{rows.length} {tipo==="clientes"?"clientes":"pólizas"}</strong>. Esta acción agrega registros nuevos sin eliminar los existentes.
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setStep(2)} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:"10px",fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>← Ajustar mapeo</button>
              <Btn onClick={ejecutarImport} color="#059669" icon="check" style={{flex:2,justifyContent:"center"}}>
                Importar {rows.length} {tipo==="clientes"?"clientes":"pólizas"}
              </Btn>
            </div>
          </div>
        )}

        {/* PASO 4: Resultado */}
        {step===4&&(
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:54,marginBottom:12}}>{errores.length===0?"🎉":importados.length>0?"⚠️":"❌"}</div>
            <div style={{fontWeight:800,fontSize:20,color:"#111827",marginBottom:8}}>
              {errores.length===0?"¡Importación exitosa!":importados.length>0?"Importación parcial":"Error en importación"}
            </div>
            {importados.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:12,padding:"16px 24px",display:"inline-block",margin:"8px auto"}}>
                <div style={{fontSize:42,fontWeight:900,color:"#059669",fontFamily:"'Playfair Display',serif"}}>{importados.length}</div>
                <div style={{fontSize:13,color:"#065f46",fontWeight:600}}>
                  {tipo==="clientes"?"clientes importados":"pólizas importadas"} correctamente
                </div>
              </div>
            )}
            {errores.length>0&&(
              <div style={{background:"#fef2f2",borderRadius:10,padding:"12px 16px",marginTop:10,textAlign:"left",maxHeight:150,overflowY:"auto"}}>
                <div style={{fontSize:11,fontWeight:800,color:"#dc2626",marginBottom:6}}>⚠️ {errores.length} filas con errores:</div>
                {errores.map((e,i)=><div key={i} style={{fontSize:11,color:"#991b1b",marginBottom:2}}>• {e}</div>)}
              </div>
            )}
            <div style={{display:"flex",gap:10,marginTop:18,justifyContent:"center"}}>
              <Btn onClick={resetear} color="#2563eb">Importar otro archivo</Btn>
            </div>
          </div>
        )}
      </div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"/>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// MODAL REGISTRAR PAGO
// ═══════════════════════════════════════════════════════════════════
function PagoRowEditable({ pg, onEliminar }) {
  const [sel, setSel] = useState(false);
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:sel?"#fef2f2":"#fff",borderRadius:8,marginBottom:4,border:`1.5px solid ${sel?"#fecaca":"#e5e7eb"}`,transition:"all .15s"}}>
      <input type="checkbox" checked={sel} onChange={e=>setSel(e.target.checked)}
        style={{width:15,height:15,accentColor:"#dc2626",cursor:"pointer",flexShrink:0}}/>
      <div style={{flex:1}}>
        <div style={{fontSize:12,fontWeight:700,color:"#374151",display:"flex",alignItems:"center",gap:6}}>
          {pg.reciboNum&&<span style={{background:"#7c3aed",color:"#fff",borderRadius:20,padding:"1px 7px",fontSize:10,fontWeight:800}}>Recibo {pg.reciboNum}</span>}
          {pg.fechaEsperada&&pg.fechaEsperada!==pg.fechaPago&&<span style={{background:"#fef3c7",color:"#92400e",borderRadius:12,padding:"1px 6px",fontSize:9,fontWeight:700}}>Vto: {pg.fechaEsperada}</span>}
          <span style={{fontWeight:700}}>{pg.fechaPago}</span> · {pg.formaPago}
        </div>
        <div style={{fontSize:11,color:"#6b7280"}}>${Number(pg.monto||0).toLocaleString("es-MX",{minimumFractionDigits:2})}{pg.referencia?` · Ref: ${pg.referencia}`:""}</div>
      </div>
      {sel&&(
        <button onClick={onEliminar}
          style={{background:"#dc2626",border:"none",borderRadius:7,padding:"5px 12px",fontSize:11,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
          🗑 Eliminar
        </button>
      )}
    </div>
  );
}

function ModalPago({ poliza, onGuardar, onEliminarPago, onClose }) {
  // Calcular recibos en tiempo real si la póliza no los tiene guardados
  const calcRecibosLocal = (p) => {
    const neta=parseFloat(p.primaNeta)||0, gasto=parseFloat(p.gastosExpedicion)||0, recargo=parseFloat(p.recargoPago)||0;
    const pctIva=(parseFloat(p.porcentajeIva)||16)/100;
    const numMap2={Anual:1,Semestral:2,Trimestral:4,Mensual:12,Contado:1,"Único":1};
    const n=numMap2[p.formaPago]||1;
    const mesesL={Anual:12,Semestral:6,Trimestral:3,Mensual:1,Contado:12,"Único":12};
    const mesL=mesesL[p.formaPago]||12;
    const fRecL=(ini,i)=>{if(!ini)return "";const b=ini.includes("/")?ini.split("/").reverse().join("-"):ini;const d=new Date(b+"T12:00:00");d.setMonth(d.getMonth()+(i-1)*mesL);return d.toISOString().slice(0,10);};
    if(n<=1){const total=parseFloat(p.primaTotal)||parseFloat(p.prima)||0;return [{num:1,label:"Único",fechaPago:fRecL(p.inicio,1),primaNeta:neta,gastos:gasto,recargo,iva:+(total-neta-gasto-recargo).toFixed(2),total}];}
    return Array.from({length:n},(_,i)=>{
      const gastoEste=i===0?gasto:0, nf=+(neta/n).toFixed(2), rf=+(recargo/n).toFixed(2);
      const base=nf+gastoEste+rf, ivaEste=+(base*pctIva).toFixed(2);
      return {num:i+1,label:i===0?"1er recibo":`Recibo ${i+1}`,fechaPago:fRecL(p.inicio,i+1),primaNeta:nf,gastos:gastoEste,recargo:rf,iva:ivaEste,total:+(base+ivaEste).toFixed(2)};
    });
  };

  // Determinar recibos y cuáles ya están pagados
  const recibos = (poliza.recibos&&poliza.recibos.length>0) ? poliza.recibos : calcRecibosLocal(poliza);
  const pagosRegistrados = poliza.pagos||[];
  const numMap = {Anual:1,Semestral:2,Trimestral:4,Mensual:12,Contado:1,"Único":1};
  const totalRecibos = recibos.length || numMap[poliza.formaPago]||1;
  const tieneRecibos = recibos.length > 0;

  // Primer recibo pendiente (no pagado)
  const recibosPagadosNums = pagosRegistrados.map(p=>p.reciboNum).filter(Boolean);
  const primerPendiente = tieneRecibos
    ? (recibos.find(r=>!recibosPagadosNums.includes(r.num))?.num || 1)
    : null;

  const [reciboSel, setReciboSel] = useState(primerPendiente);

  const montoRecibo = () => {
    if (!tieneRecibos) return poliza.primaTotal||poliza.prima||"";
    const r = recibos.find(x=>x.num===reciboSel);
    return r ? r.total : "";
  };

  const primerReciboPendiente = recibos.find(r=>!recibosPagadosNums.includes(r.num));
  const [form, setForm] = useState({
    fechaPago: primerReciboPendiente?.fechaPago || new Date().toISOString().slice(0,10),
    formaPago: "Transferencia",
    monto: "",
    referencia: "",
    comprobante: null,
    comprobanteName: "",
  });

  // Actualizar monto cuando cambia el recibo seleccionado
  const handleReciboChange = (num) => {
    setReciboSel(num);
    const r = recibos.find(x=>x.num===num);
    if(r) setForm(p=>({...p, monto:r.total, fechaPago: r.fechaPago||p.fechaPago}));
  };

  // Inicializar monto al montar
  useState(()=>{ setForm(p=>({...p, monto:montoRecibo()})); },[]);

  const fileRef = useRef();
  const leerComprobante = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => setForm(p=>({...p,comprobante:e.target.result,comprobanteName:file.name}));
    r.readAsDataURL(file);
  };

  const guardar = () => {
    const recibo = recibos.find(r=>r.num===reciboSel);
    onGuardar({
      id:Date.now(),
      ...form,
      reciboNum: reciboSel,
      fechaEsperada: recibo?.fechaPago||"",
      polizaNumero: poliza.numero,
      fechaRegistro: new Date().toISOString().slice(0,10),
    });
    onClose();
  };

  const inpS = {border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Info póliza */}
      <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#065f46"}}>
        <strong>{poliza.cliente}</strong> · {poliza.aseguradora} · {poliza.ramo}
      </div>

      {/* Selector de recibo */}
      {tieneRecibos && (
        <div>
          <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:8}}>
            Recibo a pagar
            <span style={{marginLeft:8,background:"#7c3aed22",color:"#7c3aed",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>
              {poliza.formaPago} · {totalRecibos} recibo{totalRecibos>1?"s":""}
            </span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(totalRecibos,6)},1fr)`,gap:6}}>
            {recibos.map(r=>{
              const pagado = recibosPagadosNums.includes(r.num);
              const selec  = reciboSel===r.num;
              return(
                <button key={r.num} onClick={()=>!pagado&&handleReciboChange(r.num)}
                  style={{
                    border: selec?"2px solid #7c3aed":"1.5px solid "+(pagado?"#6ee7b7":"#e5e7eb"),
                    borderRadius:10, padding:"8px 6px", cursor:pagado?"default":"pointer",
                    background: pagado?"#f0fdf4":selec?"#f5f3ff":"#fff",
                    fontFamily:"inherit", textAlign:"center", opacity:pagado?0.75:1,
                    transition:"all .15s"
                  }}>
                  <div style={{fontSize:10,fontWeight:800,color:pagado?"#059669":selec?"#7c3aed":"#374151"}}>
                    {pagado?"✓ ":""}{r.label}
                  </div>
                  {r.fechaPago&&<div style={{fontSize:9,color:pagado?"#059669":selec?"#9333ea":"#6b7280",marginTop:1}}>{r.fechaPago}</div>}
                  <div style={{fontSize:12,fontWeight:900,color:pagado?"#059669":selec?"#7c3aed":"#111827",marginTop:2}}>
                    ${(r.total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}
                  </div>
                  {r.gastos>0&&r.num===1&&<div style={{fontSize:9,color:"#6b7280",marginTop:1}}>incl. gtos. exp.</div>}
                </button>
              );
            })}
          </div>
          {reciboSel&&(()=>{
            const r=recibos.find(x=>x.num===reciboSel);
            if(!r) return null;
            return(
              <div style={{marginTop:8,background:"#f5f3ff",borderRadius:9,padding:"9px 12px",border:"1px solid #ede9fe",fontSize:11,display:"flex",gap:16,flexWrap:"wrap"}}>
                <span>Prima neta: <strong>${(r.primaNeta||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</strong></span>
                {r.gastos>0&&<span style={{color:"#059669"}}>Gastos exp.: <strong>${r.gastos.toLocaleString("es-MX",{minimumFractionDigits:2})}</strong></span>}
                {r.recargo>0&&<span style={{color:"#d97706"}}>Recargo: <strong>${r.recargo.toLocaleString("es-MX",{minimumFractionDigits:2})}</strong></span>}
                <span style={{color:"#6b7280"}}>IVA: <strong>${(r.iva||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</strong></span>
                <span style={{fontWeight:800,color:"#7c3aed"}}>Total: <strong>${(r.total||0).toLocaleString("es-MX",{minimumFractionDigits:2})}</strong></span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Fecha y forma de pago */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fecha de Pago *</label>
          <input type="date" value={form.fechaPago} onChange={e=>setForm(p=>({...p,fechaPago:e.target.value}))} style={inpS}/>
        </div>
        <Sel label="Forma de Pago *" value={form.formaPago} onChange={e=>setForm(p=>({...p,formaPago:e.target.value}))}>
          {["Transferencia","Depósito bancario","Tarjeta crédito","Tarjeta débito","Cheque","Efectivo","OXXO","Domiciliación"].map(f=><option key={f}>{f}</option>)}
        </Sel>
      </div>

      {/* Monto y referencia */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Monto ($)" type="number" value={form.monto} onChange={e=>setForm(p=>({...p,monto:e.target.value}))} placeholder="0.00"/>
        <Inp label="Referencia / Folio" value={form.referencia} onChange={e=>setForm(p=>({...p,referencia:e.target.value}))} placeholder="Núm. operación"/>
      </div>

      {/* Comprobante */}
      <div>
        <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:6}}>Comprobante de pago</label>
        {form.comprobante ? (
          <div style={{background:"#f0fdf4",border:"1.5px solid #6ee7b7",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>{/\.(jpg|jpeg|png|gif)/i.test(form.comprobanteName)?"🖼️":"📄"}</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#065f46"}}>{form.comprobanteName}</div>
                <div style={{fontSize:10,color:"#059669"}}>✓ Archivo cargado</div>
              </div>
            </div>
            <button onClick={()=>setForm(p=>({...p,comprobante:null,comprobanteName:""}))}
              style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:7,padding:"4px 10px",fontSize:11,color:"#dc2626",cursor:"pointer",fontFamily:"inherit"}}>
              Cambiar
            </button>
          </div>
        ) : (
          <div onClick={()=>fileRef.current.click()}
            style={{border:"2px dashed #d1d5db",borderRadius:10,padding:"18px",textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
            <div style={{fontSize:24,marginBottom:4}}>📎</div>
            <div style={{fontSize:12,color:"#6b7280"}}>Haz clic para subir comprobante</div>
            <div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>PDF, JPG, PNG</div>
          </div>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{display:"none"}} onChange={e=>leerComprobante(e.target.files[0])}/>
      </div>

      {/* Pagos ya registrados con opción de eliminar */}
      {(poliza.pagos||[]).length>0&&(
        <div style={{background:"#fafafa",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"12px 14px"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:8}}>
            💳 Pagos registrados ({poliza.pagos.length})
          </div>
          {(poliza.pagos||[]).map((pg,i)=>(
            <PagoRowEditable key={pg.id||i} pg={pg} onEliminar={()=>{if(window.confirm("¿Eliminar este pago?"))onEliminarPago(pg.id);}}/>
          ))}
        </div>
      )}

      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,background:"#f3f4f6",border:"1.5px solid #e5e7eb",borderRadius:10,padding:"11px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
          Cancelar
        </button>
        <Btn onClick={guardar} color="#059669" icon="check" style={{flex:2,justifyContent:"center"}}>
          {reciboSel?`✓ Registrar Recibo ${reciboSel}`:"✓ Registrar Pago"}
        </Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL RENOVAR PÓLIZA
// ═══════════════════════════════════════════════════════════════════
function ModalEditarPoliza({ poliza, subagentes, onGuardar, onClose }) {
  const [form, setForm] = useState({
    numero:       poliza.numero||"",
    aseguradora:  poliza.aseguradora||"",
    ramo:         poliza.ramo||"",
    subramo:      poliza.subramo||"",
    inicio:       poliza.inicio||"",
    vencimiento:  poliza.vencimiento||"",
    formaPago:    poliza.formaPago||"Anual",
    primaNeta:    poliza.primaNeta||"",
    gastosExpedicion: poliza.gastosExpedicion||"",
    porcentajeRecargo: poliza.porcentajeRecargo||"",
    recargoPago:  poliza.recargoPago||"",
    porcentajeIva: poliza.porcentajeIva||16,
    montoIva:     poliza.montoIva||"",
    primaTotal:   poliza.primaTotal||poliza.prima||"",
    moneda:       poliza.moneda||"MXN",
    agentePoliza: poliza.agentePoliza||"",
    beneficiarioPreferente: poliza.beneficiarioPreferente||"",
    subagenteId:  poliza.subagenteId||"",
    subagente:    poliza.subagente||"",
    comisionSubagente: poliza.comisionSubagente||"",
    notas:        poliza.notas||"",
  });

  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const inpS = {border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};
  const lbl = (t) => <div style={{fontSize:11,fontWeight:700,color:"#374151",marginBottom:4}}>{t}</div>;

  const guardar = () => {
    onGuardar({
      ...form,
      primaNeta: parseFloat(form.primaNeta)||0,
      gastosExpedicion: parseFloat(form.gastosExpedicion)||0,
      recargoPago: parseFloat(form.recargoPago)||0,
      porcentajeIva: parseFloat(form.porcentajeIva)||16,
      montoIva: parseFloat(form.montoIva)||0,
      primaTotal: parseFloat(form.primaTotal)||0,
      prima: parseFloat(form.primaTotal)||0,
    });
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"#eff6ff",borderRadius:10,padding:"9px 14px",fontSize:12,color:"#1e40af",fontWeight:600}}>
        ✏️ Edita los campos que necesites completar o corregir
      </div>

      {/* Datos generales */}
      <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",border:"1px solid #e5e7eb"}}>
        <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>📋 Datos Generales</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>{lbl("Número de Póliza")}<input value={form.numero} onChange={e=>upd("numero",e.target.value)} style={inpS}/></div>
          <div>{lbl("Aseguradora")}<input value={form.aseguradora} onChange={e=>upd("aseguradora",e.target.value)} style={inpS}/></div>
          <div>{lbl("Ramo")}<input value={form.ramo} onChange={e=>upd("ramo",e.target.value)} style={inpS}/></div>
          <div>{lbl("Subramo")}<input value={form.subramo} onChange={e=>upd("subramo",e.target.value)} style={inpS}/></div>
          <div>{lbl("Inicio Vigencia")}<input type="date" value={form.inicio} onChange={e=>{
            upd("inicio",e.target.value);
            if(e.target.value){const f=new Date(e.target.value+"T12:00:00");f.setFullYear(f.getFullYear()+1);upd("vencimiento",f.toISOString().slice(0,10));}
          }} style={inpS}/></div>
          <div>{lbl("Fin Vigencia")}<input type="date" value={form.vencimiento} onChange={e=>upd("vencimiento",e.target.value)} style={{...inpS,borderColor:"#6ee7b7"}}/></div>
        </div>
      </div>

      {/* Datos económicos */}
      <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",border:"1px solid #e5e7eb"}}>
        <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>💰 Datos Económicos</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            {lbl("Forma de Pago")}
            <select value={form.formaPago} onChange={e=>upd("formaPago",e.target.value)} style={inpS}>
              {["Anual","Semestral","Trimestral","Mensual","Contado","Único"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            {lbl("Moneda")}
            <select value={form.moneda} onChange={e=>upd("moneda",e.target.value)} style={inpS}>
              {["MXN","USD","UDI"].map(f=><option key={f}>{f}</option>)}
            </select>
          </div>
          <div>{lbl("Prima Neta ($)")}<input type="number" value={form.primaNeta} onChange={e=>upd("primaNeta",e.target.value)} style={inpS}/></div>
          <div>{lbl("Gastos de Expedición ($)")}<input type="number" value={form.gastosExpedicion} onChange={e=>upd("gastosExpedicion",e.target.value)} style={inpS}/></div>
          <div>{lbl("% Recargo Fracc.")}<input type="number" value={form.porcentajeRecargo} onChange={e=>upd("porcentajeRecargo",e.target.value)} style={inpS}/></div>
          <div>{lbl("Recargo Fracc. ($)")}<input type="number" value={form.recargoPago} onChange={e=>upd("recargoPago",e.target.value)} style={inpS}/></div>
          <div>{lbl("% IVA")}<input type="number" value={form.porcentajeIva} onChange={e=>upd("porcentajeIva",e.target.value)} style={inpS}/></div>
          <div>{lbl("Monto IVA ($)")}<input type="number" value={form.montoIva} onChange={e=>upd("montoIva",e.target.value)} style={inpS}/></div>
          <div style={{gridColumn:"1/-1",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:10,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{color:"#94a3b8",fontSize:12,fontWeight:700}}>PRIMA TOTAL</div>
            <input type="number" value={form.primaTotal} onChange={e=>upd("primaTotal",e.target.value)}
              style={{background:"transparent",border:"none",color:"#fff",fontSize:20,fontWeight:900,textAlign:"right",width:160,outline:"none",fontFamily:"inherit"}}/>
          </div>
        </div>
      </div>

      {/* Subagente */}
      <div style={{background:"#f9fafb",borderRadius:10,padding:"12px 14px",border:"1px solid #e5e7eb"}}>
        <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10,textTransform:"uppercase",letterSpacing:".05em"}}>🤝 Subagente (si aplica)</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:10}}>
          <div>
            {lbl("Subagente")}
            <select value={form.subagenteId} onChange={e=>{
              const sa = subagentes.find(s=>s.id===Number(e.target.value));
              upd("subagenteId", e.target.value);
              upd("subagente", sa?.nombre||"");
            }} style={inpS}>
              <option value="">— Sin subagente —</option>
              {(subagentes||[]).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>{lbl("Comisión (%)")}<input type="number" value={form.comisionSubagente} onChange={e=>upd("comisionSubagente",e.target.value)} style={inpS} placeholder="0"/></div>
        </div>
      </div>

      {/* Otros */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div>{lbl("Agente / Nombre")}<input value={form.agentePoliza} onChange={e=>upd("agentePoliza",e.target.value)} style={inpS}/></div>
        <div>{lbl("Beneficiario Preferente")}<input value={form.beneficiarioPreferente} onChange={e=>upd("beneficiarioPreferente",e.target.value)} style={inpS}/></div>
      </div>
      <div>{lbl("Notas")}<textarea value={form.notas} onChange={e=>upd("notas",e.target.value)} style={{...inpS,minHeight:80,resize:"vertical"}} placeholder="Observaciones adicionales"/></div>

      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,background:"#f3f4f6",border:"1.5px solid #e5e7eb",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
          Cancelar
        </button>
        <button onClick={guardar} style={{flex:2,background:"#2563eb",border:"none",borderRadius:10,padding:11,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
          💾 Guardar cambios
        </button>
      </div>
    </div>
  );
}

function ModalRenovar({ poliza, onGuardar, onClose }) {
  const sumarAnio = (s) => {
    if (!s) return "";
    const f = new Date((s.includes("/")?s.split("/").reverse().join("-"):s)+"T12:00:00");
    f.setFullYear(f.getFullYear()+1);
    return f.toISOString().slice(0,10);
  };

  const [form, setForm] = useState({
    numero: poliza.numero+"-R",
    inicio: poliza.vencimiento||new Date().toISOString().slice(0,10),
    vencimiento: sumarAnio(poliza.vencimiento||new Date().toISOString().slice(0,10)),
    primaNeta: poliza.primaNeta||poliza.prima||"",
    gastosExpedicion: poliza.gastosExpedicion||"",
    primaTotal: poliza.primaTotal||"",
    formaPago: poliza.formaPago||"Anual",
    notas: "",
    documentoPoliza: null,
    documentoNombre: "",
    documentoTipo: "",
  });
  const [docFileData, setDocFileData] = useState(null); // {base64, type} para IA
  const [scanStep, setScanStep] = useState("idle"); // idle | scanning | done | error
  const [scanMsg, setScanMsg] = useState("");
  const [camposActualizados, setCamposActualizados] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const docRef = useRef();

  const calcTotal = (f) => ((parseFloat(f.primaNeta)||0)+(parseFloat(f.gastosExpedicion)||0))*1.16;
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  const guardar = () => {
    onGuardar({
      ...poliza, id:Date.now(),
      numero:form.numero, inicio:form.inicio, vencimiento:form.vencimiento,
      primaNeta:parseFloat(form.primaNeta)||0,
      gastosExpedicion:parseFloat(form.gastosExpedicion)||0,
      primaTotal:parseFloat(form.primaTotal)||calcTotal(form),
      formaPago:form.formaPago, status:"activa",
      notas:form.notas, pagos:[], renovadaDe:poliza.numero,
      documentoPoliza:form.documentoPoliza,
      documentoNombre:form.documentoNombre,
      documentoTipo:form.documentoTipo,
    });
    onClose();
  };

  // Cargar archivo (documento + datos para IA)
  const cargarArchivo = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      setDocFileData({ base64, type: file.type });
      setForm(p=>({...p,
        documentoPoliza: e.target.result,
        documentoNombre: file.name,
        documentoTipo: file.type,
      }));
      setScanStep("idle");
      setCamposActualizados([]);
    };
    reader.readAsDataURL(file);
  };

  // Analizar con IA y actualizar campos
  const analizarConIA = async () => {
    if (!docFileData) return;
    setScanStep("scanning");
    setScanMsg("");
    setCamposActualizados([]);
    try {
      const block = docFileData.type === "application/pdf"
        ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:docFileData.base64 }}
        : { type:"image",    source:{ type:"base64", media_type:docFileData.type,  data:docFileData.base64 }};

      const res = await fetch("/api/anthropic", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:[
              block,
              { type:"text", text:`Eres un extractor de datos de pólizas de seguro mexicanas.
Extrae de este documento los siguientes campos de la RENOVACIÓN.
Responde SOLO con JSON válido, sin markdown ni texto adicional:
{
  "numero": "número de póliza (string)",
  "inicio": "fecha inicio vigencia en formato YYYY-MM-DD",
  "vencimiento": "fecha vencimiento en formato YYYY-MM-DD",
  "primaNeta": "número decimal sin comas ni signos",
  "gastosExpedicion": "número decimal sin comas ni signos",
  "primaTotal": "número decimal sin comas ni signos",
  "formaPago": "Anual/Semestral/Trimestral/Mensual/Contado"
}
Si un campo no aparece en el documento, usa null.` }
            ]
          }]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Error API");

      const text = data.content.map(b => b.type==="text"?b.text:"").join("");
      const clean = text.replace(/```json|```/g,"").trim();
      const extraido = JSON.parse(clean);

      // Aplicar solo campos que vienen con valor
      const actualizados = [];
      const LABELS = {
        numero:"Número póliza", inicio:"Inicio vigencia", vencimiento:"Fin vigencia",
        primaNeta:"Prima neta", gastosExpedicion:"Gastos expedición",
        primaTotal:"Prima total", formaPago:"Forma de pago"
      };
      const nuevo = {...form};
      Object.entries(extraido).forEach(([k,v]) => {
        if (v !== null && v !== undefined && v !== "" && LABELS[k]) {
          nuevo[k] = String(v);
          actualizados.push({ campo: LABELS[k], valor: String(v) });
        }
      });
      // Recalcular prima total si no vino explícita
      if (!extraido.primaTotal && (extraido.primaNeta || extraido.gastosExpedicion)) {
        const total = calcTotal(nuevo).toFixed(2);
        nuevo.primaTotal = total;
        actualizados.push({ campo:"Prima total (calc.)", valor:`$${parseFloat(total).toLocaleString("es-MX",{minimumFractionDigits:2})}` });
      }
      setForm(nuevo);
      setCamposActualizados(actualizados);
      setScanStep("done");

    } catch(err) {
      setScanStep("error");
      setScanMsg(err.message);
    }
  };

  const esPDF = form.documentoTipo==="application/pdf" || form.documentoNombre?.toLowerCase().endsWith(".pdf");

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>

      {/* Info póliza origen */}
      <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#1e40af"}}>
        🔄 Renovación de <strong>{poliza.numero}</strong> · La original quedará como <strong>vencida</strong>.
      </div>
      <div style={{background:"#f9fafb",borderRadius:9,padding:"10px 14px",display:"flex",gap:20,flexWrap:"wrap"}}>
        {[["Cliente",poliza.cliente],["Aseguradora",poliza.aseguradora],["Ramo",poliza.ramo],["Subramo",poliza.subramo||"—"]].map(([l,v])=>(
          <div key={l}><div style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>{l}</div><div style={{fontSize:12,fontWeight:700,color:"#111827"}}>{v}</div></div>
        ))}
      </div>

      {/* ── ZONA DOCUMENTO ── */}
      <div style={{border:"1.5px solid #e9d5ff",borderRadius:12,overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:"#7c3aed",padding:"10px 15px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>📎</span>
            <span style={{color:"#fff",fontSize:12,fontWeight:700}}>Documento de póliza renovada</span>
          </div>
          {form.documentoPoliza&&(
            <div style={{display:"flex",gap:7}}>
              {/* Botón IA */}
              <button onClick={analizarConIA} disabled={scanStep==="scanning"}
                style={{background:scanStep==="scanning"?"rgba(255,255,255,.15)":"rgba(255,255,255,.9)",
                  border:"none",borderRadius:7,padding:"5px 12px",fontSize:11,fontWeight:800,
                  cursor:scanStep==="scanning"?"not-allowed":"pointer",fontFamily:"inherit",
                  color:scanStep==="scanning"?"#fff":"#7c3aed",display:"flex",alignItems:"center",gap:5}}>
                {scanStep==="scanning"
                  ? <><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> Analizando...</>
                  : <><span>⚡</span> Leer con IA</>
                }
              </button>
              {/* Cambiar archivo */}
              <button onClick={()=>docRef.current.click()}
                style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:7,padding:"5px 10px",
                  fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#fff"}}>
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Cuerpo zona documento */}
        <div style={{background:"#faf5ff",padding:"14px 15px"}}>
          {!form.documentoPoliza ? (
            /* Drop zone */
            <div
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onDrop={e=>{e.preventDefault();setDragOver(false);cargarArchivo(e.dataTransfer.files[0]);}}
              onClick={()=>docRef.current.click()}
              style={{border:`2px dashed ${dragOver?"#7c3aed":"#c4b5fd"}`,borderRadius:10,padding:"22px 20px",
                textAlign:"center",cursor:"pointer",background:dragOver?"#ede9fe":"#fff",transition:"all .2s"}}>
              <div style={{fontSize:30,marginBottom:6}}>📄</div>
              <div style={{fontWeight:700,fontSize:13,color:"#7c3aed",marginBottom:4}}>
                Sube la póliza renovada
              </div>
              <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>
                La IA leerá los datos automáticamente
              </div>
              <div style={{display:"flex",justifyContent:"center",gap:6}}>
                {["PDF","JPG","PNG"].map(f=>(
                  <span key={f} style={{background:"#ede9fe",color:"#7c3aed",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{f}</span>
                ))}
              </div>
            </div>
          ) : (
            /* Archivo cargado */
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {/* Info archivo */}
              <div style={{display:"flex",alignItems:"center",gap:10,background:"#fff",borderRadius:9,padding:"9px 12px",border:"1px solid #e9d5ff"}}>
                <span style={{fontSize:22}}>{esPDF?"📄":"🖼️"}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#5b21b6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{form.documentoNombre}</div>
                  <div style={{fontSize:10,color:"#9ca3af"}}>Documento listo · presiona "Leer con IA" para extraer datos</div>
                </div>
              </div>

              {/* Estado IA */}
              {scanStep==="scanning"&&(
                <div style={{background:"#ede9fe",borderRadius:9,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  <span style={{fontSize:18,animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#5b21b6"}}>Analizando documento...</div>
                    <div style={{fontSize:11,color:"#7c3aed"}}>La IA está extrayendo número, fechas y primas</div>
                  </div>
                </div>
              )}

              {scanStep==="done"&&camposActualizados.length>0&&(
                <div style={{background:"#f0fdf4",borderRadius:9,padding:"10px 14px",border:"1px solid #d1fae5"}}>
                  <div style={{fontSize:11,fontWeight:800,color:"#059669",marginBottom:8}}>
                    ✅ IA actualizó {camposActualizados.length} campo{camposActualizados.length>1?"s":""} automáticamente:
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {camposActualizados.map((c,i)=>(
                      <div key={i} style={{background:"#dcfce7",borderRadius:7,padding:"4px 10px",fontSize:11}}>
                        <span style={{color:"#6b7280"}}>{c.campo}: </span>
                        <span style={{fontWeight:700,color:"#059669"}}>{c.valor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scanStep==="done"&&camposActualizados.length===0&&(
                <div style={{background:"#fffbeb",borderRadius:9,padding:"9px 13px",fontSize:12,color:"#92400e"}}>
                  ⚠️ La IA procesó el documento pero no encontró campos reconocibles. Verifica los datos manualmente.
                </div>
              )}

              {scanStep==="error"&&(
                <div style={{background:"#fef2f2",borderRadius:9,padding:"9px 13px",fontSize:12,color:"#dc2626"}}>
                  ❌ Error al analizar: {scanMsg}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <input ref={docRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{display:"none"}}
        onChange={e=>cargarArchivo(e.target.files[0])}/>

      {/* ── CAMPOS EDITABLES ── */}
      <Inp label="Número de póliza renovada *" value={form.numero} onChange={e=>upd("numero",e.target.value)}/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Inicio vigencia *</label>
          <input type="date" value={form.inicio} onChange={e=>upd("inicio",e.target.value)}
            style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fin vigencia *</label>
          <input type="date" value={form.vencimiento} onChange={e=>upd("vencimiento",e.target.value)}
            style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <Inp label="Prima Neta ($)" type="number" value={form.primaNeta}
          onChange={e=>{const n={...form,primaNeta:e.target.value};setForm({...n,primaTotal:calcTotal(n).toFixed(2)});}} placeholder="0.00"/>
        <Inp label="Gastos Expedición ($)" type="number" value={form.gastosExpedicion}
          onChange={e=>{const n={...form,gastosExpedicion:e.target.value};setForm({...n,primaTotal:calcTotal(n).toFixed(2)});}} placeholder="0.00"/>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Prima Total c/IVA</label>
          <div style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",background:"#f0fdf4",fontSize:13,fontWeight:800,color:"#059669"}}>
            ${parseFloat(form.primaTotal||calcTotal(form)||0).toLocaleString("es-MX",{minimumFractionDigits:2})}
          </div>
        </div>
      </div>

      <Sel label="Forma de Pago" value={form.formaPago} onChange={e=>upd("formaPago",e.target.value)}>
        {["Anual","Semestral","Trimestral","Mensual","Contado"].map(f=><option key={f}>{f}</option>)}
      </Sel>

      <div>
        <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Notas de renovación</label>
        <textarea value={form.notas} onChange={e=>upd("notas",e.target.value)} rows={2}
          placeholder="Cambios en coberturas, ajustes de prima, observaciones..."
          style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",resize:"none",boxSizing:"border-box"}}/>
      </div>

      <Btn onClick={guardar} color="#7c3aed" style={{width:"100%",justifyContent:"center"}}>
        🔄 Crear Renovación{form.documentoPoliza?" (con documento adjunto)":""}
      </Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CALENDARIO
// ═══════════════════════════════════════════════════════════════════
function Calendario({ polizas, clientes, tareas, setPolizas }) {
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtro, setFiltro] = useState("todos");
  const [diaSelec, setDiaSelec] = useState(null);
  const [polizaCalendario, setPolizaCalendario] = useState(null);
  const [pagoCalendario, setPagoCalendario] = useState(null);
  const [evSelec, setEvSelec] = useState(null); // índice del evento seleccionado en el día

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  const prevMes = () => { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); };
  const nextMes = () => { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); };

  // gcalUrl definida localmente para evitar crash
  const gcalUrl = (ev) => {
    if (!ev?.obj?.vencimiento && ev?.tipo!=="cumpleanos") return null;
    try {
      const title = ev.tipo==="cumpleanos"
        ? encodeURIComponent("🎂 Cumpleaños: "+ev.label)
        : encodeURIComponent("Vence póliza: "+ev.obj?.numero+" · "+ev.obj?.cliente);
      const fecha = ev.tipo==="cumpleanos"
        ? `${anio}${String(mes+1).padStart(2,"0")}${String(ev.dia||diaSelec||1).padStart(2,"0")}`
        : (ev.obj?.vencimiento||"").replace(/-/g,"").slice(0,8);
      if (!fecha || fecha.length<8) return null;
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fecha}/${fecha}`;
    } catch { return null; }
  };

  const parseFechaStr = (s) => {
    if (!s) return null;
    if (s.includes("/")) { const [d,m,y]=s.split("/"); return new Date(`${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}T12:00:00`); }
    return new Date(s+"T12:00:00");
  };

  const getStatus = (p) => {
    if (p.status==="cancelada") return "cancelada";
    const f = parseFechaStr(p.vencimiento);
    if (!f) return "activa";
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const diff = Math.round((f-hoy)/86400000);
    if (diff<0) return "vencida";
    if (diff<=10) return "por vencer";
    return "activa";
  };

  const ST_COLOR = { activa:"#059669","por vencer":"#d97706",vencida:"#dc2626",cancelada:"#6b7280" };

  // Construir mapa de eventos por día
  const eventos = {};
  const add = (fechaStr, ev) => {
    if (!fechaStr) return;
    const f = parseFechaStr(fechaStr);
    if (!f) return;
    if (f.getMonth()!==mes||f.getFullYear()!==anio) return;
    const d = f.getDate();
    if (!eventos[d]) eventos[d] = [];
    eventos[d].push(ev);
  };

  if (filtro==="todos"||filtro==="polizas") {
    polizas.forEach(p=>{
      const st=getStatus(p);
      add(p.vencimiento,{tipo:"vencimiento",label:p.numero.slice(-8),sub:p.cliente,color:ST_COLOR[st],icon:"📋",obj:p,st});
      add(p.inicio,{tipo:"inicio",label:p.numero.slice(-8),sub:p.cliente,color:"#2563eb",icon:"🟢",obj:p,st:"activa"});
    });
  }
  if (filtro==="todos"||filtro==="cumpleanos") {
    clientes.forEach(c=>{
      if (!c.fechaNacimiento) return;
      const f = parseFechaStr(c.fechaNacimiento);
      if (!f) return;
      if (f.getMonth()!==mes) return;
      const key = f.getDate();
      if (!eventos[key]) eventos[key]=[];
      eventos[key].push({tipo:"cumpleanos",label:`${c.nombre} ${c.apellidoPaterno}`,sub:``,color:"#7c3aed",icon:"🎂",obj:c});
    });
  }
  // Tareas con fecha en este mes
  if (filtro==="todos") {
    (tareas||[]).filter(t=>!t.done&&t.fecha).forEach(t=>{
      const f = parseFechaStr(t.fecha);
      if (!f||f.getMonth()!==mes||f.getFullYear()!==anio) return;
      const key = f.getDate();
      if (!eventos[key]) eventos[key]=[];
      const prioColor = t.prioridad==="alta"?"#dc2626":t.prioridad==="media"?"#d97706":"#059669";
      eventos[key].push({tipo:"tarea",label:t.titulo.slice(0,20)+(t.titulo.length>20?"…":""),sub:t.prioridad,color:prioColor,icon:"📌",obj:t});
    });
  }

  // Grilla calendario
  const primerDia = new Date(anio,mes,1).getDay();
  const inicioGrilla = primerDia===0?6:primerDia-1;
  const diasMes = new Date(anio,mes+1,0).getDate();
  const totalCeldas = Math.ceil((inicioGrilla+diasMes)/7)*7;
  const hoyObj = new Date();
  const esHoy = (d) => d===hoyObj.getDate()&&mes===hoyObj.getMonth()&&anio===hoyObj.getFullYear();

  // Eventos del día seleccionado
  const evsDiaSelec = diaSelec ? (eventos[diaSelec]||[]) : [];

  // Todos los eventos del mes ordenados
  const eventosFlat = Object.entries(eventos)
    .sort(([a],[b])=>Number(a)-Number(b))
    .flatMap(([d,evs])=>evs.map(e=>({...e,dia:Number(d)})));

  // Contadores rápidos
  const vencenMes  = polizas.filter(p=>{const f=parseFechaStr(p.vencimiento);return f&&f.getMonth()===mes&&f.getFullYear()===anio;}).length;
  const porVencer  = polizas.filter(p=>{const f=parseFechaStr(p.vencimiento);if(!f)return false;const d=Math.round((f-new Date())/86400000);return d>=0&&d<=10;}).length;
  const cumplesMes = clientes.filter(c=>{const f=parseFechaStr(c.fechaNacimiento);return f&&f.getMonth()===mes;}).length;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <SectionTitle title="Calendario" sub="Vencimientos, renovaciones y cumpleaños de clientes"/>

      {/* Contadores — mismo diseño KPICard */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {[
          {icon:"policies", label:"Vencen este mes",    value:vencenMes,  accent:"#dc2626", sub:`en ${MESES[mes]}`},
          {icon:"bell",     label:"Por vencer ≤10 días",value:porVencer,  accent:"#d97706", sub:"requieren atención"},
          {icon:"clients",  label:"Cumpleaños este mes",value:cumplesMes, accent:"#7c3aed", sub:`en ${MESES[mes]}`},
        ].map(({icon,label,value,accent,sub})=>(
          <div key={label} style={{background:"#fff",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",borderTop:`3px solid ${accent}`,display:"flex",flexDirection:"column",gap:6,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",right:14,top:14,background:accent+"15",color:accent,borderRadius:10,padding:7,display:"flex"}}>
              <Icon name={icon} size={18}/>
            </div>
            <span style={{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.1em"}}>{label}</span>
            <div style={{fontSize:30,fontWeight:700,color:"#0f172a",fontFamily:"'Inter',sans-serif",lineHeight:1.1,letterSpacing:"-0.5px"}}>{value}</div>
            <div style={{fontSize:11,color:accent,fontWeight:600}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Layout principal: calendario + panel derecho */}
      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>

        {/* Calendario */}
        <div style={{flex:1,background:"linear-gradient(145deg,#ffffff,#f8fafc)",borderRadius:20,padding:"24px",boxShadow:"0 4px 20px rgba(0,0,0,0.08)",border:"1px solid #e2e8f0"}}>

          {/* Navegación mes */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button onClick={prevMes} style={{background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#374151"}}
              onMouseEnter={e=>e.currentTarget.style.background="#e2e8f0"}
              onMouseLeave={e=>e.currentTarget.style.background="#f1f5f9"}>‹</button>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <select value={mes} onChange={e=>setMes(Number(e.target.value))}
                style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",border:"none",borderRadius:10,padding:"8px 14px",
                  fontSize:15,fontWeight:800,color:"#fff",fontFamily:"'Playfair Display',serif",cursor:"pointer",outline:"none",appearance:"none"}}>
                {MESES.map((m,i)=><option key={i} value={i} style={{background:"#0f172a"}}>{m}</option>)}
              </select>
              <select value={anio} onChange={e=>setAnio(Number(e.target.value))}
                style={{background:"#f1f5f9",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"8px 14px",
                  fontSize:15,fontWeight:700,color:"#374151",fontFamily:"'Inter',sans-serif",cursor:"pointer",outline:"none",appearance:"none"}}>
                {Array.from({length:10},(_,i)=>new Date().getFullYear()-3+i).map(y=>(
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextMes} style={{background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"#374151"}}
              onMouseEnter={e=>e.currentTarget.style.background="#e2e8f0"}
              onMouseLeave={e=>e.currentTarget.style.background="#f1f5f9"}>›</button>
          </div>

          {/* Filtros */}
          <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"center"}}>
            {[["todos","Todos"],["polizas","🛡 Pólizas"],["cumpleanos","🎂 Cumpleaños"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFiltro(v)}
                style={{padding:"6px 16px",background:filtro===v?"#0f172a":"#f8fafc",color:filtro===v?"#fff":"#374151",
                  border:`1.5px solid ${filtro===v?"#0f172a":"#e5e7eb"}`,borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {l}
              </button>
            ))}
          </div>

          {/* Encabezado días */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>
            {DIAS_SEMANA.map((d,i)=>(
              <div key={d} style={{textAlign:"center",fontSize:12,fontWeight:800,
                color:i>=5?"#f87171":"#64748b",padding:"6px 0",letterSpacing:"0.04em"}}>
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
            {Array.from({length:totalCeldas},(_,i)=>{
              const dia=i-inicioGrilla+1;
              const valido=dia>=1&&dia<=diasMes;
              const evs=valido?(eventos[dia]||[]):[];
              const hoyF=valido&&esHoy(dia);
              const selec=valido&&diaSelec===dia;
              const hayVenc=evs.some(e=>e.tipo==="vencimiento"&&e.st==="vencida");
              const hayPorVenc=evs.some(e=>e.tipo==="vencimiento"&&e.st==="por vencer");
              const hayCumple=evs.some(e=>e.tipo==="cumpleanos");
              const hayInicio=evs.some(e=>e.tipo==="inicio");
              const hayTarea=evs.some(e=>e.tipo==="tarea");
              const esFinde = valido && ((i % 7) === 5 || (i % 7) === 6);
              return (
                <div key={i} onClick={()=>{if(valido){setDiaSelec(diaSelec===dia?null:dia);setEvSelec(null);}}}
                  style={{minHeight:80,borderRadius:10,padding:"6px 7px",cursor:valido?"pointer":"default",
                    background:!valido?"transparent":hoyF?"linear-gradient(135deg,#0f172a,#1e3a5f)":selec?"linear-gradient(135deg,#eff6ff,#dbeafe)":hayVenc?"#fef2f2":hayPorVenc?"#fffbeb":hayCumple?"#faf5ff":esFinde?"#f8fafc":"#fff",
                    border:hoyF?"2px solid #3b82f6":selec?"2px solid #6366f1":hayVenc?"1.5px solid #fca5a5":hayPorVenc?"1.5px solid #fbbf24":hayCumple?"1.5px solid #c4b5fd":hayInicio?"1.5px solid #93c5fd":hayTarea?"1.5px solid #fde68a":"1px solid #f1f5f9",
                    transition:"all .15s",
                    boxShadow:selec?"0 4px 12px rgba(99,102,241,0.2)":hoyF?"0 4px 12px rgba(15,23,42,0.25)":"none"}}>
                  {valido&&(
                    <>
                      <div style={{fontSize:13,fontWeight:hoyF?900:esFinde?700:500,
                        color:hoyF?"#fff":selec?"#1d4ed8":esFinde?"#94a3b8":"#1e293b",
                        marginBottom:4,textAlign:"center",lineHeight:1}}>{dia}</div>
                      {evs.length===1&&(
                        <div style={{fontSize:9,fontWeight:700,color:"#fff",background:evs[0].color,borderRadius:4,
                          padding:"2px 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.4}}>
                          {evs[0].icon} {evs[0].label}
                        </div>
                      )}
                      {evs.length>1&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:3,justifyContent:"center",marginTop:2}}>
                          {evs.slice(0,4).map((ev,ei)=>(
                            <div key={ei} title={ev.label} style={{width:8,height:8,borderRadius:"50%",background:ev.color,boxShadow:`0 1px 2px ${ev.color}88`}}/>
                          ))}
                          {evs.length>4&&<div style={{fontSize:7,color:"#6b7280",fontWeight:700}}>+{evs.length-4}</div>}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap",justifyContent:"center",paddingTop:10,borderTop:"1px solid #f1f5f9"}}>
            {[["#2563eb","Inicio"],["#059669","Vigente"],["#d97706","Por vencer"],["#dc2626","Vencida"],["#7c3aed","Cumpleaños"],["#f59e0b","Tarea"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#64748b",fontWeight:600}}>
                <div style={{width:9,height:9,borderRadius:2,background:c}}/>{l}
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho */}
        <div style={{width:290,flexShrink:0}}>
          {diaSelec&&evsDiaSelec.length>0?(
            <div style={{background:"#fff",borderRadius:20,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.1)",border:"1px solid #e2e8f0"}}>
              {/* Header */}
              <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",padding:"14px 16px",flexShrink:0}}>
                <div style={{fontSize:9,color:"#64748b",fontWeight:700,letterSpacing:"0.08em",marginBottom:1}}>DÍA SELECCIONADO</div>
                <div style={{fontSize:17,fontWeight:900,color:"#fff",fontFamily:"'Playfair Display',serif"}}>{diaSelec} de {MESES[mes]}</div>
                <div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{anio} · {evsDiaSelec.length} evento{evsDiaSelec.length>1?"s":""}</div>
              </div>

              {/* Selector cuando hay más de 1 */}
              {evsDiaSelec.length>1&&(
                <div style={{padding:"8px 12px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",flexShrink:0}}>
                  <div style={{fontSize:9,fontWeight:700,color:"#6b7280",marginBottom:6,letterSpacing:"0.06em"}}>SELECCIONA UN EVENTO</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {evsDiaSelec.map((ev,i)=>(
                      <button key={i} onClick={()=>setEvSelec(evSelec===i?null:i)}
                        style={{display:"flex",alignItems:"center",gap:7,padding:"6px 9px",
                          background:evSelec===i?ev.color:"#fff",
                          color:evSelec===i?"#fff":"#374151",
                          border:`1.5px solid ${evSelec===i?ev.color:"#e5e7eb"}`,
                          borderRadius:8,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s"}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:evSelec===i?"rgba(255,255,255,0.8)":ev.color,flexShrink:0}}/>
                        <span style={{fontSize:10,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {ev.icon} {ev.label}
                        </span>
                        <span style={{fontSize:8,fontWeight:600,opacity:0.7,flexShrink:0}}>
                          {ev.tipo==="cumpleanos"?"CUMPLE":ev.tipo==="vencimiento"?"VENCE":ev.tipo==="inicio"?"INICIA":"TAREA"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalle scrollable */}
              <div style={{maxHeight:480,overflowY:"auto",padding:"12px"}}>
                {(()=>{
                  const evActivo = evsDiaSelec.length===1 ? evsDiaSelec[0] : (evSelec!==null ? evsDiaSelec[evSelec] : null);
                  if (!evActivo) return (
                    <div style={{textAlign:"center",color:"#9ca3af",fontSize:11,paddingTop:16}}>
                      👆 Selecciona un evento
                    </div>
                  );
                  return (
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {/* Header evento */}
                      <div style={{background:`linear-gradient(135deg,${evActivo.color},${evActivo.color}cc)`,borderRadius:10,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontSize:18}}>{evActivo.icon}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#fff"}}>{evActivo.label}</div>
                          <div style={{fontSize:10,color:"rgba(255,255,255,0.75)"}}>
                            {evActivo.tipo==="cumpleanos"?"Cumpleaños":evActivo.tipo==="vencimiento"?"Vencimiento":evActivo.tipo==="inicio"?"Inicio vigencia":"Tarea"}
                          </div>
                        </div>
                      </div>
                      {/* Info póliza */}
                      {(evActivo.tipo==="vencimiento"||evActivo.tipo==="inicio")&&evActivo.obj&&(
                        <div style={{background:"#f9fafb",borderRadius:9,padding:"9px 11px",border:"1px solid #f1f5f9"}}>
                          <div style={{fontSize:9,color:"#9ca3af",fontWeight:600,marginBottom:2}}>PÓLIZA</div>
                          <div style={{fontSize:12,fontWeight:800,color:"#111827",fontFamily:"monospace"}}>{evActivo.obj.numero}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{evActivo.obj.aseguradora} · {evActivo.obj.ramo}</div>
                          {evActivo.obj.primaTotal&&<div style={{fontSize:13,fontWeight:700,color:"#059669",marginTop:2,fontFamily:"'Inter',sans-serif"}}>${Number(evActivo.obj.primaTotal).toLocaleString("es-MX")}</div>}
                        </div>
                      )}
                      {/* Tarea */}
                      {evActivo.tipo==="tarea"&&(
                        <div style={{background:evActivo.obj?.prioridad==="alta"?"#fef2f2":evActivo.obj?.prioridad==="media"?"#fffbeb":"#f0fdf4",
                          borderRadius:8,padding:"7px 10px",fontSize:11,fontWeight:700,
                          color:evActivo.obj?.prioridad==="alta"?"#dc2626":evActivo.obj?.prioridad==="media"?"#d97706":"#059669"}}>
                          📌 {evActivo.obj?.prioridad==="alta"?"🔴 Alta":evActivo.obj?.prioridad==="media"?"🟡 Media":"🟢 Baja"} prioridad
                        </div>
                      )}
                      {/* Botones */}
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {evActivo.tipo==="cumpleanos"&&(<>
                          <button onClick={()=>{const tel=(evActivo.obj?.whatsapp||evActivo.obj?.telefono||"").replace(/\D/g,"");window.open("https://wa.me/52"+tel+"?text="+encodeURIComponent("🎂 ¡Feliz cumpleaños "+evActivo.label+"! Que tengas un excelente día."));}}
                            style={{width:"100%",background:"#25d366",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            💬 WhatsApp
                          </button>
                          {evActivo.obj?.email&&<a href={`mailto:${evActivo.obj.email}?subject=${encodeURIComponent("🎂 ¡Feliz cumpleaños "+evActivo.label+"!")}`}
                            style={{width:"100%",background:"#2563eb",color:"#fff",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            ✉️ Correo
                          </a>}
                        </>)}
                        {(evActivo.tipo==="vencimiento"||evActivo.tipo==="inicio")&&(<>
                          <button onClick={()=>setPolizaCalendario(evActivo.obj)}
                            style={{width:"100%",background:"#eff6ff",color:"#1d4ed8",border:"1px solid #bfdbfe",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            👁 Ver póliza
                          </button>
                          <button onClick={()=>setPagoCalendario(evActivo.obj)}
                            style={{width:"100%",background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            💳 Registrar Pago
                          </button>
                          {evActivo.obj?.whatsappCliente&&<button onClick={()=>{const num=(evActivo.obj.whatsappCliente||"").replace(/\D/g,"");window.open("https://wa.me/52"+num+"?text="+encodeURIComponent("Hola, te recordamos que tu póliza "+evActivo.obj?.numero+" vence el "+evActivo.obj?.vencimiento+"."));}}
                            style={{width:"100%",background:"#25d366",color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            💬 WhatsApp cliente
                          </button>}
                          {gcalUrl(evActivo)&&<a href={gcalUrl(evActivo)} target="_blank" rel="noopener noreferrer"
                            style={{width:"100%",background:"#fff",border:"1px solid #e5e7eb",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,color:"#374151",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                            📅 Google Calendar
                          </a>}
                        </>)}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ):(
            <div style={{background:"#fff",borderRadius:20,padding:"32px 20px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)",border:"1px solid #e2e8f0",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>📅</div>
              <div style={{fontSize:14,fontWeight:700,color:"#374151",fontFamily:"'Playfair Display',serif",marginBottom:6}}>Selecciona un día</div>
              <div style={{fontSize:12,color:"#9ca3af"}}>Haz click en cualquier día para ver los eventos disponibles</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal registrar pago desde calendario */}
      {pagoCalendario&&(
        <Modal title={`Registrar Pago — ${pagoCalendario.numero}`} onClose={()=>setPagoCalendario(null)}>
          <ModalPago
            poliza={pagoCalendario}
            onGuardar={(pago)=>{
              if(setPolizas) setPolizas(prev=>prev.map(p=>p.id===pagoCalendario.id?{...p,pagos:[...(p.pagos||[]),pago],ultimoPago:pago}:p));
              setPagoCalendario(null);
            }}
            onEliminarPago={(pgId)=>{
              if(setPolizas) setPolizas(prev=>prev.map(p=>p.id===pagoCalendario.id?{...p,pagos:(p.pagos||[]).filter(pg=>pg.id!==pgId)}:p));
            }}
            onClose={()=>setPagoCalendario(null)}
          />
        </Modal>
      )}

      {/* Modal detalle póliza desde calendario */}
      {polizaCalendario&&(
        <Modal title={`Póliza ${polizaCalendario.numero}`} onClose={()=>setPolizaCalendario(null)} wide maxW={580}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:`linear-gradient(135deg,${ramoColor(polizaCalendario.ramo)},${ramoColor(polizaCalendario.ramo)}bb)`,borderRadius:12,padding:"14px 18px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,opacity:.8,fontWeight:700}}>{polizaCalendario.ramo?.toUpperCase()}{polizaCalendario.subramo?" · "+polizaCalendario.subramo.toUpperCase():""} · {polizaCalendario.aseguradora}</div>
                <div style={{fontSize:18,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{polizaCalendario.numero}</div>
                <div style={{fontSize:12,opacity:.9,marginTop:2}}>{polizaCalendario.cliente}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,opacity:.7}}>PRIMA TOTAL</div>
                <div style={{fontSize:22,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>${(parseFloat(polizaCalendario.primaTotal)||parseFloat(polizaCalendario.prima)||0).toLocaleString("es-MX",{maximumFractionDigits:0})}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
              {[["Aseguradora",polizaCalendario.aseguradora||"—"],["Forma de pago",polizaCalendario.formaPago||polizaCalendario.frecuencia||"—"],["Inicio vigencia",polizaCalendario.inicio||"—"],["Fin vigencia",polizaCalendario.vencimiento||"—"],["Prima neta",polizaCalendario.primaNeta?`$${Number(polizaCalendario.primaNeta).toLocaleString("es-MX",{minimumFractionDigits:2})}`:"—"],["Agente",polizaCalendario.agentePoliza||"—"]].map(([l,v])=>(
                <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"9px 12px"}}>
                  <div style={{fontSize:9,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                  <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{v}</div>
                </div>
              ))}
            </div>
            {polizaCalendario.coberturas?.length>0&&(
              <div style={{background:"#f0fdf4",borderRadius:9,padding:"10px 13px"}}>
                <div style={{fontSize:9,color:"#065f46",fontWeight:700,marginBottom:6}}>COBERTURAS</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{polizaCalendario.coberturas.map(c=><span key={c} style={{background:"#d1fae5",color:"#065f46",fontSize:11,padding:"2px 8px",borderRadius:14,fontWeight:600}}>{c}</span>)}</div>
              </div>
            )}
            {/* Botones de contacto */}
            <div style={{display:"flex",gap:9,flexWrap:"wrap",paddingTop:4}}>
              {(polizaCalendario.whatsappCliente||polizaCalendario.telefonoCliente)&&(
                <button style={{background:"#25d366",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}
                  onClick={()=>{
                    const num=(polizaCalendario.whatsappCliente||polizaCalendario.telefonoCliente||"").replace(/\D/g,"");
                    const msg=encodeURIComponent("Hola "+polizaCalendario.cliente?.split(" ")[0]+", te recordamos que tu póliza "+polizaCalendario.numero+" de "+polizaCalendario.aseguradora+" vence el "+polizaCalendario.vencimiento+". Contáctanos para renovarla. — Tu Agente de Seguros");
                    window.open("https://wa.me/52"+num+"?text="+msg);
                  }}>
                  💬 WhatsApp
                </button>
              )}
              {polizaCalendario.emailCliente&&(
                <a href={`mailto:${polizaCalendario.emailCliente}?subject=${encodeURIComponent("Tu póliza "+polizaCalendario.numero+" vence pronto")}&body=${encodeURIComponent("Hola "+polizaCalendario.cliente?.split(" ")[0]+",\n\nTe recordamos que tu póliza "+polizaCalendario.numero+" de "+polizaCalendario.aseguradora+" vence el "+polizaCalendario.vencimiento+".\n\nContáctanos para renovarla.\n\nSaludos,\nTu Agente de Seguros")}`}
                  style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:6}}>
                  ✉️ Enviar correo
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════
function Subagentes({ subagentes, setSubagentes, polizas, setPolizas }) {
  const [tab, setTab] = useState("directorio"); // directorio | comisiones | reporte
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showComision, setShowComision] = useState(null); // póliza seleccionada para registrar pago
  const FORM_INIT = { nombre:"", apellidoPaterno:"", apellidoMaterno:"", email:"", telefono:"", whatsapp:"", activo:true, notas:"", comision:"", impuestos:"15" };
  const [form, setForm] = useState(FORM_INIT);
  const upd = (k,v) => setForm(p=>({...p,[k]:v}));

  // Calcular comisiones de todas las pólizas con subagente
  const polizasConSubagente = polizas.filter(p => p.subagenteId && p.comisionSubagente);

  const calcComision = (p) => {
    const base = parseFloat(p.primaTotal || p.prima || 0);
    const pct  = parseFloat(p.comisionSubagente || 0);
    const bruta = base * pct / 100;
    // ISR 10% + IVA 16% sobre retención = retención efectiva ~10%
    const isr   = bruta * (parseFloat(p.tasaISR  || 10) / 100);
    const neta  = bruta - isr;
    return { bruta, isr, neta };
  };

  // Saldo por subagente
  const saldoPor = (saId) => {
    return polizasConSubagente
      .filter(p => p.subagenteId === saId)
      .reduce((acc, p) => {
        const { neta } = calcComision(p);
        return {
          pendiente: acc.pendiente + (p.comisionPagada ? 0 : neta),
          pagado:    acc.pagado    + (p.comisionPagada ? neta : 0),
          total:     acc.total    + neta,
        };
      }, { pendiente:0, pagado:0, total:0 });
  };

  const guardar = () => {
    if (!form.nombre || !form.apellidoPaterno) return;
    if (editando) {
      setSubagentes(prev => prev.map(s => s.id===editando ? {...s,...form} : s));
    } else {
      setSubagentes(prev => [...prev, {...form, id:Date.now()}]);
    }
    setShowModal(false); setEditando(null); setForm(FORM_INIT);
  };

  const abrirEditar = (sa) => { setForm({...sa}); setEditando(sa.id); setShowModal(true); };

  const toggleActivo = (id) => setSubagentes(prev => prev.map(s => s.id===id?{...s,activo:!s.activo}:s));

  const registrarPago = (polizaId, fechaPago) => {
    polizas; // referencia
    // Actualizar en el estado de pólizas — se hace desde App, aquí solo callback
    setShowComision(null);
  };

  // Para exportar reporte CSV
  const exportarCSV = () => {
    const rows = [["Subagente","Póliza","Cliente","Aseguradora","Ramo","Prima Total","% Comisión","Comisión Bruta","ISR","Comisión Neta","Estado","Fecha Pago"]];
    polizasConSubagente.forEach(p => {
      const sa = subagentes.find(s => s.id===p.subagenteId);
      if (!sa) return;
      const { bruta, isr, neta } = calcComision(p);
      rows.push([
        `${sa.nombre} ${sa.apellidoPaterno}`,
        p.numero, p.cliente, p.aseguradora, p.ramo,
        p.primaTotal||p.prima||0,
        p.comisionSubagente+"%",
        bruta.toFixed(2), isr.toFixed(2), neta.toFixed(2),
        p.comisionPagada?"Pagada":"Pendiente",
        p.fechaPagoComision||""
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="reporte_subagentes.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const fmtMXN = (n) => `$${parseFloat(n||0).toLocaleString("es-MX",{minimumFractionDigits:2})}`;

  // ── Tarjeta subagente ──
  const TarjetaSA = ({ sa }) => {
    const saldo = saldoPor(sa.id);
    const polsSA = polizasConSubagente.filter(p=>p.subagenteId===sa.id);
    return (
      <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 8px rgba(0,0,0,.07)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#7c3aed,#5b21b6)",padding:"14px 18px",color:"#fff",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,flexShrink:0}}>
            {sa.nombre[0]}{sa.apellidoPaterno[0]}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:800,fontSize:14}}>{sa.nombre} {sa.apellidoPaterno} {sa.apellidoMaterno||""}</div>
            <div style={{fontSize:11,opacity:.8}}>{sa.email}</div>
          </div>
          <span style={{background:sa.activo?"rgba(255,255,255,.25)":"rgba(0,0,0,.25)",padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:700}}>
            {sa.activo?"● Activo":"○ Inactivo"}
          </span>
        </div>
        <div style={{padding:"13px 16px"}}>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            {[["📞",sa.telefono||"—"],["💬",sa.whatsapp||"—"]].map(([ic,v])=>(
              <div key={ic} style={{flex:1,background:"#f9fafb",borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",gap:5}}>
                <span style={{fontSize:13}}>{ic}</span>
                <span style={{fontSize:11,color:"#374151",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          {/* Saldos */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
            {[["Total","#374151",saldo.total],["Pendiente","#d97706",saldo.pendiente],["Pagado","#059669",saldo.pagado]].map(([l,c,v])=>(
              <div key={l} style={{textAlign:"center",background:c==="#d97706"?"#fffbeb":c==="#059669"?"#f0fdf4":"#f9fafb",borderRadius:9,padding:"8px 4px"}}>
                <div style={{fontSize:13,fontWeight:900,color:c,fontFamily:"'Playfair Display',serif"}}>{fmtMXN(v)}</div>
                <div style={{fontSize:9,color:c,fontWeight:700}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginBottom:10}}>{polsSA.length} póliza{polsSA.length!==1?"s":""} asignada{polsSA.length!==1?"s":""}</div>
          <div style={{display:"flex",gap:7}}>
            <button onClick={()=>abrirEditar(sa)} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:8,padding:"7px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151"}}>
              ✏️ Editar
            </button>
            <button onClick={()=>toggleActivo(sa.id)} style={{flex:1,background:sa.activo?"#fef2f2":"#f0fdf4",border:"none",borderRadius:8,padding:"7px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:sa.activo?"#dc2626":"#059669"}}>
              {sa.activo?"Desactivar":"Activar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionTitle title="Subagentes" sub={`${subagentes.filter(s=>s.activo).length} activos · ${polizasConSubagente.length} pólizas con subagente`}/>
        <div style={{display:"flex",gap:10}}>
          {tab==="reporte"&&<button onClick={exportarCSV} style={{background:"#059669",color:"#fff",border:"none",borderRadius:9,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⬇ Exportar CSV</button>}
          <Btn onClick={()=>{setForm(FORM_INIT);setEditando(null);setShowModal(true);}} color="#7c3aed" icon="plus">Nuevo Subagente</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:11,padding:4,width:"fit-content"}}>
        {[["directorio","👥 Directorio"],["comisiones","💰 Comisiones"],["reporte","📊 Reporte"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{background:tab===t?"#fff":"none",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,
              fontWeight:600,cursor:"pointer",color:tab===t?"#111827":"#6b7280",
              boxShadow:tab===t?"0 1px 4px rgba(0,0,0,.1)":"none",fontFamily:"inherit"}}>{l}
          </button>
        ))}
      </div>

      {/* ── TAB DIRECTORIO ── */}
      {tab==="directorio"&&(
        <>
          {subagentes.length===0 ? (
            <div style={{background:"#fff",borderRadius:14,padding:"60px 20px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
              <div style={{fontSize:40,marginBottom:10}}>👥</div>
              <div style={{fontWeight:700,fontSize:16,color:"#111827",marginBottom:6}}>Sin subagentes registrados</div>
              <div style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>Agrega subagentes para gestionar sus comisiones</div>
              <Btn onClick={()=>setShowModal(true)} color="#7c3aed" icon="plus">Agregar primer subagente</Btn>
            </div>
          ) : (
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
              {subagentes.map(sa=><TarjetaSA key={sa.id} sa={sa}/>)}
            </div>
          )}
        </>
      )}

      {/* ── TAB COMISIONES ── */}
      {tab==="comisiones"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* Resumen por subagente */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10}}>
            {subagentes.filter(s=>s.activo).map(sa=>{
              const saldo = saldoPor(sa.id);
              return (
                <div key={sa.id} style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #7c3aed"}}>
                  <div style={{fontWeight:800,fontSize:13,color:"#111827",marginBottom:10}}>{sa.nombre} {sa.apellidoPaterno}</div>
                  <div style={{display:"flex",gap:8}}>
                    <div style={{flex:1,textAlign:"center",background:"#fffbeb",borderRadius:8,padding:"6px"}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#d97706",fontFamily:"'Playfair Display',serif"}}>{fmtMXN(saldo.pendiente)}</div>
                      <div style={{fontSize:9,color:"#d97706",fontWeight:700}}>PENDIENTE</div>
                    </div>
                    <div style={{flex:1,textAlign:"center",background:"#f0fdf4",borderRadius:8,padding:"6px"}}>
                      <div style={{fontSize:14,fontWeight:900,color:"#059669",fontFamily:"'Playfair Display',serif"}}>{fmtMXN(saldo.pagado)}</div>
                      <div style={{fontSize:9,color:"#059669",fontWeight:700}}>PAGADO</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla de comisiones por póliza */}
          <div style={{background:"#fff",borderRadius:14,boxShadow:"0 1px 6px rgba(0,0,0,.06)",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:14,color:"#111827"}}>Comisiones por póliza</div>
              <div style={{fontSize:12,color:"#9ca3af"}}>{polizasConSubagente.length} registros</div>
            </div>
            {polizasConSubagente.length===0 ? (
              <div style={{padding:"40px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                Ninguna póliza tiene subagente asignado aún.
              </div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f9fafb"}}>
                      {["Subagente","Póliza / Cliente","Prima Total","% Comis.","Bruta","ISR","Neta","Estado","Acciones"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:10,fontWeight:800,color:"#6b7280",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {polizasConSubagente.map((p,i)=>{
                      const sa = subagentes.find(s=>s.id===p.subagenteId);
                      const { bruta, isr, neta } = calcComision(p);
                      return (
                        <tr key={p.id} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                          <td style={{padding:"10px 12px"}}>
                            <div style={{fontWeight:700,color:"#5b21b6"}}>{sa?`${sa.nombre} ${sa.apellidoPaterno}`:"—"}</div>
                          </td>
                          <td style={{padding:"10px 12px"}}>
                            <div style={{fontWeight:700,fontFamily:"monospace",fontSize:11}}>{p.numero}</div>
                            <div style={{fontSize:10,color:"#6b7280"}}>{p.cliente}</div>
                          </td>
                          <td style={{padding:"10px 12px",fontWeight:700}}>{fmtMXN(p.primaTotal||p.prima)}</td>
                          <td style={{padding:"10px 12px"}}>
                            <span style={{background:"#ede9fe",color:"#5b21b6",padding:"2px 8px",borderRadius:20,fontWeight:700,fontSize:11}}>
                              {p.comisionSubagente}%
                            </span>
                          </td>
                          <td style={{padding:"10px 12px",fontWeight:600}}>{fmtMXN(bruta)}</td>
                          <td style={{padding:"10px 12px",color:"#dc2626",fontWeight:600}}>-{fmtMXN(isr)}</td>
                          <td style={{padding:"10px 12px",fontWeight:800,color:"#059669"}}>{fmtMXN(neta)}</td>
                          <td style={{padding:"10px 12px"}}>
                            {p.comisionPagada ? (
                              <div>
                                <span style={{background:"#d1fae5",color:"#065f46",padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>✓ Pagada</span>
                                {p.fechaPagoComision&&<div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>{p.fechaPagoComision}</div>}
                              </div>
                            ) : (
                              <span style={{background:"#fef3c7",color:"#92400e",padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>⏳ Pendiente</span>
                            )}
                          </td>
                          <td style={{padding:"10px 12px"}}>
                            <button onClick={()=>setShowComision(p)}
                              style={{background:p.comisionPagada?"#f3f4f6":"#ede9fe",color:p.comisionPagada?"#6b7280":"#5b21b6",
                                border:"none",borderRadius:7,padding:"5px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                              {p.comisionPagada?"Ver":"Registrar pago"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totales */}
                  <tfoot>
                    <tr style={{background:"#f0f4ff",borderTop:"2px solid #c7d2fe"}}>
                      <td colSpan={4} style={{padding:"10px 12px",fontWeight:800,fontSize:12,color:"#1e40af"}}>TOTALES</td>
                      <td style={{padding:"10px 12px",fontWeight:800,color:"#374151"}}>
                        {fmtMXN(polizasConSubagente.reduce((s,p)=>s+calcComision(p).bruta,0))}
                      </td>
                      <td style={{padding:"10px 12px",fontWeight:800,color:"#dc2626"}}>
                        -{fmtMXN(polizasConSubagente.reduce((s,p)=>s+calcComision(p).isr,0))}
                      </td>
                      <td style={{padding:"10px 12px",fontWeight:900,color:"#059669",fontSize:13}}>
                        {fmtMXN(polizasConSubagente.reduce((s,p)=>s+calcComision(p).neta,0))}
                      </td>
                      <td colSpan={2} style={{padding:"10px 12px"}}>
                        <span style={{background:"#fef3c7",color:"#92400e",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,marginRight:6}}>
                          Pend: {fmtMXN(polizasConSubagente.filter(p=>!p.comisionPagada).reduce((s,p)=>s+calcComision(p).neta,0))}
                        </span>
                        <span style={{background:"#d1fae5",color:"#065f46",padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700}}>
                          Pag: {fmtMXN(polizasConSubagente.filter(p=>p.comisionPagada).reduce((s,p)=>s+calcComision(p).neta,0))}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB REPORTE ── */}
      {tab==="reporte"&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {/* KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {[
              ["👥",subagentes.filter(s=>s.activo).length,"Subagentes activos","#7c3aed"],
              ["📋",polizasConSubagente.length,"Pólizas con subagente","#2563eb"],
              ["⏳",fmtMXN(polizasConSubagente.filter(p=>!p.comisionPagada).reduce((s,p)=>s+calcComision(p).neta,0)),"Comisiones pendientes","#d97706"],
              ["✅",fmtMXN(polizasConSubagente.filter(p=>p.comisionPagada).reduce((s,p)=>s+calcComision(p).neta,0)),"Comisiones pagadas","#059669"],
            ].map(([ic,v,l,c])=>(
              <div key={l} style={{background:"#fff",borderRadius:13,padding:"16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)",borderTop:`3px solid ${c}`}}>
                <div style={{fontSize:22,marginBottom:6}}>{ic}</div>
                <div style={{fontSize:22,fontWeight:900,color:c,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{v}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Ranking de subagentes */}
          <div style={{background:"#fff",borderRadius:14,padding:"18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:800,fontSize:14,color:"#111827",marginBottom:14}}>Ranking de subagentes por comisión neta</div>
            {subagentes.length===0 ? (
              <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"20px"}}>Sin datos</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {subagentes
                  .map(sa=>({...sa, saldo:saldoPor(sa.id), polsCount:polizasConSubagente.filter(p=>p.subagenteId===sa.id).length}))
                  .sort((a,b)=>b.saldo.total-a.saldo.total)
                  .map((sa,i)=>{
                    const max = Math.max(...subagentes.map(s=>saldoPor(s.id).total),1);
                    const pct = (sa.saldo.total/max)*100;
                    return (
                      <div key={sa.id} style={{display:"flex",alignItems:"center",gap:12}}>
                        <div style={{width:24,height:24,borderRadius:"50%",background:i===0?"#f59e0b":i===1?"#9ca3af":i===2?"#cd7c2f":"#e5e7eb",color:i<3?"#fff":"#6b7280",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,flexShrink:0}}>
                          {i+1}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                            <span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{sa.nombre} {sa.apellidoPaterno}</span>
                            <span style={{fontSize:12,fontWeight:800,color:"#7c3aed"}}>{fmtMXN(sa.saldo.total)}</span>
                          </div>
                          <div style={{height:8,background:"#f3f4f6",borderRadius:10,overflow:"hidden"}}>
                            <div style={{height:"100%",background:"linear-gradient(90deg,#7c3aed,#a78bfa)",borderRadius:10,width:`${pct}%`,transition:"width .5s"}}/>
                          </div>
                          <div style={{display:"flex",gap:10,marginTop:3,fontSize:10,color:"#9ca3af"}}>
                            <span>{sa.polsCount} pólizas</span>
                            <span style={{color:"#d97706"}}>Pendiente: {fmtMXN(sa.saldo.pendiente)}</span>
                            <span style={{color:"#059669"}}>Pagado: {fmtMXN(sa.saldo.pagado)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Detalle pólizas en reporte */}
          <div style={{background:"#fff",borderRadius:14,padding:"18px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontWeight:800,fontSize:14,color:"#111827",marginBottom:14}}>Detalle de comisiones — todas las pólizas</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:"#f9fafb"}}>
                    {["Subagente","Póliza","Cliente","Ramo","Prima c/IVA","% Com.","Com. Bruta","ISR (10%)","Com. Neta","Status","Fecha Pago"].map(h=>(
                      <th key={h} style={{padding:"9px 10px",textAlign:"left",fontSize:10,fontWeight:800,color:"#6b7280",whiteSpace:"nowrap",borderBottom:"2px solid #e5e7eb"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {polizasConSubagente.map((p,i)=>{
                    const sa=subagentes.find(s=>s.id===p.subagenteId);
                    const {bruta,isr,neta}=calcComision(p);
                    return (
                      <tr key={p.id} style={{borderTop:"1px solid #f3f4f6",background:i%2===0?"#fff":"#fafafa"}}>
                        <td style={{padding:"8px 10px",fontWeight:700,color:"#5b21b6"}}>{sa?`${sa.nombre} ${sa.apellidoPaterno}`:"—"}</td>
                        <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:10}}>{p.numero}</td>
                        <td style={{padding:"8px 10px",color:"#374151"}}>{p.cliente}</td>
                        <td style={{padding:"8px 10px"}}><span style={{background:ramoColor(p.ramo)+"18",color:ramoColor(p.ramo),padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:600}}>{p.ramo}</span></td>
                        <td style={{padding:"8px 10px",fontWeight:600}}>{fmtMXN(p.primaTotal||p.prima)}</td>
                        <td style={{padding:"8px 10px"}}>{p.comisionSubagente}%</td>
                        <td style={{padding:"8px 10px",fontWeight:600}}>{fmtMXN(bruta)}</td>
                        <td style={{padding:"8px 10px",color:"#dc2626"}}>-{fmtMXN(isr)}</td>
                        <td style={{padding:"8px 10px",fontWeight:800,color:"#059669"}}>{fmtMXN(neta)}</td>
                        <td style={{padding:"8px 10px"}}>
                          <span style={{background:p.comisionPagada?"#d1fae5":"#fef3c7",color:p.comisionPagada?"#065f46":"#92400e",padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700}}>
                            {p.comisionPagada?"✓ Pagada":"Pendiente"}
                          </span>
                        </td>
                        <td style={{padding:"8px 10px",fontSize:10,color:"#6b7280"}}>{p.fechaPagoComision||"—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ALTA/EDICIÓN SUBAGENTE ── */}
      {showModal&&(
        <Modal title={editando?"Editar Subagente":"Nuevo Subagente"} onClose={()=>{setShowModal(false);setEditando(null);setForm(FORM_INIT);}}>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Nombre(s) *" value={form.nombre} onChange={e=>upd("nombre",e.target.value)}/>
              <Inp label="Apellido Paterno *" value={form.apellidoPaterno} onChange={e=>upd("apellidoPaterno",e.target.value)}/>
            </div>
            <Inp label="Apellido Materno" value={form.apellidoMaterno} onChange={e=>upd("apellidoMaterno",e.target.value)}/>
            <Inp label="Email" type="email" value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="correo@ejemplo.com"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
              <Inp label="Teléfono" value={form.telefono} onChange={e=>upd("telefono",e.target.value)} placeholder="8110000000"/>
              <Inp label="WhatsApp" value={form.whatsapp} onChange={e=>upd("whatsapp",e.target.value)} placeholder="8110000000"/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Notas</label>
              <textarea value={form.notas} onChange={e=>upd("notas",e.target.value)} rows={2}
                placeholder="Especialidad, zona, observaciones..."
                style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",resize:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <label style={{fontSize:12,fontWeight:700,color:"#374151"}}>Estado:</label>
              <button onClick={()=>upd("activo",!form.activo)}
                style={{background:form.activo?"#d1fae5":"#f3f4f6",color:form.activo?"#065f46":"#6b7280",border:"none",borderRadius:20,padding:"4px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {form.activo?"● Activo":"○ Inactivo"}
              </button>
            </div>

            {/* Comisión e Impuestos */}
            <div style={{background:"#f8fafc",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10,letterSpacing:"0.05em"}}>COMISIÓN E IMPUESTOS</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>% COMISIÓN</label>
                  <div style={{position:"relative"}}>
                    <input type="number" min="0" max="100" step="0.5" value={form.comision||""}
                      onChange={e=>upd("comision",e.target.value)} placeholder="Ej: 10"
                      style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 36px 9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",fontWeight:600}}/>
                    <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontWeight:700}}>%</span>
                  </div>
                  <div style={{fontSize:10,color:"#9ca3af",marginTop:3}}>% de la prima que gana el subagente</div>
                </div>
                <div>
                  <label style={{fontSize:11,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>% IMPUESTOS (ISR)</label>
                  <div style={{position:"relative"}}>
                    <input type="number" min="0" max="100" step="0.5" value={form.impuestos||"15"}
                      onChange={e=>upd("impuestos",e.target.value)} placeholder="15"
                      style={{width:"100%",border:"1.5px solid #e5e7eb",borderRadius:9,padding:"9px 36px 9px 12px",fontSize:13,fontFamily:"inherit",outline:"none",boxSizing:"border-box",fontWeight:600}}/>
                    <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#6b7280",fontWeight:700}}>%</span>
                  </div>
                  <div style={{fontSize:10,color:"#9ca3af",marginTop:3}}>% que se le retiene de impuestos</div>
                </div>
              </div>
              {form.comision&&form.impuestos&&(
                <div style={{marginTop:10,background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#065f46"}}>
                  💡 Por cada $1,000 de prima: comisión bruta <strong>${(1000*parseFloat(form.comision||0)/100).toFixed(2)}</strong> − ISR <strong>${(1000*parseFloat(form.comision||0)/100*parseFloat(form.impuestos||15)/100).toFixed(2)}</strong> = neto <strong>${(1000*parseFloat(form.comision||0)/100*(1-parseFloat(form.impuestos||15)/100)).toFixed(2)}</strong>
                </div>
              )}
            </div>

            {(!form.nombre||!form.apellidoPaterno)&&(
              <div style={{fontSize:11,color:"#9ca3af"}}>* Nombre y apellido paterno son requeridos</div>
            )}
            <Btn onClick={guardar} color="#7c3aed" icon="check" style={{width:"100%",justifyContent:"center"}}
              disabled={!form.nombre||!form.apellidoPaterno}>
              {editando?"Guardar cambios":"Registrar Subagente"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── MODAL REGISTRAR PAGO COMISIÓN ── */}
      {showComision&&<ModalPagoComision
        poliza={showComision}
        subagentes={subagentes}
        calcComision={calcComision}
        fmtMXN={fmtMXN}
        onPagar={(id,fecha)=>{
          setPolizas(prev=>prev.map(p=>p.id===id?{...p,comisionPagada:true,fechaPagoComision:fecha}:p));
          setShowComision(null);
        }}
        onClose={()=>setShowComision(null)}
      />}
    </div>
  );
}

// ─── Modal Pago Comisión ─────────────────────────────────────────
function ModalPagoComision({ poliza, subagentes, calcComision, fmtMXN, onPagar, onClose }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const sa = subagentes.find(s=>s.id===poliza.subagenteId);
  const {bruta,isr,neta} = calcComision(poliza);
  return (
    <Modal title="Registrar Pago de Comisión" onClose={onClose}>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div style={{background:"#faf5ff",borderRadius:10,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,marginBottom:4}}>SUBAGENTE</div>
          <div style={{fontSize:14,fontWeight:800,color:"#5b21b6"}}>{sa?sa.nombre+" "+sa.apellidoPaterno:""}</div>
          <div style={{fontSize:12,color:"#7c3aed",marginTop:2}}>Póliza: {poliza.numero} · {poliza.cliente}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {[["Com. Bruta",fmtMXN(bruta),"#374151"],["ISR (10%)","-"+fmtMXN(isr),"#dc2626"],["Com. Neta",fmtMXN(neta),"#059669"]].map(([l,v,c])=>(
            <div key={l} style={{textAlign:"center",background:"#f9fafb",borderRadius:9,padding:"10px"}}>
              <div style={{fontSize:15,fontWeight:900,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</div>
              <div style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>{l}</div>
            </div>
          ))}
        </div>
        {!poliza.comisionPagada ? (
          <>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fecha de pago *</label>
              <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
            </div>
            <Btn onClick={()=>onPagar(poliza.id,fecha)} color="#059669" icon="check" style={{width:"100%",justifyContent:"center"}}>
              Confirmar pago de {fmtMXN(neta)}
            </Btn>
          </>
        ) : (
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:4}}>✅</div>
            <div style={{fontWeight:700,color:"#059669"}}>Comisión ya registrada como pagada</div>
            {poliza.fechaPagoComision&&<div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Fecha: {poliza.fechaPagoComision}</div>}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════

function Configuracion({ config, setConfig, subagentes, setSubagentes, usuarios, setUsuarios, polizas, setPolizas, plantillas, setPlantillas, plantillasDefault, clientes, historialNotif, setHistorialNotif }) {
  const [tab, setTab] = useState("empresa");
  const [form, setForm] = useState({...config});
  const [saved, setSaved] = useState(false);
  const logoRef = useRef();

  const guardar = () => {
    setConfig(form);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2500);
  };

  const handleLogo = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p=>({...p, logo: ev.target.result}));
    reader.readAsDataURL(file);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      <SectionTitle title="Configuración" sub="Personaliza el sistema y gestiona usuarios y subagentes"/>

      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:11,padding:4,width:"fit-content",flexWrap:"wrap"}}>
        {[["empresa","🏢 Empresa"],["comunicacion","📨 Comunicacion"],["usuarios","👤 Usuarios"],["subagentes","🤝 Subagentes"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"#fff":"none",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:600,cursor:"pointer",color:tab===t?"#111827":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"inherit"}}>{l}</button>
        ))}
      </div>

      {tab==="empresa"&&(
        <div style={{background:"#fff",borderRadius:16,padding:24,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",maxWidth:620}}>
          <div style={{fontSize:13,fontWeight:700,color:"#374151",marginBottom:16}}>Datos del Agente o Empresa</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>

            {/* Logo */}
            <div style={{display:"flex",alignItems:"center",gap:18,padding:"14px 16px",background:"#f8fafc",borderRadius:12,border:"1.5px dashed #cbd5e1"}}>
              <div style={{width:72,height:72,borderRadius:12,background:"#e2e8f0",overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {form.logo
                  ? <img src={form.logo} alt="logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
                  : <span style={{fontSize:28}}>🏢</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#374151",marginBottom:4}}>Logo de la empresa / agente</div>
                <div style={{fontSize:11,color:"#9ca3af",marginBottom:8}}>PNG, JPG o SVG · Recomendado 200×200 px</div>
                <div style={{display:"flex",gap:8}}>
                  <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} style={{display:"none"}}/>
                  <button onClick={()=>logoRef.current.click()}
                    style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:8,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                    📁 Subir logo
                  </button>
                  {form.logo&&(
                    <button onClick={()=>setForm(p=>({...p,logo:null}))}
                      style={{background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fecaca",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      🗑 Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Nombre del Agente / Empresa *" value={form.nombre||""} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: García Seguros"/>
              <Inp label="RFC" value={form.rfc||""} onChange={e=>setForm(p=>({...p,rfc:e.target.value}))} placeholder="GARC800101XXX"/>
            </div>
            <Inp label="Domicilio" value={form.domicilio||""} onChange={e=>setForm(p=>({...p,domicilio:e.target.value}))} placeholder="Calle, Número, Colonia"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Ciudad" value={form.ciudad||""} onChange={e=>setForm(p=>({...p,ciudad:e.target.value}))} placeholder="Ej: Monterrey, N.L."/>
              <Inp label="Código Postal" value={form.cp||""} onChange={e=>setForm(p=>({...p,cp:e.target.value}))} placeholder="64000"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Teléfono de contacto" value={form.telefono||""} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="81 0000 0000"/>
              <Inp label="Correo de contacto" type="email" value={form.email||""} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="contacto@agencia.com"/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Sitio web" value={form.web||""} onChange={e=>setForm(p=>({...p,web:e.target.value}))} placeholder="https://www.agencia.com"/>
              <Inp label="Aseguradora principal" value={form.aseguradoraPrincipal||""} onChange={e=>setForm(p=>({...p,aseguradoraPrincipal:e.target.value}))} placeholder="Ej: GNP, Sura, AXA"/>
            </div>
            <div style={{marginTop:4,display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={guardar} style={{background:"#0f172a",color:"#fff",border:"none",borderRadius:9,padding:"10px 26px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                💾 Guardar cambios
              </button>
              {saved&&<span style={{color:"#059669",fontWeight:700,fontSize:13}}>✅ Guardado correctamente</span>}
              <button onClick={()=>{
                if(window.confirm("¿Limpiar TODOS los datos del CRM? Esto borrará clientes, pólizas, prospectos y configuración. Esta acción no se puede deshacer.")){
                  const keys=["crm_clientes","crm_polizas","crm_pipeline","crm_tareas","crm_usuarios","crm_paiMetas","crm_subagentes","crm_config","crm_plantillas"];
                  keys.forEach(k=>localStorage.removeItem(k));
                  window.location.reload();
                }
              }} style={{marginLeft:"auto",background:"#fef2f2",color:"#dc2626",border:"1.5px solid #fecaca",borderRadius:9,padding:"9px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                🗑 Limpiar todos los datos
              </button>
            </div>
          </div>
        </div>
      )}

      {tab==="comunicacion"&&(
        <ComunicacionConfig
          plantillas={plantillas}
          setPlantillas={setPlantillas}
          plantillasDefault={plantillasDefault}
          clientes={clientes}
          polizas={polizas}
          config={config}
          setConfig={setConfig}
          historialNotif={historialNotif}
          setHistorialNotif={setHistorialNotif}
        />
      )}

      {tab==="usuarios"&&(
        <Usuarios usuarios={usuarios} setUsuarios={setUsuarios}/>
      )}

      {tab==="subagentes"&&(
        <Subagentes subagentes={subagentes} setSubagentes={setSubagentes} polizas={polizas} setPolizas={setPolizas}/>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK useLocalStorage — persiste datos en localStorage
// ═══════════════════════════════════════════════════════════════════
function useLocalStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored === null) return initialValue;
      return JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(state) : value;
      setState(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (e) {
      console.warn("localStorage error:", e);
    }
  };

  return [state, setValue];
}

// ═══════════════════════════════════════════════════════════════════
// PERMISOS POR ROL
// ═══════════════════════════════════════════════════════════════════
const PERMISOS = {
  admin:      ["dashboard","clientes","polizas","calendario","pipeline","importar","pai","configuracion","subagentes","usuarios","cancelar_poliza","registrar_pago","comisiones"],
  agente:     ["dashboard","clientes","polizas","calendario","pipeline","importar","pai","configuracion","subagentes","usuarios","cancelar_poliza","registrar_pago","comisiones"],
  asistente:  ["dashboard","clientes","polizas","calendario","pipeline","pai","subagentes","registrar_pago","comisiones"],
  capturista: ["dashboard","clientes","polizas","calendario","registrar_pago"],
  subagente:  ["clientes","polizas","calendario"],
};

function puedeVer(rol, permiso) {
  return (PERMISOS[rol] || PERMISOS["capturista"]).includes(permiso);
}

// ═══════════════════════════════════════════════════════════════════
// HASH con bcryptjs — compatible con migración futura
// ═══════════════════════════════════════════════════════════════════
async function hashPasswordBcrypt(password) {
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.default.hash(password, 10);
  } catch {
    // Fallback hash simple si bcryptjs no carga
    let hash = 0;
    const str = password + "crm_salt_2024";
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return "h_" + Math.abs(hash).toString(36);
  }
}

async function verificarPassword(password, stored) {
  if (!stored) return false;
  // Texto plano legacy
  if (!stored.startsWith("$2") && !stored.startsWith("h_")) {
    return stored === password;
  }
  // Hash bcryptjs
  if (stored.startsWith("$2")) {
    try {
      const bcrypt = await import("bcryptjs");
      return await bcrypt.default.compare(password, stored);
    } catch { return false; }
  }
  // Hash simple fallback
  let hash = 0;
  const str = password + "crm_salt_2024";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return stored === "h_" + Math.abs(hash).toString(36);
}

// ═══════════════════════════════════════════════════════════════════
// PANTALLA DE LOGIN
// ═══════════════════════════════════════════════════════════════════
function LoginScreen({ usuarios, config, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [verPass, setVerPass]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError("Ingresa usuario y contraseña"); return; }
    setLoading(true);
    setError("");

    const user = usuarios.find(u =>
      u.username?.toLowerCase() === username.toLowerCase() &&
      u.status === "activo"
    );

    if (!user) { setError("Usuario no encontrado o inactivo"); setLoading(false); return; }

    const passOk = await verificarPassword(password, user.password);

    if (!passOk) { setError("Contraseña incorrecta"); setLoading(false); return; }

    const sesion = {
      id: user.id,
      nombre: user.nombre,
      username: user.username,
      rol: user.rol,
      clave: user.clave,
      loginAt: new Date().toISOString(),
    };
    localStorage.setItem("crm_sesion", JSON.stringify(sesion));
    onLogin(sesion);
    setLoading(false);
    window.location.reload();
  };

  const logoEmpresa = config?.logo;
  const nombreEmpresa = config?.nombre || "CRM Seguros";

  return (
    <div style={{
      minHeight:"100vh", background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#0f172a 100%)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
      fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif"
    }}>
      {/* Fondo decorativo */}
      <div style={{position:"fixed",inset:0,overflow:"hidden",pointerEvents:"none"}}>
        <div style={{position:"absolute",top:-100,right:-100,width:400,height:400,borderRadius:"50%",background:"rgba(37,99,235,0.08)"}}/>
        <div style={{position:"absolute",bottom:-80,left:-80,width:300,height:300,borderRadius:"50%",background:"rgba(124,58,237,0.08)"}}/>
      </div>

      <div style={{width:"100%",maxWidth:420,position:"relative"}}>

        {/* Logo / Nombre empresa */}
        <div style={{textAlign:"center",marginBottom:32}}>
          {logoEmpresa
            ? <img src={logoEmpresa} alt="logo" style={{height:64,objectFit:"contain",marginBottom:12}}/>
            : <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
                <Icon name="shield" size={30}/>
              </div>
          }
          <div style={{color:"#f1f5f9",fontSize:22,fontWeight:800,fontFamily:"'Playfair Display',serif"}}>{nombreEmpresa}</div>
          <div style={{color:"#64748b",fontSize:13,marginTop:4}}>Sistema de Gestión de Seguros</div>
        </div>

        {/* Card de login */}
        <div style={{background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",borderRadius:20,padding:"32px 36px",border:"1px solid rgba(255,255,255,0.1)",boxShadow:"0 25px 50px rgba(0,0,0,0.4)"}}>
          <div style={{color:"#e2e8f0",fontSize:18,fontWeight:700,marginBottom:24,fontFamily:"'Playfair Display',serif"}}>
            Iniciar sesión
          </div>

          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:16}}>
            {/* Usuario */}
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.06em",display:"block",marginBottom:6}}>
                USUARIO
              </label>
              <input
                value={username}
                onChange={e=>{setUsername(e.target.value);setError("");}}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",
                  borderRadius:10,padding:"11px 14px",fontSize:14,color:"#f1f5f9",outline:"none",
                  fontFamily:"inherit",boxSizing:"border-box",transition:"border .15s"}}
                onFocus={e=>e.target.style.borderColor="#3b82f6"}
                onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",letterSpacing:"0.06em",display:"block",marginBottom:6}}>
                CONTRASEÑA
              </label>
              <div style={{position:"relative"}}>
                <input
                  type={verPass?"text":"password"}
                  value={password}
                  onChange={e=>{setPassword(e.target.value);setError("");}}
                  placeholder="Ingresa tu contraseña"
                  autoComplete="current-password"
                  style={{width:"100%",background:"rgba(255,255,255,0.08)",border:"1.5px solid rgba(255,255,255,0.12)",
                    borderRadius:10,padding:"11px 44px 11px 14px",fontSize:14,color:"#f1f5f9",outline:"none",
                    fontFamily:"inherit",boxSizing:"border-box",transition:"border .15s"}}
                  onFocus={e=>e.target.style.borderColor="#3b82f6"}
                  onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.12)"}
                />
                <button type="button" onClick={()=>setVerPass(v=>!v)}
                  style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                    background:"none",border:"none",cursor:"pointer",color:"#64748b",padding:4}}>
                  <Icon name="eye" size={16}/>
                </button>
              </div>
            </div>

            {/* Error */}
            {error&&(
              <div style={{background:"rgba(220,38,38,0.15)",border:"1px solid rgba(220,38,38,0.3)",
                borderRadius:9,padding:"10px 14px",fontSize:13,color:"#fca5a5",display:"flex",alignItems:"center",gap:8}}>
                ⚠️ {error}
              </div>
            )}

            {/* Botón */}
            <button type="submit" disabled={loading}
              style={{background:loading?"#1e3a5f":"linear-gradient(135deg,#2563eb,#7c3aed)",
                color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:14,
                fontWeight:700,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",
                marginTop:4,transition:"all .2s",opacity:loading?0.7:1}}>
              {loading?"Verificando...":"Entrar al sistema"}
            </button>
          </form>

          {/* Hint para el admin */}
          <div style={{marginTop:20,padding:"10px 14px",background:"rgba(37,99,235,0.1)",borderRadius:9,border:"1px solid rgba(37,99,235,0.2)"}}>
            <div style={{fontSize:11,color:"#93c5fd",fontWeight:600}}>
              Usuario por defecto: <span style={{fontFamily:"monospace"}}>admin</span> / <span style={{fontFamily:"monospace"}}>admin123</span>
            </div>
            <div style={{fontSize:10,color:"#475569",marginTop:2}}>Cambia la contraseña en Configuración → Usuarios</div>
          </div>
        </div>

        <div style={{textAlign:"center",marginTop:20,color:"#334155",fontSize:11}}>
          {nombreEmpresa} · Sistema protegido
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOOK useIsMobile
// ═══════════════════════════════════════════════════════════════════
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

// ═══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function CRMSeguros() {
  const [vista, setVista] = useState("dashboard");
  const [clientes,   setClientes]   = useLocalStorage("crm_clientes",   CLIENTES_INIT);
  const [polizas,    setPolizas]    = useLocalStorage("crm_polizas",    POLIZAS_INIT);
  const [pipeline,   setPipeline]   = useLocalStorage("crm_pipeline",   PIPELINE_INIT);
  const [tareas,     setTareas]     = useLocalStorage("crm_tareas",     TAREAS_INIT);
  const [usuarios,   setUsuarios]   = useLocalStorage("crm_usuarios",   USUARIOS_INIT);
  const [paiMetas,   setPaiMetas]   = useLocalStorage("crm_paiMetas",   PAI_METAS_INIT);
  const [subagentes, setSubagentes] = useLocalStorage("crm_subagentes", SUBAGENTES_INIT);
  const [config,     setConfig]     = useLocalStorage("crm_config",     {nombre:"SeguroCRM",rfc:"",domicilio:"",ciudad:"",cp:"",telefono:"",email:"",web:"",licencia:"",aseguradoraPrincipal:"",emailRemitente:"",nombreRemitente:"",celularWA:"",firmaWA:"",firmaEmail:""});
  const [historialNotif, setHistorialNotif] = useLocalStorage("crm_historial_notif", []);
  const [tablaComisiones, setTablaComisiones] = useLocalStorage("crm_tabla_comisiones", []);
  const [pagosComision, setPagosComision] = useLocalStorage("crm_pagos_comision", []);

  // Sesión activa
  const [sesion, setSesion] = useState(() => {
    try {
      const s = localStorage.getItem("crm_sesion");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });

  const handleLogin = (sesionData) => {
    localStorage.setItem("crm_sesion", JSON.stringify(sesionData));
    setSesion(sesionData);
  };

  const handleLogout = () => {
    localStorage.removeItem("crm_sesion");
    window.location.reload();
  };

  // ── Notificaciones internas ────────────────────────────────────────
  const [notifPanel, setNotifPanel] = useState(false);
  const [gcalToast, setGcalToast]   = useState(null);

  const getPolizasDias = (dias) => {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    return polizas.filter(p => {
      if (p.status==="cancelada") return false;
      const venc = p.vencimiento;
      if (!venc) return false;
      const fv = new Date(venc.includes("/") ? venc.split("/").reverse().join("-") : venc);
      fv.setHours(0,0,0,0);
      const diff = Math.round((fv - hoy) / 86400000);
      return diff >= 0 && diff <= dias;
    });
  };

  const notif15 = getPolizasDias(15);
  const notif7  = getPolizasDias(7);
  const notif0  = getPolizasDias(0);
  const totalNotif = notif15.length;

  // Agregar póliza a Google Calendar del agente
  const agregarPolizaCalendar = async (poliza, tipo="vencimiento") => {
    const dias = tipo==="10dias" ? 10 : tipo==="5dias" ? 5 : 0;
    const fecha = poliza.vencimiento;
    const titulo = dias===0
      ? `Vence HOY: ${poliza.numero} · ${poliza.cliente}`
      : `Cobrar poliza en ${dias} dias: ${poliza.numero} · ${poliza.cliente}`;
    const desc = `Poliza: ${poliza.numero}\nCliente: ${poliza.cliente}\nAseguradora: ${poliza.aseguradora}\nPrima: $${(parseFloat(poliza.primaTotal)||parseFloat(poliza.prima)||0).toLocaleString("es-MX")}\nVencimiento: ${poliza.vencimiento}`;

    setGcalToast({msg:"Conectando con Google Calendar...", color:"#2563eb"});
    const result = await agregarEventoCalendar(titulo, desc, fecha, dias===0?"11":"6");
    if (result.ok) {
      setGcalToast({msg:"✅ Evento agregado a Google Calendar", color:"#059669"});
    } else {
      // Fallback a .ics
      descargarICS(titulo, desc, fecha);
      setGcalToast({msg:"📥 Descargando archivo .ics como alternativa", color:"#d97706"});
    }
    setTimeout(()=>setGcalToast(null), 3500);
  };

  // Enviar invitación de calendario al cliente (.ics por email)
  const enviarInvitacionCliente = (poliza) => {
    if (!poliza.emailCliente) {
      setGcalToast({msg:"El cliente no tiene correo registrado", color:"#dc2626"});
      setTimeout(()=>setGcalToast(null), 3000);
      return;
    }
    const titulo = `Vencimiento de tu poliza ${poliza.numero}`;
    const desc   = `Tu poliza ${poliza.numero} de ${poliza.aseguradora} vence el ${poliza.vencimiento}. Contacta a tu agente para renovarla.`;
    descargarICS(titulo, desc, poliza.vencimiento);
    const asunto = encodeURIComponent(`Recordatorio: Tu poliza ${poliza.numero} vence pronto`);
    const cuerpo = encodeURIComponent(`Hola ${poliza.cliente?.split(" ")[0]},\n\nTe enviamos el archivo adjunto para agregar el vencimiento de tu poliza a tu calendario.\n\nPoliza: ${poliza.numero}\nAseguradora: ${poliza.aseguradora}\nVencimiento: ${poliza.vencimiento}\n\nSaludos,\n${config.nombre||"Tu agente de seguros"}`);
    window.open(`mailto:${poliza.emailCliente}?subject=${asunto}&body=${cuerpo}`);
    setGcalToast({msg:"✅ Archivo .ics descargado — adjúntalo al correo del cliente", color:"#059669"});
    setTimeout(()=>setGcalToast(null), 4000);
  };

  const PLANTILLAS_DEFAULT = {
    vencimiento:   `Hola {nombre},\n\nTe escribo para recordarte que tu poliza esta proxima a vencer:\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nRamo: {ramo}\nVencimiento: {vencimiento}\nPrima: ${"{prima}"} ({frecuencia})\n\nContactame para renovarla.\n\nSaludos,\nTu agente de seguros`,
    pago:          `Hola {nombre},\n\nConfirmamos la recepcion de tu pago.\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nVigente hasta: {vencimiento}\n\nGracias por tu puntualidad.\n\nSaludos,\nTu agente de seguros`,
    bienvenida:    `Hola {nombre},\n\nBienvenido/a como cliente. Tu poliza ha sido registrada:\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nRamo: {ramo}\nVigente hasta: {vencimiento}\n\nEstoy a tus ordenes.\n\nSaludos,\nTu agente de seguros`,
    renovacion:    `Hola {nombre},\n\nTu poliza ha sido renovada exitosamente.\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nNueva vigencia hasta: {vencimiento}\nPrima: ${"{prima}"} ({frecuencia})\n\nSaludos,\nTu agente de seguros`,
    cumpleanos:    `Hola {nombre},\n\nTe deseamos un muy feliz cumpleanos. Que tengas un excelente dia rodeado de las personas que mas quieres.\n\nSaludos,\nTu agente de seguros`,
    personalizado: `Hola {nombre},\n\nMe comunico contigo respecto a tu poliza {numero} de {aseguradora}.\n\n[Escribe aqui tu mensaje]\n\nSaludos,\nTu agente de seguros`,
    asunto_vencimiento:  `Tu poliza {numero} de {aseguradora} vence pronto`,
    asunto_pago:         `Confirmacion de pago — Poliza {numero}`,
    asunto_bienvenida:   `Bienvenido/a — Tu poliza {numero} esta activa`,
    asunto_renovacion:   `Tu poliza {numero} ha sido renovada exitosamente`,
    asunto_cumpleanos:   `Feliz cumpleanos {nombre}!`,
    asunto_personalizado:`Mensaje de tu agente de seguros`,
    email_vencimiento:   `Estimado/a {nombre},\n\nTe informamos que tu poliza esta proxima a vencer:\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nRamo: {ramo}\nFecha de vencimiento: {vencimiento}\nPrima: ${"{prima}"} ({frecuencia})\n\nPara renovar tu poliza contactanos a la brevedad.\n\nAtentamente,\nTu agente de seguros`,
    email_pago:          `Estimado/a {nombre},\n\nConfirmamos la recepcion de tu pago.\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nVigente hasta: {vencimiento}\n\nGracias por tu puntualidad.\n\nAtentamente,\nTu agente de seguros`,
    email_bienvenida:    `Estimado/a {nombre},\n\nBienvenido/a. Tu poliza ha sido registrada:\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nRamo: {ramo}\nVigente hasta: {vencimiento}\n\nEstamos a tus ordenes.\n\nAtentamente,\nTu agente de seguros`,
    email_renovacion:    `Estimado/a {nombre},\n\nTu poliza ha sido renovada:\n\nPoliza: {numero}\nAseguradora: {aseguradora}\nNueva vigencia hasta: {vencimiento}\nPrima: ${"{prima}"} ({frecuencia})\n\nAtentamente,\nTu agente de seguros`,
    email_cumpleanos:    `Estimado/a {nombre},\n\nTe deseamos un muy feliz cumpleanos. Que este nuevo ano este lleno de salud y exito.\n\nAtentamente,\nTu agente de seguros`,
    email_personalizado: `Estimado/a {nombre},\n\n[Escribe aqui tu mensaje]\n\nAtentamente,\nTu agente de seguros`,
  };
  const [plantillas, setPlantillas] = useLocalStorage("crm_plantillas", PLANTILLAS_DEFAULT);

  // Mostrar login si no hay sesión
  if (!sesion) {
    return <LoginScreen usuarios={usuarios} config={config} onLogin={handleLogin}/>;
  }

  const rol = sesion.rol || "capturista";
  const puede = (accion) => puedeVer(rol, accion);
  const isMobile = useIsMobile();

  const nav=[
    {id:"dashboard",     label:"Dashboard",    icon:"dashboard"},
    {id:"calendario",    label:"Calendario",   icon:"tasks"},
    {id:"clientes",      label:"Clientes",     icon:"clients"},
    {id:"polizas",       label:"Pólizas",      icon:"policies", badge:"IA"},
    {id:"pipeline",      label:"Prospectos",   icon:"pipeline"},
    {id:"importar",      label:"Importar BD",  icon:"scan"},
    {id:"pai",           label:"Metas",        icon:"trophy"},
    {id:"comisiones",    label:"Comisiones",   icon:"trophy"},
    {id:"configuracion", label:"Configuración",icon:"users", badge:"NEW"},
  ].filter(item => puede(item.id));

  const badgeColors={IA:"#2563eb",NEW:"#25d366"};

  useEffect(()=>{
    if (!document.getElementById("crm-fonts")) {
      const link = document.createElement("link");
      link.id = "crm-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
      document.head.appendChild(link);
    }
    if (!document.getElementById("crm-global-style")) {
      const style = document.createElement("style");
      style.id = "crm-global-style";
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,80%,100%{transform:scale(.8);opacity:.5} 40%{transform:scale(1.2);opacity:1} }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .crm-main-content { padding: 28px 32px; }
        @media (max-width: 768px) {
          .crm-main-content { padding: 16px 14px 80px 14px !important; }
        }
      `;
      document.head.appendChild(style);
    }
  },[]);

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Inter','DM Sans','Segoe UI',sans-serif",background:"#f1f5f9",flexDirection:isMobile?"column":"row"}}>

      {/* Sidebar — solo desktop */}
      {!isMobile&&(
      <div style={{width:228,background:"#0f172a",display:"flex",flexDirection:"column",padding:"20px 0",flexShrink:0}}>
        <div style={{padding:"0 16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"linear-gradient(135deg,#2563eb,#7c3aed)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Icon name="shield" size={19}/></div>
            <div><div style={{color:"#f1f5f9",fontWeight:800,fontSize:14,fontFamily:"'Playfair Display',serif"}}>SeguroCRM</div><div style={{color:"#475569",fontSize:10}}>Agente Profesional</div></div>
          </div>
        </div>
        <nav style={{flex:1,overflowY:"auto"}}>
          {nav.map(item=>(
            <button key={item.id} onClick={()=>setVista(item.id)}
              style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 16px",background:vista===item.id?"rgba(37,99,235,.18)":"none",border:"none",cursor:"pointer",color:vista===item.id?"#93c5fd":"#64748b",fontSize:13,fontWeight:vista===item.id?700:500,textAlign:"left",fontFamily:"inherit",borderLeft:`3px solid ${vista===item.id?"#3b82f6":"transparent"}`,transition:"all .15s"}}>
              <Icon name={item.icon} size={16}/>
              <span style={{flex:1}}>{item.label}</span>
              {item.badge&&<span style={{background:badgeColors[item.badge]||"#6b7280",color:"#fff",fontSize:8,padding:"1px 5px",borderRadius:20,fontWeight:800,letterSpacing:"0.05em"}}>{item.badge}</span>}
            </button>
          ))}
          {/* Botón notificaciones */}
          <button onClick={()=>setNotifPanel(v=>!v)}
            style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"10px 16px",
              background:notifPanel?"rgba(220,38,38,.15)":"none",border:"none",cursor:"pointer",
              color:totalNotif>0?"#fca5a5":"#64748b",fontSize:13,fontWeight:500,textAlign:"left",
              fontFamily:"inherit",borderLeft:`3px solid ${notifPanel?"#ef4444":"transparent"}`,transition:"all .15s"}}>
            <Icon name="bell" size={16}/>
            <span style={{flex:1}}>Alertas</span>
            {totalNotif>0&&(
              <span style={{background:"#dc2626",color:"#fff",fontSize:9,padding:"1px 6px",borderRadius:20,fontWeight:800,minWidth:18,textAlign:"center"}}>
                {totalNotif}
              </span>
            )}
          </button>
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid #1e293b"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11}}>
              {(sesion.nombre||"U").slice(0,2).toUpperCase()}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#e2e8f0",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sesion.nombre}</div>
              <div style={{color:"#475569",fontSize:10,textTransform:"capitalize"}}>{sesion.rol}</div>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión"
              style={{background:"none",border:"none",cursor:"pointer",color:"#475569",padding:4,display:"flex",
                borderRadius:6,transition:"all .15s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
              onMouseLeave={e=>e.currentTarget.style.color="#475569"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Header móvil */}
      {isMobile&&(
        <div style={{background:"#0f172a",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,zIndex:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,background:"linear-gradient(135deg,#2563eb,#7c3aed)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>
              <Icon name="shield" size={14}/>
            </div>
            <span style={{color:"#f1f5f9",fontWeight:800,fontSize:14,fontFamily:"'Playfair Display',serif"}}>SeguroCRM</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {totalNotif>0&&(
              <button onClick={()=>setNotifPanel(v=>!v)}
                style={{background:"rgba(220,38,38,0.2)",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:5,color:"#fca5a5"}}>
                <Icon name="bell" size={14}/>
                <span style={{fontSize:11,fontWeight:800}}>{totalNotif}</span>
              </button>
            )}
            <div style={{width:28,height:28,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:10}}>
              {(sesion.nombre||"U").slice(0,2).toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 32px",position:"relative"}} className="crm-main-content">

        {/* Toast Google Calendar */}
        {gcalToast&&(
          <div style={{position:"fixed",top:20,right:20,background:gcalToast.color,color:"#fff",
            padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:700,zIndex:9999,
            boxShadow:"0 8px 24px rgba(0,0,0,0.25)",display:"flex",alignItems:"center",gap:8}}>
            {gcalToast.msg}
          </div>
        )}

        {/* Panel de alertas */}
        {notifPanel&&(
          <div style={{marginBottom:20,background:"#fff",borderRadius:16,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",overflow:"hidden",border:"1.5px solid #e5e7eb"}}>
            <div style={{background:"#0f172a",padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Icon name="bell" size={16}/>
                <div style={{color:"#f1f5f9",fontWeight:800,fontSize:14,fontFamily:"'Playfair Display',serif"}}>
                  Alertas de Vencimiento
                </div>
                {totalNotif>0&&<span style={{background:"#dc2626",color:"#fff",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:800}}>{totalNotif} polizas</span>}
              </div>
              <button onClick={()=>setNotifPanel(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:18,lineHeight:1}}>×</button>
            </div>

            {totalNotif===0?(
              <div style={{padding:"32px",textAlign:"center",color:"#9ca3af",fontSize:13}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                Sin pólizas próximas a vencer en los próximos 15 días
              </div>
            ):(
              <div style={{maxHeight:420,overflowY:"auto"}}>
                {/* Vence HOY */}
                {notif0.length>0&&(
                  <div style={{padding:"10px 20px 6px",background:"#fef2f2"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#dc2626",letterSpacing:"0.08em",marginBottom:8}}>🔴 VENCEN HOY ({notif0.length})</div>
                    {notif0.map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#fff",borderRadius:10,marginBottom:6,border:"1.5px solid #fecaca"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#111827"}}>{p.numero}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{p.cliente} · {p.aseguradora}</div>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>agregarPolizaCalendar(p,"hoy")}
                            style={{background:"#4285f4",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            📅 Calendario
                          </button>
                          <button onClick={()=>enviarInvitacionCliente(p)}
                            style={{background:"#f3f4f6",color:"#374151",border:"1px solid #e5e7eb",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            👤 Cliente
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Vence en 7 días */}
                {notif7.filter(p=>!notif0.includes(p)).length>0&&(
                  <div style={{padding:"10px 20px 6px",background:"#fffbeb"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#d97706",letterSpacing:"0.08em",marginBottom:8}}>🟡 VENCEN EN 7 DÍAS ({notif7.filter(p=>!notif0.includes(p)).length})</div>
                    {notif7.filter(p=>!notif0.includes(p)).map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#fff",borderRadius:10,marginBottom:6,border:"1.5px solid #fde68a"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#111827"}}>{p.numero}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{p.cliente} · {p.aseguradora} · vence {p.vencimiento}</div>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>agregarPolizaCalendar(p,"5dias")}
                            style={{background:"#4285f4",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            📅 Calendario
                          </button>
                          <button onClick={()=>enviarInvitacionCliente(p)}
                            style={{background:"#f3f4f6",color:"#374151",border:"1px solid #e5e7eb",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            👤 Cliente
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Vence en 15 días */}
                {notif15.filter(p=>!notif7.includes(p)).length>0&&(
                  <div style={{padding:"10px 20px 6px"}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#6b7280",letterSpacing:"0.08em",marginBottom:8}}>⚪ VENCEN EN 15 DÍAS ({notif15.filter(p=>!notif7.includes(p)).length})</div>
                    {notif15.filter(p=>!notif7.includes(p)).map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#f9fafb",borderRadius:10,marginBottom:6,border:"1.5px solid #e5e7eb"}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:"#111827"}}>{p.numero}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{p.cliente} · {p.aseguradora} · vence {p.vencimiento}</div>
                        </div>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>agregarPolizaCalendar(p,"10dias")}
                            style={{background:"#4285f4",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            📅 Calendario
                          </button>
                          <button onClick={()=>enviarInvitacionCliente(p)}
                            style={{background:"#f3f4f6",color:"#374151",border:"1px solid #e5e7eb",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                            👤 Cliente
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {vista==="dashboard"&&puede("dashboard")&&<Dashboard clientes={clientes} polizas={polizas} pipeline={pipeline} tareas={tareas} paiMetas={paiMetas}/>}
        {vista==="clientes"&&puede("clientes")&&<Clientes clientes={clientes} setClientes={setClientes} polizas={polizas} setPolizas={setPolizas}/>}
        {vista==="polizas"&&puede("polizas")&&<Polizas polizas={polizas} setPolizas={setPolizas} clientes={clientes} setClientes={setClientes} subagentes={subagentes} setSubagentes={setSubagentes} plantillas={plantillas} puede={puede} sesion={sesion}/>}
        {vista==="comisiones"&&puede("comisiones")&&<Comisiones
          polizas={polizas}
          subagentes={subagentes}
          tablaComisiones={tablaComisiones}
          setTablaComisiones={setTablaComisiones}
          pagosComision={pagosComision}
          setPagosComision={setPagosComision}
          onMontarCallbacks={()=>{
            window.__onAplicarPagoComision = (polizaId, pago, r) => {
              setPolizas(prev=>prev.map(p=>p.id===polizaId?{
                ...p,
                pagos:[...(p.pagos||[]),pago],
                ultimoPago:pago,
                comisionPagada:true,
                fechaPagoComision:pago.fechaPago,
              }:p));
            };
          }}
        />}}
        {vista==="pipeline"&&puede("pipeline")&&<Pipeline pipeline={pipeline} setPipeline={setPipeline}/>}
        {vista==="tareas"&&<Tareas tareas={tareas} setTareas={setTareas}/>}
        {vista==="calendario"&&puede("calendario")&&<Calendario polizas={polizas} clientes={clientes} tareas={tareas} setPolizas={setPolizas}/>}
        {vista==="importar"&&puede("importar")&&<Importador clientes={clientes} setClientes={setClientes} polizas={polizas} setPolizas={setPolizas}/>}
        {vista==="configuracion"&&puede("configuracion")&&<Configuracion config={config} setConfig={setConfig} subagentes={subagentes} setSubagentes={setSubagentes} usuarios={usuarios} setUsuarios={setUsuarios} polizas={polizas} setPolizas={setPolizas} plantillas={plantillas} setPlantillas={setPlantillas} plantillasDefault={PLANTILLAS_DEFAULT} clientes={clientes} historialNotif={historialNotif} setHistorialNotif={setHistorialNotif}/>}
        {/* Acceso denegado */}
        {!puede(vista)&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"60vh",gap:16}}>
            <div style={{fontSize:48}}>🔒</div>
            <div style={{fontSize:20,fontWeight:800,fontFamily:"'Playfair Display',serif",color:"#111827"}}>Acceso restringido</div>
            <div style={{fontSize:14,color:"#6b7280"}}>No tienes permisos para ver esta sección.</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>Contacta al administrador si necesitas acceso.</div>
          </div>
        )}
      </div>

      {/* Barra navegación inferior — solo móvil */}
      {isMobile&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0f172a",
          borderTop:"1px solid #1e293b",display:"flex",alignItems:"center",
          justifyContent:"space-around",padding:"6px 0 10px",zIndex:100,
          boxShadow:"0 -4px 20px rgba(0,0,0,0.3)"}}>
          {[
            {id:"dashboard",  label:"Inicio",    icon:"dashboard"},
            {id:"clientes",   label:"Clientes",  icon:"clients"},
            {id:"polizas",    label:"Pólizas",   icon:"policies"},
            {id:"calendario", label:"Agenda",    icon:"tasks"},
            {id:"_mas",       label:"Más",       icon:"users"},
          ].filter(item=>item.id==="polizas"||item.id==="_mas"||puede(item.id)).map(item=>{
            const activo = item.id==="_mas"
              ? ["pai","pipeline","importar","configuracion"].includes(vista)
              : vista===item.id;
            return (
              <button key={item.id} onClick={()=>{
                if(item.id==="_mas") setVista(vista==="configuracion"?"dashboard":"configuracion");
                else setVista(item.id);
              }}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,
                  background:"none",border:"none",cursor:"pointer",padding:"4px 8px",
                  color:activo?"#93c5fd":"#475569",fontFamily:"inherit",flex:1,
                  position:"relative",transition:"color .15s"}}>
                <Icon name={item.icon} size={20}/>
                <span style={{fontSize:9,fontWeight:activo?800:500}}>{item.label}</span>
                {activo&&<div style={{position:"absolute",top:-6,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:"#3b82f6"}}/>}
              </button>
            );
          })}
          <button onClick={()=>setNotifPanel(v=>!v)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              background:"none",border:"none",cursor:"pointer",padding:"4px 8px",
              color:totalNotif>0?"#fca5a5":"#475569",fontFamily:"inherit",flex:1,position:"relative"}}>
            <Icon name="bell" size={20}/>
            <span style={{fontSize:9,fontWeight:500}}>Alertas</span>
            {totalNotif>0&&<span style={{position:"absolute",top:0,right:"20%",background:"#dc2626",color:"#fff",fontSize:8,borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{totalNotif}</span>}
          </button>
        </div>
      )}
    </div>
  );
}
