import api from "./api";

export function listarEstudiantes(params = {}) {
  return api.get("/estudiantes/", { params });
}

export function obtenerEstudiante(id) {
  return api.get(`/estudiantes/${id}/`);
}

export function crearEstudiante(payload) {
  return api.post("/estudiantes/", payload);
}

export function actualizarEstudiante(id, payload) {
  return api.patch(`/estudiantes/${id}/`, payload);
}

export function eliminarEstudiante(id) {
  return api.delete(`/estudiantes/${id}/`);
}
