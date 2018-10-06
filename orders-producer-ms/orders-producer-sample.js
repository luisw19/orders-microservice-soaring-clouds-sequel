var KafkaAvro = require('kafka-avro');
var avro = require('avsc');
var fmt = require('bunyan-format');
var kafkaLog = KafkaAvro.getLogger();
var topicName = process.env.KAFKA_ORDER_TOPIC;
//Get Kafka infrastructure  details from environment variables
var kafkaAvro = new KafkaAvro({
  kafkaBroker: process.env.KAFKA_BROKER,
  schemaRegistry: process.env.KAFKA_REGISTRY,
  parseOptions: {
    wrapUnions: true
  }
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
        dr_cb: true, //delivery report callback
        debug: "all",
        log_level: 7
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

        producer.on('delivery-report', function(err, report) {
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

        //sample order paylaod
        outOrder = {
          "orderId": "unittest",
          "shoppingCartId": "CUST0001",
          "status": "SUCCESS",
          "createdAt": "2018-03-04T07:22:35.718Z",
          "updatedAt": "2018-03-04T09:00:58.984Z",
          "totalPrice": 68.39,
          "discount": 0,
          "currency": "GBP",
          "payment": {
            "cardType": "VISA_CREDIT",
            "cardNumber": {
              "string": "**** **** **** 1111"
            },
            "startYear": {
              "int": 2018
            },
            "startMonth": {
              "int": 1
            },
            "expiryYear": {
              "int": 2020
            },
            "expiryMonth": {
              "int": 6
            }
          },
          "customer": {
            "customerId": {
              "string": "CUST0001"
            },
            "loyaltyLevel": "GOLD",
            "firstName": {
              "string": "Luis"
            },
            "lastName": {
              "string": "Weir"
            },
            "phone": {
              "string": "+44 (0) 757 5333 777"
            },
            "email": {
              "string": "myemail@email.com"
            }
          },
          "addresses": {
            "array": [{
              "name": {
                "string": "BILLING"
              },
              "line1": {
                "string": "22"
              },
              "line2": {
                "string": "King street"
              },
              "city": {
                "string": "Leamington Spa"
              },
              "county": {
                "string": "Warkwickshire"
              },
              "postcode": {
                "string": "CV31"
              },
              "country": {
                "string": "GB"
              }
            }]
          },
          "shipping": {
            "firstName": {
              "string": "Lucas"
            },
            "lastName": {
              "string": "Jellema"
            },
            "shippingMethod": "ECONOMY",
            "price": {
              "double": 10.00
            },
            "ETA": "2018-06-05T07:11:00.000Z"
          },
          "specialDetails": {
            "personalMessage": {
              "string": "From Luis with Love!"
            },
            "giftWrapping": {
              "boolean": true
            },
            "deliveryNotes": {
              "string": "Please try to deliver in the morning"
            }
          },
          "items": {
            "array": [{
              "productId": {
                "string": "abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6"
              },
              "productCode": {
                "string": "AX330T"
              },
              "productName": {
                "string": "Light Brown Men Shoe 1"
              },
              "description": {
                "string": "Light Brown Men Shoe 1"
              },
              "quantity": {
                "int": 2
              },
              "price": {
                "double": 68.39
              },
              "size": {
                "int": 43
              },
              "weight": {
                "double": 0
              },
              "dimension": {
                "unit": {
                  "string": "cm"
                },
                "length": {
                  "double": 10.2
                },
                "height": {
                  "double": 10.4
                },
                "width": {
                  "double": 5.4
                }
              },
              "color": {
                "string": "White"
              },
              "sku": {
                "string": "S15T-Flo-RS"
              }
            }]
          }
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
