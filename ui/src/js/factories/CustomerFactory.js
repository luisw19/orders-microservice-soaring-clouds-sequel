define(['ojs/ojcore'],
function (oj) {

    var CustomerFactory = {

        setCustomerURI: function(customerId) {
          return "API-GW-PLACEHOLDER/api/customer/profile/" + customerId;
        },
        createCustomerModel: function(customerId) {
            var Customer = oj.Model.extend({
                urlRoot: this.setCustomerURI(customerId),
                idAttribute: '_id'
            });
            return new Customer();
        }
    };

    return CustomerFactory;

});
