from rest_framework import mixins, viewsets

from natura.models import Site
from natura.serializers import SiteGeoSerializer, SiteSerializer


class SiteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer


class SiteGeoViewSet(viewsets.GenericViewSet, mixins.RetrieveModelMixin):
    queryset = Site.objects.all()
    serializer_class = SiteGeoSerializer
