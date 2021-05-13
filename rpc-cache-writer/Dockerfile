FROM node:15-buster

COPY . .

RUN npm install

EXPOSE 3000

# Command can be overwritten by providing a different command in the template directly.
CMD ["node", "dist/lib/rpc-cache-writer/src/writer.js"]