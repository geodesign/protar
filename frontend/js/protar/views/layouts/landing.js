define([
        'marionette',
        'bloodhound',
        'text!templates/layouts/landing.html',
        'typeahead.js',
    ],
    function(
        Marionette,
        Bloodhound,
        template
    ){
    var LandingLayoutView = Marionette.LayoutView.extend({
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

            // Create typeahead functionality.
            this.ui.input.typeahead(null, {
                name: 'sites',
                source: sites,
                display: 'sitename',
                limit: 500
            });

            // Bind select event to navigate to site.
            this.ui.input.bind('typeahead:select', function(ev, suggestion) {
                Backbone.history.navigate('natura/' + suggestion.id, {trigger: true});
            });
        }
    });
    return LandingLayoutView;
});
