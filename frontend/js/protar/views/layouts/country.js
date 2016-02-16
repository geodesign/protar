define([
        'marionette',
        'text!templates/layouts/country.html'
    ],
    function(
        Marionette,
        template
    ){
    var CountryLayoutView = Marionette.LayoutView.extend({
      template: _.template(template),

      regions: {
        content: "#content"
      }
    });
    return CountryLayoutView;
});
