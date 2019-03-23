define(['ojs/ojcore'],
  function(oj) {

    var AddressFactory = {

      setAddressURI: function(orderId) {

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //modify apiGW to test locally
          apiGW = "https://129.213.126.223:9022/api";
          //apiGW = "http://localhost:3000";
        }
        console.log("apiGW in AddressFactory: " + apiGW);
        ///

        return apiGW + "/orders/" + orderId + "/address";
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
