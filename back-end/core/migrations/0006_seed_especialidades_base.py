from django.db import migrations


def seed_especialidades(apps, schema_editor):
    Especialidad = apps.get_model("core", "Especialidad")

    especialidades = [
        ("Educador Diferencial", "Profesional especializado en atención de estudiantes con NEE."),
        ("Psicopedagogo", "Apoya los procesos de aprendizaje y evalúa necesidades educativas."),
        ("Psicólogo", "Profesional de apoyo socioemocional en PIE/NEE."),
        ("Fonoaudiólogo", "Intervención en lenguaje y comunicación."),
        ("Terapeuta Ocupacional", "Fortalece la autonomía y el desarrollo sensoriomotor."),
        ("Kinesiólogo", "Rehabilitación y apoyo motor."),
        ("Trabajador Social", "Vinculación con familia y redes de apoyo."),
        ("Orientador", "Articula apoyos entre escuela, familia y estudiantes."),
        ("Coordinador PIE", "Coordina el equipo PIE y los planes de apoyo."),
        ("Asistente de Aula", "Apoya la implementación de estrategias en aula."),
        ("Profesor Regular", "Docente jefe que trabaja junto al equipo PIE."),
    ]

    for nombre, descripcion in especialidades:
        Especialidad.objects.get_or_create(
            nombre=nombre,
            defaults={"descripcion": descripcion},
        )


def remove_seeded_especialidades(apps, schema_editor):
    Especialidad = apps.get_model("core", "Especialidad")
    nombres = [
        "Educador Diferencial",
        "Psicopedagogo",
        "Psicólogo",
        "Fonoaudiólogo",
        "Terapeuta Ocupacional",
        "Kinesiólogo",
        "Trabajador Social",
        "Orientador",
        "Coordinador PIE",
        "Asistente de Aula",
        "Profesor Regular",
    ]
    Especialidad.objects.filter(nombre__in=nombres).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0005_anamnesis_payload_fields"),
    ]

    operations = [
        migrations.RunPython(seed_especialidades, remove_seeded_especialidades),
    ]
