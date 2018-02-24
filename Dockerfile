FROM node:alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY orders-ms /usr/src/app

# Install Curl so registration script can be run
RUN apk add --update --no-cache curl
# Copy command to self-register service in API Platform
COPY scripts/register.sh /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]
