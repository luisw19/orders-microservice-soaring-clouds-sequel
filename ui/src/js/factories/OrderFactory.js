define(['ojs/ojcore'],
function (oj) {

    var OrderFactory = {

        setOrderURI: function(orderId, type) {
            if (type === "SHOPPING") {
                return "API-GW-PLACEHOLDER/api/orders?shoppingCart_id=" + orderId + "&status=SHOPPING_CART";
                //return "https://oc-129-156-113-240.compute.oraclecloud.com:9022/api/orders?shoppingCart_id=" + orderId + "&status=SHOPPING_CART";
            } else {
                return "API-GW-PLACEHOLDER/api/orders/" + orderId;
                //return "https://oc-129-156-113-240.compute.oraclecloud.com:9022/api/orders/" + orderId;
            }
        },
        createOrderModel: function(orderId, type) {
            var Order = oj.Model.extend({
                urlRoot: this.setOrderURI(orderId, type),
                parseSave: function(request) {

                    if (request.order.payment != null) {

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
