define(['ojs/ojcore', 'knockout'],
  function(oj, ko) {

    var ShippingFactory = {

      setShippingURI: function() {
        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //var apiGW = "http://private-c7255-shipment4.apiary-mock.com";
          apiGW = "http://129.213.126.223:8011";
        }
        var apiGW = apiGW + "/shippermarketplace/shipments";
        console.log("apiGW in ShippingFactory: " + apiGW);
        return apiGW;
      },

      createShippingModel: function() {

        var Shipping = oj.Model.extend({
          urlRoot: this.setShippingURI(),
          idAttribute: '_id'
        });
        return new Shipping();
      }
    };

    return ShippingFactory;

  });
