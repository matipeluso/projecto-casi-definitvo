const normalize = (texto = "") =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeSubdimensionText = (texto = "") => normalize(texto);

export const normalizeSubdimensionSlug = (texto = "") =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const SECTION_DEFINITIONS = [
  {
    slug: "habilidades-comunicativas",
    items: [
      "Se comunica e interactúa con los demás de manera espontánea.",
      "Se comunica e interactúa con los demás de manera guiada.",
      "Participa en conversaciones con sus pares y/o adultos de forma espontánea.",
      "La pronunciación, orden y estructura gramatical de sus expresiones verbales/en lengua de señas favorecen la comprensión del mensaje.",
      "Utiliza oraciones completas en intervenciones orales/en lengua de señas.",
      "Relata en forma secuenciada y clara experiencias personales.",
      "Realiza y cumple instrucciones entregadas oralmente/en lengua de señas.",
      "Ajusta su lenguaje a diversos contextos e interlocutores.",
      "Su expresión oral es rítmica y con una melodía; su expresión manual es rítmica, con fluidez de señalización, y coherente con la expresión facial y corporal (prosodia).",
      "Utiliza palabras/señas y conceptos rebuscados.",
      "El volumen de su voz/claridad en la señalización, se ajusta a las diversas situaciones y/o contextos.",
      "Conoce y usa un vocabulario amplio.",
      "Comunica sensaciones, experiencias, emociones, necesidades e ideas a través del lenguaje oral/lengua de señas.",
      "Repite frecuentemente palabras/señas u oraciones (ecolalia).",
    ],
  },
  {
    slug: "habilidades-sociales-afectividad",
    items: [
      "Expresa verbal y/o corporalmente distintas emociones y sentimientos.",
      "Comparte con sus compañeros trabajo y/o actividades recreativas.",
      "Se relaciona afectivamente con los adultos de su medio.",
      "Se expresa con seguridad y confianza.",
      "Expresa sus sentimientos y emociones de acuerdo a la situación y contexto.",
      "Espera su turno en actividades grupales.",
      "Distingue que los comportamientos pueden producir consecuencias positivas o negativas.",
      "Expresa y reconoce distintas emociones y sentimientos en sí mismo y en los otros.",
      "Ajusta su actividad motriz a las exigencias del contexto y situación.",
      "Ante una dificultad o impedimento busca alternativas de solución.",
      "Inicia actividades de trabajo y/o recreativas.",
      "Utiliza diversos recursos para comunicarse e interactuar con su medio.",
      "Se muestra activo e interesado por su entorno.",
      "Solicita ayuda cuando la requiere.",
      "Acepta críticas y aportes en sus trabajos.",
    ],
  },
  {
    slug: "motricidad-cuidado-personal",
    items: [
      "Se desplaza con coordinación y equilibrio.",
      "Combina diferentes movimientos y posturas al desplazarse.",
      "Corre con fluidez, variando la velocidad, la dirección y el tipo de desplazamiento.",
      "En actividades motrices, mantiene la coordinación y control dinámico de su cuerpo.",
      "Ejecuta movimientos de manipulación que requieren control muscular fino.",
      "Efectúa trabajos grafo-motores con precisión y seguridad en los trazos.",
      "Manipula objetos y herramientas con precisión.",
      "Realiza ejercicios que requieren esfuerzo físico sostenido.",
      "Realiza en forma autónoma prácticas de autocuidado e higiene corporal.",
      "Cuida y guarda sus pertenencias.",
      "Manifiesta iniciativa en el cuidado y bienestar personal.",
      "Identifica situaciones u objetos que son riesgosos para su seguridad.",
      "Presenta automatismos o movimientos reiterativos como balanceo, movimientos de manos, etc.",
    ],
  },
  {
    slug: "aproximacion-aprendizaje",
    items: [
      "Muestra preferencias e intereses diversos.",
      "Se muestra activo e interesado por su entorno.",
      "Se concentra en las actividades y acciones de la clase.",
      "Mantiene atención sostenida al trabajar solo.",
      "Mantiene atención sostenida al trabajar con otros.",
      "Persiste en los trabajos y tareas hasta concluirlos.",
      "Concluye los trabajos de forma ordenada. Es sistemático en la realización de su trabajo.",
      "A partir de las instrucciones desarrolla su trabajo de manera autónoma.",
      "Prefiere trabajar solo/a.",
      "Trabaja mejor en colaboración con otros/as.",
      "Le gusta resolver problemas.",
      "Emprende con entusiasmo tareas nuevas.",
      "Le gusta la experimentación.",
      "Es competitivo/a.",
      "Es creativo/a.",
    ],
  },
  {
    slug: "habilidades-cognitivas",
    items: [
      "Incorpora espontáneamente información relevante del medio (atención y memoria instrumental).",
      "Memoriza información utilizando medios auxiliares.",
      "Retiene y reproduce información.",
      "Distingue lo esencial de lo accesorio.",
      "Descompone un todo en sus partes (análisis).",
      "Construye una totalidad a partir de sus elementos (síntesis).",
      "Realiza una actividad que contiene diversos pasos.",
      "Anticipa consecuencias de una situación o fenómeno (razonamiento lógico).",
      "Transfiere o generaliza lo aprendido a otras situaciones.",
      "Se adapta a imprevistos o a nuevas rutinas de trabajo.",
      "Busca estrategias para resolver problemas de la vida diaria.",
      "Relaciona en base a características instrumentales (de uso) o situacionales de los objetos.",
      "Distingue rasgos o nexos esenciales comunes en objetos o fenómenos (abstracción).",
      "Explica (comprende) el significado de una metáfora.",
    ],
  },
  {
    slug: "capacidades-sensoperceptivas",
    items: [
      "Responde cuando se le habla con volumen de voz natural.",
      "Repite las rimas, canciones, refranes, dichos que se le enseñan.",
      "Responde a mensajes orales simples.",
      "Identifica y localiza la fuente de sonido en el medio ambiente.",
      "En conversaciones grupales espontáneas, mira o atiende hacia la persona que habla.",
      "Se expresa a través de actividades musicales.",
      "Se expresa a través de actividades plásticas.",
      "En actividades que requieren del uso de lectura y escritura necesita acercarse a los textos o al pizarrón.",
      "Se desplaza evitando obstáculos presentes en el trayecto.",
      "Distingue imágenes, textos, colores.",
      "Responde a gestos o señas comunicativas de otros.",
    ],
  },
  {
    slug: "lectura-escritura",
    items: [
      "Reconoce y diferencia diferentes tipos de textos.",
      "Describe lugares, hechos, personas o personajes de textos leídos.",
      "Extrae información de los textos leídos.",
      "Expresa su opinión sobre los textos leídos.",
      "Lee diversos tipos de textos sugeridos.",
      "Reconoce la correspondencia entre los sonidos y las letras.",
      "Identifica palabras a primera vista a partir de sus características gráficas.",
      "Identifica y reconoce las letras del alfabeto.",
      "Reproduce las letras del alfabeto.",
      "Da forma a las letras y las liga para construir palabras en sus textos escritos.",
      "Segmenta palabras y oraciones.",
      "Escribe textos siguiendo una secuencia.",
      "Produce textos con diferentes propósitos.",
    ],
  },
  {
    slug: "matematicas",
    items: [
      "Ordena objetos de menor a mayor y viceversa.",
      "Agrupa y clasifica objetos.",
      "Asocia los símbolos numéricos a una cantidad.",
      "Comprende que la posición de un número determina su valor.",
      "Lee y escribe números.",
      "Realiza la operación que corresponde a partir de signos matemáticos.",
      "Realiza cálculos escritos en operaciones matemáticas.",
      "Realiza cálculos mentales en operaciones matemáticas.",
      "Asocia objetos del entorno a formas geométricas.",
      "Ubica posiciones y trayectorias en el espacio considerando una ubicación concreta.",
      "Resuelve problemas matemáticos a nivel de su curso.",
    ],
  },
];

