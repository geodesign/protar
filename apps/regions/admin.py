from django.contrib import admin
from regions.models import Region


class SiteForeignKeyAdmin(admin.ModelAdmin):
    raw_id_fields = ("sites",)

admin.site.register(Region, SiteForeignKeyAdmin)
