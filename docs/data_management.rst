====================
Data Management Plan
====================
This section describes the data sources used for analysis in Protar, as well as
the data access policies for the results of the same.

Data Sources
------------
The Protar web application has two main data sources: The Natura 2000 protected
area database and the Corine Land Cover dataset. Both datasets are published
under a full and open access policy.

In addition to these two main datasets, statistical area boundaries are used to
aggregate historic land cover in protected areas to regional and country
levels. Finally, a base map layer is used to support the visualization of the
data.

All data sources are described in some more detail below.

Natura 2000
^^^^^^^^^^^
The `Natura 2000`__ dataset is a network of protected areas throughout Europe. It
was established under the 1992 Habitats Directive and is the centrepiece of EU
nature & biodiversity policy. The network currently covers about 18% of Europe's
territory.

The data is contributed by regional authorities to a centralized database,
which is managed by the European Environmenal Agency (EEA). The database
consists of Geographic data and tabular data. The geographic data is available
in two Geographic Information System (GIS) formats (sqlite and shapefile), and
the tabular data as csv or excel tables.

According to the `EEA terms of use`__, the re-use of the Natura 2000 dataset is
permitted free of charge for commercial or non-commercial purposes, provided
that the source is acknowledged and that the entire item is reproduced. The EEA
policy follows the Directive 2003/98/EC of the European Parliament. The data
can be accessed `here`__.

__ http://ec.europa.eu/environment/nature/natura2000/index_en.htm
__ http://www.eea.europa.eu/legal/copyright
__ http://www.eea.europa.eu/data-and-maps/data/ds_resolveuid/52E54BF3-ACDB-4959-9165-F3E4469BE610

Corine Land cover
^^^^^^^^^^^^^^^^^
The Corine Land Cover (CLC) dataset is a comprehensive and consistent land
cover data layer for all of Europe.

It is available for four years: 1990, 2000, 2006, and 2012. Landcover *change*
layers are availableIn addition to these land cover layers. These represent the
land cover change between each of the above years. The 2012 version of the
dataset is still in production hand has not been finalized. Nevertheless, to
take advantage of the most up to date data, the latest available version
(v18.4) is used in Protar. The data can be updated once the final version of
the 2012 CLC is available.

The CLC dataset is published in various GIS formats, including both vector and
raster files. The data is published under a full and open access policy and is
distributed by the Copernicus Land Monitoring Programme. The data can be
accessed `here`__.

__ http://land.copernicus.eu/pan-european/corine-land-cover/clc-2012/

Regional Summary Boundaries
^^^^^^^^^^^^^^^^^^^^^^^^^^^
The analysis conducted in Protar intersects the Natura 2000 protected area
boundaries with the CLC dataset to compute landcover and landcover change
statistics for the available years. These values are computed for each of the
roughly 27 thousand protected areas.

While this detailed information might be relevant for managing protected areas
and learning more about them, the data is also aggregated to give overviews
over broad trends on a regional and country level.

The geographical boundaries used for aggregation are derived from the
boundaries of the statistical areas of the  `Nomenclature of Territorial Units
for Statistics (NUTS)`__ geographical boundaries.

The version of NUTS boundaries used here is the `EuroBoundaryMap`__, which is
maintained by EuroGeographics, a membership association and acknowledged voice
of the European National Mapping, Cadastre and Land Registry Authorities. The
dataset is released under `EuroGeographic's open data policy`__, allowing its
use free of charge for commercial and non-commercial purposes. The data can
be accessed `here`__.

__ https://en.wikipedia.org/wiki/Nomenclature_of_Territorial_Units_for_Statistics
__ http://www.eurogeographics.org/products-and-services/euroboundarymap
__ http://www.eurogeographics.org/content/eurogeographics-euroglobalmap-opendata
__ http://www.eurogeographics.org/form/topographic-data-eurogeographics

Base Maps
^^^^^^^^^
The geographical data used in Protar will be displayed on online maps in
various parts of the web application. In these visualizations, basemaps are
used to give context to the protected areas and the land cover data.

The basemaps used in Protar have been produced in a collaboration between
`CartoDB`__ and `Stamen Design`__, and are described `here`__. The
basemaps are designed specifically for data overlays and are therefore ideal
for Protar's purpose.

The source code to reproduce the maps is `available on GitHub`__, the source
code and the basemap tiles are released under a `Creative Commons CC3.0`__
License and have been derived from OpenStreetMap (OSM) data.

__ https://cartodb.com/
__ http://stamen.com/
__ https://cartodb.com/basemaps/
__ https://github.com/cartodb/cartodb-basemaps
__ https://creativecommons.org/licenses/by/3.0/

Protar Analysis Results
-----------------------
The main results of the analysis conducted in Protar are data on landcover and
landcover change in all protected areas of the Natura 2000 network. This
information is visualized in the web application which will be publicly
accessible.

The visualizations are driven by a `REST API`__, a Representational State
Transfer Application Programming Interface. The API is also publicly
accessible and provides structured access to the results of the Protar
analysis. Protar's API root can be found `here`__.

The protar api is setup with Cross- Origin Resource Sharing (CORS) headers
through the `django-cors-headers`__ app, so it can readily be used from within
other applications anywhere on the web.

All results are published under the `European Union Public License (EUPL)
Version 1.1`__.

__ https://en.wikipedia.org/wiki/Representational_state_transfer
__ http://protar.org/api
__ https://github.com/ottoyiu/django-cors-headers/
__ https://github.com/geodesign/protar/blob/master/LICENSE
