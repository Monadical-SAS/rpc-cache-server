import { AccountInfo, ParsedAccountData } from "@solana/web3.js";

const METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
const VAULT_ID = "vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn";
const AUCTION_ID = "auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8";
const METAPLEX_ID = "p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98";
const MAX_WHITELISTED_CREATOR_SIZE = 2 + 32 + 10;
const MAX_NAME_LENGTH = 32;
const MAX_SYMBOL_LENGTH = 10;
const MAX_URI_LENGTH = 200;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const MAX_CREATOR_LIMIT = 5;

export interface ParsedAccountBase {
  pubkey: StringPublicKey;
  account: AccountInfo<Buffer>;
  info: any; // TODO: change to unknown
}

type StringPublicKey = string;

export interface ParsedAccount<T> extends ParsedAccountBase {
  info: T;
}

enum MetaplexKey {
  Uninitialized = 0,
  OriginalAuthorityLookupV1 = 1,
  BidRedemptionTicketV1 = 2,
  StoreV1 = 3,
  WhitelistedCreatorV1 = 4,
  PayoutTicketV1 = 5,
  SafetyDepositValidationTicketV1 = 6,
  AuctionManagerV1 = 7,
  PrizeTrackingTicketV1 = 8,
  SafetyDepositConfigV1 = 9,
  AuctionManagerV2 = 10,
  BidRedemptionTicketV2 = 11,
  AuctionWinnerTokenTypeTrackerV1 = 12,
}

class WhitelistedCreator {
  key: MetaplexKey = MetaplexKey.WhitelistedCreatorV1;
  address: StringPublicKey;
  activated: boolean = true;

  // Populated from name service
  twitter?: string;
  name?: string;
  image?: string;
  description?: string;

  constructor(args: { address: string; activated: boolean }) {
    this.address = args.address;
    this.activated = args.activated;
  }
}

function getFiltersForMetadataProgram(whitelistedCreators: ParsedAccount<WhitelistedCreator>[]) {
  let filters = [];
  for (let i = 0; i < MAX_CREATOR_LIMIT; i++) {
    for (let j = 0; j < whitelistedCreators.length; j++) {
      filters.push({
        memcmp: {
          offset:
            1 + // key
            32 + // update auth
            32 + // mint
            4 + // name string length
            MAX_NAME_LENGTH + // name
            4 + // uri string length
            MAX_URI_LENGTH + // uri
            4 + // symbol string length
            MAX_SYMBOL_LENGTH + // symbol
            2 + // seller fee basis points
            1 + // whether or not there is a creators vec
            4 + // creators vec length
            i * MAX_CREATOR_LEN,
          bytes: whitelistedCreators[j].info.address,
        },
      });
    }
  }
  return filters;
}

const whitelistedCreators: ParsedAccount<WhitelistedCreator>[] = []; //TODO: Fill this out

export const settings = {
  commitment: "recent",
  cacheFunctions: {
    names: ["getProgramAccounts", "getMultipleAccounts"],
    params: {
      getProgramAccounts: [
        METADATA_PROGRAM_ID,
        VAULT_ID,
        AUCTION_ID,
        METAPLEX_ID,
      ],
    },
    filters: {
      getProgramAccounts: {
        METAPLEX_ID: [
          {
            dataSize: MAX_WHITELISTED_CREATOR_SIZE,
          },
        ],
        METADATA_PROGRAM_ID: getFiltersForMetadataProgram(whitelistedCreators),
      },
    },
  },
};
