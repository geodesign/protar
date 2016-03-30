from django_countries.fields import CountryField

from corine.models import Nomenclature
from django.contrib.gis.db import models


class Site(models.Model):
    """
    Natura 2000 Site, the data in this table is loaded from the gis portion of
    the natura data.
    """
    SPA = 'A'
    SCI = 'B'
    BOTH = 'C'

    SITETYPE_CHOICES = (
        (SPA, 'Special Protection Areas (SPA)'),
        (SCI, 'Special Conservation Interest (SCI)'),
        (BOTH, 'Both SPA and SCI'),
    )

    sitecode = models.CharField(max_length=254, unique=True)
    sitename = models.CharField(max_length=254)
    release_date = models.CharField(max_length=254)
    country_code = models.CharField(max_length=2)
    country = CountryField(null=True)
    sitetype = models.CharField(max_length=254, choices=SITETYPE_CHOICES)
    geom = models.MultiPolygonField()
    centroid = models.PointField(null=True)

    def __str__(self):
        return self.sitename


class Natura2000Sites(models.Model):
    """
    Additional metadata for the site.
    """
    site = models.ForeignKey(Site, null=True)
    date_compilation = models.DateTimeField(blank=True, null=True)
    date_update = models.DateTimeField(blank=True, null=True)
    date_spa = models.DateTimeField(blank=True, null=True)
    spa_legal_reference = models.TextField(blank=True, null=True)
    date_prop_sci = models.DateTimeField(blank=True, null=True)
    date_conf_sci = models.DateTimeField(blank=True, null=True)
    date_sac = models.DateTimeField(blank=True, null=True)
    sac_legal_reference = models.TextField(blank=True, null=True)
    explanations = models.TextField(blank=True, null=True)
    marine_area_percentage = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    lengthkm = models.FloatField(blank=True, null=True)
    areaha = models.FloatField(blank=True, null=True)
    documentation = models.TextField(blank=True, null=True)
    quality = models.TextField(blank=True, null=True)
    designation = models.TextField(blank=True, null=True)
    othercharact = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.site.sitecode


class Bioregion(models.Model):
    """
    Biogreograhic region the site is falling in.
    """
    site = models.ForeignKey(Site, null=True)
    biogefraphicreg = models.CharField(max_length=510, blank=True, null=True, help_text='Indicate in wich beogreograhic region the site is falling.')
    percentage = models.FloatField(blank=True, null=True)

    def __str__(self):
        return '{} {}'.format(self.biogefraphicreg, self.site.sitecode)


class Contacts(models.Model):
    """
    Contact of the individual or organization providing the information
    contained in the record.
    """
    site = models.ForeignKey(Site, null=True)
    name = models.TextField(blank=True, null=True)
    email = models.CharField(max_length=510, blank=True, null=True)
    address_unstructured = models.TextField(blank=True, null=True)
    adminunit = models.CharField(max_length=510, blank=True, null=True)
    thoroughfare = models.CharField(max_length=510, blank=True, null=True)
    designator = models.CharField(max_length=510, blank=True, null=True)
    postcode = models.CharField(max_length=510, blank=True, null=True)
    postname = models.CharField(max_length=510, blank=True, null=True)
    address = models.CharField(max_length=510, blank=True, null=True)
    locatorname = models.CharField(max_length=510, blank=True, null=True)

    def __str__(self):
        return '{} {}'.format(self.address_unstructured[:50] + '...', self.site.sitecode)


class Designationstatus(models.Model):
    """
    Designation of this site at regional or national level.
    """
    site = models.ForeignKey(Site, null=True)
    designationcode = models.CharField(max_length=10, blank=True, null=True)
    designatedsitename = models.CharField(max_length=510, blank=True, null=True)
    overlapcode = models.CharField(max_length=2, blank=True, null=True)
    overlapperc = models.FloatField(blank=True, null=True)

    def __str__(self):
        return '{} -- {}'.format(self.designationcode, self.site.sitecode)

    class Meta:
        verbose_name_plural = "designationstati"


class Directivespecies(models.Model):
    """
    Species listed in the Habitats Directive.
    """
    YES = 'y'
    NO = 'N'

    ANNEX_CHOICES = (
        (YES, 'Yes'),
        (NO, 'No'),
    )

    directive = models.CharField(max_length=36, blank=True, null=True)
    speciesname = models.CharField(max_length=122, blank=True, null=True)
    annexii = models.CharField(max_length=2, blank=True, null=True, choices=ANNEX_CHOICES)
    annexii1 = models.CharField(max_length=2, blank=True, null=True, choices=ANNEX_CHOICES)
    annexii2 = models.CharField(max_length=2, blank=True, null=True, choices=ANNEX_CHOICES)
    annexiii1 = models.CharField(max_length=2, blank=True, null=True, choices=ANNEX_CHOICES)
    annexiii2 = models.CharField(max_length=2, blank=True, null=True, choices=ANNEX_CHOICES)
    annexiv = models.CharField(max_length=2, blank=True, null=True)
    annexv = models.CharField(max_length=2, blank=True, null=True)
    spbcax1 = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return '{} -- {}'.format(self.directive, self.speciesname)

    class Meta:
        verbose_name_plural = "directivespecies"


