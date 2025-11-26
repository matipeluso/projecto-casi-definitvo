import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import { useAuth } from "../../contexto/AuthContext";
import { listarEstudiantes } from "../../servicios/estudiantes";
import {
  actualizarInformeFamilia,
  crearInformeFamilia,
  descargarPdfInformeFamilia,
  listarInformesFamilia,
} from "../../servicios/informesFamilia";

const emptyInstrument = () => ({ nombre: "", fecha: "" });
const todayISO = () => new Date().toISOString().slice(0, 10);

const createEmptyState = () => ({
  estudiante: {
    nombreIdentidad: "",
    rut: "",
    nombreSocial: "",
    fechaNacimiento: "",
    edad: "",
    curso: "",
    establecimiento: "",
  },
  profesional: {
    nombreIdentidad: "",
    nombreSocial: "",
    rut: "",
    rolCargo: "",
    telefono: "",
    email: "",
    fechaEntrega: todayISO(),
  },
  receptor: {
    nombreIdentidad: "",
    rut: "",
    nombreSocial: "",
    telefono: "",
    email: "",
    relacion: "",
    apoderadoTitular: false,
    apoderadoSuplente: false,
    presentaPoderSimple: "",
    enPresencia: "",
  },
  resultado: {
    motivo: "ingreso",
    instrumentos: [emptyInstrument()],
    diagnostico: "",
  },
  fortalezas: {
    pedagogico: { logros: "", necesidades: "" },
    socialAfectivo: { logros: "", necesidades: "" },
  },
  trabajoColaborativo: "",
  apoyosHogar: "",
  acuerdosCompromisos: "",
  fechasEvaluacion: Array(6).fill(""),
});

const unwrapResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  return [];
};

