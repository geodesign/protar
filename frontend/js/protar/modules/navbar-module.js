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
        }
    });

    App.navbarModule = new NavbarModule();
});
