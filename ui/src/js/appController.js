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
                          console.log("customer: " + customerId);
                          self.customer = CustomerFactory.createCustomerModel(customerId);
                          self.customer.fetch({
                            success: function(model, response, options) {

                              //self.order.get("order").customer = model.get("0");
                              self.order.get("order").customer = model;
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

        oj.Logger.error(location);

        self.init();

        //added to test locally
        if (location.search != null) {

          var orderId = location.search.substr(location.search.indexOf("=") + 1);

          // Simulate inbound event
          var event = new MessageEvent("message", {
            data: {
              "eventType": "globalContext",
              "payload": {
                "globalContext": {
                  "orderId": "5bbc5cd590c4920011f96510",
                  "userName": "lweir@gmail.com",
                  "customer": {
                    "_id": "5bbc5cd590c4920011f96510",
                    "firstName": "Luis",
                    "lastName": "Weir",
                    "title": "Mr",
                    "email": "lweir@gmail.com",
                    "dateOfBirth": "1980-01-01T00:00:00.000Z",
                    "addresses": [{
                      "_id": "5bbc5cd590c4920011f96511",
                      "type": "BILLING",
                      "streetName": "King street",
                      "streetNumber": "22",
                      "city": "Warwick ",
                      "postcode": "CV22 3AB",
                      "country": "UK"
                    }],
                    "paymentDetails": [{
                      "_id": "5bbc5cd590c4920011f96512",
                      "type": "CREDIT",
                      "cardNumber": "1111-2222-3333-4444",
                      "expirationDate": "20-20",
                      "nameOnCard": "L WEIR"
                    }],
                    "preferences": {
                      "_id": "5bbc5cd590c4920011f96513",
                      "newsLetter": true,
                      "offers": true
                    },
                    "phoneNumbers": [],
                    "__v": 0,
                    "id": "5bbc5cd590c4920011f96510",
                    "customerIdentifier": "5bbc5cd590c4920011f96510"
                  }
                }
              }
            }
          });
          oj.Logger.error(event);

          window.dispatchEvent(event);

        }

      });

    }

    return new ControllerViewModel();

  }
);
