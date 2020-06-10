FROM node:11.13-alpine

# create the log directory
RUN mkdir -p /var/log/order_managementapi
RUN mkdir /uploads
RUN mkdir -p /uploads/services

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

RUN npm config set unsafe-perm true
RUN npm install pm2 -g

# Map a volume for the log files and add a volume to override the code
VOLUME ["/src", "/var/log/order_managementapi"]

# Bundle app source
COPY . /usr/src/app

RUN chmod +x /usr/src/app/bin/www

EXPOSE 7000

RUN npm cache clean --force 

RUN npm install

RUN apk add --no-cache sudo
RUN apk add --no-cache bash

RUN adduser -S docker && echo "docker:docker" | chpasswd

ENV NPM_CONFIG_PREFIX=/home/docker/.npm-global

USER docker

CMD [ "pm2-runtime", "boot.json" ]