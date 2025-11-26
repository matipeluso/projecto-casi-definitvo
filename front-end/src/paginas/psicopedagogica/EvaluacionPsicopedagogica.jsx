import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import IdentificacionEstudiante from "../../componentes/psicopedagogica/IdentificacionEstudiante";
import HabilidadesComunicativas from "../../componentes/psicopedagogica/HabilidadesComunicativas";
import MotricidadCuidado from "../../componentes/psicopedagogica/MotricidadCuidado";
import AproximacionAprendizaje from "../../componentes/psicopedagogica/AproximacionAprendizaje";
import HabilidadesCognitivas from "../../componentes/psicopedagogica/HabilidadesCognitivas";
import CapacidadesSensoperceptivas from "../../componentes/psicopedagogica/CapacidadesSensoperceptivas";
import LecturaEscritura from "../../componentes/psicopedagogica/LecturaEscritura";
import Matematicas from "../../componentes/psicopedagogica/Matematicas";
import HabilidadesSociales from "./HabilidadesSociales";
import Subsectores from "./Subsectores";
import EstrategiasApoyo from "./EstrategiasApoyo";
import ApoyosAdicionales from "./ApoyosAdicionales";
import ObservacionAmbienteEscolar from "./ObservacionAmbienteEscolar";
import { listarCursos } from "../../servicios/cursos";
import { listarEstudiantes } from "../../servicios/estudiantes";
import useEvaluacionPsicopedagogica from "../../hooks/useEvaluacionPsicopedagogica";
import { useAuth } from "../../contexto/AuthContext";

const unwrapResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload?.results) return payload.results;
  return [];
};

