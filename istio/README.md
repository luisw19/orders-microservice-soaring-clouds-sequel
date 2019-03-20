
# [Istio](https://istio.io/) installation in [Oracle Container Engine for Kubernetes](https://cloud.oracle.com/containers/kubernetes-engine)

> Note that the following installation is based on [Helm](https://istio.io/docs/setup/kubernetes/helm-install).
> Also note that the instructions below have been tested in Mac OS so for Windows adjustments will likely be needed.

1) Ensure HELM is above 2.10 by running.

  ```bash
	helm version
  ```

2) Download Istio’s [latest release](https://istio.io/docs/setup/kubernetes/download-release/)

- First decide on which location you wish to download Istio then optionally create a folder for the download.

  ```bash
	cd <location where Istio will be downloaded>
	mkdir istio
	cd istio
  ```

- Then download with the following command:

  ```bash
 	curl -L https://git.io/getLatestIstio | sh -
  ```

  > This will create a folder with all Istio executables and configuration files e.g. /istio-1.0.6

3) Set *$ISTIO_HOME* and add the *istioctl* to the path in case required.

- From the same location where Istio was downloaded, execute the following:

  ```bash
	cd istio-<version>
  export ISTIO_HOME=$PWD
	export PATH=$PWD/bin:$PATH
  ```

4) [Helm installation](https://helm.sh/) and [Tiller](https://helm.sh/docs/glossary/#tiller) installation:

- Ensure Tiller is installed on the server with the command:

  ```bash
  kubectl get pods -n kube-system | grep tiller
  ```

- Result from the above command should be similar to:

  ```bash
  $kubectl get pods -n kube-system | grep tiller
  tiller-deploy-54885b67b5-pkjnk          1/1     Running   0          26
  ```

  > in Oracle Container Engine for Kubernetes Tiller can be installed
  > during [service is provisioning](https://docs.cloud.oracle.com/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke.htm)

- Ensure Helm is installed on the client. In Mac this can be easily done with brew

  ```bash
	brew install kubernetes-helm
  ```

- Then initialised and ensure version matches the server:

  ```bash
	helm init
	helm init --upgrade
  ```

6) Create the istio-system namespaces

  ```bash
  kubectl create namespace istio-system
  ```

5) Create a secret for `kiali`:

- Create the base64 encoded username and password

   ```bash
   $ echo -n 'user' | base64
   dXNlcg==
   $ echo -n 'sample' | base64
   c2FtcGxl
   ```

- Create the secret:

  ```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: kiali
  namespace: istio-system
  labels:
    app: kiali
type: Opaque
data:
  username: YWRtaW4=
  passphrase: V2VsY29tZTE=
EOF
  ```

6) Create a secret for Grafana (in the example using the same base64 credentials)

  ```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: grafana
  namespace: istio-system
  labels:
    app: grafana
type: Opaque
data:
  username: YWRtaW4=
  passphrase: V2VsY29tZTE=
EOF
  ```

7) Install Istio with Helm:

- Basic installation with default settings:

  ```bash
  helm install $ISTIO_HOME/install/kubernetes/helm/istio --name istio --namespace istio-system
  ```

