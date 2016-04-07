define([
        'marionette',
        'views/items/search',
        'text!templates/layouts/navbar.html'
    ],
    function(
        Marionette,
        Search,
        template
    ){
    var View = Marionette.LayoutView.extend({
        template: _.template(template),

        regions: {
            search: '.navbar-search-container'
        },

        ui: {
            navigate_home: '.navigate-home',
            navigate_dashboard: '.navigate-dashboard',
            navigate_explorer: '.navigate-explorer',
            search_toggle: '.navbar-toggle',
            navbar_dropdown: '.navbar-collapse'
        },

        triggers: {
            'click @ui.navigate_home': 'navigate:home',
            'click @ui.navigate_dashboard': 'navigate:dashboard',
            'click @ui.navigate_explorer': 'navigate:explorer'
        },

        onRender: function(){
            var _this = this;
            var search = new Search();
            search.render();
            this.getRegion('search').show(search);
            // Collapse element when search is selected.
            search.on('select', function(){
                if(_this.ui.search_toggle.is(':visible')){
                    _this.ui.navbar_dropdown.collapse('hide');
                }
            });
        }
    });
    return View;
});
