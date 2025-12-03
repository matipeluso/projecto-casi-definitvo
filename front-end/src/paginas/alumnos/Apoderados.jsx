import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Buscar from "../../componentes/interfaz/Buscar";
import BotonCrearConModal from "../../componentes/interfaz/BotonCrearConModal";
import BotonEditarConModal from "../../componentes/interfaz/BotonEditarConModal";
import { useAuth } from "../../contexto/AuthContext";
import {
  listarApoderados,
  crearApoderado,
  actualizarApoderado,
  eliminarApoderado,
} from "../../servicios/apoderados";

function norm(text) {
  return (text ?? "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Apoderados() {
  const [apoderados, setApoderados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const soloLecturaProfesional = Boolean(user && !user.is_staff && !user.is_superuser);

  async function cargarApoderados() {
    setCargando(true);
    setError("");
    try {
      const { data } = await listarApoderados();
      const items = Array.isArray(data) ? data : data?.results ?? [];
      setApoderados(items);
    } catch (err) {
      console.error("[Apoderados] Error al cargar", err);
      setError("No se pudo cargar la lista de apoderados.");
      toast.error("No se pudo cargar la lista de apoderados.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarApoderados();
  }, []);

  const filtrados = useMemo(() => {
    const q = norm(busqueda);
    if (!q) return apoderados;
    return apoderados.filter((apo) =>
      [
        apo.nombres_apellidos,
        apo.run,
        apo.telefono,
        apo.correo,
        apo.parentesco,
        apo.ocupacion,
      ]
        .filter(Boolean)
        .some((campo) => norm(campo).includes(q))
    );
  }, [apoderados, busqueda]);

  function transformarPayload(vals) {
    const clean = (value) => {
      const trimmed = (value ?? "").trim();
      return trimmed === "" ? null : trimmed;
    };
    return {
      nombres_apellidos: (vals.nombres_apellidos ?? "").trim(),
      run: clean(vals.run),
      telefono: clean(vals.telefono),
      correo: clean(vals.correo),
      direccion: clean(vals.direccion),
      parentesco: clean(vals.parentesco),
      ocupacion: clean(vals.ocupacion),
      escolaridad: clean(vals.escolaridad),
    };
  }

  async function handleCrear(payload) {
    try {
      await crearApoderado(payload);
      toast.success("Apoderado registrado.");
      await cargarApoderados();
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo crear el apoderado.";
      toast.error(msg);
      throw err;
    }
  }

  async function handleActualizar(id, payload) {
    try {
      await actualizarApoderado(id, payload);
      toast.success("Apoderado actualizado.");
      await cargarApoderados();
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo actualizar el apoderado.";
      toast.error(msg);
      throw err;
    }
  }

  async function handleEliminar(id) {
    if (!window.confirm("¿Eliminar este apoderado? Esta acción no se puede deshacer.")) return;
    try {
      await eliminarApoderado(id);
      setApoderados((prev) => prev.filter((a) => a.id !== id));
      toast.success("Apoderado eliminado.");
    } catch (err) {
      const detalle = err?.response?.data;
      const msg = detalle?.detail || detalle?.message || "No se pudo eliminar el apoderado.";
      toast.error(msg);
    }
  }

  const camposFormulario = [
    { name: "nombres_apellidos", label: "Nombre completo", required: true, col: "col-md-6" },
    {
      name: "run",
      label: "RUN",
      col: "col-md-3",
      attrs: {
        pattern: "^[0-9kK.-]+$",
        title: "Use solo números, puntos, guion y dígito verificador.",
      },
    },
    {
      name: "telefono",
      label: "Teléfono",
      col: "col-md-3",
      type: "tel",
      attrs: {
        pattern: "^[0-9]{7,15}$",
        inputMode: "numeric",
        title: "Ingrese solo dígitos (7 a 15).",
      },
    },
    { name: "correo", label: "Correo", col: "col-md-4", type: "email" },
    { name: "direccion", label: "Dirección", col: "col-md-8" },
    { name: "parentesco", label: "Parentesco", col: "col-md-4" },
    { name: "ocupacion", label: "Ocupación", col: "col-md-4" },
    { name: "escolaridad", label: "Escolaridad", col: "col-md-4" },
  ];

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
        <div>
          <h2 className="h4 mb-1">Apoderados</h2>
          <p className="text-muted mb-0">Registro de contactos responsables de los estudiantes.</p>
        </div>
        <div className="d-flex gap-2">
          <BotonCrearConModal
            textoBoton="+ Nuevo apoderado"
            icono="bi-person-add"
            titulo="Registrar apoderado"
            tamanoModal="modal-lg"
            campos={camposFormulario}
            valoresIniciales={{}}
            transformarValores={transformarPayload}
            onGuardar={handleCrear}
          />
          <button type="button" className="btn btn-outline-secondary" onClick={cargarApoderados} disabled={cargando}>
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
            Refrescar
          </button>
        </div>
      </div>

      <Buscar
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por nombre, RUN, contacto o parentesco…"
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
              <th>Nombre</th>
              <th>RUN</th>
              <th>Teléfono</th>
              <th>Correo</th>
              <th>Parentesco</th>
              <th>Ocupación</th>
              {!soloLecturaProfesional && <th className="text-end">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={soloLecturaProfesional ? 6 : 7} className="text-center">Cargando…</td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={soloLecturaProfesional ? 6 : 7} className="text-center text-muted">No hay apoderados registrados.</td>
              </tr>
            ) : (
              filtrados.map((apo) => (
                <tr key={apo.id || apo.run}>
                  <td>{apo.nombres_apellidos || "—"}</td>
                  <td>{apo.run || "—"}</td>
                  <td>{apo.telefono || "—"}</td>
                  <td>{apo.correo || "—"}</td>
                  <td>{apo.parentesco || "—"}</td>
                  <td>{apo.ocupacion || "—"}</td>
                  {!soloLecturaProfesional && (
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <BotonEditarConModal
                          registro={{
                            nombres_apellidos: apo.nombres_apellidos ?? "",
                            run: apo.run ?? "",
                            telefono: apo.telefono ?? "",
                            correo: apo.correo ?? "",
                            direccion: apo.direccion ?? "",
                            parentesco: apo.parentesco ?? "",
                            ocupacion: apo.ocupacion ?? "",
                            escolaridad: apo.escolaridad ?? "",
                          }}
                          titulo="Editar apoderado"
                          textoBoton="Editar"
                          icono="bi-pencil-square"
                          className="btn btn-sm btn-outline-primary"
                          campos={camposFormulario}
                          transformarValores={transformarPayload}
                          onGuardar={(payload) => handleActualizar(apo.id, payload)}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleEliminar(apo.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
