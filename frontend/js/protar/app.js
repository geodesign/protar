define([
        'marionette',
        'views/layouts/root',
        'views/layouts/menu'
    ], function(
        Marionette,
        RootView,
        MenuView
    ){
    // Instantiate marionette app
    var App = new Marionette.Application();

    // Create layout view
    App.rootView = new RootView();

    // Create menu
    App.menuView = new MenuView();
    var menu_region = App.rootView.getRegion('menuRegion');
    menu_region.show(App.menuView);

    // Start backbone history on App start
    App.on('start', function(){
        Backbone.history.start({pushState: true});
    });
    
    return App;
});
