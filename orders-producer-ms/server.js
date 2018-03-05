//Variables for REST server
var express     =   require("express");
var app         =   express();
var bodyParser  =   require("body-parser");
var router      =   express.Router();
var PORT = process.env.APP_PORT || 4000;
var APP_VERSION = "1.0.0";
var APP_NAME = "OrderProducerMS";
var response = {};
//Variables for Kafka
var KafkaAvro = require('kafka-avro');
var avro = require('avsc');
var fmt = require('bunyan-format');
var kafkaLog  = KafkaAvro.getLogger();
var topicName = 'a516817-soaring-order-created';
//Variable containing the Order from Orders-MS
var inOrder = {};
//Variable containing the Order that will be produced
var outOrder = {};
//Counter for delivery report
var report = {};
var counter = 0;

////////////////////////////////////////////////////////////////
// REST server
////////////////////////////////////////////////////////////////
//Set Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

//Log startup
console.log("Running " + APP_NAME + " version: " + APP_VERSION);

//Health resource
router.get('/health', function (req, res) {
    response = { "status": "OK", "uptime": process.uptime(),"version": APP_VERSION };
    res.json(response);
});

//Producer resource
router.post('/order-event', function (req, res) {
    //set inOrder from body
    inOrder = req.body;
    //init Kafka
    //initKafkaAvro();
    produceOrderEvent(inOrder,function(report){
      response = {"error" : false,"message" : {"message delivery report" : report}};
      res.json(response);
    });
});

////////////////////////////////////////////////////////////////
// Start server
////////////////////////////////////////////////////////////////
//start REST server
app.use('/',router);
app.listen(PORT);
console.log("Listening to PORT " + PORT);
//start Kafka connection
//Get Kafka infrastructure  details from environment variables
var kafkaAvro = new KafkaAvro({
    //kafkaBroker: '129.150.77.116:6667',
    kafkaBroker: process.env.KAFKA_BROKER,
    //schemaRegistry: 'http://129.150.114.134:8081',
    schemaRegistry: process.env.KAFKA_REGISTRY,
    parseOptions: { wrapUnions: true }
});
initKafkaAvro(kafkaAvro);

////////////////////////////////////////////////////////////////
// Functions to publish to Kafka
////////////////////////////////////////////////////////////////
//function to initiate Kafka Avro listener
function initKafkaAvro(kafkaAvro) {
  kafkaAvro.init()
          .then(function () {
              console.log('Ready to produce events to: ' + topicName);
          });
};
//function to publish
function produceOrderEvent(inOrder,response) {
    console.log('publising Order: ' + JSON.stringify(inOrder));
    kafkaAvro.getProducer({
  	  //delivery report callback
      dr_cb: true,
  	})
      // "getProducer()" returns a Bluebird Promise.
      .then(function(producer) {

        producer.on('disconnected', function(arg) {
          console.log('producer disconnected. ' + JSON.stringify(arg));
        });

        producer.on('event.error', function(err) {
        		console.error('Error from producer');
        		console.error(err);
            producer.disconnect();
        });

        producer.on('delivery-report', function (err, report) {
            console.log('in delivery report');
            //Increase counter for setInterval()
            counter++;
            if (err) {
                console.error('error occurred: ' + err);
                producer.disconnect();
            } else {
                console.log('message-delivered: ' + JSON.stringify(report));
                response(report);
            }
        });

        //Create a Topic object with any options our Producer
        //should use when producing to that topic.
        var topic = producer.Topic(topicName, {
           // Make the Kafka broker acknowledge our message (optional)
            'request.required.acks': 1
        });

        ///////////////////////////////////////////////
        ///// Mapping in values to out values
        ///////////////////////////////////////////////

        //Loop through all product lines
        var itemsArray = [];
        for (var count = 0; count < inOrder.order.line_items.length; count++) {
          itemsArray[count] = {
            "productId": {"string": inOrder.order.line_items[count].product_id},
            "productCode": {"string": inOrder.order.line_items[count].product_code},
            "productName": {"string": inOrder.order.line_items[count].product_name},
            "description": {"string": inOrder.order.line_items[count].description},
            "quantity": {"int": inOrder.order.line_items[count].quantity},
            "price": {"double": inOrder.order.line_items[count].price},
            "size": {"int": inOrder.order.line_items[count].size},
            "weight": {"double": inOrder.order.line_items[count].weight},
            "dimension": {
              "unit": {"string": inOrder.order.line_items[count].dimensions.unit},
              "length": {"double": inOrder.order.line_items[count].dimensions.length},
              "height": {"double": inOrder.order.line_items[count].dimensions.height},
              "width": {"double": inOrder.order.line_items[count].dimensions.width}
            },
            "color": {"string": inOrder.order.line_items[count].color},
            "sku": {"string": inOrder.order.line_items[count].sku}
          };
        };
        //Loop through all address lines
        var addressesArray = [];
        for (var count = 0; count < inOrder.order.address.length; count++) {
          addressesArray[count] = {
              "name": {"string": inOrder.order.address[count].name},
              "line1": {"string": inOrder.order.address[count].line_1},
              "line2": {"string": inOrder.order.address[count].line_2},
              "city": {"string": inOrder.order.address[count].city},
              "county": {"string": inOrder.order.address[count].county},
              "postcode": {"string": inOrder.order.address[count].postcode},
              "country": {"string": inOrder.order.address[count].country}
            };
        };
        outOrder = {
            "orderId": inOrder.order.order_id,
            "shoppingCartId": inOrder.order.shoppingCart_id,
            "status": inOrder.order.status,
            "createdAt": inOrder.order.created_at,
            "updatedAt": inOrder.order.updated_at,
            "totalPrice": inOrder.order.total_price,
            "currency": inOrder.order.currency,
            "payment": {
              "cardType": inOrder.order.payment.card_type,
              "cardNumber": {"string": inOrder.order.payment.card_number},
              "startYear": {"int": inOrder.order.payment.start_year},
              "startMonth": {"int": inOrder.order.payment.start_month},
              "expiryYear": {"int": inOrder.order.payment.expiry_year},
              "expiryMonth": {"int": inOrder.order.payment.expiry_month}
            },
            "customer": {
              "customerId": {"string": inOrder.order.customer.customer_id},
              "firstName": {"string": inOrder.order.customer.first_name},
              "lastName": {"string": inOrder.order.customer.last_name},
              "phone": {"string": inOrder.order.customer.phone},
              "email": {"string": inOrder.order.customer.email}
            },
            "addresses":{
              "array": addressesArray
            },
            "items":{
              "array": itemsArray
            }
        };
        ///////////////////////////////////////////////
        ///////////////////////////////////////////////

        console.log("Producing Order: " + JSON.stringify(outOrder));

        //Set key to Oder Id
        var key = outOrder.orderId;
        // if partition is set to -1, librdkafka will use the default partitioner
        var partition = -1;
        //Produce event
        producer.produce(topic, partition, outOrder, key);

        //need to keep polling for a while to ensure the delivery reports are received
        var pollLoop = setInterval(function() {
              producer.poll();
              console.log(counter);
              clearInterval(pollLoop);
              //producer.disconnect();
            }, 1000);

    });
};
