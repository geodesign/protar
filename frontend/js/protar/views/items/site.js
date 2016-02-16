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
            this.current_level = 3;

            // Get complete nomenclatures list
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(function(){
                _this.createChart();
                _this.createMap();
                //_this.createStackedChart();
                //var data = _this.createLinksNodes();
                //_this.createSankey(data);
            });
        },

        ui: {
            year: 'button.year',
            level: 'button.level'
        },

        events: {
            'click @ui.year': 'changed',
            'click @ui.level': 'changed'
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

        createLinksNodes: function(){
            var _this = this;
            // Prepare data buckets and access shortcuts
            var all_covers = this.model.attributes.covers
            var nodes = [];
            var links = [];
            var node_index = 0;

            // Create nodes for all year/nomenclature combinations
            this.nomenclatures.each(function(nom){
                _.each(_this.model.attributes.years, function(year, idx){
                    // Only include covers that are present in this site
                    var covers = all_covers.filter(function(x){ return x.nomenclature == nom.id || x.nomenclature_previous == nom.id; });
                    if(!covers.length) return;
                    // Get shortened label
                    var name = nom.attributes.label_3;
                    if(name.length > 20) name = name.substr(0, 20) + '...';

                    nodes.push({id: node_index, nomenclature: nom.id, year: year, name: name  + ' ' + year, color: nom.attributes.color});
                    node_index++;
                });
            });

            // Process data by nomenclature
            this.nomenclatures.each(function(nom){
                // Filter covers by nomenclature
                var covers = all_covers.filter(function(x){ return !x.change && (x.nomenclature == nom.id) });
                var cover_changes_to = all_covers.filter(function(x){ return x.change && (x.nomenclature == nom.id) });
                var cover_changes_from = all_covers.filter(function(x){ return x.change && (x.nomenclature_previous == nom.id) });

                // Return if no cover has been found
                if(!covers.length) return;

                // Process years
                _.each(_this.model.attributes.years, function(year, idx){
                    // Skip on first year, this is about comparing two years
                    if(idx == 0) return;

                    // Get current and previous cover instances
                    var current = covers.filter(function(x){ return x.year == year; });
                    var previous = covers.filter(function(x){ return x.year == this.model.attributes.years[idx - 1]; });

                    // Get cover change instances
                    var changes_to = cover_changes_to.filter(function(x){ return x.year == year });
                    var changes_from = cover_changes_from.filter(function(x){ return x.year == year });

                    // Extract values from instances, if they exist the current and previous
                    // cover for this year can only be one.
                    var current_value = current.length ? current[0].area : 0;
                    var previous_value = previous.length ? previous[0].area : 0;

                    var balance_to = current_value;
                    var balance_from = previous_value;

                    // Track to changes
                    _.each(changes_to, function(change){
                        // Substract this change from balance
                        balance_to -= change.area;

                        // Get nodes
                        var node_to = _.filter(nodes, function(node){ return node.year == year && node.nomenclature == change.nomenclature})[0];
                        var node_from = _.filter(nodes, function(node){ return node.year == _this.model.attributes.years[idx - 1] && node.nomenclature == change.nomenclature_previous})[0];

                        // Create link for changes
                        links.push({
                            source: node_from.id,
                            target: node_to.id,
                            value: change.area
                        });
                    });

                    // Track from changes
                    _.each(changes_from, function(change){
                        // Substract this change from balance
                        balance_from -= change.area;
                        // Create link
                    });

                    // Make consistency check
                    console.log('Consistency check', balance_from, balance_to, balance_from - balance_to);

                    // Create link for unchanged habitat
                    var node_to = _.filter(nodes, function(node){ return node.year == year && node.nomenclature == nom.id})[0];
                    var node_from = _.filter(nodes, function(node){ return node.year == _this.model.attributes.years[idx - 1] && node.nomenclature == nom.id})[0];
                    links.push({
                        source: node_from.id,
                        target: node_to.id,
                        value: balance_from
                    });
                });
            });

            return {links: links, nodes: nodes};
        },

        createSankey: function(data){
            var margin = {
                top: 1,
                right: 1,
                bottom: 6,
                left: 1
            };
            var width = 960 - margin.left - margin.right;
            var height = 500 - margin.top - margin.bottom;

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
        }
    });

    return ItemView;
});
