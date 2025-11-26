import api from "./api";

const crudFactory = (basePath) => ({
  list: (params = {}) => api.get(basePath, { params }),
  create: (payload) => api.post(basePath, payload),
  update: (id, payload) => api.patch(`${basePath}${id}/`, payload),
  remove: (id) => api.delete(`${basePath}${id}/`),
});

export const registrosPIEApi = {
  list: (params = {}) => api.get("/registros-pie/", { params }),
  retrieve: (id) => api.get(`/registros-pie/${id}/`),
  create: (payload) => api.post("/registros-pie/", payload),
  update: (id, payload) => api.patch(`/registros-pie/${id}/`, payload),
  remove: (id) => api.delete(`/registros-pie/${id}/`),
  downloadPdf: (id, config = {}) =>
    api.get(`/registros-pie/${id}/descargar-pdf/`, {
      responseType: "blob",
      ...config,
    }),
};

export const equipoAulaApi = crudFactory("/equipo-aula/");
export const planificacionApi = crudFactory("/planificaciones-pie/");
export const trabajoColaborativoApi = crudFactory("/trabajos-colaborativos/");
export const actividadComunidadApi = crudFactory("/actividades-comunidad/");
export const logrosApi = crudFactory("/logros-aprendizaje/");
export const evaluacionPieApi = crudFactory("/evaluaciones-pie/");

export async function sincronizarColeccion(apiCrud, items, registroId) {
  const tareas = items.map((item) => {
    const payload = { ...item, registro: registroId };
    const esTemporal = typeof item.id === "string" && item.id.startsWith("temp-");
    if (!item.id || esTemporal) {
      const datos = { ...payload };
      delete datos.id;
      return apiCrud.create(datos);
    }
    return apiCrud.update(item.id, payload);
  });
  await Promise.all(tareas);
}

export async function eliminarElemento(apiCrud, id) {
  if (!id) return;
  const esTemporal = typeof id === "string" && id.startsWith("temp-");
  if (esTemporal) return;
  await apiCrud.remove(id);
}
