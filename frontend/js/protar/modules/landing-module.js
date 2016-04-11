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
                // Reduce main region to container
                App.rootView.getRegion('mainRegion').$el.addClass('container');
                // Hide menu, app and explorer region
                App.rootView.getRegion('explorerRegion').$el.hide();
                App.rootView.getRegion('appRegion').$el.hide();
                App.rootView.getRegion('menuRegion').$el.hide();
                // Show app region
                var landing_region = App.rootView.getRegion('landingRegion');
                landing_region.$el.show();
                // Render landing page
                var layout = new LandingLayoutView();
                landing_region.show(layout);

                // Bind to navigation event for main explorer button
                layout.on('navigate:explorer', function(){
                    // Expand main region to container
                    App.rootView.getRegion('mainRegion').$el.removeClass('container');
                    App.rootView.getRegion('menuRegion').$el.show();
                    // Hide app region
                    App.rootView.getRegion('appRegion').$el.hide();
                    App.rootView.getRegion('landingRegion').$el.hide();
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
