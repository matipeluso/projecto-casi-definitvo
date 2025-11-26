import React, { useState } from "react";
import { postTrabajoColaborativo } from "../../../servicios/apiPie";

const periodosLabels = ["1° Período", "2° Período", "3° Período"];

const horasPedagogicasOptions = ["30 minutos", "1 hora", "2 horas", "3 horas", "4 horas", "5 horas", "6 horas"];

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

export default function TrabajoColaborativoSection({ value, setValue, onSave }) {
  const [saving, setSaving] = useState(false);
  const periodos = ensurePeriodos(value?.periodos);
  const accionesDocente = ensureAccionesDocente(value?.accionesDocente);
  const registroApoyos = ensureRegistroApoyos(value?.registroApoyos);
  const logrosAprendizaje = ensureLogrosAprendizaje(value?.logrosAprendizaje);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await postTrabajoColaborativo(value);
      if (onSave) {
        await onSave(value);
      }
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
                a) Indicar las acciones de aplicación de las estrategias diversificadas planificadas, en los
                períodos estipulados previamente (Item II, 1.b).
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
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => handleAddFila(index)}
                >
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
              b) Registro de acciones realizadas por el profesor o profesora de aula ya sea para la
              planificación conjunta de la respuesta educativa diversificada o para el seguimiento y
              evaluación del trabajo colaborativo, entre otras actividades.
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
              Registrar, por estudiante o grupos de estudiantes, los apoyos específicos o actividades especiales que se realizan en forma
              individual o en pequeños grupos dentro o fuera del aula regular y el o los nombres de los profesionales que los entregan.
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
              Señalar los aprendizajes logrados por aquellos estudiantes que han recibido apoyos específicos, en los períodos definidos por el
              establecimiento.
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