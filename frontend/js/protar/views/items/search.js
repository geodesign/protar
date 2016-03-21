define([
        'marionette',
        'bloodhound',
        'text!templates/items/search.html',
        'typeahead.js'
    ],
    function(
        Marionette,
        Bloodhound,
        template
    ){
    var SearchView = Marionette.ItemView.extend({
        template: _.template(template),

        ui: {
            input: '.typeahead',
        },

        onShow: function(){
            // Instantiate suggestion engine using sites api.
            var sites = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('sitecode'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                identify: function(obj){ return obj.id; },
                remote: {
                    url: '/api/site?search=%QUERY',
                    wildcard: '%QUERY',
                    transform: function(response){
                        return response.results;
                    }
                }
            });

            // Instantiate suggestion engine using sites api.
            var regions = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                identify: function(obj){ return obj.id; },
                remote: {
                    url: '/api/region?search=%QUERY',
                    wildcard: '%QUERY',
                    transform: function(response){
                        return response.results;
                    }
                }
            });

            // Create typeahead functionality.
            this.ui.input.typeahead(null,
                {
                    name: 'sites',
                    source: sites,
                    display: 'sitename',
                    limit: 500,
                    templates: {
                        header: '<h4 class="tt-header">Sites</h4>'
                    }
                },
                {
                    name: 'regions',
                    source: regions,
                    display: 'name',
                    limit: 500,
                    templates: {
                        header: '<hr><h4 class="tt-header">Regions</h4>'
                    }
                }
            );

            // Bind select event to navigate to site.
            this.ui.input.bind('typeahead:select', function(ev, suggestion) {
                if(typeof suggestion.inspireid == 'undefined'){
                    var urlbase = 'site/';
                } else {
                    var urlbase = 'region/';
                }
                Backbone.history.navigate(urlbase + suggestion.id, {trigger: true});
            });
        }
    });
    return SearchView;
});
