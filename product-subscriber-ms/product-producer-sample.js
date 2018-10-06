var KafkaAvro = require('kafka-avro');
var avro = require('avsc');
var fmt = require('bunyan-format');
var kafkaLog = KafkaAvro.getLogger();
var topicName = process.env.KAFKA_SHOPPINGCART_TOPIC;
//Get Kafka infrastructure  details from environment variables
var kafkaAvro = new KafkaAvro({
  kafkaBroker: process.env.KAFKA_BROKER,
  schemaRegistry: process.env.KAFKA_REGISTRY,
  parseOptions: {
    wrapUnions: true
  }
});
//Variable containing the sample shopping cart item that will be produced
var shoppingCart = {};
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
        shoppingCart = {
          "sessionId": "unittest",
          "customerId": "unittest",
          "quantity": 5,
          "priceInCurrency": 10.20,
          "currency": "EUR",
          "product": {
            "productId": "AX330T",
            "productCode": {
              "string": "AX330T"
            },
            "productName": {
              "string": "Light Brown Men Shoe 1"
            },
            "description": {
              "string": "Light Brown Men Shoe 1"
            },
            "imageUrl": {
              "string": "https://"
            },
            "price": {
              "double": 68.39
            },
            "size": {
              "int": 43
            },
            "weight": {
              "double": 1.20
            },
            "categories": ["shoes", "men", "clothing"],
            "tags": ["shoes", "men clothing", "brown"],
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
            }
          }
        };

        console.log("Producing Item: " + JSON.stringify(shoppingCart));

        //Set key to sessionId
        var key = shoppingCart.sessionId;
        // if partition is set to -1, librdkafka will use the default partitioner
        var partition = -1;
        //Produce event
        producer.produce(topic, partition, shoppingCart, key);

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
