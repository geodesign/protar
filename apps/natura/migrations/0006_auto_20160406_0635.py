# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-04-06 06:35
from __future__ import unicode_literals

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('natura', '0005_auto_20160330_1332'),
    ]

    operations = [
        migrations.AlterField(
            model_name='site',
            name='geom',
            field=django.contrib.gis.db.models.fields.MultiPolygonField(srid=3035),
        ),
    ]