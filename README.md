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

## To install Orders Microservice in [Oracle Container Engine for Kubernetes](https://cloud.oracle.com/containers/kubernetes-engine) using [Helm](https://helm.sh/) and [Nginx Ingress](https://kubernetes.github.io/ingress-nginx/):

1) Configure an Nginx ingress controller by following the instructions [oke-ingress](https://github.com/luisw19/oci-series/tree/master/oke-istio)

2) Set KUBECONFIG to match your target Kubernetes environment e.g.

```bash
export KUBECONFIG=$HOME/.kube/config
```

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
kubectl config set-context orders --user=user-c3tayteg5st --cluster=cluster-c3tayteg5st --namespace=orders-ms
kubectl config use-context orders
```

4) Using the [openssl](https://www.openssl.org/) utility [generate a TLS certificate](https://istio.io/docs/tasks/traffic-management/secure-ingress/sds/) for domain **orders.sttc.com**:

```bash
openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes \
-out orders.sttc.com.crt -keyout orders.sttc.com.key
```

When prompted enter further details as desired, for example:

```bash
Country Name (2 letter code) []:GB
State or Province Name (full name) []:Warwickshire
Locality Name (eg, city) []:Leamington
Organization Name (eg, company) []:STTC
Organizational Unit Name (eg, section) []:Orders
Common Name (eg, fully qualified host name) []:orders.sttc.com
Email Address []:me@sttc.com
```

Once completed this should generate the **httpbin.adomain.com.crt** and **httpbin.adomain.com.key** files.

> Note that **Common Name** is a domain name and should match
> the **Hosts** value in the Ingress Gateway.

5) Create the Kubernetes secret **orders.sttc.com.secret** in the **oders-ms** namespace:

```bash
kubectl create secret tls orders.sttc.com.secret --key orders.sttc.com.key --cert orders.sttc.com.crt
```

> note that `-n orders-ms` is **not** included as **kubectl config context **should be set to **orders**

6) Deploy the *Orders Package* using [Helm](https://helm.sh/):

```bash
helm install ./orderspackage/ -n orderspackage
```

- To **uninstall** run:

```bash
helm delete --purge orderspackage
kubectl delete namespace orders-ms
```

## To install Orders Microservice in [Oracle Container Engine for Kubernetes](https://cloud.oracle.com/containers/kubernetes-engine) using [Helm](https://helm.sh/) and using Helm and [Istio Service Mesh](https://istio.io/docs/concepts/what-is-istio/):

1) Configure Istio as described in [oke-istio](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/oke-istio). Once completed, delete the **httpbin** sample as following:

```bash
kubectl delete namespace httpbin-istio
kubectl -n istio-system delete secret httpbin-istio-secret
```

> This is required because **Istio's Ingress Controller** doesn't support
> certificates of two different domains mapped against the same **Gateway**.

2) Follow steps **2** to **4** as described in the previous section.

3) Create the Kubernetes secret **orders.sttc.com.secret** in the **istio-system** namespace:

```bash
kubectl create -n istio-system secret generic orders.sttc.com.secret \
--from-file=key=orders.sttc.com.key \
--from-file=cert=orders.sttc.com.crt
```

3) Uninstall **orderspackage** (if previously deployed)

```bash
helm delete --purge orderspackage
```

3) **Label** the **orders-ms** namespace as following:

```bash
kubectl label namespace orders-ms istio-injection=enabled
```

4) Install the package:

```bash
helm install ./orderspackage/ -n orderspackage \
--set ingres.nginx.enable=false \
--set ingres.istio.enable=true
```

5) Test the service as following:

```bash
export ORDERS_DOMAIN=orders.sttc.com
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
```

First try with HTTP:
```bash
curl http://$INGRESS_HOST/orders-ms/api/health
```

Then HTTPS:
```bash
curl --insecure -HHost:$ORDERS_DOMAIN \
--resolve $ORDERS_DOMAIN:$SECURE_INGRESS_PORT:$INGRESS_HOST \
https://$ORDERS_DOMAIN/orders-ms/api/health
```

> It may take a couple of minutes for the certificates to load. So you may need to retry a few times before it works.

> Also notice the curl parameters **--insecure**, **-HHost** and **--resolve**. These were added
> to resolve the domain **httpbin.adomain.com** against the ingress IP and Port using the self-signed cert.
> Alternatively add an entry to the /etc/hosts file to match
> the Ingress IP to the domain used.

6) To delete the package and the secret run:

```bash
helm delete --purge orderspackage
kubectl delete secret orders.sttc.com.secret -n istio-system
```
