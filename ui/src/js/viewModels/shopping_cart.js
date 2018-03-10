/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/AddressFactory',
        'ojs/ojknockout', 'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton',
        'ojs/ojcollapsible', 'ojs/ojmodule'
], function (oj, ko, $, AddressFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));

        self.disabledPreviousStep = ko.observable(false);
        self.disabledNextStep = ko.observable(false);
        self.stepModule = ko.observable();

        self.steps = ko.observableArray(
            [
                {label: 'Order Summary', disabled: true, id: 'orderSum'},
                {label: 'Delivery Address', disabled: true, id: 'delivAdd'},
                {label: 'Delivery Options', disabled: true, id: 'delivOpt'},
                {label: 'Invoice Details', disabled: true, id: 'invoiceDetail'},
                {label: 'Payment Information', disabled: true, id: 'paymentInfo'}
            ]
        );

        self.handleAttached = function(info) {

            basketTrain = document.getElementById("basketTrain");

            self.disabledPreviousStep(true);
            self.stepModule("order_summary");

        };

        self.currentStep = ko.observable(self.steps()[0].id);

        self.beforeSelection = function(event) {

            var nextStep = event.detail.toStep;
            var index = null;
            
            if (!nextStep.disabled) {

                var array = self.steps();

                for (var i = 0; i < self.steps().length; i++) {

                    if (self.steps()[i].id === nextStep.id) {
                        index = i;
                    } else if (index != null) {

                        var newStep = {};
                        newStep.label = self.steps()[i].label;
                        newStep.id = self.steps()[i].id;
                        newStep.disabled = true;
                        
                        array[i] = newStep;
                        
                    }

                }

                self.steps(array);

            } else {

                nextStep.disabled = false;
                basketTrain.updateStep(nextStep.id, nextStep);

            }

        };

        self.stepChanged = function(event) {

            if (event.detail.previousValue === "paymentInfo") {
                self.disabledNextStep(false);
            } else if (event.detail.previousValue === "orderSum") {
                self.disabledPreviousStep(false);
            }

            if (event.detail.value === "paymentInfo") {
                self.disabledNextStep(true);
            } else if (event.detail.value === "orderSum") {
                self.disabledPreviousStep(true);
            }

            var id = event.detail.value;

            if (id === "orderSum") {
                self.stepModule("order_summary");
            } else if (id === "delivAdd") {
                self.stepModule("delivery_address");
            } else if (id === "delivOpt") {
                self.stepModule("delivery_options");
            } else if (id === "invoiceDetail") {
                self.stepModule("invoice_detail");
            } else if (id === "paymentInfo") {
                self.stepModule("payment_info");
            }

        };

        self.deselectStep = function(event) {
            var step = event.detail.fromStep;
            step.messageType = "confirmation";
            step.disabled = false;
            document.getElementById("basketTrain").updateStep(step.id, step);
        };

        self.onPreviousStep = function() {

            for (var i = 0; i < self.steps().length; i++) {
                if (basketTrain.selectedStep === self.steps()[i].id) {

                    basketTrain.selectedStep = self.steps()[i - 1].id;

                    return;

                }
            }

        };

        self.onNextStep = function() {
            
            var index = -1;
            var orderAddress = {};

            for (var i = 0; i < self.steps().length; i++) {
                if (basketTrain.selectedStep === self.steps()[i].id) {

                    if (self.steps()[i + 1].id === "delivOpt") {

                        var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

                        // Call Add/Update Address on Order
                        oj.ajax = function(ajaxOptions) {
                            ajaxOptions.headers['api-key'] = '73f1c312-64e1-4069-92d8-0179ac056e90';
                            return $.ajax(ajaxOptions);
                        };

                        for (var j = 0; j < rootViewModel.order.get("order").address.length; j++) {
                            if (rootViewModel.order.get("order").address[j].name.indexOf("DELIVERY") != -1) {
                                index = j;
                                orderAddress = rootViewModel.order.get("order").address[j];
                                break;
                            }
                        }

                        address.set({
                            "name": "DELIVERY",
                            "line_1": orderAddress.line_1,
                            "line_2": orderAddress.line_2,
                            "city": orderAddress.city,
                            "county": orderAddress.county,
                            "postcode": orderAddress.postcode,
                            "country": orderAddress.country
                        });
                        address.save();
                    }
                    
                    basketTrain.selectedStep = self.steps()[i + 1].id;
                    
                    return;

                }
            }

        };

    }
    
    return new ShoppingCartViewModel();

});
