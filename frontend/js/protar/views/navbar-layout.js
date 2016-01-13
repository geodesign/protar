define([
        'marionette',
        'text!templates/navbar-template.html'
    ],
    function(
        Marionette,
        template
    ){
    var NavbarLayoutView = Marionette.LayoutView.extend({
      template: _.template(template),

      regions: {
        navbarMainRegion: "#navbar-main"
      }
    });
    return NavbarLayoutView;
});
