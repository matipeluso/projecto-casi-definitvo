import React from "react";

const calcularEdad = (fechaISO) => {
  if (!fechaISO) {
    return { years: "", months: "" };
  }
  const nacimiento = new Date(fechaISO);
  if (Number.isNaN(nacimiento.getTime())) {
    return { years: "", months: "" };
  }
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
    years: years < 0 ? "" : years,
    months: months < 0 ? "" : months,
  };
};

const buildCursoLabel = (curso) => {
  if (!curso) return "";
  const establecimiento = curso?.establecimiento?.nombre ? ` – ${curso.establecimiento.nombre}` : "";
  return `${curso.nombre || ""}${establecimiento}`;
};

const LENGUA_INDICADORES = ["comprende", "habla", "lee", "escribe"];

const LENGUA_ROWS = [
  {
    key: "materna",
    label: "Lengua materna",
    gradoField: "lengua_materna_grado",
    indicadores: {
      comprende: "lengua_materna_comprende",
      habla: "lengua_materna_habla",
      lee: "lengua_materna_lee",
      escribe: "lengua_materna_escribe",
    },
    idiomaKey: "lengua_origen",
    dominioKey: "dominio_lengua_origen",
  },
  {
    key: "uso",
    label: "Lengua de uso",
    gradoField: "lengua_uso_grado",
    indicadores: {
      comprende: "lengua_uso_comprende",
      habla: "lengua_uso_habla",
      lee: "lengua_uso_lee",
      escribe: "lengua_uso_escribe",
    },
    idiomaKey: "lengua_uso",
    dominioKey: "dominio_lengua_uso",
  },
];

