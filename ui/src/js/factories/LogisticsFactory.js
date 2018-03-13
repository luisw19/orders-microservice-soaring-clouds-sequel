define(['ojs/ojcore'],
function (oj) {

    var LogisticsFactory = {

        setLogisticsURI: function() {
          return "API-GW-PLACEHOLDER/api/logistics/shipping/validate";
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
