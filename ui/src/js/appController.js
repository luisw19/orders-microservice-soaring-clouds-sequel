/**
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'factories/OrderFactory', 'factories/CustomerFactory', 'ojs/ojknockout', 'ojs/ojmodel'],
  function(oj, ko, OrderFactory, CustomerFactory) {
    function ControllerViewModel() {
      var self = this;

      //for making customer fields editable in orders_summary page if not using anonymous
      self.isAnonymousMode = ko.observable(false);

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

      self.shoppingCart = ko.observable("shopping_cart");
      self.order = new oj.Model();
      self.customer = new oj.Model();
      self.contentLoaded = ko.observable(false);
      self.noShoppingBasket = ko.observable(false);

      self.init = function() {

        ///Added to test locally
        var servingHost = window.location.host;

        var apiKey = "API-KEY-PLACEHOLDER";
        if (servingHost.indexOf("localhost") !== -1) {
          //modify apiKey to test locally
          apiKey = "351801a3-0c02-41c1-b261-d0e5aaa4a0e6";
        }
        ////

        $.ajaxSetup({
          headers: {
            "api-key": apiKey
          }
        });

        // Listener to handle content from embedding application
        // Only applies as running in iFrame
        window.addEventListener("message", function(event) {
          console.log("Received message from embedding application " + event);
          console.log("Payload =  " + JSON.stringify(event.data));

          if (event.data.eventType === "globalContext") {

            if (event.data.payload.globalContext != null) {

              // if (event.data.payload.globalContext.customer != null && event.data.payload.globalContext.customer.customerIdentifier != null) {
              if (event.data.payload.globalContext != null) {

                self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.customer.customerIdentifier, "SHOPPING");
                // self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.orderId, "SHOPPING");

                self.order.fetch({
                  success: function(model, response, options) {

                    if (response.orders != null && response.orders.length == 0) {

                      self.noShoppingBasket(true);
                      self.contentLoaded(false);
                    } else {

                      self.order = OrderFactory.createOrderModel(self.order.get("orders")[0].order.order_id);

                      self.order.fetch({

                        success: function(model, response, options) {

                          var customerId = model.get("order").customer.customer_id;
                          //alert("Customer ID: " + customerId);

                          self.customer = CustomerFactory.createCustomerModel(customerId);
                          self.customer.fetch({
                            success: function(model, response, options) {

                              //self.order.get("order").customer = model.get("0");
                              self.order.get("order").customer = model;
                              self.noShoppingBasket(false);
                              self.contentLoaded(true);

                              //Set customer details in Order model based on response from Customer factory
                              self.order.get("order").customer.first_name = self.customer.get("firstName");
                              self.order.get("order").customer.last_name = self.customer.get("lastName");
                              var tlf = "";
                              if (self.customer.get("phoneNumbers").length > 1) {
                                tlf = '+' + self.customer.get("phoneNumbers")[0].countryCode + self.customer.get("phoneNumbers")[0].number;
                              }
                              self.order.get("order").customer.phone = tlf;
                              self.order.get("order").customer.email = self.customer.get("email");

                            },
                            error: function(model, xhr, options) {
                              alert("Error fetching Customer ID: " + customerId);
                            }
                          });

                        }

                      });

                    }

                  }

                });

              }

            } else {
              alert("Error - No Order ID passed into the application");
            }

          }

        }, false);

        parent.postMessage({
          "childHasLoaded": true
        }, "*");

      };

      $(document).ready(function() {

        oj.Logger.error(location);
        self.init();

        //added to test locally
        var servingHost = window.location.host;
        console.log("servingHost: " + servingHost);
        if (servingHost.indexOf("localhost") !== -1) {
          if (location.search != null) {
            var cartId = location.search.substr(location.search.indexOf("cartId=") + 7);
            // Simulate inbound event
            var event = new MessageEvent("message", {
              data: {
                "eventType": "globalContext",
                "payload": {
                  "globalContext": {
                    "customer": {
                      "customerIdentifier": cartId
                    }
                  }
                }
              }
            });
            oj.Logger.error(event);
            window.dispatchEvent(event);
          }
        };

      });

    }

    return new ControllerViewModel();

  }
);
