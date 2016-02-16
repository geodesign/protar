define([
        'marionette',
        'app',
        'views/layouts/country'
    ],
    function(
        Marionette,
        App,
        CountryLayoutView
    ){
    var countryModule = App.module('countryModule', function(){
                // Add router to activate this module
        this.Router = Marionette.AppRouter.extend({
            appRoutes: {
                'country': 'start'
            }
        });

        // Add controller
        this.Controller = function() {};

        _.extend(this.Controller.prototype, {

            start: function() {
                var country = new CountryLayoutView();
                country.render();
                App.appRegion.show(country);
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
