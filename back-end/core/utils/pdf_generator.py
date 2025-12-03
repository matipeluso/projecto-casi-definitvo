import io
from collections import defaultdict
from datetime import date, datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from django.conf import settings
from django.utils import timezone
from django.utils.html import escape
import os

VALOR_LABELS = {
    1: "Siempre",
    2: "Generalmente",
    3: "Ocasionalmente",
    4: "Nunca",
    0: "No observado",
}

OBSERVACION_CATEGORY_LABELS = {
    "academico": "Antecedentes académicos",
    "social": "Antecedentes sociales y comunicativos",
}

OBSERVACION_CATEGORY_BY_ITEM = {
    1: "academico",
    2: "academico",
    3: "academico",
    4: "academico",
    5: "academico",
    6: "academico",
    7: "academico",
    8: "academico",
    9: "academico",
    10: "academico",
    11: "social",
    12: "social",
    13: "social",
    14: "social",
    15: "social",
    16: "social",
    17: "social",
    18: "social",
    19: "social",
    20: "social",
}

ANAMNESIS_PROFESIONALES = [
    ("Pediatría", "atencion_pediatría"),
    ("Kinesiología", "atencion_kinesiología"),
    ("Genético", "atencion_genético"),
    ("Fonoaudiología", "atencion_fonoaudiología"),
    ("Neurología", "atencion_neurología"),
    ("Psicología", "atencion_psicología"),
    ("Psiquiatría", "atencion_psiquiatría"),
    ("Psicopedagogía", "atencion_psicopedagogía"),
    ("Terapia Ocupacional", "atencion_terapia_ocupacional"),
    ("Otro", "atencion_otro"),
]

ANAMNESIS_MOTRICIDAD_GRUESA = [
    ("Estabilidad al caminar", "gruesa_estabilidad_caminar"),
    ("Caídas frecuentes", "gruesa_caidas_frecuentes"),
    ("Dominancia lateral", "gruesa_dominancia_lateral"),
]

ANAMNESIS_MOTRICIDAD_FINA = [
    ("Garra", "fina_garra"),
    ("Prensión", "fina_prension"),
    ("Pinza", "fina_pinza"),
    ("Ensarta", "fina_ensarta"),
    ("Dibuja", "fina_dibuja"),
    ("Escribe", "fina_escribe"),
]

ANAMNESIS_COGNITIVOS = [
    ("Reacciona a voces o caras familiares", "cognitivo_voces_caras"),
    ("Manipula y explora objetos", "cognitivo_manipula_explora"),
    ("Demanda objetos y compañía", "cognitivo_demanda_objetos"),
    ("Comprende prohibiciones", "cognitivo_comprende_prohibiciones"),
    ("Sonríe, balbucea, indica o señala", "cognitivo_expresa_emociones"),
    ("Descoordinación ojo-mano", "cognitivo_descoordinacion"),
]

ANAMNESIS_VISION_ITEMS = [
    "Se interesa por estímulos visuales",
    "Ojos irritados o llorosos",
    "Dolores frecuentes de cabeza",
    "Se acerca o aleja demasiado los objetos",
    "Sigue desplazamiento de objetos o personas",
    "Movimientos oculares anormales",
    "Conductas erróneas (tropezones, choques)",
    "Diagnóstico médico (miopía, estrabismo, etc.)",
]

ANAMNESIS_AUDICION_ITEMS = [
    "Se interesa por estímulos auditivos",
    "No reconoce voces o sonidos familiares",
    "Gira la cabeza ante ruidos fuertes",
    "Acerca los oídos a la fuente de sonido",
    "Se tapa o golpea los oídos",
    "Pronunciación oral adecuada",
    "Diagnóstico médico (otitis, hipoacusia, etc.)",
]

ANAMNESIS_LENGUAJE_EXPRESIVO = [
    ("Balbucea o emite sonidos", "expresivo_balbucea"),
    ("Vocaliza o realiza gestos aislados", "expresivo_gestos_aislados"),
    ("Emite palabras o señas", "expresivo_palabras_senas"),
    ("Emite frases", "expresivo_frases"),
    ("Relata experiencias", "expresivo_relata"),
    ("Pronunciación clara", "expresivo_pronunciacion"),
]

ANAMNESIS_LENGUAJE_COMPRENSIVO = [
    ("Identifica objetos", "comprensivo_identifica_objetos"),
    ("Identifica personas", "comprensivo_identifica_personas"),
    ("Comprende conceptos abstractos", "comprensivo_conceptos_abstractos"),
    ("Responde preguntas de la vida diaria", "comprensivo_preguntas_diarias"),
    ("Sigue instrucciones simples", "comprensivo_instrucciones_simples"),
    ("Sigue instrucciones complejas", "comprensivo_instrucciones_complejas"),
    ("Sigue instrucciones grupales", "comprensivo_instrucciones_grupales"),
    ("Comprende relatos o cuentos", "comprensivo_comprende_relatos"),
]

ANAMNESIS_SALUD_ACTUAL = [
    ("Vacunas al día", "salud_vacunas"),
    ("Epilepsia", "salud_epilepsia"),
    ("Problemas cardiacos", "salud_cardiacos"),
    ("Paraplejia", "salud_paraplejia"),
    ("Pérdida auditiva", "salud_perdida_auditiva"),
    ("Pérdida visual", "salud_perdida_visual"),
    ("Trastorno motor", "salud_trastorno_motor"),
    ("Problema bronco-respiratorio", "salud_bronco_respiratorio"),
    ("Enfermedad infecto-contagiosa", "salud_infecto_contagiosa"),
    ("Trastorno emocional", "salud_trastorno_emocional"),
    ("Trastorno conductual", "salud_trastorno_conductual"),
]

ANAMNESIS_SUENO_INDICADORES = [
    ("Insomnio", "suenio_indicador_insomnio"),
    ("Pesadillas", "suenio_indicador_pesadillas"),
    ("Terrores nocturnos", "suenio_indicador_terrores"),
    ("Sonambulismo", "suenio_indicador_sonambulismo"),
    ("Despierta de buen humor", "suenio_indicador_buen_humor"),
]

ANAMNESIS_HUMOR_ITEMS = [
    ("Alegre", "humor_alegre"),
    ("Juguetón/bromista", "humor_jugueton"),
    ("Risueño/a", "humor_risueno"),
    ("Triste", "humor_triste"),
    ("Serio", "humor_serio"),
    ("Rebelde", "humor_rebelde"),
    ("Apático", "humor_apatico"),
    ("Violento/a", "humor_violento"),
]

ANAMNESIS_SITUACION_ITEMS = [
    ("Dificultad de aprendizaje", "situacion_dificultad_aprendizaje"),
    ("Dificultad para participar", "situacion_dificultad_participar"),
    ("Conducta disruptiva", "situacion_conducta_disruptiva"),
]

ANAMNESIS_HABITOS_ITEMS = [
    ("Asiste regularmente", "habito_asiste_regular"),
    ("Asiste con agrado", "habito_asiste_agrado"),
    ("Apoyo familiar en tareas", "habito_apoyo_tareas"),
    ("Amigos/as", "habito_amigos"),
]

ANAMNESIS_RESPUESTA_DIFICULTADES = [
    ("Apoyo", "respuesta_dificultades_apoyo"),
    ("Castigo", "respuesta_dificultades_castigo"),
    ("Indiferencia", "respuesta_dificultades_indiferencia"),
    ("Compasión", "respuesta_dificultades_compasion"),
    ("Tensión", "respuesta_dificultades_tension"),
    ("Otra", "respuesta_dificultades_otra"),
]

ANAMNESIS_REFUERZOS = [
    ("Expresiones afectivas", "refuerzo_expresiones"),
    ("Alimentos preferidos", "refuerzo_alimentos"),
    ("Ver TV", "refuerzo_ver_tv"),
    ("Juguetes", "refuerzo_juguetes"),
    ("Tiempo libre", "refuerzo_tiempo_libre"),
]

ANAMNESIS_APOYOS = [
    ("Madre", "apoyo_madre"),
    ("Padre", "apoyo_padre"),
    ("Hermanos/as", "apoyo_hermanos"),
    ("Otros familiares", "apoyo_otros_familiares"),
    ("Otros profesionales", "apoyo_otros_profesionales"),
]

