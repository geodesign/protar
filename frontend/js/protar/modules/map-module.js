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
                App.appRegion.show(layout);

              // Map setup
              App.LMap = L.map('map', {

                center: new L.LatLng(54.546579538405034, 18.720703125),
                zoom: 4,
                minZoom: 0,
                maxZoom: 15
              });

              // Base layer
              L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png').addTo(App.LMap);
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
