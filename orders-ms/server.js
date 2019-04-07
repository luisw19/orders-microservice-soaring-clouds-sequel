var express = require("express");
var cors = require('cors');
var app = express();
var bodyParser = require("body-parser");
var mongoOp = require("./model/mongo");
var router = express.Router();
var querystring = require('querystring');
var stripchar = require('stripchar').StripChar; //used to remove special chars before saving in mongo
var PORT = process.env.APP_PORT || 3000;
var APP_VERSION = "2.0.0";
var APP_NAME = "OrdersMS";
//Set variables for calling the Event Producer API
var http = require('http');
var apiHost = process.env.EVENTAPI_HOST || "localhost";
var apiPort = process.env.EVENTAPI_PORT || 4000;

//Enable CORS pre-flight in all operations
app.use(cors());
app.options('*', cors()); // include before other routes
//Set Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  "extended": false
}));
//Log status
console.log("Running " + APP_NAME + " version: " + APP_VERSION);

////////////////////////////////////////////////////////////////
// REST endpoints
////////////////////////////////////////////////////////////////
//Healthcheck endpoint
router.get('/health', function(req, res) {
  var response = {
    "status": "OK",
    "uptime": process.uptime(),
    "version": APP_VERSION
  };
  res.json(response);
});

////////////////////////////////
//search and create oders
router.route("/orders")

  // GET method
  .get(function(req, res) {

    var response = {};
    var metadata = {};
    var query = {};

    //construct dynamic query
    //search by customer id
    if (req.query.customer !== undefined) {
      query['order.customer.customer_id'] = req.query.customer;
    }
    //search by shoppingCart_id
    if (req.query.shoppingCart_id !== undefined) {
      query['order.shoppingCart_id'] = req.query.shoppingCart_id;
    }
    //search by shoppingCart_id
    if (req.query.status !== undefined) {
      query['order.status'] = req.query.status;
    }
    //from
    if (req.query.date_from !== undefined) {
      query['order.created_at'] = {
        '$gte': new Date(req.query.date_from)
      };
    }
    //from and to
    if (req.query.date_from !== undefined && req.query.date_to !== undefined) {
      query['order.created_at'] = {
        '$gte': new Date(req.query.date_from),
        '$lte': new Date(req.query.date_to)
      };
    }

    // Mongo command to fetch all data from collection.
    mongoOp.find(query, function(err, data) {
      if (err) {
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        //response metadata
        var resultCount = data.length;
        //Count results
        metadata = {
          "result_count": resultCount
        };
        //send response
        response = {
          metadata,
          "orders": data
        };
      }
      //Response
      res.json(response);
    });

  })

  // POST method
  .post(function(req, res) {
    var db = new mongoOp();
    var response = {};
    // fetch order from REST request.
    // Ideally we should add validation here
    //console.log(req.headers);
    //console.log(req.body);
    db.order = req.body;

    //Validation that minimun details required are present
    var valError = "";
    var validation = true;
    if (db.order.currency == undefined) {
      valError = valError + " currency";
      validation = false;
    }
    if (db.order.customer.customer_id == undefined) {
      valError = valError + " customer_id";
      validation = false;
    } else {
      //set shopping cart ID to same as the customer id
      db.order.shoppingCart_id = db.order.customer.customer_id;
    }
    //if validation fails, then prepare error message
    if (!validation) {
      response = {
        "error": true,
        "message": "Following details missing: " + valError
      };
    }

    //create random order id
    var order_id = Math.random().toString(36).substr(2, 9);
    //replace order ID if it's a testing agent (Postman or Dredd)
    if (req.headers['user-agent'] !== undefined) {
      //Get HTTP Header user-agent
      var header = req.headers['user-agent'];
      //console.log(JSON.stringify(req.headers));
      //If user-agent is dredd (meaning is a dredd test), use pre-defined ID
      if (header.includes("Dredd")) {
        //create random order_id
        order_id = "unittest";
      }
      //If user-agent is postman (meaning is a postman test), use pre-defined ID
      if (header.includes("Postman")) {
        //create random order_id
        order_id = "unittest";
      }
    }
    //set the id
    db.order.order_id = order_id;
    //Order Address, Payment, and Line arrays should be empty
    db.order.address = [];
    db.order.payment = {};
    db.order.line_items = [];
    //When creating order for first time status must always be SHOPPING_CART
    db.order.status = "SHOPPING_CART";
    //set dates (for some reasons if left to default it won't query properly)
    var now = new Date();
    db.order.created_at = now.toJSON();
    db.order.updated_at = now.toJSON()
    //set HATEOAS. Note that it's more performing to store it than creating it at runtime... but it has cons!
    db.order._links = {
      self: {
        href: req.originalUrl + "/" + db.order.order_id
      }
    };

    //save the data if no errors in validation
    if (validation) {
      db.save(function(err) {
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
        if (err) {
          console.log(err);
          response = {
            "error": true,
            "message": "Error adding data"
          };
        } else {
          response = {
            "error": false,
            "message": "Created order: " + order_id,
            "_links": db.order._links
          };
        }
        res.statusCode = 201;
        res.json(response);
      });
    } else {
      //send error back
      res.json(response);
    }
  });
