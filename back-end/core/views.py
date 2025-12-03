from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login as django_login, logout as django_logout
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import FileResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    ActividadComunidad,
    Anamnesis,
    AntecedenteSalud,
    AntecedentesSaludFormulario,
    Apoderado,
    Curso,
    DetalleEvaluacionSalud,
    EquipoAula,
    Establecimiento,
    Especialidad,
    Estudiante,
    EvaluacionAmbienteEscolar,
    EvaluacionLenguaje,
    EvaluacionNeuropsicologica,
    EvaluacionPIE,
    EvaluacionPsicologica,
    EvaluacionPsicopedagogica,
    EvaluacionSalud,
    FormularioEvaluacionSalud,
    InformeEvaluacionSalud,
    InformeFamilia,
    InformeFamiliaAmbito,
    InformeFamiliaEntrega,
    InformeFamiliaInstrumento,
    InformeFamiliaReceptor,
    InformeFamiliaSeguimiento,
    ItemAmbienteEscolar,
    LogroAprendizaje,
    ObservacionAmbiente,
    ObservacionEscolar,
    ObservacionItem,
    PlanificacionPIE,
    RegistroPIE,
    SituacionEscolar,
    SubdimensionArea,
    SubdimensionItem,
    Subsector,
    TrabajoColaborativo,
    TrayectoriaEscolar,
)
from .serializers import (
    ActividadComunidadSerializer,
    AnamnesisSerializer,
    AntecedenteSaludSerializer,
    AntecedentesSaludFormularioSerializer,
    ApoderadoSerializer,
    CursoSerializer,
    DetalleEvaluacionSaludSerializer,
    EquipoAulaSerializer,
    EspecialidadSerializer,
    EstablecimientoSerializer,
    EstudianteSerializer,
    EvaluacionAmbienteEscolarSerializer,
    EvaluacionLenguajeSerializer,
    EvaluacionNeuropsicologicaSerializer,
    EvaluacionPIESerializer,
    EvaluacionPsicologicaSerializer,
    EvaluacionPsicopedagogicaSerializer,
    EvaluacionSaludSerializer,
    FormularioEvaluacionSaludSerializer,
    InformeEvaluacionSaludSerializer,
    InformeFamiliaAmbitoSerializer,
    InformeFamiliaEntregaSerializer,
    InformeFamiliaInstrumentoSerializer,
    InformeFamiliaReceptorSerializer,
    InformeFamiliaSeguimientoSerializer,
    InformeFamiliaSerializer,
    ItemAmbienteEscolarSerializer,
    LogroAprendizajeSerializer,
    ObservacionAmbienteSerializer,
    ObservacionEscolarSerializer,
    ObservacionItemSerializer,
    PlanificacionPIESerializer,
    RegistroPIESerializer,
    SituacionEscolarSerializer,
    SubdimensionAreaSerializer,
    SubdimensionItemSerializer,
    SubsectorSerializer,
    TrabajoColaborativoSerializer,
    TrayectoriaEscolarSerializer,
    UsuarioPerfilSerializer,
    UsuarioSerializer,
)
import logging
import os

from .utils.pdf_generator import (
    generar_pdf_anamnesis,
    generar_pdf_registro_pie,
    generar_pdf_evaluacion_psicopedagogica,
    generar_pdf_informe_familia,
    generar_pdf_antecedente_salud,
)

logger = logging.getLogger(__name__)
Usuario = get_user_model()


@api_view(["GET"])
def csrf_token_view(request):
    """Entrega un token CSRF y lo sincroniza con la cookie."""
    token = get_token(request)
    return Response({"csrfToken": token})


