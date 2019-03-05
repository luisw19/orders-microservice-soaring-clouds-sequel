define(['ojs/ojcore','knockout'],
  function(oj,ko) {

    var CustomerFactory = {

      setCustomerURI: function(customerId) {

        //If user is anonymous (meaning not signed in) then don't call customer service
        if (customerId.indexOf("anonymous") == 0) {
          console.log("apiGW in CustomerFactory: " + "Anonymous user. Not calling customer service.");

          //set global isAutonomousMode to true
          var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
          rootViewModel.isAutonomousMode(true);

          //return JSON
          return "data/anonymous.json";
        }else{
          ///Added to test locally
          var servingHost = window.location.host;
          var apiGW = "API-GW-PLACEHOLDER";
          if (servingHost.indexOf("localhost") !== -1) {
            //modify apiGW to test locally
            apiGW = "https://129.213.126.223:9022";
          }
          console.log("apiGW in CustomerFactory: " + apiGW);

          //return apiGW + "/customer/profile/" + customerId;
        };
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
