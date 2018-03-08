FROM node:alpine

# Create Orders API directory and copy source to it
RUN mkdir -p /usr/src/api
COPY . /usr/src/api

# Set working dir
WORKDIR /usr/src/api

############ Install dependencies
RUN npm install express --save
RUN npm install --save mongoose
RUN npm install body-parser --save
RUN npm install cors
RUN npm install

# Install Curl so registration script can be run
RUN apk add --update --no-cache curl
# Copy command to self-register service in API Platform
COPY ./scripts/register.sh /usr/src/app

EXPOSE 3000
CMD [ "npm", "start" ]
