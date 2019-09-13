define(['ojs/ojcore', 'knockout'],
  function(oj, ko) {

    var OffersFactory = {

      setOffersURI: function(orderId) {
        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //var apiGW = "http://private-c7255-shipment4.apiary-mock.com";
          apiGW = "http://129.213.126.223:8011";
        }
        var apiGW = apiGW + "/shippermarketplace/offers?orderId=" + orderId;
        console.log("apiGW in OffersFactory: " + apiGW);
        return apiGW;
      },

      createOffersModel: function() {

        var Offers = oj.Model.extend({
          urlRoot: this.setOffersURI(),
          idAttribute: '_id'
        });
        return new Offers();
      }
    };

    return OffersFactory;

  });
