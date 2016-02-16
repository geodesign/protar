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
        navbarRegion: '#navbarregion',
      }
    });
});
