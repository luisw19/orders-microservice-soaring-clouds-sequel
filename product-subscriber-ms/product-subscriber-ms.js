//kafka vars - more info on https://www.npmjs.com/package/kafka-avro
var KafkaAvro = require('kafka-avro');
var fmt = require('bunyan-format');
var kafkaLog  = KafkaAvro.getLogger();
//Read environment variable KAFKA_HOST
var kafkaBroker = process.env.KAFKA_BROKER;
//var kafkaBroker = "129.150.77.116:6667";
//var kafkaRegistry = "http://129.150.114.134:8081";
var kafkaRegistry = process.env.KAFKA_REGISTRY;
var kafkaConsumerGroup = "librd-test2";
var topicName = 'a516817-soaring-add-to-shopping-cart';

//HTTP vars
var querystring = require('querystring');
//var https = require('https');
var http = require('http');
//var apiHost = "127.0.0.1";
var apiHost = process.env.ORDERSAPI_HOST;
//var apiPort = 3000;
var apiPort = process.env.ORDERSAPI_PORT;
var response = {};
var order = {};
var orderCheck = {};
var productItem = {};
var href = "";

////////////////////////////////////////////////////////////////
// Function to make REST Calls
////////////////////////////////////////////////////////////////
function performRequest(uri, method, data, response) {

  //set header for use in verts <> GET
  var headers = {};
  //convert JSON object to string
  var dataString = JSON.stringify(data);

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
  console.log("performing the folowing call: "+ JSON.stringify(options));
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
// Functions to create shopping cart (if one doesn't exist) and add items
////////////////////////////////////////////////////////////////
function upsertShoppingCart() {
  performRequest("/orders", "GET", orderCheck, function(response) {
    //Step 1, check if the shopping cart exists
    console.log('searchOrder response: ' + JSON.stringify(response));
    if(response.metadata.result_count==0){
      //Step 2, if it doesn't exist create the shopping basket
      performRequest("/orders", "POST", order, function(response) {
        console.log('createOrder response: ' + JSON.stringify(response));
        //get Hateoas link from result of creating the order
        href = response._links.self.href;
        addProductItem(href);
      });
    }else {
      //get Hateoas link from the order that was found
      href = response.orders[0].order._links.self.href;
      addProductItem(href);
    }
  });
}
//Step 3 add product to basket regardless
function addProductItem(href) {
  console.log("step 3");
  performRequest(href + "/lines", "POST", productItem, function(response) {
    console.log('addProductItem response: ' + JSON.stringify(response));
  });
}

////////////////////////////////////////////////////////////////
// Read Shopping Cart Items from Kafka Stream
////////////////////////////////////////////////////////////////
//set values for kafkaAvro with details of the
var kafkaAvro = new KafkaAvro({
    kafkaBroker: kafkaBroker,
    schemaRegistry: kafkaRegistry,
    parseOptions: { wrapUnions: true }
});

// Initiate Kafka Consumer
kafkaAvro.init()
    .then(function() {
        console.log('Ready to consume messages from: ' + topicName);
    });

//create Stream
kafkaLog.addStream({
    type: 'stream',
    stream: fmt({
        outputMode: 'short',
        levelInString: true,
    }),
    level: 'debug',
});

//Get Consumer Group
kafkaAvro.getConsumer({
  'group.id': kafkaConsumerGroup,
  'socket.keepalive.enable': true,
  'enable.auto.commit': true,
})
    // the "getConsumer()" method will return a bluebird promise.
    .then(function(consumer) {

        //Read messages
        var stream = consumer.getReadStream(topicName, {
          waitInterval: 0
        });

        //Exit if error
        stream.on('error', function(err) {
          //err and log was added as it wasn't in Guido's code
          console.log(err);
          process.exit(1);
        });

        //exist if error
        consumer.on('error', function(err) {
          console.log(err);
          process.exit(1);
        });

        //start streaming data
        stream.on('data', function(message) {
            //console.log('Received message:', message.parsed);
            console.log('Received message:', JSON.stringify(message.parsed));
            /* Then at this point we can create the order with
            status = SHOPPING_CART and add the product or just
            add the product line*/
            //shopping Cart status
            var orderStatus = 'SHOPPING_CART';
            //set Order Header Details
            order = {
              shoppingCart_id: message.parsed.customerId,
              currency: message.parsed.currency,
              status: orderStatus,
              customer: {
                customer_id: message.parsed.customerId
                //first_name: 'Luis',
                //last_name: 'Weir',
                //phone: '+44 (0) 757 5333 777',
                //email: 'myemail@email.com'
              }
            };

            console.log("Ready to create order: " + order);

            //Set Order Query
            orderCheck = {
              shoppingCart_id: message.parsed.customerId,
              status: orderStatus
            };
            //if SKU not present set to N/A
            var skuVal = "";
            if(message.parsed.product.sku!==undefined){
              skuVal = message.parsed.product.sku.string;
            }
            //Set Product line item
            productItem = {
            	product_id: message.parsed.product.productId,
              product_code: message.parsed.product.productCode.string,
            	product_name: message.parsed.product.productName.string,
            	description: message.parsed.product.description.string,
            	quantity: message.parsed.quantity,
            	price: message.parsed.priceInCurrency,
            	size: message.parsed.product.size.int,
            	weight: message.parsed.product.weight.double,
            	dimensions: {
            		unit: message.parsed.product.dimension.unit.string,
            		length: message.parsed.product.dimension.length.double,
            		height: message.parsed.product.dimension.height.double,
            		width: message.parsed.product.dimension.width.double,
            	},
            	color: message.parsed.product.color.string,
              sku: skuVal
            };

            console.log("Ready to create order line: " + JSON.stringify(productItem));

            //call function to create or update Shopping Cart
            upsertShoppingCart();

        });
    });
