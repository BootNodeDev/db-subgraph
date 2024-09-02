import { useMemo } from "react";

import {
  useSuspenseQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import request, { gql } from "graphql-request";
import { createPublicClient, http, type Chain } from "viem";

import type { SchemaMappingConfig, SubgraphMetadataQuery } from "./config";
import { generateSchemasMapping } from "./utils";

/**
 * Custom hook to fetch the block number of a specific network, despite being supported or not by the app config.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {Chain} params.chain - The chain object representing the network.
 * @param {Omit<UseSuspenseQueryOptions, 'queryKey' | 'queryFn'>} [params.options] - Additional options for the useSuspenseQuery hook.
 *
 * @dev It has a default refetch interval of 10 seconds that can be overridden by passing the options object.
 *
 * @returns {number | undefined} - The block number of the network.
 */
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
    queryFn: () => publicClient.getBlockNumber(),
    refetchInterval: 5_000,
    structuralSharing: false,
    ...options,
  });

  return data as bigint;
};

/**
 * Custom hook to fetch subgraph metadata for a specific chain and resource.
 *
 * @param {Object} params - The parameters for the hook.
 * @param {number} params.chainId - The ID of the chain.
 * @param {Object} [params.options] - Additional options for the useSuspenseQuery hook.
 * @param {string} params.resource - The resource to fetch metadata for. Must be a valid key in `appSchemas`.
 * @param {SchemaMappingConfig} params.schemaConfig - The schema mapping configuration.
 *
 * @dev It has a default refetch interval of 10 seconds that can be overridden by passing the options object.
 *
 * @returns {Query['_meta']} - The subgraph metadata.
 */
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

/**
 * Custom hook to get the indexing status of a subgraph.
 * Uses the network block number to determine if the subgraph is synced.
 *
 * @param {Object} params - The params object.
 * @param {Chain} params.chain - The chain object.
 * @param {string} params.resource - The resource string.
 * @param {SchemaMappingConfig} params.schemaConfig - The schema mapping configuration.
 * @returns {Object} - The indexing status object.
 */
export const useSubgraphIndexingStatus = ({
  chain,
  resource,
  schemaConfig,
}: {
  chain: Chain;
  resource: string;
  schemaConfig: SchemaMappingConfig;
}) => {
  const meta = useSubgraphMetadata({
    chainId: chain.id,
    resource,
    schemaConfig,
  });
  const subgraphBlockNumber = BigInt(meta?.block.number);

  const networkBlockNumber = useNetworkBlockNumber({ chain });

  return {
    chain,
    isSynced: subgraphBlockNumber === networkBlockNumber,
    hasIndexingErrors: meta?.hasIndexingErrors,
    networkBlockNumber,
    resource,
    subgraphBlockNumber,
  };
};
