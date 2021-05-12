FROM public.ecr.aws/lambda/nodejs:14

# COPY ./package.json ./
# COPY dist/lib/rpc-cache-reader/src/reader.js ./dist/lib/rpc-cache-reader/src
# COPY dist/lib/rpc-cache-utils/src/config.js ./dist/lib/rpc-cache-utils/src
# COPY dist/lib/rpc-cache-reader/src/solana_utils/getProgramAccounts.js ./dist/lib/rpc-cache-reader/src/solana_utils
COPY . .

RUN npm install

# Command can be overwritten by providing a different command in the template directly.
CMD ["dist/lib/rpc-cache-reader/src/reader.lambdaHandler"]