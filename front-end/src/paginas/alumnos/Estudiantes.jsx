import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Buscar from "../../componentes/interfaz/Buscar";
import BotonCrearConModal from "../../componentes/interfaz/BotonCrearConModal";
import {
  listarEstudiantes,
  crearEstudiante,
  actualizarEstudiante,
  eliminarEstudiante,
} from "../../servicios/estudiantes";
import { listarCursos } from "../../servicios/cursos";
import { listarEstablecimientos } from "../../servicios/establecimientos";
import { listarApoderados } from "../../servicios/apoderados";
import { obtenerEvaluacionPorEstudiante } from "../../servicios/evaluacionPsico";
import { descargarPdfEvaluacion } from "../../servicios/evaluacionPsico";

function norm(texto) {
  return (texto ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}


function saveBlobAsFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function mapAlumnoToInitialValues(alumno) {
  if (!alumno) return {};
  return {
    nombres_apellidos: alumno.nombres_apellidos || "",
    nombre_social: alumno.nombre_social || "",
    run: alumno.run || "",
    genero: alumno.genero || "",
    fecha_nacimiento: alumno.fecha_nacimiento || "",
    nacionalidad: alumno.nacionalidad || "",
    lengua_origen: alumno.lengua_origen || "",
    lengua_uso: alumno.lengua_uso || "",
    direccion: alumno.direccion || "",
    telefono: alumno.telefono || "",
    curso_id: alumno?.curso?.id ? String(alumno.curso.id) : "",
    establecimiento_id:
      alumno?.establecimiento?.id
        ? String(alumno.establecimiento.id)
        : alumno?.curso?.establecimiento?.id
          ? String(alumno.curso.establecimiento.id)
          : "",
    apoderado_id: alumno?.apoderado?.id ? String(alumno.apoderado.id) : "",
  };
}

export default function Estudiantes() {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [cargandoCombos, setCargandoCombos] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [apoderados, setApoderados] = useState([]);
  const [evaluacionesPsico, setEvaluacionesPsico] = useState({});
  const [cargandoEvaluaciones, setCargandoEvaluaciones] = useState(false);
  const [estudianteEliminando, setEstudianteEliminando] = useState(null);
  const [estudianteDescargando, setEstudianteDescargando] = useState(null);

  async function cargarEstudiantes() {
    setCargando(true);
    setError("");
    try {
      const { data } = await listarEstudiantes();
      const items = Array.isArray(data) ? data : data?.results ?? [];
      setEstudiantes(items);
    } catch (err) {
      console.error("[Estudiantes] Error al cargar", err);
      setError("No se pudo cargar la lista de estudiantes.");
      toast.error("No se pudo cargar la lista de estudiantes.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarEstudiantes();
    cargarCombos();
  }, []);

  useEffect(() => {
    let activo = true;
    async function cargarEvaluacionesPsico() {
      if (!estudiantes.length) {
        setEvaluacionesPsico({});
        setCargandoEvaluaciones(false);
        return;
      }
      setCargandoEvaluaciones(true);
      try {
        const resultados = await Promise.all(
          estudiantes.map((alumno) =>
            obtenerEvaluacionPorEstudiante(alumno.id).catch(() => null)
          )
        );
        if (!activo) return;
        const map = {};
        resultados.forEach((evaluacion, index) => {
          const alumno = estudiantes[index];
          if (alumno && evaluacion) {
            map[alumno.id] = evaluacion;
          }
        });
        setEvaluacionesPsico(map);
      } finally {
        if (activo) setCargandoEvaluaciones(false);
      }
    }
    cargarEvaluacionesPsico();
    return () => {
      activo = false;
    };
  }, [estudiantes]);

  async function cargarCombos() {
    setCargandoCombos(true);
    try {
      const [cursosRes, estRes, apoderadosRes] = await Promise.all([
        listarCursos(),
        listarEstablecimientos(),
        listarApoderados(),
      ]);
      const cursosData = Array.isArray(cursosRes.data) ? cursosRes.data : cursosRes.data?.results ?? [];
      const estData = Array.isArray(estRes.data) ? estRes.data : estRes.data?.results ?? [];
      const apoData = Array.isArray(apoderadosRes.data) ? apoderadosRes.data : apoderadosRes.data?.results ?? [];
      setCursos(cursosData);
      setEstablecimientos(estData);
      setApoderados(apoData);
    } catch (err) {
      console.error("[Estudiantes] Error cargando combos", err);
    } finally {
      setCargandoCombos(false);
    }
  }

  const filtrados = useMemo(() => {
    const q = norm(busqueda);
    if (!q) return estudiantes;
    return estudiantes.filter((alumno) =>
      [
        alumno.run,
        alumno.nombres_apellidos,
        alumno.nombre_social,
        alumno?.curso?.nombre,
        alumno?.curso?.establecimiento?.nombre,
        alumno?.establecimiento?.nombre,
        alumno?.apoderado?.nombres_apellidos,
        alumno.telefono,
        alumno.direccion,
        alumno.nacionalidad,
        alumno.lengua_origen,
        alumno.lengua_uso,
      ]
        .filter(Boolean)
        .some((campo) => norm(campo).includes(q))
    );
  }, [busqueda, estudiantes]);

  const opcionesCursos = useMemo(() => (
    [{ value: "", label: cursos.length ? "Seleccione curso" : "Sin cursos" }].concat(
      cursos.map((curso) => ({ value: String(curso.id), label: `${curso.nombre || "Curso"} – ${curso.establecimiento?.nombre || "Sin establecimiento"}` }))
    )
  ), [cursos]);

  const opcionesEstablecimientos = useMemo(() => (
    [{ value: "", label: establecimientos.length ? "Seleccione establecimiento" : "Sin establecimientos" }].concat(
      establecimientos.map((est) => ({ value: String(est.id), label: est.nombre }))
    )
  ), [establecimientos]);

  const opcionesApoderados = useMemo(() => (
    [{ value: "", label: apoderados.length ? "Seleccione apoderado" : "Sin apoderados" }].concat(
      apoderados.map((apo) => ({ value: String(apo.id), label: `${apo.nombres_apellidos || "Sin nombre"}${apo.run ? ` (${apo.run})` : ""}` }))
    )
  ), [apoderados]);

  const camposFormulario = useMemo(() => [
    { name: "nombres_apellidos", label: "Nombre completo", required: true, col: "col-md-6" },
    { name: "nombre_social", label: "Nombre social", col: "col-md-6" },
    { name: "run", label: "RUN", col: "col-md-3" },
    {
      name: "genero",
      label: "Género",
      type: "select",
      col: "col-md-3",
      options: [
        { value: "", label: "Seleccione género" },
        { value: "M", label: "Masculino" },
        { value: "F", label: "Femenino" },
        { value: "O", label: "Otro" },
      ],
    },
    { name: "fecha_nacimiento", label: "Fecha nacimiento", type: "date", col: "col-md-3" },
    { name: "nacionalidad", label: "Nacionalidad", col: "col-md-3" },
    { name: "lengua_origen", label: "Lengua de origen", col: "col-md-4" },
    { name: "lengua_uso", label: "Lengua de uso", col: "col-md-4" },
    {
      name: "curso_id",
      label: "Curso",
      type: "select",
      col: "col-md-6",
      options: opcionesCursos,
      disabled: cargandoCombos || cursos.length === 0,
      required: cursos.length > 0,
    },
    {
      name: "establecimiento_id",
      label: "Establecimiento",
      type: "select",
      col: "col-md-6",
      options: opcionesEstablecimientos,
      disabled: cargandoCombos || establecimientos.length === 0,
    },
    {
      name: "apoderado_id",
      label: "Apoderado",
      type: "select",
      col: "col-md-6",
      options: opcionesApoderados,
      disabled: cargandoCombos || apoderados.length === 0,
      required: apoderados.length > 0,
    },
    { name: "direccion", label: "Dirección", col: "col-md-8" },
    { name: "telefono", label: "Teléfono", col: "col-md-4" },
  ], [opcionesCursos, opcionesEstablecimientos, opcionesApoderados, cargandoCombos, cursos.length, establecimientos.length, apoderados.length]);

  function transformarEstudianteForm(vals) {
    const clean = (value) => {
      const trimmed = (value ?? "").trim();
      return trimmed === "" ? null : trimmed;
    };
    const cursoSeleccionado = cursos.find((curso) => String(curso.id) === String(vals.curso_id));
    const payload = {
      nombres_apellidos: (vals.nombres_apellidos ?? "").trim(),
      nombre_social: clean(vals.nombre_social),
      run: clean(vals.run),
      genero: clean(vals.genero),
      fecha_nacimiento: vals.fecha_nacimiento || null,
      nacionalidad: clean(vals.nacionalidad),
      lengua_origen: clean(vals.lengua_origen),
      lengua_uso: clean(vals.lengua_uso),
      direccion: clean(vals.direccion),
      telefono: clean(vals.telefono),
      curso_id: vals.curso_id || null,
      establecimiento_id: vals.establecimiento_id || null,
      apoderado_id: vals.apoderado_id || null,
    };
    if (!payload.establecimiento_id && cursoSeleccionado?.establecimiento?.id != null) {
      payload.establecimiento_id = String(cursoSeleccionado.establecimiento.id);
    }
    if (!payload.run) delete payload.run;
    if (!payload.curso_id) delete payload.curso_id;
    if (!payload.establecimiento_id) delete payload.establecimiento_id;
    if (!payload.apoderado_id) delete payload.apoderado_id;
    if (!payload.nombre_social) delete payload.nombre_social;
    if (!payload.genero) delete payload.genero;
    if (!payload.fecha_nacimiento) delete payload.fecha_nacimiento;
    if (!payload.nacionalidad) delete payload.nacionalidad;
    if (!payload.lengua_origen) delete payload.lengua_origen;
    if (!payload.lengua_uso) delete payload.lengua_uso;
    if (!payload.direccion) delete payload.direccion;
    if (!payload.telefono) delete payload.telefono;
    return payload;
  }

  async function handleCrearEstudiante(payload) {
    try {
      await crearEstudiante(payload);
      toast.success("Estudiante creado correctamente.");
      await cargarEstudiantes();
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo crear el estudiante.";
      toast.error(msg);
      throw err;
    }
  }

  async function handleActualizarEstudiante(id, payload) {
    try {
      await actualizarEstudiante(id, payload);
      toast.success("Estudiante actualizado correctamente.");
      await cargarEstudiantes();
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo actualizar el estudiante.";
      toast.error(msg);
      throw err;
    }
  }

  async function handleEliminarEstudiante(alumno) {
    if (!alumno?.id) return;
    const confirmado = window.confirm(`¿Eliminar a ${alumno.nombres_apellidos || "este estudiante"}?`);
    if (!confirmado) return;
    setEstudianteEliminando(alumno.id);
    try {
      await eliminarEstudiante(alumno.id);
      toast.success("Estudiante eliminado correctamente.");
      await cargarEstudiantes();
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo eliminar al estudiante.";
      toast.error(msg);
    } finally {
      setEstudianteEliminando(null);
    }
  }

  async function handleDescargarPdf(alumnoId) {
    const evaluacion = evaluacionesPsico[alumnoId];
    const pdfPath = evaluacion?.pdf_generado;
    if (!pdfPath) {
      toast.info("El estudiante no tiene un PDF asociado.");
      return;
    }
    setEstudianteDescargando(alumnoId);
    try {
      const blob = await descargarPdfEvaluacion(evaluacion.id);
      const filename = pdfPath.split("/").pop() || `evaluacion_psico_${evaluacion.id}.pdf`;
      saveBlobAsFile(blob, filename);
    } finally {
      setEstudianteDescargando(null);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h2 className="h4 mb-1">Estudiantes</h2>
          <p className="text-muted mb-0">Listado general de estudiantes registrados.</p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => navigate("/evaluacion-psicopedagogica")}
          >
            Ir a evaluación psicopedagógica
          </button>
          <BotonCrearConModal
            textoBoton="+ Nuevo estudiante"
            icono="bi-person-plus-fill"
            titulo="Registrar estudiante"
            tamanoModal="modal-lg"
            campos={camposFormulario}
            valoresIniciales={{ curso_id: "", establecimiento_id: "", apoderado_id: "" }}
            transformarValores={transformarEstudianteForm}
            onGuardar={handleCrearEstudiante}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={cargarEstudiantes} disabled={cargando}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Refrescar
          </button>
        </div>
      </div>

      <Buscar
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por RUN, nombre, curso, establecimiento o apoderado…"
      />

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="table-responsive">
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>RUN</th>
              <th>Nombre</th>
              <th>Nombre social</th>
              <th>Curso</th>
              <th>Establecimiento</th>
              <th>Género</th>
              <th>Nacimiento</th>
              <th>Nacionalidad</th>
              <th>Lengua origen</th>
              <th>Lengua uso</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Apoderado</th>
              <th>Contacto apoderado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={15} className="text-center">
                  Cargando…
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={15} className="text-center text-muted">
                  No hay estudiantes para mostrar.
                </td>
              </tr>
            ) : (
              filtrados.map((alumno) => (
                <tr key={alumno.id || alumno.run}>
                  <td>{alumno.run || "—"}</td>
                  <td>{alumno.nombres_apellidos || "—"}</td>
                  <td>{alumno.nombre_social || "—"}</td>
                  <td>{alumno?.curso?.nombre || "—"}</td>
                  <td>{alumno?.curso?.establecimiento?.nombre || alumno?.establecimiento?.nombre || "—"}</td>
                  <td>{alumno.genero || "—"}</td>
                  <td>{alumno.fecha_nacimiento || "—"}</td>
                  <td>{alumno.nacionalidad || "—"}</td>
                  <td>{alumno.lengua_origen || "—"}</td>
                  <td>{alumno.lengua_uso || "—"}</td>
                  <td>{alumno.direccion || "—"}</td>
                  <td>{alumno.telefono || "—"}</td>
                  <td>{alumno?.apoderado?.nombres_apellidos || "—"}</td>
                  <td>
                    {alumno?.apoderado?.telefono || alumno?.apoderado?.correo || "—"}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <BotonCrearConModal
                        textoBoton="Editar"
                        icono="bi-pencil-square"
                        className="btn btn-sm btn-outline-primary"
                        titulo={`Editar ${alumno.nombres_apellidos || "estudiante"}`}
                        tamanoModal="modal-lg"
                        campos={camposFormulario}
                        valoresIniciales={mapAlumnoToInitialValues(alumno)}
                        transformarValores={transformarEstudianteForm}
                        onGuardar={(payload) => handleActualizarEstudiante(alumno.id, payload)}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleEliminarEstudiante(alumno)}
                        disabled={estudianteEliminando === alumno.id}
                      >
                        {estudianteEliminando === alumno.id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <>
                            <i className="bi bi-trash me-1" aria-hidden="true"></i>
                            Eliminar
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleDescargarPdf(alumno.id)}
                        disabled={
                          cargandoEvaluaciones ||
                          estudianteDescargando === alumno.id ||
                          !evaluacionesPsico[alumno.id]?.pdf_generado
                        }
                      >
                        {estudianteDescargando === alumno.id ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <>
                            <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true"></i>
                            PDF
                          </>
                        )}
                      </button>
                    </div>
                    <small className="text-muted d-block mt-1">
                      {cargandoEvaluaciones
                        ? "Buscando evaluación…"
                        : evaluacionesPsico[alumno.id]?.pdf_generado
                          ? "PDF disponible"
                          : evaluacionesPsico[alumno.id]
                            ? "Evaluación sin PDF"
                            : "Sin evaluación"}
                    </small>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
