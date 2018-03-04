# Orders Producer Service
This service is responsible for producing "order created" events to "topic a516817-soaring-order-created-value".
Events are produced as user completes Orders through the web application.

The code is based on the example from Guido Schmutz:
https://github.com/gschmutz/product-soaring-clouds-sequel/tree/master/example/nodejs

## To run:

1) Clone locally all the content of this folder locally

```bash
	git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

2) Install kafka-avro:

```bash
	npm install kafka-avro --save
```

3) Set environment variables as following:

```bash
	export KAFKA_BROKER=129.150.77.116:6667
	export KAFKA_REGISTRY=http://129.150.114.134:8081
```
4) To produce events run:

```bash
	node orders-producer-ms.js
```
5) To consume events run:

```bash
	node orders-consumer-test.js
```
