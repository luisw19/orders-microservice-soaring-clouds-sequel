define(['ojs/ojcore'],
function (oj) {
    
    var LogisticsFactory = {

        setLogisticsURI: function() {
        //   return "https://oc-144-21-82-92.compute.oraclecloud.com:9129/api/logistics/shipping/validate";
          return "data/logisticData.json";
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