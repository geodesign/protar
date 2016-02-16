from rest_framework import serializers

from corine.models import Nomenclature


class NomenclatureSerializer(serializers.ModelSerializer):

    class Meta:
        model = Nomenclature