export default function EvaluacionPsicopedagogica() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);

  const {
    form,
    evaluacionId,
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
  } = useEvaluacionPsicopedagogica({ evaluadorUsuarioId: user?.id });

  useEffect(() => {
    const fetchCursos = async () => {
      setCargandoCursos(true);
      try {
        const { data } = await listarCursos();
        setCursos(unwrapResults(data));
      } catch (error) {
        console.error("[EvaluacionPsico] Error cargando cursos", error);
        toast.error("No pudimos cargar los cursos disponibles.");
      } finally {
        setCargandoCursos(false);
      }
    };
    fetchCursos();
  }, []);

  useEffect(() => {
    const fetchEstudiantes = async () => {
      if (!cursoSeleccionado) {
        setEstudiantes([]);
        setEstudianteSeleccionado("");
        await loadEvaluacion(null);
        return;
      }
      setCargandoEstudiantes(true);
      try {
        const { data } = await listarEstudiantes({ curso: cursoSeleccionado });
        setEstudiantes(unwrapResults(data));
      } catch (error) {
        console.error("[EvaluacionPsico] Error cargando estudiantes", error);
        toast.error("No pudimos cargar los estudiantes del curso seleccionado.");
      } finally {
        setCargandoEstudiantes(false);
      }
    };
    fetchEstudiantes();
  }, [cursoSeleccionado, loadEvaluacion]);

  useEffect(() => {
    const cargarEvaluacion = async () => {
      if (!estudianteSeleccionado) {
        await loadEvaluacion(null);
        return;
      }
      try {
        await loadEvaluacion(estudianteSeleccionado);
      } catch (error) {
        console.error("[EvaluacionPsico] Error cargando evaluación", error);
        const detail = error.response?.data?.detail || "No pudimos cargar la evaluación.";
        toast.error(detail);
      }
    };
    cargarEvaluacion();
  }, [estudianteSeleccionado, loadEvaluacion]);

  const observacionValores = useMemo(() => {
    return form.observaciones_ambiente.reduce((acc, item) => {
      acc[item.item] = item.valor;
      return acc;
    }, {});
  }, [form.observaciones_ambiente]);

  const estudianteActivo = useMemo(() => {
    if (!estudianteSeleccionado) return null;
    return (
      estudiantes.find((est) => String(est.id) === String(estudianteSeleccionado)) || null
    );
  }, [estudiantes, estudianteSeleccionado]);

  const handleCursoChange = (cursoId) => {
    setCursoSeleccionado(cursoId);
    setEstudianteSeleccionado("");
  };

  const handleEstudianteChange = (estudianteId) => {
    setEstudianteSeleccionado(estudianteId);
  };

  const puedeEditar = Boolean(estudianteSeleccionado) && !isLoading;

  const buildValorHandler = (slug) => (index, valor) => {
    if (!puedeEditar || isSaving) return;
    updateSubdimensionItemValue(slug, index, valor);
  };

  const buildComentarioHandler = (slug) => (field, value) => {
    if (!puedeEditar || isSaving) return;
    updateSubdimensionComentario(slug, field, value);
  };

  const getSectionValues = (slug) => form.subdimensiones?.[slug]?.items ?? [];
  const getSectionComentarios = (slug) => form.subdimensiones?.[slug]?.comentarios ?? {};

  const handleGuardar = async () => {
    try {
      await saveEvaluacion();
      toast.success("Evaluación psicopedagógica guardada correctamente.");
    } catch (error) {
      console.error("[EvaluacionPsico] Error guardando evaluación", error);
      const detail = error.response?.data?.detail || error.message || "No pudimos guardar los cambios.";
      toast.error(detail);
    }
  };

  return (
    <div className="bg-light py-4">
      <IdentificacionEstudiante
        cursos={cursos}
        estudiantes={estudiantes}
        cursoSeleccionado={cursoSeleccionado}
        estudianteSeleccionado={estudianteSeleccionado}
        estudianteActivo={estudianteActivo}
        onCursoChange={handleCursoChange}
        onEstudianteChange={handleEstudianteChange}
        cargandoCursos={cargandoCursos}
        cargandoEstudiantes={cargandoEstudiantes}
        puedeEditar={puedeEditar}
        isLoading={isLoading}
        isSaving={isSaving}
        evaluacionId={evaluacionId}
        user={user}
        onGuardar={handleGuardar}
        onLimpiar={() => resetForm(estudianteSeleccionado)}
        edadAnios={form.edad_anios}
        edadMeses={form.edad_meses}
        onEdadChange={(field, value) => updateField(field, value)}
        lenguaDominio={{
          materna: {
            grado: form.lengua_materna_grado,
            comprende: form.lengua_materna_comprende,
            habla: form.lengua_materna_habla,
            lee: form.lengua_materna_lee,
            escribe: form.lengua_materna_escribe,
          },
          uso: {
            grado: form.lengua_uso_grado,
            comprende: form.lengua_uso_comprende,
            habla: form.lengua_uso_habla,
            lee: form.lengua_uso_lee,
            escribe: form.lengua_uso_escribe,
          },
        }}
        onLenguaDominioChange={(field, value) => updateField(field, value)}
        fechaEvaluacion={form.fecha_evaluacion}
        onFechaEvaluacionChange={(value) => updateField("fecha_evaluacion", value)}
      />

      <div className="container mb-4">
        <div className="border rounded p-4 bg-white">
          <h4 className="fw-bold text-uppercase mb-3">2. Observaciones generales</h4>
          <textarea
            className="form-control"
            rows={4}
            placeholder={puedeEditar ? "Escriba observaciones relevantes" : "Seleccione un estudiante para habilitar"}
            value={form.observaciones}
            onChange={(event) => updateField("observaciones", event.target.value)}
            disabled={!puedeEditar}
          />
        </div>
      </div>

      <ObservacionAmbienteEscolar
        valores={observacionValores}
        onValorChange={(item, valor) => puedeEditar && updateObservationValue(item, valor)}
        disabled={!puedeEditar || isSaving}
      />

      <HabilidadesComunicativas
        values={getSectionValues("habilidades-comunicativas")}
        comentarios={getSectionComentarios("habilidades-comunicativas")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("habilidades-comunicativas")}
        onComentarioChange={buildComentarioHandler("habilidades-comunicativas")}
      />
      <HabilidadesSociales
        values={getSectionValues("habilidades-sociales-afectividad")}
        comentarios={getSectionComentarios("habilidades-sociales-afectividad")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("habilidades-sociales-afectividad")}
        onComentarioChange={buildComentarioHandler("habilidades-sociales-afectividad")}
      />
      <MotricidadCuidado
        values={getSectionValues("motricidad-cuidado-personal")}
        comentarios={getSectionComentarios("motricidad-cuidado-personal")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("motricidad-cuidado-personal")}
        onComentarioChange={buildComentarioHandler("motricidad-cuidado-personal")}
      />
      <AproximacionAprendizaje
        values={getSectionValues("aproximacion-aprendizaje")}
        comentarios={getSectionComentarios("aproximacion-aprendizaje")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("aproximacion-aprendizaje")}
        onComentarioChange={buildComentarioHandler("aproximacion-aprendizaje")}
      />
      <HabilidadesCognitivas
        values={getSectionValues("habilidades-cognitivas")}
        comentarios={getSectionComentarios("habilidades-cognitivas")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("habilidades-cognitivas")}
        onComentarioChange={buildComentarioHandler("habilidades-cognitivas")}
      />
      <CapacidadesSensoperceptivas
        values={getSectionValues("capacidades-sensoperceptivas")}
        comentarios={getSectionComentarios("capacidades-sensoperceptivas")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("capacidades-sensoperceptivas")}
        onComentarioChange={buildComentarioHandler("capacidades-sensoperceptivas")}
      />
      <LecturaEscritura
        values={getSectionValues("lectura-escritura")}
        comentarios={getSectionComentarios("lectura-escritura")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("lectura-escritura")}
        onComentarioChange={buildComentarioHandler("lectura-escritura")}
      />
      <Matematicas
        values={getSectionValues("matematicas")}
        comentarios={getSectionComentarios("matematicas")}
        disabled={!puedeEditar || isSaving}
        onValorChange={buildValorHandler("matematicas")}
        onComentarioChange={buildComentarioHandler("matematicas")}
      />
      <Subsectores
        values={form.subsectores}
        onToggle={toggleSubsectorFlag}
        disabled={!puedeEditar || isSaving}
      />
      <EstrategiasApoyo
        values={form.estrategias}
        onToggle={updateEstrategiaFlag}
        onDetalle={updateEstrategiaDetalle}
        disabled={!puedeEditar || isSaving}
      />
      <ApoyosAdicionales
        values={form.apoyos}
        onRecibido={updateApoyoRecibido}
        onDescripcion={updateApoyoDescripcion}
        disabled={!puedeEditar || isSaving}
      />
    </div>
  );
}
