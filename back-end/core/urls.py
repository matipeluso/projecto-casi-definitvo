from rest_framework import routers
from django.urls import path
from .views import (
    ActividadComunidadViewSet,
    AnamnesisViewSet,
    AntecedenteSaludViewSet,
    AntecedentesSaludFormularioViewSet,
    ApoderadoViewSet,
    CursoViewSet,
    DetalleEvaluacionSaludViewSet,
    EquipoAulaViewSet,
    EspecialidadViewSet,
    EstablecimientoViewSet,
    EstudianteViewSet,
    EvaluacionAmbienteEscolarViewSet,
    EvaluacionLenguajeViewSet,
    EvaluacionNeuropsicologicaViewSet,
    EvaluacionPIEViewSet,
    EvaluacionPsicologicaViewSet,
    EvaluacionPsicopedagogicaViewSet,
    EvaluacionSaludViewSet,
    FormularioEvaluacionSaludViewSet,
    InformeEvaluacionSaludViewSet,
    InformeFamiliaAmbitoViewSet,
    InformeFamiliaEntregaViewSet,
    InformeFamiliaInstrumentoViewSet,
    InformeFamiliaReceptorViewSet,
    InformeFamiliaSeguimientoViewSet,
    InformeFamiliaViewSet,
    ItemAmbienteEscolarViewSet,
    LogroAprendizajeViewSet,
    ObservacionAmbienteViewSet,
    ObservacionEscolarViewSet,
    ObservacionItemViewSet,
    PlanificacionPIEViewSet,
    RegistroPIEViewSet,
    SituacionEscolarViewSet,
    SubdimensionAreaViewSet,
    SubdimensionItemViewSet,
    SubsectorViewSet,
    TrabajoColaborativoViewSet,
    TrayectoriaEscolarViewSet,
    UsuarioViewSet,
    csrf_token_view,
    generar_registro_pie_pdf,
    login_view,
    logout_view,
    mi_perfil,
    password_reset_confirm,
    password_reset_request,
    password_reset_verify,
)

router = routers.DefaultRouter()
router.register('usuarios', UsuarioViewSet)
router.register('especialidades', EspecialidadViewSet)
router.register('establecimientos', EstablecimientoViewSet)
router.register('cursos', CursoViewSet)
router.register('apoderados', ApoderadoViewSet)
router.register('estudiantes', EstudianteViewSet)
router.register('anamnesis', AnamnesisViewSet)
router.register('antecedentes-salud', AntecedenteSaludViewSet)
router.register('evaluaciones-psicopedagogicas', EvaluacionPsicopedagogicaViewSet)
router.register('trayectorias-escolares', TrayectoriaEscolarViewSet)
router.register('situaciones-escolares', SituacionEscolarViewSet)
router.register('subdimension-areas', SubdimensionAreaViewSet)
router.register('subdimension-items', SubdimensionItemViewSet)
router.register('subsectores', SubsectorViewSet)
router.register('observaciones-escolares', ObservacionEscolarViewSet)
router.register('observaciones-escolares-items', ObservacionItemViewSet)
router.register('evaluaciones-ambiente-escolar', EvaluacionAmbienteEscolarViewSet)
router.register('evaluaciones-ambiente-items', ItemAmbienteEscolarViewSet)
router.register('observaciones-ambiente', ObservacionAmbienteViewSet)
router.register('evaluaciones-salud', EvaluacionSaludViewSet)
router.register('formularios-evaluacion-salud', FormularioEvaluacionSaludViewSet)
router.register('formularios-evaluacion-salud-detalles', DetalleEvaluacionSaludViewSet)
router.register('formularios-evaluacion-salud-antecedentes', AntecedentesSaludFormularioViewSet)
router.register('formularios-evaluacion-salud-psicologicas', EvaluacionPsicologicaViewSet)
router.register('formularios-evaluacion-salud-lenguaje', EvaluacionLenguajeViewSet)
router.register('formularios-evaluacion-salud-neuropsicologicas', EvaluacionNeuropsicologicaViewSet)
router.register('formularios-evaluacion-salud-informes', InformeEvaluacionSaludViewSet)
router.register('informes-familia', InformeFamiliaViewSet)
router.register('informes-familia-instrumentos', InformeFamiliaInstrumentoViewSet)
router.register('informes-familia-ambitos', InformeFamiliaAmbitoViewSet)
router.register('informes-familia-seguimientos', InformeFamiliaSeguimientoViewSet)
router.register('informes-familia-entregas', InformeFamiliaEntregaViewSet)
router.register('informes-familia-receptores', InformeFamiliaReceptorViewSet)
router.register('registros-pie', RegistroPIEViewSet)
router.register('equipo-aula', EquipoAulaViewSet)
router.register('planificaciones-pie', PlanificacionPIEViewSet)
router.register('trabajos-colaborativos', TrabajoColaborativoViewSet)
router.register('actividades-comunidad', ActividadComunidadViewSet)
router.register('logros-aprendizaje', LogroAprendizajeViewSet)
router.register('evaluaciones-pie', EvaluacionPIEViewSet)

urlpatterns = [
    *router.urls,
    path('auth/csrf/', csrf_token_view, name='csrf-token'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('mi-perfil/', mi_perfil, name='mi-perfil'),
    path('password-reset/request/', password_reset_request, name='password-reset-request'),
    path('password-reset/verify/', password_reset_verify, name='password-reset-verify'),
    path('password-reset/confirm/', password_reset_confirm, name='password-reset-confirm'),
    # Alias usados por el front-end (mantener ambos mientras conviven builds)
    path('auth/password-reset/', password_reset_request, name='auth-password-reset'),
    path('auth/password-reset-confirm/', password_reset_confirm, name='auth-password-reset-confirm'),
    path('registros-pie/<int:registro_id>/pdf/', generar_registro_pie_pdf, name='registro-pie-pdf'),
]

