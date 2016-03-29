define([
        'backbone',
        'models/nomenclature'
    ], function(
        Backbone,
        Nomenclature
    ){

    var Collection = Backbone.Collection.extend({
        model: Nomenclature,
        url: '/api/nomenclature',
        parse: function(data){
            // Set color for unclassified to faint gray
            _.each(data, function(dat){
                if(dat.code_3 == '999' || dat.code_3 == '990'){
                    dat.color = '#EEEEEE';
                }
            });
            return data;
        }
    });

    return Collection;
});
