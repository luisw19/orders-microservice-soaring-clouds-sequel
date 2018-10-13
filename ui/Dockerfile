FROM node:alpine

# Copy source of UI into container
RUN mkdir -p /usr/src/ui
COPY . /usr/src/ui

# Set working dir
WORKDIR /usr/src/ui
RUN rm -rf node_modules

############ Install dependencies
RUN npm -g install @oracle/ojet-cli
RUN npm install
RUN ojet build --release

############ Install bash
RUN apk add --update bash

EXPOSE 8080
CMD [ "bash","container-entrypoint.sh"]
