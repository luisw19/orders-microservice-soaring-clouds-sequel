define(['ojs/ojcore'],
  function(oj) {

    var OrderFactory = {

      setOrderURI: function(orderId, type) {
        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        var prefix = "/api";
        if (servingHost.indexOf("localhost") !== -1) {
          //apiGW = "https://129.213.126.223:9022";
          apiGW = "http://localhost:3000";
          prefix = "";
        }
        console.log("apiGW in OrderFactory: " + apiGW);
        ///

        if (type === "SHOPPING") {
          return apiGW + prefix + "/orders?shoppingCart_id=" + orderId + "&status=SHOPPING_CART";
        } else {
          return apiGW + prefix + "/orders/" + orderId;
        }
      },
      createOrderModel: function(orderId, type) {
        var Order = oj.Model.extend({
          urlRoot: this.setOrderURI(orderId, type),
          parseSave: function(request) {
            if (request.order.payment != null) {
              //alert(JSON.stringify(request.order.payment));
              return {
                "payment": request.order.payment,
                "customer": {
                  "loyalty_level": request.order.customer.loyalty_level,
                  "first_name": request.order.customer.first_name,
                  "last_name": request.order.customer.last_name,
                  "phone": request.order.customer.phone,
                  "email": request.order.customer.email
                },
                "shipping": request.order.shipping,
                "special_details": request.order.special_details
              };

            } else {

              return {
                "customer": {
                  "loyalty_level": request.order.customer.loyalty_level,
                  "first_name": request.order.customer.first_name,
                  "last_name": request.order.customer.last_name,
                  "phone": request.order.customer.phone,
                  "email": request.order.customer.email
                },
                "shipping": request.order.shipping,
                "special_details": request.order.special_details
              };

            }

          },
          idAttribute: '_id'
        });
        return new Order();
      }
    };

    return OrderFactory;

  });
