define([
        'marionette',
        'text!templates/layouts/navbar.html'
    ],
    function(
        Marionette,
        template
    ){
    var View = Marionette.LayoutView.extend({
        template: _.template(template)
    });
    return View;
});