def generar_pdf_anamnesis(anamnesis):
    """Genera un informe visual de la entrevista familiar / anamnesis."""

    folder_path = _ensure_folder("anamnesis_pdfs")
    filename = f"anamnesis_{anamnesis.id}.pdf"
    file_path = os.path.join(folder_path, filename)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=30 * mm,
        bottomMargin=22 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="AnaTitle",
            parent=styles["Title"],
            alignment=1,
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaSubTitle",
            parent=styles["Normal"],
            alignment=1,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f6eb6"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaSection",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0b4f6c"),
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaSubSection",
            parent=styles["Heading3"],
            fontSize=11,
            leading=13,
            textColor=colors.HexColor("#0f6eb6"),
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaTableLabel",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaTableCell",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#212121"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="AnaMuted",
            parent=styles["BodyText"],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#607d8b"),
        )
    )

    datos = anamnesis.datos_formulario or {}
    estudiante = getattr(anamnesis, "estudiante", None)
    curso = getattr(estudiante, "curso", None)
    establecimiento_nombre = datos.get("establecimiento")
    if not establecimiento_nombre and curso and getattr(curso, "establecimiento", None):
        establecimiento_nombre = getattr(curso.establecimiento, "nombre", None)
    creado_por = getattr(anamnesis, "creado_por", None)
    generado = timezone.localtime()

    choice_maps = {
        "alimentacion_tipo": {
            "normal": "Normal",
            "bueno": "“Bueno/a” para comer",
            "malo": "“Malo/a” para comer",
            "otro": "Otro",
        },
        "peso_apreciacion": {
            "normal": "Normal",
            "bajo": "Bajo peso",
            "obesidad": "Obesidad",
        },
        "suenio_calidad": {
            "normal": "Normal",
            "tranquilo": "Tranquilo",
            "inquieto": "Inquieto",
        },
        "suenio_duerme": {
            "solo": "Solo",
            "acompanado": "Acompañado",
        },
        "actividad_motora": {
            "normal": "Normal",
            "activo": "Activo",
            "hiperactivo": "Hiperactivo",
            "hipoactivo": "Hipoactivo",
        },
        "tono_muscular": {
            "normal": "Normal",
            "hipertónico": "Hipertónico",
            "hipotónico": "Hipotónico",
        },
        "modalidad_ensenanza": {
            "regular": "Regular",
            "especial": "Especial",
            "tecnica": "Técnica",
        },
        "modo_comunicacion": {
            "oral": "Oral",
            "gestual": "Gestual",
            "mixta": "Mixta",
            "otro": "Otro",
        },
        "respuesta_exitos": {
            "apoyo": "Apoyo",
            "indiferencia": "Indiferencia",
            "otra": "Otra",
        },
        "expectativas_familia": {
            "alta": "Alta (incluye familia)",
            "mediana": "Mediana (madre/padre)",
            "baja": "Baja (sin apoyo)",
        },
        "ambiente_aprendizaje": {
            "ambos": "Ambos (físico y emocional)",
            "solo_fisico": "Solo físico",
            "solo_emocional": "Solo emocional",
        },
    }

    def _parse_bool(value):
        if value in (None, ""):
            return None
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"si", "sí", "true", "1", "on"}:
                return True
            if normalized in {"no", "false", "0", "off"}:
                return False
        return None

    def _bool_text_display(value):
        parsed = _parse_bool(value)
        if parsed is None:
            return "—"
        return "Sí" if parsed else "No"

    def _format_date_input(value):
        if not value:
            return "—"
        if isinstance(value, (datetime, date)):
            return value.strftime("%d/%m/%Y")
        try:
            parsed = datetime.strptime(str(value), "%Y-%m-%d")
            return parsed.strftime("%d/%m/%Y")
        except (ValueError, TypeError):
            return str(value)

    def _text(value, fallback="—"):
        if value is None:
            return fallback
        if isinstance(value, str):
            stripped = value.strip()
            return stripped or fallback
        if isinstance(value, (list, tuple, set)):
            items = [str(v).strip() for v in value if str(v).strip()]
            return ", ".join(items) if items else fallback
        if isinstance(value, bool):
            return "Sí" if value else "No"
        return str(value)

    def _choice_text(key):
        value = datos.get(key)
        if value in (None, ""):
            return None
        mapping = choice_maps.get(key, {})
        if isinstance(value, str):
            return mapping.get(value, value.replace("_", " ").title())
        return mapping.get(value, value)

    def _table_kv(pairs):
        clean_pairs = [(label, _text(value)) for label, value in pairs]
        table = Table(
            [
                [Paragraph(f"<b>{label}</b>", styles["AnaTableLabel"]), Paragraph(_format_text(value), styles["AnaTableCell"])]
                for label, value in clean_pairs
            ],
            colWidths=[doc.width * 0.32, doc.width * 0.68],
            hAlign="LEFT",
        )
        table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
                    ("LEFTPADDING", (0, 0), (-1, -1), 4),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        return table

    def _table_boolean(title_pairs):
        if not title_pairs:
            return None
        table = Table(
            [
                [Paragraph(label, styles["AnaTableCell"]), Paragraph(_bool_text_display(key_value), styles["AnaTableCell"])]
                for label, key_value in title_pairs
            ],
            colWidths=[doc.width * 0.7, doc.width * 0.3],
            hAlign="LEFT",
        )
        table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
                ]
            )
        )
        return table

    def _extract_people(prefix, slots):
        rows = []
        for idx in range(1, slots + 1):
            base = f"{prefix}_{idx}_"
            nombre = datos.get(base + "nombre")
            if not any(
                datos.get(base + field)
                for field in ("nombre", "fecha", "relacion", "rol", "presencia")
            ):
                continue
            rows.append(
                [
                    str(idx),
                    _format_date_input(datos.get(base + "fecha")),
                    _text(nombre),
                    _text(datos.get(base + "relacion") or datos.get(base + "rol")),
                    _text(datos.get(base + "presencia")),
                ]
            )
        return rows

    story = []
    story.append(Paragraph("Entrevista a la Familia / Anamnesis", styles["AnaTitle"]))
    story.append(Paragraph("Síntesis de los antecedentes de salud, escolares y sociales del estudiante", styles["AnaSubTitle"]))
    story.append(Spacer(1, 10))

    edad_text = "—"
    edad_anios = datos.get("edad_anios")
    edad_meses = datos.get("edad_meses")
    if edad_anios or edad_meses:
        partes = []
        if edad_anios:
            partes.append(f"{edad_anios} años")
        if edad_meses:
            partes.append(f"{edad_meses} meses")
        edad_text = " ".join(partes)

    sexo_map = {"M": "Masculino", "F": "Femenino"}
    creado_nombre = None
    if creado_por:
        creado_nombre = creado_por.get_full_name().strip() or creado_por.username

    story.append(Paragraph("1. Identificación del estudiante", styles["AnaSection"]))
    story.append(
        _table_kv(
            [
                ("Nombre", datos.get("estudiante_nombre") or (estudiante.nombres_apellidos if estudiante else None)),
                ("Sexo", sexo_map.get((datos.get("estudiante_sexo") or "").upper(), datos.get("estudiante_sexo") or "—")),
                ("Fecha de nacimiento", _format_date_input(datos.get("fecha_nacimiento") or getattr(estudiante, "fecha_nacimiento", None))),
                ("Edad actual", edad_text),
                ("País natal", datos.get("pais_natal") or getattr(estudiante, "pais_origen", None)),
                ("Domicilio", datos.get("domicilio") or getattr(estudiante, "domicilio", None)),
                ("Teléfono", datos.get("telefono") or getattr(getattr(estudiante, "apoderado", None), "telefono", None)),
                ("Escolaridad actual", datos.get("escolaridad") or getattr(getattr(estudiante, "curso", None), "nombre", None)),
                ("Establecimiento", establecimiento_nombre),
                ("Profesional que registra", creado_nombre),
                ("Última actualización", _format_date_input(timezone.localtime(anamnesis.actualizado_en) if anamnesis.actualizado_en else None)),
            ]
        )
    )

    def _habilidades(prefix):
        etiquetas = []
        for key, label in [
            ("comprende", "Comprende"),
            ("habla", "Habla"),
            ("lee", "Lee"),
            ("escribe", "Escribe"),
        ]:
            if _parse_bool(datos.get(f"{prefix}_{key}")):
                etiquetas.append(label)
        return ", ".join(etiquetas) if etiquetas else "Sin registro"

    story.append(Spacer(1, 6))
    story.append(
        _table_kv(
            [
                ("Lengua materna (grado)", datos.get("lengua_materna_grado")),
                ("Lengua materna (habilidades)", _habilidades("lengua_materna")),
                ("Lengua de uso (grado)", datos.get("lengua_uso_grado")),
                ("Lengua de uso (habilidades)", _habilidades("lengua_uso")),
            ]
        )
    )

    story.append(Paragraph("2. Informantes y entrevistadores", styles["AnaSection"]))
    informantes_rows = _extract_people("informante", 4)
    if informantes_rows:
        informantes = Table(
            [["#", "Fecha", "Nombre", "Relación", "En presencia de"]] + informantes_rows,
            colWidths=[doc.width * 0.08, doc.width * 0.18, doc.width * 0.28, doc.width * 0.23, doc.width * 0.23],
            hAlign="LEFT",
        )
        informantes.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e3f2fd")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0b4f6c")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
                ]
            )
        )
        story.append(Paragraph("Informantes", styles["AnaSubSection"]))
        story.append(informantes)
    else:
        story.append(Paragraph("No se registraron informantes.", styles["AnaMuted"]))

    entrevistadores_rows = _extract_people("entrevistador", 3)
    if entrevistadores_rows:
        entrevistadores = Table(
            [["#", "Fecha", "Nombre", "Rol", "Observaciones"]] + entrevistadores_rows,
            colWidths=[doc.width * 0.08, doc.width * 0.18, doc.width * 0.28, doc.width * 0.23, doc.width * 0.23],
            hAlign="LEFT",
        )
        entrevistadores.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8f5e9")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1b5e20")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
                ]
            )
        )
        story.append(Paragraph("Entrevistadores", styles["AnaSubSection"]))
        story.append(entrevistadores)

    story.append(Paragraph("3. Motivo de la entrevista", styles["AnaSection"]))
    story.append(Paragraph(f"<b>Definición del problema:</b> {_format_text(anamnesis.definicion_problema or datos.get('definicion_problema'))}", styles["AnaTableCell"]))
    story.append(Paragraph(f"<b>Observaciones generales:</b> {_format_text(anamnesis.observaciones_generales or datos.get('observaciones_generales') or datos.get('observaciones_familia') or '')}", styles["AnaTableCell"]))

    profesionales_activos = [label for label, key in ANAMNESIS_PROFESIONALES if _parse_bool(datos.get(key))]
    story.append(
        _table_kv(
            [
                ("Diagnóstico previo", _bool_text_display(datos.get("diagnostico_previo"))),
                ("Detalle diagnóstico", datos.get("diagnostico_detalle")),
                ("Profesionales consultados", ", ".join(profesionales_activos) if profesionales_activos else "Sin registro"),
            ]
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Desarrollo y salud", styles["AnaSection"]))
    story.append(Paragraph("Primer año de vida", styles["AnaSubSection"]))
    story.append(
        _table_kv(
            [
                ("Tipo de parto", datos.get("tipo_parto")),
                ("Motivo cesárea", datos.get("motivo_cesarea")),
                ("Asistencia médica", _bool_text_display(datos.get("asistencia_parto"))),
                ("Peso al nacer", datos.get("peso_nacer")),
                ("Talla al nacer", datos.get("talla_nacer")),
                ("Controles de salud", _bool_text_display(datos.get("controles_salud"))),
                ("Antecedentes embarazo", datos.get("antecedentes_embarazo")),
                ("Observaciones", datos.get("observaciones_primer_ano")),
            ]
        )
    )

    story.append(Paragraph("Desarrollo sensoriomotriz", styles["AnaSubSection"]))
    story.append(
        _table_kv(
            [
                ("Edad fija cabeza", datos.get("edad_fija_cabeza")),
                ("Se sienta solo/a", datos.get("edad_sienta")),
                ("Camina sin apoyo", datos.get("edad_caminar")),
                ("Primeras palabras", datos.get("edad_palabras")),
                ("Primeras frases", datos.get("edad_frases")),
                ("Se viste solo/a", datos.get("edad_vestirse")),
                ("Control esfínter vesical (diurno/nocturno)", f"{_text(datos.get('esfinter_vesical_diurno'))} / {_text(datos.get('esfinter_vesical_nocturno'))}"),
                ("Control esfínter anal (diurno/nocturno)", f"{_text(datos.get('esfinter_anal_diurno'))} / {_text(datos.get('esfinter_anal_nocturno'))}"),
                ("Actividad motora", _choice_text("actividad_motora")),
                ("Tono muscular", _choice_text("tono_muscular")),
                ("Observaciones", datos.get("observaciones_sensoriomotriz")),
            ]
        )
    )

    for titulo, items in (
        ("Motricidad gruesa", ANAMNESIS_MOTRICIDAD_GRUESA),
        ("Motricidad fina", ANAMNESIS_MOTRICIDAD_FINA),
        ("Indicadores cognitivos", ANAMNESIS_COGNITIVOS),
    ):
        story.append(Paragraph(titulo, styles["AnaSubSection"]))
        table = _table_boolean([(label, datos.get(key)) for label, key in items])
        if table:
            story.append(table)
        else:
            story.append(Paragraph("Sin registros.", styles["AnaMuted"]))

    def _table_checklist(labels, prefix):
        rows = []
        for idx, label in enumerate(labels):
            key = f"{prefix}_{idx}"
            value = datos.get(key)
            if value in (None, ""):
                display = "—"
            else:
                display = _bool_text_display(value)
            rows.append([Paragraph(label, styles["AnaTableCell"]), Paragraph(display, styles["AnaTableCell"])])
        table = Table(rows, colWidths=[doc.width * 0.7, doc.width * 0.3], hAlign="LEFT")
        table.setStyle(
            TableStyle(
                [
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#eceff1")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        return table

    story.append(Paragraph("Visión", styles["AnaSubSection"]))
    story.append(_table_checklist(ANAMNESIS_VISION_ITEMS, "vision"))
    story.append(Paragraph("Audición", styles["AnaSubSection"]))
    story.append(_table_checklist(ANAMNESIS_AUDICION_ITEMS, "audicion"))
    story.append(Paragraph("Observaciones sensoriales", styles["AnaSubSection"]))
    story.append(Paragraph(_format_text(datos.get("observaciones_vision_audicion")), styles["AnaTableCell"]))

    story.append(Paragraph("Lenguaje", styles["AnaSubSection"]))
    story.append(
        _table_kv(
            [
                ("Modo de comunicación", _choice_text("modo_comunicacion")),
                ("Otro modo", datos.get("modo_comunicacion_otro")),
                ("Pérdida del lenguaje", _bool_text_display(datos.get("perdida_lenguaje"))),
                ("Detalle pérdida", datos.get("perdida_lenguaje_detalle")),
                ("Observaciones", datos.get("observaciones_lenguaje")),
            ]
        )
    )
    for titulo, items in (
        ("Lenguaje expresivo", ANAMNESIS_LENGUAJE_EXPRESIVO),
        ("Lenguaje comprensivo", ANAMNESIS_LENGUAJE_COMPRENSIVO),
    ):
        story.append(Paragraph(titulo, styles["AnaSubSection"]))
        tabla_lenguaje = _table_boolean([(label, datos.get(key)) for label, key in items])
        if tabla_lenguaje:
            story.append(tabla_lenguaje)
        else:
            story.append(Paragraph("Sin registros.", styles["AnaMuted"]))

    story.append(Paragraph("Estado actual de salud", styles["AnaSubSection"]))
    tabla_salud = _table_boolean([(label, datos.get(key)) for label, key in ANAMNESIS_SALUD_ACTUAL])
    if tabla_salud:
        story.append(tabla_salud)
    else:
        story.append(Paragraph("Sin registros.", styles["AnaMuted"]))
    story.append(
        _table_kv(
            [
                ("Otro antecedente", datos.get("salud_otro")),
                ("Control/tratamiento", datos.get("salud_control_tratamiento")),
            ]
        )
    )

    story.append(Paragraph("Alimentación, sueño y humor", styles["AnaSubSection"]))
    suenio_indicadores = [label for label, key in ANAMNESIS_SUENO_INDICADORES if _parse_bool(datos.get(key))]
    humor_items = [label for label, key in ANAMNESIS_HUMOR_ITEMS if _parse_bool(datos.get(key))]
    story.append(
        _table_kv(
            [
                ("Tipo de alimentación", _choice_text("alimentacion_tipo")),
                ("Detalle alimentación", datos.get("alimentacion_detalle")),
                ("Peso (apreciación)", _choice_text("peso_apreciacion")),
                ("Horas de sueño", datos.get("suenio_horas")),
                ("Calidad del sueño", _choice_text("suenio_calidad")),
                ("Duerme", _choice_text("suenio_duerme")),
                ("Detalle acompañamiento", datos.get("suenio_duerme_detalle")),
                ("Indicadores de sueño", ", ".join(suenio_indicadores) if suenio_indicadores else "Sin registro"),
                ("Humor habitual", ", ".join(humor_items) if humor_items else "Sin registro"),
                ("Otro humor", datos.get("humor_otro")),
                ("Observaciones", datos.get("observaciones_estado_salud")),
            ]
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("5. Antecedentes familiares", styles["AnaSection"]))
    convivientes = []
    for idx in range(5):
        nombre = datos.get(f"conviviente_{idx}_nombre")
        parentesco = datos.get(f"conviviente_{idx}_parentesco")
        edad = datos.get(f"conviviente_{idx}_edad")
        if any([nombre, parentesco, edad, datos.get(f"conviviente_{idx}_escolaridad"), datos.get(f"conviviente_{idx}_ocupacion")]):
            convivientes.append(
                [
                    _text(nombre),
                    _text(parentesco),
                    _text(edad),
                    _text(datos.get(f"conviviente_{idx}_escolaridad")),
                    _text(datos.get(f"conviviente_{idx}_ocupacion")),
                ]
            )
    if convivientes:
        tabla = Table(
            [["Nombre", "Parentesco", "Edad", "Escolaridad", "Ocupación"]] + convivientes,
            colWidths=[doc.width * 0.24, doc.width * 0.2, doc.width * 0.12, doc.width * 0.22, doc.width * 0.22],
            hAlign="LEFT",
        )
        tabla.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f8e9")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#33691e")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        story.append(tabla)
    else:
        story.append(Paragraph("No se registraron convivientes.", styles["AnaMuted"]))
    story.append(
        _table_kv(
            [
                ("Antecedentes de salud de la familia", datos.get("antecedentes_salud_familia")),
                ("Observaciones familiares", datos.get("observaciones_familia")),
            ]
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("6. Antecedentes escolares y apoyo", styles["AnaSection"]))
    story.append(
        _table_kv(
            [
                ("Edad de ingreso al sistema", datos.get("edad_ingreso_escolar")),
                ("Asistió a jardín infantil", _bool_text_display(datos.get("jardin_infantil"))),
                ("Número de colegios", datos.get("numero_colegios")),
                ("Modalidad de enseñanza", _choice_text("modalidad_ensenanza")),
                ("Motivo de cambios", datos.get("motivo_cambios")),
                ("Ha repetido cursos", _bool_text_display(datos.get("repite_cursos"))),
                ("Cursos repetidos", datos.get("repite_cursos_detalle")),
                ("Motivo repetición", datos.get("repite_cursos_motivo")),
                ("Nivel / curso actual", datos.get("nivel_curso_actual")),
                ("Apoyo familiar", datos.get("apoyo_familiar_detalle")),
                ("Observaciones actuales", datos.get("situacion_actual_observaciones")),
            ]
        )
    )

    story.append(Paragraph("Situación actual y hábitos escolares", styles["AnaSubSection"]))
    tabla_situacion = _table_boolean(
        [(label, datos.get(key)) for label, key in ANAMNESIS_SITUACION_ITEMS]
        + [(label, datos.get(key)) for label, key in ANAMNESIS_HABITOS_ITEMS]
    )
    if tabla_situacion:
        story.append(tabla_situacion)
    else:
        story.append(Paragraph("Sin registros.", styles["AnaMuted"]))

    respuesta_dificultades = [label for label, key in ANAMNESIS_RESPUESTA_DIFICULTADES if _parse_bool(datos.get(key))]
    refuerzos = [label for label, key in ANAMNESIS_REFUERZOS if _parse_bool(datos.get(key))]
    apoyos = [label for label, key in ANAMNESIS_APOYOS if _parse_bool(datos.get(key))]

    story.append(
        _table_kv(
            [
                ("Respuesta familiar ante dificultades", ", ".join(respuesta_dificultades) if respuesta_dificultades else "Sin registro"),
                ("Detalle otra respuesta", datos.get("respuesta_dificultades_otra_detalle")),
                ("Respuesta frente a éxitos", _choice_text("respuesta_exitos")),
                ("Detalle éxitos", datos.get("respuesta_exitos_otra_detalle")),
                ("Refuerzos o premios", ", ".join(refuerzos) if refuerzos else "Sin registro"),
                ("Otro refuerzo", datos.get("refuerzo_otro")),
                ("Quiénes apoyan", ", ".join(apoyos) if apoyos else "Sin registro"),
                ("Expectativas familiares", _choice_text("expectativas_familia")),
                ("Ambiente para el aprendizaje", _choice_text("ambiente_aprendizaje")),
                ("Comentarios finales", datos.get("observaciones_antecedentes_escolares")),
            ]
        )
    )

    def _header(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFillColor(colors.HexColor("#0b4f6c"))
        canvas_obj.rect(0, A4[1] - 28, A4[0], 28, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 12)
        canvas_obj.drawString(doc_obj.leftMargin, A4[1] - 12, "Entrevista familiar / Anamnesis")
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(A4[0] - doc_obj.rightMargin, A4[1] - 12, f"Emitido: {generado.strftime('%d/%m/%Y %H:%M')}")
        canvas_obj.restoreState()

    def _footer(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.HexColor("#546e7a"))
        canvas_obj.drawString(doc_obj.leftMargin, 15, "Documento confidencial - Decreto 170/2009")
        canvas_obj.drawRightString(A4[0] - doc_obj.rightMargin, 15, f"Página {canvas_obj.getPageNumber()}")
        canvas_obj.restoreState()

    def _decorate(canvas_obj, doc_obj):
        _header(canvas_obj, doc_obj)
        _footer(canvas_obj, doc_obj)

    doc.build(story, onFirstPage=_decorate, onLaterPages=_decorate)
    _write_pdf_to_disk(buffer, file_path)
    return os.path.join("anamnesis_pdfs", filename)


def generar_pdf_registro_pie(registro):
    folder_path = _ensure_folder("registros_pie")
    filename = f"registro_pie_{registro.id}.pdf"
    file_path = os.path.join(folder_path, filename)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=32 * mm,
        bottomMargin=22 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="PieTitle",
            parent=styles["Title"],
            alignment=1,
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="PieSubTitle",
            parent=styles["Normal"],
            alignment=1,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="PieSection",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0f6eb6"),
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="PieSubSection",
            parent=styles["Heading3"],
            fontSize=11,
            leading=13,
            textColor=colors.HexColor("#0b4f6c"),
            spaceBefore=6,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="PieTableCell",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="PieMuted",
            parent=styles["BodyText"],
            fontSize=8,
            textColor=colors.HexColor("#78909c"),
        )
    )

    curso = registro.curso
    establecimiento = getattr(curso, "establecimiento", None)
    responsable = registro.responsable

    def textify(value):
        if value is None:
            return "—"
        if isinstance(value, bool):
            return "Sí" if value else "No"
        if isinstance(value, (list, tuple, set)):
            items = [str(v).strip() for v in value if str(v).strip()]
            text_value = ", ".join(items) if items else "—"
            return escape(text_value)
        value_str = str(value).strip()
        return escape(value_str or "—")

    def clean_rows(rows, keys):
        cleaned = []
        for row in rows or []:
            if not isinstance(row, dict):
                continue
            if any(str(row.get(key, "")).strip() for key in keys):
                cleaned.append(row)
        return cleaned

    def build_table(data, col_widths=None, header=True):
        if not data:
            return None
        table = Table(data, colWidths=col_widths, repeatRows=1 if header else 0, hAlign="LEFT")
        table_style = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
        ]
        if header:
            table_style.extend(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e3f2fd")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0b4f6c")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ]
            )
        table.setStyle(TableStyle(table_style))
        return table

    story = []
    story.append(Paragraph("Registro PIE", styles["PieTitle"]))
    nombre_curso = curso.nombre if curso else "Curso sin nombre"
    story.append(Paragraph(f"Síntesis integral del curso {escape(nombre_curso)}", styles["PieSubTitle"]))
    story.append(Spacer(1, 10))

    info_rows = [
        [Paragraph("<b>Curso</b>", styles["PieTableCell"]), Paragraph(textify(nombre_curso), styles["PieTableCell"])],
        [Paragraph("<b>Establecimiento</b>", styles["PieTableCell"]), Paragraph(textify(establecimiento.nombre if establecimiento else None), styles["PieTableCell"])],
        [Paragraph("<b>Periodo</b>", styles["PieTableCell"]), Paragraph(textify(registro.periodo), styles["PieTableCell"])],
        [Paragraph("<b>Responsable</b>", styles["PieTableCell"]), Paragraph(textify(responsable.get_full_name() if responsable else None), styles["PieTableCell"])],
        [Paragraph("<b>Creado</b>", styles["PieTableCell"]), Paragraph(_format_date(registro.fecha_creacion), styles["PieTableCell"])],
        [Paragraph("<b>Última actualización</b>", styles["PieTableCell"]), Paragraph(_format_date(registro.actualizado_en), styles["PieTableCell"])],
        [Paragraph("<b>Observaciones generales</b>", styles["PieTableCell"]), Paragraph(textify(registro.observaciones_generales), styles["PieTableCell"])],
    ]
    story.append(build_table(info_rows, header=False))

    story.append(Paragraph("I. Equipo de aula", styles["PieSection"]))
    datos_equipo = registro.datos_equipo or {}
    equipo_sections = [
        ("Docentes de educación regular", datos_equipo.get("docentes"),
         [("nombre", "Nombre"), ("asignatura", "Asignatura"), ("telefono", "Teléfono"), ("correo", "Correo")]),
        ("Profesionales especializados", datos_equipo.get("especialistas"),
         [("nombre", "Nombre"), ("especialidad", "Especialidad"), ("telefono", "Teléfono"), ("correo", "Correo")]),
        ("Asistentes de la educación", datos_equipo.get("asistentes"),
         [("nombre", "Nombre"), ("especialidad", "Rol"), ("telefono", "Teléfono"), ("correo", "Correo")]),
        ("Coordinación del programa", datos_equipo.get("coordinacion"),
         [("label", "Ámbito"), ("nombre", "Nombre"), ("telefono", "Teléfono"), ("correo", "Correo")]),
    ]

    for title, rows, columns in equipo_sections:
        filtered = clean_rows(rows, [key for key, _ in columns])
        if not filtered:
            continue
        story.append(Paragraph(title, styles["PieSubSection"]))
        table_rows = [[Paragraph(label, styles["PieTableCell"]) for _, label in columns]]
        for row in filtered:
            table_rows.append([Paragraph(textify(row.get(key)), styles["PieTableCell"]) for key, _ in columns])
        story.append(build_table(table_rows))

    reuniones = datos_equipo.get("reuniones", {})
    for semestre, etiqueta in (("primer", "Primer semestre"), ("segundo", "Segundo semestre")):
        sem_data = reuniones.get(semestre) or {}
        calendario = sem_data.get("calendario") or {}
        calendario_rows = []
        for dia, meses in calendario.items():
            for mes, entry in (meses or {}).items():
                if not isinstance(entry, dict):
                    continue
                if entry.get("fecha") or entry.get("inicio") or entry.get("termino"):
                    calendario_rows.append(
                        [
                            Paragraph(str(dia), styles["PieTableCell"]),
                            Paragraph(str(mes), styles["PieTableCell"]),
                            Paragraph(textify(entry.get("fecha")), styles["PieTableCell"]),
                            Paragraph(textify(entry.get("inicio")), styles["PieTableCell"]),
                            Paragraph(textify(entry.get("termino")), styles["PieTableCell"]),
                        ]
                    )
        acuerdos = [row for row in sem_data.get("acuerdos") or [] if any((row or {}).values())]
        if calendario_rows or acuerdos:
            story.append(Paragraph(f"Reuniones {etiqueta}", styles["PieSubSection"]))
        if calendario_rows:
            header = ["Día", "Mes", "Fecha", "Inicio", "Término"]
            story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + calendario_rows))
        if acuerdos:
            header = ["Reunión", "Asistentes", "Acuerdos"]
            rows = [[Paragraph(textify(row.get("reunion")), styles["PieTableCell"]),
                     Paragraph(textify(row.get("asistentes")), styles["PieTableCell"]),
                     Paragraph(textify(row.get("acuerdos")), styles["PieTableCell"])] for row in acuerdos]
            story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    story.append(Paragraph("II. Planificación y apoyos", styles["PieSection"]))
    datos_plan = registro.datos_planificacion or {}

    panorama = datos_plan.get("panorama") or {}
    if any(panorama.values()):
        story.append(Paragraph("Panorama del curso", styles["PieSubSection"]))
        pano_rows = [[Paragraph("<b>Estilos de aprendizaje</b>", styles["PieTableCell"]), Paragraph(textify(panorama.get("estilos")), styles["PieTableCell"])],
                     [Paragraph("<b>Fortalezas</b>", styles["PieTableCell"]), Paragraph(textify(panorama.get("fortalezas")), styles["PieTableCell"])],
                     [Paragraph("<b>Necesidades</b>", styles["PieTableCell"]), Paragraph(textify(panorama.get("necesidades")), styles["PieTableCell"])]]
        story.append(build_table(pano_rows, header=False))

    estrategias = clean_rows(datos_plan.get("estrategias"), ["estrategia", "ambito", "periodo", "criterios"])
    if estrategias:
        story.append(Paragraph("Estrategias pedagógicas", styles["PieSubSection"]))
        header = ["Estrategia", "Ámbito", "Periodo", "Criterios"]
        rows = [
            [
                Paragraph(textify(item.get("estrategia")), styles["PieTableCell"]),
                Paragraph(textify(item.get("ambito")), styles["PieTableCell"]),
                Paragraph(textify(item.get("periodo")), styles["PieTableCell"]),
                Paragraph(textify(item.get("criterios")), styles["PieTableCell"]),
            ]
            for item in estrategias
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    colaboraciones = datos_plan.get("colaboraciones") or {}
    if any(colaboraciones.values()):
        story.append(Paragraph("Colaboraciones", styles["PieSubSection"]))
        col_rows = []
        for key, label in [
            ("entreProfesores", "Entre profesores"),
            ("coensenanza", "Co-enseñanza"),
            ("profesoresAsistentes", "Profesores asistentes"),
            ("entreEstudiantes", "Entre estudiantes"),
            ("conFamilia", "Con la familia"),
            ("conComunidad", "Con la comunidad"),
            ("observaciones", "Observaciones"),
        ]:
            col_rows.append([
                Paragraph(f"<b>{label}</b>", styles["PieTableCell"]),
                Paragraph(textify(colaboraciones.get(key)), styles["PieTableCell"]),
            ])
        story.append(build_table(col_rows, header=False))

    apoyos = clean_rows(datos_plan.get("apoyos"), ["ambito", "horasRegular", "horasFuera", "tiposApoyo"])
    if apoyos:
        story.append(Paragraph("Apoyos planificados", styles["PieSubSection"]))
        header = ["Ámbito", "Horas aula regular", "Horas fuera del aula", "Tipo de apoyo"]
        rows = [
            [
                Paragraph(textify(item.get("ambito")), styles["PieTableCell"]),
                Paragraph(textify(item.get("horasRegular")), styles["PieTableCell"]),
                Paragraph(textify(item.get("horasFuera")), styles["PieTableCell"]),
                Paragraph(textify(item.get("tiposApoyo")), styles["PieTableCell"]),
            ]
            for item in apoyos
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    diversidad = datos_plan.get("diversidad") or {}
    criterios = clean_rows(diversidad.get("criterios"), ["selecciones", "estrategias", "como", "quienes"])
    if criterios:
        story.append(Paragraph("Estrategias para la diversidad", styles["PieSubSection"]))
        header = ["Criterio", "Selecciones", "Estrategias", "Cómo", "Quiénes"]
        rows = []
        for item in criterios:
            rows.append(
                [
                    Paragraph(textify(item.get("titulo") or item.get("key")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("selecciones")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("estrategias")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("como")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("quienes")), styles["PieTableCell"]),
                ]
            )
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))
    ajustes = diversidad.get("ajustes") or {}
    if any(ajustes.values()):
        story.append(Paragraph("Ajustes de evaluación", styles["PieSubSection"]))
        rows = [
            [Paragraph("<b>Selecciones</b>", styles["PieTableCell"]), Paragraph(textify(ajustes.get("selecciones")), styles["PieTableCell"])],
            [Paragraph("<b>Cómo</b>", styles["PieTableCell"]), Paragraph(textify(ajustes.get("como")), styles["PieTableCell"])],
            [Paragraph("<b>Quiénes</b>", styles["PieTableCell"]), Paragraph(textify(ajustes.get("quienes")), styles["PieTableCell"])],
        ]
        story.append(build_table(rows, header=False))

    adecuaciones = clean_rows(datos_plan.get("adecuaciones"), ["tipo", "ambito", "estrategias", "estudiantes"])
    if adecuaciones:
        story.append(Paragraph("Adecuaciones curriculares", styles["PieSubSection"]))
        header = ["Tipo", "Ámbito", "Estrategias", "Estudiantes"]
        rows = [
            [
                Paragraph(textify(item.get("tipo")), styles["PieTableCell"]),
                Paragraph(textify(item.get("ambito")), styles["PieTableCell"]),
                Paragraph(textify(item.get("estrategias")), styles["PieTableCell"]),
                Paragraph(textify(item.get("estudiantes")), styles["PieTableCell"]),
            ]
            for item in adecuaciones
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    evaluaciones_div = clean_rows(datos_plan.get("evaluacionesDiversidad"), ["titulo", "estrategias"])
    if evaluaciones_div:
        story.append(Paragraph("Evaluaciones asociadas", styles["PieSubSection"]))
        header = ["Instancia", "Descripción"]
        rows = [
            [Paragraph(textify(item.get("titulo")), styles["PieTableCell"]), Paragraph(textify(item.get("estrategias")), styles["PieTableCell"])]
            for item in evaluaciones_div
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    plan_apoyo = clean_rows(datos_plan.get("planApoyo"), ["estudiante", "apoyosSeleccionados", "horarioDia", "horarioHora"])
    if plan_apoyo:
        story.append(Paragraph("Plan individual de apoyo", styles["PieSubSection"]))
        header = ["Estudiante", "Apoyos", "Horario", "Fechas", "Observaciones"]
        rows = []
        for item in plan_apoyo:
            horario = f"{textify(item.get('horarioDia'))} {textify(item.get('horarioHora'))}".strip()
            fechas = f"{textify(item.get('fechaInicio'))} - {textify(item.get('fechaTermino'))}".strip(" -")
            rows.append(
                [
                    Paragraph(textify(item.get("estudiante")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("apoyosSeleccionados")) or textify(item.get("otroApoyo")), styles["PieTableCell"]),
                    Paragraph(horario or "—", styles["PieTableCell"]),
                    Paragraph(fechas or "—", styles["PieTableCell"]),
                    Paragraph(textify(item.get("observaciones")), styles["PieTableCell"]),
                ]
            )
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    familia = datos_plan.get("familiaComunidad") or {}
    filas_fc = clean_rows(familia.get("filas"), ["titulo", "descripcion", "seguimiento", "evaluacion"])
    if filas_fc:
        story.append(Paragraph("Trabajo con familia y comunidad", styles["PieSubSection"]))
        header = ["Ámbito", "Descripción", "Seguimiento", "Evaluación"]
        rows = [
            [
                Paragraph(textify(item.get("titulo")), styles["PieTableCell"]),
                Paragraph(textify(item.get("descripcion")), styles["PieTableCell"]),
                Paragraph(textify(item.get("seguimiento")), styles["PieTableCell"]),
                Paragraph(textify(item.get("evaluacion")), styles["PieTableCell"]),
            ]
            for item in filas_fc
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))
    if familia.get("observaciones"):
        story.append(Paragraph(f"Observaciones: {escape(textify(familia.get('observaciones')))}", styles["PieMuted"]))

    story.append(PageBreak())
    story.append(Paragraph("III. Registro de implementación", styles["PieSection"]))
    datos_impl = registro.datos_implementacion or {}
    for periodo in datos_impl.get("periodos") or []:
        titulo = periodo.get("titulo") or "Periodo"
        filas = clean_rows(periodo.get("filas"), ["acciones", "evaluacion"])
        if not filas:
            continue
        story.append(Paragraph(titulo, styles["PieSubSection"]))
        header = ["Acciones", "Evaluación"]
        rows = [
            [
                Paragraph(textify(item.get("acciones")), styles["PieTableCell"]),
                Paragraph(textify(item.get("evaluacion")), styles["PieTableCell"]),
            ]
            for item in filas
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    acciones_docente = clean_rows((datos_impl.get("accionesDocente") or {}).get("filas"), ["fecha", "actividades", "docente"])
    if acciones_docente:
        story.append(Paragraph("Acciones del docente", styles["PieSubSection"]))
        header = ["Fecha", "Horas", "Actividades", "Docente"]
        rows = [
            [
                Paragraph(textify(item.get("fecha")), styles["PieTableCell"]),
                Paragraph(textify(item.get("horas")), styles["PieTableCell"]),
                Paragraph(textify(item.get("actividades")), styles["PieTableCell"]),
                Paragraph(textify(item.get("docente")), styles["PieTableCell"]),
            ]
            for item in acciones_docente
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))
        observ = (datos_impl.get("accionesDocente") or {}).get("observaciones")
        if observ:
            story.append(Paragraph(f"Observaciones: {escape(textify(observ))}", styles["PieMuted"]))

    registro_apoyos = datos_impl.get("registroApoyos") or {}
    filas_apoyo = clean_rows(registro_apoyos.get("filas"), ["fecha", "actividades", "profesional"])
    if filas_apoyo:
        story.append(Paragraph("Registro de apoyos", styles["PieSubSection"]))
        header = ["Fecha", "Horas", "Lugar", "Actividades", "Profesional"]
        rows = [
            [
                Paragraph(textify(item.get("fecha")), styles["PieTableCell"]),
                Paragraph(textify(item.get("horas")), styles["PieTableCell"]),
                Paragraph(textify(item.get("lugar")), styles["PieTableCell"]),
                Paragraph(textify(item.get("actividades")), styles["PieTableCell"]),
                Paragraph(textify(item.get("profesional")), styles["PieTableCell"]),
            ]
            for item in filas_apoyo
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))
        estudiantes = registro_apoyos.get("estudiantes") or []
        if any(str(est).strip() for est in estudiantes):
            story.append(Paragraph(f"Estudiantes focalizados: {escape(textify(estudiantes))}", styles["PieMuted"]))
        if registro_apoyos.get("objetivos"):
            story.append(Paragraph(f"Objetivos: {escape(textify(registro_apoyos.get('objetivos')))}", styles["PieMuted"]))

    logros = clean_rows((datos_impl.get("logrosAprendizaje") or {}).get("filas"), ["estudiante", "logros", "comentarios"])
    if logros:
        story.append(Paragraph("Logros de aprendizaje", styles["PieSubSection"]))
        header = ["Estudiante", "Logros", "Comentarios"]
        rows = [
            [
                Paragraph(textify(item.get("estudiante")), styles["PieTableCell"]),
                Paragraph(textify(item.get("logros")), styles["PieTableCell"]),
                Paragraph(textify(item.get("comentarios")), styles["PieTableCell"]),
            ]
            for item in logros
        ]
        story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + rows))

    story.append(Paragraph("IV. Actividades con familias y comunidad", styles["PieSection"]))
    datos_act = registro.datos_actividades or {}
    for clave, titulo in (("familia", "Trabajo con familias"), ("comunidad", "Trabajo con comunidad")):
        bloque = datos_act.get(clave) or {}
        if not any(bloque.values()):
            continue
        story.append(Paragraph(titulo, styles["PieSubSection"]))
        rows = [
            [Paragraph("<b>Fecha</b>", styles["PieTableCell"]), Paragraph(textify(bloque.get("fecha")), styles["PieTableCell"])],
            [Paragraph("<b>Objetivo</b>", styles["PieTableCell"]), Paragraph(textify(bloque.get("objetivo")), styles["PieTableCell"])],
            [Paragraph("<b>Actividad</b>", styles["PieTableCell"]), Paragraph(textify(bloque.get("actividad")), styles["PieTableCell"])],
            [Paragraph("<b>Acuerdos</b>", styles["PieTableCell"]), Paragraph(textify(bloque.get("acuerdos")), styles["PieTableCell"])],
            [Paragraph("<b>Resultados</b>", styles["PieTableCell"]), Paragraph(textify(bloque.get("resultados")), styles["PieTableCell"])],
        ]
        story.append(build_table(rows, header=False))
        participantes = clean_rows(bloque.get("participantes"), ["nombre", "identificacion", "contacto", "firma"])
        if participantes:
            header = ["Nombre", "Identificación", "Contacto", "Firma"]
            part_rows = [
                [
                    Paragraph(textify(item.get("nombre")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("identificacion")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("contacto")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("firma")), styles["PieTableCell"]),
                ]
                for item in participantes
            ]
            story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + part_rows))

    story.append(Paragraph("V. Acta de reuniones PIE", styles["PieSection"]))
    datos_acta = registro.datos_acta or {}
    if datos_acta:
        rows = [
            [Paragraph("<b>Fecha</b>", styles["PieTableCell"]), Paragraph(textify(datos_acta.get("fecha")), styles["PieTableCell"])],
            [Paragraph("<b>Motivo</b>", styles["PieTableCell"]), Paragraph(textify(datos_acta.get("motivo")), styles["PieTableCell"])],
            [Paragraph("<b>Acuerdos</b>", styles["PieTableCell"]), Paragraph(textify(datos_acta.get("acuerdos")), styles["PieTableCell"])],
            [Paragraph("<b>Compromisos</b>", styles["PieTableCell"]), Paragraph(textify(datos_acta.get("compromisos")), styles["PieTableCell"])],
        ]
        story.append(build_table(rows, header=False))
        participantes = clean_rows(datos_acta.get("participantes"), ["nombre", "rol", "rut", "telefono", "firma"])
        if participantes:
            header = ["Nombre", "Rol", "RUN", "Teléfono", "Firma"]
            part_rows = [
                [
                    Paragraph(textify(item.get("nombre")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("rol")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("rut")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("telefono")), styles["PieTableCell"]),
                    Paragraph(textify(item.get("firma")), styles["PieTableCell"]),
                ]
                for item in participantes
            ]
            story.append(build_table([[Paragraph(h, styles["PieTableCell"]) for h in header]] + part_rows))

    doc.build(story)
    _write_pdf_to_disk(buffer, file_path)
    return os.path.join("registros_pie", filename)


