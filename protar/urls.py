from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic.base import TemplateView
from protar.routers import router

urlpatterns = [
    url(r'^api/', include(router.urls)),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', TemplateView.as_view(template_name='index.html')),
]