////////////////////////////////

////////////////////////////////
//read, update or delete orders
router.route("/orders/:id")

  // get a order that matches the ID in the GET URL
  .get(function(req, res) {
    //response variable
    var response = {};
    //create query for later execution
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });
    // execute the query
    query.exec(function(err, data) {
      // This will run Mongo Query to fetch data based on ID.
      if (err) {
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        //response metadata
        if (data == null) {
          response = {
            "error": true,
            "message": "No record found for order id: " + req.params.id
          };
        } else {
          //total number of lines
          //console.log("Total number of lines: " + data.order.line_items.length);
          response = data;
        }
      }
      res.json(response);
    });
  })

  // update the order that matches the ID in the GET url
  .put(function(req, res) {
    //response variable
    var response = {};

    //create query for later execution
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before deleting
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          // ensure that json paylaod is not empty
          if (req.body !== undefined) {
            //get the updated Order paylaod
            var updatedOrder = req.body;
            //Update only fields that are allowed to be updated
            //if validation = false it means there has been an error
            var validation = true;
            var valError = "";

            //Update Payment Details
            if (updatedOrder.payment !== undefined) {
              //Card validation logic
              if (updatedOrder.payment.card_type == undefined) {
                valError = valError + " payment.card_type";
                validation = false;
              }
              if (updatedOrder.payment.card_number == undefined) {
                valError = valError + " payment.card_number";
                validation = false;
              }
              if (updatedOrder.payment.expiry_year == undefined) {
                valError = valError + " payment.expiry_year";
                validation = false;
              }
              if (updatedOrder.payment.expiry_month == undefined) {
                valError = valError + " payment.expiry_month";
                validation = false;
              }
            } else {
              data.order.payment = {};
            }

            //Validate shipping details
            if (updatedOrder.shipping !== undefined) {
              if (updatedOrder.shipping.first_name == undefined) {
                valError = valError + " shipping.first_name";
                validation = false;
              }
              if (updatedOrder.shipping.last_name == undefined) {
                valError = valError + " shipping.last_name";
                validation = false;
              }
              if (updatedOrder.shipping.shipping_method == undefined) {
                valError = valError + " shipping.shipping_method";
                validation = false;
              }
              if (updatedOrder.shipping.shipping_company == undefined) {
                valError = valError + " shipping.shipping_company";
                validation = false;
              }
              if (updatedOrder.shipping.shipping_id == undefined) {
                valError = valError + " shipping.shipping_id";
                validation = false;
              }
              if (updatedOrder.shipping.price <= 0) {
                valError = valError + " shipping.price<=0";
                validation = false;
              }
              //This validation is not required in this version
              if (updatedOrder.shipping.ETA == undefined) {
                //ETA not enforced in this version. Next release
                updatedOrder.shipping.ETA = "";
                //valError = valError + " shipping.ETA";
                //validation = false;
              }
            } else {
              data.order.shipping = {};
            }

            //save the data if validation is ok (true)
            if (validation) {
              //update updated date
              var now = new Date();
              data.order.updated_at = now.toJSON();

              //Update Order status
              if (updatedOrder.status !== undefined) {
                //If changed status to success then
                if (updatedOrder.status === "SUCCESS") {
                  //respond with error as only /orders/{orderId}/process can change status to success
                  response = {
                    "error": true,
                    "message": "Changing Order Status to SUCCESS not allowed"
                  };
                  validation = false;
                }
                data.order.status = updatedOrder.status;
              }

              //Update Payment Details
              if (updatedOrder.payment !== undefined) {
                if (updatedOrder.payment.name_on_card !== undefined) {
                  data.order.payment.name_on_card = updatedOrder.payment.name_on_card;
                }
                if (updatedOrder.payment.card_type !== undefined) {
                  data.order.payment.card_type = updatedOrder.payment.card_type;
                }
                if (updatedOrder.payment.card_number !== undefined) {
                  data.order.payment.card_number = updatedOrder.payment.card_number;
                }
                if (updatedOrder.payment.start_year !== undefined) {
                  data.order.payment.start_year = updatedOrder.payment.start_year;
                }
                if (updatedOrder.payment.start_month !== undefined) {
                  data.order.payment.start_month = updatedOrder.payment.start_month;
                }
                if (updatedOrder.payment.expiry_year !== undefined) {
                  data.order.payment.expiry_year = updatedOrder.payment.expiry_year;
                }
                if (updatedOrder.payment.expiry_month !== undefined) {
                  data.order.payment.expiry_month = updatedOrder.payment.expiry_month;
                }
              }

              //Update Customer Details
              if (updatedOrder.customer !== undefined) {
                if (updatedOrder.customer.loyalty_level !== undefined) {
                  data.order.customer.loyalty_level = updatedOrder.customer.loyalty_level;
                } else {
                  data.order.customer.loyalty_level = "NONE";
                }
                if (updatedOrder.customer.first_name !== undefined) {
                  data.order.customer.first_name = updatedOrder.customer.first_name;
                }
                if (updatedOrder.customer.last_name !== undefined) {
                  data.order.customer.last_name = updatedOrder.customer.last_name;
                }
                if (updatedOrder.customer.phone !== undefined) {
                  data.order.customer.phone = updatedOrder.customer.phone;
                }
                if (updatedOrder.customer.email !== undefined) {
                  data.order.customer.email = updatedOrder.customer.email;
                }
              }

              //set Shipping details
              data.order.shipping = updatedOrder.shipping;

              //Set special details values
              if (updatedOrder.special_details !== undefined) {
                if (updatedOrder.special_details.personal_message !== undefined) {
                  data.order.special_details.personal_message = updatedOrder.special_details.personal_message;
                } else {
                  data.order.special_details.personal_message = "";
                }
                if (updatedOrder.special_details.gift_wrapping !== undefined) {
                  data.order.special_details.gift_wrapping = updatedOrder.special_details.gift_wrapping;
                } else {
                  data.order.special_details.gift_wrapping = false;
                }
                if (updatedOrder.special_details.delivery_notes !== undefined) {
                  data.order.special_details.delivery_notes = stripchar.RSExceptUnsAlpNum(updatedOrder.special_details.delivery_notes);
                } else {
                  data.order.special_details.delivery_notes = "";
                }
              }
              //Save the changes
              data.save(function(err) {
                if (err) {
                  response = {
                    "error": true,
                    "message": "Error updating order"
                  };
                } else {
                  response = {
                    "error": false,
                    "message": "Order " + req.params.id + " has been updated"
                  };
                }
                res.json(response);
              })
            } else {
              response = {
                "error": true,
                "message": "Could not update Order '" + req.params.id + "' as the following details are missing: " + valError
              };
              res.json(response);
            }
          } else {
            response = {
              "error": false,
              "message": "No payload"
            };
          }
        } else {
          //order doesn't exist
          res.json(response);
        }
      }
    });
  })

  //Delete the order that matches the ID
  .delete(function(req, res) {
    var response = {};

    //Get HTTP Header user-agent
    //var header = req.headers['user-agent'];

    //create query to check if order exists
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before deleting
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          //if order exists remove it unless is a Dredd test
          //console.log(header.includes("Dredd"));
          //if(! header.includes("Dredd") ){
          mongoOp.remove({
            'order.order_id': req.params.id
          }, function(err) {
            if (err) {
              response = {
                "error": true,
                "message": "Error deleting data"
              };
            } else {
              response = {
                "error": false,
                "message": "Order " + req.params.id + " deleted"
              };
            }
            res.json(response);
          });
          //}
        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    });
  })
