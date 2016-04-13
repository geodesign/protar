define([
        'marionette',
        'leaflet',
        'app',
        'views/layouts/explorer'
    ],
    function(
        Marionette,
        L,
        App,
        mapLayout
    ){
    var mapModule = App.module('explorerModule', function(mod){

        // Add router to activate this module
        mod.Router = Marionette.AppRouter.extend({
            appRoutes: {
                'explorer': 'start'
            }
        });

        // Add controller
        mod.Controller = function() {};

        _.extend(mod.Controller.prototype, {

            start: function() {
                // Expand main region to full viewport
                App.rootView.getRegion('mainRegion').$el.removeClass('container');
                App.rootView.getRegion('menuRegion').$el.show();
                App.rootView.getRegion('menuRegion').$el.addClass('menu-explorer');
                App.rootView.getRegion('navbarRegion').currentView.ui.burger.removeClass('navbar-hamburger-hide');
                // Hide app and landing region
                App.rootView.getRegion('appRegion').$el.hide();
                App.rootView.getRegion('landingRegion').$el.hide();
                // Show explorer region
                var explorer_region = App.rootView.getRegion('explorerRegion');
                explorer_region.$el.show();
                // Render landing page if view not set already
                if(!explorer_region.hasView()){
                    var layout = new mapLayout();
                    layout.render();
                    explorer_region.show(layout);
                }
            }
        });

        mod.addInitializer(function() {
            var controller = new mod.Controller();
            new mod.Router({
                controller: controller
            });
        });
    });
});
