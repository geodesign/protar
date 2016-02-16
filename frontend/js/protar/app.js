define([
        'marionette',
        'views/layouts/root'
    ], function(
        Marionette,
        RootView
    ){
    // Instantiate marionette app
    var App = new Marionette.Application();

    // Create layout view
    App.rootView = new RootView();

    // Start backbone history on App start
    App.on('start', function(){
        Backbone.history.start({pushState: false});
    });
    
    return App;
});
