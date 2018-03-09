/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton', 'ojs/ojcollapsible',
        'ojs/ojmodule'
], function (oj, ko, $) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;

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

            nextStep.disabled = false;
            basketTrain.updateStep(nextStep.id, nextStep);

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

        self.onPreviousStep = function(event) {

            self.disabledNextStep(false);

            for (var i = 0; i < self.steps().length; i++) {
                if (basketTrain.selectedStep === self.steps()[i].id) {

                    basketTrain.selectedStep = self.steps()[i - 1].id;

                    return;

                }
            }

        };

        self.onNextStep = function(event) {

            self.disabledPreviousStep(false);

            for (var i = 0; i < self.steps().length; i++) {
                if (basketTrain.selectedStep === self.steps()[i].id) {
                    
                    basketTrain.selectedStep = self.steps()[i + 1].id;
                    
                    return;

                }
            }

        };

    }
    
    return new ShoppingCartViewModel();

});
