/**
 * Invoice Details module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule'
], function (oj, ko, $) {
    /**
     * The view model for the invoice details view template
     */

    function InvoiceDetailsViewModel() {

        var self = this;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var shipping = rootViewModel.order.get("shippping");
        self.items = rootViewModel.order.get("line_items");

        self.orderItemsExpanded = ko.observable(true);
        self.deliveryDetailsExpanded = ko.observable(true);

        self.shippingMethod = ko.observable();
        self.shippingCost = ko.observable();
        self.totalPrice = ko.observable();

        self.handleAttached = function(info) {

            oj.Logger.error(shipping);

            self.totalPrice(0.00);
            var total = 0;

            self.shippingMethod(shipping.shipping_method);
            self.shippingCost(shipping.price.toFixed(2));

            for (var i = 0; i < self.items.length; i++) {
                total = total + (self.items[i].quantity * parseFloat(self.items[i].price));
            }

            self.totalPrice(total);

        };

    }
    
    return new InvoiceDetailsViewModel();

});
