import { useState, useRef, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadialBarChart, RadialBar } from "recharts";

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
  { id:1, cliente:"Ana Sofía Torres", tipo:"Gastos Médicos Familiar", valor:18000, etapa:"Cotización", probabilidad:40, seguimiento:"2025-01-20" },
  { id:2, cliente:"Juan Pablo Reyes", tipo:"Vida Universal", valor:35000, etapa:"Propuesta", probabilidad:65, seguimiento:"2025-01-18" },
  { id:3, cliente:"Diana Morales", tipo:"Autos Individual", valor:7200, etapa:"Contacto", probabilidad:20, seguimiento:"2025-01-22" },
  { id:4, cliente:"Fernando Castro", tipo:"Daños + Vida", valor:15000, etapa:"Negociación", probabilidad:80, seguimiento:"2025-01-17" },
  { id:5, cliente:"Valeria Gutiérrez", tipo:"GMM Individual", valor:9600, etapa:"Cierre", probabilidad:95, seguimiento:"2025-01-16" },
];

const TAREAS_INIT = [
  { id:1, titulo:"Llamar a Ana Torres para cotización GMM", fecha:"2025-01-18", tipo:"llamada", done:false, prioridad:"alta" },
  { id:2, titulo:"Enviar renovación póliza GNP-2024-339900", fecha:"2025-01-20", tipo:"email", done:false, prioridad:"alta" },
  { id:3, titulo:"Cita con Fernando Castro - Negociación", fecha:"2025-01-17", tipo:"cita", done:false, prioridad:"media" },
  { id:4, titulo:"Revisar documentación Roberto Sánchez", fecha:"2025-01-22", tipo:"doc", done:true, prioridad:"baja" },
  { id:5, titulo:"Seguimiento Valeria Gutiérrez - cierre", fecha:"2025-01-16", tipo:"llamada", done:false, prioridad:"alta" },
];

const USUARIOS_INIT = [
  { id:1, nombre:"Agente García", email:"garcia@seguros.com", rol:"admin", status:"activo", telefono:"5500001111", clave:"AGT-001", polizasAsignadas:4 },
  { id:2, nombre:"Laura Pérez", email:"lperez@seguros.com", rol:"agente", status:"activo", telefono:"5522223333", clave:"AGT-002", polizasAsignadas:2 },
  { id:3, nombre:"Marco Ruiz", email:"mruiz@seguros.com", rol:"asistente", status:"inactivo", telefono:"5544445555", clave:"AGT-003", polizasAsignadas:0 },
];

const PAI_METAS_INIT = [
  { id:1, ramo:"Vida", periodo:"Q1 2025", metaBono:50000, cobrado:32400, fechaInicio:"2025-01-01", fechaFin:"2025-03-31", activa:true },
  { id:2, ramo:"Gastos Médicos", periodo:"Q1 2025", metaBono:80000, cobrado:48000, fechaInicio:"2025-01-01", fechaFin:"2025-03-31", activa:true },
  { id:3, ramo:"Autos", periodo:"Q1 2025", metaBono:30000, cobrado:11800, fechaInicio:"2025-01-01", fechaFin:"2025-03-31", activa:true },
  { id:4, ramo:"Daños", periodo:"Q1 2025", metaBono:20000, cobrado:7600, fechaInicio:"2025-01-01", fechaFin:"2025-03-31", activa:true },
];

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

  // Consonante interna ApP + consonante interna ApM + consonante interna Nombre (homoclave simplificada)
  const primeraCons = (s, desde=1) => {
    const arr = s.slice(desde).split("");
    return arr.find(c => CONSONANTES.test(c) && !/[AEIOU]/i.test(c)) || "X";
  };

  const h1 = primeraCons(ap1, 1);
  const h2 = primeraCons(ap2.length > 1 ? ap2 : "X", 1);
  const h3 = primeraCons(nom, 1);

  return `${parte1}${parteFecha}${h1}${h2}${h3}`;
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
  <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 6px rgba(0,0,0,0.07)",borderLeft:`4px solid ${accent}`,display:"flex",flexDirection:"column",gap:7}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <span style={{fontSize:12,color:"#6b7280",fontWeight:500}}>{label}</span>
      <div style={{background:accent+"18",color:accent,borderRadius:10,padding:7,display:"flex"}}><Icon name={icon} size={19}/></div>
    </div>
    <div style={{fontSize:28,fontWeight:800,color:"#111827",fontFamily:"'Playfair Display',serif",lineHeight:1}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#9ca3af"}}>{sub}</div>}
  </div>
);

const Modal = ({ title, onClose, children, wide, maxW }) => (
  <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:maxW||(wide?760:500),maxHeight:"92vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <h3 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#6b7280",display:"flex"}}><Icon name="x" size={22}/></button>
      </div>
      {children}
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
function Dashboard({ clientes, polizas, pipeline, tareas, paiMetas }) {
  const activas = polizas.filter(p=>p.status==="activa");
  const vencidas = polizas.filter(p=>p.status==="vencida");
  const porVencer = polizas.filter(p=>p.status==="por vencer");
  const primaTotal = activas.reduce((a,p)=>a+p.prima,0);
  const totalMeta = paiMetas.reduce((a,m)=>a+m.metaBono,0);
  const totalCobrado = paiMetas.reduce((a,m)=>a+m.cobrado,0);
  const pctPAI = Math.round((totalCobrado/totalMeta)*100)||0;

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
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:13}}>
        <KPICard label="Clientes" value={clientes.length} sub="En cartera" icon="clients" accent="#2563eb"/>
        <KPICard label="Pólizas Activas" value={activas.length} sub={`${porVencer.length} por vencer`} icon="shield" accent="#059669"/>
        <KPICard label="Prima Vigente" value={`$${(primaTotal/1000).toFixed(0)}K`} sub="Total cobrado activo" icon="trend" accent="#d97706"/>
        <KPICard label="PAI Global" value={`${pctPAI}%`} sub="Avance de bono" icon="trophy" accent="#7c3aed"/>
        <KPICard label="Tareas" value={tareas.filter(t=>!t.done).length} sub="Pendientes" icon="tasks" accent="#dc2626"/>
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

      {/* Alertas y tareas */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>⚠️ Alertas de Pólizas</h3>
          {polizas.filter(p=>["por vencer","vencida"].includes(p.status)).map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:p.status==="vencida"?"#fef2f2":"#fffbeb",borderRadius:10,marginBottom:7}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12}}>{p.numero}</div><div style={{fontSize:11,color:"#6b7280"}}>{p.cliente} · {p.vencimiento}</div></div>
              <Badge status={p.status}/>
            </div>
          ))}
          {!polizas.filter(p=>["por vencer","vencida"].includes(p.status)).length&&<div style={{color:"#9ca3af",fontSize:13,textAlign:"center",padding:"20px 0"}}>Sin alertas activas ✅</div>}
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <h3 style={{margin:"0 0 14px",fontSize:14,fontWeight:700}}>📋 Tareas Urgentes</h3>
          {tareas.filter(t=>!t.done&&t.prioridad==="alta").slice(0,4).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",background:"#fef2f2",borderRadius:10,marginBottom:7}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:"#dc2626",flexShrink:0}}/>
              <div style={{flex:1,fontSize:12,fontWeight:500}}>{t.titulo}</div>
              <div style={{fontSize:11,color:"#9ca3af"}}>{t.fecha}</div>
            </div>
          ))}
        </div>
      </div>
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

