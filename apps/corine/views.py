from rest_framework import viewsets

from corine.models import CorineLayer, Nomenclature
from corine.serializers import CorineLayerSerializer, NomenclatureSerializer


class NomenclatureViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Nomenclature.objects.all()
    serializer_class = NomenclatureSerializer
    pagination_class = None


class CorineLayerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CorineLayer.objects.all()
    serializer_class = CorineLayerSerializer
    pagination_class = None
