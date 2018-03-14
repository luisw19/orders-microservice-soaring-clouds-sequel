/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/LineItemFactory',
        'ojs/ojknockout', 'ojs/ojcollapsible', 'ojs/ojformlayout',
        'ojs/ojinputtext', 'ojs/ojaccordion', 'ojs/ojinputnumber',
        'ojs/ojmodel'
], function (oj, ko, $, LineItemFactory) {
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
          createConverter(
            {
              "maximumFractionDigits": 2,
              "minimumFractionDigits": 2,
              "minimumIntegerDigits": 1,
              "style": "decimal",
              "useGrouping": false
            });

        self.customerId = ko.observable();
        self.customerName = ko.observable();
        self.customerPhone = ko.observable();
        self.customerEmail = ko.observable();
        self.customerLoyaltyLevel = ko.observable();

        self.productLineId = ko.observable();
        self.productCode = ko.observable();
        self.productName = ko.observable();
        self.productDescription = ko.observable();
        self.productQuantity = ko.observable();

        self.handleAttached = function(info) {

          self.products(rootViewModel.order.get("order").line_items);

          self.orderId(rootViewModel.order.get("order").order_id);
          self.orderCurrency(rootViewModel.order.get("order").currency);

          customer = rootViewModel.customer.get('0');

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
            self.customerId(rootViewModel.order.get('_id'));
            self.customerName(customer.firstName + " " + customer.lastName);
            if (customer.phoneNumbers.length > 0) {
              self.customerPhone('+' + customer.phoneNumbers[0].countryCode + customer.phoneNumbers[0].number);
            }
            self.customerEmail(customer.email);
            self.customerLoyaltyLevel("GOLD");
          }

        };

        self.onQuantityChanged = function(event, arrayItem, context) {

            if (event.detail.originalEvent != null) {

              newOrderPrice = 0;

              var element = event.srcElement;

              var lineItem = LineItemFactory.createLineItemModel(self.orderId(), arrayItem.data.line_id);

              oj.ajax = function(ajaxOptions) {
                ajaxOptions.type = 'PUT';
                return $.ajax(ajaxOptions);
              };

              lineItem.save({"quantity": arrayItem.data.quantity},{
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
