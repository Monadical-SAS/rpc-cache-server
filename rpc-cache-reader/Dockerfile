FROM node:15-buster

ARG port=3000

COPY . .

RUN npm install

EXPOSE $port

# Command can be overwritten by providing a different command in the template directly.
CMD ["node", "dist/lib/rpc-cache-reader/src/reader.js"]