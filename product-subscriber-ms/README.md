# Product Consumer Service

This service is responsible for reading  product events from "idcs-1d61df536acb4e9d929e79a92f3414b5-soaringaddtoshoppingcart"
which are generated by users browsing the product Product Catalogue page and adding items to the shopping cart.

The code is based on the example from Guido Schmutz:
https://github.com/gschmutz/product-soaring-clouds-sequel/tree/master/example/nodejs

## To run

1) Clone locally all the content of this folder locally

```bash
git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

2) Make sure Orders MS is up and running (check out following link for instructions on how to start it up: https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/blob/master/README.md)

3) Install npm libs:

```bash
npm install
```

4) Set environment variables as following:

```bash
export KAFKA_BROKER=18.184.145.38:9092
export KAFKA_REGISTRY=http://18.184.145.38:18081
export KAFKA_SHOPPINGCART_TOPIC=soaring-add-to-shopping-cart
export ORDERSAPI_HOST=127.0.0.1
export ORDERSAPI_PORT=3000
```

5) Test that the topic is up and running

Produce a message

```bash
node product-producer-sample.js
```

Consume the message

```bash
node product-subscriber-sample.js
```

6) And finally run:

```bash
node product-subscriber-ms.js
```

Then produce another message by running:

```bash
node product-producer-sample.js
```

8) Check that the Shopping Cart Order was created by running the following command (replace HOST and PORT accordingly)

```bash
curl http://$ORDERSAPI_HOST:$ORDERSAPI_PORT/orders?shoppingCart_id=232422&status=SHOPPING_CART
```

9) Add more products to Shopping Cart with same "customerId" and read again the order. See how new lines are added.
