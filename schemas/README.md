# Schemas
This folder contains different AVRO and JSON Schemas used in the microservices. It also contains a schema validator that can be used to validate JSON payloads against AVRO schemas.

Following a validation sample based on
https://community.hortonworks.com/articles/91250/validating-avro-schema-and-json-file.html

## validate a JSON payload against an AVRO schema follow these steps:

1) Download schema validator Jar

```bash
  wget http://www.us.apache.org/dist/avro/avro-1.8.2/java/avro-tools-1.8.2.jar
```

2) Run the following command where

- xx.avsc = AVROvro schema to be used
- yy.json = JSON payload to validate against AVRO
- zz.avro = Serialised AVRO paylod. Will be generated only if validation is successfull  

```bash
  java -jar ./avro-tools-1.8.2.jar fromjson --schema-file xx.avsc yy.json > zz.avro
```
for exmaple:

```bash
  java -jar ./avro-tools-1.8.2.jar fromjson --schema-file order-created.avsc order-created.json > order-created.avro
```
