import React, { useCallback, useEffect, useRef, useState } from "react";
import { listarEstudiantes } from "../../servicios/estudiantes";
import { crearAnamnesis, actualizarAnamnesis, listarAnamnesis, descargarPdfAnamnesis } from "../../servicios/anamnesis";
import { useAuth } from "../../contexto/AuthContext";
import "./Anamnesis.css";

const INFORMANTE_SLOTS = [1, 2, 3, 4];
const ENTREVISTADOR_SLOTS = [1, 2, 3];
const PROFESIONALES = [
  "Pediatría",
  "Kinesiología",
  "Genético",
  "Fonoaudiología",
  "Neurología",
  "Psicología",
  "Psiquiatría",
  "Psicopedagogía",
  "Terapia Ocupacional",
  "Otro",
];

const EVENTOS_PRIMER_ANO = [
  "Desnutrición",
  "Obesidad",
  "Fiebre alta",
  "Convulsiones",
  "Hospitalizaciones",
  "Traumatismos",
  "Intoxicación",
  "Enfermedad respiratoria",
  "Asma",
  "Encefalitis",
  "Meningitis",
  "Otra(s)",
];

const MOTRICIDAD_GRUESA = [
  { label: "Estabilidad al caminar", name: "estabilidad_caminar" },
  { label: "Caídas frecuentes", name: "caidas_frecuentes" },
  { label: "Dominancia lateral", name: "dominancia_lateral" },
];

const MOTRICIDAD_FINA = [
  { label: "Garra", name: "garra" },
  { label: "Prensión", name: "prension" },
  { label: "Pinza", name: "pinza" },
  { label: "Ensarta", name: "ensarta" },
  { label: "Dibuja", name: "dibuja" },
  { label: "Escribe", name: "escribe" },
];

const COGNITIVOS = [
  { label: "Reacciona a voces o caras familiares", name: "voces_caras" },
  { label: "Manipula y explora objetos", name: "manipula_explora" },
  { label: "Demanda objetos y compañía", name: "demanda_objetos" },
  { label: "Comprende prohibiciones", name: "comprende_prohibiciones" },
  { label: "Sonríe, balbucea, grita, llora, indica o señala", name: "expresa_emociones" },
  { label: "Posee evidente descoordinación ojo-mano", name: "descoordinacion" },
];

const VISION_ITEMS = [
  "Se interesa por los estímulos visuales (colores, formas, movimientos, etc.)",
  "En ocasiones tiene los ojos irritados o llorosos",
  "Presenta dolores frecuentes de cabeza",
  "Se acerca o aleja demasiado los objetos a la vista (fluores o celo)",
  "Sigue con la vista el desplazamiento de los objetos o personas",
  "Presenta movimientos oculares 'anormales'",
  "Manifiesta conductas 'erróneas' (tropezones, choques)",
  "Presenta diagnóstico médico de miopía, estrabismo, astigmatismo u otro",
];

const AUDICION_ITEMS = [
  "Se interesa por los estímulos auditivos (ruidos, voces, música, etc.)",
  "No reacciona o reconoce voces o sonidos familiares",
  "Gira la cabeza cuando se le llama o ante un ruido fuerte",
  "Acerca los oídos a la TV, radio o fuente de sonido",
  "En ocasiones se tapa o golpea los oídos",
  "La pronunciación oral es adecuada",
  "Presenta diagnóstico médico de otitis crónica, hipoacusia u otra",
];

const LENGUAJE_EXPRESIVO = [
  { label: "Balbucea (oral o señas)/emite sonidos", name: "balbucea" },
  { label: "Vocaliza/realiza gestos o señas aisladas", name: "gestos_aislados" },
  { label: "Emite palabras/producen señas", name: "palabras_senas" },
  { label: "Emite/prod. frases", name: "frases" },
  { label: "Relata experiencias", name: "relata" },
  { label: "La emisión/pronunciación es clara", name: "pronunciacion" },
];

const LENGUAJE_COMPRENSIVO = [
  { label: "Identifica objetos", name: "identifica_objetos" },
  { label: "Identifica personas", name: "identifica_personas" },
  { label: "Comprende conceptos abstractos", name: "conceptos_abstractos" },
  { label: "Responde en forma coherente preguntas de la vida diaria", name: "preguntas_diarias" },
  { label: "Sigue instrucciones simples", name: "instrucciones_simples" },
  { label: "Sigue instrucciones complejas", name: "instrucciones_complejas" },
  { label: "Sigue instrucciones grupales", name: "instrucciones_grupales" },
  { label: "Comprende relatos, noticias, cuentos cortos", name: "comprende_relatos" },
];

const DESARROLLO_SOCIAL_ITEMS = [
  { label: "Se relaciona espontáneamente con las personas de su entorno natural", name: "relaciones_naturales" },
  { label: "Explica razones de sus comportamientos y actitudes", name: "explica_razones" },
  { label: "Participa en actividades grupales", name: "participa_grupal" },
  { label: "Opta por trabajo individual", name: "trabajo_individual" },
  { label: "Presenta lenguaje ecolálico", name: "lenguaje_ecolalico" },
  { label: "Exhibe dificultad para adaptarse a situaciones nuevas", name: "dificultad_adaptarse" },
];

const DESARROLLO_SOCIAL_CONTRASTE = [
  { label: "Se relaciona en forma colaborativa", name: "relacion_colaborativa" },
  { label: "Respeta normas sociales", name: "respeta_normas" },
  { label: "Respeta normas escolares", name: "respeta_normas_escolares" },
  { label: "Muestra sentido del humor", name: "sentido_humor" },
  { label: "Movimientos estereotipados", name: "movimientos_estereotipados" },
  { label: "Pataletas frecuentes", name: "pataletas" },
];

const SALUD_ACTUAL_ITEMS = [
  { label: "Vacunas al día", name: "vacunas" },
  { label: "Epilepsia", name: "epilepsia" },
  { label: "Problemas cardiacos", name: "cardiacos" },
  { label: "Paraplejia", name: "paraplejia" },
  { label: "Pérdida auditiva", name: "perdida_auditiva" },
  { label: "Pérdida visual", name: "perdida_visual" },
  { label: "Trastorno motor", name: "trastorno_motor" },
  { label: "Problema bronco-respiratorio", name: "bronco_respiratorio" },
  { label: "Enfermedad infecto-contagiosa", name: "infecto_contagiosa" },
  { label: "Trastorno emocional", name: "trastorno_emocional" },
  { label: "Trastorno conductual", name: "trastorno_conductual" },
];

