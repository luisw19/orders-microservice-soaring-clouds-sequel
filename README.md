# orders-microservice-soaring-clouds-sequel
Repository for the Orders Microservice, part of the Soaring Through The Clouds Sequel

## Run with Docker-Compose
1) Install docker and docker-compose
2) Run the following command
docker-compose up
3) To bring down gratefully run:
docker-compose down

## To run Dredd unit tests execute
1) Install Dredd locally
npm install -g dredd

2) Start the Microservice (see previous steps)

3) Run
dredd

## To create Deployment/Service in Kubernetes (tested locally with minikube)

1) Build the docker image

	docker build . -t localhost:3000/orders-ms:0.1.0

2) Pull mongo and tag locally

  	docker pull mongo:3.2.9
  	docker tag mongo:3.2.9 localhost:27017/mongo:3.2.9

3) Create mongo Deployment and Service

    kubectl create -f orders-mongo-db.yml

4) Create orders Deployment and Service

	kubectl create -f orders-ms.yml

5) Get the application URL

  minikube service orders-ms --url

6) To delete the services (if required)

  kubectl delete deploy orders-mongo-db
	kubectl delete service orders-mongo-db

	kubectl delete deploy orders-ms
	kubectl delete service orders-ms
