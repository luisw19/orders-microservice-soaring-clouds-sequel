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

## To run a performance test using Apache Benchmark

1) [Install Apache Benchmark](https://www.tutorialspoint.com/apache_bench/apache_bench_environment_setup.htm) for your environment. In mac this is not required (should be avaialble by default)

2) Run your test. For example, to run 100 reads against orders collection:

```bash
ab -n 100 -n 10 -H 'api-key:351801a3-0c02-41c1-b261-d0e5aaa4a0e6' http://oc-129-156-113-240.compute.oraclecloud.com:8011/api/orders
```