class Habitatclass(models.Model):
    """
    General habitat classes.
    """
    site = models.ForeignKey(Site, null=True)
    habitatcode = models.CharField(max_length=510, blank=True, null=True)
    percentagecover = models.FloatField(blank=True, null=True)
    description = models.CharField(max_length=510, blank=True, null=True)

    def __str__(self):
        return '{} -- {}'.format(self.habitatcode, self.site.sitecode)


class Habitats(models.Model):
    """
    Habitats present in the site.
    """
    GOOD = 'G'
    MODERATE = 'M'
    POOR = 'P'

    QUALITY_CHOICES = (
        (GOOD, 'Good (e.g. based on surveys)'),
        (MODERATE, 'Moderate (e.g. based on partial data with some extrapolation)'),
        (POOR, 'Poor (e.g. rough estimation)'),
    )

    site = models.ForeignKey(Site, null=True)
    habitatcode = models.CharField(max_length=8, blank=True, null=True, help_text='Code for the habitat type listed in AnnexI of Directive 92/43/EEC')
    description = models.CharField(max_length=510, blank=True, null=True, help_text='Name of the habitat type listed in AnnexI of Directive 92/43/EEC')
    habitat_priority = models.CharField(max_length=2, blank=True, null=True)
    priority_form_habitat_type = models.IntegerField(blank=True, null=True)
    non_presence_in_site = models.IntegerField(blank=True, null=True)
    cover_ha = models.FloatField(blank=True, null=True)
    caves = models.CharField(max_length=10, blank=True, null=True)
    representativity = models.CharField(max_length=2, blank=True, null=True)
    relsurface = models.CharField(max_length=2, blank=True, null=True)
    conservation = models.CharField(max_length=2, blank=True, null=True)
    global_assesment = models.CharField(max_length=2, blank=True, null=True)
    dataquality = models.CharField(max_length=2, blank=True, null=True, choices=QUALITY_CHOICES)
    percentage_cover = models.FloatField(blank=True, null=True)

    def __str__(self):
        return '{} -- {}'.format(self.habitatcode, self.site.sitecode)

    class Meta:
        verbose_name_plural = "habitats"


class Impact(models.Model):
    """
    Human activity and natural process that may have an influence, either
    positive or negative, on the conservation and management of the site.
    """

    NIT = 'N'
    PHO = 'P'
    ACI = 'A'
    TOXI = 'T'
    TOXO = 'O'
    MIX = 'X'

    IMPACT_CHOICES = (
        (NIT, 'Nitrogen input'),
        (PHO, 'Phosphor/Phosphate input'),
        (ACI, 'Acidification'),
        (TOXI, 'Toxic inorganic chemicals'),
        (TOXO, 'Toxic organic chemicals'),
        (MIX, 'Mixed pollution'),
    )

    HI = 'HIGH'
    MED = 'MEDIUM'
    LOW = 'LOW'

    INTENSITY_CHOICES = (
        (HI, 'High'),
        (MED, 'Medium'),
        (LOW, 'Low'),
    )

    IN = 'IN'
    OUT = 'a'

    OCCURENCE_CHOICES = (
        (IN, 'Inside'),
        (OUT, 'Ouside (in the surroundings of the site)')
    )

    site = models.ForeignKey(Site, null=True)
    impactcode = models.CharField(max_length=100, blank=True, null=True)
    description = models.CharField(max_length=510, blank=True, null=True)
    intensity = models.CharField(max_length=12, blank=True, null=True, choices=INTENSITY_CHOICES)
    pollutioncode = models.CharField(max_length=100, blank=True, null=True)
    occurrence = models.CharField(max_length=8, blank=True, null=True, choices=OCCURENCE_CHOICES, help_text='Inside or outside the surounding of the site. The surrounding is the area where the outside impacts and activities may effect the integreity of the site.')
    impact_type = models.CharField(max_length=2, blank=True, null=True, choices=IMPACT_CHOICES)

    def __str__(self):
        return '{} -- {}'.format(self.impactcode, self.site.sitecode)


