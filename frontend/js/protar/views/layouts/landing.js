define([
        'marionette',
        'views/items/search',
        'text!templates/layouts/landing.html'
    ],
    function(
        Marionette,
        SearchView,
        template
    ){
    var LandingLayoutView = Marionette.LayoutView.extend({
        template: _.template(template),

        regions: {
            search: '.search-container'
        },

        ui: {
            navigate_explorer: '.navigate-explorer'
        },

        events: {
            'click @ui.navigate_explorer': 'navigateExplorer'
        },

        navigateExplorer: function(){
            Backbone.history.navigate('explorer', {trigger: true});
        },

        onRender: function(){
            var search = new SearchView();
            search.render();
            this.getRegion('search').show(search);
        }
    });
    return LandingLayoutView;
});
