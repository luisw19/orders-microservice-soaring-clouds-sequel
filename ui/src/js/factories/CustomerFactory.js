define(['ojs/ojcore'],
function (oj) {
    
    var CustomerFactory = {

        setCustomerURI: function(customerId) {
        //   return "https://oc-144-21-82-92.compute.oraclecloud.com:9129/api/customer/profile/" + customerId;
          return "data/customerData.json";
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