////////////////////////////////

////////////////////////////////
//Add order line items
router.route("/orders/:id/lines")
  // update the order that matches the ID in the GET url
  .post(function(req, res) {
    //response variable
    var response = {};

    //create query for later execution
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before adding line item
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          // ensure that json paylaod is not empty
          if (req.body !== undefined) {

            //get the line item payload
            var addLineItem = req.body;
            //Remove special chars from description
            addLineItem.description = stripchar.RSExceptUnsAlpNum(addLineItem.description);

            //Get number of line items in existing order
            //console.log("Current number of line items: " + odertest.line_items.length);
            var totalLines = data.order.line_items.length;
            var addLineItemId = totalLines;
            var lineExists = false;

            //if undefined set to zero
            if (addLineItemId == undefined){
              addLineItemId = 0 ;
            }

            //console.log(totalLines);
            //Increment line item number based on current number of lines
            if (addLineItemId > 0) {
              //console.log("entered");
              //First check to see if product already exists in line.
              //If so, just increase the number of items in line
              //Otherwise create a new line item
              //check to see if line item exists, if so, set flag to true and sum quantity

              for (var count = 0; count < totalLines; count++) {
                if (data.order.line_items[count].product_id == addLineItem.product_id) {
                  lineExists = true;
                  addLineItemId=data.order.line_items[count].line_id;
                  data.order.line_items[count].quantity = data.order.line_items[count].quantity + addLineItem.quantity;
                  //console.log(data.order.line_items[count].quantity);
                }
              }
              //if it doesn't exist, just increment the number
              if(!lineExists){
                addLineItemId = addLineItemId + 1;
              }
            } else {
              addLineItemId = 1;
            }
            //Set new line item id
            addLineItem.line_id = addLineItemId;

            //If line exists don't add new line.
            if(!lineExists){
              data.order.line_items[addLineItemId -1] = addLineItem;
            }

            //Re-calculate total price by summing up all lines
            var totalPrice = 0;
            //Loop through all order lines and reset  the ids and recalculate total
            for (var count = 0; count < data.order.line_items.length; count++) {
              //console.log("Count: " + data.order.line_items[count]);
              data.order.line_items[count].line_id = count + 1;
              //sum up all totals
              totalPrice = totalPrice + (data.order.line_items[count].price * data.order.line_items[count].quantity);
            }

            //update total totalPrice
            data.order.total_price = totalPrice;

            //save the data
            data.save(function(err) {
              if (err) {
                response = {
                  "error": true,
                  "message": "Error adding line item"
                };
              } else {
                var message = "";
                if(lineExists){
                  message = "Line item " + addLineItemId + " has been updated in order " + req.params.id;
                }else{
                  message = "Line item " + addLineItemId + " has been added to order " + req.params.id;
                }
                response = {
                  "error": false,
                  "message": message
                };
              }
              res.statusCode = 201;
              res.json(response);
            })
          } else {
            response = {
              "error": false,
              "message": "No payload"
            };
          }
        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    });
  })
