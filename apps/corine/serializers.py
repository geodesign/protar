from rest_framework import serializers

from corine.models import CorineLayer, Nomenclature


class NomenclatureSerializer(serializers.ModelSerializer):

    class Meta:
        model = Nomenclature


class CorineLayerSerializer(serializers.ModelSerializer):

    name = serializers.CharField(source='rasterlayer.name')

    class Meta:
        model = CorineLayer
