define([
        'backbone',
        'models/siteGeo'
    ], function(
        Backbone,
        SiteGeo
    ){

    var Collection = Backbone.Collection.extend({
        model: SiteGeo,
        url: '/api/sitegeo'
    });

    return Collection;
});
