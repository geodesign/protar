from rest_framework import viewsets

from corine.models import Nomenclature
from corine.serializers import NomenclatureSerializer


class NomenclatureViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Nomenclature.objects.all()
    serializer_class = NomenclatureSerializer
    pagination_class = None
