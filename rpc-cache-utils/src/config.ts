export const settings = {
  commitment: "recent",
  notSupportedEncoding: ["jsonParsed"],
  cacheFunctions: {
    names: ["getProgramAccounts"],
    params: {
      getProgramAccounts: [
        "WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC",
        "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
        // "9KEPoZmtHUrBbhWN1v1KWLMkkvwY6WLtAVUCPRtRjP4z",
        // "EhhTKczWMGQt46ynNeRX1WfeagwwJd7ufHvCDjRxjo5Q"
      ],
    },
    filters: {
      getProgramAccounts: {
        "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin": [
          [
            {
              dataSize: 388, // _MARKET_STATE_LAYOUT_V2.span
            },
          ],
        ],
      },
    },
  },
};
