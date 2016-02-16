define(['backbone'], function(Backbone){

    var Model = Backbone.Model.extend({
        urlRoot: '/api/site',
        parse : function(data) {
            // Add all available years as a sorted array to attributes
            data.years = _.uniq(_.pluck(data.covers, 'year')).sort();
            return data;
        }
    });

    return Model;
});
