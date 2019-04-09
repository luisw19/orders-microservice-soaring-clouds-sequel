define(['ojs/ojcore', 'knockout'],
  function(oj, ko) {

    var OffersFactory = {

      setOffersURI: function(orderId) {
        ///Added to test locally
        var servingHost = window.location.host;
        //var apiGW = "https://private-c7255-shipment4.apiary-mock.com/shippermarketplace/offers?orderId=" + orderId;
        var apiGW = "http://129.213.126.223:8011/shippermarketplace/offers?orderId=" + orderId;
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
