import axios from "axios";

const apiPie = axios.create({
  baseURL: "http://localhost:5000/api/pie",
});

const handleRequest = async (requestFn, sectionName) => {
  try {
    const response = await requestFn();
    console.log(`Sección ${sectionName} enviada correctamente.`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error al enviar la sección ${sectionName}:`, error);
    throw error;
  }
};

export const postActividadComunidad = (payload) =>
  handleRequest(() => apiPie.post("/actividad-comunidad", payload), "Actividad-Comunidad");

export const postEquipoAula = (payload) =>
  handleRequest(() => apiPie.post("/equipo-aula", payload), "Equipo de Aula");

export const postEvaluacion = (payload) =>
  handleRequest(() => apiPie.post("/evaluacion", payload), "Evaluación");

export const postLogros = (payload) =>
  handleRequest(() => apiPie.post("/logros", payload), "Logros/Acta");

export const postPlanificacion = (payload) =>
  handleRequest(() => apiPie.post("/planificacion", payload), "Planificación");

export const postTrabajoColaborativo = (payload) =>
  handleRequest(() => apiPie.post("/trabajo-colaborativo", payload), "Trabajo Colaborativo");

export const postRegistroPie = (payload) =>
  handleRequest(() => apiPie.post("/registro-pie", payload), "Registro PIE");
