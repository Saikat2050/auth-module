FROM ubuntu:20.04 redis:latest

RUN apt-get update
RUN apt-get install -y software-properties-common curl sudo

RUN curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
RUN apt-get install -y nodejs git git-core gcc make build-essential

RUN apt-get install -y redis-server

RUN npm install -g yarn

COPY package.json .
RUN yarn

COPY . /application
WORKDIR /application

RUN yarn run build

# generate JSON schemas
RUN node dist/lib/schemaGenerator.js

CMD ["yarn", "run", "serve"]