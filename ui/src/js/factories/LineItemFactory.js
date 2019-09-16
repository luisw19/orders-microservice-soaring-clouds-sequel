define(['ojs/ojcore'],
  function(oj) {

    var LineItemFactory = {

      setLineItemURI: function(orderId, lineItemId) {

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          apiGW = "http://130.61.20.66:8011";
          //apiGW = "http://localhost:3000";
        }
        console.log("apiGW in LineItemFactory: " + apiGW);
        ///

        return apiGW + "/api/orders/" + orderId + "/lines/" + lineItemId;
      },
      createLineItemModel: function(orderId, lineItemId) {
        var LineItem = oj.Model.extend({
          urlRoot: this.setLineItemURI(orderId, lineItemId),
          idAttribute: 'line_id'
        });
        return new LineItem();
      }
    };

    return LineItemFactory;

  });
