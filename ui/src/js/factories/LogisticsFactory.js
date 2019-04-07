define(['ojs/ojcore'],
function (oj) {

    var LogisticsFactory = {

        setLogisticsURI: function() {

        //uncomment to test without making call but comment other returns
        //return "data/logisticData.json";

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //modify apiGW to test locally
          //temp pointing to Lucas K8s
          //apiGW = "http://129.213.11.15"
          apiGW = "http://129.213.126.223:8011";
        }
        console.log("apiGW in LogisticsFactory: " + apiGW);
        //temp pointing to Lucas K8s
        //return apiGW + "/soaring/logistics/shipping/validate";
        return apiGW + "/logistics-ms/shipping/validate";
        },
        createLogisticsModel: function() {
            var Logistics = oj.Model.extend({
                urlRoot: this.setLogisticsURI()
            });
            return new Logistics();
        }
    };

    return LogisticsFactory;

});
