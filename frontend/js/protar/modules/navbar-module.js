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
            this.layout = new NavbarLayoutView();
            App.rootView.getRegion('navbarRegion').show(this.layout);
        }
    });

    App.navbarModule = new NavbarModule();
});
