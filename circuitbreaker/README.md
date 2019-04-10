#Mallorca demo for applying Circuit Breaker using Istio

1. Firstly get all the **services** available in the **orders-ms** namespace:

```bash
kubectl get services -n orders-ms
```

2. Run the following to apply an Istio **destination rule** to **orderspackage-orders-ms**:

```yaml
kubectl apply -f - <<EOF
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: orders-ms-dr
spec:
  host: orderspackage-orders-ms
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 1
      http:
        http1MaxPendingRequests: 1
        maxRequestsPerConnection: 1
    outlierDetection:
      consecutiveErrors: 1
      interval: 1s
      baseEjectionTime: 10s
      maxEjectionPercent: 100
EOF
```

> The rule sets a connection pool size of **1 concurrent TCP or HTTP requests**. In addition, it will **scan** orderspackage-orders-ms
> **every 1 second**, such that if the service **fails** at least once with **5XX error** code the service will be **ejected**
> for **10 seconds**.

> For more information on **Destination Rules** [click here](https://istio.io/docs/reference/config/networking/v1alpha3/destination-rule/)

3. Verity that rule was properly applied:

```bash
kubectl get destinationrule orders-ms-dr -o yaml
```

4. Run a test:

- Install [Fortio](https://github.com/fortio/fortio). In Mac it can be done as following:

```bash
brew install fortio
```

- Now we execute a test. First execute 100 sequential "read orders" requests with no concurrency.

> Note that the **host/ip** should be adjusted based on the environment where test is taking place.

```bash
fortio load -c 1 -qps 0 -n 30 -loglevel Warning http://<ip:port>/orders-ms/api/orders
```

Look for a `Code 200: 20 (100%)` meaning test succeeded.

- Now run a similar test but with 3 concurrent requests instead.

```bash
fortio load -c 5 -qps 0 -n 30 -loglevel Warning http://<ip:port>/orders-ms/api/orders
```

Notice that this time around there a good percentage of calls failed with a **Code 503**.
This is because the Istio Circuit Breaker destination policy.

- Now delete the destination rule by running `kubectl delete DestinationRule orders-ms-dr`. Run the same test again. Notice that again result is 100% success.