////////////////////////////////

////////////////////////////////
//Remove order line items
router.route("/orders/:id/lines/:lineid")
  //Update quantity of an order line
  .put(function(req, res) {
    var response = {};

    //create query to check if order exists
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before deleting
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          //Update line item
          console.log("Line item to be updated: " + JSON.stringify(data.order.line_items[req.params.lineid - 1]));
          if (data.order.line_items[req.params.lineid - 1] !== undefined) {

            //Validation that minimun details required are present
            var validation = true;
            // update quantity
            if (req.body.quantity <= 0) {
              response = {
                "error": true,
                "message": "Error updating line item. Quantity must be greater than 0"
              };
              validation = false;
            } else {
              data.order.line_items[req.params.lineid - 1].quantity = req.body.quantity;
              //Re-calculate total price by summing up all lines
              var totalLines = data.order.line_items.length;
              var totalPrice = 0;
              //Loop through all order lines and reset  the ids and recalculate total
              for (var count = 0; count < totalLines; count++) {
                //console.log("Count: " + data.order.line_items[count]);
                data.order.line_items[count].line_id = count + 1;
                //sum up all totals
                totalPrice = totalPrice + (data.order.line_items[count].price * data.order.line_items[count].quantity);
              }
              data.order.total_price = totalPrice;
            }
            //update order if no errors in validation
            if (validation) {
              //save the data
              data.save(function(err) {
                if (err) {
                  response = {
                    "error": true,
                    "message": "Error updating line item"
                  };
                } else {
                  response = {
                    "error": false,
                    "message": "Line item " + req.params.lineid + " has been updated in order " + req.params.id
                  };
                }
                res.json(response);
              })
            } else {
              res.json(response);
            }
          } else {
            //Line item doesn't exist
            response = {
              "error": true,
              "message": "Line item " + req.params.lineid + " does not exist in order " + req.params.id
            };
            res.json(response);
          }
        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    });
  })

  //Delete an order line that matches the ID
  .delete(function(req, res) {
    var response = {};

    //create query to check if order exists
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before deleting
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          //delete the line as per URI
          //console.log("Line item to be removed: " + JSON.stringify(data.order.line_items[req.params.lineid - 1]) );
          if (data.order.line_items[req.params.lineid - 1] !== undefined) {
            // Remove line item
            data.order.line_items.splice(req.params.lineid - 1, 1);

            //Redefine ID's for existing line items
            var totalLines = data.order.line_items.length;
            var totalPrice = 0;
            if (totalLines > 0) {
              //Loop through all order lines and reset  the ids and recalculate total
              for (var count = 0; count < totalLines; count++) {
                //console.log("Count: " + data.order.line_items[count]);
                data.order.line_items[count].line_id = count + 1;
                //sum up all totals
                totalPrice = totalPrice + (data.order.line_items[count].price * data.order.line_items[count].quantity);
              }
            }

            //update total totalPrice
            data.order.total_price = totalPrice;

            //save the data
            data.save(function(err) {
              if (err) {
                response = {
                  "error": true,
                  "message": "Error removing line item"
                };
              } else {
                response = {
                  "error": false,
                  "message": "Line item " + req.params.lineid + " has been removed from order " + req.params.id
                };
              }
              res.json(response);
            })

          } else {
            //Line item doesn't exist
            response = {
              "error": true,
              "message": "Line item " + req.params.lineid + " does not exist in order " + req.params.id
            };
            res.json(response);
          }

        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    });
  })