def generar_pdf_informe_familia(informe):
    folder_path = _ensure_folder("informes_familia")
    filename = f"informe_familia_{informe.id}.pdf"
    file_path = os.path.join(folder_path, filename)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=32 * mm,
        bottomMargin=22 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="InfTitle",
            parent=styles["Title"],
            alignment=1,
            fontSize=17,
            leading=21,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="InfSubTitle",
            parent=styles["Normal"],
            alignment=1,
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#546e7a"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="InfSection",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0f6eb6"),
            spaceBefore=10,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="InfMuted",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#607d8b"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="InfLabel",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )

    story = []

    estudiante = getattr(informe, "Estudiante", None)
    curso = getattr(estudiante, "curso", None)
    establecimiento = getattr(estudiante, "establecimiento", None) or getattr(curso, "establecimiento", None)
    profesional = next(iter(informe.entrega.all()), None)
    receptor = next(iter(informe.receptores.all()), None)
    instrumentos = list(informe.instrumentos.all().order_by("-fecha_aplicacion"))
    ambitos = { (ambito.ambito or "").lower(): ambito for ambito in informe.ambitos.all() }
    seguimientos = list(informe.seguimientos.all().order_by("fecha_seguimiento"))

    def textify(value):
        if value is None:
            return "—"
        if isinstance(value, bool):
            return "Sí" if value else "No"
        if isinstance(value, (list, tuple, set)):
            items = [str(v).strip() for v in value if str(v).strip()]
            return escape(", ".join(items) if items else "—")
        value_str = str(value).strip()
        return escape(value_str or "—")

    def edad_text():
        if estudiante and getattr(estudiante, "fecha_nacimiento", None):
            fecha_base = informe.fecha_entrega or timezone.localdate()
            if isinstance(fecha_base, datetime):
                fecha_base = fecha_base.date()
            delta = fecha_base - estudiante.fecha_nacimiento
            if delta.days > 30:
                anos = delta.days // 365
                return f"{anos} años" if anos else "Menos de un año"
        return "—"

    story.append(Paragraph("Evaluación Diagnóstica Integral de Ingreso a Modalidad de Educación Especial", styles["InfSubTitle"]))
    story.append(Paragraph("Informe para la familia", styles["InfTitle"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Fecha de entrega: {_format_date(informe.fecha_entrega)}", styles["InfMuted"]))
    story.append(Paragraph(f"Motivo de la evaluación: {textify(informe.motivo)}", styles["InfMuted"]))
    story.append(Spacer(1, 10))

    two_col_style = TableStyle(
        [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]
    )

    info_rows = [
        [Paragraph("Nombre del/la estudiante", styles["InfLabel"]), Paragraph(textify(getattr(estudiante, "nombres_apellidos", None)), styles["InfMuted"])],
        [Paragraph("RUT / IPE", styles["InfLabel"]), Paragraph(textify(getattr(estudiante, "run", None)), styles["InfMuted"])],
        [Paragraph("Nombre social", styles["InfLabel"]), Paragraph(textify(getattr(estudiante, "nombre_social", None)), styles["InfMuted"])],
        [Paragraph("Fecha de nacimiento", styles["InfLabel"]), Paragraph(_format_date(getattr(estudiante, "fecha_nacimiento", None)), styles["InfMuted"])],
        [Paragraph("Edad", styles["InfLabel"]), Paragraph(edad_text(), styles["InfMuted"])],
        [Paragraph("Curso / Nivel", styles["InfLabel"]), Paragraph(textify(getattr(curso, "nombre", None)), styles["InfMuted"])],
        [Paragraph("Establecimiento", styles["InfLabel"]), Paragraph(textify(getattr(establecimiento, "nombre", None)), styles["InfMuted"])],
    ]
    info_table = Table(info_rows, colWidths=[doc.width * 0.35, doc.width * 0.65])
    info_table.setStyle(two_col_style)
    story.append(info_table)

    story.append(Paragraph("Identificación del/la profesional", styles["InfSection"]))
    profesional_rows = [
        ("Nombre", textify(getattr(profesional, "nombre_identidad", None))),
        ("Nombre social", textify(getattr(profesional, "nombre_social", None))),
        ("RUT", textify(getattr(profesional, "rut", None))),
        ("Rol / cargo", textify(getattr(profesional, "rol_cargo", None))),
        ("Teléfono", textify(getattr(profesional, "telefono", None))),
        ("Email", textify(getattr(profesional, "email", None))),
    ]
    prof_table = Table(
        [[Paragraph(label, styles["InfLabel"]), Paragraph(value, styles["InfMuted"])] for label, value in profesional_rows],
        colWidths=[doc.width * 0.35, doc.width * 0.65],
    )
    prof_table.setStyle(two_col_style)
    story.append(prof_table)

    story.append(Paragraph("Persona que recibe la información", styles["InfSection"]))
    receptor_rows = [
        ("Nombre", textify(getattr(receptor, "nombre_identidad", None))),
        ("Nombre social", textify(getattr(receptor, "nombre_social", None))),
        ("RUT / Pasaporte", textify(getattr(receptor, "rut_pasaporte", None))),
        ("Teléfono", textify(getattr(receptor, "telefono", None))),
        ("Email", textify(getattr(receptor, "email", None))),
        ("Relación", textify(getattr(receptor, "relacion", None))),
        ("Apoderado titular", textify(getattr(receptor, "es_apoderado_titular", None))),
        ("Apoderado suplente", textify(getattr(receptor, "es_apoderado_suplente", None))),
        ("Presenta poder simple", textify(getattr(receptor, "poder_simple", None))),
        ("En presencia de", textify(getattr(receptor, "en_presencia_de", None))),
    ]
    rec_table = Table(
        [[Paragraph(label, styles["InfLabel"]), Paragraph(value, styles["InfMuted"])] for label, value in receptor_rows],
        colWidths=[doc.width * 0.35, doc.width * 0.65],
    )
    rec_table.setStyle(two_col_style)
    story.append(rec_table)

    story.append(Paragraph("Resultados e instrumentos", styles["InfSection"]))
    instr_rows = [[Paragraph("Instrumento", styles["InfLabel"]), Paragraph("Fecha", styles["InfLabel"])]]
    if instrumentos:
        for instrumento in instrumentos:
            instr_rows.append([
                Paragraph(textify(instrumento.nombre), styles["InfMuted"]),
                Paragraph(_format_date(instrumento.fecha_aplicacion), styles["InfMuted"]),
            ])
    else:
        instr_rows.append([Paragraph("Sin registros", styles["InfMuted"]), Paragraph("—", styles["InfMuted"])])
    instr_table = Table(instr_rows, colWidths=[doc.width * 0.65, doc.width * 0.35])
    instr_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5f5f5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
            ]
        )
    )
    story.append(instr_table)

    story.append(Paragraph("Diagnóstico asociado a NEE", styles["InfSection"]))
    story.append(Paragraph(_format_text(informe.diagnostico_nee), styles["InfMuted"]))

    story.append(Paragraph("Fortalezas y necesidades por ámbito", styles["InfSection"]))
    ambito_rows = []
    ambito_style_cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#e0e0e0")),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]
    row_index = 0
    for key, label in (("pedagógico", "Ámbito pedagógico"), ("social/afectivo", "Ámbito social/afectivo")):
        data = ambitos.get(key, None)
        fortalezas = _format_text(getattr(data, "fortalezas", None))
        necesidades = _format_text(getattr(data, "necesidades_apoyo", None))
        ambito_rows.append([
            Paragraph(label.upper(), styles["InfLabel"]),
            Paragraph("Fortalezas – Logros – Talentos", styles["InfLabel"]),
            Paragraph("Necesidades de apoyo", styles["InfLabel"]),
        ])
        ambito_rows.append([
            "",
            Paragraph(fortalezas, styles["InfMuted"]),
            Paragraph(necesidades, styles["InfMuted"]),
        ])
        ambito_style_cmds.append(("SPAN", (0, row_index), (0, row_index + 1)))
        row_index += 2
    ambito_table = Table(ambito_rows, colWidths=[doc.width * 0.2, doc.width * 0.4, doc.width * 0.4])
    ambito_table.setStyle(TableStyle(ambito_style_cmds))
    story.append(ambito_table)

    story.append(Paragraph("Trabajo colaborativo y apoyos educativos", styles["InfSection"]))
    story.append(Paragraph(_format_text(informe.trabajo_colaborativo), styles["InfMuted"]))

    story.append(Paragraph("Apoyos requeridos en el hogar", styles["InfSection"]))
    story.append(Paragraph(_format_text(informe.apoyos_requeridos_hogar), styles["InfMuted"]))

    story.append(Paragraph("Acuerdos y compromisos de la escuela y la familia", styles["InfSection"]))
    story.append(Paragraph(_format_text(informe.acuerdos_compromisos), styles["InfMuted"]))

    story.append(Paragraph("Fechas para evaluar avances y logros", styles["InfSection"]))
    fechas = [Paragraph(_format_date(seg.fecha_seguimiento), styles["InfMuted"]) for seg in seguimientos[:6]]
    while len(fechas) < 6:
        fechas.append(Paragraph("—", styles["InfMuted"]))
    fechas_table = Table([fechas], colWidths=[doc.width / 6] * 6)
    fechas_table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#b0bec5")),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cfd8dc")),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]
        )
    )
    story.append(fechas_table)

    story.append(Spacer(1, 10))

    firmas_table = Table(
        [
            ["", ""],
            [
                Paragraph(
                    "Firma y timbre responsable del equipo de gestión del establecimiento",
                    styles["InfLabel"],
                ),
                Paragraph(
                    "Firma familiar o representante del o la estudiante",
                    styles["InfLabel"],
                ),
            ],
        ],
        colWidths=[doc.width / 2 - 8, doc.width / 2 - 8],
    )
    firmas_table.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (0, 0), 0.8, colors.HexColor("#263238")),
                ("LINEABOVE", (1, 0), (1, 0), 0.8, colors.HexColor("#263238")),
                ("ALIGN", (0, 1), (-1, 1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    story.append(firmas_table)
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Las firmas y timbres se registrarán al momento de imprimir y oficializar el documento.",
            styles["InfMuted"],
        )
    )

    generado = timezone.localtime()

    def _header(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFillColor(colors.HexColor("#0b4f6c"))
        canvas_obj.rect(0, A4[1] - 28, A4[0], 28, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 11)
        canvas_obj.drawString(doc_obj.leftMargin, A4[1] - 12, "Informe para la familia")
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(A4[0] - doc_obj.rightMargin, A4[1] - 12, f"Emitido {generado.strftime('%d/%m/%Y %H:%M')}")
        canvas_obj.restoreState()

    def _footer(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.HexColor("#607d8b"))
        canvas_obj.drawString(doc_obj.leftMargin, 15, "Documento confidencial – Decreto 170/2009")
        canvas_obj.drawRightString(A4[0] - doc_obj.rightMargin, 15, f"Página {canvas_obj.getPageNumber()}")
        canvas_obj.restoreState()

    def _decorate(canvas_obj, doc_obj):
        _header(canvas_obj, doc_obj)
        _footer(canvas_obj, doc_obj)

    doc.build(story, onFirstPage=_decorate, onLaterPages=_decorate)
    _write_pdf_to_disk(buffer, file_path)
    return os.path.join("informes_familia", filename)


def _format_text(value):
    if not value:
        return "—"
    return "<br/>".join(escape(value).splitlines())


def _bool_text(value):
    if value is None:
        return "—"
    return "Sí" if bool(value) else "No"


def _format_date(value):
    if not value:
        return "—"
    if isinstance(value, datetime):
        value = timezone.localtime(value).date()
    return value.strftime("%d/%m/%Y")


def _ensure_folder(path_segment):
    folder_path = os.path.join(settings.MEDIA_ROOT, path_segment)
    os.makedirs(folder_path, exist_ok=True)
    return folder_path


def _write_pdf_to_disk(buffer, path):
    with open(path, "wb") as handler:
        handler.write(buffer.getvalue())
    buffer.close()


def generar_pdf_antecedente_salud(antecedente):
    if not antecedente:
        return None

    folder_path = _ensure_folder("antecedentes_salud")
    filename = f"evaluacion_salud_{antecedente.id}.pdf"
    file_path = os.path.join(folder_path, filename)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=30 * mm,
        bottomMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="SaludTitle",
            parent=styles["Title"],
            alignment=1,
            textColor=colors.HexColor("#0b4f6c"),
            fontSize=18,
            leading=22,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionHeader",
            parent=styles["Heading3"],
            textColor=colors.HexColor("#0f6eb6"),
            fontSize=11,
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SmallText",
            parent=styles["BodyText"],
            fontSize=9,
            leading=12,
        )
    )

    estudiante = None
    curso = None
    establecimiento = None
    if antecedente.anamnesis and antecedente.anamnesis.estudiante:
        estudiante = antecedente.anamnesis.estudiante
        curso = getattr(estudiante, "curso", None)
        establecimiento = getattr(estudiante, "establecimiento", None) or getattr(curso, "establecimiento", None)

    profesional_nombre = None
    if antecedente.profesional:
        full_name = antecedente.profesional.get_full_name().strip()
        profesional_nombre = full_name or antecedente.profesional.username

    def _fmt_value(value, suffix=""):
        if value in (None, ""):
            return "—"
        if suffix:
            return f"{value} {suffix}".strip()
        return str(value)

    story = []
    story.append(Paragraph("Formulario de Evaluación de Salud", styles["SaludTitle"]))
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            f"Generado el {_format_date(timezone.localtime(timezone.now()))}",
            styles["SmallText"],
        )
    )
    story.append(Spacer(1, 6))

    datos_estudiante = [
        ("Estudiante", _format_text(getattr(estudiante, "nombres_apellidos", None))),
        ("RUN", _format_text(getattr(estudiante, "run", None))),
        ("Curso", _format_text(getattr(curso, "nombre", None))),
        ("Establecimiento", _format_text(getattr(establecimiento, "nombre", None))),
    ]
    base_table_style = TableStyle(
        [
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#e3eef6")),
            ("BOX", (0, 0), (-1, -1), 0.25, colors.gray),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ]
    )

    info_table = Table(
        [[Paragraph(label, styles["SmallText"]), Paragraph(valor, styles["SmallText"])] for label, valor in datos_estudiante],
        colWidths=[45 * mm, 110 * mm],
        hAlign="LEFT",
    )
    info_table.setStyle(base_table_style)
    story.append(info_table)

    story.append(Paragraph("Identificación del profesional", styles["SectionHeader"]))
    profesional_table = Table(
        [
            ("Profesional", _format_text(profesional_nombre)),
            ("RUT", _format_text(antecedente.rut_profesional)),
            ("Cargo", _format_text(antecedente.cargo_profesional)),
            ("Especialidad", _format_text(antecedente.especialidad)),
            ("Procedencia", _format_text(antecedente.procedencia)),
            ("Contacto", _format_text(antecedente.contacto)),
        ],
        colWidths=[45 * mm, 110 * mm],
        hAlign="LEFT",
    )
    profesional_table.setStyle(base_table_style)
    story.append(profesional_table)

    story.append(Paragraph("Datos clínicos", styles["SectionHeader"]))
    datos_clinicos = [
        ("Motivo de consulta", _format_text(antecedente.motivo_consulta)),
        ("Fecha evaluación", _format_text(_format_date(antecedente.fecha_evaluacion))),
        ("Fecha reevaluación", _format_text(_format_date(antecedente.fecha_reevaluacion))),
        ("Diagnóstico previo", _format_text(antecedente.diagnostico_prev)),
        ("Tipo de parto", _format_text(antecedente.tipo_parto)),
        ("Asistencia parto", _bool_text(antecedente.asistencia_parto)),
        ("Peso", _fmt_value(antecedente.peso, "kg")),
        ("Talla", _fmt_value(antecedente.talla, "cm")),
        ("Hospitalizaciones", _bool_text(antecedente.hospitalizaciones)),
        ("Vacunas al día", _bool_text(antecedente.vacunas)),
        ("Antecedentes de embarazo", _format_text(antecedente.antecedentes_embarazo)),
    ]
    clinicos_table = Table(
        [[Paragraph(label, styles["SmallText"]), Paragraph(valor, styles["SmallText"])] for label, valor in datos_clinicos],
        colWidths=[55 * mm, 100 * mm],
    )
    clinicos_table.setStyle(base_table_style)
    story.append(clinicos_table)

    story.append(Paragraph("Estado y observaciones", styles["SectionHeader"]))
    story.append(Paragraph(_format_text(antecedente.estado_salud_general), styles["SmallText"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Descripción diagnóstica", styles["SectionHeader"]))
    story.append(Paragraph(_format_text(antecedente.descripcion_diagnostico), styles["SmallText"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Indicaciones", styles["SectionHeader"]))
    story.append(Paragraph(_format_text(antecedente.indicaciones), styles["SmallText"]))
    story.append(Spacer(1, 4))
    story.append(Paragraph("Observaciones", styles["SectionHeader"]))
    story.append(Paragraph(_format_text(antecedente.observaciones), styles["SmallText"]))

    doc.build(story)
    _write_pdf_to_disk(buffer, file_path)
    return os.path.join("antecedentes_salud", filename)


def generar_pdf_evaluacion_psicopedagogica(evaluacion):
    """Genera un informe detallado, con secciones firmables, para la evaluación psicopedagógica."""

    folder_path = _ensure_folder("evaluaciones_psico")
    filename = f"evaluacion_psico_{evaluacion.id}.pdf"
    file_path = os.path.join(folder_path, filename)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=34 * mm,
        bottomMargin=22 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            name="TitleCenter",
            parent=styles["Title"],
            alignment=1,
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubTitle",
            parent=styles["Normal"],
            alignment=1,
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )
    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontSize=12,
            leading=15,
            textColor=colors.HexColor("#0b4f6c"),
            spaceBefore=12,
            spaceAfter=6,
        )
    )
    styles.add(
        ParagraphStyle(
            name="SubSectionTitle",
            parent=styles["Heading3"],
            fontSize=11,
            leading=13,
            textColor=colors.HexColor("#0f6eb6"),
            spaceBefore=8,
            spaceAfter=4,
        )
    )
    styles.add(
        ParagraphStyle(
            name="NormalSmall",
            parent=styles["BodyText"],
            fontSize=10,
            leading=13,
        )
    )
    styles.add(
        ParagraphStyle(
            name="TableCell",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
        )
    )
    styles.add(
        ParagraphStyle(
            name="Signature",
            parent=styles["BodyText"],
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#0b4f6c"),
        )
    )

    estudiante = getattr(evaluacion, "estudiante", None)
    curso = getattr(estudiante, "curso", None) if estudiante else None
    establecimiento = None
    if estudiante and getattr(estudiante, "establecimiento", None):
        establecimiento = estudiante.establecimiento
    elif curso and getattr(curso, "establecimiento", None):
        establecimiento = curso.establecimiento
    apoderado = getattr(estudiante, "apoderado", None)

    evaluador_usuario = getattr(evaluacion, "evaluador_usuario", None)
    responsable_nombre = None
    responsable_cargo = None
    if evaluador_usuario:
        full_name = evaluador_usuario.get_full_name().strip()
        responsable_nombre = full_name or evaluador_usuario.username
        responsable_cargo = getattr(evaluador_usuario, "cargo", None) or evaluacion.rol_evaluador
    elif evaluacion.evaluador:
        responsable_nombre = evaluacion.evaluador
        responsable_cargo = evaluacion.rol_evaluador

    edad_partes = []
    if evaluacion.edad_anios is not None:
        edad_partes.append(f"{evaluacion.edad_anios} años")
    if evaluacion.edad_meses is not None:
        edad_partes.append(f"{evaluacion.edad_meses} meses")
    if not edad_partes and estudiante and getattr(estudiante, "fecha_nacimiento", None):
        hoy = timezone.localdate()
        delta = hoy - estudiante.fecha_nacimiento
        edad_anios = delta.days // 365
        edad_partes.append(f"{edad_anios} años aprox.")
    edad_text = " ".join(edad_partes) if edad_partes else "—"

    fecha_eval = evaluacion.fecha_evaluacion or evaluacion.fecha
    generado = timezone.localtime()

    observaciones_ambiente = list(evaluacion.observaciones_ambiente.all().order_by("item"))
    obs_grouped = {"academico": [], "social": []}
    for obs in observaciones_ambiente:
        categoria = OBSERVACION_CATEGORY_BY_ITEM.get(obs.item, "academico")
        obs_grouped.setdefault(categoria, []).append(obs)

    subdimension_sections = {}
    for item in evaluacion.items.select_related("area").all():
        area_id = item.area_id or 0
        area_nombre = item.area.nombre if item.area else "Área sin nombre"
        section = subdimension_sections.setdefault(
            area_id,
            {"nombre": area_nombre, "items": [], "id": area_id},
        )
        section["items"].append(item)

    comentarios_map = {
        comentario.area_id or 0: comentario
        for comentario in evaluacion.comentarios_subdimension.select_related("area").all()
    }

    subsectores = list(evaluacion.subsectores.all())
    estrategias = list(evaluacion.estrategias_apoyo.all())
    apoyos = list(evaluacion.apoyos_adicionales.all())

    width_available = doc.width

    def make_table(data, col_widths, header=True):
        table = Table(
            data,
            colWidths=col_widths,
            repeatRows=1 if header else 0,
            hAlign="LEFT",
        )
        base_style = [
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -1), 0.25, colors.HexColor("#dfe3e8")),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("RIGHTPADDING", (0, 0), (-1, -1), 4),
        ]
        if header:
            base_style.extend(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e3f2fd")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0b4f6c")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ]
            )
        table.setStyle(TableStyle(base_style))
        return table

    def add_signature_block(label, story_ref):
        responsable_display = responsable_nombre or "____________________________"
        rows = [
            [Paragraph(f"<b>{label}</b>", styles["Signature"])],
            [Paragraph(f"Profesional responsable: {responsable_display}", styles["Signature"])],
            [Paragraph("Firma: ____________________________    Fecha: ____/____/______", styles["Signature"])],
        ]
        table = Table(rows, colWidths=[width_available])
        table.setStyle(
            TableStyle(
                [
                    ("LINEABOVE", (0, 0), (-1, 0), 0.5, colors.HexColor("#b0bec5")),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        story_ref.append(table)
        story_ref.append(Spacer(1, 6))

    story = []
    story.append(Paragraph("Evaluación Psicopedagógica y Curricular", styles["TitleCenter"]))
    story.append(Paragraph("Informe integral del proceso", styles["SubTitle"]))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Antecedentes del estudiante", styles["SectionTitle"]))
    info_rows = [
        [Paragraph("<b>Estudiante</b>", styles["TableCell"]), Paragraph(estudiante.nombres_apellidos if estudiante else "—", styles["TableCell"])],
        [Paragraph("<b>RUN</b>", styles["TableCell"]), Paragraph(getattr(estudiante, "run", None) or "—", styles["TableCell"])],
        [Paragraph("<b>Curso</b>", styles["TableCell"]), Paragraph(curso.nombre if curso else "—", styles["TableCell"])],
        [Paragraph("<b>Establecimiento</b>", styles["TableCell"]), Paragraph(establecimiento.nombre if establecimiento else "—", styles["TableCell"])],
        [Paragraph("<b>Apoderado</b>", styles["TableCell"]), Paragraph(apoderado.nombres_apellidos if apoderado else "—", styles["TableCell"])],
        [Paragraph("<b>Contacto apoderado</b>", styles["TableCell"]), Paragraph((apoderado.telefono or apoderado.correo) if apoderado else "—", styles["TableCell"])],
        [Paragraph("<b>Edad</b>", styles["TableCell"]), Paragraph(edad_text, styles["TableCell"])],
        [Paragraph("<b>Fecha evaluación</b>", styles["TableCell"]), Paragraph(_format_date(fecha_eval), styles["TableCell"])],
        [Paragraph("<b>Profesional responsable</b>", styles["TableCell"]), Paragraph(responsable_nombre or "—", styles["TableCell"])],
        [Paragraph("<b>Cargo/rol</b>", styles["TableCell"]), Paragraph(responsable_cargo or "—", styles["TableCell"])],
    ]
    story.append(make_table(info_rows, [width_available * 0.35, width_available * 0.65], header=False))

    story.append(Paragraph("2. Perfil lingüístico y comunicacional", styles["SectionTitle"]))
    lengua_rows = [
        ["Lengua", "Grado", "Comprende", "Habla", "Lee", "Escribe"],
        [
            Paragraph("Lengua materna", styles["TableCell"]),
            Paragraph(evaluacion.lengua_materna_grado or "—", styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_materna_comprende), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_materna_habla), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_materna_lee), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_materna_escribe), styles["TableCell"]),
        ],
        [
            Paragraph("Lengua de uso", styles["TableCell"]),
            Paragraph(evaluacion.lengua_uso_grado or "—", styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_uso_comprende), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_uso_habla), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_uso_lee), styles["TableCell"]),
            Paragraph(_bool_text(evaluacion.lengua_uso_escribe), styles["TableCell"]),
        ],
    ]
    story.append(
        make_table(
            lengua_rows,
            [
                width_available * 0.18,
                width_available * 0.18,
                width_available * 0.16,
                width_available * 0.16,
                width_available * 0.16,
                width_available * 0.16,
            ],
        )
    )

    story.append(Paragraph("3. Observaciones generales del proceso", styles["SectionTitle"]))
    story.append(Paragraph(_format_text(evaluacion.observaciones), styles["NormalSmall"]))
    add_signature_block("Observaciones generales", story)

    story.append(Paragraph("4. Observación del ambiente escolar", styles["SectionTitle"]))
    for categoria in ("academico", "social"):
        label = OBSERVACION_CATEGORY_LABELS.get(categoria, categoria.title())
        story.append(Paragraph(label, styles["SubSectionTitle"]))
        registros = obs_grouped.get(categoria, [])
        if registros:
            data = [["N°", "Descripción", "Valor"]]
            for registro in registros:
                data.append(
                    [
                        Paragraph(str(registro.item), styles["TableCell"]),
                        Paragraph(registro.descripcion or "—", styles["TableCell"]),
                        Paragraph(
                            f"{registro.valor} – {VALOR_LABELS.get(registro.valor, 'Sin registro')}",
                            styles["TableCell"],
                        ),
                    ]
                )
            story.append(make_table(data, [width_available * 0.08, width_available * 0.62, width_available * 0.3]))
        else:
            story.append(Paragraph("No hay registros para esta categoría.", styles["NormalSmall"]))
        add_signature_block(label, story)

    story.append(PageBreak())
    story.append(Paragraph("5. Subdimensiones del desarrollo", styles["SectionTitle"]))
    if subdimension_sections:
        for _, section in sorted(subdimension_sections.items(), key=lambda pair: pair[1]["nombre"]):
            story.append(Paragraph(section["nombre"], styles["SubSectionTitle"]))
            table_data = [["N°", "Indicador", "Valor"]]
            for index, item in enumerate(sorted(section["items"], key=lambda obj: obj.descripcion or "")):
                table_data.append(
                    [
                        Paragraph(str(index + 1), styles["TableCell"]),
                        Paragraph(item.descripcion or "—", styles["TableCell"]),
                        Paragraph(
                            f"{item.valor if item.valor is not None else '—'} – {VALOR_LABELS.get(item.valor, 'Sin registro')}",
                            styles["TableCell"],
                        ),
                    ]
                )
            story.append(make_table(table_data, [width_available * 0.08, width_available * 0.62, width_available * 0.3]))
            comentario = comentarios_map.get(section["id"]) if section["items"] else None
            if comentario:
                story.append(Paragraph("Síntesis cualitativa", styles["SubSectionTitle"]))
                for etiqueta, valor in (
                    ("Fortalezas", comentario.fortaleza),
                    ("Debilidades", comentario.debilidad),
                    ("Síntesis", comentario.sintesis),
                    ("Observaciones", comentario.observaciones),
                ):
                    if valor:
                        story.append(Paragraph(f"<b>{etiqueta}:</b> {_format_text(valor)}", styles["NormalSmall"]))
            add_signature_block(section["nombre"], story)
            story.append(Spacer(1, 4))
    else:
        story.append(Paragraph("No se han registrado indicadores para las subdimensiones.", styles["NormalSmall"]))

    story.append(PageBreak())
    story.append(Paragraph("6. Estrategias y apoyos complementarios", styles["SectionTitle"]))

    story.append(Paragraph("Subsectores destacados y con dificultad", styles["SubSectionTitle"]))
    if subsectores:
        sub_rows = [["Subsector", "Clasificación"]]
        for sub in subsectores:
            sub_rows.append(
                [
                    Paragraph(sub.subsector or "—", styles["TableCell"]),
                    Paragraph("Destacado" if sub.tipo == "destacado" else "En dificultad", styles["TableCell"]),
                ]
            )
        story.append(make_table(sub_rows, [width_available * 0.65, width_available * 0.35]))
    else:
        story.append(Paragraph("Sin registros de subsectores.", styles["NormalSmall"]))
    add_signature_block("Subsectores", story)

    story.append(Paragraph("Estrategias de apoyo implementadas", styles["SubSectionTitle"]))
    if estrategias:
        est_rows = [["N°", "Descripción", "Aplicada", "Exitosa", "Detalle"]]
        for est in estrategias:
            est_rows.append(
                [
                    Paragraph(str(est.numero or "—"), styles["TableCell"]),
                    Paragraph(est.descripcion or "—", styles["TableCell"]),
                    Paragraph(_bool_text(est.aplicada), styles["TableCell"]),
                    Paragraph(_bool_text(est.exitosa), styles["TableCell"]),
                    Paragraph(est.detalle or "—", styles["TableCell"]),
                ]
            )
        story.append(
            make_table(
                est_rows,
                [
                    width_available * 0.08,
                    width_available * 0.42,
                    width_available * 0.12,
                    width_available * 0.12,
                    width_available * 0.26,
                ],
            )
        )
    else:
        story.append(Paragraph("No se registraron estrategias específicas.", styles["NormalSmall"]))
    add_signature_block("Estrategias de apoyo", story)

    story.append(Paragraph("Apoyos adicionales", styles["SubSectionTitle"]))
    if apoyos:
        apo_rows = [["Tipo", "Apoyo", "Recibido", "Detalle"]]
        for apoyo in apoyos:
            tipo = apoyo.tipo.capitalize() if apoyo.tipo else "—"
            apoyo_nombre = (apoyo.apoyo or "").replace("_", " ").title() or "—"
            apo_rows.append(
                [
                    Paragraph(tipo, styles["TableCell"]),
                    Paragraph(apoyo_nombre, styles["TableCell"]),
                    Paragraph(_bool_text(apoyo.recibido), styles["TableCell"]),
                    Paragraph(apoyo.descripcion_extra or "—", styles["TableCell"]),
                ]
            )
        story.append(make_table(apo_rows, [width_available * 0.18, width_available * 0.32, width_available * 0.15, width_available * 0.35]))
    else:
        story.append(Paragraph("No existen apoyos adicionales registrados.", styles["NormalSmall"]))
    add_signature_block("Apoyos complementarios", story)

    story.append(Paragraph("7. Firma y compromisos finales", styles["SectionTitle"]))
    add_signature_block("Cierre del informe", story)

    def header(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFillColor(colors.HexColor("#0b4f6c"))
        canvas_obj.rect(0, A4[1] - 30, A4[0], 30, fill=1, stroke=0)
        canvas_obj.setFillColor(colors.white)
        canvas_obj.setFont("Helvetica-Bold", 13)
        canvas_obj.drawString(doc_obj.leftMargin, A4[1] - 18, "Evaluación Psicopedagógica")
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(
            A4[0] - doc_obj.rightMargin,
            A4[1] - 18,
            f"Emitido: {generado.strftime('%d/%m/%Y %H:%M')}",
        )
        canvas_obj.restoreState()

    def footer(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.setFillColor(colors.HexColor("#666666"))
        canvas_obj.drawString(doc_obj.leftMargin, 15, "Documento confidencial - Programa de Integración Escolar")
        canvas_obj.drawRightString(
            A4[0] - doc_obj.rightMargin,
            15,
            f"Página {canvas_obj.getPageNumber()}",
        )
        canvas_obj.restoreState()

    def build_header_footer(canvas_obj, doc_obj):
        header(canvas_obj, doc_obj)
        footer(canvas_obj, doc_obj)

    doc.build(story, onFirstPage=header, onLaterPages=build_header_footer)

    _write_pdf_to_disk(buffer, file_path)
    return os.path.join("evaluaciones_psico", filename)
