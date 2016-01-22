# -*- coding: utf-8 -*-
# Generated by Django 1.9.1 on 2016-01-22 14:30
from __future__ import unicode_literals

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('corine', '0001_initial'),
        ('natura', '0002_bioregion_contacts_designationstatus_directivespecies_habitatclass_habitats_impact_management_metada'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cover',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField()),
                ('change', models.BooleanField()),
                ('area', models.FloatField()),
                ('nomenclature', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='corine.Nomenclature')),
                ('nomenclature_previous', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, related_name='previous_covers', to='corine.Nomenclature')),
                ('site', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='natura.Site')),
            ],
        ),
    ]
