define([
        'marionette',
        'leaflet',
        'app',
        'views/layouts/map'
    ],
    function(
        Marionette,
        L,
        App,
        mapLayout
    ){
    var mapModule = App.module('mapModule', function(mod){

        // Add router to activate this module
        mod.Router = Marionette.AppRouter.extend({
            appRoutes: {
                'map': 'start'
            }
        });

        // Add controller
        mod.Controller = function() {};

        _.extend(mod.Controller.prototype, {

            start: function() {
                var layout = new mapLayout();
                layout.render();
                App.rootView.getRegion('appRegion').show(layout);
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
