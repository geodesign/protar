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

                // Map setup
                var LMap = L.map('map', {
                    center: new L.LatLng(54.546579538405034, 18.720703125),
                    zoom: 4,
                    minZoom: 0,
                    maxZoom: 15
                });

                // Base layer
                //L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png').addTo(LMap);

                // Base layer
                var basemap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',{
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                }).addTo(LMap);

                L.tileLayer('/raster/tiles/2/{z}/{x}/{y}.png').addTo(LMap);

                // Labelmap with streets
                var labelmap = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png',{
                  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
                }).addTo(LMap);

                // Make sure streets are overlaid on top
                LMap.getPanes().overlayPane.appendChild(labelmap.getContainer());
                labelmap.setZIndex(9999);
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
