define([
        'marionette',
        'text!templates/natura-template.html'
    ],
    function(
        Marionette,
        template
    ){
    var NaturaLayoutView = Marionette.LayoutView.extend({
      template: _.template(template),

      regions: {
        content: "#content"
      }
    });
    return NaturaLayoutView;
});
