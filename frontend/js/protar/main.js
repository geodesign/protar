requirejs.config({
    paths: {
        jquery: '../../components/jquery/dist/jquery',
        bootstrap: '../../components/bootstrap/dist/js/bootstrap',
        underscore: '../../components/underscore/underscore',
        backbone: '../../components/backbone/backbone',
        marionette: '../../components/marionette/lib/backbone.marionette',
        text: '../../components/text/text',
        leaflet: '../../components/leaflet/dist/leaflet',
        sync: '../../components/leaflet.sync/L.Map.Sync',
        chartjs: '../../components/Chart.js/dist/Chart',
        d3: '../../components/d3/d3',
        sankey: '../../components/d3-sankey/sankey/sankey',
        moment: '../../components/moment/moment',
        typeahead: '../../components/typeahead.js/dist/typeahead.bundle'
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
        },
        'sync': {
            deps: ['leaflet']
        }
    }
});

require([
        'app',
        'bootstrap',
        'typeahead',
        'modules/navbar-module',
        'modules/landing-module',
        'modules/explorer-module',
        'modules/dashboard-module'
    ], function(
        App
    ){
    App.start();
    window.App = App
});
