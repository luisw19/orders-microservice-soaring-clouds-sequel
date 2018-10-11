define(['ojs/ojcore'],
function (oj) {

    var AddressFactory = {

        setAddressURI: function(orderId) {
          return "API-GW-PLACEHOLDER/api/orders/" + orderId + "/address";
          //return "https://oc-129-156-113-240.compute.oraclecloud.com:9022/api/orders/" + orderId + "/address";
        },
        createAddressModel: function(orderId) {
            var Address = oj.Model.extend({
                urlRoot: this.setAddressURI(orderId)
            });
            return new Address();
        }
    };

    return AddressFactory;

});
