/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/LineItemFactory',
  'ojs/ojknockout', 'ojs/ojcollapsible', 'ojs/ojformlayout',
  'ojs/ojinputtext', 'ojs/ojaccordion', 'ojs/ojinputnumber',
  'ojs/ojmodel'
], function(oj, ko, $, LineItemFactory) {
  /**
   * The view model for the shopping cart view template
   */

  function ShoppingCartViewModel() {

    var self = this;
    var rootViewModel = ko.dataFor(document.getElementById('globalBody'));
    var customer = rootViewModel.customer.get('0');
    var array = [];
    var newOrderPrice = 0;

    self.products = ko.observableArray();

    self.productDetailsExpanded = ko.observable(true);
    self.customerDetailsExpanded = ko.observable(true);
    self.orderId = ko.observable();
    self.orderPrice = ko.observable(0.00);
    self.orderCurrency = ko.observable();
    self.lineItemTotalPrice = ko.observableArray();

    self.converter = oj.Validation.converterFactory(oj.ConverterFactory.CONVERTER_TYPE_NUMBER).
    createConverter({
      "maximumFractionDigits": 2,
      "minimumFractionDigits": 2,
      "minimumIntegerDigits": 1,
      "style": "decimal",
      "useGrouping": false
    });

    self.customerId = ko.observable();
    self.customerFirstName = ko.observable();
    self.customerLastName = ko.observable();
    self.customerPhone = ko.observable();
    self.customerEmail = ko.observable();
    self.customerLoyaltyLevel = ko.observable();

    self.productLineId = ko.observable();
    self.productCode = ko.observable();
    self.productName = ko.observable();
    self.productDescription = ko.observable();
    self.productQuantity = ko.observable();

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

    //from: https://www.regextester.com/97440
    self.validatorPhone = ko.computed(function() {
      return [{
        type: 'regExp',
        options: {
          pattern: "(([+][(]?[0-9]{1,3}[)]?)|([(]?[0-9]{4}[)]?))\s*[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?([-\s\.]?[0-9]{3})([-\s\.]?[0-9]{3,4})",
          hint: "Enter a valid phone number e.g. +447575222333",
          messageDetail: "Not a valid phone number format"
        }
      }];
    });

    //from: https://www.oracle.com/webfolder/technetwork/jet/jetCookbook.html?component=validators&demo=regExpValidator
    self.validatorEmail = ko.computed(function() {
      return [{
        type: 'regExp',
        options: {
          pattern: "[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*",
          hint: "Enter a valid email format",
          messageDetail: "Not a valid email format"
        }
      }];
    });

    self.handleAttached = function(info) {

      self.products(rootViewModel.order.get("order").line_items);
      self.orderId(rootViewModel.order.get("order").order_id);
      self.orderCurrency(rootViewModel.order.get("order").currency);

      customer = rootViewModel.customer;
      //customer = rootViewModel.customer.get("0");

      oj.Logger.error(rootViewModel.customer);

      newOrderPrice = 0;

      if (self.products() != null) {
        for (var i = 0; i < self.products().length; i++) {
          array[i] = (self.products()[i].price * self.products()[i].quantity).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
          newOrderPrice = parseFloat(newOrderPrice + (self.products()[i].price * self.products()[i].quantity));
          self.orderPrice(newOrderPrice.toFixed(2));
        }
        self.orderPrice(newOrderPrice.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
        self.lineItemTotalPrice(array);
      }

      // Customer Details
      if (customer != null) {

        self.customerId(rootViewModel.order.get("order").shoppingCart_id);
        self.customerFirstName(rootViewModel.order.get("order").customer.first_name);
        self.customerLastName(rootViewModel.order.get("order").customer.last_name);
        self.customerPhone(rootViewModel.order.get("order").customer.phone);
        self.customerEmail(rootViewModel.order.get("order").customer.email);

        //TODO this should not be hardcoded
        if (self.customerId().indexOf("anonymous") == 0) {
          self.customerLoyaltyLevel("NONE");
        } else {
          //temp as customer object doesn't at the moment has a concept of loyalty
          self.customerLoyaltyLevel("GOLD");
          document.getElementById('firstName').readonly=true;
          document.getElementById('firstName').required=false;
          document.getElementById('lastName').readonly=true;
          document.getElementById('lastName').required=false;
        }
        //Set only once as it's no dynamic for now
        rootViewModel.order.get("order").customer.loyalty_level = self.customerLoyaltyLevel();
      }

    };

    self.onSummaryFormChange = function(event, arrayItem, context) {

        rootViewModel.order.get("order").customer.first_name = self.customerFirstName();
        rootViewModel.order.get("order").customer.last_name = self.customerLastName();
        rootViewModel.order.get("order").customer.phone = self.customerPhone();
        rootViewModel.order.get("order").customer.email = self.customerEmail();
        //alert(document.getElementById("firtName").valid);
    }

    self.onQuantityChanged = function(event, arrayItem, context) {

      if (event.detail.originalEvent != null) {

        newOrderPrice = 0;

        var element = event.srcElement;

        var lineItem = LineItemFactory.createLineItemModel(self.orderId(), arrayItem.data.line_id);

        oj.ajax = function(ajaxOptions) {
          ajaxOptions.type = 'PUT';
          return $.ajax(ajaxOptions);
        };

        lineItem.save({
          "quantity": arrayItem.data.quantity
        }, {
          success: function(model, response, options) {
            if (response.error) {
              element.value = event.detail.previousValue;
              alert("Quantity Update: " + response.message + " - Please try again");
            } else {

              array[arrayItem.index] = (arrayItem.data.price * arrayItem.data.quantity).toFixed(2);
              rootViewModel.order.get("order").line_items[arrayItem.index].quantity = arrayItem.data.quantity; // Update controller with new changes

              for (var i = 0; i < array.length; i++) {
                newOrderPrice = newOrderPrice + parseFloat(array[i]);
                array[i] = array[i].replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
              }

              self.orderPrice(newOrderPrice.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
              self.lineItemTotalPrice(array);

            }
          }
        });

      }

    };

  }

  return new ShoppingCartViewModel();

});
