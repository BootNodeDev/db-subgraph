import { useMemo } from "react";

import {
  useSuspenseQuery,
  type UseSuspenseQueryOptions,
} from "@tanstack/react-query";
import { createPublicClient, http, type Chain } from "viem";

export const useNetworkBlockNumber = ({
  chain,
  options,
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
