# -*- coding: utf-8 -*-
# Generated by Django 1.9.3 on 2016-03-24 16:49
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('natura', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='site',
            name='centroid',
            field=django.contrib.gis.db.models.fields.PointField(null=True, srid=4326),
        ),
    ]
