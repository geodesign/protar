define([
        'marionette',
        'views/items/legend',
    ], function(
        Marionette,
        LegendItemView
    ){
    var CollectionView = Marionette.CollectionView.extend({
        childView: LegendItemView,
        className: 'list-group',
        filter: function (child, index, collection) {
            // Filter water, unclassified, and nodata values
            return _.indexOf(['5', '9'], child.get('code_1')) < 0;
        }
    });
    return CollectionView;
});
