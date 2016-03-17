define([
        'marionette',
        'collections/regionsGeo',
        'collections/nomenclatures',
        'collections/layers',
        'views/collections/legends',
        'views/collections/layers',
        'text!templates/layouts/map.html'
    ],
    function(
        Marionette,
        Regions,
        Nomenclatures,
        Layers,
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

        onShow: function(){
            var _this = this;

            // Map setup
            this.LMap = L.map(this.ui.map[0], {
                center: new L.LatLng(54.546579538405034, 18.720703125),
                zoom: 4,
                minZoom: 0,
                maxZoom: 15
            });

            // Base layer
            var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(this.LMap);

            L.tileLayer('/raster/tiles/2/{z}/{x}/{y}.png').addTo(this.LMap);

            // Labelmap with streets
            var labelmap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',{
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
              transparent: true
            }).addTo(this.LMap);

            // Make sure streets are overlaid on top
            this.LMap.getPanes().overlayPane.appendChild(labelmap.getContainer());
            labelmap.setZIndex(9999);

            this.regions_layer = L.geoJson(null, {
                style: {
                    weight: 2,
                    opacity: 0.7,
                    color: '#333',
                    fillOpacity: 0.2,
                    fillColor: '#333'
                }
            }).addTo(this.LMap);


            this.getRegions();
            this.createLegend();
            this.createLayerSwitcher();
        },

        getRegions: function(page){
            page = page ? page : 1;
            //

            var _this = this;
            var regions = new Regions();
            var params = {data: $.param({level: 0, page: page})};

            regions.fetch(params).done(function(data){
                // Add this page's data to regions layer.
                _this.regions_layer.addData(data);

                // Recursively get next page if exists.
                if(data.next){
                    _this.getRegions(page + 1);
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

        createLegend: function(){
            var nom = new Nomenclatures();
            var nom_view = new LegendView({collection: nom});
            nom.fetch();
            this.getRegion('legend').show(nom_view);
        },

        createLayerSwitcher: function(){
            var lyrs = new Layers();
            var lyr_view = new LayersView({collection: lyrs});
            lyrs.fetch();
            this.getRegion('layers').show(lyr_view);
        }
    });

    return AppLayoutView;
})
