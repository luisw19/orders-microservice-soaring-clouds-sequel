/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/OrderFactory', 'ojs/ojknockout',
        'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton', 'ojs/ojcollapsible'
], function (oj, ko, $, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;

        self.order = new oj.Model();
        self.disabledPreviousStep = ko.observable(false);
        self.disabledNextStep = ko.observable(false);
        self.onOrderSummary = ko.observable(false);
        self.onDeliveryOptions = ko.observable(false);
        self.onDeliveryCosting = ko.observable(false);
        self.onInvoiceDetails = ko.observable(false);
        self.onPaymentInfo = ko.observable(false);
        self.productDetailsExpanded = ko.observable(true);
        self.customerDetailsExpanded = ko.observable(true);
        self.orderId = ko.observable();
        self.customerId = ko.observable();

        self.steps = ko.observableArray(
            [
                {label: 'Order Summary', disabled: true, id: 'orderSum'},
                {label: 'Delivery Options', disabled: true, id: 'delivOpt'},
                {label: 'Delivery Costing???', disabled: true, id: 'delivCost'},
                {label: 'Invoice Details', disabled: true, id: 'invoiceDetail'},
                {label: 'Payment Information', disabled: true, id: 'paymentInfo'}
            ]
        );

        self.handleAttached = function(info) {
            basketTrain = document.getElementById("basketTrain");
            self.disabledPreviousStep(true);
            self.onOrderSummary(true);
        };

        self.currentStep = ko.observable(self.steps()[0].id);

        self.beforeSelection = function(event) {

            var nextStep = event.detail.toStep;

            nextStep.disabled = false;
            basketTrain.updateStep(nextStep.id, nextStep);

        };

        self.stepChanged = function(event) {
            self.enableContent(event.detail.value);
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

                    if ((i - 1) === 0) {
                        self.disabledPreviousStep(true);
                    }

                    return;

                }
            }

        };

        self.onNextStep = function(event) {

            self.disabledPreviousStep(false);

            for (var i = 0; i < self.steps().length; i++) {
                if (basketTrain.selectedStep === self.steps()[i].id) {
                    
                    basketTrain.selectedStep = self.steps()[i + 1].id;
                    
                    if ((i + 1) === self.steps().length - 1) {
                        self.disabledNextStep(true);
                    }

                    return;

                }
            }

        };

        self.enableContent = function(id) {

            self.onOrderSummary(false);
            self.onDeliveryOptions(false);
            self.onDeliveryCosting(false);
            self.onInvoiceDetails(false);
            self.onPaymentInfo(false);

            if (id === "orderSum") {
                self.onOrderSummary(true);
            } else if (id === "delivOpt") {
                self.onDeliveryOptions(true);
            } else if (id === "delivCost") {
                self.onDeliveryCosting(true);
            } else if (id === "invoiceDetail") {
                self.onInvoiceDetails(true);
            } else if (id === "paymentInfo") {
                self.onPaymentInfo(true);
            }

        };

        self.init = function () {
            // Listener to handle content from embedding application
            // Only applies as running in iFrame
            window.addEventListener("message", function (event) {

                console.log("Received message from embedding application " + event);
                console.log("Payload =  " + JSON.stringify(event.data));

                if (event.data.eventType === "globalContext") {

                    self.orderId(event.data.globalContext.orderId);
                    self.order = OrderFactory.createOrderModel(self.orderId());
                    self.order.fetch({
                        success: function(model, response, options) {
                            self.customerId(model.get('customer').customer_id);
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
    
    return new ShoppingCartViewModel();

});
