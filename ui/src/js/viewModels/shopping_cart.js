/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/AddressFactory',
        'factories/LogisticsFactory', 'factories/OrderFactory',
        'ojs/ojknockout', 'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton',
        'ojs/ojcollapsible', 'ojs/ojmodule', 'ojs/ojdialog', 'ojs/ojradioset'
], function (oj, ko, $, AddressFactory, LogisticsFactory, OrderFactory) {
    /**
     * The view model for the shopping cart view template
     */

    function ShoppingCartViewModel() {

        var self = this;
        var basketTrain;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));

        self.orderComplete = ko.observable(false);
        self.disabledPreviousStep = ko.observable(false);
        self.disabledNextStep = ko.observable(false);
        self.hasValidatedLogistics = ko.observable(true);
        self.displayValidate = ko.observable(false);
        self.displayPay = ko.observable(false);
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

            self.orderComplete(false);
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
            self.displayPay(false);

            if (id === "orderSum") {
                self.stepModule("order_summary");
            } else if (id === "delivAdd") {
                self.stepModule("delivery_address");
            } else if (id === "delivOpt") {
                self.stepModule("delivery_options");
                self.hasValidatedLogistics(false);
                self.displayValidate(true);
            } else if (id === "invoiceDetail") {
                self.stepModule("invoice_detail");
            } else if (id === "paymentInfo") {
                self.stepModule("payment_info");
                self.displayPay(true);
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
            var addressItem = null;

            for (var i = 0; i < order.line_items.length; i++) {
                items[i] = {};
                items[i].productIdentifier = order.line_items[i].product_id;
                items[i].itemCount = order.line_items[i].quantity;
            }

            // Has to be a delivery address at this point in time
            for (var j = 0; j < address.length; j++) {
                if (address[j].name === "DELIVERY") {
                    addressItem = address[j];
                    break;
                }
            }

            var logisticsPaylaod = {
                "nameAddressee": shipping.first_name + " " + shipping.last_name,
                "destination": {
                    "houseNumber": "",
                    "street": addressItem.line_1,
                    "city": addressItem.city,
                    "postCode": addressItem.postcode,
                    "county": addressItem.county,
                    "country": addressItem.country
                },
                "shippingMethod": shipping.shipping_method,
                "desiredDeliveryDate": shipping.eta,
                "giftWrapping": order.special_details.gift_wrapping,
                "personalMessage": order.special_details.personal_message,
                "items": items
            };

            console.log("logistics paylaod:" + JSON.stringify(logisticsPaylaod));

            logisticsValidation.set(logisticsPaylaod);

            // TODO - This oj.AJAX override needs to be deleted when logistic API supports CORS
            oj.ajax = function(ajaxOptions) {
                //ajaxOptions.type = "GET";
                //Changed to POST as logistics expects it
                ajaxOptions.type = "POST";
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

        self.onPayNow = function() {

            var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

            for (var i = 0; i < rootViewModel.order.get("order").address.length; i++) {
                if (rootViewModel.order.get("order").address[i].name.indexOf("BILLING") != -1) {
                    index = i;
                    orderAddress = rootViewModel.order.get("order").address[i];
                    break;
                }
            }

            // Overwride POST call to DELETE Address on Order
            oj.ajax = function(ajaxOptions) {
                ajaxOptions.type = "POST";
                return $.ajax(ajaxOptions);
            };

            address.set({
                "name": "BILLING",
                "line_1": orderAddress.line_1,
                "line_2": orderAddress.line_2,
                "city": orderAddress.city,
                "county": orderAddress.county,
                "postcode": orderAddress.postcode,
                "country": orderAddress.country
            });

            address.save(null, {
                success: function(model, response, options) {

                    if (response.error) {
                        alert("Error adding BILLING address - Please try again");
                        return;
                    }

                    oj.ajax = function(ajaxOptions) {
                        ajaxOptions.url = OrderFactory.setOrderURI(rootViewModel.order.get("order").order_id);
                        return $.ajax(ajaxOptions);
                    };

                    rootViewModel.order.save(null, {
                        success: function(model, response, options) {

                            if (response.error) {
                                alert("Error adding Payment Details - Please try again");
                                return;
                            }

                            // Process order
                            oj.ajax = function(ajaxOptions) {
                                ajaxOptions.url = OrderFactory.setOrderURI(rootViewModel.order.get("order").order_id) + "/process";
                                ajaxOptions.type = "POST";
                                return $.ajax(ajaxOptions);
                            };

                            rootViewModel.order.save(null, {
                                success: function(model, response, options) {
                                    if (response.error) {
                                        alert("Error processing order: " + response.message + " - Please try again");
                                        return;
                                    } else {
                                        self.orderComplete(true);
                                    }
                                }
                            });

                        },
                        error: function() {
                            alert("Error adding payment method");
                        }
                    });

                },
                error: function() {
                    alert("Error adding billing address");
                }
            });

        };

        self.apiInteraction = function(stepId) {

            if (stepId === "delivOpt") {

                var orderAddress = null;

                var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

                for (var i = 0; i < rootViewModel.order.get("order").address.length; i++) {
                    if (rootViewModel.order.get("order").address[i].name.indexOf("DELIVERY") != -1) {
                        index = i;
                        orderAddress = rootViewModel.order.get("order").address[i];
                        break;
                    }
                }

                oj.ajax = function(ajaxOptions) {
                    ajaxOptions.url += "/" + orderAddress.name;
                    ajaxOptions.type = "DELETE";
                    return $.ajax(ajaxOptions);
                };

                address.save(null, {
                    success: function(model, response, error) {

                        if (response.error & response.message.indexOf("DELIVERY address not found") === -1) {
                            alert("Error removing DELIVERY address - Please try again");
                            self.onPreviousStep();
                        }

                        oj.ajax = function(ajaxOptions) {
                            ajaxOptions.type = "POST";
                            return $.ajax(ajaxOptions);
                        };

                        address.set({
                            "name": "DELIVERY",
                            "line_1": orderAddress.line_1,
                            "line_2": orderAddress.line_2,
                            "city": orderAddress.city,
                            "county": orderAddress.county,
                            "postcode": orderAddress.postcode,
                            "country": orderAddress.country
                        });

                        address.save(null, {
                            success: function (model, response, options) {

                                if (response.error) {
                                    alert("Error adding DELIVERY address - Please try again");
                                    self.onPreviousStep();
                                }

                            },
                            error: function(model, xhr, options) {
                                alert("Error adding DELIVERY address" );
                            }
                        });

                    },
                    error: function() {
                        alert("Error deleting " + orderAddress.name + " address");
                    }

                });

            } else if (stepId === "invoiceDetail") {
                // Call PUT ORDER for Shipping & Customer & Special Details
                var order = rootViewModel.order.get("order");
                oj.Logger.error(order);

                order.customer.first_name = order.customer.get("firstName");
                order.customer.last_name = order.customer.get("lastName");
                order.customer.email = order.customer.get("email");
                //TODO this should not be hardcoded
                order.customer.loyalty_level = "GOLD";

                if (order.customer.get("phoneNumbers").length > 0) {
                    order.customer.phone = "+" + order.customer.phoneNumbers[0].countryCode + order.customer.phoneNumbers[0].number;
                } else {
                    order.customer.phone = "n/a";
                }

                rootViewModel.order.set("order", order);

                oj.ajax = function(ajaxOptions) {
                    ajaxOptions.url = OrderFactory.setOrderURI(order.order_id);
                    ajaxOptions.type = "PUT";
                    return $.ajax(ajaxOptions);
                };

                rootViewModel.order.save(null, {
                    success: function (model, response, options) {

                        if (response.error) {
                            alert("Error adding Shipping Information & Special details - Please try again");
                            self.onPreviousStep();
                        }

                    },
                    error: function(model, xhr, options) {
                        alert("Error updating order details");
                    }
                });

            } else if (stepId === "paymentInfo") {

                // Remove address on accessing delivery page
                var address = AddressFactory.createAddressModel(rootViewModel.order.get("order").order_id);

                // Overwride POST call to DELETE Address on Order
                oj.ajax = function(ajaxOptions) {
                    ajaxOptions.url += "/BILLING";
                    ajaxOptions.type = "DELETE";
                    return $.ajax(ajaxOptions);
                };

                address.save(null, {
                    success: function (model, response, options) {

                        if (response.error & response.message.indexOf("BILLING address not found") === -1) {
                            alert("Error removing BILLING address - Please try again");
                            self.onPreviousStep();
                        }

                    },
                    error: function() {
                        alert("Error deleting BILLING address");
                    }
                });

            }

        };

    }

    return new ShoppingCartViewModel();

});
