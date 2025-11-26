import React, { useState } from "react";
import { postActividadComunidad } from "../../../servicios/apiPie";

const createEmptyParticipante = () => ({
  nombre: "",
  identificacion: "",
  contacto: "",
  firma: "",
});

const participanteColumns = [
  { field: "nombre", label: "Nombre de los/as participantes" },
  {
    field: "identificacion",
    label: "Identifique si es apoderado o profesional del establecimiento",
  },
  { field: "contacto", label: "Teléfono / Mail" },
  { field: "firma", label: "Firma" },
];

const detailBlocks = [
  { field: "objetivo", label: "a) Objetivo(s)" },
  { field: "actividad", label: "b) Actividad" },
  { field: "acuerdos", label: "c) Acuerdo(s)/compromiso(s)" },
  { field: "resultados", label: "d) Resultado(s)" },
];

const ensureSectionState = (section) => ({
  fecha: section?.fecha || "",
  participantes:
    Array.isArray(section?.participantes) && section.participantes.length
      ? section.participantes.map((p) => ({ ...createEmptyParticipante(), ...p }))
      : Array.from({ length: 5 }, () => createEmptyParticipante()),
  objetivo: section?.objetivo || "",
  actividad: section?.actividad || "",
  acuerdos: section?.acuerdos || "",
  resultados: section?.resultados || "",
});

const ensureActividadState = (value) => ({
  familia: ensureSectionState(value?.familia),
  comunidad: ensureSectionState(value?.comunidad),
});

const sectionConfigs = [
  {
    id: "familia",
    badge: "Educación Especial",
    title: "1. Trabajo con la familia, apoderados y/o con el o la estudiante",
    intro:
      "Registra las coordinaciones y compromisos asumidos con la familia o el estudiante para asegurar la continuidad de los apoyos.",
    columns: participanteColumns,
  },
  {
    id: "comunidad",
    badge: "Educación Especial",
    title: "2. Trabajo con la comunidad y el entorno escolar.",
    intro:
      "Detalla las acciones colaborativas realizadas con organizaciones del entorno escolar u otros actores comunitarios.",
    columns: [
      participanteColumns[0],
      {
        field: "identificacion",
        label: "Identifique si es apoderado o profesional del establecimiento; o de empresa u organizaciones sociales",
      },
      participanteColumns[2],
      participanteColumns[3],
    ],
  },
];

export default function ActividadComunidadSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const data = ensureActividadState(value);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await postActividadComunidad(data);
      if (onSave) {
        await onSave(data);
      }
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
      participantes: [...current.participantes, createEmptyParticipante()],
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

        {sectionConfigs.map((section, index) => {
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
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleAddParticipante(section.id)}
                    >
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
                                onChange={(e) =>
                                  handleParticipanteChange(section.id, rowIdx, column.field, e.target.value)
                                }
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
                {detailBlocks.map((block, idx) => (
                  <div key={`${section.id}-${block.field}`} className={idx !== detailBlocks.length - 1 ? "mb-4" : "mb-0"}>
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