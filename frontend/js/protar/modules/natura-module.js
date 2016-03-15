define([
        'marionette',
        'leaflet',
        'app',
        'models/site',
        'models/siteGeo',
        'models/region',
        'models/regionGeo',
        'views/layouts/natura',
        'views/items/site'
    ],
    function(
        Marionette,
        L,
        App,
        Site,
        SiteGeo,
        Region,
        RegionGeo,
        NaturaLayoutView,
        SiteItemView
    ){

    var NaturaModule = Marionette.Object.extend({

        initialize: function(){
            var controller = new this.Controller();
            this.router = new this.Router({controller: controller});
        },

        Router: Marionette.AppRouter.extend({
            appRoutes: {
                'site/:id(/*name)': 'start_site',
                'region/:id(/*name)': 'start_region'
            }
        }),

        Controller: Marionette.AppRouter.extend({
            start_site: function(id){
                var geo = new SiteGeo({id: id});
                this.model = new Site({id: id, geom: geo});
                this.start();
            },

            start_region: function(id){
                var geo = new RegionGeo({id: id});
                this.model = new Region({id: id, geom: geo});
                this.start();
            },

            start: function() {
                var siteview = new SiteItemView({model: this.model});

                this.model.fetch().done(function(){
                    App.rootView.getRegion('appRegion').show(siteview);
                });
            }
        })
    });

    App.naturaModule = new NaturaModule();
});
