define(['ojs/ojcore'],
  function(oj) {

    var CustomerFactory = {

      setCustomerURI: function(customerId) {

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //modify apiGW to test locally
          apiGW = "https://oc-129-156-113-240.compute.oraclecloud.com:9022";
        }
        console.log("apiGW in CustomerFactory: " + apiGW);
        ///

        return apiGW + "/customer/profile/" + customerId;
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
