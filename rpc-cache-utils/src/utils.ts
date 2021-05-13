export interface ParsedKeyedAccountInfo {
  pubkey: string;
  account: {
    executable: boolean;
    lamports: number;
    rentEpoch: number;
    owner: string;
    data: Buffer | string;
  };
}
