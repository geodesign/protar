define([
        'marionette',
        'collections/regionsGeo',
        'collections/nomenclatures',
        'collections/layers',
        'collections/sitesGeo',
        'views/collections/legends',
        'views/collections/layers',
        'text!templates/layouts/explorer.html'
    ],
    function(
        Marionette,
        Regions,
        Nomenclatures,
        Layers,
        Sites,
        LegendView,
        LayersView,
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
            this.site_layer_min_zoom = 10;
            this.region_layer_level_1_min_zoom = 6;
        },

        onShow: function(){
            var _this = this;

            // Map setup
            this.LMap = L.map(this.ui.map[0], {
                center: new L.LatLng(54.546579538405034, 18.720703125),
                zoom: 6,
                minZoom: 0,
                maxZoom: 15
            });

            // Base layer
            var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(this.LMap);

            L.tileLayer('/raster/tiles/2/{z}/{x}/{y}.png').addTo(this.LMap);

            basemap.on('tileload', function(e){
                var tile = e.url.match(/\d+/g).join('/');
                if(_this.LMap.getZoom() > this.site_layer_min_zoom) {
                    _this.getSites(tile);
                } else { 
                    _this.getRegions(tile);
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

            // Bind zoomend to update layer
            this.LMap.on('mooveend', this.updateMap);

            var style = {
                weight: 2,
                opacity: 0.7,
                color: '#333',
                fillOpacity: 0.2,
                fillColor: '#333'
            };

            // Create empty vector layers to add data to
            this.regions_layer = L.geoJson(null, {style: style}).addTo(this.LMap);
            this.sites_layer = L.geoJson(null, {style: style});

            // Instantiate Legend and layer switcher
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(this.createLegend);

            this.createLayerSwitcher();

            // Create initial map setup
            this.updateMap();
        },

        getRegions: function(tile, page){
            console.log('Getting regions', page, tile);
            var _this = this;
            page = page ? page : 1;

            // Compute region detail level from zoom
            var level = this.LMap.getZoom() < 6 ? 0 : 1;


            // Setup search parameters
            var params = {
                level: level,
                page: page,
                tile: tile
            };
            params = {data: $.param(params)};

            // Create regions collection and fetch data
            var regions = new Regions();
            regions.fetch(params).done(function(data){
                // Add this page's data to regions layer.
                _this.regions_layer.addData(data);

                // Recursively get next page if exists.
                if(data.next){
                    _this.getRegions(tile, page + 1);
                } else {
                    _this.regions_layer.eachLayer(function(layer){
                        // Add interactivity when all regions are loaded
                        layer.on('click', function(){
                            Backbone.history.navigate('region/' + this.feature.id, {trigger: true});
                        });
                    });
                }
            });
        },

        getSites: function(tile, page){
            console.log('Getting sites', page, tile);
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
            var lyrs = new Layers();
            var lyr_view = new LayersView({collection: lyrs});
            lyrs.fetch();
            this.getRegion('layers').show(lyr_view);
        },

        updateMap: function(){
            console.log('mooveeend', this.LMap.getZoom(), this.LMap.getBounds().toBBoxString());
            if(this.LMap.getZoom() < 10) {
                if(this.LMap.hasLayer(this.sites_layer)){
                    this.LMap.removeLayer(this.sites_layer);
                }
                if(!this.LMap.hasLayer(this.regions_layer)){
                    this.LMap.addLayer(this.regions_layer);
                }
            } else {
                if(!this.LMap.hasLayer(this.sites_layer)){
                    this.LMap.addLayer(this.sites_layer);
                }
                if(this.LMap.hasLayer(this.regions_layer)) {
                    this.LMap.removeLayer(this.regions_layer);
                }
            }
        }
    });

    return AppLayoutView;
})
