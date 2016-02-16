define(['backbone'], function(Backbone){

    var Model = Backbone.Model.extend({
        urlRoot: '/api/nomenclature'
    });

    return Model;
});
