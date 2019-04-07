/**
 * Delivery Options module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'ojs/ojarraydataprovider', 'ojs/ojknockout',
  'ojs/ojmodule', 'ojs/ojcheckboxset', 'ojs/ojradioset', 'ojs/ojdatetimepicker',
  'ojs/ojlabel', 'ojs/ojlistview', 'ojs/ojprogress'
], function(oj, ko, $, ArrayDataProvider) {
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
    self.firstName = ko.observable(order.customer.first_name);
    self.lastName = ko.observable(order.customer.last_name);

    self.deliveryMethod = ko.observableArray();
    self.eta = ko.observable();
    self.minDate = ko.observable();

    //Only allow from tomorrow's dates
    self.minDate = oj.IntlConverterUtils.dateToLocalIso(rootViewModel.tomorrow);

    self.dateConverter = ko.observable(
      oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_DATETIME).createConverter({
        pattern: 'dd-MMM-yyyy'
      })
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
        rootViewModel.order.get('order').shipping.last_name = self.lastName();
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

      ///////////////////////////////////////////////
      //////// Added for Shipping Offers Feature
      rootViewModel.offersLoadProgress(0);
      rootViewModel.displayOffersBlock(false);
      rootViewModel.displayLoading(false);
      rootViewModel.disabledLogisticsNextStep(true);
      ///////////////////////////////////////////////

    };

    self.onFirstNameChanged = function(info) {
      rootViewModel.order.get('order').shipping.first_name = self.firstName();
    };

    self.onLastNameChanged = function(info) {
      rootViewModel.order.get('order').shipping.last_name = self.lastName();
    };

    self.onEtaChanged = function(info) {
      var selectedEta = new Date(self.eta());

      //Commented as this piece of logic was moved to the offersSelectionChange section to support Shipping Offers
      //var tomorrowDate = rootViewModel.tomorrow;
      // //If default then select type of standard delivery
      // if (selectedEta.getDate() + selectedEta.getMonth() + selectedEta.getYear() === tomorrowDate.getDate() + tomorrowDate.getMonth() + tomorrowDate.getYear()) {
      //   self.deliveryMethod("PREMIUM");
      // } else {
      //   self.deliveryMethod("ECONOMY");
      // }

      //set root model date to iso
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

    /////////////////////////////////////////////////
    /////////////////////////////////////////////////
    //For Shipping offers Feature
    self.shippingOffersExpanded = ko.observable(true);

    // Below is implemented in appController as rootViewModel
    // var dataSet = [{id: 1, name: 'Fedex', deliveryDate: '12/04/2019', 'price': 3.0},
    //     {id: 2, name: 'Royal Mail', deliveryDate: '12/04/2019', 'price': 3.55},
    //     {id: 3, name: 'DHL', deliveryDate: '13/04/2019', 'price': 3.10},
    //     {id: 4, name: 'UPS', deliveryDate: '11/04/2019', 'price': 4.0}
    //    ];
    //
    // self.allItems = ko.observableArray(dataSet);

    //used to display current selection
    self.selectedOffer = ko.observable();
    self.selectedOfferItem = ko.observable();
    self.selectedOfferName = ko.observable("None");

    // Current selection is already monitored through self.selectedItems observable.
    // To perform custom selection logic on selected elements and/or on current item, an option change callback can be used:
    self.offersSelectionChanged = function(event) {

      //get all details of the current selected item
      var selectedOfferDetails = JSON.parse( ko.toJSON( self.selectedOfferItem() ) ).data;

      //Display the selected option
      self.selectedOfferName(selectedOfferDetails.name);

      //Modified to support Shipping offers Feature
      if (selectedOfferDetails.name == "Default") {
        //compare selected date to tomorrow's date to deterine delivery type "if" not marketplace
        var selectedEta = new Date( selectedOfferDetails.deliveryDate );
        var tomorrowDate = rootViewModel.tomorrow;

        //If default then select type of standard delivery
        if (selectedEta.getDate() + selectedEta.getMonth() + selectedEta.getYear() === tomorrowDate.getDate() + tomorrowDate.getMonth() + tomorrowDate.getYear()) {
          self.deliveryMethod("PREMIUM");
        } else {
          self.deliveryMethod("ECONOMY");
        }
      } else {
        //if not default set to marketplace
        self.deliveryMethod("MARKETPLACE");
      }

      //set the new date as per delivery offer
      self.eta(selectedOfferDetails.deliveryDate);

      //Format Price
      var deliveryPrice = parseFloat(selectedOfferDetails.price).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');

      //set shipping values in rootViewModel for the picked offer
      rootViewModel.order.get('order').shipping.shipping_company = selectedOfferDetails.name;
      rootViewModel.order.get('order').shipping.shipping_id = selectedOfferDetails.id.toString();
      rootViewModel.order.get('order').shipping.price = deliveryPrice;

      //Enable "next" button  onLogisticsNext
      rootViewModel.disabledLogisticsNextStep(false);

    }

    // Below is implemented in appController as rootViewModel
    // self.dataProvider = new ArrayDataProvider(self.allItems, {
    //   keys: self.allItems().map(function(value) {
    //     return value.id;
    //   })
    // });

    self.dataProvider = new ArrayDataProvider(rootViewModel.shippingOffers, {
      keys: rootViewModel.shippingOffers().map(function(value) {
        return value.id;
      })
    });
    /////////////////////////////////////////////////
    /////////////////////////////////////////////////

  }

  return new DeliveryOptionsViewModel();

});
