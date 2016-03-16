define([
        'backbone',
        'models/regionGeo'
    ], function(
        Backbone,
        RegionGeo
    ){

    var Collection = Backbone.Collection.extend({
        model: RegionGeo,
        url: '/api/regiongeo'
    });

    return Collection;
});
