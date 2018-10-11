define(['ojs/ojcore'],
function (oj) {

    var CustomerFactory = {

        setCustomerURI: function(customerId) {
          return "API-GW-PLACEHOLDER/customer/profile/" + customerId;
          //return "https://oc-129-156-113-240.compute.oraclecloud.com:9022/customer/profile/" + customerId;
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
