from django.contrib import admin
from nuts.models import Region

class SiteForeignKeyAdmin(admin.ModelAdmin):
    raw_id_fields = ("sites",)

admin.site.register(Region, SiteForeignKeyAdmin)
