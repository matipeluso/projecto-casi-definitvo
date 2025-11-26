from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_seed_especialidades_base"),
    ]

    operations = [
        migrations.AddField(
            model_name="registropie",
            name="actualizado_en",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="actualizado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="registros_pie_actualizados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="registropie",
            name="creado_por",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="registros_pie_creados",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="registropie",
            name="datos_acta",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="datos_actividades",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="datos_equipo",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="datos_implementacion",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="datos_planificacion",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="payload_version",
            field=models.CharField(blank=True, max_length=40, null=True),
        ),
        migrations.AddField(
            model_name="registropie",
            name="pdf_generado",
            field=models.FileField(blank=True, null=True, upload_to="registros_pie/"),
        ),
    ]
