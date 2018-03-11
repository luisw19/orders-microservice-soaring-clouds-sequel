define(['ojs/ojcore'],
function (oj) {
    
    var AddressFactory = {

        setAddressURI: function(orderId) {
          return "https://oc-144-21-82-92.compute.oraclecloud.com:9129/api/orders/" + orderId + "/address";
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