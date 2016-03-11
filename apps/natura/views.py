from rest_framework import filters, mixins, viewsets

from natura.models import Site
from natura.serializers import SiteGeoSerializer, SiteSerializer


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    filter_backends = (filters.SearchFilter, filters.DjangoFilterBackend, )
    search_fields = ('sitename', 'sitecode', )
    filter_fields = ('country', )


class SiteGeoViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    queryset = Site.objects.all()
    serializer_class = SiteGeoSerializer
