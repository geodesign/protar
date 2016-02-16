define([
        'marionette',
        'leaflet',
        'app',
        'models/site',
        'views/layouts/natura',
        'views/items/site'
    ],
    function(
        Marionette,
        L,
        App,
        Site,
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
                'natura(/:id)(/*name)': 'start'
            }
        }),

        Controller: Marionette.AppRouter.extend({
            start: function(id, name) {
                console.log('starting natura module with ', id, name);
                var site = new Site({id: id});
                var siteview = new SiteItemView({model: site});
                site.fetch().done(function(){
                    App.rootView.getRegion('appRegion').show(siteview);
                });
            }
        })
    });

    App.naturaModule = new NaturaModule();
});
