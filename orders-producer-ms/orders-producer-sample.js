var KafkaAvro = require('kafka-avro');
var avro = require('avsc');
var fmt = require('bunyan-format');
var kafkaLog  = KafkaAvro.getLogger();
var topicName = 'a516817-soaring-order-created';
//Get Kafka infrastructure  details from environment variables
var kafkaAvro = new KafkaAvro({
    //kafkaBroker: '129.150.77.116:6667',
    kafkaBroker: process.env.KAFKA_BROKER,
    //schemaRegistry: 'http://129.150.114.134:8081',
    schemaRegistry: process.env.KAFKA_REGISTRY,
    parseOptions: { wrapUnions: true }
});
//Variable containing the Order from Orders-MS
var inOrder = {};
//Variable containing the Order that will be produced
var outOrder = {};
//Counter for delivery report
var counter = 0;
var maxMessages = 1;

kafkaAvro.init()
    .then(function() {
        console.log('Ready to produce events to: ' + topicName);

        kafkaAvro.getProducer({
      	  // Options listed bellow
          dr_cb: true,  //delivery report callback
        	debug: "all",
        	log_level:7
      	})
      	    // "getProducer()" returns a Bluebird Promise.
      	    .then(function(producer) {

      	        producer.on('disconnected', function(arg) {
      	          console.log('producer disconnected. ' + JSON.stringify(arg));
      	        });

      	        producer.on('event.error', function(err) {
      	        		console.error('Error from producer');
      	        		console.error(err);
      	        });

                producer.on('delivery-report', function (err, report) {
                    console.log('in delivery report');
                    //Increase counter for setInterval()
                    counter++;
                    if (err) {
                        console.error('error occurred: ' + err);
                    } else {
                        console.log('message-delivered: ' + JSON.stringify(report));
                    }
                });

                //Create a Topic object with any options our Producer
                //should use when producing to that topic.
                var topic = producer.Topic(topicName, {
                   // Make the Kafka broker acknowledge our message (optional)
                    'request.required.acks': 1
                });

                //Sample order
                inOrder = {
                      "_id": "5a9b9ebb53d65b00116606a6",
                      "__v": 2,
                      "order": {
                          "order_id": "unittest",
                          "shoppingCart_id": "CUST0001",
                          "total_price": 68.39,
                          "_links": {
                              "self": {
                                  "href": "/orders/unittest"
                              }
                          },
                          "line_items": [
                              {
                                  "product_id": "abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6",
                                  "product_code": "AX330T",
                                  "product_name": "Light Brown Men Shoe 1",
                                  "description": "Light Brown Men Shoe 1",
                                  "quantity": 2,
                                  "price": 68.39,
                                  "size": 43,
                                  "weight": 0,
                                  "color": "White",
                                  "sku": "S15T-Flo-RS",
                                  "line_id": 1,
                                  "_id": "5a9b9ec653d65b00116606a7",
                                  "dimensions": {
                                      "unit": "cm",
                                      "length": 10.2,
                                      "height": 10.4,
                                      "width": 5.4
                                  }
                              }
                          ],
                          "address": [
                              {
                                  "name": "BILLING",
                                  "line_1": "22",
                                  "line_2": "King street",
                                  "city": "Leamington Spa",
                                  "county": "Warkwickshire",
                                  "postcode": "CV31",
                                  "_id": "5a9b9eca53d65b00116606a8",
                                  "country": "GB"
                              }
                          ],
                          "customer": {
                              "customer_id": "CUST0001",
                              "first_name": "Luis",
                              "last_name": "Weir",
                              "phone": "+44 (0) 757 5333 777",
                              "email": "myemail@email.com"
                          },
                          "payment": {
                              "expiry_month": 6,
                              "expiry_year": 2020,
                              "start_month": 1,
                              "start_year": 2018,
                              "card_number": "**** **** **** 1111",
                              "card_type": "VISA_CREDIT"
                          },
                          "currency": "GBP",
                          "updated_at": "2018-03-04T09:00:58.984Z",
                          "created_at": "2018-03-04T07:22:35.718Z",
                          "status": "SUCCESS"
                      }
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
                      "array":[
                        {
                          "name": {"string": inOrder.order.address[0].name},
                          "line1": {"string": inOrder.order.address[0].line_1},
                          "line2": {"string": inOrder.order.address[0].line_2},
                          "city": {"string": inOrder.order.address[0].city},
                          "county": {"string": inOrder.order.address[0].county},
                          "postcode": {"string": inOrder.order.address[0].postcode},
                          "country": {"string": inOrder.order.address[0].country}
                        }
                      ]
                    },
                    "items":{
                      "array":[
                        {
                          "productId": {"string": inOrder.order.line_items[0].product_id},
                          "productCode": {"string": inOrder.order.line_items[0].product_code},
                          "productName": {"string": inOrder.order.line_items[0].product_name},
                          "description": {"string": inOrder.order.line_items[0].description},
                          "quantity": {"int": inOrder.order.line_items[0].quantity},
                          "price": {"double": inOrder.order.line_items[0].price},
                          "size": {"int": inOrder.order.line_items[0].size},
                          "weight": {"double": inOrder.order.line_items[0].weight},
                          "dimension": {
                            "unit": {"string": inOrder.order.line_items[0].dimensions.unit},
                            "length": {"double": inOrder.order.line_items[0].dimensions.length},
                            "height": {"double": inOrder.order.line_items[0].dimensions.height},
                            "width": {"double": inOrder.order.line_items[0].dimensions.width}
                          },
                          "color": {"string": inOrder.order.line_items[0].color},
                          "sku": {"string": inOrder.order.line_items[0].sku}
                        }
                      ]
                    },
                };

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
                      if (counter === maxMessages) {
                        clearInterval(pollLoop);
                        producer.disconnect();
                      }
                    }, 1000);

      	    });
    });
