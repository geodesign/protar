define([
        'marionette'
    ],
    function(
        Marionette
    ){

    return Marionette.LayoutView.extend({
        el: 'body',

        regions: {
            appRegion: '#appregion',
            explorerRegion: '#explorerregion',
            navbarRegion: '#navbarregion'
        }
    });
});
