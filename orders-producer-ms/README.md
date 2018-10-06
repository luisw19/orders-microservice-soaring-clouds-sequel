# Orders Producer Service
This service is responsible for producing "order created" events to "topic idcs-1d61df536acb4e9d929e79a92f3414b5-soaringordercreated".
Events are produced as user completes Orders through the web application.

The code is based on the example from Guido Schmutz:
https://github.com/gschmutz/product-soaring-clouds-sequel/tree/master/example/nodejs

## To run the samples:

1) Clone locally all the content of this folder locally

```bash
	git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

2) Install npm libs:

```bash
	npm install
```

3) Set environment variables as following:

```bash
	export APP_PORT=4000
	export KAFKA_BROKER=129.156.113.171:6667
	export KAFKA_REGISTRY=http://129.156.113.125:8081
	export KAFKA_ORDER_TOPIC=idcs-1d61df536acb4e9d929e79a92f3414b5-soaringordercreated
```
4) To produce events run:

```bash
	node orders-producer-sample.js
```
5) To consume events run:

```bash
	node orders-subscriber-sample.js
```

## To run the REST server:

6) Start the application:

```bash
	npm start
```
7) Produce an Order Event with the following sample CURL code:

```bash
	curl -X POST http://localhost:$APP_PORT/order-event -H "Content-Type: application/json" -d '{"_id":"5bb7cac9f2fabd515e2e4d7a","__v":2,"order":{"discount":0,"order_id":"unittest","shoppingCart_id":"5aa851035511ef001a35430c","total_price":60,"_links":{"self":{"href":"/orders/unittest"}},"line_items":[{"product_id":"42905ff6-2612-11e8-b467-0ed5f89f718b","product_code":"B01HJWV6YA","product_name":"P.A.N Harina Blanca - Pre-cooked White Corn Meal 2lbs 3.3oz","description":"description","quantity":2,"price":30,"size":0,"weight":1.13,"color":"Black","sku":"S15T-Flo-RS","line_id":1,"_id":"5bb7cae3f2fabd515e2e4d7b","dimensions":{"unit":"cm","length":22,"height":10,"width":22}}],"special_details":{"delivery_notes":"Please try to deliver in the morning","gift_wrapping":true,"personal_message":"From Luis with Love!"},"shipping":{"ETA":"","price":15,"shipping_method":"ECONOMY","last_name":"Jellema","first_name":"Lucas"},"address":[{"name":"BILLING","line_1":"22","line_2":"King street","city":"Leamington Spa","county":"Warkwickshire","postcode":"CV31","_id":"5bb7caf7f2fabd515e2e4d7c","country":"GB"}],"customer":{"customer_id":"5aa851035511ef001a35430c","email":"myemail@email.com","first_name":"Luis","last_name":"Weir","loyalty_level":"GOLD","phone":"+44 (0) 757 5333 777"},"payment":{"card_type":"VISA_CREDIT","card_number":"","start_year":0,"start_month":0,"expiry_month":0,"expiry_year":0},"currency":"GBP","updated_at":"2018-10-05T20:34:33.079Z","created_at":"2018-10-05T20:34:17.534Z","status":"SUCCESS"}}'
```
