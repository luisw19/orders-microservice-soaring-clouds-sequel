/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/AddressFactory',
        'factories/LogisticsFactory', 'factories/OrderFactory',
        'ojs/ojknockout', 'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton',
        'ojs/ojcollapsible', 'ojs/ojmodule', 'ojs/ojdialog'
], function (oj, ko, $, AddressFactory, LogisticsFactory, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));

        self.disabledPreviousStep = ko.observable(false);
        self.disabledNextStep = ko.observable(false);
        self.hasValidatedLogistics = ko.observable(true);
        self.displayValidate = ko.observable(false);
        self.stepModule = ko.observable();
        self.deliveryCost = ko.observable();
        self.currency = ko.observable();

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
            self.hasValidatedLogistics(true);
            self.displayValidate(false);

            if (id === "orderSum") {
                self.stepModule("order_summary");
            } else if (id === "delivAdd") {
                self.stepModule("delivery_address");
                self.apiInteraction(id); // Remove address when opening page
            } else if (id === "delivOpt") {
                self.stepModule("delivery_options");
                self.hasValidatedLogistics(false);
                self.displayValidate(true);
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

                    self.apiInteraction(self.steps()[i + 1].id);
                    
                    basketTrain.selectedStep = self.steps()[i + 1].id;
                    
                    return;

                }
            }

        };

        self.onValidate = function() {

            var logisticsValidation = LogisticsFactory.createLogisticsModel();
            var order = rootViewModel.order.get("order");
            var shipping = order.shipping;
            var address = order.address;
            var items = [];

            for (var i = 0; i < order.line_items.length; i++) {
                items[i] = {};
                items[i].productIdentifier = order.line_items.product_id;
                items[i].itemCount = order.line_items.quantity;
            }

            logisticsValidation.set({
                "nameAddressee": shipping.first_name + " " + shipping.last_name,
                "destination": {
                    "houseNumber": "",
                    "street": address.line_1,
                    "city": address.city,
                    "postCode": address.postcode,
                    "county": address.county,
                    "country": address.country
                },
                "shippingMethod": shipping.shipping_method,
                "desiredDeliveryDate": shipping.eta,
                "giftWrapping": order.special_details.gift_wrapping,
                "personalMessage": order.special_details.personal_message,
                "items": items
            });

            // TODO - This AJAX override needs to be deleted when logistic API supports CORS
            oj.ajax = function(ajaxOptions) {
                ajaxOptions.type = "GET";
                return $.ajax(ajaxOptions);
            };

            logisticsValidation.save(null, {
                success: function(model, response, options) {
                    self.deliveryCost(parseFloat(response.shippingCosts).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
                    self.currency(order.currency);
                    document.getElementById("confirmationDialog").open();
                }
            });
            
        };

        self.confirmCost = function() {

            rootViewModel.order.get("order").shipping.price = parseFloat(self.deliveryCost());
            self.hasValidatedLogistics(true);
            document.getElementById("confirmationDialog").close();

        };

        self.cancelCost = function() {
            document.getElementById("confirmationDialog").close();
        };

        self.onDialogClose = function(event) {
            if (self.hasValidatedLogistics()) {
                self.displayValidate(false);
                self.onNextStep();
            }
        };

        self.apiInteraction = function(stepId) {

            if (stepId === "delivAdd") {

                if (rootViewModel.order.get("order").address.length > 0) {
                    // Remove address on accessing delivery page
                    var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

                    for (var i = 0; i < rootViewModel.order.get("order").address.length; i++) {
                        if (rootViewModel.order.get("order").address[i].name.indexOf("DELIVERY") != -1) {
                            index = i;
                            orderAddress = rootViewModel.order.get("order").address[i];
                            break;
                        }
                    }

                    // Overwride POST call to DELETE Address on Order
                    oj.ajax = function(ajaxOptions) {
                        ajaxOptions.url += "/" + orderAddress.name;
                        ajaxOptions.headers['api-key'] = '73f1c312-64e1-4069-92d8-0179ac056e90';
                        ajaxOptions.type = "DELETE";
                        return $.ajax(ajaxOptions);
                    };

                    address.save();
                }

            } else if (stepId === "delivOpt") {

                var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

                // Call Add Address on Order
                oj.ajax = function(ajaxOptions) {
                    ajaxOptions.headers['api-key'] = '73f1c312-64e1-4069-92d8-0179ac056e90';
                    return $.ajax(ajaxOptions);
                };

                for (var i = 0; i < rootViewModel.order.get("order").address.length; i++) {
                    if (rootViewModel.order.get("order").address[i].name.indexOf("DELIVERY") != -1) {
                        index = i;
                        orderAddress = rootViewModel.order.get("order").address[i];
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

            } else if (stepId === "invoiceDetail") {
                // Call PUT ORDER for Shipping & Customer & Special Details
                var order = rootViewModel.order.get("order");
                order.customer.loyalty_level = "NONE";
                order.customer.first_name = order.customer.firstName;
                order.customer.last_name = order.customer.lastName;

                if (order.customer.phoneNumbers.length > 0) {
                    order.customer.phone = "+" + order.customer.phoneNumbers[0].countryCode + order.customer.phoneNumbers[0].number;
                } else {
                    order.customer.phone = null;
                }

                rootViewModel.order.set("order", order);

                oj.ajax = function(ajaxOptions) {
                    ajaxOptions.url = OrderFactory.setOrderURI(order.order_id);
                    ajaxOptions.headers['api-key'] = '73f1c312-64e1-4069-92d8-0179ac056e90';
                    return $.ajax(ajaxOptions);
                };

                rootViewModel.order.save();

            }

        };

    }
    
    return new ShoppingCartViewModel();

});
