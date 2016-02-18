from corine.models import Nomenclature
from raster.models import Legend, LegendEntry, LegendSemantics


def run():
    print('Creating raster legend.')

    legend, created = Legend.objects.get_or_create(title='Corine Land Cover')

    for nom in Nomenclature.objects.all():
        # Skip over entries without color
        if not num.color:
            continue
        semantic, created = LegendSemantics.objects.get_or_create(name=nom.label_3[:50])
        semantic.description = name=nom.label_3
        semantic.save()
        entry, created = LegendEntry.objects.get_or_create(semantics=semantic)
        entry.expression = nom.grid_code
        entry.color = nom.color
        entry.save()
        legend.entries.add(entry)

    legend.refresh_from_db()
    legend.update_json()
    legend.save()
