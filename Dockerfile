FROM node:latest

WORKDIR /client
RUN npm install -g create-react-app
RUN npm install axios
RUN npm install socket.io-client
RUN npm install -g vite
CMD ["npm", "run", "dev"]
