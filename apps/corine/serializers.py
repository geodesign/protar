from rest_framework import serializers

from corine.models import CorineLayer, Nomenclature


class NomenclatureSerializer(serializers.ModelSerializer):

    code_1 = serializers.SerializerMethodField()
    code_2 = serializers.SerializerMethodField()
    code_3 = serializers.CharField(source='code')

    class Meta:
        model = Nomenclature
        exclude = ('code', )

    def get_code_1(self, obj):
        return obj.code[:1]

    def get_code_2(self, obj):
        return obj.code[:2]


class CorineLayerSerializer(serializers.ModelSerializer):

    name = serializers.CharField(source='rasterlayer.name')

    class Meta:
        model = CorineLayer