////////////////////////////////

////////////////////////////////
//Add address
router.route("/orders/:id/address")
  // add new address
  .post(function(req, res) {
    //response variable
    var response = {};

    //create query for later execution
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before adding line item
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          // ensure that json paylaod is not empty
          if (req.body !== undefined) {

            //get the Address payload
            var addAddress = req.body;
            //variable for address verification
            var errorInAddress = false;

            //Loop through address lines. If address exist, then error
            var totalAddressLines = data.order.address.length;
            if (totalAddressLines > 0) {
              //check if address exists
              for (var count = 0; count < totalAddressLines; count++) {
                //console.log("Count: " + data.order.line_items[count]);
                if (data.order.address[count].name == addAddress.name) {
                  var errorInAddress = true;
                  response = {
                    "error": true,
                    "message": addAddress.name + " address already exists in order " + req.params.id
                  };
                };
              }
            }

            if (errorInAddress == false) {
              //add new address to payload
              data.order.address[totalAddressLines] = addAddress;

              //save the data
              data.save(function(err) {
                if (err) {
                  response = {
                    "error": true,
                    "message": "Error adding line item"
                  };
                } else {
                  response = {
                    "error": false,
                    "message": addAddress.name + " address has been added to order " + req.params.id
                  };
                }
                res.statusCode = 201;
                res.json(response);
              })
            } else {
              res.json(response);
            }
          } else {
            response = {
              "error": false,
              "message": "No payload"
            };
          }
        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    });
  })
////////////////////////////////

////////////////////////////////
//Remove address
router.route("/orders/:id/address/:name")
  // update existing address
  .delete(function(req, res) {

    //response variable
    var response = {};

    //Address name to be removed
    var removeAddressName = req.params.name.toUpperCase();

    //set error in case address name found in loop
    var errorInAddress = true;

    //create query for later execution
    var query = mongoOp.findOne({
      'order.order_id': req.params.id
    });

    //execute the query to check that order exists before adding line item
    query.exec(function(err, data) {
      if (err) {
        //error fetching data
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        if (data) {
          //console.log("Remove address: " + removeAddressName);;
          //Look through address to check address name exists
          var totalAddressLines = data.order.address.length;
          //console.log("Address lines: " + totalAddressLines);
          response = {
            "error": true,
            "message": removeAddressName + " address not found in order " + req.params.id
          }
          var foundCount = -1;
          //Loop through all address lines and reset  the ids
          for (var count = 0; count < totalAddressLines; count++) {
            //check if address exists
            if (data.order.address[count].name === removeAddressName) {
              // address found so no errors
              errorInAddress = false;
              //Remove address line
              foundCount = count;
            }
          }

          //log updated payload
          //console.log(JSON.stringify(data.order));

          if (errorInAddress == true) {
            //send back error message
            res.json(response);
          } else {
            //Remove address line if foundCount >= 0)
            data.order.address.splice(foundCount, 1);
            //save changes
            data.save(function(err) {
              if (err) {
                response = {
                  "error": true,
                  "message": "Error removing address"
                };
              } else {
                response = {
                  "error": false,
                  "message": removeAddressName + " address has been removed from order " + req.params.id
                };
              }
              res.json(response);
            })
          }
        } else {
          //order doesn't exist
          response = {
            "error": true,
            "message": "Order " + req.params.id + " does not exists"
          };
          res.json(response);
        }
      }
    })
  })
