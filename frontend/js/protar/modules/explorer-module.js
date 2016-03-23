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
                // Hide app region
                App.rootView.getRegion('appRegion').$el.hide();
                // Show explorer region
                var explorer_region = App.rootView.getRegion('explorerRegion');
                explorer_region.$el.show();
                // Render landing page
                var layout = new mapLayout();
                layout.render();
                explorer_region.show(layout);
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
