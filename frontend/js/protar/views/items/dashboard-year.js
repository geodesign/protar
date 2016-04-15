define([
        'marionette',
        'leaflet',
        'chartjs',
        'd3',
        'app',
        'text!templates/items/dashboard-year.html',
        'sankey',
        'sync'
    ], function(
        Marionette,
        L,
        Chart,
        d3,
        App,
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

        ui: {
            map: '.map',
            chart_parent: '.chart-parent',
            sankey: '.sankey',
            sankey_panel: '.sankey-panel',
            percentage: '.percentage'
        },

        initialize: function(){
            // Make sure sankeys are responsive
            _.bindAll(this, 'createSankey');
            this.listenTo(App.menuView, 'changed:resize', this.createSankey);
        },

        onShow: function(){
            this.createAll();
        },

        createAll: function(){
            this.createChart();
            this.createMap();
            this.createSankey();
            this.createText();
        },

        createText: function(){
            var percentage =  Math.round(1000 * this.model.get('change_ratio')) / 10;
            var previous = this.model.get('previous_year')  ? this.model.get('previous_year') : 1990;

            var prefix = 'Change ' + previous + '-' + this.model.get('year') + ': ';
            if(!this.model.get('change_ratio')){
                this.ui.percentage.html('No change');
            } else if(percentage){
                this.ui.percentage.html(prefix + percentage + '%');
            } else {
                this.ui.percentage.html(prefix + '<0.1%');
            }
        },

        createChart: function(){
            var _this = this;
            // Remove existing chart
            if(this.chart){
                this.chart.destroy();
                this.ui.chart_parent.empty();
                this.ui.chart_parent.html('<canvas class="chart"></canvas>');
            }
            // Get data
            var data = this.model.get('aggregates').filter(function(x){return !x.change; });
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
            var ctx = this.ui.chart_parent.find('canvas')[0].getContext('2d');
            // Create chart
            this.chart = new Chart(ctx, {
                type: 'doughnut',
                data: chart_data,
                options: {
                    maintainAspectRatio: false,
                    legend: {
                        display: false
                    },
                    cutoutPercentage: 70
                }
            });
        },

        createMap: function(){
            var _this = this;
            // Instantiate maps if not done already
            if(!this.LMap) {
                // Get aggregation area geometry from model
                var site = L.geoJson(this.model.get('geom'), {
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
                this.LMap = L.map(this.ui.map[0], {
                    scrollWheelZoom: false,
                    attributionControl: false,
                    zoomControl: false
                }).fitBounds(bounds);

                this.LMap.addLayer(site);

                // Add zoom control to last map on the list
                this.LMap.addControl(L.control.zoom({position: 'bottomright'}));

                L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                }).addTo(this.LMap);
            }

            // Get colormap for corine layer
            var colormap_uri = encodeURIComponent(JSON.stringify(App.menuView.colormap));

            // Clear layer if exists
            if(this.tile_layer) {
                this.LMap.removeLayer(this.tile_layer);
            };
            this.tile_layer = L.tileLayer('/raster/tiles/'+ this.model.get('rasterlayer') +'/{z}/{x}/{y}.png?colormap=' + colormap_uri, {
                attribution: '&CLC EU'
            }).addTo(this.LMap);
        },

        createLinksNodesChange: function(){
            var _this = this;

            // Prepare data buckets and access shortcuts
            var nodes = {};
            var links = [];
            var node_index = 0;
            var year = this.model.get('year');
            var previous_year = this.model.get('previous_year');

            // Use aggregates for chart
            _.each(this.model.get('aggregates').filter(function(x){ return x.change; }), function(agg){
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

        createSankey: function(){
            // Reset previous if exists
            if(this.svg){
                this.svg.remove();
                this.ui.sankey.empty();
            }
            // Get updated links and nodes
            var data = this.createLinksNodesChange();
            // Ignore if no changes were found
            if(data.links.length == 0){
                this.ui.sankey_panel.hide();
                return;
            } else{
                this.ui.sankey_panel.show();
            }
            // Set size of sankey diagram as function of container size
            var margin = 10;
            var width = this.ui.sankey.width() - margin - margin;
            var height = data.links.length * 40;
            height = height - margin - margin;
            height = height > 500 ? 500 : height;
            height = height < 80 ? 80 : height;

            var formatNumber = d3.format(",.2f");
            var format = function(d) {
                return formatNumber(d) + " km2";
            }
            color = d3.scale.category20();

            this.svg = d3.select(this.ui.sankey[0]).append("svg")
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

            var link = this.svg.append("g").selectAll(".link")
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

            var node = this.svg.append("g").selectAll(".node")
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
        }
    });

    return ItemView;
});