function Clientes({ clientes, setClientes }) {
  const [busqueda, setBusqueda] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showDetalle, setShowDetalle] = useState(null);
  const [form, setForm] = useState(FORM_CLIENTE_INIT);
  const [errores, setErrores] = useState({});

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
        <div style={{padding:"12px 18px",borderBottom:"1px solid #f3f4f6",display:"flex",alignItems:"center",gap:10}}>
          <Icon name="search"/><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar por nombre o email..." style={{border:"none",outline:"none",fontSize:14,flex:1,fontFamily:"inherit"}}/>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
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
        </table>
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
      {showDetalle&&(
        <Modal title={`Detalle — ${nombreCompleto(showDetalle)}`} onClose={()=>setShowDetalle(null)} wide>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[
              ["Nombre completo",nombreCompleto(showDetalle)],
              ["RFC",showDetalle.rfc||"—"],
              ["Fecha nacimiento",showDetalle.fechaNacimiento||"—"],
              ["Sexo",showDetalle.sexo==="M"?"Masculino":showDetalle.sexo==="F"?"Femenino":"—"],
              ["Email",showDetalle.email||"—"],
              ["Teléfono",showDetalle.telefono||"—"],
              ["WhatsApp",showDetalle.whatsapp||"—"],
              ["Dirección",showDetalle.calle?`${showDetalle.calle} ${showDetalle.numero}, Col. ${showDetalle.colonia}`:"—"],
              ["C.P.",showDetalle.cp||"—"],
              ["Ciudad",showDetalle.ciudad||"—"],
              ["Estado",showDetalle.estado||"—"],
              ["Pólizas",showDetalle.polizas],
            ].map(([l,v])=>(
              <div key={l} style={{background:"#f9fafb",borderRadius:10,padding:"10px 13px"}}>
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:3}}>{l.toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{v}</div>
              </div>
            ))}
          </div>
          {showDetalle.whatsapp&&(
            <div style={{marginTop:16}}>
              <Btn onClick={()=>window.open(`https://wa.me/52${showDetalle.whatsapp.replace(/\D/g,"")}`,`_blank`)} color="#25d366" icon="whatsapp">
                Abrir WhatsApp
              </Btn>
            </div>
          )}
        </Modal>
      )}
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
  ramo:"", subramo:"",
  // Paso 3 — Vigencia
  inicio:"", vencimiento:"", status:"activa",
  // Paso 4 — Datos económicos
  formaPago:"Anual", primaNeta:"", gastosExpedicion:"", recargoPago:"", iva:"", primaTotal:"",
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
    const neta = parseFloat(f.primaNeta)||0;
    const gasto = parseFloat(f.gastosExpedicion)||0;
    const recargo = parseFloat(f.recargoPago)||0;
    const ivaBase = (neta + gasto + recargo) * 0.16;
    return (neta + gasto + recargo + ivaBase).toFixed(2);
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
          <SecBox title="CLIENTE ASEGURADO" color="#1e40af">
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af",marginBottom:12}}>
              ℹ️ El cliente debe estar previamente registrado en el módulo de <strong>Clientes</strong>
            </div>
            <div style={{position:"relative",marginBottom:10}}>
              <div style={{position:"absolute",left:11,top:10,color:"#9ca3af"}}><Icon name="search" size={15}/></div>
              <input value={busqCliente} onChange={e=>{setBusqCliente(e.target.value); if(!e.target.value) setForm(p=>({...p,clienteId:"",cliente:""}));}}
                placeholder="Escribe nombre o RFC del cliente..."
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
                <Inp type="date" value={form.inicio} onChange={e=>sf("inicio",e.target.value)}/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Desde las 12:00 hrs. del día indicado</div>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fin de vigencia *</label>
                <Inp type="date" value={form.vencimiento} onChange={e=>sf("vencimiento",e.target.value)}/>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>Hasta las 12:00 hrs. del día indicado</div>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <Sel label="Forma de Pago" value={form.formaPago} onChange={e=>sf("formaPago",e.target.value)}>
                {["Anual","Semestral","Trimestral","Mensual"].map(f=><option key={f}>{f}</option>)}
              </Sel>
              <Inp label="Fecha de Emisión (si aplica)" type="date" value={form.fechaEmision} onChange={e=>sf("fechaEmision",e.target.value)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Inp label="Prima Neta ($)" type="number" value={form.primaNeta} onChange={e=>{sf("primaNeta",e.target.value); setForm(p=>{const np={...p,primaNeta:e.target.value};return{...np,primaTotal:calcPrimaTotal(np)};});}} placeholder="11,188.49"/>
              <Inp label="Gastos de Expedición ($)" type="number" value={form.gastosExpedicion} onChange={e=>{setForm(p=>{const np={...p,gastosExpedicion:e.target.value};return{...np,primaTotal:calcPrimaTotal(np)};});}} placeholder="790.00"/>
              <Inp label="Recargo Pago Fraccionado ($)" type="number" value={form.recargoPago} onChange={e=>{setForm(p=>{const np={...p,recargoPago:e.target.value};return{...np,primaTotal:calcPrimaTotal(np)};});}} placeholder="839.14"/>
              <Inp label="I.V.A. 16% (calculado)" value={form.primaNeta||form.gastosExpedicion||form.recargoPago ? `$${(((parseFloat(form.primaNeta)||0)+(parseFloat(form.gastosExpedicion)||0)+(parseFloat(form.recargoPago)||0))*0.16).toFixed(2)}` : ""} readOnly style={{background:"#f3f4f6",color:"#6b7280"}}/>
            </div>
            <div style={{marginTop:14,background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:12,padding:"16px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{color:"#94a3b8",fontSize:13,fontWeight:600}}>PRIMA TOTAL A PAGAR</div>
              <div style={{color:"#fff",fontSize:28,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>
                ${parseFloat(calcPrimaTotal(form)).toLocaleString("es-MX",{minimumFractionDigits:2})}
              </div>
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
  const [expandido, setExpandido] = useState(false);
  const esPDF = tipo === "application/pdf" || nombre?.toLowerCase().endsWith(".pdf");
  const esImagen = /image\//i.test(tipo) || /\.(jpg|jpeg|png|webp|gif)$/i.test(nombre||"");

  return (
    <div style={{background:"#f0f6ff",borderRadius:12,border:"1.5px solid #bfdbfe",overflow:"hidden"}}>
      {/* Barra superior del visor */}
      <div style={{background:"#1e40af",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:18}}>{esPDF?"📄":"🖼️"}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nombre||"Documento de póliza"}</div>
          <div style={{fontSize:10,color:"#93c5fd"}}>{esPDF?"PDF":"Imagen"} · {expandido?"Vista completa":"Vista previa"}</div>
        </div>
        <div style={{display:"flex",gap:7,flexShrink:0}}>
          <button onClick={()=>setExpandido(e=>!e)}
            style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:7,padding:"5px 12px",
              fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
            {expandido?"⊖ Reducir":"⊕ Expandir"}
          </button>
          <a href={src} download={nombre||"poliza"}
            style={{background:"rgba(255,255,255,0.15)",borderRadius:7,padding:"5px 12px",
              fontSize:11,fontWeight:700,color:"#fff",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
            ⬇ Descargar
          </a>
        </div>
      </div>

      {/* Contenido visor */}
      <div style={{background:"#fff",position:"relative"}}>
        {esPDF ? (
          <iframe
            src={src}
            title={nombre||"Póliza"}
            style={{width:"100%",height:expandido?"780px":"420px",border:"none",display:"block",transition:"height .3s"}}
          />
        ) : esImagen ? (
          <div style={{padding:"12px",textAlign:"center",background:"#f9fafb"}}>
            <img
              src={src}
              alt={nombre||"Póliza"}
              style={{maxWidth:"100%",height:expandido?"auto":"380px",objectFit:"contain",borderRadius:8,
                boxShadow:"0 2px 12px rgba(0,0,0,0.1)",transition:"height .3s",cursor:"pointer"}}
              onClick={()=>setExpandido(e=>!e)}
            />
            {!expandido&&(
              <div style={{fontSize:11,color:"#9ca3af",marginTop:6}}>Haz clic en la imagen para ampliar</div>
            )}
          </div>
        ) : (
          <div style={{padding:"30px",textAlign:"center",color:"#6b7280"}}>
            <div style={{fontSize:32,marginBottom:8}}>📎</div>
            <div style={{fontSize:13,fontWeight:600}}>Documento adjunto</div>
            <a href={src} download={nombre} style={{color:"#2563eb",fontSize:12}}>Descargar archivo</a>
          </div>
        )}
      </div>
    </div>
  );
}

function Polizas({ polizas, setPolizas, clientes, subagentes, setSubagentes }) {
  const [filtro, setFiltro] = useState("todas");
  const [filtroRamo, setFiltroRamo] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showDetalle, setShowDetalle] = useState(null);
  const [showPago, setShowPago] = useState(null);
  const [showRenovar, setShowRenovar] = useState(null);
  const [busqueda, setBusqueda] = useState("");
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
    if (diff <= 10) return "por vencer";
    return "activa";
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
    .filter(p => !busqueda || p.numero?.toLowerCase().includes(busqueda.toLowerCase()) || p.cliente?.toLowerCase().includes(busqueda.toLowerCase()));

  const onGuardar = (data) => setPolizas(prev => [...prev, data]);
  const onExtracted = (data) => { setPolizas(prev => [...prev, {...FORM_POLIZA_INIT, ...data, id:Date.now()}]); setShowScan(false); };

  const cancelarPoliza = (id) => {
    if (!window.confirm("¿Cancelar esta póliza? Esta acción no se puede deshacer.")) return;
    setPolizas(prev => prev.map(p => p.id === id ? {...p, status:"cancelada"} : p));
    setShowDetalle(null);
  };

  const registrarPago = (pago) => {
    setPolizas(prev => prev.map(p => p.id === showPago.id
      ? {...p, pagos:[...(p.pagos||[]), pago], ultimoPago:pago}
      : p
    ));
    setShowDetalle(prev => prev ? {...prev, pagos:[...(prev.pagos||[]), pago], ultimoPago:pago} : prev);
  };

  const renovarPoliza = (nueva) => {
    setPolizas(prev => [...prev.map(p => p.id === showRenovar.id ? {...p, status:"vencida"} : p), nueva]);
    setShowDetalle(null);
  };

  const polizaDetalle = showDetalle ? {...showDetalle, _status: getStatus(showDetalle)} : null;

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
              <div style={{fontSize:22,fontWeight:900,color:cfg.color,fontFamily:"'Playfair Display',serif"}}>{counts[s]}</div>
              <div style={{fontSize:11,fontWeight:600,color:"#6b7280"}}>{cfg.label.replace(/[●⚠✗○] /,"")}</div>
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
          <Icon name="search" size={14}/><input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar número, cliente..." style={{border:"none",outline:"none",fontSize:13,flex:1,fontFamily:"inherit"}}/>
        </div>
      </div>

      {/* Tarjetas póliza */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))",gap:14}}>
        {filtradas.map(p=>{
          const st = getStatus(p); const cfg = STATUS_CFG[st];
          const tienePago = p.ultimoPago;
          return (
            <div key={p.id} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 1px 8px rgba(0,0,0,0.08)"}}>
              {/* Header ramo */}
              <div style={{background:`linear-gradient(135deg,${ramoColor(p.ramo)},${ramoColor(p.ramo)}cc)`,padding:"13px 16px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{fontSize:9,fontWeight:800,opacity:.8,letterSpacing:"0.1em"}}>{p.ramo?.toUpperCase()}{p.subramo?` · ${p.subramo.toUpperCase()}`:""}</div>
                  <div style={{fontSize:12,fontWeight:800,fontFamily:"monospace",marginTop:2}}>{p.numero}</div>
                </div>
                <span style={{background:cfg.badge,color:cfg.color,padding:"2px 9px",borderRadius:20,fontSize:10,fontWeight:800}}>
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
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button onClick={()=>setShowDetalle(p)} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:8,padding:"6px",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",color:"#374151",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
                    {p.documentoPoliza&&<span title="Tiene documento adjunto">📎</span>}
                    Ver detalle
                  </button>
                  {st!=="cancelada"&&(
                    <>
                      <button onClick={(e)=>{e.stopPropagation();setShowPago(p);}} style={{flex:1,background:"#f0fdf4",border:"1px solid #d1fae5",borderRadius:8,padding:"6px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#059669"}}>
                        💳 Pago
                      </button>
                      <button onClick={(e)=>{e.stopPropagation();setShowRenovar(p);}} style={{flex:1,background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:8,padding:"6px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#7c3aed"}}>
                        🔄 Renovar
                      </button>
                    </>
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
      </div>

      {/* Modal detalle */}
      {polizaDetalle&&(
        <Modal title={`Póliza ${polizaDetalle.numero}`} onClose={()=>setShowDetalle(null)} wide maxW={720}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {/* Header */}
            <div style={{background:`linear-gradient(135deg,${ramoColor(polizaDetalle.ramo)},${ramoColor(polizaDetalle.ramo)}aa)`,borderRadius:12,padding:"16px 20px",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:10,opacity:.8,fontWeight:700,letterSpacing:"0.08em"}}>{polizaDetalle.ramo?.toUpperCase()}{polizaDetalle.subramo?` · ${polizaDetalle.subramo}`:""} · {polizaDetalle.aseguradora}</div>
                <div style={{fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif",marginTop:2}}>{polizaDetalle.numero}</div>
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
              {[["Número/Endoso",`${polizaDetalle.numero}/${polizaDetalle.endoso||"0"}`],["Aseguradora",polizaDetalle.aseguradora||"—"],["Vigencia inicio",polizaDetalle.inicio||"—"],["Vigencia fin",polizaDetalle.vencimiento||"—"],["Prima neta",polizaDetalle.primaNeta?`$${Number(polizaDetalle.primaNeta).toLocaleString()}`:"—"],["Gastos expedición",polizaDetalle.gastosExpedicion?`$${Number(polizaDetalle.gastosExpedicion).toLocaleString()}`:"—"],["Forma de pago",polizaDetalle.formaPago||"—"],["Beneficiario",polizaDetalle.beneficiarioPreferente||"—"]].map(([l,v])=>(
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
                    <div style={{fontSize:20}}>💳</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#065f46"}}>{pg.fechaPago} · {pg.formaPago}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>
                        ${Number(pg.monto||0).toLocaleString()} {pg.referencia?`· Ref: ${pg.referencia}`:""}
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

            {/* Visor documento de póliza */}
            {polizaDetalle.documentoPoliza&&(
              <DocumentoVisor
                src={polizaDetalle.documentoPoliza}
                nombre={polizaDetalle.documentoNombre}
                tipo={polizaDetalle.documentoTipo}
              />
            )}

            {/* Acciones del detalle */}
            {polizaDetalle._status!=="cancelada"&&(
              <div style={{display:"flex",gap:10,paddingTop:4,borderTop:"1px solid #f3f4f6"}}>
                <Btn onClick={()=>{setShowPago(polizaDetalle);}} color="#059669" icon="check">💳 Registrar Pago</Btn>
                <Btn onClick={()=>{setShowRenovar(polizaDetalle);}} color="#7c3aed">🔄 Renovar</Btn>
                <button onClick={()=>cancelarPoliza(polizaDetalle.id)}
                  style={{marginLeft:"auto",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#dc2626"}}>
                  Cancelar póliza
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Registrar Pago */}
      {showPago&&(
        <Modal title={`Registrar Pago — ${showPago.numero}`} onClose={()=>setShowPago(null)}>
          <ModalPago poliza={showPago} onGuardar={registrarPago} onClose={()=>setShowPago(null)}/>
        </Modal>
      )}

      {/* Modal Renovar */}
      {showRenovar&&(
        <Modal title={`Renovar Póliza — ${showRenovar.numero}`} onClose={()=>setShowRenovar(null)} wide>
          <ModalRenovar poliza={showRenovar} onGuardar={renovarPoliza} onClose={()=>setShowRenovar(null)}/>
        </Modal>
      )}

      {showModal&&<ModalPoliza clientes={clientes} subagentes={subagentes||[]} onGuardar={onGuardar} onClose={()=>setShowModal(false)}/>}
      {showScan&&<ScanPoliza onClose={()=>setShowScan(false)} onExtracted={onExtracted}/>}
    </div>
  );
}


// ── Lector IA ─────────────────────────────────────────────────────
function ScanPoliza({ onClose, onExtracted }) {
  const [step,setStep]=useState("upload");
  const [dragOver,setDragOver]=useState(false);
  const [fileName,setFileName]=useState("");
  const [fileData,setFileData]=useState(null);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const fileRef=useRef();

  const processFile=(file)=>{if(!file)return;setFileName(file.name);const r=new FileReader();r.onload=e=>setFileData({base64:e.target.result.split(",")[1],type:file.type});r.readAsDataURL(file);};

  const analyze=async()=>{
    if(!fileData)return;setStep("analyzing");
    try{
      const block=fileData.type==="application/pdf"
        ?{type:"document",source:{type:"base64",media_type:"application/pdf",data:fileData.base64}}
        :{type:"image",source:{type:"base64",media_type:fileData.type,data:fileData.base64}};
      const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:[block,{type:"text",text:`Extrae TODOS los datos de esta póliza. Responde SOLO JSON sin markdown:\n{"numero":"","cliente":"","aseguradora":"","ramo":"Autos/Vida/Gastos Médicos/Daños","subramo":"","prima":0,"frecuencia":"Anual","inicio":"YYYY-MM-DD","vencimiento":"YYYY-MM-DD","status":"activa","coberturas":[],"notas":""}`}]}]})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error?.message);
      const text=data.content.map(b=>b.text||"").join("");
      setResult(JSON.parse(text.replace(/```json|```/g,"").trim()));
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
      {step==="result"&&result&&(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",color:"#065f46",fontWeight:600,fontSize:13}}>✅ Datos extraídos — revisa y confirma</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {[["Número",result.numero],["Cliente",result.cliente],["Aseguradora",result.aseguradora],["Ramo",result.ramo],["Subramo",result.subramo],["Prima",result.prima?`$${Number(result.prima).toLocaleString()}`:""],["Frecuencia",result.frecuencia],["Inicio",result.inicio],["Vencimiento",result.vencimiento]].map(([l,v])=>v?(
              <div key={l} style={{background:"#f9fafb",borderRadius:9,padding:"9px 11px"}}>
                <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:2}}>{l.toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:600}}>{v}</div>
              </div>
            ):null)}
          </div>
          {result.coberturas?.length>0&&<div style={{background:"#f9fafb",borderRadius:9,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#9ca3af",fontWeight:700,marginBottom:7}}>COBERTURAS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{result.coberturas.map(c=><span key={c} style={{background:"#dbeafe",color:"#1e40af",fontSize:11,padding:"3px 9px",borderRadius:20}}>{c}</span>)}</div>
          </div>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={()=>setStep("upload")} style={{flex:1,background:"#f3f4f6",border:"none",borderRadius:9,padding:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:13}}>← Volver</button>
            <Btn onClick={()=>onExtracted(result)} color="#059669" style={{flex:2,justifyContent:"center"}}>Confirmar y agregar ✓</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════
// NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════
function Notificaciones({ polizas }) {
  const [tab,setTab]=useState("recordatorios");
  const [canal,setCanal]=useState("whatsapp");
  const [diasAntes,setDiasAntes]=useState(30);
  const [previewPoliza,setPreviewPoliza]=useState(null);
  const [enviados,setEnviados]=useState([]);
  const [toast,setToast]=useState(null);

  const proximasVencer=polizas.filter(p=>{
    if(!p.vencimiento)return false;
    const hoy=new Date();const venc=new Date(p.vencimiento);
    const diff=Math.ceil((venc-hoy)/(1000*60*60*24));
    return diff>=0&&diff<=diasAntes;
  });

  const genWA=(p)=>`Hola ${p.cliente.split(" ")[0]} 👋,\n\nTe escribo de *SeguroCRM* para recordarte sobre tu póliza:\n\n📄 *Póliza:* ${p.numero}\n🏢 *Aseguradora:* ${p.aseguradora}\n🔖 *Ramo:* ${p.ramo}${p.subramo?` › ${p.subramo}`:""}\n📅 *Vencimiento:* ${p.vencimiento}\n💰 *Prima:* $${p.prima?.toLocaleString()} (${p.frecuencia})\n${p.coberturas?.length?`🛡️ *Coberturas:* ${p.coberturas.join(", ")}\n`:""}\nPara renovar contáctame 😊\n\n_Tu agente de seguros_`;
  const genEmail=(p)=>`Estimado/a ${p.cliente},\n\nLe informamos que su póliza está próxima a vencer.\n\n══════════════════════\nDATOS DE SU PÓLIZA\n══════════════════════\n• Número: ${p.numero}\n• Aseguradora: ${p.aseguradora}\n• Ramo: ${p.ramo}${p.subramo?` › ${p.subramo}`:""}\n• Vencimiento: ${p.vencimiento}\n• Prima: $${p.prima?.toLocaleString()} (${p.frecuencia})\n${p.coberturas?.length?`• Coberturas:\n  - ${p.coberturas.join("\n  - ")}\n`:""}\nContáctenos para renovar y no quedar sin cobertura.\n\nAtentamente,\nSu Agente de Seguros — SeguroCRM`;
  const getMensaje=(p)=>canal==="whatsapp"?genWA(p):genEmail(p);

  const showToast=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),3000);};
  const marcar=(id,tipo)=>{setEnviados(prev=>[...prev,{id,tipo,fecha:new Date().toLocaleString("es-MX")}]);showToast(`Notificación lista 🎉`);};
  const yaEnviado=(id,tipo)=>enviados.some(e=>e.id===id&&e.tipo===tipo);

  const enviarWA=(p)=>{const msg=encodeURIComponent(genWA(p));const tel=(p.telefonoCliente||"").replace(/\D/g,"");window.open(`https://wa.me/${tel?`52${tel}`:""}?text=${msg}`,"_blank");marcar(p.id,"whatsapp");};
  const enviarEmail=(p)=>{window.open(`mailto:${p.emailCliente}?subject=${encodeURIComponent(`Recordatorio póliza ${p.numero}`)}&body=${encodeURIComponent(genEmail(p))}`,"_blank");marcar(p.id,"email");};

  return(
    <div style={{display:"flex",flexDirection:"column",gap:22}}>
      {toast&&<div style={{position:"fixed",top:20,right:20,background:"#111827",color:"#fff",padding:"12px 20px",borderRadius:12,fontSize:13,fontWeight:600,zIndex:9999,boxShadow:"0 8px 24px rgba(0,0,0,0.3)"}}>{toast}</div>}
      <SectionTitle title="Notificaciones" sub="Envía recordatorios de pago por WhatsApp o correo"/>
      <div style={{display:"flex",gap:0,background:"#f3f4f6",borderRadius:11,padding:4,width:"fit-content"}}>
        {[["recordatorios","📅 Recordatorios"],["historial","📋 Historial"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"#fff":"none",border:"none",borderRadius:8,padding:"7px 18px",fontSize:13,fontWeight:600,cursor:"pointer",color:tab===t?"#111827":"#6b7280",boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.1)":"none",fontFamily:"inherit"}}>{l}</button>
        ))}
      </div>

      {tab==="recordatorios"&&(
        <>
          <div style={{background:"#fff",borderRadius:14,padding:20,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:8}}>CANAL</div>
              <div style={{display:"flex",gap:8}}>
                {[["whatsapp","💬 WhatsApp","#25d366","#f0fdf4","#15803d"],["email","📧 Correo","#2563eb","#eff6ff","#1d4ed8"]].map(([k,l,bc,bg,tc])=>(
                  <button key={k} onClick={()=>setCanal(k)} style={{padding:"8px 16px",borderRadius:9,border:"2px solid",borderColor:canal===k?bc:"#e5e7eb",background:canal===k?bg:"#fff",color:canal===k?tc:"#6b7280",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:6}}>DÍAS DE ANTICIPACIÓN: <strong style={{color:"#111827"}}>{diasAntes}</strong></div>
              <input type="range" min={7} max={90} step={7} value={diasAntes} onChange={e=>setDiasAntes(Number(e.target.value))} style={{width:180}}/>
            </div>
            <div style={{marginLeft:"auto",background:"#fef3c7",borderRadius:11,padding:"10px 16px"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400e"}}>POR VENCER</div>
              <div style={{fontSize:24,fontWeight:800,color:"#d97706"}}>{proximasVencer.length}</div>
            </div>
          </div>

          {proximasVencer.length===0?(
            <div style={{background:"#fff",borderRadius:14,padding:"40px 24px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
              <div style={{fontSize:36,marginBottom:8}}>✅</div>
              <div style={{fontWeight:700,color:"#111827"}}>Sin vencimientos en los próximos {diasAntes} días</div>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {proximasVencer.map(p=>{
                const dias=Math.ceil((new Date(p.vencimiento)-new Date())/(1000*60*60*24));
                return(
                  <div key={p.id} style={{background:"#fff",borderRadius:14,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,0.07)",border:`1px solid ${dias<=7?"#fecaca":dias<=15?"#fde68a":"#e5e7eb"}`}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                          <div style={{fontWeight:800,fontSize:14}}>{p.cliente}</div>
                          <div style={{background:dias<=7?"#fee2e2":dias<=15?"#fef3c7":"#dbeafe",color:dias<=7?"#991b1b":dias<=15?"#92400e":"#1e40af",padding:"2px 9px",borderRadius:20,fontSize:12,fontWeight:700}}>
                            {dias===0?"¡Hoy!":`${dias}d`}
                          </div>
                          <span style={{background:ramoColor(p.ramo)+"15",color:ramoColor(p.ramo),padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:700}}>{p.ramo}{p.subramo?` · ${p.subramo}`:""}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
                          {[["Póliza",p.numero],["Aseguradora",p.aseguradora],["Prima",`$${p.prima?.toLocaleString()} ${p.frecuencia}`],["Vencimiento",p.vencimiento],["Email",p.emailCliente||"—"]].map(([l,v])=>(
                            <div key={l}><div style={{fontSize:10,color:"#9ca3af",fontWeight:700}}>{l}</div><div style={{fontSize:12,fontWeight:600}}>{v}</div></div>
                          ))}
                        </div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:7,flexShrink:0}}>
                        <button onClick={()=>setPreviewPoliza(previewPoliza?.id===p.id?null:p)} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                          <Icon name="eye" size={13}/> Preview
                        </button>
                        <button onClick={()=>{navigator.clipboard.writeText(getMensaje(p));showToast("Copiado ✓");}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",background:"#fff",color:"#374151",fontWeight:600,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                          <Icon name="copy" size={13}/> Copiar
                        </button>
                        <button onClick={()=>enviarWA(p)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:8,border:"none",background:yaEnviado(p.id,"whatsapp")?"#d1fae5":"#25d366",color:yaEnviado(p.id,"whatsapp")?"#065f46":"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                          <Icon name="whatsapp" size={13}/> {yaEnviado(p.id,"whatsapp")?"WA ✓":"WhatsApp"}
                        </button>
                        <button onClick={()=>enviarEmail(p)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:8,border:"none",background:yaEnviado(p.id,"email")?"#dbeafe":"#2563eb",color:yaEnviado(p.id,"email")?"#1e40af":"#fff",fontWeight:700,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
                          <Icon name="mail" size={13}/> {yaEnviado(p.id,"email")?"Email ✓":"Email"}
                        </button>
                      </div>
                    </div>
                    {previewPoliza?.id===p.id&&(
                      <div style={{marginTop:14,background:canal==="whatsapp"?"#f0fdf4":"#eff6ff",borderRadius:10,padding:"14px 16px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:canal==="whatsapp"?"#15803d":"#1d4ed8",marginBottom:8,letterSpacing:"0.05em"}}>{canal==="whatsapp"?"📱 MENSAJE WHATSAPP":"📧 CORREO ELECTRÓNICO"}</div>
                        <pre style={{margin:0,fontSize:12,color:"#374151",whiteSpace:"pre-wrap",fontFamily:"inherit",lineHeight:1.6}}>{getMensaje(p)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab==="historial"&&(
        <div style={{background:"#fff",borderRadius:14,padding:22,boxShadow:"0 1px 6px rgba(0,0,0,0.07)"}}>
          <h3 style={{margin:"0 0 16px",fontSize:14,fontWeight:700}}>Historial de envíos</h3>
          {enviados.length===0?<div style={{textAlign:"center",padding:"24px",color:"#9ca3af",fontSize:13}}>Sin envíos en esta sesión</div>:(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:"#f9fafb"}}>{["Póliza — Cliente","Canal","Fecha"].map(h=><th key={h} style={{padding:"10px 13px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280"}}>{h}</th>)}</tr></thead>
              <tbody>{enviados.map((e,i)=>{const p=polizas.find(x=>x.id===e.id);return(
                <tr key={i} style={{borderTop:"1px solid #f3f4f6"}}>
                  <td style={{padding:"11px 13px",fontSize:13}}>{p?.numero} — {p?.cliente}</td>
                  <td style={{padding:"11px 13px"}}>{e.tipo==="whatsapp"?<span style={{color:"#15803d",fontWeight:700,fontSize:13}}>💬 WhatsApp</span>:<span style={{color:"#1d4ed8",fontWeight:700,fontSize:13}}>📧 Email</span>}</td>
                  <td style={{padding:"11px 13px",fontSize:12,color:"#6b7280"}}>{e.fecha}</td>
                </tr>
              );})}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PAI
// ═══════════════════════════════════════════════════════════════════
function PAI({ paiMetas, setPaiMetas }) {
  const [showModal,setShowModal]=useState(false);
  const [showAlerta,setShowAlerta]=useState(false);
  const [alertaTexto,setAlertaTexto]=useState("");
  const [loadingAlerta,setLoadingAlerta]=useState(false);
  const [form,setForm]=useState({ramo:"Vida",periodo:"",metaBono:"",fechaInicio:"",fechaFin:"",cobrado:""});

  const ramos=Object.keys(RAMOS_SUBRAMOS);
  const ramoGrad={Vida:["#7c3aed","#a78bfa"],"Gastos Médicos":["#059669","#34d399"],Autos:["#1d4ed8","#60a5fa"],Daños:["#d97706","#fbbf24"]};
  const totalMeta=paiMetas.reduce((a,m)=>a+m.metaBono,0);
  const totalCobrado=paiMetas.reduce((a,m)=>a+m.cobrado,0);
  const pctGlobal=Math.round((totalCobrado/totalMeta)*100)||0;

  const guardar=()=>{if(!form.metaBono)return;setPaiMetas(prev=>[...prev,{...form,id:Date.now(),metaBono:Number(form.metaBono),cobrado:Number(form.cobrado)||0,activa:true}]);setShowModal(false);setForm({ramo:"Vida",periodo:"",metaBono:"",fechaInicio:"",fechaFin:"",cobrado:""});};
  const actualizarCobrado=(id,v)=>setPaiMetas(prev=>prev.map(m=>m.id===id?{...m,cobrado:Number(v)}:m));
  const getEstado=(pct)=>pct>=80?{label:"🟢 En camino",color:"#059669"}:pct>=50?{label:"🟡 En proceso",color:"#d97706"}:{label:"🔴 Atención",color:"#dc2626"};

  const generarAlertaIA=async()=>{
    setShowAlerta(true);setLoadingAlerta(true);setAlertaTexto("");
    try{
      const resumen=paiMetas.map(m=>`Ramo ${m.ramo}: meta $${m.metaBono.toLocaleString()}, cobrado $${m.cobrado.toLocaleString()} (${Math.round(m.cobrado/m.metaBono*100)}%), falta $${(m.metaBono-m.cobrado).toLocaleString()}. Periodo: ${m.periodo}.`).join("\n");
      const res=await fetch("/api/anthropic",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:`Eres asistente de un agente de seguros en México. Genera un reporte semanal PAI basado en:\n\n${resumen}\n\nIncluye: saludo motivacional, avance global, ramos en riesgo, 3 acciones concretas esta semana y frase de cierre. Español, máximo 260 palabras, emojis con moderación.`}]})});
      const data=await res.json();
      setAlertaTexto(data.content.map(b=>b.text||"").join(""));
    }catch{setAlertaTexto("No se pudo conectar. Verifica tu conexión.");}
    setLoadingAlerta(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <SectionTitle title="PAI — Plan de Acción Individual" sub="Metas de bono por ramo · Seguimiento semanal con IA"/>
        <div style={{display:"flex",gap:10}}>
          <Btn onClick={generarAlertaIA} color="#7c3aed" icon="spark">Alerta Semanal IA</Btn>
          <Btn onClick={()=>setShowModal(true)} color="#059669" icon="plus">Nueva Meta</Btn>
        </div>
      </div>

      {/* KPI global oscuro */}
      <div style={{background:"linear-gradient(135deg,#0f172a,#1e3a5f)",borderRadius:18,padding:"24px 28px",display:"flex",alignItems:"center",gap:28}}>
        <div style={{flex:1}}>
          <div style={{fontSize:10,color:"#60a5fa",fontWeight:700,letterSpacing:"0.1em",marginBottom:4}}>PROGRESO GLOBAL DE BONO</div>
          <div style={{fontSize:40,fontWeight:900,fontFamily:"'Playfair Display',serif",color:pctGlobal>=80?"#4ade80":pctGlobal>=50?"#fbbf24":"#f87171",lineHeight:1}}>{pctGlobal}%</div>
          <div style={{color:"#94a3b8",fontSize:13,marginTop:4}}>${totalCobrado.toLocaleString()} cobrado de ${totalMeta.toLocaleString()}</div>
          <div style={{marginTop:12}}><ProgressBar value={totalCobrado} max={totalMeta} color={pctGlobal>=80?"#4ade80":pctGlobal>=50?"#fbbf24":"#f87171"} height={10}/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {[["Meta Total",`$${totalMeta.toLocaleString()}`],["Cobrado",`$${totalCobrado.toLocaleString()}`],["Faltante",`$${(totalMeta-totalCobrado).toLocaleString()}`],["Ramos",paiMetas.length]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 14px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>{l.toUpperCase()}</div>
              <div style={{fontSize:17,fontWeight:800,color:"#e2e8f0"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tarjetas por ramo */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:15}}>
        {paiMetas.map(m=>{
          const pct=Math.round((m.cobrado/m.metaBono)*100)||0;
          const faltante=m.metaBono-m.cobrado;
          const estado=getEstado(pct);
          const [c1,c2]=ramoGrad[m.ramo]||["#6b7280","#9ca3af"];
          return(
            <div key={m.id} style={{background:"#fff",borderRadius:17,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,0.08)"}}>
              <div style={{background:`linear-gradient(135deg,${c1},${c2})`,padding:"16px 18px",color:"#fff"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:10,opacity:.8,fontWeight:700,letterSpacing:"0.08em"}}>{m.periodo}</div>
                    <div style={{fontSize:20,fontWeight:900,fontFamily:"'Playfair Display',serif"}}>{m.ramo}</div>
                  </div>
                  <div style={{fontSize:30,fontWeight:900,fontFamily:"'Playfair Display',serif",opacity:.9}}>{pct}%</div>
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
              </div>
            </div>
          );
        })}
      </div>

      {showModal&&(
        <Modal title="Nueva Meta PAI" onClose={()=>setShowModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <div style={{background:"#eff6ff",borderRadius:9,padding:"10px 13px",fontSize:12,color:"#1e40af"}}>🎯 Define tu meta de bono. La IA analizará el avance semanalmente.</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Sel label="Ramo *" value={form.ramo} onChange={e=>setForm(p=>({...p,ramo:e.target.value}))}>
                {ramos.map(r=><option key={r}>{r}</option>)}
              </Sel>
              <Inp label="Período (ej. Q2 2025)" value={form.periodo} onChange={e=>setForm(p=>({...p,periodo:e.target.value}))} placeholder="Q2 2025"/>
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
                {paiMetas.map(m=><span key={m.id} style={{background:"rgba(255,255,255,.1)",color:"#e2e8f0",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{m.ramo}: {Math.round(m.cobrado/m.metaBono*100)}%</span>)}
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
function Pipeline({ pipeline, setPipeline }) {
  const etapas=["Contacto","Cotización","Propuesta","Negociación","Cierre"];
  const colors={Contacto:"#6b7280",Cotización:"#2563eb",Propuesta:"#7c3aed",Negociación:"#d97706",Cierre:"#059669"};
  const [showModal,setShowModal]=useState(false);
  const [form,setForm]=useState({cliente:"",tipo:"",valor:"",etapa:"Contacto",probabilidad:20,seguimiento:""});
  const total=pipeline.reduce((a,p)=>a+(p.valor*p.probabilidad/100),0);
  const guardar=()=>{if(!form.cliente)return;setPipeline(prev=>[...prev,{...form,id:Date.now(),valor:Number(form.valor),probabilidad:Number(form.probabilidad)}]);setShowModal(false);setForm({cliente:"",tipo:"",valor:"",etapa:"Contacto",probabilidad:20,seguimiento:""});};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <SectionTitle title="Pipeline de Ventas" sub={`Potencial ponderado: $${total.toLocaleString("es-MX",{maximumFractionDigits:0})}`}/>
        <Btn onClick={()=>setShowModal(true)} color="#7c3aed" icon="plus">Nueva Oportunidad</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:11}}>
        {etapas.map(etapa=>{const items=pipeline.filter(p=>p.etapa===etapa);return(
          <div key={etapa} style={{background:"#f9fafb",borderRadius:13,padding:12,minHeight:260}}>
            <div style={{marginBottom:9}}><div style={{fontSize:9,fontWeight:800,color:colors[etapa],letterSpacing:"0.08em"}}>{etapa.toUpperCase()}</div><div style={{fontSize:11,color:"#9ca3af"}}>{items.length}</div></div>
            {items.map(item=>(
              <div key={item.id} style={{background:"#fff",borderRadius:9,padding:"9px 11px",boxShadow:"0 1px 3px rgba(0,0,0,.05)",borderLeft:`3px solid ${colors[etapa]}`,marginBottom:7}}>
                <div style={{fontSize:12,fontWeight:700}}>{item.cliente}</div>
                <div style={{fontSize:11,color:"#6b7280"}}>{item.tipo}</div>
                <div style={{fontSize:13,fontWeight:800,color:colors[etapa],margin:"3px 0"}}>${item.valor.toLocaleString()}</div>
                <div style={{height:3,background:"#e5e7eb",borderRadius:2}}><div style={{height:"100%",width:`${item.probabilidad}%`,background:colors[etapa],borderRadius:2}}/></div>
                <div style={{fontSize:10,color:"#9ca3af",marginTop:3}}>{item.probabilidad}%</div>
              </div>
            ))}
          </div>
        );})}
      </div>
      {showModal&&(<Modal title="Nueva Oportunidad" onClose={()=>setShowModal(false)}><div style={{display:"flex",flexDirection:"column",gap:12}}><Inp label="Prospecto *" value={form.cliente} onChange={e=>setForm(p=>({...p,cliente:e.target.value}))}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}><Inp label="Tipo de seguro" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))}/><Inp label="Prima ($)" type="number" value={form.valor} onChange={e=>setForm(p=>({...p,valor:e.target.value}))}/></div><Sel label="Etapa" value={form.etapa} onChange={e=>setForm(p=>({...p,etapa:e.target.value}))}>{etapas.map(e=><option key={e}>{e}</option>)}</Sel><div><label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:5}}>Probabilidad: {form.probabilidad}%</label><input type="range" min={0} max={100} step={5} value={form.probabilidad} onChange={e=>setForm(p=>({...p,probabilidad:Number(e.target.value)}))} style={{width:"100%"}}/></div><Inp label="Fecha seguimiento" type="date" value={form.seguimiento} onChange={e=>setForm(p=>({...p,seguimiento:e.target.value}))}/><Btn onClick={guardar} color="#7c3aed" style={{width:"100%",justifyContent:"center"}}>Agregar</Btn></div></Modal>)}
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
  const [form,setForm]=useState({nombre:"",email:"",telefono:"",rol:"agente",status:"activo"});
  const rolColor={admin:"#7c3aed",agente:"#2563eb",asistente:"#6b7280"};
  const guardar=()=>{if(!form.nombre)return;const clave="AGT-"+String(usuarios.length+1).padStart(3,"0");setUsuarios(prev=>[...prev,{...form,id:Date.now(),clave,polizasAsignadas:0}]);setShowModal(false);setForm({nombre:"",email:"",telefono:"",rol:"agente",status:"activo"});};
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><SectionTitle title="Usuarios del Sistema" sub={`${usuarios.length} usuarios registrados`}/><Btn onClick={()=>setShowModal(true)} color="#7c3aed" icon="plus">Nuevo Usuario</Btn></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:14}}>
        {usuarios.map(u=>(<div key={u.id} style={{background:"#fff",borderRadius:15,padding:18,boxShadow:"0 1px 6px rgba(0,0,0,.07)",borderTop:`3px solid ${rolColor[u.rol]||"#6b7280"}`}}><div style={{display:"flex",alignItems:"center",gap:11,marginBottom:13}}><div style={{width:42,height:42,borderRadius:"50%",background:`linear-gradient(135deg,${rolColor[u.rol]||"#6b7280"},${rolColor[u.rol]||"#6b7280"}88)`,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0}}>{u.nombre.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{u.nombre}</div><div style={{fontSize:12,color:"#6b7280"}}>{u.email}</div></div><span style={{background:(rolColor[u.rol]||"#6b7280")+"18",color:rolColor[u.rol]||"#6b7280",padding:"3px 9px",borderRadius:20,fontSize:12,fontWeight:700}}>{u.rol}</span></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,fontSize:12}}><div style={{background:"#f9fafb",borderRadius:8,padding:"7px 9px"}}><div style={{color:"#9ca3af",fontSize:10}}>Clave</div><div style={{fontWeight:700,fontFamily:"monospace"}}>{u.clave}</div></div><div style={{background:"#f9fafb",borderRadius:8,padding:"7px 9px"}}><div style={{color:"#9ca3af",fontSize:10}}>Pólizas</div><div style={{fontWeight:700}}>{u.polizasAsignadas}</div></div></div></div>))}
      </div>
      {showModal&&(<Modal title="Nuevo Usuario" onClose={()=>setShowModal(false)}><div style={{display:"flex",flexDirection:"column",gap:12}}><Inp label="Nombre *" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}/><Inp label="Email *" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/><Inp label="Teléfono" value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:11}}><Sel label="Rol" value={form.rol} onChange={e=>setForm(p=>({...p,rol:e.target.value}))}><option value="admin">Administrador</option><option value="agente">Agente</option><option value="asistente">Asistente</option></Sel><Sel label="Estado" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></Sel></div><Btn onClick={guardar} color="#7c3aed" style={{width:"100%",justifyContent:"center"}}>Crear</Btn></div></Modal>)}
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
function ModalPago({ poliza, onGuardar, onClose }) {
  const [form, setForm] = useState({
    fechaPago: new Date().toISOString().slice(0,10),
    formaPago: poliza.formaPago||"Transferencia",
    monto: poliza.primaTotal||poliza.prima||"",
    referencia: "",
    comprobante: null,
    comprobanteName: "",
  });
  const fileRef = useRef();

  const leerComprobante = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = (e) => setForm(p=>({...p,comprobante:e.target.result,comprobanteName:file.name}));
    r.readAsDataURL(file);
  };

  const guardar = () => {
    onGuardar({id:Date.now(),...form,polizaNumero:poliza.numero,fechaRegistro:new Date().toISOString().slice(0,10)});
    onClose();
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#065f46"}}>
        <strong>{poliza.cliente}</strong> · {poliza.aseguradora} · {poliza.ramo}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>
          <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fecha de Pago *</label>
          <input type="date" value={form.fechaPago} onChange={e=>setForm(p=>({...p,fechaPago:e.target.value}))}
            style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
        </div>
        <Sel label="Forma de Pago *" value={form.formaPago} onChange={e=>setForm(p=>({...p,formaPago:e.target.value}))}>
          {["Transferencia","Depósito bancario","Tarjeta crédito","Tarjeta débito","Cheque","Efectivo","OXXO","Domiciliación"].map(f=><option key={f}>{f}</option>)}
        </Sel>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Inp label="Monto ($)" type="number" value={form.monto} onChange={e=>setForm(p=>({...p,monto:e.target.value}))} placeholder="0.00"/>
        <Inp label="Referencia / Folio" value={form.referencia} onChange={e=>setForm(p=>({...p,referencia:e.target.value}))} placeholder="Núm. operación"/>
      </div>
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
      <Btn onClick={guardar} color="#059669" icon="check" style={{width:"100%",justifyContent:"center"}}>Registrar Pago</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MODAL RENOVAR PÓLIZA
// ═══════════════════════════════════════════════════════════════════
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
function Calendario({ polizas, clientes }) {
  const [mes, setMes] = useState(new Date().getMonth());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtro, setFiltro] = useState("todos");
  const [diaSelec, setDiaSelec] = useState(null);

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  const prevMes = () => { if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1); };
  const nextMes = () => { if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1); };

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

      {/* Contadores */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        {[["📋",vencenMes,"Vencen este mes","#dc2626"],["⚠️",porVencer,"Por vencer ≤10 días","#d97706"],["🎂",cumplesMes,"Cumpleaños este mes","#7c3aed"]].map(([ic,n,l,c])=>(
          <div key={l} style={{background:"#fff",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <span style={{fontSize:26}}>{ic}</span>
            <div>
              <div style={{fontSize:28,fontWeight:900,color:c,fontFamily:"'Playfair Display',serif",lineHeight:1}}>{n}</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{l}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
        {/* Calendario */}
        <div style={{flex:1,background:"#fff",borderRadius:16,padding:"20px",boxShadow:"0 1px 8px rgba(0,0,0,.07)"}}>
          {/* Navegación mes */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <button onClick={prevMes} style={{background:"#f3f4f6",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>‹</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontWeight:900,fontSize:19,color:"#0f172a",fontFamily:"'Playfair Display',serif"}}>{MESES[mes]}</div>
              <div style={{fontSize:12,color:"#9ca3af",fontWeight:600}}>{anio}</div>
            </div>
            <button onClick={nextMes} style={{background:"#f3f4f6",border:"none",borderRadius:8,width:34,height:34,cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit"}}>›</button>
          </div>

          {/* Filtros */}
          <div style={{display:"flex",gap:6,marginBottom:14,justifyContent:"center"}}>
            {[["todos","Todos"],["polizas","🛡 Pólizas"],["cumpleanos","🎂 Cumpleaños"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFiltro(v)}
                style={{padding:"5px 13px",background:filtro===v?"#0f172a":"#f8fafc",color:filtro===v?"#fff":"#374151",
                  border:`1.5px solid ${filtro===v?"#0f172a":"#e5e7eb"}`,borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {l}
              </button>
            ))}
          </div>

          {/* Encabezado días */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:3}}>
            {DIAS_SEMANA.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:800,color:"#9ca3af",padding:"3px 0"}}>{d}</div>)}
          </div>

          {/* Celdas */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
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
              return (
                <div key={i} onClick={()=>valido&&setDiaSelec(diaSelec===dia?null:dia)}
                  style={{minHeight:62,borderRadius:9,padding:"4px 5px",cursor:valido?"pointer":"default",
                    background:!valido?"transparent":hoyF?"#0f172a":selec?"#e0e7ff":hayVenc?"#fef2f2":hayPorVenc?"#fffbeb":hayCumple?"#faf5ff":"#f9fafb",
                    border:hoyF?"2px solid #3b82f6":selec?"2px solid #6366f1":hayVenc?"1.5px solid #fca5a5":hayPorVenc?"1.5px solid #fbbf24":hayCumple?"1.5px solid #c4b5fd":hayInicio?"1.5px solid #93c5fd":"1.5px solid transparent",
                    transition:"all .1s"}}>
                  {valido&&(
                    <>
                      <div style={{fontSize:11,fontWeight:hoyF?900:600,color:hoyF?"#fff":"#374151",marginBottom:2}}>{dia}</div>
                      {evs.slice(0,2).map((ev,ei)=>(
                        <div key={ei} title={`${ev.label} — ${ev.sub}`}
                          style={{fontSize:8,fontWeight:700,color:"#fff",background:ev.color,borderRadius:3,padding:"1px 3px",marginBottom:1,
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {ev.icon} {ev.label}
                        </div>
                      ))}
                      {evs.length>2&&<div style={{fontSize:8,color:"#9ca3af",textAlign:"right"}}>+{evs.length-2}</div>}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap",justifyContent:"center"}}>
            {[["#2563eb","Inicio"],["#059669","Vigente"],["#d97706","Por vencer"],["#dc2626","Vencida"],["#7c3aed","Cumpleaños"]].map(([c,l])=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#374151"}}>
                <div style={{width:9,height:9,borderRadius:2,background:c}}/>{l}
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div style={{width:290,flexShrink:0,display:"flex",flexDirection:"column",gap:10}}>

          {/* Detalle día seleccionado */}
          {diaSelec&&evsDiaSelec.length>0&&(
            <div style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)"}}>
              <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10}}>
                📅 {MESES[mes]} {diaSelec}, {anio}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {evsDiaSelec.map((ev,i)=>(
                  <div key={i} style={{background:"#f9fafb",borderRadius:9,padding:"9px 11px",borderLeft:`3px solid ${ev.color}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                      <span style={{fontSize:14}}>{ev.icon}</span>
                      <span style={{fontSize:11,fontWeight:800,color:"#111827"}}>{ev.label}</span>
                      <span style={{marginLeft:"auto",background:ev.color+"22",color:ev.color,fontSize:8,fontWeight:800,padding:"2px 7px",borderRadius:10}}>
                        {ev.tipo==="cumpleanos"?"CUMPLE":ev.tipo==="vencimiento"?"VENCE":"INICIA"}
                      </span>
                    </div>
                    {ev.sub&&<div style={{fontSize:10,color:"#6b7280"}}>{ev.sub}</div>}
                    {ev.tipo==="cumpleanos"&&(
                      <div style={{marginTop:6}}>
                        <button style={{background:"#25d366",color:"#fff",border:"none",borderRadius:7,padding:"4px 10px",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}
                          onClick={()=>window.open(`https://wa.me/?text=${encodeURIComponent(`🎂 ¡Feliz cumpleaños ${ev.label}! Que tengas un excelente día. — Tu Agente de Seguros`)}`)}>
                          💬 WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Todos los eventos del mes */}
          <div style={{background:"#fff",borderRadius:14,padding:"14px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.06)"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#374151",marginBottom:10,letterSpacing:"0.05em"}}>
              EVENTOS — {MESES[mes].toUpperCase()}
            </div>
            {eventosFlat.length===0?(
              <div style={{textAlign:"center",color:"#9ca3af",fontSize:12,padding:"16px 0"}}>Sin eventos este mes</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:420,overflowY:"auto"}}>
                {eventosFlat.map((ev,i)=>(
                  <div key={i} onClick={()=>setDiaSelec(ev.dia)}
                    style={{display:"flex",gap:8,alignItems:"center",padding:"7px 9px",background:diaSelec===ev.dia?"#f0f0ff":"#f9fafb",borderRadius:9,
                      borderLeft:`3px solid ${ev.color}`,cursor:"pointer",transition:"background .1s"}}>
                    <div style={{fontSize:13,flexShrink:0}}>{ev.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#111827"}}>{MESES[mes].slice(0,3)} {ev.dia} — {ev.label}</div>
                      {ev.sub&&<div style={{fontSize:9,color:"#9ca3af",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.sub}</div>}
                    </div>
                    <span style={{background:ev.color+"22",color:ev.color,fontSize:8,fontWeight:800,padding:"2px 6px",borderRadius:8,flexShrink:0}}>
                      {ev.tipo==="cumpleanos"?"🎂":ev.tipo==="vencimiento"?"📋":"🟢"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// SUBAGENTES
// ═══════════════════════════════════════════════════════════════════
function Subagentes({ subagentes, setSubagentes, polizas, setPolizas }) {
  const [tab, setTab] = useState("directorio"); // directorio | comisiones | reporte
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showComision, setShowComision] = useState(null); // póliza seleccionada para registrar pago
  const FORM_INIT = { nombre:"", apellidoPaterno:"", apellidoMaterno:"", email:"", telefono:"", whatsapp:"", activo:true, notas:"" };
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
      {showComision&&(()=>{
        const sa = subagentes.find(s=>s.id===showComision.subagenteId);
        const {bruta,isr,neta} = calcComision(showComision);
        const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
        return (
          <Modal title="Registrar Pago de Comisión" onClose={()=>setShowComision(null)}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:"#faf5ff",borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:11,color:"#9ca3af",fontWeight:700,marginBottom:4}}>SUBAGENTE</div>
                <div style={{fontSize:14,fontWeight:800,color:"#5b21b6"}}>{sa?`${sa.nombre} ${sa.apellidoPaterno}`:""}</div>
                <div style={{fontSize:12,color:"#7c3aed",marginTop:2}}>Póliza: {showComision.numero} · {showComision.cliente}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                {[["Com. Bruta",fmtMXN(bruta),"#374151"],["ISR (10%)","-"+fmtMXN(isr),"#dc2626"],["Com. Neta",fmtMXN(neta),"#059669"]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:"#f9fafb",borderRadius:9,padding:"10px"}}>
                    <div style={{fontSize:15,fontWeight:900,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</div>
                    <div style={{fontSize:9,color:"#9ca3af",fontWeight:700}}>{l}</div>
                  </div>
                ))}
              </div>
              {!showComision.comisionPagada ? (
                <>
                  <div>
                    <label style={{fontSize:12,fontWeight:700,color:"#374151",display:"block",marginBottom:5}}>Fecha de pago *</label>
                    <input type="date" value={fecha} onChange={e=>setFecha(e.target.value)}
                      style={{border:"1.5px solid #e5e7eb",borderRadius:9,padding:"8px 12px",fontSize:13,outline:"none",fontFamily:"inherit",width:"100%",boxSizing:"border-box"}}/>
                  </div>
                  <Btn onClick={()=>{
                    setPolizas(prev => prev.map(p =>
                      p.id===showComision.id
                        ? {...p, comisionPagada:true, fechaPagoComision:fecha}
                        : p
                    ));
                    setShowComision(null);
                  }} color="#059669" icon="check" style={{width:"100%",justifyContent:"center"}}>
                    ✓ Confirmar pago de {fmtMXN(neta)}
                  </Btn>
                </>
              ) : (
                <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:4}}>✅</div>
                  <div style={{fontWeight:700,color:"#059669"}}>Comisión ya registrada como pagada</div>
                  {showComision.fechaPagoComision&&<div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Fecha: {showComision.fechaPagoComision}</div>}
                </div>
              )}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════
export default function CRMSeguros() {
  const [vista,setVista]=useState("dashboard");
  const [clientes,setClientes]=useState(CLIENTES_INIT);
  const [polizas,setPolizas]=useState(POLIZAS_INIT);
  const [pipeline,setPipeline]=useState(PIPELINE_INIT);
  const [tareas,setTareas]=useState(TAREAS_INIT);
  const [usuarios,setUsuarios]=useState(USUARIOS_INIT);
  const [paiMetas,setPaiMetas]=useState(PAI_METAS_INIT);
  const [subagentes,setSubagentes]=useState(SUBAGENTES_INIT);

  const nav=[
    {id:"dashboard",label:"Dashboard",icon:"dashboard"},
    {id:"clientes",label:"Clientes",icon:"clients"},
    {id:"polizas",label:"Pólizas",icon:"policies",badge:"IA"},
    {id:"calendario",label:"Calendario",icon:"tasks",badge:"NEW"},
    {id:"notificaciones",label:"Notificaciones",icon:"bell"},
    {id:"pai",label:"PAI",icon:"trophy"},
    {id:"pipeline",label:"Pipeline",icon:"pipeline"},
    {id:"importar",label:"Importar BD",icon:"scan"},
    {id:"subagentes",label:"Subagentes",icon:"users",badge:"NEW"},
    {id:"usuarios",label:"Usuarios",icon:"users"},
  ];
  const badgeColors={IA:"#2563eb",NEW:"#dc2626"};

  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#f1f5f9"}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet"/>

      {/* Sidebar */}
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
        </nav>
        <div style={{padding:"12px 16px",borderTop:"1px solid #1e293b"}}>
          <div style={{display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:11}}>AG</div>
            <div><div style={{color:"#e2e8f0",fontSize:12,fontWeight:600}}>Agente García</div><div style={{color:"#475569",fontSize:10}}>Administrador</div></div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>
        {vista==="dashboard"&&<Dashboard clientes={clientes} polizas={polizas} pipeline={pipeline} tareas={tareas} paiMetas={paiMetas}/>}
        {vista==="clientes"&&<Clientes clientes={clientes} setClientes={setClientes}/>}
        {vista==="polizas"&&<Polizas polizas={polizas} setPolizas={setPolizas} clientes={clientes} subagentes={subagentes} setSubagentes={setSubagentes}/>}
        {vista==="notificaciones"&&<Notificaciones polizas={polizas}/>}
        {vista==="pai"&&<PAI paiMetas={paiMetas} setPaiMetas={setPaiMetas}/>}
        {vista==="pipeline"&&<Pipeline pipeline={pipeline} setPipeline={setPipeline}/>}
        {vista==="tareas"&&<Tareas tareas={tareas} setTareas={setTareas}/>}
        {vista==="calendario"&&<Calendario polizas={polizas} clientes={clientes}/>
        }
        {vista==="importar"&&<Importador clientes={clientes} setClientes={setClientes} polizas={polizas} setPolizas={setPolizas}/>}
        {vista==="subagentes"&&<Subagentes subagentes={subagentes} setSubagentes={setSubagentes} polizas={polizas} setPolizas={setPolizas}/>}
        {vista==="usuarios"&&<Usuarios usuarios={usuarios} setUsuarios={setUsuarios}/>}
      </div>
    </div>
  );
}
