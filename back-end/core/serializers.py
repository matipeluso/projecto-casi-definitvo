import re

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from .models import (
    ActividadComunidad,
    Anamnesis,
    AntecedenteSalud,
    AntecedentesSaludFormulario,
    Apoderado,
    ApoyoAdicional,
    Curso,
    DetalleEvaluacionSalud,
    EquipoAula,
    Establecimiento,
    Estudiante,
    Especialidad,
    EstrategiaApoyo,
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
    Informante,
    Entrevistador,
    ItemAmbienteEscolar,
    LogroAprendizaje,
    ObservacionAmbiente,
    ObservacionEscolar,
    ObservacionItem,
    PlanificacionPIE,
    RegistroPIE,
    SituacionEscolar,
    SubdimensionArea,
    SubdimensionComentario,
    SubdimensionItem,
    Subsector,
    TrabajoColaborativo,
    TrayectoriaEscolar,
    Usuario,
)


UsuarioModel = get_user_model()


def normalizar_rut(value):
    if not value:
        return value
    clean = re.sub(r"[^0-9kK]", "", value)
    if len(clean) < 2:
        raise serializers.ValidationError("El RUT está incompleto.")
    cuerpo, dv = clean[:-1], clean[-1].upper()
    if not cuerpo.isdigit():
        raise serializers.ValidationError("El RUT solo puede contener números antes del dígito verificador.")
    multiplicador = 2
    total = 0
    for digit in reversed(cuerpo):
        total += int(digit) * multiplicador
        multiplicador = 2 if multiplicador == 7 else multiplicador + 1
    resto = total % 11
    dv_esperado = "0" if resto == 0 else "K" if resto == 1 else str(11 - resto)
    if dv_esperado != dv:
        raise serializers.ValidationError("El RUT no es válido.")
    cuerpo_normalizado = cuerpo.lstrip("0") or "0"
    return f"{cuerpo_normalizado}-{dv}"


class EspecialidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especialidad
        fields = "__all__"


class EstablecimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Establecimiento
        fields = [
            "id",
            "nombre",
            "rbd",
            "direccion",
            "comuna",
            "region",
            "telefono",
            "email",
            "tipo_dependencia",
        ]


class CursoSerializer(serializers.ModelSerializer):
    establecimiento = EstablecimientoSerializer(read_only=True)
    establecimiento_id = serializers.PrimaryKeyRelatedField(
        queryset=Establecimiento.objects.all(),
        source="establecimiento",
        write_only=True,
    )

    class Meta:
        model = Curso
        fields = ["id", "nombre", "nivel", "anio_escolar", "establecimiento", "establecimiento_id"]


class ApoderadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Apoderado
        fields = [
            "id",
            "nombres_apellidos",
            "run",
            "telefono",
            "correo",
            "direccion",
            "parentesco",
            "ocupacion",
            "escolaridad",
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    especialidad = EspecialidadSerializer(read_only=True)
    establecimiento = EstablecimientoSerializer(read_only=True)
    especialidad_id = serializers.PrimaryKeyRelatedField(
        queryset=Especialidad.objects.all(),
        source="especialidad",
        write_only=True,
        required=False,
        allow_null=True,
    )
    especialidad_nombre = serializers.CharField(write_only=True, required=False, allow_blank=True)
    establecimiento_id = serializers.PrimaryKeyRelatedField(
        queryset=Establecimiento.objects.all(),
        source="establecimiento",
        write_only=True,
        required=False,
        allow_null=True,
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = UsuarioModel
        fields = [
            "id",
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "telefono",
            "rut",
            "tipo",
            "especialidad",
            "especialidad_id",
            "especialidad_nombre",
            "establecimiento",
            "establecimiento_id",
            "is_active",
            "is_staff",
            "is_superuser",
        ]

    @staticmethod
    def _normalize_bool(value):
        if isinstance(value, bool) or value is None:
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"1", "true", "t", "yes", "si", "on"}
        return bool(value)

    def validate(self, attrs):
        for field in ("is_active", "is_staff", "is_superuser"):
            if field in attrs:
                attrs[field] = self._normalize_bool(attrs[field])
        if attrs.get("telefono") == "":
            attrs["telefono"] = None
        if attrs.get("rut") == "":
            attrs["rut"] = None
        if attrs.get("rut"):
            attrs["rut"] = normalizar_rut(attrs["rut"])
        return attrs

    def _assign_especialidad_from_nombre(self, validated_data):
        nombre = (validated_data.pop("especialidad_nombre", "") or "").strip()
        if nombre and not validated_data.get("especialidad"):
            especialidad_obj, _ = Especialidad.objects.get_or_create(nombre=nombre)
            validated_data["especialidad"] = especialidad_obj

    def validate_email(self, value):
        qs = UsuarioModel.objects.filter(email__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("El email ya está en uso.")
        return value

    def validate_username(self, value):
        qs = UsuarioModel.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("El nombre de usuario ya está en uso.")
        return value

    def validate_rut(self, value):
        if not value:
            return value
        value = normalizar_rut(value)
        qs = UsuarioModel.objects.filter(rut__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("El RUT ya está en uso.")
        return value

    def create(self, validated_data):
        self._assign_especialidad_from_nombre(validated_data)
        password = validated_data.pop("password", None)
        if not password:
            raise serializers.ValidationError({"password": "La contraseña es obligatoria al crear un usuario."})
        usuario = UsuarioModel(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        self._assign_especialidad_from_nombre(validated_data)
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class UsuarioPerfilSerializer(serializers.ModelSerializer):
    especialidad = EspecialidadSerializer(read_only=True)
    establecimiento = EstablecimientoSerializer(read_only=True)

    class Meta:
        model = UsuarioModel
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "telefono",
            "rut",
            "tipo",
            "is_staff",
            "is_superuser",
            "especialidad",
            "establecimiento",
        ]


class EstudianteSerializer(serializers.ModelSerializer):
    curso = CursoSerializer(read_only=True)
    curso_id = serializers.PrimaryKeyRelatedField(
        queryset=Curso.objects.all(),
        source="curso",
        write_only=True,
        required=False,
        allow_null=True,
    )
    establecimiento = EstablecimientoSerializer(read_only=True)
    establecimiento_id = serializers.PrimaryKeyRelatedField(
        queryset=Establecimiento.objects.all(),
        source="establecimiento",
        write_only=True,
        required=False,
        allow_null=True,
    )
    apoderado = ApoderadoSerializer(read_only=True)
    apoderado_id = serializers.PrimaryKeyRelatedField(
        queryset=Apoderado.objects.all(),
        source="apoderado",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Estudiante
        fields = [
            "id",
            "run",
            "nombres_apellidos",
            "nombre_social",
            "genero",
            "fecha_nacimiento",
            "nacionalidad",
            "lengua_origen",
            "lengua_uso",
            "direccion",
            "telefono",
            "via_comunicacion",
            "dominio_lengua_origen",
            "dominio_lengua_uso",
            "curso",
            "curso_id",
            "establecimiento",
            "establecimiento_id",
            "apoderado",
            "apoderado_id",
        ]


class InformanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Informante
        fields = ["id", "nombre", "relacion_estudiante", "fecha_entrevista", "presencia"]


class EntrevistadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrevistador
        fields = ["id", "nombre", "rol_cargo"]


class AntecedenteSaludSerializer(serializers.ModelSerializer):
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = AntecedenteSalud
        fields = "__all__"
        extra_kwargs = {
            "anamnesis": {"required": False, "allow_null": True},
        }

    def validate(self, data):
        if data.get("peso") is not None and data["peso"] <= 0:
            raise serializers.ValidationError("El peso debe ser positivo.")
        if data.get("talla") is not None and data["talla"] <= 0:
            raise serializers.ValidationError("La talla debe ser positiva.")
        if not (data.get("anamnesis") or data.get("estudiante_id") or (self.instance and self.instance.anamnesis_id)):
            raise serializers.ValidationError({"anamnesis": "Debes seleccionar un estudiante o una anamnesis."})
        return data

    def _apply_profesional_snapshot(self, attrs):
        profesional = attrs.get("profesional")
        if not profesional:
            request = self.context.get("request") if hasattr(self, "context") else None
            if request and request.user.is_authenticated:
                profesional = request.user
                attrs.setdefault("profesional", profesional)
        if not profesional:
            return attrs
        if not attrs.get("rut_profesional") and getattr(profesional, "rut", None):
            attrs["rut_profesional"] = profesional.rut
        if not attrs.get("cargo_profesional"):
            cargo = getattr(profesional, "cargo", None) or (
                profesional.especialidad.nombre if getattr(profesional, "especialidad", None) else None
            )
            if cargo:
                attrs["cargo_profesional"] = cargo
        if not attrs.get("especialidad") and getattr(profesional, "especialidad", None):
            attrs["especialidad"] = profesional.especialidad.nombre
        return attrs

    def create(self, validated_data):
        estudiante = validated_data.pop("estudiante_id", None)
        if not validated_data.get("anamnesis") and estudiante:
            validated_data["anamnesis"] = Anamnesis.objects.create(estudiante=estudiante)
        validated_data = self._apply_profesional_snapshot(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("estudiante_id", None)
        validated_data = self._apply_profesional_snapshot(validated_data)
        return super().update(instance, validated_data)


ANAMNESIS_FORM_VERSION = "2025.11"


class AnamnesisSerializer(serializers.ModelSerializer):
    informantes = InformanteSerializer(many=True, read_only=True)
    entrevistadores = EntrevistadorSerializer(many=True, read_only=True)
    antecedentes_salud = AntecedenteSaludSerializer(many=True, read_only=True)
    creado_por = UsuarioPerfilSerializer(read_only=True)

    class Meta:
        model = Anamnesis
        fields = [
            "id",
            "estudiante",
            "fecha",
            "definicion_problema",
            "observaciones_generales",
            "datos_formulario",
            "payload_version",
            "creado_por",
            "creado_en",
            "actualizado_en",
            "pdf_generado",
            "informantes",
            "entrevistadores",
            "antecedentes_salud",
        ]
        read_only_fields = [
            "pdf_generado",
            "creado_por",
            "creado_en",
            "actualizado_en",
        ]

    def validate_datos_formulario(self, value):
        if value in (None, ""):
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("Debe ser un objeto JSON.")
        return value

    def _apply_version(self, validated_data):
        if "datos_formulario" in validated_data:
            validated_data.setdefault("payload_version", ANAMNESIS_FORM_VERSION)
        return validated_data

    def create(self, validated_data):
        request = self.context.get("request") if hasattr(self, "context") else None
        if request and request.user.is_authenticated:
            validated_data.setdefault("creado_por", request.user)
        validated_data = self._apply_version(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_version(validated_data)
        return super().update(instance, validated_data)


class SubdimensionAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubdimensionArea
        fields = "__all__"


class SubdimensionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubdimensionItem
        fields = ["id", "area", "descripcion", "valor"]


class SubdimensionComentarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubdimensionComentario
        fields = ["id", "area", "fortaleza", "debilidad", "sintesis", "observaciones"]


class SubsectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subsector
        fields = ["id", "subsector", "tipo"]


class EstrategiaApoyoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstrategiaApoyo
        fields = ["id", "descripcion", "aplicada", "exitosa", "numero", "detalle"]


class ApoyoAdicionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApoyoAdicional
        fields = ["id", "tipo", "apoyo", "recibido", "descripcion_extra", "nota"]


class ObservacionAmbienteNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservacionAmbiente
        fields = ["id", "item", "descripcion", "valor"]
        read_only_fields = ["id"]


class EvaluacionPsicopedagogicaSerializer(serializers.ModelSerializer):
    estudiante = serializers.PrimaryKeyRelatedField(queryset=Estudiante.objects.all())
    evaluador_usuario = serializers.PrimaryKeyRelatedField(
        queryset=UsuarioModel.objects.all(), required=False, allow_null=True
    )
    items = SubdimensionItemSerializer(many=True, required=False)
    comentarios_subdimension = SubdimensionComentarioSerializer(many=True, required=False)
    subsectores = SubsectorSerializer(many=True, required=False)
    estrategias_apoyo = EstrategiaApoyoSerializer(many=True, required=False)
    apoyos_adicionales = ApoyoAdicionalSerializer(many=True, required=False)
    observaciones_ambiente = ObservacionAmbienteNestedSerializer(many=True, required=False)

    class Meta:
        model = EvaluacionPsicopedagogica
        fields = [
            "id",
            "estudiante",
            "evaluador_usuario",
            "evaluador",
            "rol_evaluador",
            "fecha",
            "fecha_evaluacion",
            "firma",
            "observaciones",
            "edad_anios",
            "edad_meses",
            "lengua_materna_grado",
            "lengua_materna_comprende",
            "lengua_materna_habla",
            "lengua_materna_lee",
            "lengua_materna_escribe",
            "lengua_uso_grado",
            "lengua_uso_comprende",
            "lengua_uso_habla",
            "lengua_uso_lee",
            "lengua_uso_escribe",
            "pdf_generado",
            "items",
            "comentarios_subdimension",
            "subsectores",
            "estrategias_apoyo",
            "apoyos_adicionales",
            "observaciones_ambiente",
        ]

    _nested_field_keys = (
        "items",
        "subsectores",
        "estrategias_apoyo",
        "apoyos_adicionales",
        "comentarios_subdimension",
        "observaciones_ambiente",
    )

    def _pop_nested_payloads(self, validated_data):
        payloads = {}
        for key in self._nested_field_keys:
            if key in validated_data:
                payloads[key] = (True, validated_data.pop(key))
            else:
                payloads[key] = (False, [])
        return payloads

    @staticmethod
    def _replace_collection(instance, manager, model_cls, payload):
        manager.all().delete()
        if not payload:
            return
        model_cls.objects.bulk_create([model_cls(evaluacion=instance, **attrs) for attrs in payload])

    def _sync_nested_relations(self, instance, nested_payloads, *, force=False):
        relations = (
            (instance.items, SubdimensionItem, "items"),
            (instance.subsectores, Subsector, "subsectores"),
            (instance.estrategias_apoyo, EstrategiaApoyo, "estrategias_apoyo"),
            (instance.apoyos_adicionales, ApoyoAdicional, "apoyos_adicionales"),
            (instance.comentarios_subdimension, SubdimensionComentario, "comentarios_subdimension"),
            (instance.observaciones_ambiente, ObservacionAmbiente, "observaciones_ambiente"),
        )

        for manager, model_cls, key in relations:
            provided, payload = nested_payloads[key]
            if not provided and not force:
                continue
            self._replace_collection(instance, manager, model_cls, payload)

    def create(self, validated_data):
        nested_payloads = self._pop_nested_payloads(validated_data)

        with transaction.atomic():
            evaluacion = EvaluacionPsicopedagogica.objects.create(**validated_data)
            self._sync_nested_relations(evaluacion, nested_payloads, force=True)
        return evaluacion

    def update(self, instance, validated_data):
        nested_payloads = self._pop_nested_payloads(validated_data)

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()

            self._sync_nested_relations(instance, nested_payloads, force=not self.partial)
        return instance


class EquipoAulaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipoAula
        fields = "__all__"


class PlanificacionPIESerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanificacionPIE
        fields = "__all__"


class TrabajoColaborativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrabajoColaborativo
        fields = "__all__"


class ActividadComunidadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActividadComunidad
        fields = "__all__"


class LogroAprendizajeSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = LogroAprendizaje
        fields = "__all__"


class EvaluacionPIESerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluacionPIE
        fields = "__all__"


class RegistroPIESerializer(serializers.ModelSerializer):
    curso = CursoSerializer(read_only=True)
    curso_id = serializers.PrimaryKeyRelatedField(
        queryset=Curso.objects.all(),
        source="curso",
        write_only=True,
    )
    responsable = UsuarioPerfilSerializer(read_only=True)
    responsable_id = serializers.PrimaryKeyRelatedField(
        queryset=UsuarioModel.objects.all(),
        source="responsable",
        write_only=True,
        required=False,
        allow_null=True,
    )
    equipo_aula = EquipoAulaSerializer(many=True, read_only=True)
    trabajos_colaborativos = TrabajoColaborativoSerializer(many=True, read_only=True)
    actividades_comunidad = ActividadComunidadSerializer(many=True, read_only=True)
    logros = LogroAprendizajeSerializer(many=True, read_only=True)
    planificacion = PlanificacionPIESerializer(read_only=True)
    evaluacion = EvaluacionPIESerializer(read_only=True)
    pdf_generado = serializers.FileField(read_only=True)

    class Meta:
        model = RegistroPIE
        fields = "__all__"
        read_only_fields = [
            "fecha_creacion",
            "creado_por",
            "actualizado_por",
            "actualizado_en",
            "pdf_generado",
        ]

    def _apply_user_metadata(self, validated_data):
        request = self.context.get("request") if hasattr(self, "context") else None
        user = request.user if request and request.user.is_authenticated else None
        if not user:
            return validated_data
        if not self.instance:
            validated_data.setdefault("creado_por", user)
        validated_data["actualizado_por"] = user
        return validated_data

    def create(self, validated_data):
        validated_data = self._apply_user_metadata(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_user_metadata(validated_data)
        return super().update(instance, validated_data)


class EvaluacionSaludSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
    )

    class Meta:
        model = EvaluacionSalud
        fields = "__all__"

    def _apply_profesional_snapshot(self, attrs):
        profesional = attrs.get("profesional")
        if not profesional:
            request = self.context.get("request") if hasattr(self, "context") else None
            if request and request.user.is_authenticated:
                profesional = request.user
                attrs.setdefault("profesional", profesional)
        if not profesional:
            return attrs
        if not attrs.get("rut_profesional") and getattr(profesional, "rut", None):
            attrs["rut_profesional"] = profesional.rut
        if not attrs.get("cargo_profesional"):
            cargo = getattr(profesional, "cargo", None) or (
                profesional.especialidad.nombre if getattr(profesional, "especialidad", None) else None
            )
            if cargo:
                attrs["cargo_profesional"] = cargo
        if not attrs.get("especialidad") and getattr(profesional, "especialidad", None):
            attrs["especialidad"] = profesional.especialidad.nombre
        return attrs

    def create(self, validated_data):
        validated_data = self._apply_profesional_snapshot(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_profesional_snapshot(validated_data)
        return super().update(instance, validated_data)


class DetalleEvaluacionSaludSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = DetalleEvaluacionSalud
        fields = "__all__"


class AntecedentesSaludFormularioSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = AntecedentesSaludFormulario
        fields = "__all__"


class EvaluacionPsicologicaSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = EvaluacionPsicologica
        fields = "__all__"


class EvaluacionLenguajeSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = EvaluacionLenguaje
        fields = "__all__"


class EvaluacionNeuropsicologicaSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = EvaluacionNeuropsicologica
        fields = "__all__"


class InformeEvaluacionSaludSerializer(serializers.ModelSerializer):
    formulario = serializers.PrimaryKeyRelatedField(read_only=True)
    formulario_id = serializers.PrimaryKeyRelatedField(
        queryset=FormularioEvaluacionSalud.objects.all(),
        source="formulario",
        write_only=True,
    )

    class Meta:
        model = InformeEvaluacionSalud
        fields = "__all__"


class FormularioEvaluacionSaludSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
    )
    profesional = UsuarioPerfilSerializer(read_only=True)
    profesional_id = serializers.PrimaryKeyRelatedField(
        queryset=UsuarioModel.objects.all(),
        source="profesional",
        write_only=True,
        required=False,
        allow_null=True,
    )
    detalles = DetalleEvaluacionSaludSerializer(many=True, read_only=True)
    antecedentes_salud = AntecedentesSaludFormularioSerializer(many=True, read_only=True)
    evaluaciones_psicologicas = EvaluacionPsicologicaSerializer(many=True, read_only=True)
    evaluaciones_lenguaje = EvaluacionLenguajeSerializer(many=True, read_only=True)
    evaluaciones_neuropsicologicas = EvaluacionNeuropsicologicaSerializer(many=True, read_only=True)
    informes_evaluacion_salud = InformeEvaluacionSaludSerializer(many=True, read_only=True)

    class Meta:
        model = FormularioEvaluacionSalud
        fields = "__all__"


class InformeFamiliaInstrumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeFamiliaInstrumento
        fields = ["id", "nombre", "fecha_aplicacion"]


class InformeFamiliaAmbitoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeFamiliaAmbito
        fields = ["id", "ambito", "fortalezas", "necesidades_apoyo"]


class InformeFamiliaSeguimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeFamiliaSeguimiento
        fields = ["id", "fecha_seguimiento", "nota"]


class InformeFamiliaEntregaSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeFamiliaEntrega
        fields = [
            "id",
            "profesional",
            "nombre_identidad",
            "nombre_social",
            "rut",
            "rol_cargo",
            "telefono",
            "email",
        ]
        extra_kwargs = {
            "profesional": {"required": False, "allow_null": True},
        }


class InformeFamiliaReceptorSerializer(serializers.ModelSerializer):
    class Meta:
        model = InformeFamiliaReceptor
        fields = [
            "id",
            "apoderado",
            "nombre_identidad",
            "rut_pasaporte",
            "nombre_social",
            "telefono",
            "email",
            "relacion",
            "es_apoderado_titular",
            "es_apoderado_suplente",
            "poder_simple",
            "en_presencia_de",
        ]
        extra_kwargs = {
            "apoderado": {"required": False, "allow_null": True},
        }


class InformeFamiliaSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True, source="Estudiante")
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="Estudiante",
        write_only=True,
    )
    instrumentos = InformeFamiliaInstrumentoSerializer(many=True, required=False)
    ambitos = InformeFamiliaAmbitoSerializer(many=True, required=False)
    seguimientos = InformeFamiliaSeguimientoSerializer(many=True, required=False)
    entrega = InformeFamiliaEntregaSerializer(many=True, required=False)
    receptores = InformeFamiliaReceptorSerializer(many=True, required=False)

    class Meta:
        model = InformeFamilia
        fields = "__all__"
        extra_kwargs = {
            "Estudiante": {"read_only": True},
        }

    NESTED_CONFIG = (
        ("instrumentos", InformeFamiliaInstrumentoSerializer),
        ("ambitos", InformeFamiliaAmbitoSerializer),
        ("seguimientos", InformeFamiliaSeguimientoSerializer),
        ("entrega", InformeFamiliaEntregaSerializer),
        ("receptores", InformeFamiliaReceptorSerializer),
    )

    def _pop_nested(self, validated_data):
        nested = {}
        for field, _ in self.NESTED_CONFIG:
            nested[field] = validated_data.pop(field, []) or []
        return nested

    @staticmethod
    def _has_meaningful_data(payload):
        for value in payload.values():
            if isinstance(value, bool):
                if value:
                    return True
                continue
            if value not in (None, "", []):
                return True
        return False

    def _replace_nested(self, instance, nested_data):
        for field_name, serializer_class in self.NESTED_CONFIG:
            items = nested_data.get(field_name)
            if items is None:
                continue
            manager = getattr(instance, field_name)
            manager.all().delete()
            if not items:
                continue
            model_class = serializer_class.Meta.model
            records = []
            for item in items:
                data = dict(item)
                data.pop("id", None)
                if not self._has_meaningful_data(data):
                    continue
                records.append(model_class(informe=instance, **data))
            if records:
                model_class.objects.bulk_create(records)

    def create(self, validated_data):
        nested = self._pop_nested(validated_data)
        informe = super().create(validated_data)
        self._replace_nested(informe, nested)
        return informe

    def update(self, instance, validated_data):
        nested = self._pop_nested(validated_data)
        informe = super().update(instance, validated_data)
        self._replace_nested(informe, nested)
        return informe


class TrayectoriaEscolarSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
    )

    class Meta:
        model = TrayectoriaEscolar
        fields = "__all__"


class SituacionEscolarSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
    )

    class Meta:
        model = SituacionEscolar
        fields = "__all__"


class ObservacionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservacionItem
        fields = "__all__"


class ObservacionEscolarSerializer(serializers.ModelSerializer):
    items = ObservacionItemSerializer(many=True, required=False)
    evaluacion = EvaluacionPsicopedagogicaSerializer(read_only=True)
    evaluacion_id = serializers.PrimaryKeyRelatedField(
        queryset=EvaluacionPsicopedagogica.objects.all(),
        source="evaluacion",
        write_only=True,
    )

    class Meta:
        model = ObservacionEscolar
        fields = "__all__"

    def create(self, validated_data):
        items_data = validated_data.pop("items", None)
        observacion = ObservacionEscolar.objects.create(**validated_data)
        if items_data:
            self._replace_items(observacion, items_data)
        return observacion

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            self._replace_items(instance, items_data)
        return instance

    @staticmethod
    def _replace_items(observacion, items_data):
        ObservacionItem.objects.bulk_create(
            [ObservacionItem(observacion=observacion, **item) for item in items_data]
        )


class ObservacionAmbienteSerializer(serializers.ModelSerializer):
    evaluacion = EvaluacionPsicopedagogicaSerializer(read_only=True)
    evaluacion_id = serializers.PrimaryKeyRelatedField(
        queryset=EvaluacionPsicopedagogica.objects.all(),
        source="evaluacion",
        write_only=True,
    )

    class Meta:
        model = ObservacionAmbiente
        fields = "__all__"


class ItemAmbienteEscolarSerializer(serializers.ModelSerializer):
    evaluacion = serializers.PrimaryKeyRelatedField(read_only=True)
    evaluacion_id = serializers.PrimaryKeyRelatedField(
        queryset=EvaluacionAmbienteEscolar.objects.all(),
        source="evaluacion",
        write_only=True,
    )

    class Meta:
        model = ItemAmbienteEscolar
        fields = "__all__"


class EvaluacionAmbienteEscolarSerializer(serializers.ModelSerializer):
    estudiante = EstudianteSerializer(read_only=True)
    estudiante_id = serializers.PrimaryKeyRelatedField(
        queryset=Estudiante.objects.all(),
        source="estudiante",
        write_only=True,
    )
    items = ItemAmbienteEscolarSerializer(many=True, read_only=True)

    class Meta:
        model = EvaluacionAmbienteEscolar
        fields = "__all__"

