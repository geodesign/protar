define([
        'marionette',
        'app',
        'views/layouts/landing'
    ],
    function(
        Marionette,
        App,
        LandingLayoutView
    ){
    var mapModule = App.module('landingModule', function(){
        // Add router to activate this module
        this.Router = Marionette.AppRouter.extend({
            appRoutes: {
                '': 'start'
            }
        });

        // Add controller
        this.Controller = function() {};

        _.extend(this.Controller.prototype, {

            start: function() {
                var layout = new LandingLayoutView();
                App.rootView.getRegion('appRegion').show(layout);
            }
        });

        this.addInitializer(function() {
            var controller = new this.Controller();
            new this.Router({
                controller: controller
            });
        });
    });
});
