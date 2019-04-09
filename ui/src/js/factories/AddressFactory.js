define(['ojs/ojcore'],
  function(oj) {

    var AddressFactory = {

      setAddressURI: function(orderId) {

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        var prefix = "/api";
        if (servingHost.indexOf("localhost") !== -1) {
          //modify apiGW to test locally
          apiGW = "http://129.213.126.223:8011";
          //apiGW = "http://localhost:3000";
          //prefix = "";
        }
        console.log("apiGW in AddressFactory: " + apiGW);
        ///

        return apiGW + prefix + "/orders/" + orderId + "/address";
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
