FROM node:16.16-alpine
LABEL org.beckett.image.authors="yifan@beckett.com"

# setup code and node modules
COPY vaulting /opt/vaulting
WORKDIR /opt/vaulting
RUN yarn install

# vaulting API & webhook port
EXPOSE 3000
EXPOSE 3001
EXPOSE 4000
EXPOSE 4001
EXPOSE 5000
EXPOSE 5001

# start the vaulting API server
WORKDIR /opt/vaulting
ENTRYPOINT ["npm", "run", "start"]
