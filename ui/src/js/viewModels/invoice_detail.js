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

            self.shippingMethod(shipping.shipping_method);
            self.shippingCost(shipping.price.toFixed(2));

            self.totalPrice(rootViewModel.order.get('order').total_price);

        };

    }
    
    return new InvoiceDetailsViewModel();

});
