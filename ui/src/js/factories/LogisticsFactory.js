define(['ojs/ojcore','knockout'],
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
          //apiGW = "http://130.61.20.66:8011";
          return "data/logisticData.json";
        }
        console.log("apiGW in LogisticsFactory: " + apiGW);
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
