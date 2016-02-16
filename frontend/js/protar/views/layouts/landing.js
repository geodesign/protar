define([
        'marionette',
        'text!templates/layouts/landing.html'
    ],
    function(
        Marionette,
        template
    ){
    var LandingLayoutView = Marionette.LayoutView.extend({
      template: _.template(template),

      regions: {
        content: "#content"
      }
    });
    return LandingLayoutView;
});
