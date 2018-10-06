define(['ojs/ojcore'],
function (oj) {

    var LogisticsFactory = {

        setLogisticsURI: function() {
        return "data/logisticData.json";
        // return "API-GW-PLACEHOLDER/api/logistics/shipping/validate";
        //return "https://129.213.10.247/logistics-ms/app/shipping/validate";
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
