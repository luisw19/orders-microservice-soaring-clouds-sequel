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
        var order = rootViewModel.order.get("order");
        var shipping = order.shipping;
        self.items = order.line_items;

        self.orderItemsExpanded = ko.observable(true);
        self.deliveryDetailsExpanded = ko.observable(true);

        self.shippingMethod = ko.observable();
        self.shippingCost = ko.observable();
        self.shippingETA = ko.observable();
        self.totalPrice = ko.observable();

        self.dateConverter = ko.observable(
            oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter(
                {
                    pattern : 'dd-MMM-yyyy'
                }
            )
        );

        self.handleAttached = function(info) {

            order = rootViewModel.order.get("order");
            shipping = order.shipping;
            self.items = order.line_items;

            // var shippingPrice = shipping.price.toFixed(2);
            // var preTotal = parseFloat(order.total_price).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
            var shippingPrice = parseFloat(shipping.price);
            var preTotal = parseFloat(order.total_price);
            var total = (shippingPrice + preTotal);

            self.shippingMethod(shipping.shipping_method);
            self.shippingCost(shippingPrice.toFixed(2));
            self.shippingETA(shipping.ETA);

            self.totalPrice( total.toFixed(2) + " " + order.currency);

        };

    }

    return new InvoiceDetailsViewModel();

});
