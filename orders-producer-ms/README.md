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
	curl -X POST http://localhost:4000/order-event -H "Content-Type: application/json" -d '{"orderId":"unittest","shoppingCartId":"CUST0001","status":"SUCCESS","createdAt":"2018-03-07T23:57:49.937Z","updatedAt":"2018-03-07T23:57:58.904Z","totalPrice":136.78,"discount":0,"currency":"GBP","payment":{"cardType":"VISA_CREDIT","cardNumber":{"string":""},"startYear":{"int":0},"startMonth":{"int":0},"expiryYear":{"int":0},"expiryMonth":{"int":0}},"customer":{"customerId":{"string":"CUST0001"},"loyaltyLevel":"GOLD","firstName":{"string":"Luis"},"lastName":{"string":"Weir"},"phone":{"string":"+44 (0) 757 5333 777"},"email":{"string":"myemail@email.com"}},"addresses":{"array":[{"name":{"string":"BILLING"},"line1":{"string":"22"},"line2":{"string":"King street"},"city":{"string":"Leamington Spa"},"county":{"string":"Warkwickshire"},"postcode":{"string":"CV31"},"country":{"string":"GB"}}]},"shipping":{"firstName":{"string":"Lucas"},"lastName":{"string":"Jellema"},"shippingMethod":"ECONOMY","price":{"double":15},"ETA":""},"specialDetails":{"personalMessage":{"string":"From Luis with Love!"},"giftWrapping":{"boolean":true},"deliveryNotes":{"string":"Please try to deliver in the morning"}},"items":{"array":[{"productId":{"string":"AX330T"},"productCode":{"string":"abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6"},"productName":{"string":"Light Brown Men Shoe 1"},"description":{"string":"Light Brown Men Shoe 1"},"quantity":{"int":2},"price":{"double":68.39},"size":{"int":43},"weight":{"double":0},"dimension":{"unit":{"string":"cm"},"length":{"double":10.2},"height":{"double":10.4},"width":{"double":5.4}},"color":{"string":"White"},"sku":{"string":"S15T-Flo-RS"}}]}}'
```
