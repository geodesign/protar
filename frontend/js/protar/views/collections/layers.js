define([
        'marionette',
        'views/items/layer',
    ], function(
        Marionette,
        LayerItemView
    ){
    var CollectionView = Marionette.CollectionView.extend({
        childView: LayerItemView,
        className: 'list-group'
    });
    return CollectionView;
});
