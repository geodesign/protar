define([
        'marionette',
        'bloodhound',
        'text!templates/items/search.html',
        'text!templates/items/search-region-result.html',
        'text!templates/items/search-site-result.html',
        'typeahead.js'
    ],
    function(
        Marionette,
        Bloodhound,
        template,
        templateRegionResult,
        templateSiteResult
    ){
    var SearchView = Marionette.ItemView.extend({
        template: _.template(template),

        ui: {
            input: '.typeahead',
        },

        onShow: function(){
            var _this = this;
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
                        header: '<h4 class="tt-header">Sites</h4>',
                        empty: '<h5 class="tt-header">No Natura2000 Sites found</h5>',
                        suggestion: _.template(templateSiteResult)
                    }
                },
                {
                    name: 'regions',
                    source: regions,
                    display: 'name',
                    limit: 500,
                    templates: {
                        header: '<hr><h4 class="tt-header">Regions</h4>',
                        empty: '<hr><h5 class="tt-header">No Regions found.</h5>',
                        suggestion: _.template(templateRegionResult)
                    }
                }
            );

            // Bind select event to navigate to site.
            this.ui.input.bind('typeahead:select', function(ev, suggestion) {
                // Decide if a site or a region was selected
                if(typeof suggestion.level == 'undefined'){
                    var urlbase = 'site/';
                } else {
                    var urlbase = 'region/';
                }
                // Navigate to page
                Backbone.history.navigate(urlbase + suggestion.id, {trigger: true});
                // Reset value on search field
                _this.ui.input.typeahead('val', '');
                _this.trigger('select');
            });
        }
    });
    return SearchView;
});
