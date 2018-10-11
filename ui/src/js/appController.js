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

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

      self.shoppingCart = ko.observable("shopping_cart");
      self.order = new oj.Model();
      self.customer = new oj.Model();
      self.contentLoaded = ko.observable(false);
      self.noShoppingBasket = ko.observable(false);

      self.init = function() {

        $.ajaxSetup({
          headers: {
            "api-key": "API-KEY-PLACEHOLDER"
            //"api-key": "351801a3-0c02-41c1-b261-d0e5aaa4a0e6"
          }
        });

        // Listener to handle content from embedding application
        // Only applies as running in iFrame
        window.addEventListener("message", function(event) {
          console.log("Received message from embedding application " + event);
          console.log("Payload =  " + JSON.stringify(event.data));

          if (event.data.eventType === "globalContext") {

            if (event.data.payload.globalContext != null) {

              if (event.data.payload.globalContext.customer != null && event.data.payload.globalContext.customer.customerIdentifier != null) {

                self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.customer.customerIdentifier, "SHOPPING");

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
                          self.customer = CustomerFactory.createCustomerModel(customerId);
                          self.customer.fetch({
                            success: function(model, response, options) {

                              self.order.get("order").customer = model.get("0");
                              self.noShoppingBasket(false);
                              self.contentLoaded(true);

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

        self.init();

      });

    }

    return new ControllerViewModel();

  }
);
