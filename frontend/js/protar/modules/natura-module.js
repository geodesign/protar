define([
        'marionette',
        'leaflet',
        'chartjs',
        'app',
        'views/natura-layout'
    ],
    function(
        Marionette,
        L,
        Chart,
        App,
        NaturaLayoutView
    ){
    var NaturaModule = App.module('naturaModule', function(){
                // Add router to activate this module
        this.Router = Marionette.AppRouter.extend({
            appRoutes: {
                'natura': 'start'
            }
        });

        // Add controller
        this.Controller = function() {};

        _.extend(this.Controller.prototype, {

            start: function() {
                var natura = new NaturaLayoutView();
                natura.render();
                App.appRegion.show(natura);
                -1008871,4743790-1008871,4743790

                          // Map setup
              App.LMap = L.map('map', {
                center: new L.LatLng(39.19052, -9.04136),
                zoom: 11,
                minZoom: 0,
                maxZoom: 15
              });

              // Base layer
              var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

              L.tileLayer(osmUrl).addTo(App.LMap);
              //L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png').addTo(App.LMap);
                var data = {
                    labels: ["1990", "2000", "2006", "2012"],
                    datasets: [
                        {
                            label: "Urban",
                            fillColor: "rgba(220,220,220,0.5)",
                            strokeColor: "rgba(220,220,220,0.8)",
                            highlightFill: "rgba(220,220,220,0.75)",
                            highlightStroke: "rgba(220,220,220,1)",
                            data: [65, 59, 80, 81]
                        },
                        {
                            label: "Forrest",
                            fillColor: "rgba(151,187,205,0.5)",
                            strokeColor: "rgba(151,187,205,0.8)",
                            highlightFill: "rgba(151,187,205,0.75)",
                            highlightStroke: "rgba(151,187,205,1)",
                            data: [28, 48, 40, 19]
                        }
                    ]
                };


var data1 = [
    {
        value: 300,
        color:"#F7464A",
        highlight: "#FF5A5E",
        label: "Red"
    },
    {
        value: 50,
        color: "#46BFBD",
        highlight: "#5AD3D1",
        label: "Green"
    },
    {
        value: 100,
        color: "#FDB45C",
        highlight: "#FFC870",
        label: "Yellow"
    }
]

                    var ctx = natura.$el.find("#chart1")[0].getContext("2d");
                    var myBarChart = new Chart(ctx).Bar(data);
                    var ctx1 = natura.$el.find("#chart2")[0].getContext("2d");
// And for a doughnut chart
var myDoughnutChart = new Chart(ctx1).Doughnut(data1);
            
            }
        });

        this.addInitializer(function() {
            var controller = new this.Controller();
            new this.Router({
                controller: controller
            });
        });
    });
});