export const SUBDIMENSION_SECTIONS = SECTION_DEFINITIONS.map((section) => ({
  ...section,
  items: section.items.map((descripcion, index) => ({
    numero: index + 1,
    descripcion,
    descripcionNorm: normalize(descripcion),
  })),
}));

export const SUBDIMENSION_LOOKUP_BY_SLUG = Object.fromEntries(
  SUBDIMENSION_SECTIONS.map((section) => [section.slug, section])
);

export const SUBDIMENSION_DESCRIPTION_LOOKUP = SUBDIMENSION_SECTIONS.reduce((acc, section) => {
  section.items.forEach((item, index) => {
    acc[item.descripcionNorm] = { slug: section.slug, index };
  });
  return acc;
}, {});

export const SUBDIMENSION_COMMENT_FIELDS = [
  {
    field: "fortaleza",
    label: "Describa la mayor fortaleza del estudiante en esta área (y contexto en que se manifiesta)",
    rows: 3,
  },
  {
    field: "debilidad",
    label: "Describa la mayor debilidad del estudiante en esta área (y contexto en que se manifiesta)",
    rows: 3,
  },
  {
    field: "sintesis",
    label: "Síntesis: Señale el desempeño general del estudiante en esta área",
    rows: 2,
  },
  {
    field: "observaciones",
    label: "Observaciones (señale aspectos o antecedentes no considerados o que usted crea importante relevar o complementar)",
    rows: 3,
  },
];
