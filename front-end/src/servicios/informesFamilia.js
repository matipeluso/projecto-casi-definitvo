import api from "./api";

export function listarInformesFamilia(params = {}) {
  return api.get("/informes-familia/", { params });
}

export function crearInformeFamilia(payload) {
  return api.post("/informes-familia/", payload);
}

export function actualizarInformeFamilia(id, payload) {
  return api.put(`/informes-familia/${id}/`, payload);
}

export function descargarPdfInformeFamilia(id) {
  return api.get(`/informes-familia/${id}/descargar-pdf/`, {
    responseType: "blob",
  });
}
