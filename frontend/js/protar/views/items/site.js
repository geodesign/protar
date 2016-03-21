define([
        'marionette',
        'leaflet',
        'chartjs',
        'd3',
        'models/siteGeo',
        'collections/nomenclatures',
        'collections/layers',
        'views/collections/legends',
        'views/collections/layers',
        'text!templates/items/site.html',
        'sankey',
        'sync'
    ], function(
        Marionette,
        L,
        Chart,
        d3,
        SiteGeo,
        Nomenclatures,
        Layers,
        LegendView,
        LayersView,
        template
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template(template),

        initialize: function(){
            _.bindAll(this, 'createCharts');
            this.exclude = [];
        },

        onShow: function(){
            var _this = this;
            // Set default year and landcover classification level
            this.current_year = _.max(this.model.attributes.years);
            this.current_level = 1;

            // Get complete nomenclatures list
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(function(){
                _this.createCharts();
            });
            _this.createMaps();

            // Basic window resize chart refresh
            $(window).on("resize", this.createCharts);
        },

        ui: {
            year: 'button.year',
            level: 'button.level',
            change: 'button.change',
            legend: '#legend',

            map1990: '#map-1990',
            map2000: '#map-2000',
            map2006: '#map-2006',
            map2012: '#map-2012',

            chart1990: '#chart-1990',
            chart2000: '#chart-2000',
            chart2006: '#chart-2006',
            chart2012: '#chart-2012'
        },

        events: {
            'click @ui.year': 'changed',
            'click @ui.level': 'changed',
            'click @ui.change': 'toggle'
        },

        createCharts: function(exclude){
            var _this = this;
            // Add nomenclature data to covers and compute aggregates
            _this.bindData(exclude);

            // Remove existing charts
            _.each(this.charts, function(chart){ chart.destroy(); });
            _.each(this.sankeys, function(svg){ svg.remove(); $('.sankey').html(''); });

            if(this.barchart) this.barchart.destroy();

            // Reset chart arrays
            this.charts = [];
            this.sankeys = [];

            // Create new charts
            _.each([1990, 2000, 2006, 2012], function(year){
                _this.current_year = year;
                _this.createChart(year);
                if(year != 1990) {
                    _this.createSankey();
                }
            });
            this.createStackedChart();

            if(!exclude) this.createLegend();
        },

        bindData: function(){
            var _this = this;

            var data = _.clone(this.model.attributes.covers);

            // Attach nomenclature data to cover elements
            _.each(data, function(cover){
                var nom = _this.nomenclatures.filter(function(nom){
                    return nom.id == cover.nomenclature;
                })[0];

                cover.code = nom.attributes['code_' + _this.current_level];
                cover.label = nom.attributes['label_' + _this.current_level];
                cover.color = nom.attributes.color;
                cover.code_group = cover.code + '_' + cover.year;
                cover.change = false;
                cover.code_full = nom.attributes.code_3;

                if(cover.nomenclature_previous){
                    var nom = _this.nomenclatures.filter(function(nom){
                        return nom.id == cover.nomenclature_previous;
                    })[0];
                    cover.code_previous = nom.attributes['code_' + _this.current_level];
                    cover.label_previous = nom.attributes['label_' + _this.current_level];
                    cover.color_previous = nom.attributes.color;
                    cover.code_group += '_' + cover.code_previous;
                    cover.change = true;
                };
            });

            // Remove change that stays within category (has effect only on aggregates)
            data = _.filter(data, function(cover){ return cover.code != cover.code_previous; });

            // Remove excluded elements
            data = _.filter(data, function(cover){ return _.indexOf(_this.exclude, cover.code) < 0; });

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
            //this.aggregates = _.sortBy(this.aggregates, 'code');
        },

        createLegend: function(){
            var _this = this;
            // Clear current selection array
            this.exclude = [];

            // Get data for legend
            var data = _.map(_.indexBy(this.aggregates, 'code'), function(x){
                return {label: x.label, nom: x.nomenclature, color: x.color, code: x.code};
            });

            // Instantiate view and collection objects
            var legend = new Backbone.Collection(data);
            var nom_view = new LegendView({collection: legend});

            // Bind click event to update interface
            nom_view.on('childview:clicked', function(view){
                view.$el.toggleClass('active');
                var index = _.indexOf(_this.exclude, view.model.attributes.code);
                if(index < 0) {
                    _this.exclude.push(view.model.attributes.code);
                } else {
                    _this.exclude.pop(index);
                }
                _this.createCharts(true);
            });

            // Render view
            nom_view.render();

            // Clear current legend and add new one
            $('#legend').html('');
            $('#legend').append(nom_view.$el);
        },

        createChart: function(year){
            var _this = this;

            // Get data for current year
            var data = this.aggregates.filter(function(x){return x.year == year && typeof x.code_previous == 'undefined';});

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

            // Destroy previous chart
            if(this.chart) this.chart.destroy();

            // Create data group
            var data = {
                labels: this.model.attributes.years,
                datasets: []
            };

            // Remove changes, not needed for this chart
            var agg = _.filter(this.aggregates, function(x){ return typeof x.code_previous == 'undefined'});

            // Group by code
            var agg = _.groupBy(agg, 'code');

            // Create chart dataset
            _.each(agg, function(val){
                var set = _.range(data.labels.length);
                _.each(val, function(x){
                    var index = _.indexOf(data.labels, x.year);
                    set[index] = x.area;
                });
                data.datasets.push({label: val[0].label, backgroundColor: val[0].color, data: set});
            });

            // Get chart area
            var ctx = this.$el.find("#barchart").get(0).getContext('2d');

            // Create chart
            this.barchart = new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    scales: {
                        xAxes: [{
                                stacked: true,
                        }],
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

        createMaps: function(){
            var _this = this;

            this.maps = [];
            this.model.attributes.geom.fetch().done(function(geom_result){
                var layers = new Layers();

                layers.fetch().done(function(){
                    layers.each(function(layer){
                        _this.createMap(layer.attributes.rasterlayer, layer.attributes.year, geom_result)
                    });
                });
            });
        },

        createMap: function(id, year, result){
            // Get aggregation area geometry from model
            var site = L.geoJson(result, {
                style: {
                    weight: 2,
                    opacity: 0.7,
                    color: '#333',
                    fillOpacity: 0.2,
                    fillColor: '#333'
                }
            });

            // Get map bounds with 5% padding
            var bounds = site.getBounds().pad(0.05);

            // Create leaflet map
            var LMap = L.map(this.ui['map' + year.toString()][0], {
                scrollWheelZoom: false,
                attributionControl: false,
                zoomControl: false
            }).fitBounds(bounds);

            // Add zoom control to last map on the list
            if(year == 2012) LMap.addControl(L.control.zoom({position: 'bottomright'}));

            // Sync maps
            _.each(this.maps, function(map){
                map.sync(LMap);
                LMap.sync(map);
            });

            this.maps.push(LMap);

            L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }).addTo(LMap);

            L.tileLayer('/raster/tiles/'+ id.toString() +'/{z}/{x}/{y}.png',{
                attribution: '&CLC EU'
            }).addTo(LMap);

            LMap.addLayer(site);
        },

        createLinksNodesChange: function(){
            var _this = this;

            // Prepare data buckets and access shortcuts
            var nodes = {};
            var links = [];
            var node_index = 0;
            var previous_year = this.model.attributes.years[_.indexOf(this.model.attributes.years, this.current_year) - 1];

            // Use aggregates for chart
            _.each(this.aggregates.filter(function(x){ return x.change; }), function(agg){
                // Filter by time
                if(agg.year == _this.current_year){
                    // Create target node if it does not exist
                    var key_to = agg.code + '_' + _this.current_year;
                    if(!nodes[key_to]) {
                        nodes[key_to] = {id: node_index, nomenclature: agg.nomenclature, year: _this.current_year, name: agg.label, color: agg.color};
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

        createSankey: function(){
            var data = this.createLinksNodesChange();
            if(data.length == 0) return;

            // Destroy previous chart
            if(this.chart) this.chart.destroy();

            var margin = 10;
            var width = $("#sankey-" + this.current_year.toString()).width() - margin - margin;
            var height = 300 - margin - margin;

            var formatNumber = d3.format(",.0f");
            var format = function(d) {
                return formatNumber(d) + " sqm";
            }
            color = d3.scale.category20();

            var svg = d3.select("#sankey-" + this.current_year.toString()).append("svg")
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
        },

        changed: function(e){
            var el = $(e.target);
            // Skip if element is already selected
            if(el.hasClass('active')) return;

            // Toggle classes
            el.addClass('active').siblings().removeClass('active');

            // Update value
            if(el.hasClass('year')){
                this.current_year = el.data('year');
            } else {
                this.current_level = el.data('level');
            }
            // Choose chart type
            if(this.current_year == 'all'){
                this.createStackedChart();
            } else {
                this.createCharts();
            }
        },

        toggle: function(e){
            var el = $(e.target);

            el.toggleClass('active');

            // Skip if element is already selected
            if(el.hasClass('active')){
                this.createSankey();
            } else {
                // Choose chart type
                if(this.current_year == 'all'){
                    this.createStackedChart();
                } else {
                    this.createChart();
                }
            }
        }
    });

    return ItemView;
});
