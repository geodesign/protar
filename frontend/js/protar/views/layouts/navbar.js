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
            navigate_explorer: '.navigate-explorer',
            search_toggle: '.navbar-toggle',
            navbar_dropdown: '.navbar-collapse'
        },

        triggers: {
            'click @ui.navigate_home': 'navigate:home',
            'click @ui.navigate_explorer': 'navigate:explorer'
        },

        onRender: function(){
            var _this = this;
            var search = new Search();
            search.render();
            this.getRegion('search').show(search);
            // Allow overflow, but only if menu is opened already
            this.ui.navbar_dropdown.on('shown.bs.collapse', function() {
                _this.ui.navbar_dropdown.addClass('navbar-collapse-overflow-visible');
            }).on('hide.bs.collapse', function() {
                _this.ui.navbar_dropdown.removeClass('navbar-collapse-overflow-visible');
            });
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
