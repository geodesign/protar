from django.contrib import admin
from natura.models import (
    Bioregion, Contacts, Cover, Designationstatus, Directivespecies, Habitatclass, Habitats, Impact, IntersectionLog,
    Management, Metadata, Natura2000Sites, Site, Species
)


class SiteForeignKeyAdmin(admin.ModelAdmin):
    raw_id_fields = ("site",)


class CoverForeignKeyAdmin(admin.ModelAdmin):
    raw_id_fields = ("site", "nomenclature", "nomenclature_previous")

admin.site.register(Bioregion, SiteForeignKeyAdmin)
admin.site.register(Contacts, SiteForeignKeyAdmin)
admin.site.register(Designationstatus, SiteForeignKeyAdmin)
admin.site.register(Directivespecies)
admin.site.register(Habitatclass, SiteForeignKeyAdmin)
admin.site.register(Habitats, SiteForeignKeyAdmin)
admin.site.register(Impact, SiteForeignKeyAdmin)
admin.site.register(Management, SiteForeignKeyAdmin)
admin.site.register(Metadata)
admin.site.register(Natura2000Sites, SiteForeignKeyAdmin)
admin.site.register(Site)
admin.site.register(Species, SiteForeignKeyAdmin)
admin.site.register(Cover, CoverForeignKeyAdmin)
admin.site.register(IntersectionLog, SiteForeignKeyAdmin)
