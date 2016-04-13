define([
        'marionette',
        'leaflet',
        'app',
        'models/site',
        'models/siteGeo',
        'models/region',
        'models/regionGeo',
        'views/layouts/natura',
        'views/items/natura'
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
        NaturaItemView
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
                // Reduce main region to container
                App.rootView.getRegion('mainRegion').$el.addClass('container');
                // Hide explorer and landing region
                App.rootView.getRegion('explorerRegion').$el.hide();
                App.rootView.getRegion('landingRegion').$el.hide();
                App.rootView.getRegion('menuRegion').$el.show();
                App.rootView.getRegion('menuRegion').$el.removeClass('menu-explorer');
                App.rootView.getRegion('navbarRegion').currentView.ui.burger.removeClass('navbar-hamburger-hide');
                // Reset region to make sure no previous data is shown
                var app_region = App.rootView.getRegion('appRegion');
                app_region.empty();
                // Render site or region view
                app_region.$el.show();
                var siteview = new NaturaItemView({model: this.model});
                this.model.fetch().done(function(){
                    App.rootView.getRegion('appRegion').show(siteview);
                });
            }
        })
    });

    App.naturaModule = new NaturaModule();
});