export default function IdentificacionEstudiante({
  cursos = [],
  estudiantes = [],
  cursoSeleccionado = "",
  estudianteSeleccionado = "",
  estudianteActivo = null,
  onCursoChange,
  onEstudianteChange,
  cargandoCursos = false,
  cargandoEstudiantes = false,
  puedeEditar = false,
  isLoading = false,
  isSaving = false,
  evaluacionId = null,
  user = null,
  onGuardar,
  onLimpiar,
  edadAnios = "",
  edadMeses = "",
  onEdadChange,
  lenguaDominio = {
    materna: { grado: "", comprende: false, habla: false, lee: false, escribe: false },
    uso: { grado: "", comprende: false, habla: false, lee: false, escribe: false },
  },
  onLenguaDominioChange,
  fechaEvaluacion = "",
  onFechaEvaluacionChange,
}) {
  const edad = calcularEdad(estudianteActivo?.fecha_nacimiento);
  const estadoEvaluacion = isLoading ? "Cargando..." : evaluacionId ? "Edición" : "Nuevo registro";
  const profesional = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "";
  const establecimiento = estudianteActivo?.establecimiento || estudianteActivo?.curso?.establecimiento;
  const cursoActual = buildCursoLabel(estudianteActivo?.curso);
  const edadAnosInputValue =
    edadAnios === null || typeof edadAnios === "undefined" || edadAnios === ""
      ? (edad.years === "" ? "" : String(edad.years))
      : String(edadAnios);
  const edadMesesInputValue =
    edadMeses === null || typeof edadMeses === "undefined" || edadMeses === ""
      ? (edad.months === "" ? "" : String(edad.months))
      : String(edadMeses);
  const handleEdadInput = (field, maxValue) => (event) => {
    const raw = event.target.value;
    if (raw === "") {
      onEdadChange?.(field, "");
      return;
    }
    const numeric = raw.replace(/[^0-9]/g, "");
    if (numeric === "") {
      onEdadChange?.(field, "");
      return;
    }
    const asNumber = parseInt(numeric, 10);
    const bounded = typeof maxValue === "number" ? Math.min(asNumber, maxValue) : asNumber;
    onEdadChange?.(field, String(bounded));
  };
  const edadDisabled = !puedeEditar || isSaving;

  return (
    <div className="container mb-4">
      <div className="border rounded p-4 bg-white">
        <h4 className="text-uppercase fw-bold mb-3">Identificación del estudiante</h4>

        <section className="mb-4">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Curso</label>
              <select
                className="form-select"
                value={cursoSeleccionado}
                onChange={(event) => onCursoChange?.(event.target.value)}
                disabled={cargandoCursos}
              >
                <option value="">{cargandoCursos ? "Cargando cursos..." : "Seleccione un curso"}</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {buildCursoLabel(curso)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-8">
              <label className="form-label">Estudiante</label>
              <select
                className="form-select"
                value={estudianteSeleccionado}
                onChange={(event) => onEstudianteChange?.(event.target.value)}
                disabled={!cursoSeleccionado || cargandoEstudiantes}
              >
                <option value="">
                  {!cursoSeleccionado
                    ? "Seleccione un curso primero"
                    : cargandoEstudiantes
                      ? "Cargando estudiantes..."
                      : "Seleccione un estudiante"}
                </option>
                {estudiantes.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.nombres_apellidos}
                    {est?.curso?.nombre ? ` – ${est.curso.nombre}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha de evaluación</label>
              <input
                type="date"
                className="form-control"
                value={fechaEvaluacion || ""}
                onChange={(event) => onFechaEvaluacionChange?.(event.target.value)}
                disabled={!puedeEditar || isSaving}
              />
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-4">
              <label className="form-label">Profesional responsable</label>
              <input type="text" className="form-control" value={profesional} disabled />
            </div>
            <div className="col-md-4">
              <label className="form-label">Rol / Cargo</label>
              <input type="text" className="form-control" value={user?.cargo || user?.especialidad?.nombre || ""} disabled />
            </div>
            <div className="col-md-4">
              <label className="form-label">Estatus de la evaluación</label>
              <input type="text" className="form-control" value={estadoEvaluacion} disabled />
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onGuardar}
              disabled={!puedeEditar || isSaving}
            >
              {isSaving ? "Guardando..." : evaluacionId ? "Actualizar registro" : "Guardar registro"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onLimpiar}
              disabled={!puedeEditar || isSaving}
            >
              Limpiar selección
            </button>
          </div>
        </section>

        {estudianteActivo ? (
          <>
            <section className="mb-4">
              <h5 className="text-uppercase fw-bold mb-3">Datos personales</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre completo</label>
                  <input type="text" className="form-control" value={estudianteActivo.nombres_apellidos || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">RUN / RUT</label>
                  <input type="text" className="form-control" value={estudianteActivo.run || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Nombre social</label>
                  <input type="text" className="form-control" value={estudianteActivo.nombre_social || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Fecha nacimiento</label>
                  <input type="date" className="form-control" value={estudianteActivo.fecha_nacimiento || ""} disabled />
                </div>
                <div className="col-md-3 d-flex gap-2">
                  <div className="flex-fill">
                    <label className="form-label">Edad (años)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={edadAnosInputValue}
                      onChange={handleEdadInput("edad_anios")}
                      disabled={edadDisabled}
                    />
                  </div>
                  <div className="flex-fill">
                    <label className="form-label">Meses</label>
                    <input
                      type="number"
                      min="0"
                      max="11"
                      className="form-control"
                      value={edadMesesInputValue}
                      onChange={handleEdadInput("edad_meses", 11)}
                      disabled={edadDisabled}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Género</label>
                  <input type="text" className="form-control" value={estudianteActivo.genero || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">País / Nacionalidad</label>
                  <input type="text" className="form-control" value={estudianteActivo.nacionalidad || ""} disabled />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Domicilio</label>
                  <input type="text" className="form-control" value={estudianteActivo.direccion || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Teléfono</label>
                  <input type="text" className="form-control" value={estudianteActivo.telefono || ""} disabled />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Vía de comunicación</label>
                  <input type="text" className="form-control" value={estudianteActivo.via_comunicacion || ""} disabled />
                </div>
              </div>
            </section>

            <section className="mb-4">
              <h5 className="text-uppercase fw-bold mb-3">Características lingüísticas</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-sm align-middle text-center">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "22%" }}>Lengua</th>
                      <th style={{ width: "20%" }}>Grado dominio (entrevista)</th>
                      {LENGUA_INDICADORES.map((col) => (
                        <th key={col} className="text-capitalize">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {LENGUA_ROWS.map((row) => {
                      const rowState = lenguaDominio?.[row.key] || {};
                      return (
                        <tr key={row.key}>
                          <td className="text-start">
                            <div className="fw-semibold">{row.label}</div>
                            <div className="text-muted small">
                              {row.idiomaKey && estudianteActivo?.[row.idiomaKey]
                                ? estudianteActivo[row.idiomaKey]
                                : "Sin registro"}
                            </div>
                            <div className="text-muted small">
                              {row.dominioKey && estudianteActivo?.[row.dominioKey]
                                ? estudianteActivo[row.dominioKey]
                                : ""}
                            </div>
                          </td>
                          <td className="text-start">
                            <input
                              type="text"
                              className="form-control"
                              value={rowState.grado || ""}
                              onChange={(event) => onLenguaDominioChange?.(row.gradoField, event.target.value)}
                              disabled={!puedeEditar || isSaving}
                            />
                          </td>
                          {LENGUA_INDICADORES.map((col) => (
                            <td key={`${row.key}-${col}`}>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={Boolean(rowState[col])}
                                onChange={(event) =>
                                  onLenguaDominioChange?.(row.indicadores[col], event.target.checked)
                                }
                                disabled={!puedeEditar || isSaving}
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h5 className="text-uppercase fw-bold mb-3">Vínculo escolar</h5>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Curso actual</label>
                  <input type="text" className="form-control" value={cursoActual} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Año escolar</label>
                  <input type="text" className="form-control" value={estudianteActivo?.curso?.anio_escolar || ""} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Establecimiento</label>
                  <input type="text" className="form-control" value={establecimiento?.nombre || ""} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">RBD</label>
                  <input type="text" className="form-control" value={establecimiento?.rbd || ""} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Apoderado</label>
                  <input type="text" className="form-control" value={estudianteActivo?.apoderado?.nombres_apellidos || ""} disabled />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Contacto apoderado</label>
                  <input type="text" className="form-control" value={estudianteActivo?.apoderado?.telefono || ""} disabled />
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="alert alert-info mb-0">
            Seleccione un curso y luego un estudiante para visualizar sus datos registrados en la plataforma.
          </div>
        )}
      </div>
    </div>
  );
}
