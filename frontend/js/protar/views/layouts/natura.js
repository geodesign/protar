define([
        'marionette',
        'text!templates/layouts/natura.html'
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
