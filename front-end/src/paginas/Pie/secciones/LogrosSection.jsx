import React, { useState } from "react";
import { postLogros } from "../../../servicios/apiPie";

const createEmptyParticipante = () => ({
  nombre: "",
  rol: "",
  rut: "",
  telefono: "",
  firma: "",
});

const participanteColumns = [
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
      ? value.participantes.map((p) => ({ ...createEmptyParticipante(), ...p }))
      : Array.from({ length: 6 }, () => createEmptyParticipante()),
  motivo: value?.motivo || "",
  acuerdos: value?.acuerdos || "",
  compromisos: value?.compromisos || "",
});

export default function LogrosSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const data = ensureActaState(value);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await postLogros(data);
      if (onSave) {
        await onSave(data);
      }
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
      participantes: [...current.participantes, createEmptyParticipante()],
    }));
  };

  const handleRemoveParticipante = () => {
    updateState((current) => {
      if (current.participantes.length <= 1) return current;
      return { ...current, participantes: current.participantes.slice(0, -1) };
    });
  };

  const detailBlocks = [
    { field: "motivo", label: "a) Motivo(s)" },
    { field: "acuerdos", label: "b) Acuerdo(s)" },
    { field: "compromisos", label: "c) Compromiso(s)" },
  ];

  return (
    <section className="card border-0 shadow-sm">
      <div className="card-body p-4">
        <header className="mb-4">
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <p className="text-uppercase text-muted small mb-1">V. Acta de reuniones</p>
              <h4 className="fw-bold mb-1">Registro de participación y acuerdos</h4>
              <p className="text-secondary mb-0">
                Documenta a los asistentes y los principales acuerdos surgidos en cada reunión.
              </p>
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
                  {participanteColumns.map((column) => (
                    <th key={`head-${column.field}`}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.participantes.map((participante, index) => (
                  <tr key={`participante-${index}`}>
                    {participanteColumns.map((column) => (
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
          {detailBlocks.map((block, idx) => (
            <div key={block.field} className={idx !== detailBlocks.length - 1 ? "mb-4" : "mb-0"}>
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