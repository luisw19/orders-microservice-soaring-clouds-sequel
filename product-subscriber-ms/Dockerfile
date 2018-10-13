#  Node based on Debian GNU/Linux 8 -must be used as kafka-avro errors with non-debian based distros
FROM node:9

# Create Subscriber Service directory and copy source to it
RUN mkdir -p /usr/src/ms
COPY . /usr/src/ms
WORKDIR /usr/src/ms
RUN rm -rf node_modules

#Install kafka-avro dependencies e.g. Cyrus SASL, etc
RUN apt-get update && apt-get install -y \
curl \
build-essential \
groff-base \
libdb-dev \
libssl1.0.0 libssl-dev libiodbc2 libiodbc2-dev libsasl2-2 libsasl2-dev \
sasl2-bin

############ dependenies
RUN npm install express --save
RUN npm install mongoose --save
RUN npm install body-parser --save
RUN npm install bcrypt --save
RUN npm install kafka-avro --save
RUN npm install

# start command
CMD [ "node", "product-subscriber-ms.js" ]
