define([
        'backbone',
        'models/layer'
    ], function(
        Backbone,
        Layer
    ){

    var Collection = Backbone.Collection.extend({
        model: Layer,
        url: '/api/corinelayer'
    });

    return Collection;
});
