define(['ojs/ojcore'],
function (oj) {

    var LogisticsFactory = {

        setLogisticsURI: function() {
        //return "data/logisticData.json";
        //return "API-GW-PLACEHOLDER/logistics-ms/shipping/validate";
        return "https://oc-129-156-113-240.compute.oraclecloud.com:9022/logistics-ms/shipping/validate";
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