class Management(models.Model):
    """
    Body(ies) responsible for the management of the site.
    """
    YES = 'Y'
    PREP = 'P'
    NO = 'N'

    MANAGEMENT_PLAN_STATUS_CHOICES = (
        (YES, 'Management plan exists'),
        (PREP, 'Management plan is in preparation'),
        (NO, 'Management plan does not exist')
    )

    site = models.ForeignKey(Site, null=True)
    org_name = models.TextField(blank=True, null=True)
    org_email = models.CharField(max_length=510, blank=True, null=True)
    manag_conserv_measures = models.TextField(blank=True, null=True)
    manag_plan = models.TextField(blank=True, null=True)
    manag_plan_url = models.TextField(blank=True, null=True)
    manag_status = models.CharField(max_length=2, blank=True, null=True, choices=MANAGEMENT_PLAN_STATUS_CHOICES)
    org_locatorname = models.CharField(max_length=510, blank=True, null=True)
    org_designator = models.CharField(max_length=510, blank=True, null=True)
    org_adminunit = models.CharField(max_length=510, blank=True, null=True)
    org_postcode = models.CharField(max_length=510, blank=True, null=True)
    org_postname = models.CharField(max_length=510, blank=True, null=True)
    org_adress = models.CharField(max_length=510, blank=True, null=True)
    org_address_unstructured = models.TextField(blank=True, null=True)

    def __str__(self):
        return '{} -- {}'.format(self.org_name, self.site.sitecode)


class Metadata(models.Model):
    parameter = models.CharField(max_length=256, blank=True, null=True)
    value = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.parameter


class Species(models.Model):
    """
    Important species of flora and fauna of the site.

    Both listed and not listed in the bird directive, this is a mixture of the
    two original tables Species and Otherspecies. The otherspecies entries are
    marked by directivespecies = False.
    """
    NOT_SENS = 0
    SENS = 1

    SENSITIVE_CHOICES = (
        (NOT_SENS, 'Not sensitive'),
        (SENS, 'Sensitive'),
    )

    COMMON = 'C'
    RARE = 'R'
    VERY_RARE = 'V'
    PRESENT = 'P'

    PRESENCE_CHOICES = (
        (COMMON, 'Common'),
        (RARE, 'Rare'),
        (VERY_RARE, 'Very rare'),
        (PRESENT, 'Present'),
    )

    site = models.ForeignKey(Site, null=True)
    speciesgroup = models.CharField(max_length=40, blank=True, null=True)
    speciesname = models.CharField(max_length=500, blank=True, null=True)
    speciescode = models.CharField(max_length=8, blank=True, null=True)
    motivation = models.CharField(max_length=40, blank=True, null=True)
    sensitive = models.IntegerField(blank=True, null=True, help_text='States if a species is sensitive or not for its publication', choices=SENSITIVE_CHOICES)
    nonpresenceinsite = models.IntegerField(blank=True, null=True)
    lowerbound = models.IntegerField(blank=True, null=True)
    upperbound = models.IntegerField(blank=True, null=True)
    counting_unit = models.CharField(max_length=100, blank=True, null=True)
    abundance_category = models.CharField(max_length=2, blank=True, null=True, choices=PRESENCE_CHOICES)
    ref_spgroup = models.CharField(max_length=40, blank=True, null=True)
    population_type = models.CharField(max_length=2, blank=True, null=True)
    dataquality = models.CharField(max_length=4, blank=True, null=True)
    population = models.CharField(max_length=28, blank=True, null=True)
    conservation = models.CharField(max_length=2, blank=True, null=True)
    isolation = models.CharField(max_length=2, blank=True, null=True)
    global_assessment = models.CharField(max_length=2, blank=True, null=True)
    directivespecies = models.BooleanField(default=True, help_text='Code the species listed in Article 4(1) and 4(2) of the bird directive 79/409/EEC and Annex II of Council Directive 92/43/EEC.')

    def __str__(self):
        return '{} -- {}'.format(self.speciesname, self.site.sitecode)


class Cover(models.Model):
    """
    Land cover of a part of the natura site.
    """
    site = models.ForeignKey(Site)

    year = models.IntegerField()
    nomenclature = models.ForeignKey(Nomenclature)
    change = models.BooleanField()
    nomenclature_previous = models.ForeignKey(Nomenclature, null=True, related_name='previous_covers')

    area = models.FloatField()

    def __str__(self):
        return '{} -- {}'.format(self.site.sitename, self.nomenclature.label_3)


class IntersectionLog(models.Model):
    """
    Track intersection progress.
    """
    site = models.OneToOneField(Site)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        if self.end:
            return '{} -- Ended in {}'.format(self.site.sitename, self.end - self.start)
        else:
            return '{} -- Ongoing, started at {}'.format(self.site.sitename, self.start)
