# orders-microservice-soaring-clouds-sequel

Repository for the Orders Microservice, part of the Soaring Through The Clouds Sequel

## Clone the repository locally as following:

```bash
	git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

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

3) Add a Product Item to the Kafka Topic and verity that Shopping Cart Order is created and a line added to it

- Add Product Item to Shopping Cart. This can be done as per instructions in ./product-subscriber-ms/README

- Check that the Shopping Cart Order was created as per instructions from ./orders-ms/README

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
	docker-compose build
```

2) Set Dockerconfig to match your target Kubernetes environment e.g.

```bash
	export KUBECONFIG=$HOME/kubeconfig
```

3) Create mongo Deployment and Service

```bash
    kubectl create -f orders-mongo-db.yml
```

4) Create Deployments and Services

```bash
	kubectl create -f orders-mongo-db.yml
	kubectl create -f orders-ms.yml
	kubectl create -f product-sub-ms.yml
```
Verify pods were created width

```bash
	kubectl get pods
```

5) 4. To get the external IP Orders Microservice is listening to the following commands:

```bash
    kubectl get pods -o wide
```
 Take note of the "Node" IP for "orders-ms-xxx". Then run the following command to obtain the port:

```bash
 	kubectl get services orders-ms
```

6) To delete the services (if required)

```bash
    kubectl delete deploy <e.g. orders-mongo-db>
    kubectl delete service <e.g. orders-mongo-db>
```
