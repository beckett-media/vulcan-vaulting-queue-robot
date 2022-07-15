FROM node:16.16-alpine
LABEL org.beckett.image.authors="yifan@beckett.com"

# setup code and node modules
COPY vaulting /opt/vaulting
WORKDIR /opt/vaulting
RUN yarn install

# marketplace API port
EXPOSE 3300

# start the marketplace API server in development mode
WORKDIR /opt/vaulting
ENTRYPOINT ["npm", "run", "start:dev"]
