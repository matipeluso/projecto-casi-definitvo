import api from "./api";

const ANTECEDENTES_URL = "/antecedentes-salud/";
const EVALUACIONES_URL = "/evaluaciones-salud/";

export const listarAntecedentesSalud = (params = {}) => api.get(ANTECEDENTES_URL, { params });
export const getAntecedenteSalud = (id) => api.get(`${ANTECEDENTES_URL}${id}/`);
export const crearAntecedenteSalud = (data) => api.post(ANTECEDENTES_URL, data);
export const actualizarAntecedenteSalud = (id, data) => api.patch(`${ANTECEDENTES_URL}${id}/`, data);
export const eliminarAntecedenteSalud = (id) => api.delete(`${ANTECEDENTES_URL}${id}/`);
export const descargarPdfAntecedenteSalud = (id) =>
	api.get(`${ANTECEDENTES_URL}${id}/descargar-pdf/`, { responseType: "blob" }).then((res) => res.data);
export const obtenerAntecedenteSaludPorEstudiante = async (estudianteId) => {
	if (!estudianteId) return null;
	const { data } = await listarAntecedentesSalud({ estudiante: estudianteId });
	const lista = Array.isArray(data) ? data : data?.results ?? [];
	return lista[0] ?? null;
};

export const listarEvaluacionesSalud = (params = {}) => api.get(EVALUACIONES_URL, { params });
export const crearEvaluacionSalud = (data) => api.post(EVALUACIONES_URL, data);
export const actualizarEvaluacionSalud = (id, data) => api.patch(`${EVALUACIONES_URL}${id}/`, data);
export const eliminarEvaluacionSalud = (id) => api.delete(`${EVALUACIONES_URL}${id}/`);
