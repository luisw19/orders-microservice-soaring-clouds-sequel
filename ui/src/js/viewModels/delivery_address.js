/**
 * Delivery Address module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule', 'ojs/ojradioset', 'ojs/ojbutton', 'ojs/ojdialog',
        'ojs/ojselectcombobox'
], function (oj, ko, $) {
    /**
     * The view model for the delivery address view template
     */

    function DeliveryAddressViewModel() {

        var self = this;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var order = rootViewModel.order.get("order");

        var address;
        var index = 0;

        self.deliveryAddressExpanded = ko.observable(true);
        self.addressLine1 = ko.observable();
        self.addressLine2 = ko.observable();
        self.city = ko.observable();
        self.county = ko.observable();
        self.postCode = ko.observable();
        self.country = ko.observable();

        self.customerAddresses = ko.observableArray();
        self.selectedDeliveryAddress = ko.observable();
        self.isCustomerAddress = ko.observable();

        self.handleAttached = function(info) {

            // Read latest Order from controller
            var addressArray = rootViewModel.order.get("order").address;
            order = rootViewModel.order.get("order");

            //self.customerAddresses(rootViewModel.customer.get("0").addresses);
            self.customerAddresses(rootViewModel.customer.get("addresses"));
            if (addressArray != null || addressArray.length>0) {

                for (var i = 0; i < addressArray.length; i++) {
                    if (addressArray[i].name.indexOf("DELIVERY") != -1) {
                        index = i;
                        address = addressArray[i];
                        break;
                    }
                }

                if (address != null) {
                    self.selectedDeliveryAddress(" ");
                    self.addressLine1(address.line_1);
                    self.addressLine2(address.line_2);
                    self.city(address.city);
                    self.county(address.county);
                    self.postCode(address.postcode);
                    self.country(address.country);
                } else {
                    order.address = [{"name" : "DELIVERY"}];
                    index = 0;
                    rootViewModel.order.set("order", order);
                }

            } else {
                // Add address object to model
                order.address = [{"name" : "DELIVERY"}];
                index = 0;
                rootViewModel.order.set("order", order);
            }

        };

        self.onDeliveryAddressChanged = function(event) {

            var id = event.detail.value;

            if (id === "newDeliveryAddress") {

                self.addressLine1("");
                self.addressLine2("");
                self.city("");
                self.county("");
                self.postCode("");
                self.country("");

            } else {

                var address;

                for (var i = 0; i < self.customerAddresses().length; i++) {
                    if (id === self.customerAddresses()[i]._id) {
                        address = self.customerAddresses()[i];
                    }
                }

                self.addressLine1(address.streetNumber + " " + address.streetName);
                self.addressLine2(address.line_2);
                self.city(address.city);
                self.county(address.county);
                self.postCode(address.postcode);
                self.country(address.country);

            }

            rootViewModel.order.get("order").address[index].line_1 = self.addressLine1();
            rootViewModel.order.get("order").address[index].line_2 = self.addressLine2();
            rootViewModel.order.get("order").address[index].city = self.city();
            rootViewModel.order.get("order").address[index].county = self.county();
            rootViewModel.order.get("order").address[index].postcode = self.postCode();
            rootViewModel.order.get("order").address[index].country = self.country();

        };

        self.onAddressLine1Change = function() {
            rootViewModel.order.get("order").address[index].line_1 = self.addressLine1();
        };

        self.onAddressLine2Change = function() {
            rootViewModel.order.get("order").address[index].line_2 = self.addressLine2();
        };

        self.onCityChange = function() {
            rootViewModel.order.get("order").address[index].city = self.city();
        };

        self.onCountyChange = function() {
            rootViewModel.order.get("order").address[index].county = self.county();
        };

        self.onPostCodeChange = function() {
            rootViewModel.order.get("order").address[index].postcode = self.postCode();
        };

        self.onCountryChange = function() {
            rootViewModel.order.get("order").address[index].country = self.country();
        };

        self.validators = ko.computed(function() {
          return [{
            type: 'regExp',
            options: {
              pattern: '[a-zA-Z0-9 ]{2,}',
              hint: "Enter at least 2 characters",
              messageDetail: 'Enter at least 2 normal characters'
            }
          }];
        });

    }

    return new DeliveryAddressViewModel();

});
