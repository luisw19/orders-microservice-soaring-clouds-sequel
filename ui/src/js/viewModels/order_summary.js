/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojcollapsible', 'ojs/ojformlayout', 'ojs/ojinputtext',
        'ojs/ojaccordion', 'ojs/ojinputnumber', 'ojs/ojmodel'
], function (oj, ko, $, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var customer = rootViewModel.order.get("customer");
        self.products = ko.observableArray();

        self.productDetailsExpanded = ko.observable(true);
        self.customerDetailsExpanded = ko.observable(true);
        self.orderId = ko.observable();
        self.orderPrice = ko.observable(0.00);
        self.orderCurrency = ko.observable();

        self.converter = oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_NUMBER).
          createConverter(
            {
              "maximumFractionDigits": 2,
              "minimumFractionDigits": 2,
              "minimumIntegerDigits": 1,
              "style": "decimal",
              "useGrouping": false
            });

        self.customerId = ko.observable();
        self.customerName = ko.observable();
        self.customerPhone = ko.observable();
        self.customerEmail = ko.observable();
        self.customerLoyaltyLevel = ko.observable();

        self.productLineId = ko.observable();
        self.productCode = ko.observable();
        self.productName = ko.observable();
        self.productDescription = ko.observable();
        self.productQuantity = ko.observable();

        self.handleAttached = function(info) {

          self.products(rootViewModel.order.get("order").line_items);

          self.orderId(rootViewModel.order.get("order").order_id);
          self.orderCurrency(rootViewModel.order.get("currency"));

          self.orderPrice(0.00);

          if (self.products() != null) {
            for (var i = 0; i < self.products().length; i++) {
              var newOrderPrice = parseFloat(self.orderPrice() + (self.products()[i].price * self.products()[i].quantity));
              self.orderPrice(newOrderPrice.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
            }
          } else {
            // Add line items object to model
            rootViewModel.order.set("line_items", [{}]);
          }

          // Customer Details
          if (customer != null) {
            self.customerId(customer.customer_id);
            self.customerName(customer.first_name + " " + customer.last_name);
            self.customerPhone(customer.phone);
            self.customerEmail(customer.email);
            self.customerLoyaltyLevel(customer.loyalty_level);
          } else {
            // Add customer object to model
            rootViewModel.order.set("customer", {});
          }

        };

        self.onQuantityChanged = function() {
            
            self.orderPrice(0.00);

            for (var i = 0; i < self.products.length; i++) {
              rootViewModel.order.get("line_items")[i].quantity = self.products[i].quantity; // Update controller with new changes
              var newOrderPrice = parseFloat(self.orderPrice() + (self.products[i].price * self.products[i].quantity));
              self.orderPrice(newOrderPrice.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
            }

        };

    }
    
    return new ShoppingCartViewModel();

});
