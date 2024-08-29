export interface SubgraphConfig {
  apiKey: string;
  chainsResourceIds: string;
  developmentUrl?: string;
  environment: "development" | "production";
  productionUrl?: string;
  queriesDirectory?: string;
}

export interface SchemaMappingConfig
  extends Omit<SubgraphConfig, "queriesDirectory"> {}

export interface SubgraphConfigs {
  subgraphs: Array<SubgraphConfig>;
}

export interface ParsedResourceIds {
  [subgraphId: string]: {
    [chainId: number]: string;
  };
}

export interface SubgraphMetadataQuery {
  _meta: {
    block: {
      hash?: string | null;
      number: number;
      timestamp?: number | null;
    };
    deployment: string;
    hasIndexingErrors: boolean;
  };
}