- To install with
[Prometheus](https://istio.io/docs/tasks/telemetry/querying-metrics/),
[Jeager](https://istio.io/docs/tasks/telemetry/distributed-tracing/),
[Grafana](https://istio.io/docs/tasks/telemetry/using-istio-dashboard/),
[Kiali](https://istio.io/docs/tasks/telemetry/kiali/) and
[Service Graph](https://istio.io/docs/tasks/telemetry/servicegraph/) enabled
we use a pre-defined Helm chart values and use it to install as following:

  ```bash
  helm install $ISTIO_HOME/install/kubernetes/helm/istio -f values-custom.yaml --name istio --namespace istio-system
  ```
  > Note that we're using *values-custom.yaml* which is based on original *values.yaml* from Istio
  > however parameters has been adjusted to provide support for the above-mentioned add-ons.
  > For details on options available when setting parameters
  > [check this URL](https://istio.io/docs/reference/config/installation-options)

- Verify that ingress services are running and that an **EXTERNAL-IP** has been allocated.

	```bash
	kubectl get svc -n istio-system | grep ingress
	```

	> Repeat the above process until an *EXTERNAL-IP* is assigned.
	> Note that this may take a few seconds as the controller is
	> basically creating an OCI load balancer also visible from the
	> OCI console itself under *Networking > Load Balancers*.

8) Access monitoring services via port-forwarding feature of kubectl:

- For Jaeger run command:

  ```bash
  kubectl port-forward -n istio-system $(kubectl get pod -n istio-system -l app=jaeger -o jsonpath='{.items[0].metadata.name}') 16686:16686 &
  ```

  Then access the following link in browser: http://localhost:16686

- For Prometheus run command:

  ```bash
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=prometheus -o jsonpath='{.items[0].metadata.name}') 9090:9090 &
  ```

  Then access the following link in browser: http://localhost:9090

- For Grafana run command:

  ```bash
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=grafana -o jsonpath='{.items[0].metadata.name}') 3000:3000 &
  ```

  Then access the following link in browser: http://localhost:3000

- For Kiali run command:

  ```bash
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=kiali -o jsonpath='{.items[0].metadata.name}') 20001:20001 &
  ```

  Then access the following link in browser: http://localhost:20001

- For Service Graph run command:

  ```bash
  kubectl -n istio-system port-forward $(kubectl -n istio-system get pod -l app=servicegraph -o jsonpath='{.items[0].metadata.name}') 8088:8088 &
  ```

  Then access the following link in browser: http://localhost:8088/force/forcegraph.html

- To remove kubectl port-forward processes that may still be running:

  ```bash
  killall kubectl
  ```

5) To uninstall:

  ```bash
  helm delete --purge istio
  ```

- Also had to execute the following to remove the Custom Resource Definitions as it seems Helm didn’t purge it.

  ```bash
  kubectl delete -f $ISTIO_HOME/install/kubernetes/helm/istio/templates/crds.yaml -n istio-system
  ```

- To delete the secrets previously created:

  ```bash
  kubectl delete secret grafana -n istio-system
  kubectl delete secret kiali -n istio-system
  ```

9) For Istio [automatic injection](https://istio.io/docs/setup/kubernetes/sidecar-injection/#automatic-sidecar-injection) of Envoy side-cars to work
the lable **istio-injection=enabled** has to be set to the target namespaces as following:

- Create a namespaces

  ```bash
  kubectl create namespace httpbin-istio
  ```

- Set the label

  ```bash
  kubectl label namespace httpbin-istio istio-injection=enabled
  ```

- To verity that the label was properly applied run:

  ```bash
  kubectl get namespace -L istio-injection
  ```

  Result should be something like:

  ```bash
  NAME            STATUS   AGE    ISTIO-INJECTION
  ...
  httpbin-istio   Active   25s   enabled
  ```

10) From the same namespace where istio-injection was enabled, deploy the Pods and verify that the Istio side-cars are being attached correctly:

- Based on [this Istio sample](https://istio.io/docs/tasks/traffic-management/ingress/), deploy the [HTTPBIN](https://httpbin.org) service and deployment manifest as following:

  First get the latest manifest file:

  ```bash
  curl -O https://raw.githubusercontent.com/istio/istio/release-1.0/samples/httpbin/httpbin.yaml
  ```

  Then apply the manifest:

  ```bash
  kubectl apply --namespace httpbin-istio -f httpbin.yaml
  ```

- First get all pods:

  ```bash
  kubectl get pods --namespace httpbin-istio
  ```

- Copy the name of the pod and execute:

  ```bash
  kubectl describe pod httpbin-5765746fb8-4f6kg --namespace httpbin-istio | grep istio-proxy
  ```

- The result should be something like:

  ```bash
  Annotations:       sidecar.istio.io/status:
                    {"version":"887285bb7fa76191bf7f637f283183f0ba057323b078d44c3db45978346cbc1a","initContainers":["istio-init"],"containers":["istio-proxy"]...
  ```

11) Creating the Istio [Ingress Gateway](https://istio.io/docs/tasks/traffic-management/ingress/)
and [Virtual Service](https://istio.io/docs/concepts/traffic-management/#virtual-services)

- First determine the Istio Ingress LB external IP and Ports by running the following commands:

  ```
  export INGRESS_HOST=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  export INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="http2")].port}')
  export SECURE_INGRESS_PORT=$(kubectl -n istio-system get service istio-ingressgateway -o jsonpath='{.spec.ports[?(@.name=="https")].port}')
  ```

  You can then echo the variables to see the values.

  ```
  echo $INGRESS_HOST $INGRESS_PORT $SECURE_INGRESS_PORT
  ```

- Create an Istio Ingress Gateway and Virtual Service as following:

  ```
cat <<EOF | kubectl apply --namespace httpbin -f -
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: httpbin-gateway
spec:
  selector:
    istio: ingressgateway # use Istio default gateway implementation
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: httpbin-vts
spec:
  hosts:
  - "*"
  gateways:
  - httpbin-gateway
  http:
  - match:
    - uri:
        prefix: /headers
    - uri:
        prefix: /status
    - uri:
        prefix: /delay
    route:
    - destination:
        port:
          number: 8000
        host: httpbin
EOF
  ```

- Test that the routes are working using Curl:

  ```
  curl -I http://$INGRESS_HOST:$INGRESS_PORT/headers
  curl -I http://$INGRESS_HOST:$INGRESS_PORT/status/200
  curl -I http://$INGRESS_HOST:$INGRESS_PORT/delay/5
  ```

  In all cases the response should be a **HTTP/1.1 200 OK**

12) [Istio Ingress TLS configuration](https://preliminary.istio.io/docs/tasks/traffic-management/secure-ingress/#configure-a-tls-ingress-gateway-for-multiple-hosts) for adding HTTPS support:

> Note that Istio provides 2 approaches to add TLS support in the Ingress Gateways.
> The first one is based on a [File Mount](https://preliminary.istio.io/docs/tasks/traffic-management/secure-ingress/mount/)
> and the second one using [Secret Discovery](https://preliminary.istio.io/docs/tasks/traffic-management/secure-ingress/sds/).
> Whereas both are approaches are fairly straight forward, when having to support multiple hosts (e.g. several subdomains) the
> Secret Discovery approach is simpler to implement as it won't require to re-deploy the istio-ingressgateway.

- Using the [openssl](https://www.openssl.org/) utility [generate a TLS certificate](https://www.linode.com/docs/security/ssl/create-a-self-signed-tls-certificate/) as following:

  ```
  openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out httpbin.crt -keyout httpbin.key
  ```

  When prompted enter further details as desired, for example:

  ```
  Country Name (2 letter code) []:GB
  State or Province Name (full name) []:Warwickshire
  Locality Name (eg, city) []:Leamington
  Organization Name (eg, company) []:STTC
  Organizational Unit Name (eg, section) []:Orders
  Common Name (eg, fully qualified host name) []:httpbin.adomain.com
  Email Address []:me@adomain.com
  ```

  Once completed this should generate *httpbin.key* and *httpbin.crt*.

  > Note that **Common Name** is a domain name and should match
  > the **Hosts** value in the Ingress Gateway.

- Now create the kubernetes secret to hold the server key and certificate just created:

  ```
  kubectl create -n istio-system secret tls istio-ingressgateway-httpbin-certs --key httpbin.key --cert httpbin.crt
  ```

  > Note that the secret must be called istio-ingressgateway-certs in
  > the istio-system namespace or it will not mount.

  Verity that the TLS certificates were created on the cluster by running:

  ```
  kubectl exec -it -n istio-system $(kubectl -n istio-system get pods -l istio=ingressgateway -o jsonpath='{.items[0].metadata.name}') -- ls -al /etc/istio/ingressgateway-certs
  ```

  The outcome should be similar to:

  ```
  drwxrwxrwt. 3 root root  120 Mar 18 08:59 .
  drwxr-xr-x. 1 root root 4096 Mar 17 12:56 ..
  drwxr-xr-x. 2 root root   80 Mar 18 08:59 ..2019_03_18_08_59_38.839129076
  lrwxrwxrwx. 1 root root   31 Mar 18 08:59 ..data -> ..2019_03_18_08_59_38.839129076
  lrwxrwxrwx. 1 root root   14 Mar 18 08:59 tls.crt -> ..data/tls.crt
  lrwxrwxrwx. 1 root root   14 Mar 18 08:59 tls.key -> ..data/tls.key
  ```
  >Note that it my take a few seconds for the tls files to be created.

- Re-create an Istio Ingress Gateway as following:

  > Notice that HTTPS support has been added to the Gateway

  ```
  cat <<EOF | kubectl apply --namespace httpbin -f -
  apiVersion: networking.istio.io/v1alpha3
  kind: Gateway
  metadata:
    name: istiosystem-gateway
  spec:
    selector:
      istio: ingressgateway # use Istio default gateway implementation
    servers:
    - port:
        number: 80
        name: http
        protocol: HTTP
      hosts:
      - "httpbin.adomain.com"
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        serverCertificate: /etc/istio/ingressgateway-certs/tls.crt
        privateKey: /etc/istio/ingressgateway-certs/tls.key
      hosts:
      - "httpbin.adomain.com"
  ---
  apiVersion: networking.istio.io/v1alpha3
  kind: VirtualService
  metadata:
    name: httpbin-vts
  spec:
    hosts:
    - "httpbin.adomain.com"
    gateways:
    - istiosystem-gateway
    http:
    - match:
      - uri:
          prefix: /headers
      - uri:
          prefix: /status
      - uri:
          prefix: /delay
      route:
      - destination:
          port:
            number: 8000
          host: httpbin
  EOF
  ```

- Test that the routes are working using Curl:

  HTTPS:
  ```
  curl -I --insecure \
  -HHost:httpbin.adomain.com \
  --resolve httpbin.adomain.com:$SECURE_INGRESS_PORT:$INGRESS_HOST \
  https://httpbin.adomain.com:$SECURE_INGRESS_PORT/headers
  ```

  Responses should be a **HTTP/2 200**

  and HTTP:
  ```
  curl -I --insecure \
  -HHost:httpbin.adomain.com \
  --resolve httpbin.adomain.com:$INGRESS_PORT:$INGRESS_HOST \
  http://httpbin.adomain.com:$INGRESS_PORT/headers
  ```

  Both responses should be a **HTTP/1.1 200 OK**

  > Note that the curl parameters -HHost and --resolve were added
  > to resolve the domain httpbin.adomain.com against the ingress IP and Port.
  > Alternatively add an entry to the /etc/hosts file to match
  > the Ingress IP to the domain used.

- Delete the sample if desired by running the following commands:

  ```
  kubectl delete -n httpbin service httpbin
  kubectl delete -n httpbin deployment httpbin
  kubectl delete -n httpbin gateway httpbin-gateway
  kubectl delete -n httpbin virtualservice httpbin-vts
  kubectl delete secret istio-ingressgateway-certs -n istio-system
  ```

13) Allowing HTTPS access to Grafana and Kiali via the Ingress Gateway.

  kubectl create -n istio-system secret tls istio-ingressgateway-certs --key mykey.key --cert mycert.crt
  kubectl apply -f grafana-ingress.yaml -n istio-system

  kubectl delete gateway istiosystem-gateway -n istio-system
  kubectl delete virtualservice grafana-vts -n istio-system
