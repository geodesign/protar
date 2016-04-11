define([
        'marionette',
        'app',
        'collections/regionsGeo',
        'collections/nomenclatures',
        'collections/layers',
        'collections/sitesGeo',
        'views/collections/legends',
        'text!templates/layouts/explorer.html'
    ],
    function(
        Marionette,
        App,
        Regions,
        Nomenclatures,
        Layers,
        Sites,
        LegendView,
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
            _.bindAll(this, 'updateGeometries', 'updateRaster');
            this.nuts0_min_zoom = 6;
            this.nuts1_min_zoom = 7;
            this.nuts2_min_zoom = 8;
            this.nuts3_min_zoom = 9;
        },

        onShow: function(){
            var _this = this;

            // Create bounds for europe
            var southWest = L.latLng(28, -19),
                northEast = L.latLng(71, 35),
                bounds = L.latLngBounds(southWest, northEast);

            // Map setup
            this.LMap = L.map(this.ui.map[0], {
                zoom: 4,
                minZoom: 0,
                maxZoom: 15
            }).fitBounds(bounds);

            this.LMap.attributionControl.setPrefix('');

            // Base layer
            var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(this.LMap);

            // Bind zoomend to update layer
            this.LMap.on('zoomend', this.updateGeometries);

            basemap.on('tileload', function(e){
                var tile_values = e.url.match(/\d+/g);
                var tile_zoom = parseInt(tile_values[0]);
                var tile_lookup = tile_values.join('/');
                if(tile_zoom > _this.nuts3_min_zoom) {
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
            this.nuts0_layer = L.geoJson(null, {
                style: style
            });
            this.nuts1_layer = L.geoJson(null, {
                style: style
            });
            this.nuts2_layer = L.geoJson(null, {
                style: style
            });
            this.nuts3_layer = L.geoJson(null, {
                style: style
            });
            this.sites_layer = L.geoJson(null, {
                style: style
            });

            var mouseover = function(e){ e.layer.setStyle({fillOpacity: 0.2})};
            var mouseout = function(e){ e.layer.setStyle({fillOpacity: 0})};

            this.nuts0_layer.on('mouseover', mouseover);
            this.nuts0_layer.on('mouseout', mouseout);
            this.nuts1_layer.on('mouseover', mouseover);
            this.nuts1_layer.on('mouseout', mouseout);
            this.nuts2_layer.on('mouseover', mouseover);
            this.nuts2_layer.on('mouseout', mouseout);
            this.nuts3_layer.on('mouseover', mouseover);
            this.nuts3_layer.on('mouseout', mouseout);

            this.sites_layer.on('mouseover', mouseover);
            this.sites_layer.on('mouseout', mouseout);

            this.connectMenu();
            this.updateGeometries();
        },

        getRegions: function(tile, zoom, page){
            var _this = this;
            page = page ? page : 1;
            // Compute region detail level from zoom
            var level = zoom > this.nuts2_min_zoom ? 3 : (zoom >  this.nuts1_min_zoom) ? 2 : (zoom > this.nuts0_min_zoom) ? 1 : 0;
            var layer = this['nuts' + level + '_layer'];

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
                    _this.getRegions(tile, zoom, page + 1);
                } else {
                    layer.eachLayer(function(layer){
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

        connectMenu: function(){
            var _this = this;
            this.lyrs = new Layers();
            this.lyrs.fetch().done(function(){
                _this.updateRaster();
                App.menuView.on('changed:year', _this.updateRaster);
                App.menuView.on('changed:level', _this.updateRaster);
                App.menuView.on('changed:legend', _this.updateRaster);
            });
        },

        updateRaster: function(){
            if(this.corine_layer) this.LMap.removeLayer(this.corine_layer);
            var model = this.lyrs.filter(function(layer){
                return layer.attributes.year == App.menuView.current_year;
            })[0];
            var colormap_uri = encodeURIComponent(JSON.stringify(App.menuView.colormap));
            this.corine_layer = L.tileLayer('/raster/tiles/' + model.attributes.rasterlayer +'/{z}/{x}/{y}.png?colormap=' + colormap_uri);
            this.LMap.addLayer(this.corine_layer);
        },

        updateGeometries: function(){
            var zoom = this.LMap.getZoom()
            if(zoom > this.nuts3_min_zoom) {
                if(!this.LMap.hasLayer(this.sites_layer)) this.LMap.addLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.nuts0_layer)) this.LMap.removeLayer(this.nuts0_layer);
                if(this.LMap.hasLayer(this.nuts1_layer)) this.LMap.removeLayer(this.nuts1_layer);
                if(this.LMap.hasLayer(this.nuts2_layer)) this.LMap.removeLayer(this.nuts2_layer);
                if(this.LMap.hasLayer(this.nuts3_layer)) this.LMap.removeLayer(this.nuts3_layer);
            } else if(zoom > this.nuts2_min_zoom) {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.nuts0_layer)) this.LMap.removeLayer(this.nuts0_layer);
                if(this.LMap.hasLayer(this.nuts1_layer)) this.LMap.removeLayer(this.nuts1_layer);
                if(this.LMap.hasLayer(this.nuts2_layer)) this.LMap.removeLayer(this.nuts2_layer);
                if(!this.LMap.hasLayer(this.nuts3_layer)) this.LMap.addLayer(this.nuts3_layer);
            } else if(zoom > this.nuts1_min_zoom) {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.nuts0_layer)) this.LMap.removeLayer(this.nuts0_layer);
                if(this.LMap.hasLayer(this.nuts1_layer)) this.LMap.removeLayer(this.nuts1_layer);
                if(!this.LMap.hasLayer(this.nuts2_layer)) this.LMap.addLayer(this.nuts2_layer);
                if(this.LMap.hasLayer(this.nuts3_layer)) this.LMap.removeLayer(this.nuts3_layer);
            } else if(zoom > this.nuts0_min_zoom) {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(this.LMap.hasLayer(this.nuts0_layer)) this.LMap.removeLayer(this.nuts0_layer);
                if(!this.LMap.hasLayer(this.nuts1_layer)) this.LMap.addLayer(this.nuts1_layer);
                if(this.LMap.hasLayer(this.nuts2_layer)) this.LMap.removeLayer(this.nuts2_layer);
                if(this.LMap.hasLayer(this.nuts3_layer)) this.LMap.removeLayer(this.nuts3_layer);
            } else {
                if(this.LMap.hasLayer(this.sites_layer)) this.LMap.removeLayer(this.sites_layer);
                if(!this.LMap.hasLayer(this.nuts0_layer)) this.LMap.addLayer(this.nuts0_layer);
                if(this.LMap.hasLayer(this.nuts1_layer)) this.LMap.removeLayer(this.nuts1_layer);
                if(this.LMap.hasLayer(this.nuts2_layer)) this.LMap.removeLayer(this.nuts2_layer);
                if(this.LMap.hasLayer(this.nuts3_layer)) this.LMap.removeLayer(this.nuts3_layer);
            }
        }
    });

    return AppLayoutView;
})
