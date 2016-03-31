define([
        'marionette'
    ], function(
        Marionette
    ){
    var ItemView = Marionette.ItemView.extend({
        template: _.template('<%= name %>'),
        tagName: 'a',
        className: 'list-group-item',
        triggers: {
            'click': 'clicked'
        }
    });
    return ItemView;
});
