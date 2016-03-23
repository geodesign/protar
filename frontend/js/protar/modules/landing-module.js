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
                // Hide explorer region
                App.rootView.getRegion('explorerRegion').$el.hide();
                // Show app region
                var app_region = App.rootView.getRegion('appRegion');
                app_region.$el.show();
                // Render landing page
                var layout = new LandingLayoutView();
                app_region.show(layout);

                // Bind to navigation event for main explorer button
                layout.on('navigate:explorer', function(){
                    // Hide app region
                    App.rootView.getRegion('appRegion').$el.hide();
                    // Show explorer region
                    var explorer_region = App.rootView.getRegion('explorerRegion');
                    explorer_region.$el.show();
                    // Render explorer if necessary
                    var triger_rendering = !explorer_region.hasView();
                    Backbone.history.navigate('explorer', {trigger: triger_rendering});
                });
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
