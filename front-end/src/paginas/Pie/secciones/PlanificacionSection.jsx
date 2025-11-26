import React, { useState } from "react";
import { postPlanificacion } from "../../../servicios/apiPie";

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

export default function PlanificacionSection({ value, setValue, onSave }) {
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
    if (saving) return;
    setSaving(true);
    try {
      await postPlanificacion(value);
      if (onSave) {
        await onSave(value);
      }
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
            Descripción de las características del curso, destacando sus principales fortalezas y
            necesidades de apoyo.
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
              <p className="text-secondary small mb-0">
                Para las acciones que aplicará el profesor de educación regular en el curso.
              </p>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-primary btn-sm"
                type="button"
                onClick={handleAddStrategy}
              >
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
                  <StrategyRow
                    key={`estrategia-${index}`}
                    index={index}
                    value={row}
                    onChange={handleStrategyChange}
                  />
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
              a) Estrategias que se utilizarán para dar respuesta a la diversidad de estudiantes, en el
              aula común
            </span>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "30%" }}>
                    Criterios sobre enseñanza y aprendizaje a considerar en la planificación y
                    evaluación en el aula, a saber:
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
                              <label
                                key={`${row.key}-${option}`}
                                className="form-check form-check-sm d-flex align-items-center"
                              >
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
                  <td className="fw-semibold align-top">
                    Ajustes (Señalar en qué aspecto o nivel se realizarán ajustes):
                  </td>
                  <td>
                    <div className="d-flex flex-column gap-1">
                      {adjustmentOptions.map((option) => (
                        <label
                          key={`ajuste-opt-${option}`}
                          className="form-check form-check-sm d-flex align-items-center"
                        >
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
              b) Estrategias que se utilizarán para adecuar o flexibilizar el currículum, según
              corresponda.
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
            *El detalle de las estrategias y procedimientos de las adecuaciones curriculares debe
            encontrarse en el Plan de Adecuación Curricular Individual (PACI).
          </p>
        </div>

        <div className="mb-4">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="fw-semibold">
              c) Estrategias y procedimientos de evaluación de aprendizaje con foco en la diversidad y
              en las necesidades educativas especiales:
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
            Considerar estrategias de participación y trabajo colaborativo en distintas etapas e
            instancias del proceso educativo (planificación, evaluación, experiencias de aprendizaje,
            etc.).
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
                <tr key={`familia-row-${row.key}`}
                >
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
