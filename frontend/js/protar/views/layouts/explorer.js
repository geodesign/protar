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

            // Bind zoomend to update layer
            this.LMap.on('zoomend', this.updateGeometries);

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

            this.connectMenu();
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
