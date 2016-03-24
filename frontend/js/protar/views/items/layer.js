define([
        'marionette'
    ], function(
        Marionette
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template('<%= name %>'),
        tagName: 'a',
        className: 'list-group-item'
    });
    return ItemView;
});
