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

1) Configure an Nginx ingress controller by following the instructions [oke-ingress](https://luisw19.github.io/oci-series/oke-istio/)

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
helm install orderspackage -n orderspackage \
--set ingress.nginx.enabled=true
```

- To **uninstall** run:

```bash
helm delete --purge orderspackage
kubectl delete namespace orders-ms
```

## To install Orders Microservice in [Oracle Container Engine for Kubernetes](https://cloud.oracle.com/containers/kubernetes-engine) using [Helm](https://helm.sh/) and using Helm and [Istio Service Mesh](https://istio.io/docs/concepts/what-is-istio/):

1) Configure **Istio** as described in [oke-istio](https://github.com/luisw19/orders-microservice-soaring-clouds-sequel/tree/master/oke-istio).

- If the **httpbin** sample was created, delete it following:

```bash
kubectl -n httpbin-istio delete service httpbin
kubectl -n httpbin-istio delete deployment httpbin
kubectl -n httpbin-istio delete gateway httpbin-gateway
kubectl -n httpbin-istio delete virtualservice httpbin-vts
kubectl -n istio-system delete secret httpbin-istio-secret
kubectl delete namespace httpbin-istio
```

> This is required because the HTTPS configuration was failing when using two
> certificates for two different domains mapped against the same **Gateway**.
> Could be that this feature is not supported so further investigation is required.

2) Follow steps **2** to **4** as described in the previous section.


3) Uninstall **orderspackage** (if previously deployed)

```bash
helm delete --purge orderspackage
```

4) **Label** the **orders-ms** namespace as following:

```bash
kubectl label namespace orders-ms istio-injection=enabled
```

5) Create the Kubernetes secret **orders.sttc.com.secret** in the **istio-system** namespace:

```bash
kubectl create -n istio-system secret generic orders.secret \
--from-file=key=orders.sttc.com.key \
--from-file=cert=orders.sttc.com.crt
```

6) Install the package:

```bash
helm install orderspackage -n orderspackage \
--set ingress.istio.enabled=true
```

> Add the flags `--dry-run --debug` to verity the installation before applying it.

> After installing, **helm upgrade** can be run instead to only apply changes.
> e.g. `helm upgrade orderspackage orderspackage`.

7) Test the service as following:

```bash
export ORDERS_DOMAIN=orders.sttc.com
export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].port}')
```

First try with HTTP:
```bash
curl -I http://$INGRESS_HOST/orders-ms/api/health
curl -I http://$INGRESS_HOST/orders-ms/ui/
```

Both should respond with a **HTTP/1.1 200 OK**

Then HTTPS:
```bash
curl -I --insecure https://$ORDERS_DOMAIN/orders-ms/api/health --resolve $ORDERS_DOMAIN:$SECURE_INGRESS_PORT:$INGRESS_HOST
curl -I --insecure https://$ORDERS_DOMAIN/orders-ms/ui/ --resolve $ORDERS_DOMAIN:$SECURE_INGRESS_PORT:$INGRESS_HOST
```

Both should respond with a **HTTP/2 200**

> It may take a couple of minutes for the certificates to load. So you may need to retry a few times before it works.

> Also notice the curl parameters **--insecure**, **-HHost** and **--resolve**. These were added
> to resolve the domain **httpbin.adomain.com** against the ingress IP and Port using the self-signed cert.
> Alternatively add an entry to the /etc/hosts file to match
> the Ingress IP to the domain used.

- To delete the package and the secret run:

```bash
helm delete --purge orderspackage
kubectl delete secret orders.sttc.com.secret -n istio-system
```

8) **Monitor** and **observe**:

- Start the **port-forwards** for **Grafana**, **Jaeger** and **Kiali** in this same order by running:

```bash
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 9090:9090 &
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000 &
kubectl -n istio-system port-forward $(kubectl get pod -n istio-system -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 16686:16686 &
kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 20001:20001 &
```

- Then access the service consoles:

[Prometheus](http://localhost:9090/graph):  http://localhost:9090/graph
[Grafana](http://localhost:9090/graph): http://localhost:3000
[Jaeger](http://localhost:9090/graph): http://localhost:16686
[Kiali](http://localhost:9090/graph): http://localhost:20001/kiali/

- Generate a few calls:

```bash
for ((i=1;i<=1000;i++)); do curl --insecure https://$ORDERS_DOMAIN/orders-ms/api/orders --resolve $ORDERS_DOMAIN:$SECURE_INGRESS_PORT:$INGRESS_HOST; done
```

- To **kill** all running port-forward prcoesses:

```bash
killall kubectl
```
## Tips:

- To **inspect** the **logs** within a **container** in a **pod**:

First **get** the pods:

```bash
kubectl get pods
```

Then **describe** one of the pods to get the name of the container:

```bash
kubectl describe pod orderspackage-product-sub-ms-5f6b7c8b97-z27cl
```

**Find** the name of the container to inspect and then run:

```bash
kubectl logs orderspackage-product-sub-ms-5f6b7c8b97-z27cl orderspackage-product-sub-ms
```
