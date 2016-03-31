define([
        'marionette',
        'collections/layers',
        'views/collections/layers',
        'text!templates/layouts/layerswitcher.html'
    ],
    function(
        Marionette,
        Layers,
        LayersView,
        template
    ){

    return Marionette.LayoutView.extend({
        template: _.template(template),
        regions: {
            layers: '#layers',
        },
        ui: {
            head: '.panel-heading',
            title: '.current-layer-title',
            body: '#layers'
        },
        events: {
            'click @ui.head': 'toggle',
        },
        onRender: function(){
            var _this = this;

            // Instantiate and fetch corine landcover layer list
            var lyrs = new Layers();
            var lyr_view = new LayersView({collection: lyrs});
            lyrs.fetch().done(function(){
                _this.update(lyrs.models[0]);
            });
            this.getRegion('layers').show(lyr_view);

            // Hook selection events to layout view
            lyr_view.on('childview:clicked', function(args){
                _this.update(args.model);
            });
        },
        toggle: function(){
            this.ui.body.toggle();
        },

        update: function(model){
            this.ui.title.html(model.attributes.name);
            this.toggle();
            this.trigger('selected:layer', model);
        }
    });
});
