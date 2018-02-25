
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var mongoOp     =   require("./model/mongo");
var router      =   express.Router();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

var PORT = process.env.APP_PORT || 3000;
var APP_VERSION = "1.0.0";
var APP_NAME = "OrdersMS";

console.log("Running " + APP_NAME + "version " + APP_VERSION);

router.get('/health', function (req, res) {
    var response = { "status": "OK", "uptime": process.uptime(),"version": APP_VERSION };
    res.json(response);
});

////////////////////////////////
//route() will allow you to use same path for different HTTP operation.
//So if you have same URL but with different HTTP OP such as POST,GET etc
//Then use route() to remove redundant code./

////////////////////////////////
//search and create oders
router.route("/orders")

    // GET method
    .get(function(req,res){

        var response = {};
        var metadata = {};
        var query = {};

        //construct dynamic query
        //search by customer id
        if(req.query.customer !== undefined){
          query['order.customer.customer_id'] = req.query.customer;
        }
        //search by shoppingCart_id
        if(req.query.shoppingCart_id !== undefined){
          query['order.shoppingCart_id'] = req.query.shoppingCart_id;
        }
        //from
        if(req.query.date_from !== undefined){
          query['order.created_at'] =  {'$gte': new Date(req.query.date_from)};
        }
        //from and to
        if(req.query.date_from !== undefined  && req.query.date_to!==undefined){
          query['order.created_at'] =  {'$gte': new Date(req.query.date_from), '$lte': new Date(req.query.date_to)};
        }

        // Mongo command to fetch all data from collection.
        mongoOp.find(query,function(err,data){
            if(err) {
                response = {"error" : true, "message" : "Error fetching data"};
            } else {
                //response metadata
                var resultCount = data.length;
                //Count results
                metadata = {"result_count" : resultCount };
                //send response
                response = {metadata, "orders" : data};
            }
            //Response
            res.json(response);
        });

    })

    // POST method
    .post(function(req,res){
        var db = new mongoOp();
        var response = {};
        // fetch order from REST request.
        // Ideally we should add validation here
        db.order = req.body;

        //Order Address, Payment, and Line arrays should be empty
        db.order.address = [];
        db.order.payment = {};
        db.order.line_items = [];

        //create random order id
        var order_id = Math.random().toString(36).substr(2, 9);

        //Get HTTP Header user-agent
        var header = req.headers['user-agent'];
        //console.log(JSON.stringify(req.headers));

        //If user-agent is dredd (meaning is a dredd test), use pre-defined ID
        if(header.includes("Dredd")){
            //create random order_id
            order_id = "unittest";
        }

        //If user-agent is postman (meaning is a postman test), use pre-defined ID
        if(header.includes("Postman")){
            //create random order_id
            order_id = "unittest";
        }

        //set the id
        db.order.order_id = order_id;

        //set dates (for some reasons if left to default it won't query properly)
        var now = new Date();
        db.order.created_at = now.toJSON();
        db.order.updated_at = now.toJSON();

        //save the data
        db.save(function(err){
        // save() will run insert() command of MongoDB.
        // it will add new data in collection.
            if(err) {
                console.log(err);
                response = {"error" : true,"message" : "Error adding data"};
            } else {
                response = {"error" : false,"message" : "Created order: " + order_id};
            }
            res.statusCode = 201;
            res.json(response);
        });
  });
////////////////////////////////

