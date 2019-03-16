# Orders Microservice
This is the orders Microservice.

## To run the samples:

1) Clone locally all the content of this folder locally

```bash
	git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

2) Install libs:

```bash
	npm install
```

3) Set environment variables as following if wish to change from default:

```bash
	export APP_PORT=3000
	export EVENTAPI_HOST=localhost
	export EVENTAPI_PORT=4000
	export MONGODB_NAME=orders-mongo-db
	export MONGODB_PORT=27017
```

4) Run:

```bash
	npm start
``

5) Post an Order with the following sample CURL code:

```bash
	curl -X POST http://$EVENTAPI_HOST:$APP_PORT/orders -H "Content-Type: application/json" -d '{"currency":"GBP","customer":{"customer_id":"5aa851035511ef001a35430c"}}'
```

6) Verify that Order was created

```bash
	curl http://$EVENTAPI_HOST:$APP_PORT/orders
```
