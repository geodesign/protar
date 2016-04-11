define([
        'marionette',
        'app',
        'views/layouts/navbar'
    ],
    function(
        Marionette,
        App,
        NavbarLayoutView
    ){
        
    var NavbarModule = Marionette.Object.extend({
        initialize: function(){
            // Render navigation bar
            var layout = new NavbarLayoutView();
            App.rootView.getRegion('navbarRegion').show(layout);

            // Bind to navigation event from navbar
            layout.on('navigate:explorer', function(){
                // Expand main region to container
                App.rootView.getRegion('mainRegion').$el.removeClass('container');
                App.rootView.getRegion('menuRegion').$el.show();
                App.rootView.getRegion('menuRegion').$el.addClass('menu-explorer');
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

    App.navbarModule = new NavbarModule();
});
