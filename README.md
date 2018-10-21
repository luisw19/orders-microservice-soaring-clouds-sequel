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

## To create Deployment/Service in Kubernetes

1) Set KUBECONFIG to match your target Kubernetes environment e.g.

```bash
export KUBECONFIG=$HOME/.kube/config
```

2) Create Orders namespace if it doesn't already exist

```bash
kubectl create -f k8s-namespace-orders.json
```

Verify that namespace was created
```bash
kubectl get namespaces --show-labels
```

3) Define “orders” context for the kubectl client to work with.

> NOTE: values for cluster and user were taken from kubeconfig file

```bash
 kubectl config set-context orders --namespace=orders-ms --cluster=<cluster value> --user=<user value>
```

4) Switch to “oders” context

```bash
 kubectl config use-context orders
```

5) Create mongo Deployment and Service

```bash
    kubectl create -f orders-mongo-db.yml
```
> Note that for now the Mongo DB is not part of the Helm package but released once and separately.

4) Install and configure [Helm](https://helm.sh)

If Tiller not already installed in the K8s cluster, then installed as per [this link]( https://docs.helm.sh/using_helm/#installing-tiller).
> Note that OKE has an option to provision a K8s cluster with Tiller enabled.

Install Helm CLI on Mac
```bash
brew install kubernetes-helm
```

Initialise command line with upgrade entry to ensure helm and tiller are on same version
```bash
helm init --upgrade
```

4) Deploy the Helm package by running

```bash
helm install ./orderspackage/ -n orderspackage
```

Verify pods were created width

```bash
kubectl get pods
```

5) To get the external IP of ingress run:

```bash
    kubectl get svc
```
 Take note of the "Node" IP for "orders-ms-xxx". Then run the following command to obtain the port:

```bash
 kubectl get ingress orderspackage-orders-ms-ing
```

6) To completely remove the release run

```bash
    helm delete --purge orderspackage
```
