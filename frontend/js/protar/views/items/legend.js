define([
        'marionette',
        'text!templates/items/legend.html',
    ], function(
        Marionette,
        template
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template(template),
        className: 'list-group-item'
    });
    return ItemView;
});
