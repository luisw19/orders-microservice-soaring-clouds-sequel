/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojcollapsible', 'ojs/ojformlayout', 'ojs/ojinputtext'
], function (oj, ko, $, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var customer = rootViewModel.order.get("customer");
        var products = rootViewModel.order.get("line_items");

        self.productDetailsExpanded = ko.observable(true);
        self.customerDetailsExpanded = ko.observable(true);
        self.orderId = ko.observable();
        self.customerId = ko.observable();
        self.customerName = ko.observable();
        self.customerPhone = ko.observable();
        self.customerEmail = ko.observable();
        self.customerLoyaltyLevel = ko.observable();

        self.handleAttached = function(info) {

          self.orderId(rootViewModel.order.get("order_id"));

          // Customer Details
          self.customerId(customer.customer_id);
          self.customerName(customer.first_name + " " + customer.last_name);
          self.customerPhone(customer.phone);
          self.customerEmail(customer.email);
          self.customerLoyaltyLevel(customer.loyalty_level);

        };

    }
    
    return new ShoppingCartViewModel();

});
