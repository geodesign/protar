define(['backbone'], function(Backbone){

    var Model = Backbone.Model.extend({
        urlRoot: '/api/corinelayer'
    });

    return Model;
});
