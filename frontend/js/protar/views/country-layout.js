define([
        'marionette',
        'text!templates/country-template.html'
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