@api_view(["POST"])
def login_view(request):
    identifier = request.data.get("identifier") or request.data.get("username") or request.data.get("email")
    password = request.data.get("password")
    if not identifier or not password:
        return Response({"message": "Credenciales requeridas."}, status=status.HTTP_400_BAD_REQUEST)

    username = identifier
    if "@" in identifier:
        try:
            username = Usuario.objects.get(email__iexact=identifier).username
        except Usuario.DoesNotExist:
            pass

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"message": "Credenciales inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({"message": "El usuario está inactivo."}, status=status.HTTP_403_FORBIDDEN)

    django_login(request, user)
    get_token(request)
    return Response({"message": "Autenticado correctamente.", "user": UsuarioPerfilSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    django_logout(request)
    return Response({"message": "Sesión finalizada."})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mi_perfil(request):
    return Response(UsuarioPerfilSerializer(request.user).data)


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_staff or request.user.is_superuser

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return self.has_permission(request, view)
        return request.user.is_staff or request.user.is_superuser


class IsSuperuserOnly(permissions.BasePermission):
    message = "Solo administradores pueden acceder a este recurso."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_superuser)


class ProfessionalReadOnly(permissions.BasePermission):
    """Impide que profesionales (no staff) editen o eliminen registros."""

    message = "Los profesionales no pueden editar ni eliminar este recurso."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if request.method in ("PUT", "PATCH", "DELETE"):
            if not (user.is_staff or user.is_superuser):
                return False
        return True


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related("especialidad", "establecimiento").all().order_by("username")
    serializer_class = UsuarioSerializer
    permission_classes = [IsSuperuserOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = [
        "username",
        "first_name",
        "last_name",
        "email",
        "especialidad__nombre",
        "establecimiento__nombre",
    ]

    def get_queryset(self):
        user = self.request.user
        base_qs = self.queryset.all()
        if not user.is_authenticated:
            return base_qs.none()
        if user.is_staff or user.is_superuser:
            return base_qs
        return base_qs.filter(pk=user.pk)


class RoleScopedViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    establishment_lookup = None

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        return self.apply_role_filter(queryset)

    def apply_role_filter(self, queryset):
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if user.is_superuser or user.is_staff:
            return queryset

        tipo = (user.tipo or "").lower()
        if tipo in {"interno", "sostenedor"}:
            if self.establishment_lookup and user.establecimiento_id:
                filtro = {self.establishment_lookup: user.establecimiento_id}
                return queryset.filter(**filtro).distinct()
            return queryset.none()
        if tipo == "externo":
            return self.filter_for_externo(queryset)
        return queryset.none()

    def filter_for_externo(self, queryset):
        return queryset.none()


class EspecialidadViewSet(RoleScopedViewSet):
    queryset = Especialidad.objects.all().order_by("nombre")
    serializer_class = EspecialidadSerializer

    def apply_role_filter(self, queryset):
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        # Registro transversal; basta con estar autenticado
        return queryset


class EstablecimientoViewSet(RoleScopedViewSet):
    queryset = Establecimiento.objects.all().order_by("nombre")
    serializer_class = EstablecimientoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "rbd", "comuna", "region"]
    establishment_lookup = "id"
    permission_classes = [IsSuperuserOnly]

    def filter_for_externo(self, queryset):
        return queryset.none()


class CursoViewSet(RoleScopedViewSet):
    queryset = Curso.objects.select_related("establecimiento").all().order_by("nombre")
    serializer_class = CursoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombre", "nivel", "establecimiento__nombre"]
    establishment_lookup = "establecimiento_id"

    def filter_for_externo(self, queryset):
        user = self.request.user
        return queryset.filter(registros_pie__responsable=user).distinct()


class ApoderadoViewSet(RoleScopedViewSet):
    queryset = Apoderado.objects.all().order_by("nombres_apellidos")
    serializer_class = ApoderadoSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombres_apellidos", "run", "telefono", "correo"]
    establishment_lookup = "estudiantes__establecimiento_id"
    permission_classes = [ProfessionalReadOnly]


class EstudianteViewSet(RoleScopedViewSet):
    queryset = (
        Estudiante.objects.select_related("curso", "establecimiento", "apoderado")
        .all()
        .order_by("nombres_apellidos")
    )
    serializer_class = EstudianteSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["nombres_apellidos", "run", "curso__nombre", "establecimiento__nombre"]
    establishment_lookup = "establecimiento_id"
    permission_classes = [ProfessionalReadOnly]

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        curso_id = self.request.query_params.get("curso")
        if curso_id:
            queryset = queryset.filter(curso_id=curso_id)
        return queryset

    def filter_for_externo(self, queryset):
        user = self.request.user
        return queryset.filter(curso__registros_pie__responsable=user).distinct()


class AnamnesisViewSet(RoleScopedViewSet):
    queryset = Anamnesis.objects.select_related("estudiante", "creado_por").all().order_by("-creado_en")
    serializer_class = AnamnesisSerializer
    establishment_lookup = "estudiante__establecimiento_id"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        estudiante_id = self.request.query_params.get("estudiante")
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        instance.pdf_generado = generar_pdf_anamnesis(instance)
        instance.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.pdf_generado = generar_pdf_anamnesis(instance)
        instance.save()

    @action(detail=True, methods=["get"], url_path="descargar-pdf")
    def descargar_pdf(self, request, pk=None):
        anamnesis = self.get_object()
        if not anamnesis.pdf_generado:
            pdf_path = generar_pdf_anamnesis(anamnesis)
            if pdf_path:
                anamnesis.pdf_generado = pdf_path
                anamnesis.save(update_fields=["pdf_generado"])
            else:
                return Response(
                    {"detail": "La anamnesis aún no cuenta con un PDF generado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        archivo = anamnesis.pdf_generado
        try:
            file_handle = archivo.open("rb")
        except FileNotFoundError:
            pdf_path = generar_pdf_anamnesis(anamnesis)
            if not pdf_path:
                return Response(
                    {"detail": "El archivo PDF ya no está disponible."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            anamnesis.pdf_generado = pdf_path
            anamnesis.save(update_fields=["pdf_generado"])
            archivo = anamnesis.pdf_generado
            file_handle = archivo.open("rb")

        filename = os.path.basename(archivo.name) or f"anamnesis_{anamnesis.pk}.pdf"
        response = FileResponse(file_handle, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AntecedenteSaludViewSet(RoleScopedViewSet):
    queryset = AntecedenteSalud.objects.select_related("anamnesis", "anamnesis__estudiante").all()
    serializer_class = AntecedenteSaludSerializer
    establishment_lookup = "anamnesis__estudiante__establecimiento_id"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        estudiante_id = self.request.query_params.get("estudiante")
        if estudiante_id:
            queryset = queryset.filter(anamnesis__estudiante_id=estudiante_id)
        return queryset

    def _generar_pdf(self, antecedente):
        try:
            pdf_path = generar_pdf_antecedente_salud(antecedente)
        except Exception:  # pragma: no cover
            logger.exception("No se pudo generar el PDF de antecedentes de salud %s", antecedente.pk)
            return
        if pdf_path:
            antecedente.pdf_generado = pdf_path
            antecedente.save(update_fields=["pdf_generado"])

    def perform_create(self, serializer):
        antecedente = serializer.save()
        self._generar_pdf(antecedente)
        return antecedente

    def perform_update(self, serializer):
        antecedente = serializer.save()
        self._generar_pdf(antecedente)
        return antecedente

    @action(detail=True, methods=["get"], url_path="descargar-pdf")
    def descargar_pdf(self, request, pk=None):
        antecedente = self.get_object()
        if not antecedente.pdf_generado:
            self._generar_pdf(antecedente)
            if not antecedente.pdf_generado:
                return Response(
                    {"detail": "El registro aún no cuenta con un PDF generado."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        archivo = antecedente.pdf_generado
        try:
            handler = archivo.open("rb")
        except FileNotFoundError:
            self._generar_pdf(antecedente)
            if not antecedente.pdf_generado:
                return Response(
                    {"detail": "El archivo PDF ya no está disponible."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            archivo = antecedente.pdf_generado
            handler = archivo.open("rb")

        filename = os.path.basename(archivo.name) or f"evaluacion_salud_{antecedente.pk}.pdf"
        response = FileResponse(handler, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class EvaluacionPsicopedagogicaViewSet(RoleScopedViewSet):
    queryset = (
        EvaluacionPsicopedagogica.objects.select_related("estudiante", "evaluador_usuario")
        .prefetch_related(
            "items__area",
            "comentarios_subdimension__area",
            "subsectores",
            "estrategias_apoyo",
            "apoyos_adicionales",
            "observaciones_ambiente",
        )
        .all()
    )
    serializer_class = EvaluacionPsicopedagogicaSerializer
    establishment_lookup = "estudiante__establecimiento_id"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        estudiante_id = self.request.query_params.get("estudiante")
        if estudiante_id:
            queryset = queryset.filter(estudiante_id=estudiante_id)
        return queryset

    def _generar_pdf(self, evaluacion):
        try:
            pdf_path = generar_pdf_evaluacion_psicopedagogica(evaluacion)
        except Exception as exc:  # pragma: no cover - logging path
            logger.exception("No se pudo generar el PDF de la evaluación %s", evaluacion.id)
            return
        if pdf_path:
            evaluacion.pdf_generado = pdf_path
            evaluacion.save(update_fields=["pdf_generado"])

    def perform_create(self, serializer):
        evaluacion = serializer.save()
        self._generar_pdf(evaluacion)

    def perform_update(self, serializer):
        evaluacion = serializer.save()
        self._generar_pdf(evaluacion)

    @action(detail=True, methods=["get"], url_path="descargar-pdf")
    def descargar_pdf(self, request, pk=None):
        evaluacion = self.get_object()
        if not evaluacion.pdf_generado:
            return Response(
                {"detail": "La evaluación aún no cuenta con un PDF generado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        archivo = evaluacion.pdf_generado
        try:
            file_handle = archivo.open("rb")
        except FileNotFoundError:
            return Response(
                {"detail": "El archivo PDF ya no está disponible."},
                status=status.HTTP_404_NOT_FOUND,
            )

        filename = os.path.basename(archivo.name) or f"evaluacion_psico_{evaluacion.pk}.pdf"
        response = FileResponse(file_handle, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class TrayectoriaEscolarViewSet(RoleScopedViewSet):
    queryset = TrayectoriaEscolar.objects.select_related("estudiante").all()
    serializer_class = TrayectoriaEscolarSerializer
    establishment_lookup = "estudiante__establecimiento_id"


class SituacionEscolarViewSet(RoleScopedViewSet):
    queryset = SituacionEscolar.objects.select_related("estudiante").all()
    serializer_class = SituacionEscolarSerializer
    establishment_lookup = "estudiante__establecimiento_id"


class SubdimensionAreaViewSet(RoleScopedViewSet):
    queryset = SubdimensionArea.objects.all().order_by("nombre")
    serializer_class = SubdimensionAreaSerializer

    def apply_role_filter(self, queryset):
        # Todos los usuarios autenticados pueden consultar áreas
        return queryset if self.request.user.is_authenticated else queryset.none()


class SubdimensionItemViewSet(RoleScopedViewSet):
    queryset = SubdimensionItem.objects.select_related("evaluacion", "area").all()
    serializer_class = SubdimensionItemSerializer
    establishment_lookup = "evaluacion__estudiante__establecimiento_id"


class SubsectorViewSet(RoleScopedViewSet):
    queryset = Subsector.objects.select_related("evaluacion").all()
    serializer_class = SubsectorSerializer
    establishment_lookup = "evaluacion__estudiante__establecimiento_id"


class ObservacionEscolarViewSet(RoleScopedViewSet):
    queryset = (
        ObservacionEscolar.objects.select_related("evaluacion", "evaluacion__estudiante")
        .prefetch_related("items")
        .all()
    )
    serializer_class = ObservacionEscolarSerializer
    establishment_lookup = "evaluacion__estudiante__establecimiento_id"


class ObservacionItemViewSet(RoleScopedViewSet):
    queryset = (
        ObservacionItem.objects.select_related(
            "observacion",
            "observacion__evaluacion",
            "observacion__evaluacion__estudiante",
        )
        .all()
    )
    serializer_class = ObservacionItemSerializer
    establishment_lookup = "observacion__evaluacion__estudiante__establecimiento_id"


class EvaluacionAmbienteEscolarViewSet(RoleScopedViewSet):
    queryset = (
        EvaluacionAmbienteEscolar.objects.select_related("estudiante")
        .prefetch_related("items")
        .all()
    )
    serializer_class = EvaluacionAmbienteEscolarSerializer
    establishment_lookup = "estudiante__establecimiento_id"


class ItemAmbienteEscolarViewSet(RoleScopedViewSet):
    queryset = (
        ItemAmbienteEscolar.objects.select_related(
            "evaluacion",
            "evaluacion__estudiante",
        ).all()
    )
    serializer_class = ItemAmbienteEscolarSerializer
    establishment_lookup = "evaluacion__estudiante__establecimiento_id"


class ObservacionAmbienteViewSet(RoleScopedViewSet):
    queryset = (
        ObservacionAmbiente.objects.select_related(
            "evaluacion",
            "evaluacion__estudiante",
        ).all()
    )
    serializer_class = ObservacionAmbienteSerializer
    establishment_lookup = "evaluacion__estudiante__establecimiento_id"


class EvaluacionSaludViewSet(RoleScopedViewSet):
    queryset = EvaluacionSalud.objects.select_related("estudiante").all()
    serializer_class = EvaluacionSaludSerializer
    establishment_lookup = "estudiante__establecimiento_id"

    def filter_for_externo(self, queryset):
        user = self.request.user
        return queryset.filter(estudiante__curso__registros_pie__responsable=user).distinct()


class FormularioEvaluacionSaludViewSet(RoleScopedViewSet):
    queryset = (
        FormularioEvaluacionSalud.objects.select_related("estudiante", "profesional")
        .prefetch_related(
            "detalles",
            "antecedentes_salud",
            "evaluaciones_psicologicas",
            "evaluaciones_lenguaje",
            "evaluaciones_neuropsicologicas",
            "informes_evaluacion_salud",
        )
        .all()
    )
    serializer_class = FormularioEvaluacionSaludSerializer
    establishment_lookup = "estudiante__establecimiento_id"


class DetalleEvaluacionSaludViewSet(RoleScopedViewSet):
    queryset = DetalleEvaluacionSalud.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = DetalleEvaluacionSaludSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class AntecedentesSaludFormularioViewSet(RoleScopedViewSet):
    queryset = AntecedentesSaludFormulario.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = AntecedentesSaludFormularioSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class EvaluacionPsicologicaViewSet(RoleScopedViewSet):
    queryset = EvaluacionPsicologica.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = EvaluacionPsicologicaSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class EvaluacionLenguajeViewSet(RoleScopedViewSet):
    queryset = EvaluacionLenguaje.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = EvaluacionLenguajeSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class EvaluacionNeuropsicologicaViewSet(RoleScopedViewSet):
    queryset = EvaluacionNeuropsicologica.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = EvaluacionNeuropsicologicaSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class InformeEvaluacionSaludViewSet(RoleScopedViewSet):
    queryset = InformeEvaluacionSalud.objects.select_related(
        "formulario",
        "formulario__estudiante",
    ).all()
    serializer_class = InformeEvaluacionSaludSerializer
    establishment_lookup = "formulario__estudiante__establecimiento_id"


class InformeFamiliaViewSet(RoleScopedViewSet):
    queryset = InformeFamilia.objects.select_related("Estudiante").all()
    serializer_class = InformeFamiliaSerializer
    establishment_lookup = "Estudiante__establecimiento_id"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.warning(
                "[InformeFamilia] payload invalido (usuario=%s): data=%s errores=%s",
                request.user.pk if request.user.is_authenticated else "anonimo",
                request.data,
                serializer.errors,
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logger.warning(
                "[InformeFamilia] payload invalido en update (usuario=%s, informe=%s): data=%s errores=%s",
                request.user.pk if request.user.is_authenticated else "anonimo",
                instance.pk,
                request.data,
                serializer.errors,
            )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}
        return Response(serializer.data)

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        estudiante_id = self.request.query_params.get("estudiante")
        if estudiante_id:
            queryset = queryset.filter(Estudiante_id=estudiante_id)
        return queryset

    def _generar_pdf(self, informe):
        try:
            pdf_path = generar_pdf_informe_familia(informe)
        except Exception:  # pragma: no cover - solo log
            logger.exception("No se pudo generar el PDF del informe %s", informe.id)
            return
        if pdf_path:
            informe.pdf_generado = pdf_path
            informe.save(update_fields=["pdf_generado"])

    def perform_create(self, serializer):
        informe = serializer.save()
        self._generar_pdf(informe)

    def perform_update(self, serializer):
        informe = serializer.save()
        self._generar_pdf(informe)

    @action(detail=True, methods=["get"], url_path="descargar-pdf")
    def descargar_pdf(self, request, pk=None):
        informe = self.get_object()
        if not informe.pdf_generado:
            self._generar_pdf(informe)
            if not informe.pdf_generado:
                return Response(
                    {"detail": "El informe aún no cuenta con un PDF disponible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        archivo = informe.pdf_generado
        try:
            file_handle = archivo.open("rb")
        except FileNotFoundError:
            self._generar_pdf(informe)
            archivo = informe.pdf_generado
            if not archivo:
                return Response(
                    {"detail": "El archivo PDF ya no está disponible."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            file_handle = archivo.open("rb")

        filename = os.path.basename(archivo.name) or f"informe_familia_{informe.pk}.pdf"
        response = FileResponse(file_handle, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class InformeFamiliaInstrumentoViewSet(RoleScopedViewSet):
    queryset = InformeFamiliaInstrumento.objects.select_related(
        "informe",
        "informe__Estudiante",
    ).all()
    serializer_class = InformeFamiliaInstrumentoSerializer
    establishment_lookup = "informe__Estudiante__establecimiento_id"


class InformeFamiliaAmbitoViewSet(RoleScopedViewSet):
    queryset = InformeFamiliaAmbito.objects.select_related(
        "informe",
        "informe__Estudiante",
    ).all()
    serializer_class = InformeFamiliaAmbitoSerializer
    establishment_lookup = "informe__Estudiante__establecimiento_id"


class InformeFamiliaSeguimientoViewSet(RoleScopedViewSet):
    queryset = InformeFamiliaSeguimiento.objects.select_related(
        "informe",
        "informe__Estudiante",
    ).all()
    serializer_class = InformeFamiliaSeguimientoSerializer
    establishment_lookup = "informe__Estudiante__establecimiento_id"


class InformeFamiliaEntregaViewSet(RoleScopedViewSet):
    queryset = InformeFamiliaEntrega.objects.select_related(
        "informe",
        "informe__Estudiante",
    ).all()
    serializer_class = InformeFamiliaEntregaSerializer
    establishment_lookup = "informe__Estudiante__establecimiento_id"


class InformeFamiliaReceptorViewSet(RoleScopedViewSet):
    queryset = InformeFamiliaReceptor.objects.select_related(
        "informe",
        "informe__Estudiante",
    ).all()
    serializer_class = InformeFamiliaReceptorSerializer
    establishment_lookup = "informe__Estudiante__establecimiento_id"


class RegistroPIEViewSet(RoleScopedViewSet):
    queryset = (
        RegistroPIE.objects.select_related("curso", "curso__establecimiento", "responsable")
        .prefetch_related(
            "equipo_aula",
            "trabajos_colaborativos",
            "actividades_comunidad",
            "logros",
        )
        .all()
        .order_by("-fecha_creacion")
    )
    serializer_class = RegistroPIESerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["curso__nombre", "periodo", "curso__establecimiento__nombre"]
    establishment_lookup = "curso__establecimiento_id"

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        curso_id = self.request.query_params.get("curso")
        if curso_id:
            queryset = queryset.filter(curso_id=curso_id)
        return queryset

    def filter_for_externo(self, queryset):
        return queryset.filter(responsable=self.request.user)

    def _generar_pdf(self, registro):
        try:
            pdf_path = generar_pdf_registro_pie(registro)
        except Exception:  # pragma: no cover - solo log
            logger.exception("No se pudo generar el PDF del registro PIE %s", registro.id)
            return
        if pdf_path:
            registro.pdf_generado = pdf_path
            registro.save(update_fields=["pdf_generado"])

    def perform_create(self, serializer):
        registro = serializer.save()
        self._generar_pdf(registro)

    def perform_update(self, serializer):
        registro = serializer.save()
        self._generar_pdf(registro)

    @action(detail=True, methods=["get"], url_path="descargar-pdf")
    def descargar_pdf(self, request, pk=None):
        registro = self.get_object()
        if not registro.pdf_generado:
            self._generar_pdf(registro)
            if not registro.pdf_generado:
                return Response(
                    {"detail": "El registro aún no cuenta con un PDF disponible."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        archivo = registro.pdf_generado
        try:
            file_handle = archivo.open("rb")
        except FileNotFoundError:
            self._generar_pdf(registro)
            try:
                file_handle = registro.pdf_generado.open("rb")
            except Exception:
                return Response(
                    {"detail": "El archivo PDF ya no está disponible."},
                    status=status.HTTP_404_NOT_FOUND,
                )

        filename = os.path.basename(archivo.name) or f"registro_pie_{registro.pk}.pdf"
        response = FileResponse(file_handle, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class RegistroPDERelatedViewSet(RoleScopedViewSet):
    establishment_lookup = "registro__curso__establecimiento_id"

    def filter_for_externo(self, queryset):
        return queryset.filter(registro__responsable=self.request.user)


class EquipoAulaViewSet(RegistroPDERelatedViewSet):
    queryset = EquipoAula.objects.select_related("registro", "registro__curso").all()
    serializer_class = EquipoAulaSerializer


class PlanificacionPIEViewSet(RegistroPDERelatedViewSet):
    queryset = PlanificacionPIE.objects.select_related("registro").all()
    serializer_class = PlanificacionPIESerializer


class TrabajoColaborativoViewSet(RegistroPDERelatedViewSet):
    queryset = TrabajoColaborativo.objects.select_related("registro").all()
    serializer_class = TrabajoColaborativoSerializer


class ActividadComunidadViewSet(RegistroPDERelatedViewSet):
    queryset = ActividadComunidad.objects.select_related("registro").all()
    serializer_class = ActividadComunidadSerializer


class LogroAprendizajeViewSet(RegistroPDERelatedViewSet):
    queryset = LogroAprendizaje.objects.select_related("registro", "estudiante").all()
    serializer_class = LogroAprendizajeSerializer


class EvaluacionPIEViewSet(RegistroPDERelatedViewSet):
    queryset = EvaluacionPIE.objects.select_related("registro").all()
    serializer_class = EvaluacionPIESerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generar_registro_pie_pdf(request, registro_id):
    try:
        registro = RegistroPIE.objects.get(pk=registro_id)
        pdf_path = generar_pdf_registro_pie(registro)
        if pdf_path:
            registro.pdf_generado = pdf_path
            registro.save(update_fields=["pdf_generado"])
        return Response({"pdf": pdf_path})
    except RegistroPIE.DoesNotExist:
        return Response({"error": "Registro PIE no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        return Response({"error": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
def password_reset_request(request):
    email = (request.data.get("email") or "").strip()
    generic_response = {"message": "Si el correo existe, te enviaremos un enlace para restablecer la contraseña."}
    if not email:
        return Response(generic_response, status=status.HTTP_200_OK)

    try:
        user = Usuario.objects.get(email__iexact=email)
    except Usuario.DoesNotExist:
        # Respondemos 200 para no filtrar si el correo está registrado
        return Response(generic_response, status=status.HTTP_200_OK)

    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    frontend_base = getattr(settings, "FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")
    reset_link = f"{frontend_base}/recuperar-contrasena?uid={uid}&token={token}"

    try:
        send_mail(
            "Restablecer contraseña",
            (
                f"Hola {user.first_name or user.username},\n\n"
                "Recibimos una solicitud para restablecer tu contraseña en la plataforma PIE. "
                f"Puedes crear una nueva usando el siguiente enlace (válido por tiempo limitado):\n{reset_link}\n\n"
                "Si no solicitaste este cambio, ignora este correo."
            ),
            getattr(settings, "DEFAULT_FROM_EMAIL", "no-reply@pie.cl"),
            [user.email],
            fail_silently=False,
        )
    except Exception:  # pragma: no cover - dependiente de red
        logger.exception("No se pudo enviar el correo de restablecimiento para %s", user.pk)
        return Response(
            {
                "error": "No pudimos enviar el correo en este momento. Revisa la configuración SMTP o intenta más tarde.",
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )
    return Response(generic_response, status=status.HTTP_200_OK)


@api_view(["POST"])
def password_reset_verify(request):
    uidb64 = request.data.get("uid")
    token = request.data.get("token")
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Usuario.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Solicitud inválida."}, status=status.HTTP_400_BAD_REQUEST)

    if default_token_generator.check_token(user, token):
        return Response({"message": "Token válido."})
    return Response({"error": "Token inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
def password_reset_confirm(request):
    uidb64 = request.data.get("uid")
    token = request.data.get("token")
    new_password = request.data.get("new_password")

    if not new_password or len(new_password) < 8:
        return Response(
            {"error": "La contraseña debe tener al menos 8 caracteres."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = Usuario.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Solicitud inválida."}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "Token inválido o expirado."}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Contraseña restablecida correctamente."})