const ALIMENTACION_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: '"Bueno/a" para comer', value: "bueno" },
  { label: '"Malo/a" para comer', value: "malo" },
  { label: "Otro", value: "otro" },
];

const PESO_APRECIACION_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Bajo peso", value: "bajo" },
  { label: "Obesidad", value: "obesidad" },
];

const SUENO_TIPO_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Tranquilo", value: "tranquilo" },
  { label: "Inquieto", value: "inquieto" },
];

const SUENO_INDICADORES = [
  { label: "Insomnio", name: "insomnio" },
  { label: "Pesadillas", name: "pesadillas" },
  { label: "Terrores nocturnos", name: "terrores" },
  { label: "Sonambulismo", name: "sonambulismo" },
  { label: "Despierta de buen humor", name: "buen_humor" },
];

const DUERME_OPTIONS = [
  { label: "Solo", value: "solo" },
  { label: "Acompañado", value: "acompanado" },
];

const HUMOR_ITEMS = [
  { label: "Alegre", name: "alegre" },
  { label: "Juguetón / bromista", name: "jugueton" },
  { label: "Risueño(a)", name: "risueno" },
  { label: "Triste", name: "triste" },
  { label: "Serio", name: "serio" },
  { label: "Rebelde", name: "rebelde" },
  { label: "Apático", name: "apatico" },
  { label: "Violento(a)", name: "violento" },
];

const CONVIVIENTES_ROWS = 5;

const MODALIDAD_ENSENANZA = [
  { label: "Regular", value: "regular" },
  { label: "Especial", value: "especial" },
  { label: "Técnica", value: "tecnica" },
];

const SITUACION_ACTUAL_ITEMS = [
  { label: "Dificultad de aprendizaje", name: "dificultad_aprendizaje" },
  { label: "Dificultad para participar", name: "dificultad_participar" },
  { label: "Conducta disruptiva", name: "conducta_disruptiva" },
];

const HABITOS_ESCOLARES_ITEMS = [
  { label: "Asiste regularmente", name: "asiste_regular" },
  { label: "Asiste con agrado", name: "asiste_agrado" },
  { label: "Apoyo familiar en tareas", name: "apoyo_tareas" },
  { label: "Amigos(as)", name: "amigos" },
];

const RESPUESTA_DIFICULTADES = [
  { label: "Apoyo", name: "apoyo" },
  { label: "Castigo", name: "castigo" },
  { label: "Indiferencia", name: "indiferencia" },
  { label: "Compasión", name: "compasion" },
  { label: "Tensión", name: "tension" },
  { label: "Otra", name: "otra" },
];

const RESPUESTA_EXITOS = [
  { label: "Apoyo", value: "apoyo" },
  { label: "Indiferencia", value: "indiferencia" },
  { label: "Otra", value: "otra" },
];

const REFUERZOS_ITEMS = [
  { label: "Expresiones afectivas", name: "expresiones" },
  { label: "Alimentos preferidos", name: "alimentos" },
  { label: "Ver TV", name: "ver_tv" },
  { label: "Juguetes", name: "juguetes" },
  { label: "Tiempo libre", name: "tiempo_libre" },
];

const QUIENES_APOYAN = [
  { label: "Madre", name: "madre" },
  { label: "Padre", name: "padre" },
  { label: "Hermanos(as)", name: "hermanos" },
  { label: "Otros familiares", name: "otros_familiares" },
  { label: "Otros profesionales", name: "otros_profesionales" },
];

const EXPECTATIVAS_FAMILIA = [
  { label: "Alta (incluye al grupo familiar)", value: "alta" },
  { label: "Mediana (incluye solo madre/padre)", value: "mediana" },
  { label: "Baja (no incluye a ningún miembro)", value: "baja" },
];

const AMBIENTE_APRENDIZAJE = [
  { label: "Ambos", value: "ambos" },
  { label: "Solo físico (espacios, materiales, ventilación, luminosidad)", value: "solo_fisico" },
  { label: "Solo emocional (tranquilo, relajado, comprensivo)", value: "solo_emocional" },
];

const normalizarSexo = (valor) => {
  if (!valor) return "";
  const normalized = valor.toString().trim().toUpperCase();
  if (normalized.startsWith("F")) return "F";
  if (normalized.startsWith("M")) return "M";
  return "";
};

