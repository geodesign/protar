define([
        'marionette',
        'leaflet',
        'chartjs',
        'd3',
        'app',
        'models/siteGeo',
        'collections/nomenclatures',
        'collections/layers',
        'views/collections/legends',
        'views/collections/layers',
        'views/items/dashboard-year',
        'text!templates/items/dashboard.html',
        'sankey',
        'sync'
    ], function(
        Marionette,
        L,
        Chart,
        d3,
        App,
        SiteGeo,
        Nomenclatures,
        Layers,
        LegendView,
        LayersView,
        DYear,
        template
    ){
    //Define color conversion helper function
    var hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    var ItemView = Marionette.LayoutView.extend({
        template: _.template(template),

        regions: {
            yearRegion: '.year-region'
        },

        ui: {
            panel1990: '.row-1990',
            panel2000: '.row-2000',
            panel2006: '.row-2006',
            panel2012: '.row-2012',
            panel_all: '.row-all',

            map1990: '#map-1990',
            map2000: '#map-2000',
            map2006: '#map-2006',
            map2012: '#map-2012',

            chart1990: '#chart-1990',
            chart2000: '#chart-2000',
            chart2006: '#chart-2006',
            chart2012: '#chart-2012',

            sankey2000: '.sankey-2000',
            sankey2006: '.sankey-2006',
            sankey2012: '.sankey-2012',

            sankey_title2000: '.sankey-title-2000',
            sankey_title2006: '.sankey-title-2006',
            sankey_title2012: '.sankey-title-2012',

            base_info: '.base-info',
            year_region: '.year-region'
        },

        initialize: function(){
            _.bindAll(this, 'createAll');
            this.tile_layers = {};
            this.current_year = 2012;
            // Listen to menu events to update interface
            this.listenTo(App.menuView, 'changed:level', this.createAll);
            this.listenTo(App.menuView, 'changed:legend', this.createAll);
            this.listenTo(App.menuView, 'changed:year', this.createAll);
            
            this.year_model = new Backbone.Model({});
        },

        onShow: function(){
            var _this = this;
            // Dont render if there is no data
            if(this.model.attributes.covers == 0) return;

            // Get complete nomenclatures list
            this.noms_done = false;
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(function(){
                _this.noms_done = true;
                _this.createAll();
            });

            // Get site geometry
            this.geom_done = false;
            this.model.attributes.geom.fetch().done(function(geom_result){
                _this.geom_result = geom_result;
                _this.geom_done = true;
                _this.createAll();
            });

            // Get corine landcover layers
            this.layers_done = false;
            this.layers = new Layers();
            this.layers.fetch().done(function(){
                _this.layers_done = true;
                _this.createAll();
            });

            // Create Context map on menu
            if(this.model.attributes.sitename || this.model.attributes.level > 1){
                App.menuView.ui.context.show();
                App.menuView.createContextMap(this.model.attributes.centroid);
            } else {
                App.menuView.ui.context.hide();
            }
        },

        createAll: function(initial){
            if(!this.noms_done || !this.layers_done || !this.geom_done) return;
            var _this = this;

            this.current_year = App.menuView.current_year;

            // Combine nomenclature data to covers and compute aggregates
            this.bindData();
            this.computePercentages();

            // Toggle interface
            if(App.menuView.current_year){
                this.ui.year_region.show();
                this.ui.panel_all.hide();
                // Set data for year view and render
                this.year_model.set({
                    year: this.current_year,
                    previous_year: this.model.attributes.years[_.indexOf(this.model.attributes.years, this.current_year) - 1],
                    aggregates: this.aggregates.filter(function(agg){ return agg.year == _this.current_year; }),
                    geom: this.geom_result,
                    rasterlayer: this.layers.filter(function(lyr){ return lyr.get('year') == _this.current_year && !lyr.change; })[0].get('rasterlayer'),
                    change_ratio: this.change_ratio
                });

                if(!this.year_view){
                    this.year_view = new DYear({model: this.year_model});
                    this.yearRegion.show(this.year_view);
                } else {
                    this.year_view.createAll();
                }
            } else {
                this.ui.panel_all.show();
                this.ui.year_region.hide();
                // Create all elements
                this.createStackedChart();
            }
        },

        bindData: function(){
            var _this = this;

            var data = _.clone(this.model.attributes.covers);

            // Attach nomenclature data to cover elements
            _.each(data, function(cover){
                // Get nomenclature for this cover
                var nom = _this.nomenclatures.filter(function(nom){
                    return nom.id == cover.nomenclature;
                })[0];

                // Skip this cover is water, unclassified, or nodata
                // in the api (currently the api does not provide the
                // nodata and unclassified elements).
                if(nom.get('code_1') == 5 || nom.get('code_1') == 9) return;

                // Get code and label at the menu level
                cover.code = nom.attributes['code_' + App.menuView.current_level];
                cover.label = nom.attributes['label_' + App.menuView.current_level];
                // Get color from menu
                cover.color = App.menuView.colormap[nom.attributes.id];
                // Generate a key to group the data by type and year
                cover.code_group = cover.code + '_' + cover.year;
                // Get detail code for sorting
                cover.code_full = nom.attributes.code_3;

                if(cover.nomenclature_previous){
                    var nom = _this.nomenclatures.filter(function(nom){
                        return nom.id == cover.nomenclature_previous;
                    })[0];
                    cover.code_previous = nom.attributes['code_' + App.menuView.current_level];
                    cover.label_previous = nom.attributes['label_' + App.menuView.current_level];
                    cover.color_previous = nom.attributes.color;
                    cover.code_group += '_' + cover.code_previous;
                };
            });

            // Remove change that stays within category.
            // These changes are only possible if aggregated change stays within the same
            // aggregate class, but is change between subclasses.
            data = _.filter(data, function(cover){ return cover.code != cover.code_previous; });

            // Remove excluded elements
            data = _.filter(data, function(cover){ return _.indexOf(App.menuView.exclude, cover.code) < 0; });

            // Sort data
            data = _.sortBy(data, 'code_full');

            // Group by code, year and change
            var cov_groups = _.groupBy(data, 'code_group');

            // Compile aggregate dataset from groups
            this.aggregates = [];
            _.each(cov_groups, function(grp){
                var sum_area = _.reduce(grp, function(memo, cov){
                    return memo + cov.area;
                }, 0);

                var dat = _.clone(grp[0]);
                dat.area = sum_area;

                _this.aggregates.push(dat);
            });
        },

        computePercentages: function(){
            var _this = this;

            var clc = this.aggregates.filter(function(agg){ return !agg.change; });
            clc = _.groupBy(clc, 'year');
            var total_area = {};
            _.each(clc, function(val, key){ return total_area[key] = _.reduce(val, function(memo, x){ return memo + x.area }, 0); });

            var change = this.aggregates.filter(function(agg){ return agg.change; });
            change = _.groupBy(change, 'year');
            var total_change = {};
            _.each(change, function(val, key){ return total_change[key] = _.reduce(val, function(memo, x){ return memo + x.area }, 0); });

            this.percentages = {};
            _.each(total_area, function(val, key){
                // No changes for 1990
                if(key != _this.current_year) return;
                // Get change for this year
                var change = total_change[key];
                // Store change ration for the current year
                _this.change_ratio = change / val;
            });
            // Check for 1990 values, if very small, they are artefacts, so they should be removed
            if(total_area[1990] & total_area[1990] / total_area[2000] < 0.005){
                delete total_area[1990];
                this.aggregates = this.aggregates.filter(function(agg){ return agg.year != 1990; });
                this.model.attributes.years = this.model.attributes.years.filter(function(year){ return year != 1990 });
            }
            // For countries, add global percentage value
            if(!this.model.attributes.sitename & this.model.attributes.level == 0){
                var area_2012 = this.aggregates.filter(function(agg){ return !agg.change &  agg.year == 2012 ; });
                area_2012 = _.reduce(area_2012, function(memo, x){ return memo + x.area }, 0);
                var region_area = this.model.attributes.geom.attributes.properties.area;
                var current_percentage = Math.round(100 * area_2012 / region_area);
                this.ui.base_info.html('Currently Protected :' + current_percentage + '%');
            }
        },

        createStackedChart: function(){
            var _this = this;

            // Create data group
            var data = {
                labels: this.model.attributes.years,
                datasets: []
            };

            // Remove changes, not needed for this chart
            var agg = _.filter(this.aggregates, function(x){ return !x.change; });

            // Group by code
            var agg = _.groupBy(agg, 'code');

            // Create chart dataset
            _.each(agg, function(val){
                // Create zeros array for the available years
                var set = _.map(_.range(data.labels.length), function(x){ return  0; });
                // Replace values in zeros array to create a mini time series for
                // each landcover type.
                _.each(val, function(x){
                    var index = _.indexOf(data.labels, x.year);
                    set[index] = x.area
                });
                // Create rgba version of this color.
                var color = val[0].color;
                var col = hexToRgb(val[0].color);
                color = 'rgba(' + col.r + ',' + col.g +','+ col.b+', 1)';
                // Push mini time series to datasets
                data.datasets.push({label: val[0].label, backgroundColor: color , data: set, fill: true});
            });

            // Get chart area
            var ctx = this.$el.find("#barchart").get(0).getContext('2d');

            // Create chart
            this.barchart = new Chart(ctx, {
                type: 'line',
                data: data,

                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [
                            {
                                stacked: true,
                                ticks: {
                                    callback: function(value, index, values) {
                                        var maxval = _.max(values);
                                        if(maxval > 1e5){
                                            // Scientific notation for large values
                                            return value.toExponential();
                                        } else if (maxval < 1) {
                                            return d3.format(",.4f")(value);
                                        } else {
                                            return d3.format(",.1f")(value);
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    legend: {
                        display: false
                    }
                }
            });
        },

        createMaps: function(){
            var _this = this;
            // Instantiate maps if not done already
            if(!this.maps) {
                this.maps = {};
                _.each([1990, 2000, 2006, 2012], function(year){
                    // Get aggregation area geometry from model
                    var site = L.geoJson(_this.geom_result, {
                        style: {
                            weight: 2,
                            opacity: 0.7,
                            color: '#333',
                            fillOpacity: 0
                        }
                    });

                    // Get map bounds with 5% padding
                    var bounds = site.getBounds().pad(0.05);

                    // Create leaflet map
                    var LMap = L.map(_this.ui['map' + year.toString()][0], {
                        scrollWheelZoom: false,
                        attributionControl: false,
                        zoomControl: false
                    }).fitBounds(bounds);

                    LMap.addLayer(site);

                    // Add zoom control to last map on the list
                    //if(year == 2012) LMap.addControl(L.control.zoom({position: 'bottomright'}));
                    LMap.addControl(L.control.zoom({position: 'bottomright'}));

                    // Sync maps
                    //_.each(_this.maps, function(map, key){
                        //map.sync(LMap);
                        //LMap.sync(map);
                    //});

                    L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
                        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                    }).addTo(LMap);

                    _this.maps[year] = LMap;
                });
            }

            this.createLayers();
        },

        createLayers: function(){
            var _this = this;

            var colormap_uri = encodeURIComponent(JSON.stringify(App.menuView.colormap));

            // Get corine landcover layers
            this.layers.each(function(layer){
                // Ignore change layers on dashboard
                if(layer.attributes.change) return;
                // Get map for this layer
                var LMap = _this.maps[layer.attributes.year];
                // Return if map for this year does not exist
                if(!LMap) return;
                // Clear layers if exists
                if(_this.tile_layers[layer.attributes.year]) {
                    LMap.removeLayer(_this.tile_layers[layer.attributes.year]);
                };
                var tile_layer = L.tileLayer('/raster/tiles/'+ layer.attributes.rasterlayer.toString() +'/{z}/{x}/{y}.png?colormap=' + colormap_uri, {
                    attribution: '&CLC EU'
                }).addTo(LMap);
                _this.tile_layers[layer.attributes.year] = tile_layer;
            });
        }
    });

    return ItemView;
});
