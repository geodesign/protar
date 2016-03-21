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
        onRender: function(){
            var search = new Search();
            search.render();
            this.getRegion('search').show(search);
        }
    });
    return View;
});
