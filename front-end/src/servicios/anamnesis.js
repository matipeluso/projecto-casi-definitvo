import api from "./api";

export const listarAnamnesis = (params = {}) => api.get("/anamnesis/", { params });

export const crearAnamnesis = (payload) => api.post("/anamnesis/", payload);

export const actualizarAnamnesis = (id, payload) => api.patch(`/anamnesis/${id}/`, payload);

export const obtenerAnamnesis = (id) => api.get(`/anamnesis/${id}/`);

export const descargarPdfAnamnesis = (id) =>
	api.get(`/anamnesis/${id}/descargar-pdf/`, { responseType: "blob" });