const computeEdadLabel = (fecha) => {
  if (!fecha) return "";
  const nacimiento = new Date(fecha);
  if (Number.isNaN(nacimiento.getTime())) return "";
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const diffMes = hoy.getMonth() - nacimiento.getMonth();
  if (diffMes < 0 || (diffMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return `${edad} años`;
};

const buildEstudianteSnapshot = (estudiante) => {
  if (!estudiante) {
    return {
      nombreIdentidad: "",
      rut: "",
      nombreSocial: "",
      fechaNacimiento: "",
      edad: "",
      curso: "",
      establecimiento: "",
    };
  }
  const curso = estudiante.curso || {};
  const establecimiento = estudiante.establecimiento || curso.establecimiento || {};
  return {
    nombreIdentidad: estudiante.nombres_apellidos || "",
    rut: estudiante.run || "",
    nombreSocial: estudiante.nombre_social || "",
    fechaNacimiento: estudiante.fecha_nacimiento || "",
    edad: computeEdadLabel(estudiante.fecha_nacimiento),
    curso: curso.nombre || "",
    establecimiento: establecimiento.nombre || "",
  };
};

const hydrateProfesionalFromUser = (profesional, user) => {
  if (!user) return profesional;
  const nombre = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return {
    ...profesional,
    nombreIdentidad: profesional.nombreIdentidad || nombre || user.username || "",
    nombreSocial: profesional.nombreSocial || user.nombre_social || "",
    rut: profesional.rut || user.rut || "",
    rolCargo: profesional.rolCargo || user.cargo || user.tipo || "",
    telefono: profesional.telefono || user.telefono || "",
    email: profesional.email || user.email || "",
    fechaEntrega: profesional.fechaEntrega || todayISO(),
  };
};

const normalizeMotivo = (value) => {
  const text = (value || "").toLowerCase();
  return text.includes("reeval") ? "reevaluacion" : "ingreso";
};

const toBackendMotivo = (value) => (value === "reevaluacion" ? "Reevaluación" : "Ingreso");

const mapInformeToState = (informe) => {
  const state = createEmptyState();
  state.estudiante = buildEstudianteSnapshot(informe.estudiante);

  const entrega = Array.isArray(informe.entrega) ? informe.entrega[0] : informe.entrega;
  state.profesional = {
    nombreIdentidad: entrega?.nombre_identidad || "",
    nombreSocial: entrega?.nombre_social || "",
    rut: entrega?.rut || "",
    rolCargo: entrega?.rol_cargo || "",
    telefono: entrega?.telefono || "",
    email: entrega?.email || "",
    fechaEntrega: informe.fecha_entrega || todayISO(),
  };

  const receptor = Array.isArray(informe.receptores) ? informe.receptores[0] : informe.receptores;
  state.receptor = {
    nombreIdentidad: receptor?.nombre_identidad || "",
    rut: receptor?.rut_pasaporte || "",
    nombreSocial: receptor?.nombre_social || "",
    telefono: receptor?.telefono || "",
    email: receptor?.email || "",
    relacion: receptor?.relacion || "",
    apoderadoTitular: Boolean(receptor?.es_apoderado_titular),
    apoderadoSuplente: Boolean(receptor?.es_apoderado_suplente),
    presentaPoderSimple:
      receptor?.poder_simple === true ? "si" : receptor?.poder_simple === false ? "no" : "",
    enPresencia: receptor?.en_presencia_de || "",
  };

  const instrumentos = informe.instrumentos || [];
  state.resultado = {
    motivo: normalizeMotivo(informe.motivo),
    instrumentos: instrumentos.length
      ? instrumentos.map((item) => ({ nombre: item.nombre || "", fecha: item.fecha_aplicacion || "" }))
      : [emptyInstrument()],
    diagnostico: informe.diagnostico_nee || "",
  };

  const ambitos = informe.ambitos || [];
  const findAmbito = (slug) =>
    ambitos.find((item) => item.ambito?.toLowerCase() === slug) || { fortalezas: "", necesidades_apoyo: "" };
  const ped = findAmbito("pedagógico");
  const soc = findAmbito("social/afectivo");
  state.fortalezas = {
    pedagogico: { logros: ped.fortalezas || "", necesidades: ped.necesidades_apoyo || "" },
    socialAfectivo: { logros: soc.fortalezas || "", necesidades: soc.necesidades_apoyo || "" },
  };

  state.trabajoColaborativo = informe.trabajo_colaborativo || "";
  state.apoyosHogar = informe.apoyos_requeridos_hogar || "";
  state.acuerdosCompromisos = informe.acuerdos_compromisos || "";

  const seguimientos = informe.seguimientos || [];
  state.fechasEvaluacion = Array.from({ length: 6 }, (_, index) => seguimientos[index]?.fecha_seguimiento || "");

  return state;
};

const createBaseForm = (estudiante, user) => {
  const state = createEmptyState();
  state.estudiante = buildEstudianteSnapshot(estudiante);
  state.profesional = hydrateProfesionalFromUser(state.profesional, user);
  return state;
};

export default function InformeFamilia() {
  const { user } = useAuth();
  const [formData, setFormData] = useState(() => createEmptyState());
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudiante, setSelectedEstudiante] = useState("");
  const [currentInforme, setCurrentInforme] = useState(null);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(true);
  const [loadingInforme, setLoadingInforme] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const estudianteActivo = useMemo(
    () => estudiantes.find((est) => String(est.id) === String(selectedEstudiante)) || null,
    [estudiantes, selectedEstudiante]
  );

  const handleFieldChange = (section, field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleRootChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResultadoText = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      resultado: {
        ...prev.resultado,
        [field]: value,
      },
    }));
  };

  const handleReceptorCheckbox = (field) => (event) => {
    const value = field === "presentaPoderSimple" ? event.target.value : event.target.checked;
    setFormData((prev) => ({
      ...prev,
      receptor: {
        ...prev.receptor,
        [field]: value,
      },
    }));
  };

  const handleMotivoChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      resultado: {
        ...prev.resultado,
        motivo: event.target.value,
      },
    }));
  };

  const handleInstrumentChange = (index, field, value) => {
    setFormData((prev) => {
      const instrumentos = prev.resultado.instrumentos.map((instrumento, idx) =>
        idx === index ? { ...instrumento, [field]: value } : instrumento
      );
      return {
        ...prev,
        resultado: { ...prev.resultado, instrumentos },
      };
    });
  };

  const addInstrument = () => {
    setFormData((prev) => ({
      ...prev,
      resultado: {
        ...prev.resultado,
        instrumentos: [...prev.resultado.instrumentos, emptyInstrument()],
      },
    }));
  };

  const removeInstrument = (index) => {
    setFormData((prev) => ({
      ...prev,
      resultado: {
        ...prev.resultado,
        instrumentos:
          prev.resultado.instrumentos.length === 1
            ? prev.resultado.instrumentos
            : prev.resultado.instrumentos.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleFortalezaChange = (ambito, field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      fortalezas: {
        ...prev.fortalezas,
        [ambito]: {
          ...prev.fortalezas[ambito],
          [field]: value,
        },
      },
    }));
  };

  const handleFechaEvaluacionChange = (index) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const fechasEvaluacion = prev.fechasEvaluacion.map((fecha, idx) => (idx === index ? value : fecha));
      return { ...prev, fechasEvaluacion };
    });
  };

  const buildPayload = () => {
    const instrumentos = formData.resultado.instrumentos
      .map((item) => ({
        nombre: item.nombre?.trim() || "",
        fecha_aplicacion: item.fecha || null,
      }))
      .filter((item) => item.nombre || item.fecha_aplicacion);

    const seguimientos = formData.fechasEvaluacion
      .filter((fecha) => fecha)
      .map((fecha) => ({ fecha_seguimiento: fecha, nota: "" }));

    const receptores = [
      {
        nombre_identidad: formData.receptor.nombreIdentidad || "",
        nombre_social: formData.receptor.nombreSocial || "",
        rut_pasaporte: formData.receptor.rut || "",
        telefono: formData.receptor.telefono || "",
        email: formData.receptor.email || "",
        relacion: formData.receptor.relacion || "",
        es_apoderado_titular: formData.receptor.apoderadoTitular,
        es_apoderado_suplente: formData.receptor.apoderadoSuplente,
        poder_simple: formData.receptor.presentaPoderSimple === "si",
        en_presencia_de: formData.receptor.enPresencia || "",
      },
    ].filter((receptor) =>
      Object.values({
        nombre_identidad: receptor.nombre_identidad,
        nombre_social: receptor.nombre_social,
        rut_pasaporte: receptor.rut_pasaporte,
        telefono: receptor.telefono,
        email: receptor.email,
        relacion: receptor.relacion,
        en_presencia_de: receptor.en_presencia_de,
      }).some((value) => typeof value === "string" && value.trim()) ||
      receptor.es_apoderado_titular ||
      receptor.es_apoderado_suplente
    );

    const estudianteId = Number(selectedEstudiante);
    const estudiante_id = Number.isNaN(estudianteId) ? selectedEstudiante : estudianteId;

    return {
      estudiante_id,
      fecha_entrega: formData.profesional.fechaEntrega || todayISO(),
      motivo: toBackendMotivo(formData.resultado.motivo),
      diagnostico_nee: formData.resultado.diagnostico || "",
      trabajo_colaborativo: formData.trabajoColaborativo || "",
      apoyos_requeridos_hogar: formData.apoyosHogar || "",
      acuerdos_compromisos: formData.acuerdosCompromisos || "",
      instrumentos,
      ambitos: [
        {
          ambito: "Pedagógico",
          fortalezas: formData.fortalezas.pedagogico.logros || "",
          necesidades_apoyo: formData.fortalezas.pedagogico.necesidades || "",
        },
        {
          ambito: "Social/Afectivo",
          fortalezas: formData.fortalezas.socialAfectivo.logros || "",
          necesidades_apoyo: formData.fortalezas.socialAfectivo.necesidades || "",
        },
      ],
      entrega: [
        {
          profesional: user?.id || null,
          nombre_identidad: formData.profesional.nombreIdentidad || "",
          nombre_social: formData.profesional.nombreSocial || "",
          rut: formData.profesional.rut || "",
          rol_cargo: formData.profesional.rolCargo || "",
          telefono: formData.profesional.telefono || "",
          email: formData.profesional.email || "",
        },
      ],
      receptores,
      seguimientos,
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEstudiante) {
      toast.warning("Selecciona un estudiante antes de guardar.");
      return;
    }

    const payload = buildPayload();
    setGuardando(true);
    try {
      let response;
      if (currentInforme?.id) {
        response = await actualizarInformeFamilia(currentInforme.id, payload);
        toast.success("Informe actualizado correctamente.");
      } else {
        response = await crearInformeFamilia(payload);
        toast.success("Informe registrado correctamente.");
      }
      if (response?.data) {
        setCurrentInforme(response.data);
        setFormData(mapInformeToState(response.data));
      } else {
        await loadInforme(estudianteActivo);
      }
    } catch (error) {
      console.error("[InformeFamilia] Error al guardar", error);
      const detail = error.response?.data?.detail || "No se pudo guardar el informe.";
      toast.error(detail);
    } finally {
      setGuardando(false);
    }
  };

  const loadInforme = async (estudiante) => {
    if (!estudiante) return;
    setLoadingInforme(true);
    try {
      const { data } = await listarInformesFamilia({
        estudiante: estudiante.id,
        ordering: "-fecha_entrega",
        page_size: 1,
      });
      const items = unwrapResults(data);
      const registro = items[0] ?? null;
      setCurrentInforme(registro);
      if (registro) {
        setFormData(mapInformeToState(registro));
      } else {
        setFormData(createBaseForm(estudiante, user));
      }
    } catch (error) {
      console.error("[InformeFamilia] Error cargando informe", error);
      toast.error("No pudimos recuperar un informe anterior para este estudiante.");
      setCurrentInforme(null);
      setFormData(createBaseForm(estudiante, user));
    } finally {
      setLoadingInforme(false);
    }
  };

  useEffect(() => {
    const fetchEstudiantes = async () => {
      setLoadingEstudiantes(true);
      try {
        const { data } = await listarEstudiantes();
        setEstudiantes(unwrapResults(data));
      } catch (error) {
        console.error("[InformeFamilia] Error cargando estudiantes", error);
        toast.error("No pudimos cargar la lista de estudiantes.");
      } finally {
        setLoadingEstudiantes(false);
      }
    };
    fetchEstudiantes();
  }, []);

  useEffect(() => {
    if (!selectedEstudiante) {
      setCurrentInforme(null);
      setFormData(createBaseForm(null, user));
      return;
    }
    if (estudianteActivo) {
      loadInforme(estudianteActivo);
    }
  }, [selectedEstudiante, estudianteActivo]);

  useEffect(() => {
    if (!user || currentInforme) return;
    setFormData((prev) => ({
      ...prev,
      profesional: hydrateProfesionalFromUser(prev.profesional, user),
    }));
  }, [user, currentInforme]);

  const handleReset = () => {
    if (!estudianteActivo) {
      setCurrentInforme(null);
      setFormData(createBaseForm(null, user));
      return;
    }
    setCurrentInforme(null);
    setFormData(createBaseForm(estudianteActivo, user));
  };

  const handleDescargarPdf = async () => {
    if (!currentInforme?.id) {
      toast.info("Debes guardar el informe antes de descargar el PDF.");
      return;
    }
    setDescargandoPdf(true);
    try {
      const response = await descargarPdfInformeFamilia(currentInforme.id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `informe_familia_${currentInforme.id}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("[InformeFamilia] Error descargando PDF", error);
      toast.error("No pudimos generar el PDF, intenta nuevamente.");
    } finally {
      setDescargandoPdf(false);
    }
  };

  return (
    <div className="container py-4">
      <form onSubmit={handleSubmit}>
        <header className="text-center mb-4">
          <p className="text-uppercase text-muted small mb-1">Evaluacion diagnostica integral</p>
          <h1 className="h4 fw-bold mb-1">Informe para la familia</h1>
          <p className="text-secondary mb-0">
            Segun el Decreto 170/2010 y reconociendo el rol fundamental de la familia en el proceso educativo,
            se entregan los resultados de la evaluacion del o la estudiante.
          </p>
        </header>

        <section className="card border-0 shadow-sm mb-4">
          <div className="card-body row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label">Selecciona a un estudiante</label>
              <select
                className="form-select"
                value={selectedEstudiante}
                disabled={loadingEstudiantes}
                onChange={(event) => setSelectedEstudiante(event.target.value)}
              >
                <option value="">Busca por nombre...</option>
                {estudiantes.map((estudiante) => (
                  <option key={estudiante.id} value={estudiante.id}>
                    {estudiante.nombres_apellidos} - {estudiante.curso?.nombre || "Sin curso"}
                  </option>
                ))}
              </select>
              <div className="form-text">
                {loadingEstudiantes
                  ? "Cargando estudiantes..."
                  : estudianteActivo
                    ? estudianteActivo.establecimiento?.nombre || "Establecimiento no registrado"
                    : "Aun no seleccionas un estudiante."}
              </div>
            </div>

            <div className="col-md-3">
              <p className="text-muted small mb-1">Estado del informe</p>
              <p className="mb-0 fw-semibold">
                {loadingInforme
                  ? "Buscando registro..."
                  : currentInforme
                    ? `Actualizado el ${new Date(currentInforme.fecha_entrega).toLocaleDateString()}`
                    : "Sin registros previos"}
              </p>
            </div>

            <div className="col-md-3 d-flex flex-wrap gap-2 justify-content-md-end">
              <button type="button" className="btn btn-outline-secondary" onClick={handleReset} disabled={guardando || loadingInforme}>
                Limpiar
              </button>
              <button type="submit" className="btn btn-primary" disabled={guardando || loadingInforme || !selectedEstudiante}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={handleDescargarPdf}
                disabled={!currentInforme?.id || descargandoPdf}
                title={!currentInforme?.id ? "Guarda el informe antes de generar el PDF" : "Descargar PDF"}
              >
                {descargandoPdf ? "Descargando..." : "Descargar PDF"}
              </button>
            </div>
          </div>
        </section>

        <fieldset disabled={loadingInforme || guardando} className="border-0 p-0">
          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Identificacion del estudiante</h2>
            </div>
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de identidad</label>
                <input type="text" className="form-control" value={formData.estudiante.nombreIdentidad} onChange={handleFieldChange("estudiante", "nombreIdentidad")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">RUT / IPE</label>
                <input type="text" className="form-control" value={formData.estudiante.rut} onChange={handleFieldChange("estudiante", "rut")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nombre social</label>
                <input type="text" className="form-control" value={formData.estudiante.nombreSocial} onChange={handleFieldChange("estudiante", "nombreSocial")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Fecha de nacimiento</label>
                <input type="date" className="form-control" value={formData.estudiante.fechaNacimiento} onChange={handleFieldChange("estudiante", "fechaNacimiento")} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Edad</label>
                <input type="text" className="form-control" value={formData.estudiante.edad} onChange={handleFieldChange("estudiante", "edad")} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Curso / Nivel</label>
                <input type="text" className="form-control" value={formData.estudiante.curso} onChange={handleFieldChange("estudiante", "curso")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Establecimiento</label>
                <input type="text" className="form-control" value={formData.estudiante.establecimiento} onChange={handleFieldChange("estudiante", "establecimiento")} />
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Identificacion del o la profesional que entrega el informe</h2>
            </div>
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de identidad</label>
                <input type="text" className="form-control" value={formData.profesional.nombreIdentidad} onChange={handleFieldChange("profesional", "nombreIdentidad")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Rut</label>
                <input type="text" className="form-control" value={formData.profesional.rut} onChange={handleFieldChange("profesional", "rut")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nombre social</label>
                <input type="text" className="form-control" value={formData.profesional.nombreSocial} onChange={handleFieldChange("profesional", "nombreSocial")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Rol o cargo</label>
                <input type="text" className="form-control" value={formData.profesional.rolCargo} onChange={handleFieldChange("profesional", "rolCargo")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Telefono</label>
                <input type="text" className="form-control" value={formData.profesional.telefono} onChange={handleFieldChange("profesional", "telefono")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Correo de contacto</label>
                <input type="email" className="form-control" value={formData.profesional.email} onChange={handleFieldChange("profesional", "email")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Fecha de entrega del informe</label>
                <input type="date" className="form-control" value={formData.profesional.fechaEntrega} onChange={handleFieldChange("profesional", "fechaEntrega")} />
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Quien recibe la informacion</h2>
            </div>
            <div className="card-body row g-3">
              <div className="col-md-6">
                <label className="form-label">Nombre de identidad</label>
                <input type="text" className="form-control" value={formData.receptor.nombreIdentidad} onChange={handleFieldChange("receptor", "nombreIdentidad")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Rut o Pasaporte</label>
                <input type="text" className="form-control" value={formData.receptor.rut} onChange={handleFieldChange("receptor", "rut")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Nombre social</label>
                <input type="text" className="form-control" value={formData.receptor.nombreSocial} onChange={handleFieldChange("receptor", "nombreSocial")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Telefono</label>
                <input type="text" className="form-control" value={formData.receptor.telefono} onChange={handleFieldChange("receptor", "telefono")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Correo de contacto</label>
                <input type="email" className="form-control" value={formData.receptor.email} onChange={handleFieldChange("receptor", "email")} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Relacion con el o la estudiante</label>
                <input type="text" className="form-control" value={formData.receptor.relacion} onChange={handleFieldChange("receptor", "relacion")} />
              </div>
              <div className="col-md-6 d-flex flex-wrap gap-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="titular" checked={formData.receptor.apoderadoTitular} onChange={handleReceptorCheckbox("apoderadoTitular")} />
                  <label className="form-check-label" htmlFor="titular">Apoderado titular</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="suplente" checked={formData.receptor.apoderadoSuplente} onChange={handleReceptorCheckbox("apoderadoSuplente")} />
                  <label className="form-check-label" htmlFor="suplente">Apoderado suplente</label>
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Presenta poder simple?</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="poderSimple" value="si" checked={formData.receptor.presentaPoderSimple === "si"} onChange={handleReceptorCheckbox("presentaPoderSimple")} />
                    <label className="form-check-label">Si</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="poderSimple" value="no" checked={formData.receptor.presentaPoderSimple === "no"} onChange={handleReceptorCheckbox("presentaPoderSimple")} />
                    <label className="form-check-label">No</label>
                  </div>
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">En presencia de (miembro de la familia, interprete, otro)</label>
                <input type="text" className="form-control" value={formData.receptor.enPresencia} onChange={handleFieldChange("receptor", "enPresencia")} />
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Resultados de la evaluacion</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Motivo de la evaluacion</label>
                <div className="d-flex gap-4">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="motivo" value="ingreso" checked={formData.resultado.motivo === "ingreso"} onChange={handleMotivoChange} />
                    <label className="form-check-label">Evaluacion de ingreso</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="motivo" value="reevaluacion" checked={formData.resultado.motivo === "reevaluacion"} onChange={handleMotivoChange} />
                    <label className="form-check-label">Reevaluacion fin año 2</label>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label fw-semibold mb-0">Instrumentos aplicados</label>
                  <button type="button" className="btn btn-outline-primary btn-sm" onClick={addInstrument}>Agregar fila</button>
                </div>
                <div className="table-responsive mt-2">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre (test, pautas, otros)</th>
                        <th>Fecha de evaluacion</th>
                        <th style={{ width: 110 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.resultado.instrumentos.map((instrumento, index) => (
                        <tr key={`instrumento-${index}`}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              value={instrumento.nombre}
                              onChange={(event) => handleInstrumentChange(index, "nombre", event.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="form-control"
                              value={instrumento.fecha}
                              onChange={(event) => handleInstrumentChange(index, "fecha", event.target.value)}
                            />
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-link text-danger px-2"
                              onClick={() => removeInstrument(index)}
                              disabled={formData.resultado.instrumentos.length === 1}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="form-label fw-semibold">Diagnostico y observaciones</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.resultado.diagnostico}
                  onChange={handleResultadoText("diagnostico")}
                  placeholder="Resume el resultado de la evaluacion y la decision tecnica"
                />
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Fortalezas y necesidades detectadas</h2>
            </div>
            <div className="card-body row g-4">
              <div className="col-lg-6">
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6 text-uppercase text-muted">Ambito pedagogico</h3>
                  <label className="form-label mt-2">Fortalezas y logros</label>
                  <textarea
                    className="form-control mb-3"
                    rows={3}
                    value={formData.fortalezas.pedagogico.logros}
                    onChange={handleFortalezaChange("pedagogico", "logros")}
                  />
                  <label className="form-label">Necesidades de apoyo</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.fortalezas.pedagogico.necesidades}
                    onChange={handleFortalezaChange("pedagogico", "necesidades")}
                  />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="border rounded-3 p-3 h-100">
                  <h3 className="h6 text-uppercase text-muted">Ambito social y afectivo</h3>
                  <label className="form-label mt-2">Fortalezas y logros</label>
                  <textarea
                    className="form-control mb-3"
                    rows={3}
                    value={formData.fortalezas.socialAfectivo.logros}
                    onChange={handleFortalezaChange("socialAfectivo", "logros")}
                  />
                  <label className="form-label">Necesidades de apoyo</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.fortalezas.socialAfectivo.necesidades}
                    onChange={handleFortalezaChange("socialAfectivo", "necesidades")}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Trabajo colaborativo y acuerdos</h2>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Trabajo colaborativo con la comunidad educativa</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.trabajoColaborativo}
                  onChange={handleRootChange("trabajoColaborativo")}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Apoyos requeridos en el hogar</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.apoyosHogar}
                  onChange={handleRootChange("apoyosHogar")}
                />
              </div>
              <div>
                <label className="form-label">Acuerdos y compromisos</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.acuerdosCompromisos}
                  onChange={handleRootChange("acuerdosCompromisos")}
                />
              </div>
            </div>
          </section>

          <section className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h2 className="h6 mb-0">Seguimiento y proximas evaluaciones</h2>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {formData.fechasEvaluacion.map((fecha, index) => (
                  <div className="col-md-4" key={`seguimiento-${index}`}>
                    <label className="form-label">Evaluacion {index + 1}</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fecha}
                      onChange={handleFechaEvaluacionChange(index)}
                    />
                  </div>
                ))}
              </div>
              <p className="form-text mt-3">
                Estas fechas ayudan a proyectar el plan de acompanamiento familiar y los hitos de retroalimentacion.
              </p>
            </div>
          </section>
        </fieldset>
      </form>
    </div>
  );
}
