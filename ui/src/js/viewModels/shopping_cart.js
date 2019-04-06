/**
 * Shopping Cart module
 */
define(['ojs/ojcore', 'knockout', 'jquery', 'factories/AddressFactory',
  'factories/LogisticsFactory', 'factories/OrderFactory',
  'ojs/ojknockout', 'ojs/ojmodel', 'ojs/ojtrain', 'ojs/ojbutton',
  'ojs/ojcollapsible', 'ojs/ojmodule', 'ojs/ojdialog', 'ojs/ojradioset'
], function(oj, ko, $, AddressFactory, LogisticsFactory, OrderFactory) {
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
      [{
          label: 'Order Summary',
          disabled: true,
          id: 'orderSum'
        },
        {
          label: 'Delivery Address',
          disabled: true,
          id: 'delivAdd'
        },
        {
          label: 'Delivery Options',
          disabled: true,
          id: 'delivOpt'
        },
        {
          label: 'Invoice Details',
          disabled: true,
          id: 'invoiceDetail'
        },
        {
          label: 'Payment Information',
          disabled: true,
          id: 'paymentInfo'
        }
      ]
    );

    self.handleAttached = function(info) {

      basketTrain = document.getElementById("basketTrain");

      self.orderComplete(false);
      self.disabledPreviousStep(true);
      //landing step
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
      var move = true;

      //validation when clicking next
      if (self.stepModule() === "order_summary") {
        //if autonomous checkout ensure that all fields are entered
        if (rootViewModel.isAnonymousMode) {
          //alert(document.getElementById("firstName").valid);
          var error = "Following fields missing or entered incorrectly: ";
          if (document.getElementById("firstName").valid.indexOf("invalid") == 0) {
            error = error + "First Name ";
            move = false;
          }
          if (document.getElementById("lastName").valid.indexOf("invalid") == 0) {
            error = error + "Last Name ";
            move = false;
          }
          if (document.getElementById("customerPhone").valid.indexOf("invalid") == 0) {
            error = error + "Phone Number ";
            move = false;
          }
          if (document.getElementById("customerEmail").valid.indexOf("invalid") == 0) {
            error = error + "Email ";
            move = false;
          }
          if (!move) {
            //present error message
            console.log(error);
            alert("Please correct the errors in the form");
            document.getElementById("firstName").showMessages();
            document.getElementById("lastName").showMessages();
            document.getElementById("customerPhone").showMessages();
            document.getElementById("customerEmail").showMessages();
          }
        }
      };

      //validation when clicking next
      if (self.stepModule() === "delivery_address") {
        //validate that at least one credit card was entered
        if (document.getElementById("addressLine1") == null) {
          alert("Please enter a new address");
          valid = false;
        };
        //alert(document.getElementById("firstName").valid);
        var error = "Following fields missing or entered incorrectly: ";
        if (document.getElementById("addressLine1").valid.indexOf("invalid") == 0) {
          error = error + "Address Line 1 ";
          move = false;
        }
        if (document.getElementById("city").valid.indexOf("invalid") == 0) {
          error = error + "City ";
          move = false;
        }
        if (document.getElementById("postCode").valid.indexOf("invalid") == 0) {
          error = error + "Postcode ";
          move = false;
        }
        if (document.getElementById("country").valid.indexOf("invalid") == 0) {
          error = error + "Country ";
          move = false;
        }
        if (!move) {
          //present error message
          console.log(error);
          alert("Please correct the errors in the form");
          document.getElementById("addressLine1").showMessages();
          document.getElementById("city").showMessages();
          document.getElementById("postCode").showMessages();
          document.getElementById("country").showMessages();
        }
      };

      //only move train if validation is passed. Meaning move=true
      if (move) {
        for (var i = 0; i < self.steps().length; i++) {
          if (basketTrain.selectedStep === self.steps()[i].id) {

            self.apiInteraction(self.steps()[i + 1].id);

            basketTrain.selectedStep = self.steps()[i + 1].id;

            return;

          }
        }
      }
    };

    self.onLogisticsValidate = function() {
      var valid = true;
      //alert(document.getElementById("firstName").valid);
      var error = "Following fields missing or entered incorrectly: ";
      if (document.getElementById("eta").valid.indexOf("invalid") == 0) {
        error = error + "ETA ";
        valid = false;
      }
      if (document.getElementById("deliveryMethodOptions").valid.indexOf("invalid") == 0) {
        error = error + "Delivery Method ";
        valid = false;
      }
      if (document.getElementById("firstName").valid.indexOf("invalid") == 0) {
        error = error + "First Name ";
        valid = false;
      }
      if (document.getElementById("lastName").valid.indexOf("invalid") == 0) {
        error = error + "Last Name ";
        valid = false;
      }
      if (document.getElementById("personalMessage").valid.indexOf("invalid") == 0) {
        error = error + "Personal Message ";
        valid = false;
      }
      if (!valid) {
        //present error message
        console.log(error);
        alert("Please correct the errors in the form");
        document.getElementById("firstName").showMessages();
        document.getElementById("lastName").showMessages();
        document.getElementById("eta").showMessages();
        document.getElementById("deliveryMethodOptions").showMessages();
        document.getElementById("personalMessage").showMessages();
      }
      //only validate if fields are properly entered
      if (valid) {
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
            if(response.status == "NOK"){
              var validateError = response.validationFindings[0].findingType;
              console.log("stock validation response:" + JSON.stringify(response));
              switch (validateError) {
                case "invalidDestination":
                  alert("There is a mistake in the destination address. Please correct the address details and try again");
                  self.onPreviousStep();
                  break;
                case "outOfStockItem":
                  alert("There is no stock available. We apologize for the inconvenience");
                  break;
                default:
                  alert(validateError);
              }
            }else{
              self.deliveryCost(parseFloat(response.shippingCosts).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
              self.currency(order.currency);
              document.getElementById("confirmationDialog").open();
            }
          }
        });
      }
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

      var valid = true;
      //validate that at least one credit card was entered
      if (document.getElementById("paymentMethod").value == null) {
        alert("Please select a payment method or enter a new one");
        valid = false;
      };
      if (document.getElementById("paymentMethod").value == "newPayMethod" && valid) {
        //alert(document.getElementById("firstName").valid);
        var error = "Following fields missing or entered incorrectly: ";
        if (document.getElementById("nameOnCard").valid.indexOf("invalid") == 0) {
          error = error + "Name On Card ";
          valid = false;
        }
        if (document.getElementById("cardType").valid.indexOf("invalid") == 0) {
          error = error + "Card Type ";
          valid = false;
        }
        if (document.getElementById("cardNumber").valid.indexOf("invalid") == 0) {
          error = error + "Card Number ";
          valid = false;
        }
        if (document.getElementById("expiryDate").valid.indexOf("invalid") == 0) {
          error = error + "Expiry Date ";
          valid = false;
        }
        if (!valid) {
          //present error message
          console.log(error);
          alert("Please correct the errors in the form");
          document.getElementById("nameOnCard").showMessages();
          document.getElementById("cardType").showMessages();
          document.getElementById("cardNumber").showMessages();
          document.getElementById("expiryDate").showMessages();
        }
        //not required as values are set in rootViewModel "on change"
        /*else {
          var payment = rootViewModel.order.get("order").payment;
          //Name on card not supported at the moment
          //rootViewModel.order.get("order").payment.name_on_card=document.getElementById("nameOnCard").value;
          payment.card_type = document.getElementById("cardType").value;
          payment.card_number = document.getElementById("cardNumber").value;
          payment.start_year = parseInt(document.getElementById("startDate").value.substr(-2));
          payment.start_month = parseInt(document.getElementById("startDate").value.substring(0, 2));
          payment.expiry_year = parseInt(document.getElementById("expiryDate").value.substr(-2));
          payment.expiry_month = parseInt(document.getElementById("expiryDate").value.substring(0, 2));
          //safe new card details
          // rootViewModel.order.save(null, {
          //   success: function(model, response, options) {
          //     if (response.error) {
          //       alert("Error adding card details");
          //     }
          //
          //   },
          //   error: function(model, xhr, options) {
          //     alert("Error updating order details");
          //   }
          // });

        }*/
      }

      //////////////////////////////////////////////////////////////
      //WORKAROUND For invalid CC Type "CREDIT"
      //This has to be fixed either by adding "CREDIT" as type
      //in the order-created Avro schema or by aligning types in
      //customer address in customer BC
      if(rootViewModel.order.get("order").payment.card_type=="CREDIT"){
        rootViewModel.order.get("order").payment.card_type="VISA_CREDIT";
      }
      //////////////////////////////////////////////////////////////

      //If credit card is valid then proceed to verify address
      if (valid & document.getElementById("sameAddressAsDeliveryCheckbox").value != "deliveryAddress") {
        //alert(document.getElementById("firstName").valid);
        var error = "Following fields missing or entered incorrectly: ";
        if (document.getElementById("addressLine1").valid.indexOf("invalid") == 0) {
          error = error + "Address Line 1 ";
          valid = false;
        }
        if (document.getElementById("city").valid.indexOf("invalid") == 0) {
          error = error + "City ";
          valid = false;
        }
        if (document.getElementById("postCode").valid.indexOf("invalid") == 0) {
          error = error + "Postcode ";
          valid = false;
        }
        if (document.getElementById("country").valid.indexOf("invalid") == 0) {
          error = error + "Country ";
          valid = false;
        }
        if (!valid) {
          //present error message
          console.log(error);
          alert("Please correct the errors in the form");
          document.getElementById("addressLine1").showMessages();
          document.getElementById("city").showMessages();
          document.getElementById("postCode").showMessages();
          document.getElementById("country").showMessages();
        }
      }

      //only if validation is successful then pay
      if (valid) {
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
      }
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
              success: function(model, response, options) {

                if (response.error) {
                  alert("Error adding DELIVERY address - Please try again");
                  self.onPreviousStep();
                }

              },
              error: function(model, xhr, options) {
                alert("Error adding DELIVERY address");
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

        //No longer required as order rootViewModel is already updated at this point
        //order.customer.first_name = order.customer.get("firstName");
        //order.customer.last_name = order.customer.get("lastName");
        //order.customer.email = order.customer.get("email");
        //TODO this should not be hardcoded
        //order.customer.loyalty_level = "GOLD";
        // if (order.customer.get("phoneNumbers").length > 0) {
        //   order.customer.phone = "+" + order.customer.get("phoneNumbers")[0].countryCode + order.customer.get("phoneNumbers")[0].number;
        // } else {
        //   order.customer.phone = "n/a";
        // }

        rootViewModel.order.set("order", order);

        oj.ajax = function(ajaxOptions) {
          ajaxOptions.url = OrderFactory.setOrderURI(order.order_id);
          ajaxOptions.type = "PUT";
          return $.ajax(ajaxOptions);
        };

        rootViewModel.order.save(null, {
          success: function(model, response, options) {

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
          success: function(model, response, options) {

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
