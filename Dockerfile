FROM node:4-onbuild
#FROM node:argon

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Bundle app source
COPY ./orders-ms/ /usr/src/app

# Install Curl so registration script can be run
RUN apt-get update && apt-get install -y curl
# Copy command to self-register service in API Platform
COPY ./scripts/register.sh /usr/src/app

EXPOSE 8080
CMD [ "npm", "start" ]
