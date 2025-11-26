// src/paginas/Pie/RegistroPIE.jsx
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../contexto/AuthContext";
import { listarCursos } from "../../servicios/cursos";
import { registrosPIEApi } from "../../servicios/pie";
import { getUsuarios } from "../../servicios/usuarios";

const periodosImplementacion = ["1° Período", "2° Período", "3° Período"];

const createRegistroPeriodo = (titulo) => ({
  titulo,
  filas: Array.from({ length: 4 }, () => ({ acciones: "", evaluacion: "" })),
});

const createActividadRegistro = () => ({
  fecha: "",
  participantes: Array.from({ length: 5 }, () => ({
    nombre: "",
    identificacion: "",
    contacto: "",
    firma: "",
  })),
  objetivo: "",
  actividad: "",
  acuerdos: "",
  resultados: "",
});

const createActaParticipante = () => ({
  nombre: "",
  rol: "",
  rut: "",
  telefono: "",
  firma: "",
});

const PAYLOAD_VERSION = "REGISTRO_PIE_V1";

const deepClone = (value) => {
  if (value === null || value === undefined) {
    return value ?? null;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
};

const hydrateOrDefault = (value, factory) => {
  if (value && typeof value === "object") {
    return deepClone(value);
  }
  return factory();
};

const docenteColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "asignatura", label: "Núcleo, asignatura y/o módulo" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const especialistaColumns = [
  { key: "nombre", label: "Nombre" },
  { key: "especialidad", label: "Especialidad" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const coordinacionColumns = [
  { key: "label", label: "" },
  { key: "nombre", label: "Nombre" },
  { key: "telefono", label: "Teléfono" },
  { key: "correo", label: "Correo Electrónico" },
];

const coordinacionRows = [
  { key: "establecimiento", label: "En el establecimiento" },
  { key: "daem", label: "En el DAEM", helper: "(si el PIE es comunal)" },
  { key: "redes", label: "Con Redes de Apoyo" },
];

const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const semesterConfigs = [
  { key: "primer", label: "Primer Semestre", months: ["Marzo", "Abril", "Mayo", "Junio", "Julio"] },
  {
    key: "segundo",
    label: "Segundo Semestre",
    months: ["Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  },
];

const createRowFromColumns = (columns) => {
  const base = columns.reduce((acc, column) => {
    if (column.key !== "label") acc[column.key] = "";
    return acc;
  }, {});
  base.usuario_id = null;
  return base;
};

const ensureRowArray = (rows, minLength, columns) => {
  const normalized = Array.isArray(rows)
    ? rows.map((row) => ({ ...createRowFromColumns(columns), ...row, usuario_id: row?.usuario_id ?? null }))
    : [];
  while (normalized.length < minLength) {
    normalized.push(createRowFromColumns(columns));
  }
  return normalized;
};

const createCoordinacionRow = (config) => ({
  key: config.key,
  label: config.label,
  helper: config.helper || "",
  nombre: "",
  telefono: "",
  correo: "",
});

const ensureCoordinacionRows = (rows) => {
  const map = Array.isArray(rows)
    ? rows.reduce((acc, row) => {
        if (row?.key) acc[row.key] = row;
        return acc;
      }, {})
    : {};
  return coordinacionRows.map((config) => ({
    ...createCoordinacionRow(config),
    ...(map[config.key] || {}),
  }));
};

const createCalendarEntry = () => ({ fecha: "", inicio: "", termino: "" });

const createCalendar = (months) =>
  daysOfWeek.reduce((acc, day) => {
    acc[day] = months.reduce((innerAcc, month) => {
      innerAcc[month] = createCalendarEntry();
      return innerAcc;
    }, {});
    return acc;
  }, {});

const ensureCalendar = (calendar, months) => {
  const base = createCalendar(months);
  const safe = calendar || {};
  return Object.keys(base).reduce((acc, day) => {
    acc[day] = months.reduce((monthAcc, month) => {
      monthAcc[month] = {
        ...createCalendarEntry(),
        ...(safe?.[day]?.[month] || {}),
      };
      return monthAcc;
    }, {});
    return acc;
  }, {});
};

const createAgreementRow = () => ({ reunion: "", asistentes: "", acuerdos: "" });

const ensureAgreements = (rows, min = 3) => {
  const normalized = Array.isArray(rows)
    ? rows.map((row) => ({ ...createAgreementRow(), ...row }))
    : [];
  while (normalized.length < min) {
    normalized.push(createAgreementRow());
  }
  return normalized;
};

const formatUsuarioNombre = (usuario) => {
  if (!usuario) return "";
  const nombreCompuesto =
    usuario.nombre_completo ||
    [usuario.first_name, usuario.last_name].filter(Boolean).join(" ").trim();
  return nombreCompuesto || usuario.username || usuario.email || `Usuario #${usuario.id}`;
};

const pickTelefono = (usuario) =>
  usuario?.telefono || usuario?.phone || usuario?.phone_number || usuario?.celular || "";

const createMeetingSection = (months) => ({
  calendario: createCalendar(months),
  acuerdos: ensureAgreements([], 3),
});

const ensureMeetingSection = (section, months) => ({
  calendario: ensureCalendar(section?.calendario, months),
  acuerdos: ensureAgreements(section?.acuerdos, 1),
});

const createEquipoAulaDefault = () => ({
  docentes: ensureRowArray([], 2, docenteColumns),
  especialistas: ensureRowArray([], 2, especialistaColumns),
  asistentes: ensureRowArray([], 2, especialistaColumns),
  coordinacion: ensureCoordinacionRows([]),
  reuniones: semesterConfigs.reduce((acc, semester) => {
    acc[semester.key] = createMeetingSection(semester.months);
    return acc;
  }, {}),
});

const ensureEquipoAula = (value) => ({
  ...createEquipoAulaDefault(),
  ...value,
  docentes: ensureRowArray(value?.docentes, value?.docentes?.length || 2, docenteColumns),
  especialistas: ensureRowArray(
    value?.especialistas,
    value?.especialistas?.length || 2,
    especialistaColumns
  ),
  asistentes: ensureRowArray(value?.asistentes, value?.asistentes?.length || 2, especialistaColumns),
  coordinacion: ensureCoordinacionRows(value?.coordinacion),
  reuniones: semesterConfigs.reduce((acc, semester) => {
    acc[semester.key] = ensureMeetingSection(value?.reuniones?.[semester.key], semester.months);
    return acc;
  }, {}),
});

const createPlanificacionDefault = () => ({
  panorama: {
    estilos: "",
    fortalezas: "",
    necesidades: "",
  },
  estrategias: [
    {
      estrategia: "",
      ambito: "",
      periodo: "",
      criterios: "",
    },
  ],
  colaboraciones: {
    entreProfesores: "",
    coensenanza: "",
    profesoresAsistentes: "",
    entreEstudiantes: "",
    conFamilia: "",
    conComunidad: "",
    observaciones: "",
  },
  apoyos: [
    {
      ambito: "",
      horasRegular: "",
      horasFuera: "",
      tiposApoyo: "",
    },
  ],
  diversidad: {
    criterios: [
      { key: "presentacion", selecciones: [], estrategias: "", como: "", quienes: "" },
      { key: "ejecucion", selecciones: [], estrategias: "", como: "", quienes: "" },
      { key: "participacion", selecciones: [], estrategias: "", como: "", quienes: "" },
      { key: "otro", selecciones: [], estrategias: "", como: "", quienes: "" },
    ],
    ajustes: {
      selecciones: [],
      como: "",
      quienes: "",
    },
    otrasEstrategias: "",
    observaciones: "",
  },
  adecuaciones: [
    { key: "acceso", tipo: "De acceso", seleccionado: false, ambito: "", estrategias: "", estudiantes: "" },
    {
      key: "objetivos",
      tipo: "A los objetivos de aprendizaje en el caso de la educación básica.",
      seleccionado: false,
      ambito: "",
      estrategias: "",
      estudiantes: "",
    },
    { key: "planEstudio", tipo: "Al plan de estudio (básica)", seleccionado: false, ambito: "", estrategias: "", estudiantes: "" },
    {
      key: "paci",
      tipo: "Plan de adecuación curricular individual (PACI) (Básica)",
      seleccionado: false,
      ambito: "",
      estrategias: "",
      estudiantes: "",
    },
  ],
  evaluacionesDiversidad: [
    { key: "proceso", titulo: "Evaluación de Proceso y avance;", estrategias: "" },
    {
      key: "anual",
      titulo:
        "Evaluación Anual de logros de aprendizaje; de evolución del déficit o trastorno, de egreso o de continuidad en el PIE.",
      estrategias: "",
    },
  ],
  planApoyo: [
    {
      estudiante: "",
      apoyosSeleccionados: [],
      otroApoyo: "",
      horarioDia: "",
      horarioHora: "",
      fechaInicio: "",
      fechaTermino: "",
      observaciones: "",
    },
  ],
  familiaComunidad: {
    filas: [
      { key: "planificacion", titulo: "En la planificación", editableTitulo: false, descripcion: "", seguimiento: "", evaluacion: "" },
      { key: "proceso", titulo: "En el proceso de aprendizaje", editableTitulo: false, descripcion: "", seguimiento: "", evaluacion: "" },
      { key: "evaluacion", titulo: "En la evaluación", editableTitulo: false, descripcion: "", seguimiento: "", evaluacion: "" },
      { key: "otras", titulo: "Otras acciones", editableTitulo: false, descripcion: "", seguimiento: "", evaluacion: "" },
      { key: "extra-1", titulo: "", editableTitulo: true, descripcion: "", seguimiento: "", evaluacion: "" },
      { key: "extra-2", titulo: "", editableTitulo: true, descripcion: "", seguimiento: "", evaluacion: "" },
    ],
    observaciones: "",
  },
});

const createRegistroImplementacionDefault = () => ({
  periodos: periodosImplementacion.map((titulo) => createRegistroPeriodo(titulo)),
  accionesDocente: {
    observaciones: "",
    filas: Array.from({ length: 6 }, () => ({
      fecha: "",
      horas: "",
      actividades: "",
      docente: "",
    })),
  },
  registroApoyos: {
    estudiantes: Array.from({ length: 5 }, () => ""),
    objetivos: "",
    filas: Array.from({ length: 6 }, () => ({
      fecha: "",
      horas: "",
      lugar: "",
      actividades: "",
      profesional: "",
    })),
  },
  logrosAprendizaje: {
    filas: Array.from({ length: 7 }, () => ({
      estudiante: "",
      logros: "",
      comentarios: "",
    })),
  },
});

const createActividadesDefault = () => ({
  familia: createActividadRegistro(),
  comunidad: createActividadRegistro(),
});

const createActaDefault = () => ({
  fecha: "",
  participantes: Array.from({ length: 6 }, () => createActaParticipante()),
  motivo: "",
  acuerdos: "",
  compromisos: "",
});

/**
 * Registro PIE
 * - Orquesta pestañas y delega persistencia real al backend via registrosPIEApi
 * - Mantiene estados iniciales vacíos mientras no exista un registro cargado
 */
export default function RegistroPIE() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [selectedCurso, setSelectedCurso] = useState("");
  const [formMeta, setFormMeta] = useState({ periodo: "", observaciones: "" });
  const [registroActual, setRegistroActual] = useState(null);
  const [loadingCursos, setLoadingCursos] = useState(true);
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const [equipoAula, setEquipoAula] = useState(createEquipoAulaDefault);
  const [planificacion, setPlanificacion] = useState(createPlanificacionDefault);
  const [registroImplementacion, setRegistroImplementacion] = useState(createRegistroImplementacionDefault);
  const [actividadesComunidad, setActividadesComunidad] = useState(createActividadesDefault);
  const [actaReuniones, setActaReuniones] = useState(createActaDefault);

  const buildFullPayload = useCallback(() => ({
    datos_equipo: deepClone(equipoAula),
    datos_planificacion: deepClone(planificacion),
    datos_implementacion: deepClone(registroImplementacion),
    datos_actividades: deepClone(actividadesComunidad),
    datos_acta: deepClone(actaReuniones),
  }), [equipoAula, planificacion, registroImplementacion, actividadesComunidad, actaReuniones]);

  const resetSecciones = useCallback(() => {
    setEquipoAula(createEquipoAulaDefault());
    setPlanificacion(createPlanificacionDefault());
    setRegistroImplementacion(createRegistroImplementacionDefault());
    setActividadesComunidad(createActividadesDefault());
    setActaReuniones(createActaDefault());
  }, []);

  const hydrateRegistro = useCallback(
    (registro) => {
      if (!registro) {
        setRegistroActual(null);
        setFormMeta({ periodo: "", observaciones: "" });
        resetSecciones();
        return;
      }
      setRegistroActual(registro);
      setFormMeta({
        periodo: registro.periodo || "",
        observaciones: registro.observaciones_generales || "",
      });
      setEquipoAula(hydrateOrDefault(registro.datos_equipo, createEquipoAulaDefault));
      setPlanificacion(hydrateOrDefault(registro.datos_planificacion, createPlanificacionDefault));
      setRegistroImplementacion(
        hydrateOrDefault(registro.datos_implementacion, createRegistroImplementacionDefault)
      );
      setActividadesComunidad(hydrateOrDefault(registro.datos_actividades, createActividadesDefault));
      setActaReuniones(hydrateOrDefault(registro.datos_acta, createActaDefault));
    },
    [resetSecciones]
  );

  useEffect(() => {
    let activo = true;
    const fetchCursos = async () => {
      setLoadingCursos(true);
      try {
        const { data } = await listarCursos({ ordering: "nombre", page_size: 200 });
        if (!activo) return;
        const items = Array.isArray(data) ? data : data?.results ?? [];
        setCursos(items);
      } catch (error) {
        if (activo) {
          toast.error("No se pudieron cargar los cursos disponibles.");
        }
      } finally {
        if (activo) setLoadingCursos(false);
      }
    };
    fetchCursos();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const fetchUsuarios = async () => {
      setLoadingUsuarios(true);
      try {
        const { data } = await getUsuarios({ ordering: "first_name", page_size: 500 });
        if (!activo) return;
        const items = Array.isArray(data) ? data : data?.results ?? [];
        setUsuarios(items);
      } catch (error) {
        if (activo) {
          toast.error("No se pudieron cargar los usuarios disponibles.");
        }
      } finally {
        if (activo) setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedCurso) {
      hydrateRegistro(null);
      return;
    }
    let activo = true;
    const fetchRegistro = async () => {
      setLoadingRegistro(true);
      try {
        const { data } = await registrosPIEApi.list({
          curso: selectedCurso,
          page_size: 1,
          ordering: "-fecha_creacion",
        });
        if (!activo) return;
        const items = Array.isArray(data) ? data : data?.results ?? [];
        hydrateRegistro(items[0] ?? null);
      } catch (error) {
        if (activo) {
          toast.error("No se pudo recuperar el registro PIE del curso seleccionado.");
          hydrateRegistro(null);
        }
      } finally {
        if (activo) setLoadingRegistro(false);
      }
    };
    fetchRegistro();
    return () => {
      activo = false;
    };
  }, [selectedCurso, hydrateRegistro]);

  const persistRegistro = useCallback(
    async (extraPayload = {}, successMessage = "Registro guardado correctamente.") => {
      if (!selectedCurso) {
        toast.warning("Selecciona un curso antes de guardar.");
        return;
      }
      setGuardando(true);
      try {
        const basePayload = {
          curso_id: selectedCurso,
          periodo: formMeta.periodo || null,
          observaciones_generales: formMeta.observaciones || null,
          payload_version: PAYLOAD_VERSION,
          ...extraPayload,
        };
        const response = registroActual?.id
          ? await registrosPIEApi.update(registroActual.id, basePayload)
          : await registrosPIEApi.create({
              ...basePayload,
              responsable_id: user?.id || null,
            });
        hydrateRegistro(response.data);
        toast.success(successMessage);
      } catch (error) {
        const detail =
          error.response?.data?.detail || error.response?.data?.message || error.message ||
          "Ocurrió un problema al guardar.";
        toast.error(detail);
      } finally {
        setGuardando(false);
      }
    },
    [selectedCurso, formMeta, registroActual, user, hydrateRegistro]
  );

  const handleSectionSave = useCallback(
    (fieldName, payload, successMessage) => {
      const message = successMessage || "Registro guardado correctamente.";
      if (!fieldName) return persistRegistro({}, message);
      return persistRegistro({ [fieldName]: deepClone(payload ?? {}) }, message);
    },
    [persistRegistro]
  );

  const handleMetaChange = (field, value) => {
    setFormMeta((prev) => ({ ...prev, [field]: value }));
  };

  const ultimoGuardado = registroActual?.actualizado_en
    ? new Date(registroActual.actualizado_en).toLocaleString()
    : null;

  const handleDescargarPdf = useCallback(async () => {
    if (!registroActual?.id) {
      toast.warning("Aún no hay un registro guardado para descargar.");
      return;
    }
    setDescargandoPdf(true);
    try {
      const response = await registrosPIEApi.downloadPdf(registroActual.id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `registro_pie_${registroActual.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const detail = error.response?.data?.detail || error.message || "No se pudo descargar el PDF.";
      toast.error(detail);
    } finally {
      setDescargandoPdf(false);
    }
  }, [registroActual]);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Registro PIE</h2>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="form-label">Curso</label>
              <select
                className="form-select"
                value={selectedCurso}
                onChange={(event) => setSelectedCurso(event.target.value)}
                disabled={loadingCursos || guardando}
              >
                <option value="">{loadingCursos ? "Cargando cursos..." : "Selecciona un curso"}</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nombre}
                    {curso.establecimiento?.nombre ? ` – ${curso.establecimiento.nombre}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-lg-3 col-md-6">
              <label className="form-label">Período</label>
              <input
                type="text"
                className="form-control"
                value={formMeta.periodo}
                onChange={(event) => handleMetaChange("periodo", event.target.value)}
                disabled={!selectedCurso || guardando}
              />
            </div>
            <div className="col-lg-3 col-md-6">
              <label className="form-label">Último guardado</label>
              <p className="form-control-plaintext mb-0">
                {loadingRegistro ? "Cargando..." : ultimoGuardado || "Sin registros"}
              </p>
            </div>
            <div className="col-lg-3 col-md-6 d-flex gap-2 justify-content-end flex-wrap">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (guardando) return;
                  const payload = buildFullPayload();
                  persistRegistro(payload, registroActual ? "Registro actualizado" : "Registro creado");
                }}
                disabled={!selectedCurso || guardando || loadingRegistro}
              >
                {registroActual ? "Actualizar" : "Crear"}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleDescargarPdf}
                disabled={!registroActual?.id || guardando || descargandoPdf || loadingRegistro}
              >
                {descargandoPdf ? "Generando PDF..." : "Descargar PDF"}
              </button>
            </div>
            <div className="col-12">
              <label className="form-label">Observaciones generales</label>
              <textarea
                className="form-control"
                rows={2}
                value={formMeta.observaciones}
                onChange={(event) => handleMetaChange("observaciones", event.target.value)}
                disabled={!selectedCurso || guardando}
              />
            </div>
            {user && (
              <div className="col-12">
                <small className="text-muted">
                  Responsable: {user.first_name || user.last_name ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() : user.email}
                </small>
              </div>
            )}
          </div>
        </div>
      </div>

      {!selectedCurso && !loadingCursos && (
        <div className="alert alert-info">Selecciona un curso para comenzar a completar el Registro PIE.</div>
      )}

      {selectedCurso && loadingRegistro && (
        <div className="alert alert-secondary">Cargando información del registro, espera un momento…</div>
      )}

      {selectedCurso ? (
        <div className="d-flex flex-column gap-4">
          <EquipoAulaSection
            registroId={registroActual?.id || null}
            value={equipoAula}
            setValue={setEquipoAula}
            usuarios={usuarios}
            usuariosCargando={loadingUsuarios}
            onSave={(payload) => {
              if (guardando) return;
              handleSectionSave("datos_equipo", payload, "Equipo de aula actualizado.");
            }}
          />

          <PlanificacionSection
            registroId={registroActual?.id || null}
            value={planificacion}
            setValue={setPlanificacion}
            onSave={(payload) => {
              if (guardando) return;
              handleSectionSave("datos_planificacion", payload, "Planificación guardada.");
            }}
          />

          <TrabajoColaborativoSection
            value={registroImplementacion}
            setValue={setRegistroImplementacion}
            onSave={(payload) => {
              if (guardando) return;
              handleSectionSave("datos_implementacion", payload, "Implementación actualizada.");
            }}
          />

          <ActividadComunidadSection
            value={actividadesComunidad}
            setValue={setActividadesComunidad}
            onSave={(payload) => {
              if (guardando) return;
              handleSectionSave("datos_actividades", payload, "Actividades con la comunidad guardadas.");
            }}
          />

          <LogrosSection
            value={actaReuniones}
            setValue={setActaReuniones}
            onSave={(payload) => {
              if (guardando) return;
              handleSectionSave("datos_acta", payload, "Acta de reuniones guardada.");
            }}
          />
        </div>
      ) : (
        <div className="alert alert-light border">Selecciona un curso para habilitar las secciones.</div>
      )}
    </div>
  );
}

function EquipoAulaSection({ value, setValue, onSave, usuarios = [], usuariosCargando = false }) {
  const [activeBlock, setActiveBlock] = useState("docentes");
  const [saving, setSaving] = useState(false);
  const data = ensureEquipoAula(value);

  const handleSave = async () => {
    if (saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error("No se pudo guardar la sección Equipo de Aula.", error);
    } finally {
      setSaving(false);
    }
  };

  const updateValue = (updater) => {
    setValue((prev) => updater(ensureEquipoAula(prev)));
  };

  const handleBlockCellChange = (sectionKey, rowIdx, field, newValue) => {
    if (field === "label") return;
    updateValue((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((row, idx) =>
        idx === rowIdx ? { ...row, [field]: newValue } : row
      ),
    }));
  };

  const handleAddRow = (sectionKey, columns) => {
    updateValue((current) => ({
      ...current,
      [sectionKey]: [...current[sectionKey], createRowFromColumns(columns)],
    }));
  };

  const handleRemoveRow = (sectionKey) => {
    updateValue((current) => {
      if ((current[sectionKey]?.length || 0) <= 1) return current;
      return { ...current, [sectionKey]: current[sectionKey].slice(0, -1) };
    });
  };

  const handleUsuarioSelect = (sectionKey, rowIdx, usuarioId) => {
    const usuario = usuarios.find((item) => String(item.id) === String(usuarioId));
    updateValue((current) => ({
      ...current,
      [sectionKey]: current[sectionKey].map((row, idx) => {
        if (idx !== rowIdx) return row;
        const updated = { ...row, usuario_id: usuario ? usuario.id : null };
        if (usuario) {
          updated.nombre = formatUsuarioNombre(usuario);
          if (typeof row.telefono !== "undefined") {
            updated.telefono = pickTelefono(usuario) || row.telefono;
          }
          if (typeof row.correo !== "undefined") {
            updated.correo = usuario.email || row.correo;
          }
        } else if (!usuarioId) {
          updated.usuario_id = null;
        }
        return updated;
      }),
    }));
  };

  const handleCalendarChange = (semesterKey, day, month, field, newValue) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            calendario: {
              ...semester.calendario,
              [day]: {
                ...semester.calendario[day],
                [month]: {
                  ...semester.calendario[day][month],
                  [field]: newValue,
                },
              },
            },
          },
        },
      };
    });
  };

  const handleAgreementChange = (semesterKey, index, field, newValue) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      const updated = semester.acuerdos.map((row, idx) =>
        idx === index ? { ...row, [field]: newValue } : row
      );
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: { ...semester, acuerdos: updated },
        },
      };
    });
  };

  const handleAgreementAdd = (semesterKey) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            acuerdos: [...semester.acuerdos, createAgreementRow()],
          },
        },
      };
    });
  };

  const handleAgreementRemove = (semesterKey) => {
    updateValue((current) => {
      const semester = current.reuniones[semesterKey];
      if (semester.acuerdos.length <= 1) return current;
      return {
        ...current,
        reuniones: {
          ...current.reuniones,
          [semesterKey]: {
            ...semester,
            acuerdos: semester.acuerdos.slice(0, -1),
          },
        },
      };
    });
  };

  const blocks = [
    {
      key: "docentes",
      title: "Docente(s) de educación regular del curso",
      columns: docenteColumns,
      addable: true,
    },
    { key: "especialistas", title: "Profesores especializados", columns: especialistaColumns, addable: true },
    {
      key: "asistentes",
      title: "Profesionales especializados asistentes de la educación",
      columns: especialistaColumns,
      addable: true,
    },
    {
      key: "coordinacion",
      title: "Coordinación del Programa",
      columns: coordinacionColumns,
      addable: false,
    },
  ];

  const currentBlock = blocks.find((block) => block.key === activeBlock) ?? blocks[0];
  const currentRows = data[currentBlock.key] || [];

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
            <h4 className="fw-bold mb-0">
              I EQUIPO DE AULA <sup>1</sup>
            </h4>
            <p className="mb-0 text-secondary">1.- Identificación del Equipo de Aula</p>
          </div>
          <div className="d-flex gap-2 align-items-start flex-wrap">
            <div className="d-flex gap-2">
              <div className="rounded-2 bg-primary" style={{ width: 48, height: 48 }} />
              <div className="rounded-2 bg-info" style={{ width: 48, height: 48 }} />
            </div>
            {onSave && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Guardando..." : "Guardar sección"}
              </button>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-lg-4 col-xl-3 mb-3">
            <div className="list-group shadow-sm">
              {blocks.map((block) => (
                <button
                  key={block.key}
                  type="button"
                  className={`list-group-item list-group-item-action ${activeBlock === block.key ? "active" : ""}`}
                  onClick={() => setActiveBlock(block.key)}
                >
                  {block.title}
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-8 col-xl-9">
            <TableBlock
              title={currentBlock.title}
              columns={currentBlock.columns}
              rows={currentRows}
              onCellChange={(rowIdx, field, newValue) =>
                handleBlockCellChange(currentBlock.key, rowIdx, field, newValue)
              }
              onAddRow={() => handleAddRow(currentBlock.key, currentBlock.columns)}
              onRemoveRow={() => handleRemoveRow(currentBlock.key)}
              showAddButton={currentBlock.addable}
              showRemoveButton={currentBlock.addable && currentRows.length > 1}
              usuarios={usuarios}
              usuariosCargando={usuariosCargando}
              onSelectUsuario={(rowIdx, userId) =>
                handleUsuarioSelect(currentBlock.key, rowIdx, userId)
              }
            />
          </div>
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
        <h4 className="fw-bold mb-0">
          2.- Reuniones de Coordinación del Equipo de Aula <sup>2</sup>
        </h4>
        <p className="text-secondary mb-4" style={{ maxWidth: 720 }}>
          Es importante planificar las reuniones, definir los tiempos, el tema y responsables, además de registrar la asistencia y los acuerdos
          para dar seguimiento a los compromisos.
        </p>

        {semesterConfigs.map((semester) => (
          <div key={semester.key} className="mb-5">
            <p className="text-primary fw-semibold mb-2">{semester.label}</p>
            <CalendarTable
              months={semester.months}
              values={data.reuniones[semester.key].calendario}
              onCellChange={(day, month, field, newValue) =>
                handleCalendarChange(semester.key, day, month, field, newValue)
              }
            />
            <AgreementsTable
              rows={data.reuniones[semester.key].acuerdos}
              onAdd={() => handleAgreementAdd(semester.key)}
              onRemove={() => handleAgreementRemove(semester.key)}
              onChange={(index, field, newValue) =>
                handleAgreementChange(semester.key, index, field, newValue)
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}

const TableBlock = ({
  title,
  columns,
  rows,
  onCellChange,
  onAddRow,
  onRemoveRow,
  showAddButton,
  showRemoveButton,
  usuarios = [],
  usuariosCargando = false,
  onSelectUsuario,
}) => (
  <div className="mb-4">
    <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <h6 className="fw-semibold text-primary mb-0">{title}</h6>
      <div className="d-flex gap-2 flex-wrap">
        {showRemoveButton && (
          <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRemoveRow}>
            Quitar fila
          </button>
        )}
        {showAddButton && (
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAddRow}>
            Agregar fila
          </button>
        )}
      </div>
    </div>
    <div className="table-responsive">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            {columns.map((column) => (
              <th key={`${title}-${column.key}`}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.key || `${title}-${rowIdx}`}>
              {columns.map((column) => (
                <td key={`${column.key}-${rowIdx}`}>
                  {column.key === "label" ? (
                    <div className="fw-semibold">
                      {row.label}
                      {row.helper && <div className="small text-muted">{row.helper}</div>}
                    </div>
                  ) : column.key === "nombre" ? (
                    <div className="d-flex flex-column gap-2">
                      <select
                        className="form-select form-select-sm"
                        value={row.usuario_id ?? ""}
                        onChange={(e) => onSelectUsuario?.(rowIdx, e.target.value || null)}
                        disabled={usuariosCargando && !usuarios.length}
                      >
                        <option value="">
                          {usuariosCargando ? "Cargando usuarios..." : "Seleccionar usuario"}
                        </option>
                        {usuarios.map((usuario) => (
                          <option key={`usuario-${usuario.id}`} value={usuario.id}>
                            {formatUsuarioNombre(usuario)}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        className="form-control form-control-sm border-0 shadow-none"
                        placeholder={column.label}
                        value={row[column.key] || ""}
                        onChange={(e) => onCellChange(rowIdx, column.key, e.target.value)}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm border-0 shadow-none"
                      placeholder={column.label}
                      value={row[column.key] || ""}
                      onChange={(e) => onCellChange(rowIdx, column.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const CalendarTable = ({ months, values, onCellChange }) => (
  <div className="table-responsive mb-3">
    <table className="table table-bordered align-middle mb-0">
      <thead className="table-light">
        <tr>
          <th style={{ width: 140 }}></th>
          {months.map((month) => (
            <th key={month} colSpan={2} className="text-center">
              {month}
            </th>
          ))}
        </tr>
        <tr>
          <th></th>
          {months.map((month) => (
            <React.Fragment key={`${month}-headers`}>
              <th>Fecha</th>
              <th>Horario</th>
            </React.Fragment>
          ))}
        </tr>
      </thead>
      <tbody>
        {daysOfWeek.map((day) => (
          <tr key={day}>
            <td className="fw-semibold">{day}</td>
            {months.map((month) => (
              <React.Fragment key={`${day}-${month}`}>
                <td>
                  <input
                    type="date"
                    className="form-control form-control-sm border-0 shadow-none"
                    value={values?.[day]?.[month]?.fecha || ""}
                    onChange={(e) => onCellChange(day, month, "fecha", e.target.value)}
                  />
                </td>
                <td>
                  <div className="d-flex flex-column flex-md-row gap-2">
                    {(["inicio", "termino"]).map((field) => (
                      <div key={`${field}-${day}-${month}`} className="flex-grow-1">
                        <label className="form-label text-muted mb-1 small text-capitalize" htmlFor={`${field}-${day}-${month}`}>
                          {field === "inicio" ? "Inicio" : "Término"}
                        </label>
                        <input
                          id={`${field}-${day}-${month}`}
                          type="time"
                          className="form-control form-control-sm"
                          value={values?.[day]?.[month]?.[field] || ""}
                          onChange={(e) => onCellChange(day, month, field, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </td>
              </React.Fragment>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AgreementsTable = ({ rows, onAdd, onRemove, onChange }) => (
  <div className="mb-4">
    <div className="d-flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
      <h6 className="fw-semibold text-primary mb-0">Registro de reuniones</h6>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={onRemove}>
          Quitar fila
        </button>
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onAdd}>
          Agregar fila
        </button>
      </div>
    </div>
    <div className="table-responsive">
      <table className="table table-bordered align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>REUNIÓN/FECHA</th>
            <th>ASISTENTES</th>
            <th>ACUERDOS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`acuerdo-${idx}`}>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 shadow-none"
                  placeholder="Detalle de la reunión"
                  value={row.reunion || ""}
                  onChange={(e) => onChange(idx, "reunion", e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="form-control form-control-sm border-0 shadow-none"
                  placeholder="Participantes"
                  value={row.asistentes || ""}
                  onChange={(e) => onChange(idx, "asistentes", e.target.value)}
                />
              </td>
              <td>
                <textarea
                  className="form-control form-control-sm border-0 shadow-none"
                  rows={1}
                  placeholder="Acuerdos alcanzados"
                  value={row.acuerdos || ""}
                  onChange={(e) => onChange(idx, "acuerdos", e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const panoramaFields = [
  { name: "estilos", label: "Estilos y modos de aprendizaje del curso" },
  { name: "fortalezas", label: "Fortalezas del curso" },
  { name: "necesidades", label: "Necesidades de apoyo del curso" },
];

const strategyColumns = [
  { name: "estrategia", label: "Estrategia" },
  { name: "ambito", label: "Ámbito o asignatura donde se aplicará" },
  { name: "periodo", label: "Periodo de tiempo en que se aplicará" },
  { name: "criterios", label: "Criterios para la evaluación de la estrategia" },
];

const collaborationRows = [
  {
    key: "entreProfesores",
    label: "Entre profesores",
    helper: "(educación especial y profesor regular)",
  },
  {
    key: "coensenanza",
    label: "Co-enseñanza",
  },
  {
    key: "profesoresAsistentes",
    label: "Entre profesores y asistentes de la educación",
    helper: "(psicólogos, fonoaudiólogos, auxiliares, intérpretes, etc.)",
  },
  {
    key: "entreEstudiantes",
    label: "Entre estudiantes",
    helper: "(Ej: Aprendizaje colaborativo)",
  },
  {
    key: "conFamilia",
    label: "Con la familia y entre familias",
  },
  {
    key: "conComunidad",
    label: "Con la comunidad",
    helper: "(otras escuelas, centros culturales, servicios, etc.)",
  },
];

const supportColumns = [
  { name: "ambito", label: "Ámbito, asignatura y/o módulo de aprendizaje" },
  { name: "horasRegular", label: "Horas de apoyo en aula regular" },
  { name: "horasFuera", label: "Horas de apoyo fuera del aula" },
  {
    name: "tiposApoyo",
    label: "Tipos de apoyo especializado (recursos materiales y/o profesionales)",
  },
];

const diversityDetailColumns = [
  {
    name: "como",
    label: "¿Cómo?",
    helper: "Señalar materiales, acciones, formas de agrupamiento, etc.",
  },
  { name: "quienes", label: "¿A quiénes?", helper: "Nombre de los estudiantes." },
];

const diversityCriteriaConfig = [
  {
    key: "presentacion",
    label: "Múltiples medios de presentación y representación",
    options: [
      "Favorecer percepción de la información.",
      "Favorecer la representación de la información.",
      "Favorecer la comprensión de la información.",
    ],
  },
  {
    key: "ejecucion",
    label: "Múltiples medios de ejecución y expresión",
    options: [
      "Para favorecer la expresión y la fluidez.",
      "Para favorecer la acción física.",
    ],
  },
  {
    key: "participacion",
    label: "Múltiples formas de participación",
    options: [
      "Para captar la atención y el interés.",
      "De apoyo al esfuerzo y la persistencia.",
      "Para el control y regulación de los propios procesos de aprendizaje.",
    ],
  },
  {
    key: "otro",
    label: "Otro",
    options: [],
  },
];

const adjustmentOptions = [
  "En los materiales de acceso.",
  "En el tiempo.",
  "En la Tarea.",
  "Otro.",
];

const adecuacionColumns = [
  { name: "ambito", label: "Ámbito de aprendizaje, Asignatura o Módulo en que se aplicarán" },
  { name: "estrategias", label: "Principales estrategias que se utilizarán" },
  { name: "estudiantes", label: "Nombre de los/las estudiantes" },
];

const adecuacionConfig = [
  { key: "acceso", label: "De acceso" },
  { key: "objetivos", label: "A los objetivos de aprendizaje en el caso de la educación básica." },
  { key: "planEstudio", label: "Al plan de estudio (básica)" },
  { key: "paci", label: "Plan de adecuación curricular individual (PACI) (Básica)" },
];

const evaluacionRowsConfig = [
  {
    key: "proceso",
    label: "Evaluación de Proceso y avance;",
    helper:
      "- Evaluaciones para el aprendizaje, periódicas, se recomiendan quincenales.\n- Evaluaciones de resultados; trimestrales, semestrales con informe escrito a la Familia.",
  },
  {
    key: "anual",
    label:
      "Evaluación Anual de logros de aprendizaje; de evolución del déficit o trastorno, de egreso o de continuidad en el PIE.",
    helper: "",
  },
];

const planApoyoSupportTypes = [
  { key: "educDiferencial", label: "Educ. Diferencial" },
  { key: "psicopedagogo", label: "Psicopedagogo/a" },
  { key: "fonoaudiologo", label: "Fonoaudiólogo/a" },
  { key: "psicologo", label: "Psicólogo/a" },
  { key: "otros", label: "Otros (Especificar)" },
];

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const familiaComunidadColumns = [
  { name: "descripcion", label: "Descripción" },
  { name: "seguimiento", label: "Seguimiento" },
  { name: "evaluacion", label: "Evaluación" },
];

const familiaComunidadBaseRows = [
  { key: "planificacion", titulo: "En la planificación", editableTitulo: false },
  { key: "proceso", titulo: "En el proceso de aprendizaje", editableTitulo: false },
  { key: "evaluacion", titulo: "En la evaluación", editableTitulo: false },
  { key: "otras", titulo: "Otras acciones", editableTitulo: false },
];

const createEmptyStrategy = () => ({
  estrategia: "",
  ambito: "",
  periodo: "",
  criterios: "",
});

const ensureStrategyList = (list) => {
  if (Array.isArray(list) && list.length > 0) return list;
  return [createEmptyStrategy()];
};

const createEmptySupport = () => ({
  ambito: "",
  horasRegular: "",
  horasFuera: "",
  tiposApoyo: "",
});

const ensureSupportList = (list) => {
  if (Array.isArray(list) && list.length > 0) return list;
  return [createEmptySupport()];
};

const createEmptyCriteriaRow = (config) => ({
  key: config.key,
  criterio: config.label,
  selecciones: [],
  estrategias: "",
  como: "",
  quienes: "",
});

const ensureCriteriaRows = (list) => {
  const map = Array.isArray(list)
    ? list.reduce((acc, row) => {
        const key = row.key ?? row.criterio;
        if (key) acc[key] = row;
        return acc;
      }, {})
    : {};
  return diversityCriteriaConfig.map((config) => ({
    ...createEmptyCriteriaRow(config),
    ...(map[config.key] || {}),
    key: config.key,
    criterio: map[config.key]?.criterio || config.label,
    selecciones: Array.isArray(map[config.key]?.selecciones)
      ? map[config.key].selecciones
      : [],
  }));
};

const createEmptyAdjustments = () => ({
  selecciones: [],
  como: "",
  quienes: "",
});

const ensureAdjustments = (data) => ({
  ...createEmptyAdjustments(),
  ...(data ?? {}),
  selecciones: Array.isArray(data?.selecciones) ? data.selecciones : [],
});

const createEmptyAdecuacionRow = (config) => ({
  key: config.key,
  tipo: config.label,
  seleccionado: false,
  ambito: "",
  estrategias: "",
  estudiantes: "",
});

const ensureAdecuaciones = (list) => {
  const map = Array.isArray(list)
    ? list.reduce((acc, row) => {
        const key = row.key ?? row.tipo;
        if (key) acc[key] = row;
        return acc;
      }, {})
    : {};
  return adecuacionConfig.map((config) => ({
    ...createEmptyAdecuacionRow(config),
    ...(map[config.key] || {}),
    key: config.key,
    tipo: map[config.key]?.tipo || config.label,
    seleccionado: Boolean(map[config.key]?.seleccionado),
  }));
};

const createEmptyEvaluacionRow = (config) => ({
  key: config.key,
  titulo: config.label,
  estrategias: "",
});

const ensureEvaluaciones = (list) => {
  const map = Array.isArray(list)
    ? list.reduce((acc, row) => {
        const key = row.key ?? row.titulo;
        if (key) acc[key] = row;
        return acc;
      }, {})
    : {};
  return evaluacionRowsConfig.map((config) => ({
    ...createEmptyEvaluacionRow(config),
    ...(map[config.key] || {}),
    key: config.key,
    titulo: map[config.key]?.titulo || config.label,
  }));
};

const createEmptyPlanApoyo = () => ({
  estudiante: "",
  apoyosSeleccionados: [],
  otroApoyo: "",
  horarioDia: "",
  horarioHora: "",
  fechaInicio: "",
  fechaTermino: "",
  observaciones: "",
});

const ensurePlanApoyoList = (list) => {
  if (!Array.isArray(list) || list.length === 0) return [createEmptyPlanApoyo()];
  return list.map((item) => {
    const selected = Array.isArray(item?.apoyosSeleccionados)
      ? item.apoyosSeleccionados
      : item?.apoyoSeleccionado
      ? [item.apoyoSeleccionado]
      : [];
    return {
      ...createEmptyPlanApoyo(),
      ...item,
      apoyosSeleccionados: selected,
    };
  });
};

const createFamiliaRow = (config = {}) => ({
  key: config.key ?? `custom-${Date.now()}`,
  titulo: config.titulo ?? "",
  editableTitulo: config.editableTitulo ?? true,
  descripcion: "",
  seguimiento: "",
  evaluacion: "",
  ...config.initialValues,
});

const ensureFamiliaRows = (rows) => {
  const existing = Array.isArray(rows) ? rows : [];
  const map = existing.reduce((acc, row) => {
    if (row?.key) acc[row.key] = row;
    return acc;
  }, {});

  const base = familiaComunidadBaseRows.map((config) => ({
    ...createFamiliaRow({ ...config, editableTitulo: config.editableTitulo }),
    ...(map[config.key] || {}),
    key: config.key,
    titulo: map[config.key]?.titulo ?? config.titulo,
    editableTitulo: config.editableTitulo,
    descripcion: map[config.key]?.descripcion ?? "",
    seguimiento: map[config.key]?.seguimiento ?? "",
    evaluacion: map[config.key]?.evaluacion ?? "",
  }));

  const extras = existing.filter(
    (row) => row?.key && !familiaComunidadBaseRows.some((cfg) => cfg.key === row.key)
  );

  const normalizedExtras = extras.map((row) => ({
    ...createFamiliaRow({ key: row.key, editableTitulo: row.editableTitulo ?? true }),
    ...row,
    editableTitulo: row.editableTitulo ?? true,
  }));

  return [...base, ...normalizedExtras];
};

const StrategyRow = ({ index, value, onChange }) => (
  <tr>
    {strategyColumns.map((column) => (
      <td key={`${column.name}-${index}`}>
        <textarea
          className="form-control form-control-sm"
          rows={2}
          value={value[column.name] || ""}
          onChange={(e) => onChange(index, column.name, e.target.value)}
        />
      </td>
    ))}
  </tr>
);

function PlanificacionSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const panoramaData = value?.panorama ?? {};
  const strategyRows = ensureStrategyList(value?.estrategias);
  const collaborationData = value?.colaboraciones ?? {};
  const supportRows = ensureSupportList(value?.apoyos);
  const diversityData = value?.diversidad ?? {};
  const criteriaRows = ensureCriteriaRows(diversityData.criterios);
  const adjustmentsData = ensureAdjustments(diversityData.ajustes);
  const adecuacionRows = ensureAdecuaciones(value?.adecuaciones);
  const evaluacionRows = ensureEvaluaciones(value?.evaluacionesDiversidad);
  const planApoyoEntries = ensurePlanApoyoList(value?.planApoyo);
  const familiaComunidadData = value?.familiaComunidad ?? {};
  const familiaRows = ensureFamiliaRows(familiaComunidadData.filas);
  const hasEditableFamiliaRow = familiaRows.some((row) => row.editableTitulo);

  const handleSave = async () => {
    if (saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(value);
    } catch (error) {
      console.error("No se pudo guardar la planificación.", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePanoramaChange = (field, newValue) => {
    setValue((prev) => ({
      ...prev,
      panorama: {
        ...(prev?.panorama ?? {}),
        [field]: newValue,
      },
    }));
  };

  const handleStrategyChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensureStrategyList(prev?.estrategias);
      const updated = rows.map((row, idx) =>
        idx === index ? { ...row, [field]: newValue } : row
      );
      return { ...prev, estrategias: updated };
    });
  };

  const handleAddStrategy = () => {
    setValue((prev) => ({
      ...prev,
      estrategias: [...ensureStrategyList(prev?.estrategias), createEmptyStrategy()],
    }));
  };

  const handleRemoveStrategy = (index) => {
    setValue((prev) => ({
      ...prev,
      estrategias: (() => {
        const filtered = ensureStrategyList(prev?.estrategias).filter((_, idx) => idx !== index);
        return filtered.length ? filtered : [createEmptyStrategy()];
      })(),
    }));
  };

  const handleCollaborationChange = (key, newValue) => {
    setValue((prev) => ({
      ...prev,
      colaboraciones: {
        ...(prev?.colaboraciones ?? {}),
        [key]: newValue,
      },
    }));
  };

  const handleSupportChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensureSupportList(prev?.apoyos);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, [field]: newValue } : row));
      return { ...prev, apoyos: updated };
    });
  };

  const handleAddSupport = () => {
    setValue((prev) => ({
      ...prev,
      apoyos: [...ensureSupportList(prev?.apoyos), createEmptySupport()],
    }));
  };

  const handleRemoveSupport = () => {
    setValue((prev) => {
      const filtered = ensureSupportList(prev?.apoyos).slice(0, -1);
      return { ...prev, apoyos: filtered.length ? filtered : [createEmptySupport()] };
    });
  };

  const handleCriteriaToggle = (index, option) => {
    setValue((prev) => {
      const rows = ensureCriteriaRows(prev?.diversidad?.criterios);
      const updated = rows.map((row, idx) => {
        if (idx !== index) return row;
        const selections = new Set(row.selecciones || []);
        selections.has(option) ? selections.delete(option) : selections.add(option);
        return { ...row, selecciones: Array.from(selections) };
      });
      return {
        ...prev,
        diversidad: {
          ...(prev?.diversidad ?? {}),
          criterios: updated,
        },
      };
    });
  };

  const handleCriteriaFieldChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensureCriteriaRows(prev?.diversidad?.criterios);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, [field]: newValue } : row));
      return {
        ...prev,
        diversidad: {
          ...(prev?.diversidad ?? {}),
          criterios: updated,
        },
      };
    });
  };

  const handleAdjustmentToggle = (option) => {
    setValue((prev) => {
      const ajustes = ensureAdjustments(prev?.diversidad?.ajustes);
      const selections = new Set(ajustes.selecciones || []);
      selections.has(option) ? selections.delete(option) : selections.add(option);
      return {
        ...prev,
        diversidad: {
          ...(prev?.diversidad ?? {}),
          ajustes: {
            ...ajustes,
            selecciones: Array.from(selections),
          },
        },
      };
    });
  };

  const handleAdjustmentFieldChange = (field, newValue) => {
    setValue((prev) => ({
      ...prev,
      diversidad: {
        ...(prev?.diversidad ?? {}),
        ajustes: {
          ...ensureAdjustments(prev?.diversidad?.ajustes),
          [field]: newValue,
        },
      },
    }));
  };

  const handleOtherStrategiesChange = (field, newValue) => {
    setValue((prev) => ({
      ...prev,
      diversidad: {
        ...(prev?.diversidad ?? {}),
        [field]: newValue,
      },
    }));
  };

  const handleAdecuacionToggle = (index) => {
    setValue((prev) => {
      const rows = ensureAdecuaciones(prev?.adecuaciones);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, seleccionado: !row.seleccionado } : row));
      return { ...prev, adecuaciones: updated };
    });
  };

  const handleAdecuacionFieldChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensureAdecuaciones(prev?.adecuaciones);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, [field]: newValue } : row));
      return { ...prev, adecuaciones: updated };
    });
  };

  const handleEvaluacionChange = (index, newValue) => {
    setValue((prev) => {
      const rows = ensureEvaluaciones(prev?.evaluacionesDiversidad);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, estrategias: newValue } : row));
      return { ...prev, evaluacionesDiversidad: updated };
    });
  };

  const handlePlanApoyoFieldChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensurePlanApoyoList(prev?.planApoyo);
      const updated = rows.map((row, idx) => (idx === index ? { ...row, [field]: newValue } : row));
      return { ...prev, planApoyo: updated };
    });
  };

  const handlePlanApoyoSupportToggle = (index, supportKey) => {
    setValue((prev) => {
      const rows = ensurePlanApoyoList(prev?.planApoyo);
      const updated = rows.map((row, idx) => {
        if (idx !== index) return row;
        const current = Array.isArray(row.apoyosSeleccionados) ? row.apoyosSeleccionados : [];
        const alreadySelected = current.includes(supportKey);
        const nextSelections = alreadySelected
          ? current.filter((key) => key !== supportKey)
          : [...current, supportKey];
        const includesOtros = nextSelections.includes("otros");
        return {
          ...row,
          apoyosSeleccionados: nextSelections,
          otroApoyo: includesOtros ? row.otroApoyo || "" : "",
        };
      });
      return { ...prev, planApoyo: updated };
    });
  };

  const handleAddPlanApoyoEntry = () => {
    setValue((prev) => ({
      ...prev,
      planApoyo: [...ensurePlanApoyoList(prev?.planApoyo), createEmptyPlanApoyo()],
    }));
  };

  const handleRemovePlanApoyoEntry = (index) => {
    setValue((prev) => {
      const rows = ensurePlanApoyoList(prev?.planApoyo);
      const filtered = rows.filter((_, idx) => idx !== index);
      return { ...prev, planApoyo: filtered.length ? filtered : [createEmptyPlanApoyo()] };
    });
  };

  const handleFamiliaFieldChange = (index, field, newValue) => {
    setValue((prev) => {
      const rows = ensureFamiliaRows(prev?.familiaComunidad?.filas);
      const updated = rows.map((row, idx) => {
        if (idx !== index) return row;
        if (field === "titulo" && !row.editableTitulo) return row;
        return { ...row, [field]: newValue };
      });
      return {
        ...prev,
        familiaComunidad: {
          ...(prev?.familiaComunidad ?? {}),
          filas: updated,
        },
      };
    });
  };

  const handleAddFamiliaRow = () => {
    setValue((prev) => ({
      ...prev,
      familiaComunidad: {
        ...(prev?.familiaComunidad ?? {}),
        filas: [...ensureFamiliaRows(prev?.familiaComunidad?.filas), createFamiliaRow()],
      },
    }));
  };

  const handleRemoveFamiliaRow = () => {
    setValue((prev) => {
      const rows = ensureFamiliaRows(prev?.familiaComunidad?.filas);
      const lastEditableIndex = [...rows]
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => row.editableTitulo)
        .map(({ idx }) => idx)
        .pop();
      if (lastEditableIndex === undefined) return prev;
      const filtered = rows.filter((_, idx) => idx !== lastEditableIndex);
      return {
        ...prev,
        familiaComunidad: {
          ...(prev?.familiaComunidad ?? {}),
          filas: filtered.length ? filtered : rows,
        },
      };
    });
  };

  const handleFamiliaObservacionesChange = (newValue) => {
    setValue((prev) => ({
      ...prev,
      familiaComunidad: {
        ...(prev?.familiaComunidad ?? {}),
        observaciones: newValue,
      },
    }));
  };

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <header className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-4">
          <div>
            <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
            <h4 className="fw-bold mb-0">II Planificación del Proceso Educativo</h4>
            <p className="mb-0 text-secondary">1. Estrategias Diversificadas</p>
          </div>
            <div className="d-flex gap-3 align-items-center flex-wrap">
              <div className="d-flex gap-2">
                <div className="rounded-2 bg-primary" style={{ width: 42, height: 42 }} />
                <div className="rounded-2 bg-info" style={{ width: 42, height: 42 }} />
              </div>
            {onSave && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Guardando..." : "Guardar sección"}
              </button>
            )}
          </div>
        </header>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">a) Panorama del curso</span>
            <span className="text-muted small">(de todos los estudiantes)</span>
          </div>
          <p className="text-secondary small mb-3">
            Descripción de las características del curso, destacando sus principales fortalezas y necesidades de apoyo.
          </p>

          <div className="table-responsive">
            <table className="table table-bordered mb-0">
              <tbody>
                {panoramaFields.map((field) => (
                  <tr key={field.name}>
                    <th className="bg-light align-middle" style={{ width: "25%" }}>
                      {field.label}
                    </th>
                    <td>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={panoramaData[field.name] || ""}
                        onChange={(e) => handlePanoramaChange(field.name, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
            <div>
              <span className="fw-semibold">b) Registro de las estrategias diversificadas</span>
              <p className="text-secondary small mb-0">Para las acciones que aplicará el profesor de educación regular en el curso.</p>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm" type="button" onClick={handleAddStrategy}>
                Agregar fila
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                type="button"
                onClick={() => handleRemoveStrategy(strategyRows.length - 1)}
                disabled={strategyRows.length === 1}
              >
                Quitar fila
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {strategyColumns.map((column) => (
                    <th key={column.name}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {strategyRows.map((row, index) => (
                  <StrategyRow key={`estrategia-${index}`} index={index} value={row} onChange={handleStrategyChange} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <h5 className="fw-bold mb-3">2. Trabajo Colaborativo</h5>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">a) Acciones que se implementarán</span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "35%" }}>Colaboración</th>
                  <th>Estrategias y/o acciones</th>
                </tr>
              </thead>
              <tbody>
                {collaborationRows.map((row) => (
                  <tr key={row.key}>
                    <td className="align-middle">
                      <div className="fw-semibold">{row.label}</div>
                      {row.helper && <div className="text-muted small">{row.helper}</div>}
                    </td>
                    <td>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={collaborationData[row.key] || ""}
                        onChange={(e) => handleCollaborationChange(row.key, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="fw-semibold">Observaciones</td>
                  <td>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={collaborationData.observaciones || ""}
                      onChange={(e) => handleCollaborationChange("observaciones", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <span className="fw-semibold">b) Organización de los apoyos</span>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddSupport}>
              Agregar fila
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleRemoveSupport}
              disabled={supportRows.length === 1}
            >
              Quitar fila
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-0">
            <thead className="table-light">
              <tr>
                {supportColumns.map((column) => (
                  <th key={column.name}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {supportRows.map((row, index) => (
                <tr key={`apoyo-${index}`}>
                  {supportColumns.map((column) => (
                    <td key={`${column.name}-${index}`}>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={row[column.name] || ""}
                        onChange={(e) => handleSupportChange(index, column.name, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <h5 className="fw-bold mb-3">3. Respuesta a la diversidad y Adecuaciones Curriculares</h5>
        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">
              a) Estrategias que se utilizarán para dar respuesta a la diversidad de estudiantes, en el aula común
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "30%" }}>
                    Criterios sobre enseñanza y aprendizaje a considerar en la planificación y evaluación en el aula, a saber:
                  </th>
                  <th style={{ width: "30%" }}>Estrategias para (Marque con una X aquellos que aplicará)</th>
                  {diversityDetailColumns.map((column) => (
                    <th key={`div-head-${column.name}`}>
                      <div>{column.label}</div>
                      {column.helper && <small className="text-muted">{column.helper}</small>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {criteriaRows.map((row, index) => {
                  const config = diversityCriteriaConfig[index] ?? diversityCriteriaConfig[0];
                  return (
                    <tr key={`criterio-${row.key}`}>
                      <td className="fw-semibold align-top">{config.label}</td>
                      <td>
                        {config.options.length > 0 ? (
                          <div className="d-flex flex-column gap-1">
                            {config.options.map((option) => (
                              <label key={`${row.key}-${option}`} className="form-check form-check-sm d-flex align-items-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input me-2"
                                  checked={row.selecciones?.includes(option)}
                                  onChange={() => handleCriteriaToggle(index, option)}
                                />
                                <span className="small text-muted">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={row.estrategias || ""}
                            onChange={(e) => handleCriteriaFieldChange(index, "estrategias", e.target.value)}
                            placeholder="Describe otras estrategias"
                          />
                        )}
                      </td>
                      {diversityDetailColumns.map((column) => (
                        <td key={`${column.name}-${row.key}`}>
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={row[column.name] || ""}
                            onChange={(e) => handleCriteriaFieldChange(index, column.name, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}

                <tr>
                  <td className="fw-semibold align-top">Ajustes (Señalar en qué aspecto o nivel se realizarán ajustes):</td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {adjustmentOptions.map((option) => (
                        <label key={`ajuste-opt-${option}`} className="form-check form-check-sm d-flex align-items-center">
                          <input
                            type="checkbox"
                            className="form-check-input me-2"
                            checked={adjustmentsData.selecciones?.includes(option)}
                            onChange={() => handleAdjustmentToggle(option)}
                          />
                          <span className="small text-muted">{option}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  {diversityDetailColumns.map((column) => (
                    <td key={`ajustes-${column.name}`}>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={adjustmentsData[column.name] || ""}
                        onChange={(e) => handleAdjustmentFieldChange(column.name, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>

                <tr>
                  <td className="bg-light fw-semibold">Otras estrategias y criterios</td>
                  <td colSpan={diversityDetailColumns.length + 1}>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={diversityData.otrasEstrategias || ""}
                      onChange={(e) => handleOtherStrategiesChange("otrasEstrategias", e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">
              b) Estrategias que se utilizarán para adecuar o flexibilizar el currículum, según corresponda.
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "28%" }}>
                    Adecuación Curricular
                    <div className="small text-muted">Marque con una X aquellas adecuaciones que aplicará</div>
                  </th>
                  {adecuacionColumns.map((column) => (
                    <th key={`adecuacion-head-${column.name}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {adecuacionRows.map((row, index) => (
                  <tr key={`adecuacion-${row.key}`}>
                    <td>
                      <label className="form-check d-flex align-items-start gap-2">
                        <input
                          type="checkbox"
                          className="form-check-input mt-1"
                          checked={row.seleccionado}
                          onChange={() => handleAdecuacionToggle(index)}
                        />
                        <span className="small text-muted">{row.tipo}</span>
                      </label>
                    </td>
                    {adecuacionColumns.map((column) => (
                      <td key={`${column.name}-${row.key}`}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={row[column.name] || ""}
                          onChange={(e) => handleAdecuacionFieldChange(index, column.name, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small text-muted mt-2">
            *El detalle de las estrategias y procedimientos de las adecuaciones curriculares debe encontrarse en el Plan de Adecuación Curricular Individual (PACI).
          </p>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">
              c) Estrategias y procedimientos de evaluación de aprendizaje con foco en la diversidad y en las necesidades educativas especiales:
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "35%" }}>Evaluación</th>
                  <th>Indique Estrategias y Procedimientos que aplicará para las</th>
                </tr>
              </thead>
              <tbody>
                {evaluacionRows.map((row, index) => (
                  <tr key={`evaluacion-${row.key}`}>
                    <td className="align-top">
                      <div className="fw-semibold">{row.titulo}</div>
                    </td>
                    <td>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={row.estrategias || ""}
                        placeholder={evaluacionRowsConfig[index]?.helper || ""}
                        onChange={(e) => handleEvaluacionChange(index, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-3">
          <label className="fw-semibold d-block mb-1">OBSERVACIONES:</label>
          <textarea
            className="form-control"
            rows={4}
            value={diversityData.observaciones || ""}
            onChange={(e) => handleOtherStrategiesChange("observaciones", e.target.value)}
          />
        </div>
      </div>

      <hr className="my-4" />

      <div>
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div>
            <h5 className="fw-bold mb-0">4. Plan de Apoyo Individual</h5>
            <small className="text-muted">(incluye los ajustes o adecuaciones curriculares)</small>
          </div>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddPlanApoyoEntry}>
              Agregar registro
            </button>
          </div>
        </div>

        {planApoyoEntries.map((entry, index) => (
          <div key={`plan-apoyo-${index}`} className="border rounded-3 p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="fw-semibold">Plan #{index + 1}</div>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => handleRemovePlanApoyoEntry(index)}
                disabled={planApoyoEntries.length === 1}
              >
                Quitar
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-2">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "22%" }}>Nombre del/los estudiante/s</th>
                    <th style={{ width: "32%" }}>Apoyo especializado requerido</th>
                    <th style={{ width: "16%" }}>Horario <small className="d-block text-muted">Día/Hora</small></th>
                    <th style={{ width: "15%" }}>Fecha de Inicio</th>
                    <th style={{ width: "15%" }}>Fecha de Término</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <textarea
                        className="form-control"
                        rows={6}
                        value={entry.estudiante || ""}
                        onChange={(e) => handlePlanApoyoFieldChange(index, "estudiante", e.target.value)}
                      />
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-2">
                        {planApoyoSupportTypes.map((support) => (
                          <label
                            key={`${support.key}-${index}`}
                            className="d-flex align-items-center justify-content-between border rounded px-2 py-1 small"
                          >
                            <span className="me-2 fw-semibold text-muted">{support.label}</span>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={entry.apoyosSeleccionados?.includes(support.key)}
                              onChange={() => handlePlanApoyoSupportToggle(index, support.key)}
                            />
                          </label>
                        ))}
                        {entry.apoyosSeleccionados?.includes("otros") && (
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Especifique apoyo"
                            value={entry.otroApoyo || ""}
                            onChange={(e) => handlePlanApoyoFieldChange(index, "otroApoyo", e.target.value)}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="mb-2">
                        <label className="small fw-semibold text-muted d-block mb-1">Día</label>
                        <select
                          className="form-select form-select-sm"
                          value={entry.horarioDia || ""}
                          onChange={(e) => handlePlanApoyoFieldChange(index, "horarioDia", e.target.value)}
                        >
                          <option value="">Selecciona un día</option>
                          {diasSemana.map((dia) => (
                            <option key={dia} value={dia}>
                              {dia}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="small fw-semibold text-muted d-block mb-1">Hora</label>
                        <input
                          type="time"
                          className="form-control form-control-sm"
                          value={entry.horarioHora || ""}
                          onChange={(e) => handlePlanApoyoFieldChange(index, "horarioHora", e.target.value)}
                        />
                      </div>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control"
                        value={entry.fechaInicio || ""}
                        onChange={(e) => handlePlanApoyoFieldChange(index, "fechaInicio", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className="form-control"
                        value={entry.fechaTermino || ""}
                        onChange={(e) => handlePlanApoyoFieldChange(index, "fechaTermino", e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <label className="fw-semibold d-block mb-1">Observaciones:</label>
              <textarea
                className="form-control"
                rows={3}
                value={entry.observaciones || ""}
                onChange={(e) => handlePlanApoyoFieldChange(index, "observaciones", e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      <hr className="my-4" />

      <div>
        <header className="mb-3">
          <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
          <h5 className="fw-bold mb-1">5. Estrategias de trabajo con la familia y con la comunidad</h5>
          <p className="text-secondary small mb-0">
            Considerar estrategias de participación y trabajo colaborativo en distintas etapas e instancias del proceso educativo (planificación, evaluación, experiencias de aprendizaje, etc.).
          </p>
        </header>

        <div className="d-flex gap-2 mb-2 flex-wrap">
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddFamiliaRow}>
            Agregar fila
          </button>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={handleRemoveFamiliaRow}
            disabled={!hasEditableFamiliaRow}
          >
            Quitar fila editable
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-bordered align-middle mb-3">
            <thead className="table-light">
              <tr>
                <th style={{ width: "25%" }}>Estrategias de participación</th>
                {familiaComunidadColumns.map((column) => (
                  <th key={`familia-head-${column.name}`}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {familiaRows.map((row, index) => (
                <tr key={`familia-row-${row.key}`}>
                  <td>
                    {row.editableTitulo ? (
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={row.titulo || ""}
                        onChange={(e) => handleFamiliaFieldChange(index, "titulo", e.target.value)}
                        placeholder="Especifique la estrategia"
                      />
                    ) : (
                      <div className="fw-semibold text-muted">{row.titulo}</div>
                    )}
                  </td>
                  {familiaComunidadColumns.map((column) => (
                    <td key={`${column.name}-${row.key}`}>
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        value={row[column.name] || ""}
                        onChange={(e) => handleFamiliaFieldChange(index, column.name, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <label className="fw-semibold d-block mb-1">OBSERVACIONES:</label>
          <textarea
            className="form-control"
            rows={4}
            value={familiaComunidadData.observaciones || ""}
            onChange={(e) => handleFamiliaObservacionesChange(e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}

const periodosLabels = ["1° Período", "2° Período", "3° Período"];

const horasPedagogicasOptions = [
  "30 minutos",
  "1 hora",
  "2 horas",
  "3 horas",
  "4 horas",
  "5 horas",
  "6 horas",
];

const accionesDocenteColumns = [
  { name: "fecha", label: "Fecha", type: "date" },
  { name: "horas", label: "Horas pedagógicas realizadas", type: "hours" },
  { name: "actividades", label: "Actividades desarrolladas" },
  { name: "docente", label: "Nombre y firma del docente" },
];

const registroApoyoColumns = [
  { name: "fecha", label: "Fecha", type: "date" },
  { name: "horas", label: "Horas pedagógicas realizadas", type: "hours" },
  { name: "lugar", label: "Lugar (dentro o fuera del aula)" },
  { name: "actividades", label: "Actividades realizadas y apoyos entregados/estudiantes" },
  { name: "profesional", label: "Nombre y firma del profesional" },
];

const logrosColumns = [
  { name: "estudiante", label: "Nombre de estudiantes" },
  { name: "logros", label: "Logros más relevantes" },
  { name: "comentarios", label: "Comentarios y Sugerencias" },
];

const createEmptyFila = () => ({
  acciones: "",
  evaluacion: "",
});

const ensurePeriodos = (periodos) => {
  const base = Array.isArray(periodos) ? periodos : [];
  if (base.length === periodosLabels.length && base.every((p) => Array.isArray(p.filas))) {
    return base.map((periodo, index) => ({
      titulo: periodo.titulo || periodosLabels[index],
      filas: periodo.filas.length > 0 ? periodo.filas : [createEmptyFila()],
    }));
  }
  return periodosLabels.map((titulo, index) => ({
    titulo,
    filas: base[index]?.filas?.length
      ? base[index].filas.map((fila) => ({ ...createEmptyFila(), ...fila }))
      : [createEmptyFila(), createEmptyFila(), createEmptyFila(), createEmptyFila()],
  }));
};

const createEmptyAccionDocente = () => ({
  fecha: "",
  horas: "",
  actividades: "",
  docente: "",
});

const ensureAccionesDocente = (acciones) => ({
  observaciones: acciones?.observaciones || "",
  filas:
    Array.isArray(acciones?.filas) && acciones.filas.length > 0
      ? acciones.filas.map((fila) => ({ ...createEmptyAccionDocente(), ...fila }))
      : Array.from({ length: 6 }, () => createEmptyAccionDocente()),
});

const createEmptyRegistroApoyoRow = () => ({
  fecha: "",
  horas: "",
  lugar: "",
  actividades: "",
  profesional: "",
});

const ensureRegistroApoyos = (registro) => ({
  estudiantes: Array.isArray(registro?.estudiantes) && registro.estudiantes.length
    ? registro.estudiantes
    : Array.from({ length: 5 }, () => ""),
  objetivos: registro?.objetivos || "",
  filas:
    Array.isArray(registro?.filas) && registro.filas.length
      ? registro.filas.map((fila) => ({ ...createEmptyRegistroApoyoRow(), ...fila }))
      : Array.from({ length: 6 }, () => createEmptyRegistroApoyoRow()),
});

const createEmptyLogroRow = () => ({
  estudiante: "",
  logros: "",
  comentarios: "",
});

const ensureLogrosAprendizaje = (data) => ({
  filas:
    Array.isArray(data?.filas) && data.filas.length
      ? data.filas.map((fila) => ({ ...createEmptyLogroRow(), ...fila }))
      : Array.from({ length: 7 }, () => createEmptyLogroRow()),
});

function TrabajoColaborativoSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const periodos = ensurePeriodos(value?.periodos);
  const accionesDocente = ensureAccionesDocente(value?.accionesDocente);
  const registroApoyos = ensureRegistroApoyos(value?.registroApoyos);
  const logrosAprendizaje = ensureLogrosAprendizaje(value?.logrosAprendizaje);

  const handleSave = async () => {
    if (saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(value);
    } catch (error) {
      console.error("No se pudo guardar el registro de implementación.", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCellChange = (periodoIdx, filaIdx, field, newValue) => {
    setValue((prev) => {
      const current = ensurePeriodos(prev?.periodos);
      const updated = current.map((periodo, idx) => {
        if (idx !== periodoIdx) return periodo;
        const filas = periodo.filas.map((fila, rowIdx) =>
          rowIdx === filaIdx ? { ...fila, [field]: newValue } : fila
        );
        return { ...periodo, filas };
      });
      return { ...prev, periodos: updated };
    });
  };

  const handleAddFila = (periodoIdx) => {
    setValue((prev) => {
      const current = ensurePeriodos(prev?.periodos);
      const updated = current.map((periodo, idx) =>
        idx === periodoIdx ? { ...periodo, filas: [...periodo.filas, createEmptyFila()] } : periodo
      );
      return { ...prev, periodos: updated };
    });
  };

  const handleRemoveFila = (periodoIdx) => {
    setValue((prev) => {
      const current = ensurePeriodos(prev?.periodos);
      const updated = current.map((periodo, idx) => {
        if (idx !== periodoIdx) return periodo;
        if (periodo.filas.length <= 1) return periodo;
        return { ...periodo, filas: periodo.filas.slice(0, -1) };
      });
      return { ...prev, periodos: updated };
    });
  };

  const handleAccionDocenteChange = (index, field, newValue) => {
    setValue((prev) => {
      const acciones = ensureAccionesDocente(prev?.accionesDocente);
      const filas = acciones.filas.map((fila, idx) => (idx === index ? { ...fila, [field]: newValue } : fila));
      return {
        ...prev,
        accionesDocente: {
          ...acciones,
          filas,
        },
      };
    });
  };

  const handleAccionDocenteObservaciones = (newValue) => {
    setValue((prev) => ({
      ...prev,
      accionesDocente: {
        ...ensureAccionesDocente(prev?.accionesDocente),
        observaciones: newValue,
      },
    }));
  };

  const handleAccionDocenteAdd = () => {
    setValue((prev) => ({
      ...prev,
      accionesDocente: {
        ...ensureAccionesDocente(prev?.accionesDocente),
        filas: [...ensureAccionesDocente(prev?.accionesDocente).filas, createEmptyAccionDocente()],
      },
    }));
  };

  const handleAccionDocenteRemove = () => {
    setValue((prev) => {
      const acciones = ensureAccionesDocente(prev?.accionesDocente);
      if (acciones.filas.length <= 1) return prev;
      return {
        ...prev,
        accionesDocente: {
          ...acciones,
          filas: acciones.filas.slice(0, -1),
        },
      };
    });
  };

  const handleEstudianteChange = (index, newValue) => {
    setValue((prev) => ({
      ...prev,
      registroApoyos: {
        ...ensureRegistroApoyos(prev?.registroApoyos),
        estudiantes: ensureRegistroApoyos(prev?.registroApoyos).estudiantes.map((nombre, idx) =>
          idx === index ? newValue : nombre
        ),
      },
    }));
  };

  const handleObjetivosChange = (newValue) => {
    setValue((prev) => ({
      ...prev,
      registroApoyos: {
        ...ensureRegistroApoyos(prev?.registroApoyos),
        objetivos: newValue,
      },
    }));
  };

  const handleRegistroApoyoRowChange = (index, field, newValue) => {
    setValue((prev) => {
      const actual = ensureRegistroApoyos(prev?.registroApoyos);
      const filas = actual.filas.map((fila, idx) => (idx === index ? { ...fila, [field]: newValue } : fila));
      return { ...prev, registroApoyos: { ...actual, filas } };
    });
  };

  const handleRegistroApoyoAdd = () => {
    setValue((prev) => ({
      ...prev,
      registroApoyos: {
        ...ensureRegistroApoyos(prev?.registroApoyos),
        filas: [...ensureRegistroApoyos(prev?.registroApoyos).filas, createEmptyRegistroApoyoRow()],
      },
    }));
  };

  const handleRegistroApoyoRemove = () => {
    setValue((prev) => {
      const actual = ensureRegistroApoyos(prev?.registroApoyos);
      if (actual.filas.length <= 1) return prev;
      return {
        ...prev,
        registroApoyos: {
          ...actual,
          filas: actual.filas.slice(0, -1),
        },
      };
    });
  };

  const handleLogrosChange = (index, field, newValue) => {
    setValue((prev) => {
      const actual = ensureLogrosAprendizaje(prev?.logrosAprendizaje);
      const filas = actual.filas.map((fila, idx) => (idx === index ? { ...fila, [field]: newValue } : fila));
      return {
        ...prev,
        logrosAprendizaje: {
          ...actual,
          filas,
        },
      };
    });
  };

  const handleLogrosAdd = () => {
    setValue((prev) => ({
      ...prev,
      logrosAprendizaje: {
        ...ensureLogrosAprendizaje(prev?.logrosAprendizaje),
        filas: [...ensureLogrosAprendizaje(prev?.logrosAprendizaje).filas, createEmptyLogroRow()],
      },
    }));
  };

  const handleLogrosRemove = () => {
    setValue((prev) => {
      const actual = ensureLogrosAprendizaje(prev?.logrosAprendizaje);
      if (actual.filas.length <= 1) return prev;
      return {
        ...prev,
        logrosAprendizaje: {
          ...actual,
          filas: actual.filas.slice(0, -1),
        },
      };
    });
  };

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body">
        <header className="mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
              <h4 className="fw-bold mb-1">III Registro de la Implementación y Evaluación del Proceso Educativo</h4>
              <p className="text-secondary small mb-0">
                1. Aplicación y evaluación de las estrategias diversificadas y trabajo colaborativo.
                <br />
                a) Indicar las acciones de aplicación de las estrategias diversificadas planificadas, en los períodos estipulados previamente (Item II, 1.b).
              </p>
            </div>
            {onSave && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Guardando..." : "Guardar sección"}
              </button>
            )}
          </div>
        </header>

        {periodos.map((periodo, index) => (
          <div key={`periodo-${index}`} className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h6 className="fw-bold mb-0">{periodo.titulo}</h6>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleAddFila(index)}>
                  Agregar fila
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => handleRemoveFila(index)}
                  disabled={periodo.filas.length <= 1}
                >
                  Quitar fila
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "50%" }}>Acciones desarrolladas</th>
                    <th>Evaluación (resultados) de las estrategias aplicadas</th>
                  </tr>
                </thead>
                <tbody>
                  {periodo.filas.map((fila, filaIdx) => (
                    <tr key={`periodo-${index}-fila-${filaIdx}`}>
                      <td>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={fila.acciones || ""}
                          onChange={(e) => handleCellChange(index, filaIdx, "acciones", e.target.value)}
                        />
                      </td>
                      <td>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={fila.evaluacion || ""}
                          onChange={(e) => handleCellChange(index, filaIdx, "evaluacion", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="mt-5">
          <div className="mb-3">
            <p className="fw-semibold mb-1">
              b) Registro de acciones realizadas por el profesor o profesora de aula ya sea para la planificación conjunta de la respuesta educativa diversificada o para el seguimiento y evaluación del trabajo colaborativo, entre otras actividades.
            </p>
            <div className="mb-3">
              <label className="fw-semibold mb-1">Observaciones:</label>
              <textarea
                className="form-control"
                rows={3}
                value={accionesDocente.observaciones}
                onChange={(e) => handleAccionDocenteObservaciones(e.target.value)}
              />
            </div>
          </div>

          <div className="d-flex gap-2 mb-2 flex-wrap">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAccionDocenteAdd}>
              Agregar fila
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleAccionDocenteRemove}
              disabled={accionesDocente.filas.length <= 1}
            >
              Quitar fila
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-1">
              <thead className="table-light">
                <tr>
                  {accionesDocenteColumns.map((column) => (
                    <th key={`docente-head-${column.name}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accionesDocente.filas.map((fila, index) => (
                  <tr key={`docente-fila-${index}`}>
                    {accionesDocenteColumns.map((column) => (
                      <td key={`${column.name}-${index}`}>
                        {column.type === "date" ? (
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={fila[column.name] || ""}
                            onChange={(e) => handleAccionDocenteChange(index, column.name, e.target.value)}
                          />
                        ) : column.type === "hours" ? (
                          <select
                            className="form-select form-select-sm"
                            value={fila[column.name] || ""}
                            onChange={(e) => handleAccionDocenteChange(index, column.name, e.target.value)}
                          >
                            <option value="">Seleccione horas</option>
                            {horasPedagogicasOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={fila[column.name] || ""}
                            onChange={(e) => handleAccionDocenteChange(index, column.name, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-muted small mb-0">* Multicopiar las veces que sea necesario.</p>
        </div>

        <div className="mt-5">
          <header className="mb-3">
            <p className="text-uppercase text-muted small mb-1">Educación Especial</p>
            <h5 className="fw-bold mb-1">2. Registro de apoyos para cada estudiante o grupo de estudiantes</h5>
            <p className="text-secondary small mb-0">
              Registrar, por estudiante o grupos de estudiantes, los apoyos específicos o actividades especiales que se realizan en forma individual o en pequeños grupos dentro o fuera del aula regular y el o los nombres de los profesionales que los entregan.
            </p>
          </header>

          <div className="mb-3">
            <label className="fw-semibold d-block mb-1">Nombre/s estudiante/s</label>
            {registroApoyos.estudiantes.map((nombre, index) => (
              <input
                key={`estudiante-${index}`}
                type="text"
                className="form-control mb-2"
                value={nombre}
                onChange={(e) => handleEstudianteChange(index, e.target.value)}
              />
            ))}
          </div>

          <div className="mb-3">
            <label className="fw-semibold d-block mb-1">Objetivos de Aprendizaje:</label>
            <textarea
              className="form-control"
              rows={4}
              value={registroApoyos.objetivos}
              onChange={(e) => handleObjetivosChange(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2 mb-2 flex-wrap">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleRegistroApoyoAdd}>
              Agregar fila
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleRegistroApoyoRemove}
              disabled={registroApoyos.filas.length <= 1}
            >
              Quitar fila
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  {registroApoyoColumns.map((column) => (
                    <th key={`apoyo-head-${column.name}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registroApoyos.filas.map((fila, index) => (
                  <tr key={`apoyo-fila-${index}`}>
                    {registroApoyoColumns.map((column) => (
                      <td key={`${column.name}-${index}`}>
                        {column.type === "date" ? (
                          <input
                            type="date"
                            className="form-control form-control-sm"
                            value={fila[column.name] || ""}
                            onChange={(e) => handleRegistroApoyoRowChange(index, column.name, e.target.value)}
                          />
                        ) : column.type === "hours" ? (
                          <select
                            className="form-select form-select-sm"
                            value={fila[column.name] || ""}
                            onChange={(e) => handleRegistroApoyoRowChange(index, column.name, e.target.value)}
                          >
                            <option value="">Seleccione horas</option>
                            {horasPedagogicasOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <textarea
                            className="form-control form-control-sm"
                            rows={2}
                            value={fila[column.name] || ""}
                            onChange={(e) => handleRegistroApoyoRowChange(index, column.name, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-5">
          <header className="mb-3">
            <h5 className="fw-bold mb-1">3. Registro de logros de aprendizaje</h5>
            <p className="text-secondary small mb-0">
              Señalar los aprendizajes logrados por aquellos estudiantes que han recibido apoyos específicos, en los períodos definidos por el establecimiento.
            </p>
          </header>

          <div className="d-flex gap-2 mb-2 flex-wrap">
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleLogrosAdd}>
              Agregar fila
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogrosRemove}
              disabled={logrosAprendizaje.filas.length <= 1}
            >
              Quitar fila
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  {logrosColumns.map((column) => (
                    <th key={`logro-head-${column.name}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logrosAprendizaje.filas.map((fila, index) => (
                  <tr key={`logro-fila-${index}`}>
                    {logrosColumns.map((column) => (
                      <td key={`${column.name}-${index}`}>
                        <textarea
                          className="form-control form-control-sm"
                          rows={2}
                          value={fila[column.name] || ""}
                          onChange={(e) => handleLogrosChange(index, column.name, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

const createActividadParticipante = () => ({
  nombre: "",
  identificacion: "",
  contacto: "",
  firma: "",
});

const actividadParticipanteColumns = [
  { field: "nombre", label: "Nombre de los/as participantes" },
  {
    field: "identificacion",
    label: "Identifique si es apoderado o profesional del establecimiento",
  },
  { field: "contacto", label: "Teléfono / Mail" },
  { field: "firma", label: "Firma" },
];

const actividadDetailBlocks = [
  { field: "objetivo", label: "a) Objetivo(s)" },
  { field: "actividad", label: "b) Actividad" },
  { field: "acuerdos", label: "c) Acuerdo(s)/compromiso(s)" },
  { field: "resultados", label: "d) Resultado(s)" },
];

const ensureActividadSectionState = (section) => ({
  fecha: section?.fecha || "",
  participantes:
    Array.isArray(section?.participantes) && section.participantes.length
      ? section.participantes.map((p) => ({ ...createActividadParticipante(), ...p }))
      : Array.from({ length: 5 }, () => createActividadParticipante()),
  objetivo: section?.objetivo || "",
  actividad: section?.actividad || "",
  acuerdos: section?.acuerdos || "",
  resultados: section?.resultados || "",
});

const ensureActividadState = (value) => ({
  familia: ensureActividadSectionState(value?.familia),
  comunidad: ensureActividadSectionState(value?.comunidad),
});

const actividadSectionConfigs = [
  {
    id: "familia",
    badge: "Educación Especial",
    title: "1. Trabajo con la familia, apoderados y/o con el o la estudiante",
    intro:
      "Registra las coordinaciones y compromisos asumidos con la familia o el estudiante para asegurar la continuidad de los apoyos.",
    columns: actividadParticipanteColumns,
  },
  {
    id: "comunidad",
    badge: "Educación Especial",
    title: "2. Trabajo con la comunidad y el entorno escolar.",
    intro:
      "Detalla las acciones colaborativas realizadas con organizaciones del entorno escolar u otros actores comunitarios.",
    columns: [
      actividadParticipanteColumns[0],
      {
        field: "identificacion",
        label: "Identifique si es apoderado o profesional del establecimiento; o de empresa u organizaciones sociales",
      },
      actividadParticipanteColumns[2],
      actividadParticipanteColumns[3],
    ],
  },
];

function ActividadComunidadSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const data = ensureActividadState(value);

  const handleSave = async () => {
    if (saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error("No se pudo guardar la sección Actividad-Comunidad.", error);
    } finally {
      setSaving(false);
    }
  };

  const updateState = (sectionId, updater) => {
    setValue((prev) => {
      const safe = ensureActividadState(prev);
      return {
        ...safe,
        [sectionId]: updater(safe[sectionId]),
      };
    });
  };

  const handleFieldChange = (sectionId, field, newValue) => {
    updateState(sectionId, (current) => ({ ...current, [field]: newValue }));
  };

  const handleParticipanteChange = (sectionId, index, field, newValue) => {
    updateState(sectionId, (current) => ({
      ...current,
      participantes: current.participantes.map((row, idx) =>
        idx === index ? { ...row, [field]: newValue } : row
      ),
    }));
  };

  const handleAddParticipante = (sectionId) => {
    updateState(sectionId, (current) => ({
      ...current,
      participantes: [...current.participantes, createActividadParticipante()],
    }));
  };

  const handleRemoveParticipante = (sectionId) => {
    updateState(sectionId, (current) => {
      if (current.participantes.length <= 1) return current;
      return { ...current, participantes: current.participantes.slice(0, -1) };
    });
  };

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <p className="text-uppercase text-muted small mb-1">IV. Registro de actividades con la familia y la comunidad</p>
            <h4 className="fw-bold mb-0">Coordinación con familias y entorno</h4>
          </div>
          {onSave && (
            <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? "Guardando..." : "Guardar sección"}
            </button>
          )}
        </div>

        {actividadSectionConfigs.map((section, index) => {
          const sectionData = data[section.id];
          const columns = section.columns;
          return (
            <div key={section.id} className={index !== 0 ? "pt-4 border-top mt-4" : ""}>
              <header className="mb-4">
                <p className="text-uppercase text-muted small mb-1">{section.badge}</p>
                <h5 className="fw-bold mb-1">{section.title}</h5>
                <p className="text-secondary mb-0">{section.intro}</p>
              </header>

              <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <span className="fw-semibold text-muted">Fecha:</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  style={{ maxWidth: 220 }}
                  value={sectionData.fecha}
                  onChange={(e) => handleFieldChange(section.id, "fecha", e.target.value)}
                />
              </div>

              <div className="border rounded-3 mb-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3">
                  <h6 className="mb-0">Tabla de participantes</h6>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => handleAddParticipante(section.id)}>
                      Agregar fila
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleRemoveParticipante(section.id)}
                      disabled={sectionData.participantes.length <= 1}
                    >
                      Quitar fila
                    </button>
                  </div>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        {columns.map((column) => (
                          <th key={`${section.id}-head-${column.field}`}>{column.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sectionData.participantes.map((participante, rowIdx) => (
                        <tr key={`${section.id}-participante-${rowIdx}`}>
                          {columns.map((column) => (
                            <td key={`${section.id}-${column.field}-${rowIdx}`}>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={participante[column.field] || ""}
                                onChange={(e) => handleParticipanteChange(section.id, rowIdx, column.field, e.target.value)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border rounded-3 p-4">
                {actividadDetailBlocks.map((block, idx) => (
                  <div key={`${section.id}-${block.field}`} className={idx !== actividadDetailBlocks.length - 1 ? "mb-4" : "mb-0"}>
                    <label className="fw-semibold text-muted mb-2 d-block">{block.label}</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={sectionData[block.field]}
                      onChange={(e) => handleFieldChange(section.id, block.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

const createLogrosParticipante = () => ({
  nombre: "",
  rol: "",
  rut: "",
  telefono: "",
  firma: "",
});

const logrosParticipanteColumns = [
  { field: "nombre", label: "Nombre de los/as participantes" },
  { field: "rol", label: "Rol que desempeña" },
  { field: "rut", label: "RUT" },
  { field: "telefono", label: "Teléfono" },
  { field: "firma", label: "Firma" },
];

const ensureActaState = (value) => ({
  fecha: value?.fecha || "",
  participantes:
    Array.isArray(value?.participantes) && value.participantes.length
      ? value.participantes.map((p) => ({ ...createLogrosParticipante(), ...p }))
      : Array.from({ length: 6 }, () => createLogrosParticipante()),
  motivo: value?.motivo || "",
  acuerdos: value?.acuerdos || "",
  compromisos: value?.compromisos || "",
});

const logrosDetailBlocks = [
  { field: "motivo", label: "a) Motivo(s)" },
  { field: "acuerdos", label: "b) Acuerdo(s)" },
  { field: "compromisos", label: "c) Compromiso(s)" },
];

function LogrosSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const data = ensureActaState(value);

  const handleSave = async () => {
    if (saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(data);
    } catch (error) {
      console.error("No se pudo guardar el Acta de reuniones.", error);
    } finally {
      setSaving(false);
    }
  };

  const updateState = (updater) => {
    setValue((prev) => updater(ensureActaState(prev)));
  };

  const handleFieldChange = (field, newValue) => {
    updateState((current) => ({ ...current, [field]: newValue }));
  };

  const handleParticipanteChange = (index, field, newValue) => {
    updateState((current) => ({
      ...current,
      participantes: current.participantes.map((row, idx) =>
        idx === index ? { ...row, [field]: newValue } : row
      ),
    }));
  };

  const handleAddParticipante = () => {
    updateState((current) => ({
      ...current,
      participantes: [...current.participantes, createLogrosParticipante()],
    }));
  };

  const handleRemoveParticipante = () => {
    updateState((current) => {
      if (current.participantes.length <= 1) return current;
      return { ...current, participantes: current.participantes.slice(0, -1) };
    });
  };

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <header className="mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <p className="text-uppercase text-muted small mb-1">V. Acta de reuniones</p>
              <h4 className="fw-bold mb-1">Registro de participación y acuerdos</h4>
              <p className="text-secondary mb-0">Documenta a los asistentes y los principales acuerdos surgidos en cada reunión.</p>
            </div>
            {onSave && (
              <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                {saving ? "Guardando..." : "Guardar sección"}
              </button>
            )}
          </div>
        </header>

        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
          <span className="fw-semibold text-muted">Fecha:</span>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ maxWidth: 220 }}
            value={data.fecha}
            onChange={(e) => handleFieldChange("fecha", e.target.value)}
          />
        </div>

        <div className="border rounded-3 mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3">
            <h6 className="mb-0">Participantes de la reunión</h6>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleAddParticipante}>
                Agregar fila
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={handleRemoveParticipante}
                disabled={data.participantes.length <= 1}
              >
                Quitar fila
              </button>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  {logrosParticipanteColumns.map((column) => (
                    <th key={`head-${column.field}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.participantes.map((participante, index) => (
                  <tr key={`participante-${index}`}>
                    {logrosParticipanteColumns.map((column) => (
                      <td key={`${column.field}-${index}`}>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={participante[column.field] || ""}
                          onChange={(e) => handleParticipanteChange(index, column.field, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border rounded-3 p-4">
          {logrosDetailBlocks.map((block, idx) => (
            <div key={block.field} className={idx !== logrosDetailBlocks.length - 1 ? "mb-4" : "mb-0"}>
              <label className="fw-semibold text-muted mb-2 d-block">{block.label}</label>
              <textarea
                className="form-control"
                rows={4}
                value={data[block.field]}
                onChange={(e) => handleFieldChange(block.field, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}