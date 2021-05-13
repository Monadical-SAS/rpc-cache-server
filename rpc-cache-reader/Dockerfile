FROM public.ecr.aws/lambda/nodejs:14

COPY . .

RUN npm install

# Command can be overwritten by providing a different command in the template directly.
CMD ["dist/lib/rpc-cache-reader/src/reader-aws-lambda.lambdaHandler"]