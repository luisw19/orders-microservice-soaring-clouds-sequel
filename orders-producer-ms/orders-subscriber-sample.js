var KafkaAvro = require('kafka-avro');
var fmt = require('bunyan-format');
var kafkaLog  = KafkaAvro.getLogger();
// Topic Name can be a string, or an array of strings
var topicName = process.env.KAFKA_ORDER_TOPIC;
var kafkaAvro = new KafkaAvro({
  kafkaBroker: process.env.KAFKA_BROKER,
  schemaRegistry: process.env.KAFKA_REGISTRY,
  parseOptions: { wrapUnions: true }
});

kafkaAvro.init()
    .then(function() {
        console.log('Ready to consume messages from: ' + topicName);
    });


kafkaLog.addStream({
    type: 'stream',
    stream: fmt({
        outputMode: 'short',
        levelInString: true,
    }),
    level: 'debug',
});

kafkaAvro.getConsumer({
  'group.id': 'consumer-group1',
  'socket.keepalive.enable': true,
  'enable.auto.commit': true,
})
    // the "getConsumer()" method will return a bluebird promise.
    .then(function(consumer) {

        var stream = consumer.getReadStream(topicName, {
          waitInterval: 0
        });

        stream.on('error', function() {
          process.exit(1);
        });

        consumer.on('error', function(err) {
          console.log(err);
          process.exit(1);
        });

        stream.on('data', function(message) {
            console.log('Received Orders message:', message.parsed);
        });
    });
