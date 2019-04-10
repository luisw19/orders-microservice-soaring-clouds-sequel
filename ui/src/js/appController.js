/**
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'factories/OrderFactory',
  'factories/CustomerFactory', 'ojs/ojarraydataprovider',
  'ojs/ojknockout', 'ojs/ojmodel', 'ojs/ojlabel', 'ojs/ojlistview'],
  function(oj, ko, OrderFactory, CustomerFactory, ArrayDataProvider) {
    function ControllerViewModel() {
      var self = this;

      //todays date used in shopping_cart and delivery options view models
      //Set tomorrow's dates
      self.today = new Date();
      self.dd = self.today.getDate()+1;
      self.mm = self.today.getMonth(); //January is 0!
      self.yyyy = self.today.getFullYear();
      self.tomorrow = new Date(self.yyyy, self.mm, self.dd);

      ///////////////////////////////////////////////
      //////// Added for Shipping Offers Feature
      self.disabledLogisticsNextStep = ko.observable(true);
      //Display the offers div
      self.displayOffersBlock = ko.observable(false);
      //Display the offers div
      self.displayOffers = ko.observable(false);
      //Display loading div
      self.displayLoading = ko.observable(false);
      //Display the loading bar
      self.offersLoadProgress = ko.observable(0);
      //dataSet
      // self.offersDataSet =
      //    [{id: 1, name: '', deliveryDate: '', 'price': 0},
      //     {id: 2, name: 'Fedex', deliveryDate: '12/04/2019', 'price': 3.0},
      //     {id: 3, name: 'Royal Mail', deliveryDate: '12/04/2019', 'price': 3.55},
      //     {id: 4, name: 'DHL', deliveryDate: '13/04/2019', 'price': 3.10},
      //     {id: 5, name: 'UPS', deliveryDate: '11/04/2019', 'price': 4.0}
      //    ];

      //create observable for the list
      self.shippingOffers = ko.observableArray(self.offersDataSet);
      ///////////////////////////////////////////////
      ///////////////////////////////////////////////


      ///////////////////////////////////////////////
      //Display the offers div
      self.displayOrdersBlock = ko.observable(false);

      //create observable for the list
      self.allOrders = ko.observableArray([]);

      self.ordersDataProvider = new ArrayDataProvider(self.allOrders, {
        keys: self.allOrders().map(function(value) {
          return value.orders.order_id;
        })
      });
      ///////////////////////////////////////////////
      ///////////////////////////////////////////////

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
      self.displayOrdersBlock = ko.observable(false);

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
          console.log("Embedding application event:" + event);
          console.log("Payload =  " + JSON.stringify(event.data));

          if (event.data.eventType === "globalContext") {

            // if (event.data.payload.globalContext.customer != null && event.data.payload.globalContext.customer.customerIdentifier != null) {
            if (event.data.payload.globalContext != null && event.data.payload.globalContext.sessionId) {

                self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.customer.customerIdentifier, "SHOPPING");
                // self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.orderId, "SHOPPING");

                self.order.fetch({
                  success: function(model, response, options) {

                    if (response.orders != null && response.orders.length == 0) {

                      self.noShoppingBasket(true);
                      self.contentLoaded(false);

                      //cretae model to obtain orders history
                      self.order = OrderFactory.createOrderModel(event.data.payload.globalContext.customer.customerIdentifier, "HISTORY");

                      self.order.fetch({
                        success: function(model, response, options) {
                          //display the block
                          self.displayOrdersBlock(true);
                          //create observable for the list
                          self.allOrders(response.orders);

                        }
                      });

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

          }

        }, false);

        parent.postMessage({
          "childHasLoaded": true
        }, "*");

      };

      $(document).ready(function() {

        oj.Logger.error(location);
        self.init();
        console.log("Event payload in document.ready=  " + JSON.stringify(event));

        //added to test only if run in localhost or event is not present
        var servingHost = window.location.host;
        console.log("servingHost: " + servingHost);
         if ( (servingHost.indexOf("localhost") !== -1) ) {
          if (location.search != null) {
            var cartId = location.search.substr(location.search.indexOf("cartId=") + 7);
            console.log("setting customerIdentifier in event to URI value:" + cartId);
            // Simulate inbound event
            var event = new MessageEvent("message", {
              data: {
                "eventType": "globalContext",
                "payload": {
                  "globalContext": {
                    "customer": {
                      "customerIdentifier": cartId
                    },
                    "sessionId":"avalue"
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
