define([
        'marionette',
        'app',
        'views/navbar-layout'
    ],
    function(
        Marionette,
        App,
        NavbarLayoutView
    ){
    var mapModule = App.module('navbarModule', function(){
        this.addInitializer(function() {
            var nav = new NavbarLayoutView();
            App.navbarRegion.show(nav);
        });
    });
});
