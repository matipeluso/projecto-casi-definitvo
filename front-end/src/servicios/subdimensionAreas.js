import api from "./api";

const RESOURCE = "/subdimension-areas/";

export async function listarSubdimensionAreas(params = {}) {
  const response = await api.get(RESOURCE, { params });
  return response.data;
}
