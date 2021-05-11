FROM public.ecr.aws/lambda/nodejs:14

COPY ./compiled/reader.js ./compiled/config.js package.json ./

RUN npm install

# Command can be overwritten by providing a different command in the template directly.
CMD ["reader.lambdaHandler"]