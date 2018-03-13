define(['ojs/ojcore'],
function (oj) {

    var AddressFactory = {

        setAddressURI: function(orderId) {
          return "API-GW-PLACEHOLDER/api/orders/" + orderId + "/address";
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
