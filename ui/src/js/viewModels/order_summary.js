/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojcollapsible', 'ojs/ojformlayout', 'ojs/ojinputtext',
        'ojs/ojaccordion', 'ojs/ojinputnumber'
], function (oj, ko, $, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var customer = rootViewModel.order.get("customer");
        self.products = rootViewModel.order.get("line_items");

        oj.Logger.error(self.products[0]);

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

          self.orderId(rootViewModel.order.get("order_id"));
          self.orderCurrency(rootViewModel.order.get("currency"));

          for (var i = 0; i < self.products.length; i++) {
            self.orderPrice((self.orderPrice() + (self.products[i].price * self.products[i].quantity)).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
          }

          // Customer Details
          self.customerId(customer.customer_id);
          self.customerName(customer.first_name + " " + customer.last_name);
          self.customerPhone(customer.phone);
          self.customerEmail(customer.email);
          self.customerLoyaltyLevel(customer.loyalty_level);

          // Product Details
          // self.productLineId();
          // self.productCode(customer.first_name + " " + customer.last_name);
          // self.productName(customer.phone);
          // self.productDescription(customer.email);
          // self.productQuantity(customer.loyalty_level);

          var element = document.getElementById('accordionPage');
          oj.Logger.error(element);

        };

        self.onQuantityChanged = function() {
            
            self.orderPrice(0.00);

            for (var i = 0; i < self.products.length; i++) {
              self.orderPrice((self.orderPrice() + (self.products[i].price * self.products[i].quantity)).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
            }

        };

    }
    
    return new ShoppingCartViewModel();

});
