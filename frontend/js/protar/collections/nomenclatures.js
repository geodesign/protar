define([
        'backbone',
        'models/nomenclature'
    ], function(
        Backbone,
        Nomenclature
    ){

    var Collection = Backbone.Collection.extend({
        model: Nomenclature,
        url: '/api/nomenclature'
    });

    return Collection;
});