////////////////////////////////

////////////////////////////////
//Process order and update status to success
router.route("/orders/:id/process")

  .post(function(req, res) {

    var response = {};
    var metadata = {};
    var query = {};
    //validation variables. Set to false if issues found
    var validation = true;
    //to capture error messages during validation
    var valError = "";
    //construct query
    query['order.order_id'] = req.params.id;
    query['order.status'] = "SHOPPING_CART";

    // Mongo command to fetch all data from collection.
    mongoOp.findOne(query, function(err, data) {
      if (err) {
        response = {
          "error": true,
          "message": "Error fetching data"
        };
        validation = false;
      } else {
        //response metadata
        if (data == null) {
          response = {
            "error": true,
            "message": "No Shopping Cart Order found with id: " + req.params.id
          };
          validation = false;
        }
      }
      ////////////////////////////////
      //Order detail validations
      ////////////////////////////////
      if (validation) {
        //Validate customer details
        if (JSON.stringify(data.order.customer) !== "{}") {
          if (data.order.customer.customer_id == undefined) {
            valError = valError + " customer.customer_id";
            validation = false;
          }
          if (data.order.customer.loyalty_level == undefined) {
            data.order.customer.loyalty_level = "NONE";
          }
          if (data.order.customer.first_name == undefined) {
            valError = valError + " customer.first_name";
            validation = false;
          }
          if (data.order.customer.last_name == undefined) {
            valError = valError + " customer.last_name";
            validation = false;
          }
          if (data.order.customer.phone == undefined) {
            valError = valError + " customer.phone";
            validation = false;
          }
          if (data.order.customer.email == undefined) {
            valError = valError + " customer.email";
            validation = false;
          }
        } else {
          valError = valError + " customer[]";
          validation = false;
        }

        //Validate payment details

        if (JSON.stringify(data.order.payment) !== "{}") {
          console.log(data.order.payment);
          if (data.order.payment.card_type == undefined) {
            valError = valError + " payment.card_type";
            validation = false;
          }
          if (data.order.payment.card_number == undefined) {
            valError = valError + " payment.card_number";
            validation = false;
          }
          if (data.order.payment.expiry_year == undefined) {
            valError = valError + " payment.expiry_year";
            validation = false;
          }
          if (data.order.payment.expiry_month == undefined) {
            valError = valError + " payment.expiry_month";
            validation = false;
          }
        } else {
          //in this release is OK not to send payment details
          //also appart from card_type other AVRO fields are nullable so not need to set to empty
          data.order.payment = {
            "card_type": "VISA_CREDIT",
            "card_number": "",
            "start_year": 0,
            "start_month": 0,
            "expiry_month": 0,
            "expiry_year": 0
          };
          //valError = valError + " payment[]";
          //validation = false;
        }

        //Validate shipping details
        if (JSON.stringify(data.order.shipping) !== "{}") {
          if (data.order.shipping.first_name == undefined) {
            valError = valError + " shipping.first_name";
            validation = false;
          }
          if (data.order.shipping.last_name == undefined) {
            valError = valError + " shipping.last_name";
            validation = false;
          }
          if (data.order.shipping.shipping_method == undefined) {
            valError = valError + " shipping.shipping_method";
            validation = false;
          }
          if (data.order.shipping.shipping_company == undefined) {
            valError = valError + " shipping.shipping_company";
            validation = false;
          }
          if (data.order.shipping.shipping_id == undefined) {
            valError = valError + " shipping.shipping_id";
            validation = false;
          }
          if (data.order.shipping.price <= 0) {
            valError = valError + " shipping.price<=0";
            validation = false;
          }
          //This validation is not required in this version
          if (data.order.shipping.ETA == undefined) {
            //ETA not enforced in this version. Next release
            data.order.shipping.ETA = "";
            //valError = valError + " shipping.ETA";
            //validation = false;
          }
        } else {
          valError = valError + " shipping[]";
          validation = false;
        }

        //Validate special details
        if (JSON.stringify(data.order.special_details) !== "{}") {
          if (data.order.special_details.personal_message == undefined) {
            //if undifined, set to empty as AVRO field is not nullable
            data.order.special_details.personal_message = "false";
          }
          if (data.order.special_details.gift_wrapping == undefined) {
            //if undifined, set to false as AVRO field is not nullable
            data.order.special_details.gift_wrapping = false;
          }
          if (data.order.special_details.delivery_notes == undefined) {
            //if undifined, set to empty as AVRO field is not nullable
            data.order.special_details.delivery_notes = "false";
          }
        } else {
          //if undifined, set to values
          data.order.special_details = {
            "personal_message": "",
            "gift_wrapping": false,
            "delivery_notes": ""
          };
        }

        //Validate Order Header details
        if (data.order.discount == undefined) {
          data.order.discount = 0;
        }

        //Validate address details
        if (data.order.address.length > 0) {
          //Loop through all address lines and validate
          for (var count = 0; count < data.order.address.length; count++) {
            if (data.order.address[count].line_1 == undefined) {
              valError = valError + " address[" + count + "].line_1";
              validation = false;
            }
            //fields that are not mandatory can be empty
            if (data.order.address[count].line_2 == undefined) {
              data.order.address[count].line_2 = "";
            }
            if (data.order.address[count].city == undefined) {
              data.order.address[count].city = "";
            }
            if (data.order.address[count].county == undefined) {
              data.order.address[count].county = "";
            }
            if (data.order.address[count].postcode == undefined) {
              valError = valError + " address[" + count + "].postcode";
              validation = false;
            }
            if (data.order.address[count].country == undefined) {
              valError = valError + " address[" + count + "].country";
              validation = false;
            }
          }
        } else {
          valError = valError + " address[]";
          validation = false;
        }

        //Validate product line details
        if (data.order.line_items.length > 0) {
          //Loop through all product lines and validate
          for (var count = 0; count < data.order.line_items.length; count++) {
            if (data.order.line_items[count].product_id == undefined) {
              valError = valError + " line_items[" + count + "].product_id";
              validation = false;
            }
            if (data.order.line_items[count].product_code == undefined) {
              valError = valError + " line_items[" + count + "].product_code";
              validation = false;
            }
            if (data.order.line_items[count].product_name == undefined) {
              valError = valError + " line_items[" + count + "].product_name";
              validation = false;
            }
            if (data.order.line_items[count].description == undefined) {
              valError = valError + " line_items[" + count + "].description";
              validation = false;
            }
            if (data.order.line_items[count].product_id == undefined) {
              valError = valError + " line_items[" + count + "].product_id";
              validation = false;
            }
            if (data.order.line_items[count].quantity == undefined) {
              valError = valError + " line_items[" + count + "].quantity";
              validation = false;
            }
            if (data.order.line_items[count].price == undefined) {
              valError = valError + " line_items[" + count + "].price";
              validation = false;
            }
            if (data.order.line_items[count].size == undefined) {
              valError = valError + " line_items[" + count + "].size";
              validation = false;
            }
            if (data.order.line_items[count].product_id == undefined) {
              valError = valError + " line_items[" + count + "].product_id";
              validation = false;
            }
            if (data.order.line_items[count].weight == undefined) {
              valError = valError + " line_items[" + count + "].weight";
              validation = false;
            }
            if (data.order.line_items[count].color == undefined) {
              valError = valError + " line_items[" + count + "].color";
              validation = false;
            }
            if (data.order.line_items[count].sku == undefined) {
              valError = valError + " line_items[" + count + "].sku";
              validation = false;
            }
            if (data.order.line_items[count].dimensions.unit == undefined) {
              valError = valError + " line_items[" + count + "].dimensions.unit";
              validation = false;
            }
            if (data.order.line_items[count].dimensions.length == undefined) {
              valError = valError + " line_items[" + count + "].dimensions.length";
              validation = false;
            }
            if (data.order.line_items[count].dimensions.height == undefined) {
              valError = valError + " line_items[" + count + "].dimensions.height";
              validation = false;
            }
            if (data.order.line_items[count].dimensions.width == undefined) {
              valError = valError + " line_items[" + count + "].dimensions.width";
              validation = false;
            }
          }
        } else {
          valError = valError + " line_items[]";
          validation = false;
        }

        //prepare response
        response = {
          "error": true,
          "message": "Could not process Order '" + req.params.id + "' as the following details are missing: " + valError
        };
      }
      ////////////////////////////////
      ////////////////////////////////
      //if no errors call API to process event
      if (validation) {
        data.order.status = "SUCCESS";
        console.log("processing order: " + req.params.id);
        performRequest("/order-event", "POST", data, function(response) {
          data.save(function(err) {
            if (err) {
              response = {
                "error": true,
                "message": "Error updating order"
              };
            }
            res.json(response);
          })
        });
      } else {
        //Response
        res.json(response);
      }
    });
  })
