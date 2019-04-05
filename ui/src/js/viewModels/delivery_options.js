/**
 * Delivery Options module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojknockout',
        'ojs/ojmodule', 'ojs/ojcheckboxset', 'ojs/ojradioset',
        'ojs/ojdatetimepicker'
], function (oj, ko, $) {
    /**
     * The view model for the delivery options view template
     */

    function DeliveryOptionsViewModel() {

        var self = this;
        var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
        var order = rootViewModel.order.get("order");
        var shipping = order.shipping;
        var specialDetails = order.special_details;

        self.deliveryMethodExpanded = ko.observable(true);
        self.specialDetailsExpanded = ko.observable(true);

        //Set first and last name to default as per order details
        self.firstName = ko.observable( order.customer.first_name );
        self.lastName = ko.observable( order.customer.last_name );

        self.deliveryMethod = ko.observableArray();
        self.eta = ko.observable();
        self.minDate = ko.observable();

        //Only allow from tomorrow's dates
        self.minDate = oj.IntlConverterUtils.dateToLocalIso( rootViewModel.tomorrow );

        self.dateConverter = ko.observable(
            oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter(
                {
                    pattern : 'dd-MMM-yyyy'
                }
            )
        );

        self.personalMessage = ko.observable();
        self.giftWrap = ko.observableArray();

        self.handleAttached = function(info) {

            order = rootViewModel.order.get("order");
            shipping = order.shipping;
            specialDetails = order.special_details;

            // Delivery Method
            if (shipping != null) {
                //Set default values also in rooViewModel for shipping
                self.firstName(shipping.first_name);
                self.lastName(shipping.last_name);
                self.deliveryMethod(shipping.shipping_method);
                self.eta(shipping.ETA);

            } else {
                // Add shipping object to model
                order.shipping = {};
                rootViewModel.order.set("order", order);
                rootViewModel.order.get('order').shipping.first_name = self.firstName();
                rootViewModel.order.get('order').shipping.last_name  = self.lastName();
            }

            if (specialDetails != null) {
                self.personalMessage(specialDetails.personal_message);

                if (specialDetails.gift_wrapping) {
                    self.giftWrap(["giftWrap"]);
                }
            } else {
                // Add special details object to model
                order.special_details = {};
                rootViewModel.order.set("order", order);
            }

        };

        self.onFirstNameChanged = function(info) {
            rootViewModel.order.get('order').shipping.first_name = self.firstName();
        };

        self.onLastNameChanged = function(info) {
            rootViewModel.order.get('order').shipping.last_name = self.lastName();
        };

        self.onEtaChanged = function(info) {
            var selectedEta =  new Date(self.eta()) ;
            var tomorrowDate = rootViewModel.tomorrow;
            if(selectedEta.getDay() + selectedEta.getMonth() + selectedEta.getYear() === tomorrowDate.getDay() + tomorrowDate.getMonth() + tomorrowDate.getYear()){
                self.deliveryMethod("PREMIUM");
            }else{
                self.deliveryMethod("ECONOMY");
            }
            rootViewModel.order.get('order').shipping.ETA = oj.IntlConverterUtils.dateToLocalIso(selectedEta);
        };

        self.onDeliveryMethodChanged = function() {
            rootViewModel.order.get('order').shipping.shipping_method = self.deliveryMethod();
        };

        self.onGiftWrapChanged = function() {

            if (self.giftWrap().length === 0) {
                rootViewModel.order.get('order').special_details.gift_wrapping = false;
            } else {
                rootViewModel.order.get('order').special_details.gift_wrapping = true;
            }

        };

        self.onPersonalMessageChanged = function() {

            rootViewModel.order.get('order').special_details.personal_message = self.personalMessage();

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

    return new DeliveryOptionsViewModel();

});
