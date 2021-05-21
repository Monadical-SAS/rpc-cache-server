export interface ParsedKeyedAccountInfo {
  pubkey: string;
  account: {
    executable: boolean;
    lamports: number;
    rentEpoch: number;
    owner: string;
    data: any;
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
