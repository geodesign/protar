define([
        'marionette'
    ],
    function(
        Marionette
    ){

    return Marionette.LayoutView.extend({
        el: 'body',

        regions: {
            mainRegion: '.main-content',
            landingRegion: '#landingregion',
            appRegion: '#appregion',
            explorerRegion: '#explorerregion',
            navbarRegion: '#navbarregion',
            menuRegion: '#menuregion'
        }
    });
});
