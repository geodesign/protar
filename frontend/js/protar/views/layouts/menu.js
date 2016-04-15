define([
        'marionette',
        'leaflet',
        'collections/nomenclatures',
        'views/collections/legends',
        'text!templates/layouts/menu.html'
    ],
    function(
        Marionette,
        L,
        Nomenclatures,
        LegendView,
        template
    ){
    var View = Marionette.LayoutView.extend({
        template: _.template(template),
        className: 'menu-layout',
        initialize: function(){
            var _this = this;
            _.bindAll(this, 'createLegend');
            this.current_level = 1;
            this.current_year = 2012;
            this.exclude = [];
            this.colormap = {};

            // Instantiate Legend
            this.nomenclatures = new Nomenclatures();
            this.nomenclatures.fetch().done(function(){
                _this.createLegend();
                _this.createColormap();
            });

            // Trigger resize event when window is resized, this is used
            // on the natura interface to redraw charts.
            $(window).on("resize", function(){
                _this.trigger('changed:resize');
            });
        },

        regions: {
            legend: '.legend'
        },

        ui: {
            levels: '.levels',
            years: '.years',
            context: '.context-map'
        },

        events: {
            'click @ui.levels': 'change_level',
            'click @ui.years': 'change_year'
        },

        change_level: function(e){
            var el = $(e.target);
            // Ignore event if level is already active
            if(el.hasClass('active')) return;
            // Make new button active
            el.addClass('active').siblings().removeClass('active');
            // Clear current selection array and colormap
            this.exclude = [];
            // Set current level and update legend
            this.current_level = el.data('level');
            this.createLegend();
            this.createColormap();
            // Trigger level change event
            this.trigger('changed:level');
        },

        change_year: function(e){
            var el = $(e.target);
            // Ignore event if level is already active
            if(el.hasClass('active')) return;
            // Make new button active or deactivate target
            el.addClass('active').siblings().removeClass('active');
            // Update current year
            this.current_year = el.hasClass('active') ? el.data('year') : null;
            // Trigger level change event
            this.trigger('changed:year');
        },

        createLegend: function(){
            var _this = this;
            // Make sure nomenclatures are sorted
            this.nomenclatures.sortBy('code_3');
            // Attach label attribute based on level
            this.nomenclatures.each(function(nom){ nom.attributes.label = nom.attributes['label_' + _this.current_level]; });
            // Group by code and pick first element of each group (assumes preordering)
            var level_noms = this.nomenclatures.groupBy('code_' + _this.current_level);
            level_noms = _.map(level_noms, function(group){ return group[0]});
            // Convert list to collection
            level_noms = new Backbone.Collection(level_noms);
            // Create and show legend view
            var noms_view = new LegendView({collection: level_noms});
            this.getRegion('legend').show(noms_view);

            noms_view.on('childview:clicked', function(view){
                view.$el.toggleClass('active');
                var code = view.model.attributes['code_' + _this.current_level];
                var index = _.indexOf(_this.exclude, code);
                if(index < 0) {
                    _this.exclude.push(code);
                } else {
                    _this.exclude.pop(index);
                }
                _this.createColormap();
                _this.trigger('changed:legend');
            });
        },

        createColormap: function(){
            var _this = this;
            this.colormap = {};
            var level_noms = this.nomenclatures.groupBy('code_' + _this.current_level);
            _.each(level_noms, function(group, code){
                // Ignore water, unclassified and nodata
                if(_.indexOf(['5', '9'], code.substr(0, 1)) >= 0) return;
                // Ignore excluded elements
                if(_.indexOf(_this.exclude, code) >= 0) return;
                // Get color from first group member (assumes preordering)
                var color = group[0].attributes.color;
                // Set this first color for all group members
                _.each(group, function(nom){
                    _this.colormap[nom.attributes.grid_code] = color;
                });
            });
        },

        createContextMap: function(geom){
            if(!this.LMap){
                this.LMap = L.map(this.ui.context[0], {
                    center: L.latLng(geom.coordinates[1], geom.coordinates[0]),
                    zoom: 3,
                    scrollWheelZoom: false,
                    attributionControl: false,
                    zoomControl: false,
                    dragging: false,
                    touchZoom: false,
                    doubleClickZoom:false,
                    boxZoom: false,
                    tap: false
                });

                L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',{
                    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                }).addTo(this.LMap);
            } else {
                this.LMap.removeLayer(this.marker);
            }
            this.marker = L.marker(
                [geom.coordinates[1], geom.coordinates[0]],
                {clickable: false}
            ).addTo(this.LMap);
            this.LMap.setView(L.latLng(geom.coordinates[1], geom.coordinates[0]));
        }
    });
    return View;
});
