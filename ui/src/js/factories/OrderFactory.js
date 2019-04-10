define(['ojs/ojcore'],
  function(oj) {

    var OrderFactory = {

      setOrderURI: function(inputId, type) {
        ///Added to test locally
        var servingHost = window.location.host;
        var apiGW = "API-GW-PLACEHOLDER";
        var prefix = "/api";
        if (servingHost.indexOf("localhost") !== -1) {
          apiGW = "http://129.213.126.223:8011";
          //apiGW = "http://localhost:3000";
          //prefix = "";
        }

        if (type === "SHOPPING") {
          apiGW = apiGW + prefix + "/orders?shoppingCart_id=" + inputId + "&status=SHOPPING_CART";
        } else if (type === "HISTORY") {
          apiGW = apiGW + prefix + "/orders?customer_id=" + inputId;
        } else {
          apiGW = apiGW + prefix + "/orders/" + inputId;
        }
        console.log("apiGW in OrderFactory: " + apiGW);
        return apiGW;

        ///
      },
      createOrderModel: function(inputId, type) {
        var Order = oj.Model.extend({
          urlRoot: this.setOrderURI(inputId, type),
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
