define([
        'marionette',
        'text!templates/map-template.html'
    ],
    function(
        Marionette,
        template
    ){
    var AppLayoutView = Marionette.LayoutView.extend({
      template: _.template(template),
      className: 'maplayout',

      regions: {
        mapRegion: "#map"
      }
    });

    return AppLayoutView;
});
