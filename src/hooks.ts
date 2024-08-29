import { useMemo } from "react";

import {
  useSuspenseQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import request, { gql } from "graphql-request";
import { createPublicClient, http, type Chain } from "viem";

import type { SchemaMappingConfig, SubgraphMetadataQuery } from "./config";
import { generateSchemasMapping } from "./utils";

export const useNetworkBlockNumber = ({
  chain,
  options = {},
}: {
  chain: Chain;
  options?: Omit<UseSuspenseQueryOptions, "queryKey" | "queryFn">;
}) => {
  const publicClient = useMemo(() => {
    return createPublicClient({ chain, transport: http() });
  }, [chain]);

  const { data } = useSuspenseQuery({
    queryKey: ["networkBlockNumber", chain.id],
    queryFn: async () => publicClient.getBlockNumber(),
    refetchInterval: 5_000,
    ...options,
  });

  return data as bigint | undefined;
};

export const useSubgraphMetadata = ({
  chainId,
  options = {},
  resource,
  schemaConfig,
}: {
  chainId: number;
  options?: Omit<UseSuspenseQueryOptions, "queryKey" | "queryFn">;
  resource: string;
  schemaConfig: SchemaMappingConfig;
}) => {
  const mappings = generateSchemasMapping(schemaConfig);

  const { data } = useSuspenseQuery({
    queryKey: ["subgraphMetadata", resource, chainId],
    queryFn: async () => {
      const { _meta } = await request<SubgraphMetadataQuery>(
        mappings[resource][chainId],
        gql`
          query {
            _meta {
              block {
                hash
                number
                timestamp
              }
              deployment
              hasIndexingErrors
            }
          }
        `
      );

      return _meta;
    },
    refetchInterval: 10_000,
    ...options,
  });

  return data as SubgraphMetadataQuery["_meta"];
};
