define([
        'marionette',
        'leaflet',
        'chartjs',
        'd3',
        'models/siteGeo',
        'collections/nomenclatures',
        'text!templates/items/site.html',
        'sankey'
    ], function(
        Marionette,
        L,
        Chart,
        d3,
        SiteGeo,
        Nomenclatures,
        template
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template(template),
        onShow: function(){
            var _this = this;
            // Set default year and landcover classification level
            this.current_year = _.max(this.model.attributes.years);
            //this.current_year = 2000;
            this.current_level = 3;

            // Get complete nomenclatures list
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(function(){
                _this.createChart();
                _this.createMap();
            });
        },

        ui: {
            year: 'button.year',
            level: 'button.level',
            change: 'button.change'
        },

        events: {
            'click @ui.year': 'changed',
            'click @ui.level': 'changed',
            'click @ui.change': 'toggle'
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

            // Pick all year/label pairs into single elements
            var all_data = [];
            _.each(this.model.attributes.years, function(year){
                var year_data = _this.extractChartData(year);
                _.each(year_data.labels, function(dat, idx){
                    all_data.push({year: year, label: dat, color: year_data.colors[idx], area: year_data.areas[idx]});
                });
            });

            // Reduce dataset to unique labels
            var unique_labels = _.uniq(_.pluck(all_data, 'label'));

            // For each label and year, create subdataset
            _.each(unique_labels, function(label){
                var areas = [];
                _.each(_this.model.attributes.years, function(year){
                    var dat = _.filter(all_data, function(dat){ return dat.year == year && dat.label == label})[0];
                    var area = dat ? dat.area : 0;
                    areas.push(area);
                });

                // Get first color found for this category
                var color = _.filter(all_data, function(dat){ return dat.label == label})[0].color;

                // Push data to chart dataset
                data.datasets.push({label: label, backgroundColor: color, data: areas});
            });

            // Get chart area
            var ctx = this.$el.find("#chart").get(0).getContext('2d');

            // Create chart
            this.chart = new Chart(ctx, {
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
                    }
                }
            });
        },

        createMap: function(){
            var _this = this;
            var geo = new SiteGeo({id: this.model.id});
            geo.fetch().done(function(result){
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

                // Get map dom element of this item view
                var mapel = _this.$el.find('.map')[0];

                // Instantiate leaflet map, padding by 10%
                var bounds = site.getBounds().pad(0.1);

                var LMap = L.map(mapel, {
                    scrollWheelZoom: false,
                    attributionControl: false,
                    zoomControl: true
                }).fitBounds(bounds);
                L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                }).addTo(LMap);
                L.tileLayer('/raster/tiles/1/{z}/{x}/{y}.png',{
                  attribution: '&CLC EU'
                }).addTo(LMap);
                LMap.addLayer(site);
            });
        },

        createChart: function(){
            // Create dataset from app state
            var data = this.extractChartData();

            // Transform data to doughnut format
            data = {
                labels: data.labels,
                datasets: [
                    {
                        data: data.areas,
                        backgroundColor: data.colors
                    }
                ]
            }

            // Destroy previous chart
            if(this.chart) this.chart.destroy();

            // Get chart area
            var ctx = this.$el.find("#chart").get(0).getContext('2d');

            // Create chart
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: data
            });
        },

        extractChartData: function(year){
            var _this = this;

            // Set year from current if not provided
            if(!year) year =  _this.current_year;

            // Create data buckets
            var labels = [];
            var colors = [];
            var areas = [];

            // Group nomenclatures by level
            var noms = this.nomenclatures.groupBy(function(nom){
                return nom.attributes.code.substr(0, _this.current_level);
            });

            // Extract aggregate value for this level
            _.each(noms, function(nom_group){
                var sum_area = _.reduce(nom_group, function(memo, nom){
                    var cover = _.filter(_this.model.attributes.covers, function(x){ return !x.change && x.nomenclature == nom.id && x.year == year})[0]
                    var result = cover ? cover.area : 0;
                    return memo + result;
                }, 0);

                if(sum_area){
                    areas.push(Math.round(sum_area));
                    // Push level label name
                    labels.push(nom_group[0].attributes['label_' + _this.current_level]);
                    // Pick color of first member of this level
                    colors.push(nom_group[0].attributes.color);
                }
            });

            // Construct dataset for chart
            return {
                labels: labels,
                areas: areas,
                colors: colors
            }
        },

        createLinksNodesChange: function(){
            var _this = this;
            // Prepare data buckets and access shortcuts
            var all_changes = this.model.attributes.covers.filter(function(x){ return x.change; });
            var nodes = [];
            var links = [];
            var node_index = 0;

            var previous_year = this.model.attributes.years[_.indexOf(this.model.attributes.years, this.current_year) - 1];

            // Create nodes for all year/nomenclature combinations
            this.nomenclatures.each(function(nom){
                // Get shortened label
                var name = nom.attributes.label_3;
                if(name.length > 20) name = name.substr(0, 20) + '...';

                // Process current year
                var covers_to = all_changes.filter(function(x){ return x.nomenclature == nom.id && x.year == _this.current_year; });
                if(covers_to.length){
                    nodes.push({id: node_index, nomenclature: nom.id, year: _this.current_year, name: name  + ' ' + _this.current_year, color: nom.attributes.color});
                    node_index++;
                }
                // Process previous year
                var covers_from = all_changes.filter(function(x){ return x.nomenclature_previous == nom.id && x.year == _this.current_year; });
                if(covers_from.length){
                    nodes.push({id: node_index, nomenclature: nom.id, year: previous_year, name: name  + ' ' + previous_year, color: nom.attributes.color});
                    node_index++;
                }
            });

            // Process data by nomenclature
            this.nomenclatures.each(function(nom){

                var cover_changes = all_changes.filter(function(x){ return x.change && (x.nomenclature == nom.id) });

                if(!cover_changes.length) return;

                // Get cover change instances
                var changes = cover_changes.filter(function(x){ return x.year == _this.current_year });

                // Track to changes
                _.each(changes, function(change){
                    // Get nodes
                    var node_to = _.filter(nodes, function(node){ return node.year == _this.current_year && node.nomenclature == change.nomenclature})[0];
                    var node_from = _.filter(nodes, function(node){ return node.year == previous_year && node.nomenclature == change.nomenclature_previous})[0];

                    // Create link for changes
                    links.push({
                        source: node_from.id,
                        target: node_to.id,
                        value: change.area
                    });
                });
            });

            return {links: links, nodes: nodes};
        },

        createSankey: function(){
            var data = this.createLinksNodesChange();
            // Destroy previous chart
            if(this.chart) this.chart.destroy();

            var margin = {
                top: 1,
                right: 1,
                bottom: 6,
                left: 1
            };
            var width = 360 - margin.left - margin.right;
            var height = 200 - margin.top - margin.bottom;

            var formatNumber = d3.format(",.0f");
            var format = function(d) {
                return formatNumber(d) + " sqm";
            }
            color = d3.scale.category20();

            var svg = d3.select("#sankey").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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
                this.createChart();
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
