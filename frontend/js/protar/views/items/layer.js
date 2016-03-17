define([
        'marionette'
    ], function(
        Marionette
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template('<%= name %>'),
        className: 'list-group-item'
    });
    return ItemView;
});
