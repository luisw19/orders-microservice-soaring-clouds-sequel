/**
 * Payment Info module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule', 'ojs/ojselectcombobox', 'ojs/ojcollapsible',
        'ojs/ojinputtext', 'ojs/ojcheckboxset', 'ojs/ojformlayout'
], function (oj, ko, $) {
    /**
     * The view model for the payment info view template
     */

    function PaymentInfoViewModel() {

        var self = this;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var order = rootViewModel.order.get("order");
        var customer = rootViewModel.customer.get("0");

        var deliveryAddress = null;
        var billingAddress = null;
        var index = -1;

        self.paymentDetailsExpanded = ko.observable(true);
        self.billingAddressExpanded = ko.observable(true);
        self.selectedPaymentMethod = ko.observable();
        self.paymentMethods = ko.observableArray();
        self.displayNewMethod = ko.observable();

        self.nameOnCard = ko.observable();
        self.selectedCardType = ko.observable();
        self.cardNumber = ko.observable();
        self.startDate = ko.observable();
        self.expiryDate = ko.observable();

        self.sameAddressAsDelivery = ko.observableArray();
        self.addressReadOnly = ko.observable(false);
        self.addressLine1 = ko.observable();
        self.addressLine2 = ko.observable();
        self.city = ko.observable();
        self.county = ko.observable();
        self.postCode = ko.observable();
        self.country = ko.observable();

        self.handleAttached = function(info) {

            order = rootViewModel.order.get("order");
            customer = rootViewModel.customer.get("0");

            if (self.displayNewMethod()) {
                self.nameOnCard(order.payment.name_on_card);
                self.selectedCardType(order.payment.card_type);
                self.cardNumber(order.payment.card_number);

                if (order.payment.start_month === "" || order.payment.start_year === "") {
                    self.startDate();
                } else {
                    self.startDate(order.payment.start_month + "/" + order.payment.start_year.substr(-2));
                }

                if (order.payment.start_month === "" || order.payment.start_year === "") {
                    self.expiryDate();
                } else {
                    self.expiryDate(order.payment.expiry_month + "/" + order.payment.expiry_year.substr(-2));
                }

            }

            for (var i = 0; i < order.address.length; i++) {
                if (order.address[i].name.indexOf("DELIVERY") != -1) {
                    deliveryAddress = order.address[i];
                }
                if (order.address[i].name.indexOf("BILLING") != -1) {
                    billingAddress = order.address[i];
                    index = i;
                }
            }

            if (billingAddress == null) {
                order.address[order.address.length] = {
                    "name": "BILLING"
                };
                rootViewModel.order.set("order", order);
            }

            oj.Logger.error(deliveryAddress);
            oj.Logger.error(billingAddress);
            oj.Logger.error(self.sameAddressAsDelivery());

            if (self.sameAddressAsDelivery().length === 0) {

                self.addressReadOnly(false);

            } else {
                
                self.addressLine1(deliveryAddress.line_1);
                self.addressLine2(deliveryAddress.line_2);
                self.city(deliveryAddress.city);
                self.county(deliveryAddress.county);
                self.postCode(deliveryAddress.postcode);
                self.country(deliveryAddress.country);

                self.addressReadOnly(true);

            }

            self.paymentMethods(customer.paymentDetails);

        };

        self.maskCard = function(cardNumber) {
            return "Ending in " + cardNumber.substr(-4);
        };

        self.onPaymentMethodChanged = function(event) {
            
            var id = event.detail.value;
            
            if (order.payment == null) {
                order.payment = {};
            }

            if (id === "newPayMethod") {

                self.displayNewMethod(true);

                order.payment.name_on_card = "";
                order.payment.card_type = "";
                order.payment.card_number = "";
                order.payment.start_month = "";
                order.payment.start_year = "";
                order.payment.expiry_month = "";
                order.payment.expiry_year = "";

            } else {

                self.displayNewMethod(false);

                var paymentMethod = {};

                for (var i = 0; i < customer.paymentDetails.length; i++) {
                    if (customer.paymentDetails[i]._id === id) {
                        paymentMethod = customer.paymentDetails[i];
                        break;
                    }

                }

                order.payment.name_on_card = paymentMethod.nameOnCard;
                order.payment.card_type = paymentMethod.type;
                order.payment.card_number = paymentMethod.cardNumber;

                if (paymentMethod.startDate != null) {
                    order.payment.start_month = paymentMethod.startDate.substring(1, paymentMethod.startDate.indexOf("/"));
                    order.payment.start_year = "20" + paymentMethod.startDate.substring(paymentMethod.startDate.indexOf("/") + 1);
                } else {
                    order.payment.start_month = "";
                    order.payment.start_year = "";
                }

                order.payment.expiry_month = paymentMethod.expirationDate.substring(1, paymentMethod.expirationDate.indexOf("/"));
                order.payment.expiry_year = "20" + paymentMethod.expirationDate.substring(paymentMethod.expirationDate.indexOf("/") + 1);

            }

            rootViewModel.order.set("order", order);

        };

        self.onNameOnCardChange = function(event) {
            rootViewModel.order.get("order").payment.name_on_card = self.nameOnCard();
        };

        self.onCardTypeChange = function(event) {
            rootViewModel.order.get("order").payment.card_type = self.selectedCardType();
        };

        self.onCardNumberChanged = function(event) {
            rootViewModel.order.get("order").payment.card_number = self.cardNumber();
        };

        self.onStartDateChanged = function(event) {
            rootViewModel.order.get("order").payment.start_month = self.startDate().substring(1, self.startDate().indexOf("/"));
            rootViewModel.order.get("order").payment.start_year = self.startDate().substring(self.startDate().indexOf("/") + 1);
        };

        self.onEndDateChanged = function(event) {
            rootViewModel.order.get("order").payment.expiry_month = self.expiryDate().substring(1, self.expiryDate().indexOf("/"));
            rootViewModel.order.get("order").payment.expiry_year = self.expiryDate().substring(self.expiryDate().indexOf("/") + 1);
        };

        self.onSameAddressAsDeliveryChanged = function(event) {

            deliveryAddress = {};
            billingAddress = {};
            index = -1;

            for (var i = 0; i < order.address.length; i++) {
                if (order.address[i].name.indexOf("DELIVERY") != -1) {
                    deliveryAddress = order.address[i];
                }
                if (order.address[i].name.indexOf("BILLING") != -1) {
                    billingAddress = order.address[i];
                    index = i;
                }
            }
            
            if (self.sameAddressAsDelivery().length === 0) {

                self.addressLine1("");
                self.addressLine2("");
                self.city("");
                self.county("");
                self.postCode("");
                self.country("");

                billingAddress.line_1 = "";
                billingAddress.line_2 = "";
                billingAddress.city = "";
                billingAddress.county = "";
                billingAddress.postcode = "";
                billingAddress.country = "";

                self.addressReadOnly(false);

            } else {

                self.addressLine1(deliveryAddress.line_1);
                self.addressLine2(deliveryAddress.line_2);
                self.city(deliveryAddress.city);
                self.county(deliveryAddress.county);
                self.postCode(deliveryAddress.postcode);
                self.country(deliveryAddress.country);

                billingAddress.line_1 = deliveryAddress.line_1;
                billingAddress.line_2 = deliveryAddress.line_2;
                billingAddress.city = deliveryAddress.city;
                billingAddress.county = deliveryAddress.county;
                billingAddress.postcode = deliveryAddress.postcode;
                billingAddress.country = deliveryAddress.country;

                self.addressReadOnly(true);
                
            }

            order.address[index] = billingAddress;
            rootViewModel.order.set("order", order);

        };

        self.onAddressLine1Changed = function(event) {
            rootViewModel.order.get("order").address[index].line_1 = self.addressLine1();
        };

        self.onAddressLine2Changed = function(event) {
            rootViewModel.order.get("order").address[index].line_2 = self.addressLine2();
        };

        self.onCityChanged = function(event) {
            rootViewModel.order.get("order").address[index].city = self.city();
        };

        self.onCountyChanged = function(event) {
            rootViewModel.order.get("order").address[index].county = self.county();
        };

        self.onPostCodeChanged = function(event) {
            rootViewModel.order.get("order").address[index].postcode = self.postCode();
        };

        self.onCountryChanged = function(event) {
            rootViewModel.order.get("order").address[index].country = self.country();
        };

    }
    
    return new PaymentInfoViewModel();

});
