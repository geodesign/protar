requirejs.config({
    paths: {
        jquery: '../../components/jquery/dist/jquery',
        bootstrap: '../../components/bootstrap/dist/js/bootstrap',
        underscore: '../../components/underscore/underscore',
        backbone: '../../components/backbone/backbone',
        marionette: '../../components/marionette/lib/backbone.marionette',
        text: '../../components/text/text',
        leaflet: '../../components/leaflet/dist/leaflet',
        chartjs: '../../components/chartjs/Chart',
        d3: '../../components/d3/d3',
        sankey: '../../components/d3-sankey/sankey/sankey',
        moment: '../../components/moment/moment'
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        },
        'underscore': {
            exports: '_'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'marionette': {
            deps: ['backbone'],
            exports: 'Marionette'
        },
        'leaflet': {
            exports: 'L'
        },
        'moment': {
            exports: 'moment'
        },
        'chartjs': {
            exports: 'Chart',
            deps: ['moment']
        },
        'sankey': {
            deps: ['d3']
        }
    }
});

require([
        'app',
        'bootstrap',
        'modules/navbar-module',
        'modules/landing-module',
        'modules/map-module',
        'modules/natura-module',
        'modules/country-module'
    ], function(
        App
    ){
    App.start();
    window.App = App
});
