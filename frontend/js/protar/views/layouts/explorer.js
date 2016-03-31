define([
        'marionette',
        'collections/regionsGeo',
        'collections/nomenclatures',
        'collections/layers',
        'collections/sitesGeo',
        'views/collections/legends',
        'views/layouts/layerswitcher',
        'text!templates/layouts/explorer.html'
    ],
    function(
        Marionette,
        Regions,
        Nomenclatures,
        Layers,
        Sites,
        LegendView,
        Layerswitcher,
        template
    ){
    var AppLayoutView = Marionette.LayoutView.extend({
        template: _.template(template),
        className: 'maplayout',
        ui: {
            map: '#map',
        },
        regions: {
            legend: '#legend',
            layers: '#layers'
        },

        initialize: function(){
            _.bindAll(this, 'createLegend', 'updateMap');
            this.sites_layer_min_zoom = 9;
            this.regions_layer_min_zoom = 7;
            this.regions_fetched = {0: [], 1: []};
            this.sites_fetched = [];
        },

        onShow: function(){
            var _this = this;

            // Map setup
            this.LMap = L.map(this.ui.map[0], {
                center: new L.LatLng(54.546579538405034, 18.720703125),
                zoom: 7,
                minZoom: 0,
                maxZoom: 15
            });

            // Base layer
            var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(this.LMap);

            this.corine_layer = L.tileLayer('/raster/tiles/2/{z}/{x}/{y}.png');
            this.corine_layer.addTo(this.LMap);

            // Bind zoomend to update layer
            this.LMap.on('zoomend', this.updateMap);

            basemap.on('tileload', function(e){
                var tile_values = e.url.match(/\d+/g);
                var tile_zoom = parseInt(tile_values[0]);
                var tile_lookup = tile_values.join('/');
                if(tile_zoom > _this.sites_layer_min_zoom) {
                    _this.getSites(tile_lookup);
                } else {
                    _this.getRegions(tile_lookup, tile_zoom);
                }
            });

            // Labelmap with streets
            var labelmap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
              transparent: true
            }).addTo(this.LMap);

            // Make sure streets are overlaid on top
            this.LMap.getPanes().overlayPane.appendChild(labelmap.getContainer());
            labelmap.setZIndex(9999);

            var style = {
                weight: 1.5,
                opacity: 0.7,
                color: '#333',
                fillOpacity: 0.0
            };

            // Create empty vector layers to add data to
            this.country_layer = L.geoJson(null, {
                style: style
            }).addTo(this.LMap);

            this.regions_layer = L.geoJson(null, {
                style: style
            }).addTo(this.LMap);

            this.sites_layer = L.geoJson(null, {
                style: style
            }).addTo(this.LMap);

            var mouseover = function(e){ e.layer.setStyle({fillOpacity: 0.2})};
            var mouseout = function(e){ e.layer.setStyle({fillOpacity: 0})};

            this.country_layer.on('mouseover', mouseover);
            this.country_layer.on('mouseout', mouseout);

            this.regions_layer.on('mouseover', mouseover);
            this.regions_layer.on('mouseout', mouseout);

            this.sites_layer.on('mouseover', mouseover);
            this.sites_layer.on('mouseout', mouseout);

            // Instantiate Legend and layer switcher
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(this.createLegend);

            this.createLayerSwitcher();
        },

        getRegions: function(tile, zoom, page, exclude){
            var _this = this;
            page = page ? page : 1;
            // Compute region detail level from zoom
            var level = zoom < this.regions_layer_min_zoom ? 0 : 1;
            var layer = level ? this.regions_layer : this.country_layer;
            // Compile list of already fetched features keep exclude tag
            // constant over pages of a tile, as otherwise the ordering might
            // get wrong and not all features might be fetched correctly.
            if(!exclude) {
                exclude = this.regions_fetched[level].join(',');
            }
            // Setup search parameters
            var params = {
                level: level,
                page: page,
                tile: tile
                //exclude: exclude
            };
            params = {data: $.param(params)};
            // Create regions collection and fetch data
            var regions = new Regions();
            regions.fetch(params).done(function(data){
                // Filter results to prevent double rendering
                data.features = _.filter(data.features, function(feat){
                    var match = true;
                    layer.eachLayer(function(layer){
                        if(layer.feature.id == feat.id) match = false;
                    });
                    return match;
                });
                // Add this page's data to regions layer.
                layer.addData(data);
                // Recursively get next page if exists.
                if(data.next){
                    _this.getRegions(tile, zoom, page + 1, exclude);
                } else {
                    layer.eachLayer(function(layer){
                        _this.regions_fetched[level].push(layer.feature.id);
                        // Add interactivity when all regions are loaded
                        layer.on('click', function(){
                            Backbone.history.navigate('region/' + this.feature.id, {trigger: true});
                        });
                    });
                }
            });
        },

        getSites: function(tile, page){
            var _this = this;
            page = page ? page : 1;

            // Setup search parameters
            var params = {
                page: page,
                tile: tile
            };
            params = {data: $.param(params)};

            // Create regions collection and fetch data
            var sites = new Sites();
            sites.fetch(params).done(function(data){
                // Add this page's data to regions layer.
                _this.sites_layer.addData(data);

                // Recursively get next page if exists.
                if(data.next){
                    _this.getSites(tile, page + 1);
                } else {
                    _this.sites_layer.eachLayer(function(layer){
                        // Add interactivity when all regions are loaded
                        layer.on('click', function(){
                            Backbone.history.navigate('site/' + this.feature.id, {trigger: true});
                        });
                    });
                }
            });
        },

        createLegend: function(){
            var current_level = 2;
            // Make sure nomenclatures are sorted
            this.nomenclatures.sortBy('code_3');
            // Attach label attribute based on level
            this.nomenclatures.each(function(nom){ nom.attributes.label = nom.attributes['label_' + current_level]; });
            // Group by code and pick first element of each group (assumes preordering)
            var level_noms = this.nomenclatures.groupBy('code_' + current_level);
            level_noms = _.map(level_noms, function(group){ return group[0]});
            // Convert list to collection
            level_noms = new Backbone.Collection(level_noms);
            // Create and show legend view
            var noms_view = new LegendView({collection: level_noms});
            this.getRegion('legend').show(noms_view);
        },

        createLayerSwitcher: function(){
            var _this = this;
            var switcher = new Layerswitcher();
            this.getRegion('layers').show(switcher);
            switcher.on('selected:layer', function(model){
                _this.LMap.removeLayer(_this.corine_layer);
                _this.corine_layer = L.tileLayer('/raster/tiles/' + model.attributes.rasterlayer +'/{z}/{x}/{y}.png');
                _this.LMap.addLayer(_this.corine_layer);
            });
        },

        updateMap: function(){
            if(this.LMap.getZoom() < this.regions_layer_min_zoom) {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.regions_layer)) this.LMap.removeLayer(this.regions_layer);
                if(!this.LMap.hasLayer(this.country_layer)) this.LMap.addLayer(this.country_layer);
            } else if(this.LMap.getZoom() < this.sites_layer_min_zoom) {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.country_layer)) this.LMap.removeLayer(this.country_layer);
                if(!this.LMap.hasLayer(this.regions_layer)) this.LMap.addLayer(this.regions_layer);
            } else {
                if(this.LMap.hasLayer(this.country_layer)) this.LMap.removeLayer(this.country_layer);
                if(this.LMap.hasLayer(this.regions_layer)) this.LMap.removeLayer(this.regions_layer);
                if(!this.LMap.hasLayer(this.sites_layer)) this.LMap.addLayer(this.sites_layer);
            }
        }
    });

    return AppLayoutView;
})
