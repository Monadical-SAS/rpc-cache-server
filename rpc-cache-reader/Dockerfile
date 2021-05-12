FROM public.ecr.aws/lambda/nodejs:14

COPY rpc-cache-reader/compiled/reader.js rpc-cache-reader/compiled/config.js ./package.json ./

RUN npm install

# Command can be overwritten by providing a different command in the template directly.
CMD ["reader.lambdaHandler"]