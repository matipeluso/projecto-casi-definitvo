import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  actualizarEvaluacionPsico,
  crearEvaluacionPsico,
  obtenerEvaluacionPorEstudiante,
} from "../servicios/evaluacionPsico";
import { OBSERVACION_ITEMS } from "../paginas/psicopedagogica/observacionItems";
import {
  SUBSECTOR_CATALOG,
  SUBSECTOR_LOOKUP_BY_ID,
  ESTRATEGIAS_CATALOG,
  APOYOS_CATALOG,
} from "../paginas/psicopedagogica/catalogos";
import { listarSubdimensionAreas } from "../servicios/subdimensionAreas";
import {
  SUBDIMENSION_SECTIONS,
  SUBDIMENSION_DESCRIPTION_LOOKUP,
  SUBDIMENSION_COMMENT_FIELDS,
  normalizeSubdimensionSlug,
  normalizeSubdimensionText,
} from "../componentes/psicopedagogica/subdimensionCatalog";

const COMMENT_FIELDS = SUBDIMENSION_COMMENT_FIELDS.map(({ field }) => field);

const buildEmptyComentarios = () =>
  COMMENT_FIELDS.reduce((acc, field) => {
    acc[field] = "";
    return acc;
  }, {});

const normalizeSmallInt = (value) => {
  if (value === null || typeof value === "undefined" || value === "") {
    return null;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildSubsectorState = () =>
  SUBSECTOR_CATALOG.reduce((acc, item) => {
    acc[item.id] = { destacado: false, dificultad: false };
    return acc;
  }, {});

const mergeSubsectorState = (records = []) => {
  const next = buildSubsectorState();
  records.forEach(({ subsector, tipo }) => {
    const catalogItem = SUBSECTOR_CATALOG.find((item) => item.label === subsector);
    if (!catalogItem) return;
    if (tipo === "destacado") {
      next[catalogItem.id].destacado = true;
    } else if (tipo === "dificultad") {
      next[catalogItem.id].dificultad = true;
    }
  });
  return next;
};

const buildEstrategiaState = () =>
  ESTRATEGIAS_CATALOG.reduce((acc, item) => {
    acc[item.numero] = {
      numero: item.numero,
      descripcion: item.descripcion,
      aplicada: false,
      exitosa: false,
      detalle: "",
    };
    return acc;
  }, {});

const mergeEstrategiasState = (records = []) => {
  const next = buildEstrategiaState();
  records.forEach(({ numero, aplicada, exitosa, detalle }) => {
    if (!numero || !next[numero]) return;
    next[numero] = {
      ...next[numero],
      aplicada: Boolean(aplicada),
      exitosa: Boolean(exitosa),
      detalle: detalle || "",
    };
  });
  return next;
};

const buildApoyosState = () =>
  APOYOS_CATALOG.reduce((acc, item) => {
    acc[item.id] = {
      id: item.id,
      tipo: item.tipo,
      apoyo: item.apoyo,
      label: item.label,
      requiereDescripcion: item.requiereDescripcion || false,
      recibido: null,
      descripcion_extra: "",
      nota: "",
    };
    return acc;
  }, {});

const mergeApoyosState = (records = []) => {
  const next = buildApoyosState();
  records.forEach(({ apoyo, tipo, recibido, descripcion_extra, nota }) => {
    if (!apoyo || !next[apoyo]) return;
    next[apoyo] = {
      ...next[apoyo],
      tipo: tipo || next[apoyo].tipo,
      recibido: typeof recibido === "boolean" ? recibido : next[apoyo].recibido,
      descripcion_extra: descripcion_extra || "",
      nota: nota || "",
    };
  });
  return next;
};

const buildSubdimensionPayloads = (subdimensiones = {}, areaLookup = { bySlug: {} }) => {
  const items = [];
  const comentarios = [];
  const bySlug = areaLookup.bySlug || {};

  Object.entries(subdimensiones).forEach(([slug, section]) => {
    if (!section) return;
    const areaId = bySlug[slug]?.id;
    if (!areaId) return;

    (section.items || []).forEach((item) => {
      if (!item) return;
      if (!Number.isInteger(item.valor)) return;
      items.push({
        area: areaId,
        descripcion: item.descripcion,
        valor: item.valor,
      });
    });

    const comentariosData = section.comentarios || {};
    const hasTexto = COMMENT_FIELDS.some((field) => {
      const value = comentariosData[field];
      return typeof value === "string" && value.trim() !== "";
    });
    if (hasTexto) {
      comentarios.push({
        area: areaId,
        fortaleza: comentariosData.fortaleza || "",
        debilidad: comentariosData.debilidad || "",
        sintesis: comentariosData.sintesis || "",
        observaciones: comentariosData.observaciones || "",
      });
    }
  });

  return { items, comentarios };
};

const buildSubdimensionState = () =>
  SUBDIMENSION_SECTIONS.reduce((acc, section) => {
    acc[section.slug] = {
      slug: section.slug,
      items: section.items.map((item) => ({ ...item, valor: null })),
      comentarios: buildEmptyComentarios(),
    };
    return acc;
  }, {});

const mergeSubdimensionState = (
  itemRecords = [],
  comentarioRecords = [],
  areaLookup = { byId: {}, bySlug: {} }
) => {
  const base = buildSubdimensionState();
  const byId = areaLookup.byId || {};

  itemRecords.forEach((record) => {
    if (!record) return;
    let slug = record.area ? byId[record.area]?.slug : null;
    if (!slug) {
      const normalized = normalizeSubdimensionText(record.descripcion || "");
      slug = SUBDIMENSION_DESCRIPTION_LOOKUP[normalized]?.slug;
    }
    if (!slug || !base[slug]) return;
    const normalizedDescripcion = normalizeSubdimensionText(record.descripcion || "");
    const targetIndex = base[slug].items.findIndex(
      (item) => item.descripcionNorm === normalizedDescripcion
    );
    if (targetIndex === -1) return;
    base[slug].items[targetIndex] = {
      ...base[slug].items[targetIndex],
      valor: Number.isInteger(record.valor) ? record.valor : null,
    };
  });

  comentarioRecords.forEach((record) => {
    if (!record) return;
    const slug = record.area ? byId[record.area]?.slug : null;
    if (!slug || !base[slug]) return;
    base[slug].comentarios = {
      ...buildEmptyComentarios(),
      fortaleza: record.fortaleza || "",
      debilidad: record.debilidad || "",
      sintesis: record.sintesis || "",
      observaciones: record.observaciones || "",
    };
  });

  return base;
};

const buildBaseForm = ({ estudiante = "", evaluador_usuario = null } = {}) => ({
  estudiante,
  evaluador_usuario,
  observaciones: "",
  observaciones_ambiente: OBSERVACION_ITEMS.map((item) => ({ ...item, valor: null })),
  subsectores: buildSubsectorState(),
  estrategias: buildEstrategiaState(),
  apoyos: buildApoyosState(),
  subdimensiones: buildSubdimensionState(),
  edad_anios: "",
  edad_meses: "",
  fecha_evaluacion: "",
  lengua_materna_grado: "",
  lengua_materna_comprende: false,
  lengua_materna_habla: false,
  lengua_materna_lee: false,
  lengua_materna_escribe: false,
  lengua_uso_grado: "",
  lengua_uso_comprende: false,
  lengua_uso_habla: false,
  lengua_uso_lee: false,
  lengua_uso_escribe: false,
});

const mergeObservaciones = (lista = []) => {
  const map = new Map();
  lista.forEach((item) => {
    if (!item || typeof item.item === "undefined") return;
    map.set(Number(item.item), item);
  });
  return OBSERVACION_ITEMS.map((item) => {
    const saved = map.get(item.item);
    if (!saved) return { ...item, valor: null };
    return {
      ...item,
      id: saved.id ?? null,
      descripcion: saved.descripcion || item.descripcion,
      valor: typeof saved.valor === "number" ? saved.valor : null,
    };
  });
};

export default function useEvaluacionPsicopedagogica({ evaluadorUsuarioId } = {}) {
  const [form, setForm] = useState(() => buildBaseForm({ evaluador_usuario: evaluadorUsuarioId || null }));
  const [evaluacionId, setEvaluacionId] = useState(null);
  const [estudianteActual, setEstudianteActual] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const subdimensionAreasRef = useRef({ byId: {}, bySlug: {} });
  const areasPromiseRef = useRef(null);
  const [areasLoaded, setAreasLoaded] = useState(false);

  useEffect(() => {
    if (!evaluadorUsuarioId) return;
    setForm((prev) => ({
      ...prev,
      evaluador_usuario: evaluadorUsuarioId,
    }));
  }, [evaluadorUsuarioId]);

  const fetchAreas = useCallback(() => {
    if (areasLoaded) {
      return Promise.resolve(subdimensionAreasRef.current);
    }
    if (areasPromiseRef.current) {
      return areasPromiseRef.current;
    }
    const request = listarSubdimensionAreas({ page_size: 100 })
      .then((payload) => {
        const lista = Array.isArray(payload) ? payload : payload?.results ?? [];
        const byId = {};
        const bySlug = {};
        lista.forEach((area) => {
          if (!area) return;
          const slug = normalizeSubdimensionSlug(area.slug || area.nombre || "");
          if (!slug) return;
          const record = { ...area, slug };
          if (area.id) {
            byId[area.id] = record;
          }
          bySlug[slug] = record;
        });
        const lookup = { byId, bySlug };
        subdimensionAreasRef.current = lookup;
        setAreasLoaded(true);
        return lookup;
      })
      .catch((error) => {
        console.error("[useEvaluacionPsico] Error cargando subdimensiones", error);
        throw error;
      });

    areasPromiseRef.current = request
      .then((result) => {
        areasPromiseRef.current = null;
        return result;
      })
      .catch((error) => {
        areasPromiseRef.current = null;
        throw error;
      });
    return areasPromiseRef.current;
  }, [areasLoaded]);

  useEffect(() => {
    fetchAreas().catch(() => {});
  }, [fetchAreas]);

  const ensureAreasReady = useCallback(async () => {
    if (areasLoaded) return;
    await fetchAreas();
  }, [areasLoaded, fetchAreas]);

  const resetForm = useCallback(
    (estudianteId = "") => {
      setForm(buildBaseForm({ estudiante: estudianteId, evaluador_usuario: evaluadorUsuarioId || null }));
    },
    [evaluadorUsuarioId]
  );

  const hydrateFromResponse = useCallback(
    (payload, fallbackEstudiante, areaLookupParam) => {
      const areaLookup = areaLookupParam || subdimensionAreasRef.current;
      if (!payload) {
        resetForm(fallbackEstudiante);
        setEvaluacionId(null);
        return;
      }
      setEvaluacionId(payload.id);
      setForm({
        estudiante: payload.estudiante ?? fallbackEstudiante ?? "",
        evaluador_usuario: payload.evaluador_usuario ?? evaluadorUsuarioId ?? null,
        observaciones: payload.observaciones || "",
        fecha_evaluacion: payload.fecha_evaluacion || payload.fecha || "",
        edad_anios:
          payload.edad_anios === null || typeof payload.edad_anios === "undefined"
            ? ""
            : String(payload.edad_anios),
        edad_meses:
          payload.edad_meses === null || typeof payload.edad_meses === "undefined"
            ? ""
            : String(payload.edad_meses),
        lengua_materna_grado: payload.lengua_materna_grado || "",
        lengua_materna_comprende: Boolean(payload.lengua_materna_comprende),
        lengua_materna_habla: Boolean(payload.lengua_materna_habla),
        lengua_materna_lee: Boolean(payload.lengua_materna_lee),
        lengua_materna_escribe: Boolean(payload.lengua_materna_escribe),
        lengua_uso_grado: payload.lengua_uso_grado || "",
        lengua_uso_comprende: Boolean(payload.lengua_uso_comprende),
        lengua_uso_habla: Boolean(payload.lengua_uso_habla),
        lengua_uso_lee: Boolean(payload.lengua_uso_lee),
        lengua_uso_escribe: Boolean(payload.lengua_uso_escribe),
        observaciones_ambiente: mergeObservaciones(payload.observaciones_ambiente || []),
        subsectores: mergeSubsectorState(payload.subsectores || []),
        estrategias: mergeEstrategiasState(payload.estrategias_apoyo || []),
        apoyos: mergeApoyosState(payload.apoyos_adicionales || []),
        subdimensiones: mergeSubdimensionState(
          payload.items || [],
          payload.comentarios_subdimension || [],
          areaLookup
        ),
      });
    },
    [evaluadorUsuarioId, resetForm]
  );

  const loadEvaluacion = useCallback(
    async (estudianteId) => {
      setEstudianteActual(estudianteId || "");
      if (!estudianteId) {
        hydrateFromResponse(null, "");
        return null;
      }
      setIsLoading(true);
      try {
        await ensureAreasReady();
        const evaluacion = await obtenerEvaluacionPorEstudiante(estudianteId);
        hydrateFromResponse(evaluacion, estudianteId, subdimensionAreasRef.current);
        return evaluacion;
      } finally {
        setIsLoading(false);
      }
    },
    [ensureAreasReady, hydrateFromResponse]
  );

  const updateField = useCallback((field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateObservationValue = useCallback((itemNumber, valor) => {
    setForm((prev) => ({
      ...prev,
      observaciones_ambiente: prev.observaciones_ambiente.map((obs) =>
        obs.item === itemNumber ? { ...obs, valor } : obs
      ),
    }));
  }, []);

  const toggleSubsectorFlag = useCallback((subsectorId, tipo, checked) => {
    if (!subsectorId || !["destacado", "dificultad"].includes(tipo)) return;
    setForm((prev) => ({
      ...prev,
      subsectores: {
        ...prev.subsectores,
        [subsectorId]: {
          ...prev.subsectores[subsectorId],
          [tipo]: checked,
        },
      },
    }));
  }, []);

  const updateEstrategiaFlag = useCallback((numero, field, value) => {
    if (!numero || !["aplicada", "exitosa"].includes(field)) return;
    setForm((prev) => ({
      ...prev,
      estrategias: {
        ...prev.estrategias,
        [numero]: {
          ...prev.estrategias[numero],
          [field]: value,
        },
      },
    }));
  }, []);

  const updateEstrategiaDetalle = useCallback((numero, texto) => {
    setForm((prev) => ({
      ...prev,
      estrategias: {
        ...prev.estrategias,
        [numero]: {
          ...prev.estrategias[numero],
          detalle: texto,
        },
      },
    }));
  }, []);

  const updateApoyoRecibido = useCallback((apoyoId, value) => {
    if (!apoyoId) return;
    setForm((prev) => ({
      ...prev,
      apoyos: {
        ...prev.apoyos,
        [apoyoId]: {
          ...prev.apoyos[apoyoId],
          recibido: value,
        },
      },
    }));
  }, []);

  const updateApoyoDescripcion = useCallback((apoyoId, texto) => {
    if (!apoyoId) return;
    setForm((prev) => ({
      ...prev,
      apoyos: {
        ...prev.apoyos,
        [apoyoId]: {
          ...prev.apoyos[apoyoId],
          descripcion_extra: texto,
        },
      },
    }));
  }, []);

  const updateSubdimensionItemValue = useCallback((slug, itemIndex, valor) => {
    if (!slug || typeof itemIndex !== "number") return;
    setForm((prev) => {
      const currentSections = prev.subdimensiones || {};
      const section = currentSections[slug];
      if (!section) return prev;
      const itemsSource = Array.isArray(section.items) ? section.items : [];
      const items = itemsSource.map((item, index) =>
        index === itemIndex ? { ...item, valor: Number.isInteger(valor) ? valor : null } : item
      );
      return {
        ...prev,
        subdimensiones: {
          ...currentSections,
          [slug]: {
            ...section,
            items,
          },
        },
      };
    });
  }, []);

  const updateSubdimensionComentario = useCallback((slug, field, texto) => {
    if (!slug || !COMMENT_FIELDS.includes(field)) return;
    setForm((prev) => {
      const currentSections = prev.subdimensiones || {};
      const section = currentSections[slug];
      if (!section) return prev;
      return {
        ...prev,
        subdimensiones: {
          ...currentSections,
          [slug]: {
            ...section,
            comentarios: {
              ...(section.comentarios || buildEmptyComentarios()),
              [field]: texto,
            },
          },
        },
      };
    });
  }, []);

  const observacionesSeleccionadas = useMemo(
    () =>
      form.observaciones_ambiente
        .filter((item) => Number.isInteger(item.valor))
        .map(({ item, descripcion, valor }) => ({ item, descripcion, valor })),
    [form.observaciones_ambiente]
  );

  const subsectoresPayload = useMemo(() => {
    const resultados = [];
    Object.entries(form.subsectores).forEach(([id, estado]) => {
      const catalogItem = SUBSECTOR_LOOKUP_BY_ID[id];
      const label = catalogItem?.label;
      if (!label) return;
      if (estado.destacado) {
        resultados.push({ subsector: label, tipo: "destacado" });
      }
      if (estado.dificultad) {
        resultados.push({ subsector: label, tipo: "dificultad" });
      }
    });
    return resultados;
  }, [form.subsectores]);

  const estrategiasPayload = useMemo(() => {
    const resultados = [];
    Object.values(form.estrategias).forEach((item) => {
      if (!item) return;
      const shouldPersist = item.aplicada || item.exitosa || (item.detalle && item.detalle.trim() !== "");
      if (!shouldPersist) return;
      resultados.push({
        numero: item.numero,
        descripcion: item.descripcion,
        aplicada: item.aplicada,
        exitosa: item.exitosa,
        detalle: item.detalle || "",
      });
    });
    return resultados;
  }, [form.estrategias]);

  const apoyosPayload = useMemo(() => {
    const resultados = [];
    Object.values(form.apoyos).forEach((item) => {
      if (item?.recibido !== true) return;
      resultados.push({
        tipo: item.tipo,
        apoyo: item.apoyo,
        recibido: true,
        descripcion_extra: item.descripcion_extra || "",
        nota: item.nota || "",
      });
    });
    return resultados;
  }, [form.apoyos]);

  const saveEvaluacion = useCallback(async () => {
    if (!estudianteActual) {
      throw new Error("Debes seleccionar un estudiante antes de guardar.");
    }
    await ensureAreasReady();
    setIsSaving(true);
    try {
      const payload = {
        estudiante: estudianteActual,
        evaluador_usuario: evaluadorUsuarioId || form.evaluador_usuario || null,
      };
      if (typeof form.observaciones === "string") {
        payload.observaciones = form.observaciones;
      }
      payload.edad_anios = normalizeSmallInt(form.edad_anios);
      payload.edad_meses = normalizeSmallInt(form.edad_meses);
      payload.fecha_evaluacion = form.fecha_evaluacion || null;
      payload.fecha = form.fecha_evaluacion || null;
      payload.lengua_materna_grado = form.lengua_materna_grado || "";
      payload.lengua_materna_comprende = Boolean(form.lengua_materna_comprende);
      payload.lengua_materna_habla = Boolean(form.lengua_materna_habla);
      payload.lengua_materna_lee = Boolean(form.lengua_materna_lee);
      payload.lengua_materna_escribe = Boolean(form.lengua_materna_escribe);
      payload.lengua_uso_grado = form.lengua_uso_grado || "";
      payload.lengua_uso_comprende = Boolean(form.lengua_uso_comprende);
      payload.lengua_uso_habla = Boolean(form.lengua_uso_habla);
      payload.lengua_uso_lee = Boolean(form.lengua_uso_lee);
      payload.lengua_uso_escribe = Boolean(form.lengua_uso_escribe);
      payload.observaciones_ambiente = observacionesSeleccionadas;
      payload.subsectores = subsectoresPayload;
      payload.estrategias_apoyo = estrategiasPayload;
      payload.apoyos_adicionales = apoyosPayload;
      const { items: subdimensionItems, comentarios: subdimensionComentarios } = buildSubdimensionPayloads(
        form.subdimensiones,
        subdimensionAreasRef.current
      );
      payload.items = subdimensionItems;
      payload.comentarios_subdimension = subdimensionComentarios;
      let response;
      if (evaluacionId) {
        response = await actualizarEvaluacionPsico(evaluacionId, payload);
      } else {
        response = await crearEvaluacionPsico(payload);
      }
      hydrateFromResponse(response, estudianteActual);
      return response;
    } finally {
      setIsSaving(false);
    }
  }, [
    ensureAreasReady,
    estudianteActual,
    evaluadorUsuarioId,
    form.evaluador_usuario,
    form.observaciones,
    form.fecha_evaluacion,
    form.edad_anios,
    form.edad_meses,
    form.lengua_materna_grado,
    form.lengua_materna_comprende,
    form.lengua_materna_habla,
    form.lengua_materna_lee,
    form.lengua_materna_escribe,
    form.lengua_uso_grado,
    form.lengua_uso_comprende,
    form.lengua_uso_habla,
    form.lengua_uso_lee,
    form.lengua_uso_escribe,
    form.subdimensiones,
    observacionesSeleccionadas,
    subsectoresPayload,
    estrategiasPayload,
    apoyosPayload,
    evaluacionId,
    hydrateFromResponse,
  ]);

  return {
    form,
    evaluacionId,
    estudianteActual,
    isLoading,
    isSaving,
    loadEvaluacion,
    updateField,
    updateObservationValue,
    toggleSubsectorFlag,
    updateEstrategiaFlag,
    updateEstrategiaDetalle,
    updateApoyoRecibido,
    updateApoyoDescripcion,
    updateSubdimensionItemValue,
    updateSubdimensionComentario,
    resetForm,
    saveEvaluacion,
  };
}
