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

        triggers: {
            'click @ui.navigate_explorer': 'navigate:explorer'
        },

        onRender: function(){
            var search = new SearchView();
            search.render();
            this.getRegion('search').show(search);
        }
    });
    return LandingLayoutView;
});
