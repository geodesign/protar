define([
        'backbone',
        'models/site'
    ], function(
        Backbone,
        Site
    ){

    var Collection = Backbone.Collection.extend({
        model: Site,
        url: '/api/site',
        parse : function(data) {
            return data.results;
        }
    });

    return Collection;
});