const calcularEdad = (fechaISO) => {
  if (!fechaISO) return { years: "", months: "" };
  const nacimiento = new Date(fechaISO);
  if (Number.isNaN(nacimiento.getTime())) return { years: "", months: "" };
  const hoy = new Date();
  let years = hoy.getFullYear() - nacimiento.getFullYear();
  let months = hoy.getMonth() - nacimiento.getMonth();
  if (hoy.getDate() < nacimiento.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return {
    years: years >= 0 ? String(years) : "",
    months: months >= 0 ? String(months) : "",
  };
};

const mapFormElementsToObject = (formElement) => {
  const data = {};
  if (!formElement) return data;

  Array.from(formElement.elements).forEach((field) => {
    const { name, type } = field;
    if (!name) return;

    if (type === "radio") {
      if (!(name in data)) data[name] = "";
      if (field.checked) data[name] = field.value;
      return;
    }

    if (type === "checkbox") {
      data[name] = field.checked;
      return;
    }

    data[name] = field.value ?? "";
  });

  return data;
};

const hydrateFormFromObject = (formElement, values = {}) => {
  if (!formElement || !values) return;

  Array.from(formElement.elements).forEach((field) => {
    const { name, type } = field;
    if (!name) return;
    const value = values[name];

    if (type === "checkbox") {
      field.checked = Boolean(value);
      return;
    }

    if (type === "radio") {
      field.checked = value === field.value;
      return;
    }

    if (value === undefined || value === null) {
      field.value = "";
      return;
    }

    field.value = value;
  });
};

export default function Anamnesis() {
  const { user } = useAuth();
  const formRef = useRef(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState("");
  const [estudianteActivo, setEstudianteActivo] = useState(null);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(true);
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [ultimoRegistro, setUltimoRegistro] = useState(null);

  const showAlert = (type, message) => setAlerta(type ? { type, message } : null);

  const prefillFromEstudiante = useCallback(
    (estudiante) => {
      if (!formRef.current || !estudiante) return;
      const edad = calcularEdad(estudiante.fecha_nacimiento);
      const patch = {
        estudiante_nombre: estudiante.nombres_apellidos || estudiante.nombre_completo || "",
        estudiante_sexo: normalizarSexo(estudiante.genero || estudiante.sexo),
        fecha_nacimiento: estudiante.fecha_nacimiento || "",
        edad_anios: edad.years,
        edad_meses: edad.months,
        pais_natal: estudiante.pais_origen || estudiante.nacionalidad || "",
        domicilio: estudiante.direccion || estudiante.domicilio || "",
        telefono: estudiante.telefono || estudiante?.apoderado?.telefono || "",
        escolaridad: estudiante?.curso?.nombre || "",
        establecimiento: estudiante?.curso?.establecimiento?.nombre || "",
      };

      hydrateFormFromObject(formRef.current, patch);
    },
    []
  );

  const fetchUltimoRegistro = async (estudianteId, hydrate = true, estudianteInfo = null) => {
    if (!estudianteId) return;
    setLoadingRegistro(true);
    try {
      const { data } = await listarAnamnesis({ estudiante: estudianteId, page_size: 1, ordering: "-creado_en" });
      const items = Array.isArray(data) ? data : data?.results ?? [];
      const registro = items[0] ?? null;
      setUltimoRegistro(registro);
      if (hydrate) {
        if (registro?.datos_formulario) {
          hydrateFormFromObject(formRef.current, registro.datos_formulario);
        } else {
          formRef.current?.reset();
          prefillFromEstudiante(estudianteInfo || estudianteActivo);
        }
      }
    } catch (error) {
      console.error("[Anamnesis] Error cargando registro", error);
      showAlert("danger", "No se pudo recuperar la anamnesis previa del estudiante.");
    } finally {
      setLoadingRegistro(false);
    }
  };

  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoadingEstudiantes(true);
      try {
        const { data } = await listarEstudiantes();
        const items = Array.isArray(data) ? data : data?.results ?? [];
        setEstudiantes(items);
      } catch (error) {
        console.error("[Anamnesis] Error cargando estudiantes", error);
        showAlert("danger", "No se pudieron cargar los estudiantes disponibles.");
      } finally {
        setLoadingEstudiantes(false);
      }
    };
    fetchEstudiantes();
  }, []);

  useEffect(() => {
    if (!selectedEstudiante) {
      setEstudianteActivo(null);
      setUltimoRegistro(null);
      formRef.current?.reset();
      return;
    }

    const estudiante = estudiantes.find((est) => String(est.id) === String(selectedEstudiante));
    setEstudianteActivo(estudiante || null);
    if (estudiante) {
      prefillFromEstudiante(estudiante);
    }
    fetchUltimoRegistro(selectedEstudiante, true, estudiante);
  }, [selectedEstudiante, estudiantes, prefillFromEstudiante]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEstudiante) {
      showAlert("warning", "Selecciona un estudiante antes de guardar.");
      return;
    }

    const formElement = formRef.current;
    const formData = mapFormElementsToObject(formElement);
    const payload = {
      estudiante: selectedEstudiante,
      definicion_problema: formData.definicion_problema || "",
      observaciones_generales:
        formData.observaciones_familia || formData.observaciones_estado_salud || formData.observaciones_social || "",
      datos_formulario: formData,
    };

    setGuardando(true);
    try {
      if (ultimoRegistro) {
        await actualizarAnamnesis(ultimoRegistro.id, payload);
        showAlert("success", "Anamnesis actualizada correctamente.");
      } else {
        await crearAnamnesis(payload);
        showAlert("success", "Anamnesis registrada correctamente.");
      }
      await fetchUltimoRegistro(selectedEstudiante, false);
    } catch (error) {
      console.error("[Anamnesis] Error al guardar", error);
      const detail = error.response?.data?.detail || error.message;
      showAlert("danger", `No se pudo guardar la anamnesis: ${detail}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleReset = () => {
    formRef.current?.reset();
    if (estudianteActivo) {
      prefillFromEstudiante(estudianteActivo);
    }
    showAlert(null);
  };

  const ultimoGuardado = ultimoRegistro?.actualizado_en
    ? new Date(ultimoRegistro.actualizado_en).toLocaleString()
    : null;

  const handleDescargarPdf = async () => {
    if (!ultimoRegistro?.id) {
      showAlert("warning", "Debes guardar la anamnesis antes de descargar el PDF.");
      return;
    }

    setDescargandoPdf(true);
    try {
      const response = await descargarPdfAnamnesis(ultimoRegistro.id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `anamnesis_${ultimoRegistro.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const detail = error.response?.data?.detail || error.message || "No se pudo descargar el PDF.";
      showAlert("danger", detail);
    } finally {
      setDescargandoPdf(false);
    }
  };

  return (
    <div className="container py-4 anamnesis-page">
      <div className="anamnesis-form card shadow-sm">
        <div className="card-body">
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="border rounded p-3 mb-4 bg-light">
              <div className="row g-3 align-items-end">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Estudiante</label>
                  <select
                    className="form-select"
                    value={selectedEstudiante}
                    onChange={(e) => setSelectedEstudiante(e.target.value)}
                    disabled={loadingEstudiantes || guardando}
                  >
                    <option value="">
                      {loadingEstudiantes ? "Cargando estudiantes..." : "Seleccione un estudiante"}
                    </option>
                    {estudiantes.map((est) => (
                      <option key={est.id} value={est.id}>
                        {est.nombres_apellidos}
                        {est?.curso?.nombre ? ` – ${est.curso.nombre}` : ""}
                      </option>
                    ))}
                  </select>
                  {user && (
                    <small className="text-muted d-block mt-1">
                      Profesional: {[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}
                    </small>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold">Último guardado</label>
                  <p className="form-control-plaintext mb-0 small">
                    {loadingRegistro ? "Actualizando..." : ultimoGuardado || "Sin registros"}
                  </p>
                </div>
                <div className="col-md-3 text-md-end">
                  <div className="d-flex gap-2 justify-content-md-end">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleReset} disabled={guardando}>
                      Limpiar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleDescargarPdf}
                      disabled={!ultimoRegistro?.id || guardando || descargandoPdf || loadingRegistro}
                    >
                      {descargandoPdf ? "Descargando..." : "Descargar PDF"}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={!selectedEstudiante || guardando || loadingRegistro}
                    >
                      {guardando ? "Guardando..." : ultimoRegistro ? "Actualizar" : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {alerta && (
              <div className={`alert alert-${alerta.type} mb-3`} role="alert">
                {alerta.message}
              </div>
            )}

            {!selectedEstudiante && (
              <div className="alert alert-info mb-3" role="alert">
                Selecciona un estudiante para habilitar el formulario y registrar su anamnesis.
              </div>
            )}

            <fieldset disabled={!selectedEstudiante || guardando || loadingRegistro} className="border-0 p-0 m-0">
              <header className="mb-4 text-center">
                <p className="text-uppercase text-muted fw-semibold mb-1">Ley 20.201 – Decreto 170/2009</p>
                <h1 className="h4 fw-bold mb-1">Entrevista a la Familia / Anamnesis</h1>
                <p className="fst-italic small mb-0">Síntesis de los antecedentes de salud, escolares y sociales del estudiante.</p>
                <p className="small text-muted mb-0">
                  Esta pauta de uso optativo ha sido diseñada para facilitar a los profesionales que realizan los procesos de evaluación de NEE, en el marco del Decreto 170, la
                  recogida de antecedentes de las entrevistas familiares del estudiante. Puede ser completada por uno o más profesionales en el proceso de detección y evaluación
                  de estudiantes con NEE, que presenta al alumnado y de los apoyos que requiere para participar y aprender en el contexto escolar.
                </p>
              </header>

          <section className="anamnesis-section">
            <h2 className="section-title">1. Identificación del estudiante</h2>
            <table className="table table-bordered table-sm align-middle anamnesis-table">
              <tbody>
                <tr>
                  <th>Nombre</th>
                  <td colSpan="5">
                    <input type="text" className="form-control" name="estudiante_nombre" />
                  </td>
                  <th>Sexo</th>
                  <td className="text-center">
                    <div className="d-flex gap-3 justify-content-center">
                      <label className="form-check-label">
                        <input type="radio" className="form-check-input me-1" name="estudiante_sexo" value="F" />F
                      </label>
                      <label className="form-check-label">
                        <input type="radio" className="form-check-input me-1" name="estudiante_sexo" value="M" />M
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>Fecha nacimiento</th>
                  <td>
                    <input type="date" className="form-control" name="fecha_nacimiento" />
                  </td>
                  <th>Edad actual</th>
                  <td colSpan="3">
                    <div className="d-flex gap-2">
                      <input type="number" min="0" className="form-control" placeholder="años" name="edad_anios" />
                      <input type="number" min="0" className="form-control" placeholder="meses" name="edad_meses" />
                    </div>
                  </td>
                  <th>País natal</th>
                  <td>
                    <input type="text" className="form-control" name="pais_natal" />
                  </td>
                </tr>
                <tr>
                  <th>Domicilio actual</th>
                  <td colSpan="5">
                    <input type="text" className="form-control" name="domicilio" />
                  </td>
                  <th>Teléfono</th>
                  <td>
                    <input type="text" className="form-control" name="telefono" />
                  </td>
                </tr>
                <tr>
                  <th>Lengua materna</th>
                  <td>
                    Grado dominio
                    <input type="text" className="form-control mt-1" name="lengua_materna_grado" />
                  </td>
                  <td colSpan="6">
                    <div className="row g-2">
                      {[
                        { label: "Comprende", name: "lengua_materna_comprende" },
                        { label: "Habla", name: "lengua_materna_habla" },
                        { label: "Lee", name: "lengua_materna_lee" },
                        { label: "Escribe", name: "lengua_materna_escribe" },
                      ].map((campo) => (
                        <div className="col-6 col-md-3" key={campo.name}>
                          <label className="form-check-label w-100">
                            <input type="checkbox" className="form-check-input me-2" name={campo.name} />
                            {campo.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>Lengua de uso</th>
                  <td>
                    Grado dominio
                    <input type="text" className="form-control mt-1" name="lengua_uso_grado" />
                  </td>
                  <td colSpan="6">
                    <div className="row g-2">
                      {[
                        { label: "Comprende", name: "lengua_uso_comprende" },
                        { label: "Habla", name: "lengua_uso_habla" },
                        { label: "Lee", name: "lengua_uso_lee" },
                        { label: "Escribe", name: "lengua_uso_escribe" },
                      ].map((campo) => (
                        <div className="col-6 col-md-3" key={campo.name}>
                          <label className="form-check-label w-100">
                            <input type="checkbox" className="form-check-input me-2" name={campo.name} />
                            {campo.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>Escolaridad actual</th>
                  <td colSpan="5">
                    <input type="text" className="form-control" name="escolaridad" />
                  </td>
                  <th>Establecimiento</th>
                  <td>
                    <input type="text" className="form-control" name="establecimiento" />
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">2. Identificación del o los informantes</h2>
            <div className="row g-3">
              {INFORMANTE_SLOTS.map((slot) => (
                <div className="col-12 col-md-6" key={slot}>
                  <div className="card border-secondary h-100">
                    <div className="card-body p-3">
                      <h3 className="h6 fw-bold">{slot}. Fecha de la entrevista</h3>
                      <input type="date" className="form-control mb-2" name={`informante_${slot}_fecha`} />
                      <label className="form-label mb-1">Nombre</label>
                      <input type="text" className="form-control mb-2" name={`informante_${slot}_nombre`} />
                      <label className="form-label mb-1">Relación con el/la estudiante</label>
                      <input type="text" className="form-control mb-2" name={`informante_${slot}_relacion`} />
                      <label className="form-label mb-1">En presencia de</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Miembro de la familia, intérprete, otro(a)"
                        name={`informante_${slot}_presencia`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">3. Identificación del o los entrevistadores</h2>
            <div className="row g-3">
              {ENTREVISTADOR_SLOTS.map((slot) => (
                <div className="col-12 col-md-4" key={slot}>
                  <div className="card border-secondary h-100">
                    <div className="card-body p-3">
                      <h3 className="h6 fw-bold">{slot}. Fecha de la entrevista</h3>
                      <input type="date" className="form-control mb-2" name={`entrevistador_${slot}_fecha`} />
                      <label className="form-label mb-1">Nombre</label>
                      <input type="text" className="form-control mb-2" name={`entrevistador_${slot}_nombre`} />
                      <label className="form-label mb-1">Rol / Cargo</label>
                      <input type="text" className="form-control" name={`entrevistador_${slot}_rol`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">4. Definición del problema o situación que motiva la entrevista</h2>
            <textarea className="form-control" rows={5} name="definicion_problema" placeholder="Describa la situación" />
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">5. Antecedentes relativos al desarrollo y a la salud del/la estudiante</h2>
            <div className="mb-3">
              <p className="fw-semibold mb-2">¿El o la estudiante tiene algún diagnóstico previo?</p>
              <div className="d-flex flex-wrap gap-3">
                <label className="form-check-label">
                  <input type="radio" className="form-check-input me-2" name="diagnostico_previo" value="no" /> No
                </label>
                <label className="form-check-label">
                  <input type="radio" className="form-check-input me-2" name="diagnostico_previo" value="si" /> Sí (especificar)
                </label>
                <input type="text" className="form-control flex-grow-1" placeholder="Detalle del diagnóstico" name="diagnostico_detalle" />
              </div>
            </div>

            <div className="row g-3">
              {PROFESIONALES.map((prof) => (
                <div className="col-12 col-md-6 col-lg-4" key={prof}>
                  <label className="form-check-label w-100">
                    <input type="checkbox" className="form-check-input me-2" name={`atencion_${prof.toLowerCase().replace(/[^a-záéíóúñ]/gi, "_")}`} />
                    {prof}
                  </label>
                </div>
              ))}
            </div>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.1 Primer año de vida</h3>
              <div className="row g-3">
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">Tipo de parto</label>
                  <div className="d-flex flex-wrap gap-3">
                    {[
                      "Normal",
                      "Inducido",
                      "Fórceps",
                      "Cesárea",
                    ].map((tipo) => (
                      <label className="form-check-label" key={tipo}>
                        <input type="radio" className="form-check-input me-2" name="tipo_parto" value={tipo.toLowerCase()} />
                        {tipo}
                      </label>
                    ))}
                    <input type="text" className="form-control form-control-sm flex-grow-1" placeholder="si es cesárea, indicar motivo" name="motivo_cesarea" />
                  </div>
                </div>
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">¿Tuvo asistencia médica durante el parto?</label>
                  <div className="d-flex gap-3 align-items-center">
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="asistencia_parto" value="si" /> Sí
                    </label>
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="asistencia_parto" value="no" /> No
                    </label>
                    <div className="ms-3 d-flex gap-2 align-items-center flex-wrap">
                      <span className="fw-semibold text-muted">Peso:</span>
                      <input type="text" className="form-control form-control-sm" name="peso_nacer" />
                      <span className="fw-semibold text-muted">Talla:</span>
                      <input type="text" className="form-control form-control-sm" name="talla_nacer" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Señale antecedentes relevantes del embarazo o parto</label>
                <textarea className="form-control" rows={3} name="antecedentes_embarazo" />
              </div>

              <div className="table-responsive mt-3">
                <table className="table table-bordered table-sm text-center align-middle">
                  <thead>
                    <tr>
                      <th className="text-start">Durante los primeros 12 meses presentó…</th>
                      <th width="60">Sí</th>
                      <th width="60">No</th>
                      <th className="text-start">Durante los primeros 12 meses presentó…</th>
                      <th width="60">Sí</th>
                      <th width="60">No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVENTOS_PRIMER_ANO.reduce((rows, evento, index) => {
                      if (index % 2 === 0) rows.push([evento]);
                      else rows[rows.length - 1].push(evento);
                      return rows;
                    }, []).map((par, idx) => (
                      <tr key={idx}>
                        {par.map((evento, subIdx) => (
                          evento ? (
                            <React.Fragment key={`${evento}-${subIdx}`}>
                              <td className="text-start">{evento}</td>
                              <td>
                                <input type="radio" className="form-check-input" name={`evento_${evento}_${idx}_${subIdx}`} value="si" />
                              </td>
                              <td>
                                <input type="radio" className="form-check-input" name={`evento_${evento}_${idx}_${subIdx}`} value="no" />
                              </td>
                            </React.Fragment>
                          ) : (
                            <React.Fragment key={`vacio-${idx}-${subIdx}`}>
                              <td colSpan={3}></td>
                            </React.Fragment>
                          )
                        ))}
                        {par.length === 1 && <td colSpan={3}></td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="row g-3 mt-2">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">¿Se realizaron controles periódicos de salud?</label>
                  <div className="d-flex gap-3">
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="controles_salud" value="si" /> Sí
                    </label>
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="controles_salud" value="no" /> No
                    </label>
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Observaciones</label>
                  <input type="text" className="form-control" name="observaciones_primer_ano" />
                </div>
              </div>
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.2 Desarrollo sensoriomotriz</h3>
              <div className="row g-3">
                {[
                  { label: "Edad en que fija la cabeza", name: "edad_fija_cabeza" },
                  { label: "Se sienta solo/a", name: "edad_sienta" },
                  { label: "Camina sin apoyo", name: "edad_caminar" },
                  { label: "Primeras palabras", name: "edad_palabras" },
                  { label: "Primeras frases", name: "edad_frases" },
                  { label: "Se viste solo/a", name: "edad_vestirse" },
                ].map((campo) => (
                  <div className="col-12 col-md-6 col-lg-4" key={campo.name}>
                    <label className="form-label">{campo.label}</label>
                    <input type="text" className="form-control" name={campo.name} />
                  </div>
                ))}
              </div>

              <div className="row g-3 mt-1">
                {[
                  { label: "Controla esfínter vesical", name: "esfinter_vesical", hasDayNight: true },
                  { label: "Controla esfínter anal", name: "esfinter_anal", hasDayNight: true },
                ].map((campo) => (
                  <div className="col-12 col-md-6" key={campo.name}>
                    <label className="form-label fw-semibold">{campo.label}</label>
                    <div className="d-flex gap-2 align-items-center">
                      <span>Diurno:</span>
                      <input type="text" className="form-control" name={`${campo.name}_diurno`} />
                      <span>Nocturno:</span>
                      <input type="text" className="form-control" name={`${campo.name}_nocturno`} />
                    </div>
                  </div>
                ))}
              </div>

              <label className="form-label fw-semibold mt-3">Observaciones</label>
              <textarea className="form-control" rows={3} name="observaciones_sensoriomotriz" />

              <div className="row g-3 mt-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">En su actividad motora general se aprecia</label>
                  <div className="row g-2">
                    {["normal", "activo", "hiperactivo", "hipoactivo"].map((op) => (
                      <div className="col-6" key={op}>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-2" name="actividad_motora" value={op} />
                          {op}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Su tono muscular general se aprecia</label>
                  <div className="d-flex flex-wrap gap-3">
                    {["normal", "hipertónico", "hipotónico"].map((op) => (
                      <label className="form-check-label" key={op}>
                        <input type="radio" className="form-check-input me-2" name="tono_muscular" value={op} />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">En relación con su motricidad gruesa se aprecia</h4>
                  {MOTRICIDAD_GRUESA.map((item) => (
                    <div className="d-flex justify-content-between align-items-center mb-1" key={item.name}>
                      <span>{item.label}</span>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`gruesa_${item.name}`} value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`gruesa_${item.name}`} value="no" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">En relación con su motricidad fina el niño(a) logra</h4>
                  {MOTRICIDAD_FINA.map((item) => (
                    <div className="d-flex justify-content-between align-items-center mb-1" key={item.name}>
                      <span>{item.label}</span>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`fina_${item.name}`} value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`fina_${item.name}`} value="no" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">En relación con algunos signos cognitivos</h4>
                  {COGNITIVOS.map((item) => (
                    <div className="d-flex justify-content-between align-items-center mb-1" key={item.name}>
                      <span>{item.label}</span>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`cognitivo_${item.name}`} value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`cognitivo_${item.name}`} value="no" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">Observaciones</label>
                  <textarea className="form-control" rows={4} name="observaciones_motricidad" />
                </div>
              </div>
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.3 Visión - Audición</h3>
              <div className="row g-3">
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">Visión</h4>
                  <table className="table table-bordered table-sm align-middle">
                    <tbody>
                      {VISION_ITEMS.map((texto, idx) => (
                        <tr key={`vision-${idx}`}>
                          <td className="w-75">{texto}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`vision_${idx}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`vision_${idx}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">Audición</h4>
                  <table className="table table-bordered table-sm align-middle">
                    <tbody>
                      {AUDICION_ITEMS.map((texto, idx) => (
                        <tr key={`audicion-${idx}`}>
                          <td className="w-75">{texto}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`audicion_${idx}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`audicion_${idx}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <label className="form-label fw-semibold">Observaciones</label>
              <textarea className="form-control" rows={3} name="observaciones_vision_audicion" />
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.4 Desarrollo del lenguaje</h3>
              <div className="mb-3">
                <p className="fw-semibold mb-2">El niño(a) se comunica preferentemente en forma</p>
                <div className="d-flex flex-wrap gap-3">
                  {["Oral", "Gestual", "Mixta"].map((modo) => (
                    <label className="form-check-label" key={modo}>
                      <input type="radio" className="form-check-input me-2" name="modo_comunicacion" value={modo.toLowerCase()} />
                      {modo}
                    </label>
                  ))}
                  <label className="form-check-label d-flex align-items-center gap-2">
                    <input type="radio" className="form-check-input" name="modo_comunicacion" value="otro" /> Otro
                    <input type="text" className="form-control form-control-sm" placeholder="Especifique" name="modo_comunicacion_otro" />
                  </label>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">Características del lenguaje expresivo</h4>
                  {LENGUAJE_EXPRESIVO.map((item, idx) => (
                    <div className="d-flex justify-content-between align-items-center mb-1" key={`exp-${idx}`}>
                      <span>{item.label}</span>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`expresivo_${item.name}`} value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`expresivo_${item.name}`} value="no" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="col-lg-6">
                  <h4 className="h6 fw-bold">Características del lenguaje comprensivo</h4>
                  {LENGUAJE_COMPRENSIVO.map((item, idx) => (
                    <div className="d-flex justify-content-between align-items-center mb-1" key={`comp-${idx}`}>
                      <span>{item.label}</span>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`comprensivo_${item.name}`} value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name={`comprensivo_${item.name}`} value="no" /> No
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">¿Manifiesta pérdida del lenguaje oral?</label>
                  <div className="d-flex gap-3 align-items-center">
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="perdida_lenguaje" value="si" /> Sí
                    </label>
                    <label className="form-check-label">
                      <input type="radio" className="form-check-input me-1" name="perdida_lenguaje" value="no" /> No
                    </label>
                    <input type="text" className="form-control" placeholder="Especifique edad y motivos" name="perdida_lenguaje_detalle" />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Observaciones</label>
                  <textarea className="form-control" rows={3} name="observaciones_lenguaje" />
                </div>
              </div>
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.5 Desarrollo social</h3>
              <div className="row g-3">
                <div className="col-lg-6">
                  <table className="table table-bordered table-sm align-middle">
                    <tbody>
                      {DESARROLLO_SOCIAL_ITEMS.map((item, idx) => (
                        <tr key={`soc-a-${idx}`}>
                          <td className="w-75">{item.label}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`social_${item.name}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`social_${item.name}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="col-lg-6">
                  <table className="table table-bordered table-sm align-middle">
                    <tbody>
                      {DESARROLLO_SOCIAL_CONTRASTE.map((item, idx) => (
                        <tr key={`soc-b-${idx}`}>
                          <td className="w-75">{item.label}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`social_contraste_${item.name}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`social_contraste_${item.name}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row g-3 align-items-center mt-3">
                {[
                  { label: "Luces", name: "luces" },
                  { label: "Sonidos", name: "sonidos" },
                  { label: "Personas extrañas", name: "personas" },
                ].map((stim) => (
                  <div className="col-md-4" key={stim.name}>
                    <label className="form-label fw-semibold">Ante estos estímulos su reacción es:</label>
                    <div className="d-flex flex-column gap-1">
                      <span className="small text-muted">{stim.label}</span>
                      <label className="form-check-label">
                        <input type="radio" className="form-check-input me-2" name={`reaccion_${stim.name}`} value="natural" /> Natural
                      </label>
                      <label className="form-check-label">
                        <input type="radio" className="form-check-input me-2" name={`reaccion_${stim.name}`} value="desmesurada" /> Desmesurada
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <label className="form-label fw-semibold mt-3">Observaciones</label>
              <textarea className="form-control" rows={3} name="observaciones_social" />
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">5.6 Estado actual de salud del/la estudiante</h3>
              <div className="row g-4">
                <div className="col-lg-7">
                  <table className="table table-bordered table-sm align-middle">
                    <thead>
                      <tr>
                        <th className="w-75">Situación</th>
                        <th className="text-center" width="70">
                          Sí
                        </th>
                        <th className="text-center" width="70">
                          No
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SALUD_ACTUAL_ITEMS.map((item) => (
                        <tr key={item.name}>
                          <td>{item.label}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`salud_${item.name}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`salud_${item.name}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="col-lg-5">
                  <label className="form-label fw-semibold">Otro (especificar)</label>
                  <input type="text" className="form-control mb-3" name="salud_otro" />
                  <label className="form-label fw-semibold">Control / tratamiento</label>
                  <input type="text" className="form-control" name="salud_control_tratamiento" />
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">Alimentación</label>
                  <div className="d-flex flex-column gap-1">
                    {ALIMENTACION_OPTIONS.map((option) => (
                      <label className="form-check-label" key={option.value}>
                        <input type="radio" className="form-check-input me-2" name="alimentacion_tipo" value={option.value} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <input type="text" className="form-control mt-2" placeholder="Detalle" name="alimentacion_detalle" />
                </div>
                <div className="col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">Peso (apreciación informante)</label>
                  <div className="d-flex flex-column gap-1">
                    {PESO_APRECIACION_OPTIONS.map((option) => (
                      <label className="form-check-label" key={option.value}>
                        <input type="radio" className="form-check-input me-2" name="peso_apreciacion" value={option.value} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-md-6 col-lg-4">
                  <label className="form-label fw-semibold">Horas que duerme</label>
                  <input type="text" className="form-control" name="suenio_horas" />
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">Calidad del sueño</label>
                  <div className="d-flex flex-wrap gap-3">
                    {SUENO_TIPO_OPTIONS.map((option) => (
                      <label className="form-check-label" key={option.value}>
                        <input type="radio" className="form-check-input me-2" name="suenio_calidad" value={option.value} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3">
                    <span className="fw-semibold small text-muted d-block">Indicadores de sueño</span>
                    <div className="row g-2 mt-1">
                      {SUENO_INDICADORES.map((indicador) => (
                        <div className="col-6" key={indicador.name}>
                          <label className="form-check-label">
                            <input type="checkbox" className="form-check-input me-2" name={`suenio_indicador_${indicador.name}`} />
                            {indicador.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <label className="form-label fw-semibold">¿Duerme?</label>
                  <div className="d-flex flex-wrap gap-3">
                    {DUERME_OPTIONS.map((option) => (
                      <label className="form-check-label" key={option.value}>
                        <input type="radio" className="form-check-input me-2" name="suenio_duerme" value={option.value} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                  <input type="text" className="form-control mt-2" placeholder="Especifique" name="suenio_duerme_detalle" />
                  <div className="mt-3">
                    <label className="form-label fw-semibold">Humor / comportamiento habitual</label>
                    <div className="row g-2">
                      {HUMOR_ITEMS.map((item) => (
                        <div className="col-6" key={item.name}>
                          <label className="form-check-label">
                            <input type="checkbox" className="form-check-input me-2" name={`humor_${item.name}`} />
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <input type="text" className="form-control mt-2" placeholder="Otro" name="humor_otro" />
                  </div>
                </div>
              </div>

              <label className="form-label fw-semibold mt-3">Observaciones</label>
              <textarea className="form-control" rows={4} name="observaciones_estado_salud" />
            </article>
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">6. Antecedentes familiares</h2>
            <p className="fw-semibold">Personas que conviven con el/la estudiante</p>
            <div className="table-responsive">
              <table className="table table-bordered table-sm align-middle">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Parentesco</th>
                    <th>Edad</th>
                    <th>Escolaridad</th>
                    <th>Ocupación</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: CONVIVIENTES_ROWS }).map((_, idx) => (
                    <tr key={`conviviente-${idx}`}>
                      <td>
                        <input type="text" className="form-control" name={`conviviente_${idx}_nombre`} />
                      </td>
                      <td>
                        <input type="text" className="form-control" name={`conviviente_${idx}_parentesco`} />
                      </td>
                      <td>
                        <input type="text" className="form-control" name={`conviviente_${idx}_edad`} />
                      </td>
                      <td>
                        <input type="text" className="form-control" name={`conviviente_${idx}_escolaridad`} />
                      </td>
                      <td>
                        <input type="text" className="form-control" name={`conviviente_${idx}_ocupacion`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="row g-3 mt-3">
              <div className="col-12">
                <label className="form-label fw-semibold">Antecedentes de salud de la familia</label>
                <textarea className="form-control" rows={3} name="antecedentes_salud_familia" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Observaciones</label>
                <textarea className="form-control" rows={3} name="observaciones_familia" />
              </div>
            </div>
          </section>

          <section className="anamnesis-section">
            <h2 className="section-title">7. Antecedentes escolares y apoyo de la familia</h2>

            <article className="anamnesis-subsection">
              <h3 className="subsection-title">Trayectoria escolar</h3>
              <table className="table table-bordered table-sm align-middle">
                <tbody>
                  <tr>
                    <th>Edad de ingreso al sistema escolar</th>
                    <td>
                      <input type="text" className="form-control" name="edad_ingreso_escolar" />
                    </td>
                    <th>Asistió a jardín infantil</th>
                    <td>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name="jardin_infantil" value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name="jardin_infantil" value="no" /> No
                        </label>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>N° de colegios en que ha estudiado</th>
                    <td>
                      <input type="text" className="form-control" name="numero_colegios" />
                    </td>
                    <th>Modalidad de enseñanza</th>
                    <td>
                      <div className="d-flex flex-wrap gap-3">
                        {MODALIDAD_ENSENANZA.map((opt) => (
                          <label className="form-check-label" key={opt.value}>
                            <input type="radio" className="form-check-input me-2" name="modalidad_ensenanza" value={opt.value} />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <th>Motivo de los cambios</th>
                    <td colSpan="3">
                      <textarea className="form-control" rows={2} name="motivo_cambios" />
                    </td>
                  </tr>
                  <tr>
                    <th>Ha repetido cursos</th>
                    <td>
                      <div className="d-flex gap-3">
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name="repite_cursos" value="si" /> Sí
                        </label>
                        <label className="form-check-label">
                          <input type="radio" className="form-check-input me-1" name="repite_cursos" value="no" /> No
                        </label>
                      </div>
                    </td>
                    <th>Curso(s)</th>
                    <td>
                      <input type="text" className="form-control" name="repite_cursos_detalle" />
                    </td>
                  </tr>
                  <tr>
                    <th>Motivo</th>
                    <td colSpan="3">
                      <input type="text" className="form-control" name="repite_cursos_motivo" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">Situación actual</h3>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Nivel / curso actual</label>
                  <input type="text" className="form-control" name="nivel_curso_actual" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Apoyo familiar</label>
                  <input type="text" className="form-control" name="apoyo_familiar_detalle" placeholder="Detalle general" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Observaciones rápidas</label>
                  <input type="text" className="form-control" name="situacion_actual_observaciones" />
                </div>
              </div>

              <div className="row g-3 mt-3">
                <div className="col-lg-6">
                  <table className="table table-bordered table-sm align-middle">
                    <thead>
                      <tr>
                        <th className="w-75">Aspecto</th>
                        <th className="text-center" width="70">Sí</th>
                        <th className="text-center" width="70">No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SITUACION_ACTUAL_ITEMS.map((item) => (
                        <tr key={item.name}>
                          <td>{item.label}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`situacion_${item.name}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`situacion_${item.name}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="col-lg-6">
                  <table className="table table-bordered table-sm align-middle">
                    <thead>
                      <tr>
                        <th className="w-75">Asistencia y participación</th>
                        <th className="text-center" width="70">Sí</th>
                        <th className="text-center" width="70">No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HABITOS_ESCOLARES_ITEMS.map((item) => (
                        <tr key={item.name}>
                          <td>{item.label}</td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`habito_${item.name}`} value="si" />
                          </td>
                          <td className="text-center">
                            <input type="radio" className="form-check-input" name={`habito_${item.name}`} value="no" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>

            <article className="anamnesis-subsection mt-4">
              <h3 className="subsection-title">Actitud de la familia</h3>
              <div className="mb-3">
                <label className="form-label fw-semibold">¿Cómo evalúa la familia el desempeño escolar del estudiante?</label>
                <div className="d-flex flex-wrap gap-3">
                  <label className="form-check-label">
                    <input type="radio" className="form-check-input me-2" name="evaluacion_desempeno" value="satisfactorio" /> Satisfactorio
                  </label>
                  <label className="form-check-label d-flex align-items-center gap-2">
                    <input type="radio" className="form-check-input" name="evaluacion_desempeno" value="insatisfactorio" />
                    Insatisfactorio (motivos)
                  </label>
                </div>
                <input type="text" className="form-control mt-2" placeholder="Motivos" name="evaluacion_desempeno_motivos" />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">¿Cuál es la respuesta de la familia frente a las dificultades escolares del estudiante?</label>
                <div className="d-flex flex-wrap gap-3">
                  {RESPUESTA_DIFICULTADES.map((respuesta) => (
                    <label className="form-check-label" key={respuesta.name}>
                      <input type="checkbox" className="form-check-input me-2" name={`respuesta_dificultades_${respuesta.name}`} />
                      {respuesta.label}
                    </label>
                  ))}
                </div>
                <input type="text" className="form-control mt-2" placeholder="Detalle otra respuesta" name="respuesta_dificultades_otra_detalle" />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">¿Cuál es la respuesta de la familia frente a los éxitos escolares del estudiante?</label>
                <div className="d-flex flex-wrap gap-3 align-items-center">
                  {RESPUESTA_EXITOS.map((opt) => (
                    <label className="form-check-label" key={opt.value}>
                      <input type="radio" className="form-check-input me-2" name="respuesta_exitos" value={opt.value} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <input type="text" className="form-control mt-2" placeholder="Detalle otra respuesta" name="respuesta_exitos_otra_detalle" />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Especifique el tipo de refuerzos o premios</label>
                <div className="row g-2">
                  {REFUERZOS_ITEMS.map((item) => (
                    <div className="col-sm-6" key={item.name}>
                      <label className="form-check-label">
                        <input type="checkbox" className="form-check-input me-2" name={`refuerzo_${item.name}`} />
                        {item.label}
                      </label>
                    </div>
                  ))}
                </div>
                <input type="text" className="form-control mt-2" placeholder="Otro refuerzo o premio" name="refuerzo_otro" />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">¿Quiénes apoyan el proceso de aprendizaje y desarrollo del estudiante?</label>
                <div className="d-flex flex-wrap gap-3">
                  {QUIENES_APOYAN.map((item) => (
                    <label className="form-check-label" key={item.name}>
                      <input type="checkbox" className="form-check-input me-2" name={`apoyo_${item.name}`} />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">¿Qué expectativas muestra la familia frente al futuro escolar del estudiante?</label>
                  <div className="d-flex flex-column gap-1">
                    {EXPECTATIVAS_FAMILIA.map((opt) => (
                      <label className="form-check-label" key={opt.value}>
                        <input type="radio" className="form-check-input me-2" name="expectativas_familia" value={opt.value} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">¿Ofrece la familia un ambiente adecuado para el aprendizaje?</label>
                  <div className="d-flex flex-column gap-1">
                    {AMBIENTE_APRENDIZAJE.map((opt) => (
                      <label className="form-check-label" key={opt.value}>
                        <input type="radio" className="form-check-input me-2" name="ambiente_aprendizaje" value={opt.value} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="form-label fw-semibold mt-3">Comentarios u otras observaciones relevantes que no se han registrado o explorado</label>
              <textarea className="form-control" rows={4} name="observaciones_antecedentes_escolares" />
            </article>
          </section>

          <p className="small text-muted mt-4 text-center">
            Los datos contenidos en este documento son confidenciales, su divulgación o uso indebido es penada por la ley.
          </p>
          </fieldset>
          </form>
        </div>
      </div>
    </div>
  );
}