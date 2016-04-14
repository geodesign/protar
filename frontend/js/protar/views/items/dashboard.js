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

    var ItemView = Marionette.ItemView.extend({
        template: _.template(template),

        initialize: function(){
            _.bindAll(this, 'createCharts');
            this.tile_layers = {};
            // Listen to menu events to update interface
            this.listenTo(App.menuView, 'changed:level', this.createCharts);
            this.listenTo(App.menuView, 'changed:legend', this.createCharts);
            this.listenTo(App.menuView, 'changed:resize', this.createCharts);
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
                _this.createCharts();
            });

            // Get site geometry
            this.geom_done = false;
            this.model.attributes.geom.fetch().done(function(geom_result){
                _this.geom_result = geom_result;
                _this.geom_done = true;
                _this.createCharts();
            });

            // Get corine landcover layers
            this.layers_done = false;
            this.layers = new Layers();
            this.layers.fetch().done(function(){
                _this.layers_done = true;
                _this.createCharts();
            });
        },

        ui: {
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

            doughnuts: '.doughnuts',
            bars: '.bars',
            graph_switch: '.graph-toggle'
        },

        events: {
            'click @ui.graph_switch': 'toggleGraphs'
        },

        createCharts: function(){
            var _this = this;
            if(!this.noms_done || !this.geom_done || !this.layers_done) return;

            // Combine nomenclature data to covers and compute aggregates
            this.bindData();

            // Remove existing charts
            _.each(this.charts, function(chart){ chart.destroy(); });
            _.each(this.sankeys, function(svg){ svg.remove(); $('.sankey').html(''); });

            if(this.barchart) this.barchart.destroy();

            // Reset chart arrays
            this.charts = [];
            this.sankeys = [];

            // Create new charts
            _.each([1990, 2000, 2006, 2012], function(year){
                _this.createChart(year);
                if(year != 1990) {
                    _this.createSankey(year);
                }
            });
            this.createStackedChart();
            this.createMaps();
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

                // Skip this cover if its from a nomenclature that is not
                // in the api (currently the api does not provide the
                // nodata and unclassified elements).
                if(!nom) return;

                // Get code and label at the menu level
                cover.code = nom.attributes['code_' + App.menuView.current_level];
                cover.label = nom.attributes['label_' + App.menuView.current_level];
                // Get color from menu
                cover.color = App.menuView.colormap[nom.attributes.id];
                // Generate a key to group the data by type and year
                cover.code_group = cover.code + '_' + cover.year;
                // Encode change flag as boolean
                cover.change = false;
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
                    cover.change = true;
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

        createChart: function(year){
            var _this = this;

            // Get data for current year
            var data = this.aggregates.filter(function(x){return x.year == year && !x.change; });

            // Transform data to doughnut format
            chart_data = {
                labels: _.pluck(data, 'label'),
                datasets: [
                    {
                        data: _.pluck(data, 'area'),
                        backgroundColor: _.pluck(data, 'color'),
                        borderWidth: 0
                    }
                ]
            }
            // Get chart area
            var ctx = this.ui['chart' + year.toString()].get(0).getContext('2d');
            // Create chart
            var chart = new Chart(ctx, {
                type: 'doughnut',
                data: chart_data,
                options: {
                    legend: {
                        display: false
                    },
                    cutoutPercentage: 75
                }
            });

            this.charts.push(chart);
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
                    scales: {
                        yAxes: [{
                                stacked: true
                        }]
                    },
                    legend: {
                        display: false
                    }
                }
            });
        },

        toggleGraphs: function(){
            this.ui.doughnuts.toggle();
            this.ui.bars.toggle();
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
                    if(year == 2012) LMap.addControl(L.control.zoom({position: 'bottomright'}));

                    // Sync maps
                    _.each(_this.maps, function(map, key){
                        map.sync(LMap);
                        LMap.sync(map);
                    });

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
                // Clear layers if exists
                if(_this.tile_layers[layer.attributes.year]) {
                    LMap.removeLayer(_this.tile_layers[layer.attributes.year]);
                };
                var tile_layer = L.tileLayer('/raster/tiles/'+ layer.attributes.rasterlayer.toString() +'/{z}/{x}/{y}.png?colormap=' + colormap_uri, {
                    attribution: '&CLC EU'
                }).addTo(LMap);
                _this.tile_layers[layer.attributes.year] = tile_layer;
            });
        },

        createLinksNodesChange: function(year){
            var _this = this;

            // Prepare data buckets and access shortcuts
            var nodes = {};
            var links = [];
            var node_index = 0;
            var previous_year = this.model.attributes.years[_.indexOf(this.model.attributes.years, year) - 1];

            // Use aggregates for chart
            _.each(this.aggregates.filter(function(x){ return x.change; }), function(agg){
                // Filter by time
                if(agg.year == year){
                    // Create target node if it does not exist
                    var key_to = agg.code + '_' + year;
                    if(!nodes[key_to]) {
                        nodes[key_to] = {id: node_index, nomenclature: agg.nomenclature, year: year, name: agg.label, color: agg.color};
                        node_index++;
                    }
                    // Create origin node if it does not exist
                    var key_from = agg.code_previous + '_' + previous_year;
                    if(!nodes[key_from]) {
                        nodes[key_from] = {id: node_index, nomenclature: agg.nomenclature_previous, year: previous_year, name: agg.label_previous, color: agg.color_previous};
                        node_index++;
                    }
                    // Create link
                    links.push({
                        source: nodes[key_from].id,
                        target: nodes[key_to].id,
                        value: agg.area
                    });
                }
            });

            return {links: links, nodes: _.values(nodes)};
        },

        computePercentages: function(){
            var _this = this;
            var change = this.aggregates.filter(function(agg){ return agg.change; });
            change = _.groupBy(change, 'year');
            this.total_change = {};
            _.each(change, function(val, key){ return _this.total_change[key] = _.reduce(val, function(memo, x){ return memo + x.area }, 0); });

            var clc = this.aggregates.filter(function(agg){ return !agg.change; });
            clc = _.groupBy(clc, 'year');
            this.total_area = {};
            _.each(clc, function(val, key){ return _this.total_area[key] = _.reduce(val, function(memo, x){ return memo + x.area }, 0); });

            this.percentages = {};
            _.each(this.total_area, function(val, key){
                // No changes for 1990
                if(key == '1990') return;
                // Get change for this year
                var change = _this.total_change[key];
                // Compute a rounded percentage value
                var percentage =  Math.round(1000 * change / val) / 10;
                // Previous year lookup
                var prev = {2000: 1990, 2006: 2000, 2012: 2006};
                // Header prefix
                var prefix = 'Changes for ' + prev[key] + '-' + key + ' ';
                // Write percentage to header
                if(!change){
                    _this.ui['sankey_title' + key].html('No ' +  prefix);
                } else if(percentage){
                    _this.ui['sankey_title' + key].html(prefix + '<span class="pull-right">' + percentage + '% of Total</span>');
                } else {
                    _this.ui['sankey_title' + key].html(prefix + '< 0.1% of Total');
                }
            });
        },

        createSankey: function(year){
            var data = this.createLinksNodesChange(year);

            // Update section headings
            this.computePercentages();

            // Hide element if no data is there
            if(data.links.length == 0){
                this.ui['sankey' + year].hide();
                return;
            } else {
                this.ui['sankey' + year].show();
            }

            var margin = 10;
            var width = $(".sankey-" + year.toString()).width() - margin - margin;

            // Compute height as function of number of links
            var height = data.links.length * 50;
            height = height - margin - margin;
            height = height > 500 ? 500 : height;

            var formatNumber = d3.format(",.0f");
            var format = function(d) {
                return formatNumber(d) + " sqm";
            }
            color = d3.scale.category20();

            var svg = d3.select(".sankey-" + year.toString()).append("svg")
                .attr("width", width + margin + margin)
                .attr("height", height + margin + margin)
                .append("g")
                .attr("transform", "translate(" + margin + "," + margin + ")");

            var sankey = d3.sankey()
                .nodeWidth(15)
                .nodePadding(10)
                .size([width, height]);

            var path = sankey.link();

            sankey
                .nodes(data.nodes)
                .links(data.links)
                .layout(32);

            var link = svg.append("g").selectAll(".link")
                .data(data.links)
                .enter().append("path")
                .attr("class", "link")
                .attr("d", path)
                .style("stroke-width", function(d) {
                    return Math.max(1, d.dy);
                })
                .sort(function(a, b) {
                    return b.dy - a.dy;
                });

            link.append("title")
                .text(function(d) {
                    return d.source.name + " → " + d.target.name + "\n" + format(d.value);
                });

            var node = svg.append("g").selectAll(".node")
                .data(data.nodes)
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            node.append("rect")
                .attr("height", function(d) {
                    return d.dy;
                })
                .attr("width", sankey.nodeWidth())
                .style("fill", function(d) {
                    return d.color;// = color(d.name.replace(/ .*/, ""));
                })
                .style("stroke", function(d) {
                    return d3.rgb(d.color).darker(2);
                })
                .append("title")
                .text(function(d) {
                    return d.name + "\n" + format(d.value);
                });

            node.append("text")
                .attr("x", -6)
                .attr("y", function(d) {
                    return d.dy / 2;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .attr("transform", null)
                .text(function(d) {
                    return d.name;
                })
                .filter(function(d) {
                    return d.x < width / 2;
                })
                .attr("x", 6 + sankey.nodeWidth())
                .attr("text-anchor", "start");

            this.sankeys.push(svg);
        }
    });

    return ItemView;
});
