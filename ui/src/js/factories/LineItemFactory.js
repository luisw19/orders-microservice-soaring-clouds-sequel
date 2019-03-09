define(['ojs/ojcore'],
  function(oj) {

    var LineItemFactory = {

      setLineItemURI: function(orderId, lineItemId) {

        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //apiGW = "https://129.213.126.223:9022/api";
          apiGW = "http://localhost:3000";
        }
        console.log("apiGW in LineItemFactory: " + apiGW);
        ///

        return apiGW + "/orders/" + orderId + "/lines/" + lineItemId;
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
