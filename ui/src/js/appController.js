/**
 * Copyright (c) 2014, 2018, Oracle and/or its affiliates.
 * The Universal Permissive License (UPL), Version 1.0
 */
/*
 * Your application specific code will go here
 */
define(['ojs/ojcore', 'knockout', 'factories/OrderFactory', 'ojs/ojknockout', 'ojs/ojmodel'],
  function(oj, ko, OrderFactory) {
     function ControllerViewModel() {
       var self = this;

      // Media queries for repsonsive layouts
      var smQuery = oj.ResponsiveUtils.getFrameworkQuery(oj.ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      self.smScreen = oj.ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);

      self.shoppingCart = ko.observable("shopping_cart");
      self.order = new oj.Model();
      self.contentLoaded = ko.observable(false);

      self.init = function () {
        // Listener to handle content from embedding application
        // Only applies as running in iFrame
        window.addEventListener("message", function (event) {

            console.log("Received message from embedding application " + event);
            console.log("Payload =  " + JSON.stringify(event.data));

            if (event.data.eventType === "globalContext") {

                self.order = OrderFactory.createOrderModel(event.data.globalContext.orderId);
                self.order.fetch({
                  success: function(model, response, options) {
                    self.contentLoaded(true);
                  }
                });

            }

        }, false);

      };

      $(document).ready(function () {
        self.init();
        
        // Simulate dummy inbound event
        var event = new MessageEvent("message", {
            data: {
                eventType: "globalContext",
                globalContext: {
                    orderId: "unittest",
                    userName: "JNEATE"
                }
            }
        });
        window.dispatchEvent(event);

      });

     }

     return new ControllerViewModel();
  }
);