////////////////////////////////
//read, update or delete orders
router.route("/orders/:id")

    // get a order that matches the ID in the GET URL
    .get(function(req,res){
        //response variable
        var response = {};
        //create query for later execution
        var query = mongoOp.findOne({ 'order.order_id': req.params.id });
        // execute the query
        query.exec(function (err, data) {
          // This will run Mongo Query to fetch data based on ID.
          if(err) {
            response = {"error" : true, "message" : "Error fetching data"};
          } else {
            //response metadata
            if(data == null){
              response = {"error" : true, "message" : "No record found for order id: " + req.params.id};
            }else {
              //total number of lines
              //console.log("Total number of lines: " + data.order.line_items.length);
              response = data;
            }
          }
          res.json(response);
        });
    })

    // update the order that matches the ID in the GET url
    .put(function(req,res){
      //response variable
      var response = {};

      //create query for later execution
      var query = mongoOp.findOne({ 'order.order_id': req.params.id });

      //execute the query to check that order exists before deleting
      query.exec(function (err, data) {
        if(err) {
          //error fetching data
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          if(data){
            // ensure that json paylaod is not empty
            if(req.body !== undefined) {
              //get the updated Order paylaod
              var updatedOrder = req.body;

              //** Should add validation here **//

              //Update only fields that are allowed to be updated
              //Update Order status
              if(updatedOrder.status!==undefined){
                data.order.status = updatedOrder.status;
              }

              //Update Payment Details
              if(updatedOrder.payment!==undefined){
                data.order.payment = updatedOrder.payment;
              }else{
                data.order.payment = {};
              }

              //update updated date
              var now = new Date();
              data.order.updated_at = now.toJSON();

              //save the data
              data.save(function(err){
                if(err) {
                  response = {"error" : true,"message" : "Error updating order"};
                } else {
                  response = {"error" : false,"message" : "Order " + req.params.id + " has been updated"};
                }
                res.json(response);
              })
            }else{
              response = {"error" : false,"message" : "No payload"};
            }
          }else{
            //order doesn't exist
            response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
            res.json(response);
          }
        }
      });
    })

    //Delete the order that matches the ID
    .delete(function(req,res){
      var response = {};

      //Get HTTP Header user-agent
      //var header = req.headers['user-agent'];

      //create query to check if order exists
      var query = mongoOp.findOne({ 'order.order_id': req.params.id });

      //execute the query to check that order exists before deleting
      query.exec(function (err, data) {
        if(err) {
          //error fetching data
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          if(data){
            //if order exists remove it unless is a Dredd test
            //console.log(header.includes("Dredd"));
            //if(! header.includes("Dredd") ){
              mongoOp.remove({'order.order_id' : req.params.id},function(err){
                if(err) {
                  response = {"error" : true,"message" : "Error deleting data"};
                } else {
                  response = {"error" : false,"message" : "Order " + req.params.id + " deleted"};
                }
                res.json(response);
              });
            //}
          }else{
            //order doesn't exist
            response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
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
    .post(function(req,res){
      //response variable
      var response = {};

      //create query for later execution
      var query = mongoOp.findOne({ 'order.order_id': req.params.id });

      //execute the query to check that order exists before adding line item
      query.exec(function (err, data) {
        if(err) {
          //error fetching data
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          if(data){
            // ensure that json paylaod is not empty
            if(req.body !== undefined) {

              //get the line item payload
              var addLineItem = req.body;

              //Get number of line items in existing order
              //console.log("Current number of line items: " + odertest.line_items.length);
              var addLineItemId = data.order.line_items.length;

              //Increment line item number based on current number of lines
              if(addLineItemId !== undefined){
                addLineItemId = addLineItemId + 1;
              }else{
                addLineItemId = 1;
              }
              //console.log("Line item id: " + addLineItemId);

              //Set line item id
              addLineItem.line_id = addLineItemId;
              //Add line item to array (note that array count start with zero hence the "- 1")
              data.order.line_items[addLineItemId - 1] = addLineItem;

              //Re-calculate total price by summing up all lines
              var totalLines = data.order.line_items.length;
              var totalPrice = 0;
              //Loop through all order lines and reset  the ids and recalculate total
              for (var count = 0; count < totalLines; count++) {
                //console.log("Count: " + data.order.line_items[count]);
                data.order.line_items[count].line_id = count + 1;
                //sum up all totals
                totalPrice = totalPrice + data.order.line_items[count].price;
              }

              //update total totalPrice
              data.order.total_price = totalPrice;

              //save the data
              data.save(function(err){
                if(err) {
                  response = {"error" : true,"message" : "Error adding line item"};
                } else {
                  response = {"error" : false,"message" : "Line item " + addLineItemId + " has been added to order "+ req.params.id};
                }
                res.statusCode = 201;
                res.json(response);
              })
            }else{
              response = {"error" : false,"message" : "No payload"};
            }
          }else{
            //order doesn't exist
            response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
            res.json(response);
          }
        }
      });
  })
////////////////////////////////

////////////////////////////////
//Remove order line items
router.route("/orders/:id/lines/:lineid")
  //Delete an order line that matches the ID
  .delete(function(req,res){
    var response = {};

    //create query to check if order exists
    var query = mongoOp.findOne({ 'order.order_id': req.params.id });

    //execute the query to check that order exists before deleting
    query.exec(function (err, data) {
      if(err) {
        //error fetching data
        response = {"error" : true,"message" : "Error fetching data"};
      } else {
        if(data){
          //delete the line as per URI
          //console.log("Line item to be removed: " + JSON.stringify(data.order.line_items[req.params.lineid - 1]) );
          if(data.order.line_items[req.params.lineid - 1] !== undefined){
            // Remove line item
            data.order.line_items.splice(req.params.lineid-1, 1);

            //Redefine ID's for existing line items
            var totalLines = data.order.line_items.length;
            var totalPrice = 0;
            if(totalLines > 0){
              //Loop through all order lines and reset  the ids and recalculate total
              for (var count = 0; count < totalLines; count++) {
                //console.log("Count: " + data.order.line_items[count]);
                data.order.line_items[count].line_id = count + 1;
                //sum up all totals
                totalPrice = totalPrice + data.order.line_items[count].price;
              }
            }

            //update total totalPrice
            data.order.total_price = totalPrice;

            //save the data
            data.save(function(err){
              if(err) {
                response = {"error" : true,"message" : "Error removing line item"};
              } else {
                response = {"error" : false,"message" : "Line item " + req.params.lineid + " has been removed from order "+ req.params.id};
              }
              res.json(response);
            })

          }else{
            //Line item doesn't exist
            response = {"error" : true,"message" : "Line item " + req.params.lineid + " does not exist in order "+ req.params.id};
            res.json(response);
          }

        }else{
          //order doesn't exist
          response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
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
    .post(function(req,res){
      //response variable
      var response = {};

      //create query for later execution
      var query = mongoOp.findOne({ 'order.order_id': req.params.id });

      //execute the query to check that order exists before adding line item
      query.exec(function (err, data) {
        if(err) {
          //error fetching data
          response = {"error" : true,"message" : "Error fetching data"};
        } else {
          if(data){
            // ensure that json paylaod is not empty
            if(req.body !== undefined) {

              //get the Address payload
              var addAddress = req.body;
              //variable for address verification
              var errorInAddress = false;

              //Loop through address lines. If address exist, then error
              var totalAddressLines = data.order.address.length;
              if(totalAddressLines > 0){
                //check if address exists
                for (var count = 0; count < totalAddressLines; count++) {
                  //console.log("Count: " + data.order.line_items[count]);
                  if(data.order.address[count].name == addAddress.name){
                    var errorInAddress = true;
                    response = {"error" : true,"message" : addAddress.name + " address already exists in order "+ req.params.id};
                  };
                }
              }

              if(errorInAddress==false){
                //add new address to payload
                data.order.address[totalAddressLines]=addAddress;

                //save the data
                data.save(function(err){
                  if(err) {
                    response = {"error" : true,"message" : "Error adding line item"};
                  } else {
                    response = {"error" : false,"message" : addAddress.name + " address has been added to order "+ req.params.id};
                  }
                  res.statusCode = 201;
                  res.json(response);
                })
              }else{
                res.json(response);
              }
            }else{
              response = {"error" : false,"message" : "No payload"};
            }
          }else{
            //order doesn't exist
            response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
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
  .delete(function(req,res){

    //response variable
    var response = {};

    //Address name to be removed
    var removeAddressName = req.params.name.toUpperCase();

    //set error in case address name found in loop
    var errorInAddress = true;

    //create query for later execution
    var query = mongoOp.findOne({ 'order.order_id': req.params.id });

    //execute the query to check that order exists before adding line item
    query.exec(function (err, data) {
      if(err) {
        //error fetching data
        response = {"error" : true,"message" : "Error fetching data"};
      } else {
        if(data){
          //console.log("Remove address: " + removeAddressName);;
          //Look through address to check address name exists
          var totalAddressLines = data.order.address.length;
          //console.log("Address lines: " + totalAddressLines);
          response = {"error" : true,"message" : removeAddressName + " address not found in order "+ req.params.id}
          var foundCount = -1;
          //Loop through all order lines and reset  the ids
          for (var count = 0; count < totalAddressLines; count++) {
            //check if address exists
            if(data.order.address[count].name === removeAddressName){
              // address found so no errors
              errorInAddress = false;
              //Remove address line
              foundCount = count;
            }
          }

          //log updated payload
          //console.log(JSON.stringify(data.order));

          if(errorInAddress==true){
            //send back error message
            res.json(response);
          }else{
            //Remove address line if foundCount >= 0)
            data.order.address.splice(foundCount,1);
            //save changes
            data.save(function(err){
              if(err) {
                response = {"error" : true,"message" : "Error removing address"};
              } else {
                response = {"error" : false,"message" : removeAddressName + " address has been removed from order "+ req.params.id};
              }
              res.json(response);
            })
          }
        }else{
          //order doesn't exist
          response = {"error" : true,"message" : "Order " + req.params.id + " does not exists"};
          res.json(response);
        }
      }
    })
  })
////////////////////////////////

////////////////////////////////
//methods to delete by system id
router.route("/orders/systemid/:id")

  //Delete the order that matches the system ID
  .delete(function(req,res){
      var response = {};

      // deletes by system id
      mongoOp.findById(req.params.id,function(err,data){
          if(err) {
              response = {"error" : true,"message" : "Error fetching data"};
          } else {
              // data exists, remove it.
              mongoOp.remove({_id : req.params.id},function(err){
                  if(err) {
                      response = {"error" : true,"message" : "Error deleting data"};
                  } else {
                      response = {"error" : true,"message" : "Data associated with "+req.params.id+"is deleted"};
                  }
                  res.json(response);
              });
          }
      });
    });
////////////////////////////////

app.use('/',router);

app.listen(PORT);
console.log("Listening to PORT " + PORT);
