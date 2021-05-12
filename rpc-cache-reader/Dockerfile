FROM public.ecr.aws/lambda/nodejs:14

COPY dist/lib/rpc-cache-reader/src/reader.js dist/lib/rpc-cache-utils/src/config.js ./package.json ./
COPY dist/lib/rpc-cache-reader/src/solana_utils/getProgramAccounts.js ./solana_utils

RUN npm install

# Command can be overwritten by providing a different command in the template directly.
CMD ["reader.lambdaHandler"]