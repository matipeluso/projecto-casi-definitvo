import api from "./api";

const RESOURCE = "/evaluaciones-psicopedagogicas/";

export async function listarEvaluacionesPsico(params = {}) {
  const res = await api.get(RESOURCE, { params });
  return res.data;
}

export async function obtenerEvaluacionPsico(id) {
  const res = await api.get(`${RESOURCE}${id}/`);
  return res.data;
}

export async function obtenerEvaluacionPorEstudiante(estudianteId) {
  if (!estudianteId) return null;
  const res = await api.get(RESOURCE, { params: { estudiante: estudianteId } });
  const payload = res.data;
  const lista = Array.isArray(payload) ? payload : payload?.results ?? [];
  return lista[0] ?? null;
}

export async function crearEvaluacionPsico(datos) {
  const res = await api.post(RESOURCE, datos);
  return res.data;
}

export async function actualizarEvaluacionPsico(id, datos) {
  const res = await api.patch(`${RESOURCE}${id}/`, datos);
  return res.data;
}

export async function eliminarEvaluacionPsico(id) {
  const res = await api.delete(`${RESOURCE}${id}/`);
  return res.data;
}

export async function descargarPdfEvaluacion(id) {
  const res = await api.get(`${RESOURCE}${id}/descargar-pdf/`, {
    responseType: "blob",
  });
  return res.data;
}