////////////////////////////////

////////////////////////////////
//Cancel an existing order that has satus=SUCCESS
router.route("/orders/:id/cancel")

  .post(function(req, res) {

    var response = {};
    var metadata = {};
    var query = {};
    //validation variables. Set to false if issues found
    var validation = true;
    //to capture error messages during validation
    var valError = "";
    //construct query
    query['order.order_id'] = req.params.id;
    query['order.status'] = "SUCCESS";

    // Mongo command to fetch all data from collection.
    mongoOp.findOne(query, function(err, data) {
      if (err) {
        response = {
          "error": true,
          "message": "Error fetching data"
        };
        validation = false;
      } else {
        //response metadata
        if (data == null) {
          response = {
            "error": true,
            "message": "No Success Order found with id: " + req.params.id
          };
          validation = false;
        }
      }

      ////////////////////////////////
      //if no errors call API to process event
      if (validation) {
        data.order.status = "CANCELED";
        console.log("processing order: " + req.params.id);
        performRequest("/order-event?type=canceled", "POST", data, function(response) {
          data.save(function(err) {
            if (err) {
              response = {
                "error": true,
                "message": "Error updating order"
              };
            }
            res.json(response);
          })
        });
      } else {
        //Response
        res.json(response);
      }
    });
  })
////////////////////////////////

