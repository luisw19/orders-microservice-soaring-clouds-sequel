FROM node:alpine

# Create Orders API directory and copy source to it
RUN mkdir -p /usr/src/api
COPY orders-ms /usr/src/api

# Create Subscriber Service directory and copy source to it
RUN mkdir -p /usr/src/api/sub
COPY product-subscriber-ms /usr/src/api/sub
WORKDIR /usr/src/api/sub
RUN npm install

# Set working dir
WORKDIR /usr/src/api

# Install Curl so registration script can be run
RUN apk add --update --no-cache curl
# Copy command to self-register service in API Platform
COPY scripts/register.sh /usr/src/app

# EXPOSE 3000
# CMD [ "npm", "start" ]
