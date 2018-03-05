# Orders Producer Service
This service is responsible for producing "order created" events to "topic a516817-soaring-order-created".
Events are produced as user completes Orders through the web application.

The code is based on the example from Guido Schmutz:
https://github.com/gschmutz/product-soaring-clouds-sequel/tree/master/example/nodejs

## To run the samples:

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
	node orders-producer-sample.js
```
5) To consume events run:

```bash
	node orders-consumer-sample.js
```

## To run the REST server:

1) Clone locally all the content of this folder locally

```bash
	git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

2) Install the NPM libraries: express, body-parser and kafka-avro as following:

```bash
	npm install express --save
	npm install body-parser --save
	npm install kafka-avro --safe
	npm install
```

3) Set environment variables as following:

```bash
	export KAFKA_BROKER=129.150.77.116:6667
	export KAFKA_REGISTRY=http://129.150.114.134:8081
```
4) Start the application:

```bash
	npm start
```
5) Produce an Order Event with the following sample CURL code:

```bash
	curl -X POST http://localhost:4000/order-event -H "Content-Type: application/json" -d '{"_id":"5a9c9538fe6cd6c47a42dbad","__v":36,"order":{"order_id":"unittest","shoppingCart_id":"CUST0001","total_price":273.56,"_links":{"self":{"href":"/orders/unittest"}},"line_items":[{"product_id":"AX330T","product_code":"abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6","product_name":"Light Brown Men Shoe 1","description":"Light Brown Men Shoe 1","quantity":2,"price":68.39,"size":43,"weight":0,"color":"White","sku":"S15T-Flo-RS","line_id":1,"_id":"5a9c9a7c35bb07c494e5de17","dimensions":{"unit":"cm","length":10.2,"height":10.4,"width":5.4}},{"product_id":"AX330T","product_code":"abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6","product_name":"Light Brown Men Shoe 1","description":"Light Brown Men Shoe 1","quantity":2,"price":68.39,"size":43,"weight":0,"color":"White","sku":"S15T-Flo-RS","line_id":2,"_id":"5a9c9aebdcea5ec4a180e54a","dimensions":{"unit":"cm","length":10.2,"height":10.4,"width":5.4}}],"address":[{"name":"BILLING","line_1":"22","line_2":"King street","city":"Leamington Spa","county":"Warkwickshire","postcode":"CV31","_id":"5a9c96f160da76c488ab6fbd","country":"GB"},{"name":"DELIVERY","line_1":"22","line_2":"King street","city":"Leamington Spa","county":"Warkwickshire","postcode":"CV31","_id":"5a9c970e60da76c488ab6fbf","country":"GB"}],"customer":{"customer_id":"CUST0001","email":"myemail@email.com","first_name":"Luis","last_name":"Weir","phone":"+44 (0) 757 5333 777"},"payment":{"expiry_month":6,"expiry_year":2020,"start_month":1,"start_year":2018,"card_number":"**** **** **** 1111","card_type":"VISA_CREDIT"},"currency":"GBP","updated_at":"2018-03-05T01:02:43.630Z","created_at":"2018-03-05T00:54:16.941Z","status":"SHOPPING_CART"}}'
```
