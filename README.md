# orders-microservice-soaring-clouds-sequel

Repository for the Orders Microservice, part of the Soaring Through The Clouds Sequel

## Clone the repository locally as following:

```bash
git clone https://github.com/luisw19/orders-microservice-soaring-clouds-sequel.git
```

## Run locally using Docker-Compose

1) Install [Docker](https://www.docker.com/get-started) and [docker-compose](https://docs.docker.com/compose/install/)

2) Run the following command

```bash
cd orders-microservice-soaring-clouds-sequel
docker-compose up
```
This will run 5 containers:

- A [Mongo](https://www.mongodb.com/) database
- Orders microservice (available in: http://localhost:3000/orders) --see API blueprint for methods supported and sample payloads
- Shopping cart subscriber service listening to kafka topic soaring-add-to-shopping-cart
- An Order producer service that will produce completed orders to kafka topic soaringordercreated

> Check docker-compose.yml for details on the environment variables used.

3) Test that the services are running correctly by:

- Follow [these steps](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/orders-producer-ms) to produce a sample item.

- Verity than an Order was created by running:

	```bash
	curl http://localhost:3000/orders
	```

- Follow [these steps](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/orders-producer-ms) to produce a sample processed order.

- Follow [These steps](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/ui) to run the UI locally against the running services.

	> Note that the UI can be tested stand-alone using docker-compose.

4) To bring down gratefully run:

```bash
docker-compose down
```

## To create Deployment/Service in Kubernetes using Helm and Nginx Ingress:

1) Set KUBECONFIG to match your target Kubernetes environment e.g.

```bash
export KUBECONFIG=$HOME/.kube/config
```

2) Configure an Nginx ingress controller by following the instructions [oke-ingress](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/oke-ingress)

3) Create the orders-ms namespace. Also a local context and switch to it:

	First take note of the default context details by running:

	```bash
	kubectl config view
	```

	> Take note of *name*, *user* and *cluster* under section *"- contexts"*.

	Run the following commands to create the *orders-ms* namespace, a local context
	called *orders* and then switch to it:

	```bash
	kubectl create namespace orders-ms
	kubectl config set-context orders --user=user-c3wczrxmftd --cluster=cluster-c3wczrxmftd --namespace=orders-ms
	kubectl config use-context orders
	```

4) Create a *TLS certificate* for domain *orders.sttc.com* as per step [6) of the oke-ingress configuration](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/oke-ingress) and then create the secret in the oders-ms namespace:

	```bash
	kubectl create secret tls orders-secret --key tls.key --cert tls.crt
	```

5) Deploy the *Orders Package* using [Helm](https://helm.sh/):

	```bash
	helm install ./orderspackage/ -n orderspackage
	```

6)
