export interface SubgraphConfig {
  apiKey: string;
  chainsResourceIds: string;
  developmentUrl?: string;
  environment: "development" | "production";
  productionUrl?: string;
  queriesDirectory?: string;
};

export interface SubgraphConfigs {
  subgraphs: Array<SubgraphConfig>;
};

export interface ParsedResourceIds {
  [subgraphId: string]: {
    [chainId: number]: string;
  };
};