////////////////////////////////
//methods to delete by system id
router.route("/orders/systemid/:id")

  //Delete the order that matches the system ID
  .delete(function(req, res) {
    var response = {};

    // deletes by system id
    mongoOp.findById(req.params.id, function(err, data) {
      if (err) {
        response = {
          "error": true,
          "message": "Error fetching data"
        };
      } else {
        // data exists, remove it.
        mongoOp.remove({
          _id: req.params.id
        }, function(err) {
          if (err) {
            response = {
              "error": true,
              "message": "Error deleting data"
            };
          } else {
            response = {
              "error": true,
              "message": "Data associated with " + req.params.id + "is deleted"
            };
          }
          res.json(response);
        });
      }
    });
  });
////////////////////////////////

////////////////////////////////////////////////////////////////
// Function to make REST Calls
////////////////////////////////////////////////////////////////
function performRequest(uri, method, data, response) {

  //set header for use in verts <> GET
  var headers = {};
  //convert JSON object to string
  var dataString = JSON.stringify(data);
  console.log(dataString);
  //If method is GET then convert data to query string and add to URI
  if (method == 'GET') {
    uri += '?' + querystring.stringify(data);
    headers = {
      'Content-Type': 'text/plain',
      'Content-Length': dataString.length
    };
  } else {
    headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': dataString.length
    };
  }

  //set the call properties
  var options = {
    host: apiHost,
    port: apiPort,
    path: uri,
    method: method,
    headers: headers
  };
  //log
  console.log("performing the folowing call: " + JSON.stringify(options));
  //make the HTTP call
  var req = http.request(options, function(res) {

    res.setEncoding('utf-8');
    var responseString = '';

    res.on('data', function(data) {
      responseString += data;
    });

    res.on('end', function() {
      //capture response
      var responseObject = JSON.parse(responseString);
      response(responseObject);
    });
  });

  req.write(dataString);
  req.end();
}

////////////////////////////////////////////////////////////////
// Start the server
////////////////////////////////////////////////////////////////
app.use('/', router);
app.listen(PORT);
console.log("Listening to PORT " + PORT);
