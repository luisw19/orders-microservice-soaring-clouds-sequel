# orders-microservice-soaring-clouds-sequel

Repository for the Orders Microservice, part of the Soaring Through The Clouds Sequel

## Run with Docker-Compose

1) Install docker and docker-compose

2) Run the following command

```bash
	docker-compose up
```
This will run 3 instances:

- Mongo database for Orders MS
- Orders Microservice (available in: http://localhost:3000/orders) --see API blueprint for methods supported and sample payloads
- Shopping Cart subscriber service listening to kafka topic a516817-soaring-add-to-shopping-cart

3) Add a Product Item to the Kafka Topic "a516817-soaring-add-to-shopping-cart" and verity that Shopping Cart Order is created and a line added to it

- Add Product Item to Shopping Cart

```bash
curl -X POST http://129.150.114.134:8080/shoppingCart -H "Content-Type: application/json" -d '{"sessionId":"abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6","customerId":"232422","currency":"USD","quantity":1,"product":{"productId":"abbfc4f9-83d5-49ac-9fa5-2909c5dc86e6","code":"AX329T","name":"Light Brown Men Shoe 1","imageUrl":"01_men_one.jpg","price":68.39,"size":43,"weight":0.0,"dimension":{"unit":"cm","length":10.2,"height":10.4,"width":5.4},"color":"lightbrown","tags":["tag"],"categories":["men"]}}'
```

- Check that the Shopping Cart Order was created by running the following command (replace HOST and PORT accordingly)

```bash
curl http://localhost:3000/orders?shoppingCart_id=232422&status=SHOPPING_CART
```

- Add more products to Shopping Cart with same "customerId" and read again the order. See how new lines are added.

3) To bring down gratefully run:

```bash
	docker-compose down
```

## To run Dredd unit tests execute

1) Install Dredd locally

```bash
	npm install -g dredd
```

2) Start the Microservice (see previous steps)

3) Run Dredd as following (note that "--sorted" is important to ensure HTTP verbs are executed in the right order)

```bash
	dredd --sorted
```

## To create Deployment/Service in Kubernetes (tested locally with minikube)

1) Build the docker image

```bash
	docker build . -t localhost:3000/orders-ms:0.1.0
```

2) Pull mongo and tag locally

```bash
  	docker pull mongo:3.2.9
  	docker tag mongo:3.2.9 localhost:27017/mongo:3.2.9
```

3) Create mongo Deployment and Service

```bash
    kubectl create -f orders-mongo-db.yml
```

4) Create orders Deployment and Service

```bash
	kubectl create -f orders-ms.yml
```

5) Get the application URL

```bash
    minikube service orders-ms --url
```

6) To delete the services (if required)

```bash
    kubectl delete deploy orders-mongo-db
    kubectl delete service orders-mongo-db

    kubectl delete deploy orders-ms
    kubectl delete service orders-ms
```
