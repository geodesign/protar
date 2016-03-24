define([
        'marionette',
        'collections/regionsGeo',
        'collections/nomenclatures',
        'collections/layers',
        'views/collections/legends',
        'views/collections/layers',
        'text!templates/layouts/explorer.html'
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

        initialize: function(){
            _.bindAll(this, 'createLegend');
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

            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(this.createLegend);

            this.getRegions();
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
        }
    });

    return AppLayoutView;
})
