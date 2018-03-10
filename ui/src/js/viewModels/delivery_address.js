/**
 * Delivery Address module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule'
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

        self.handleAttached = function(info) {
            // Read latest Order from controller

            var addressArray = rootViewModel.order.get("order").address;

            if (addressArray != null) {

                if (addressArray.length > 1) {
                    for (var i = 0; i < addressArray.length; i++) {
                        if (addressArray[i].name.indexOf("DELIVERY") != -1) {
                            index = i;
                            address = addressArray[i];
                            break;
                        }
                    }
                } else if (addressArray.length === 1) {
                    address = addressArray[0];
                }

                if (address != null) {
                    self.addressLine1(address.line_1);
                    self.addressLine2(address.line_2);
                    self.city(address.city);
                    self.county(address.county);
                    self.postCode(address.postcode);
                    self.country(address.country);
                } else {
                    order.address = [{"name" : "DELIVERY"}];
                    rootViewModel.order.set("order", order);
                }

            } else {
                // Add address object to model
                order.address = [{}];
                rootViewModel.order.set("order", order);
            }

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

    }
    
    return new DeliveryAddressViewModel();

});
