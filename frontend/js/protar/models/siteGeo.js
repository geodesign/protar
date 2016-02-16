define(['backbone'], function(Backbone){

    var Model = Backbone.Model.extend({
        urlRoot: '/api/sitegeo'
    });

    return Model;
});
