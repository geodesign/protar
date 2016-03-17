define([
        'marionette',
        'views/items/legend',
    ], function(
        Marionette,
        LegendItemView
    ){
    var CollectionView = Marionette.CollectionView.extend({
        childView: LegendItemView,
        className: 'list-group'
    });
    return CollectionView;
});
