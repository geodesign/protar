define([
        'marionette'
    ], function(
        Marionette
    ){
    // Instantiate marionette app
    var App = new Marionette.Application();

    // Create regions
    App.addRegions({
        appRegion: '#appregion',
        navbarRegion: '#navbarregion',
    });

    // Start backbone history on App start
    App.on('start', function(options){
        Backbone.history.start();
    });
    
    return App;
});
