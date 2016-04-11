from rest_framework import viewsets

from corine.models import CorineLayer, Nomenclature
from corine.serializers import CorineLayerSerializer, NomenclatureSerializer


class NomenclatureViewSet(viewsets.ReadOnlyModelViewSet):
    # Exclude nodata and unclassified categories
    queryset = Nomenclature.objects.exclude(code__in=['990', '995', '999']).order_by('code')
    serializer_class = NomenclatureSerializer
    pagination_class = None


class CorineLayerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CorineLayer.objects.all()
    serializer_class = CorineLayerSerializer
    pagination_class = None
