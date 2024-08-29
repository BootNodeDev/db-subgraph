import type { ParsedResourceIds, SubgraphConfig, SubgraphConfigs } from "./config";

const parseResourceIds = (resourceIds: string): ParsedResourceIds => {
  return resourceIds
    .replace(/ /g, "")
    .split(",")
    .reduce((acc: ParsedResourceIds, config) => {
      const [chainId, subgraphId, resourceId] = config.split(":");

      if (!acc[subgraphId]) {
        acc[subgraphId] = { [chainId]: resourceId };
      } else {
        acc[subgraphId] = { ...acc[subgraphId], [chainId]: resourceId };
      }

      return acc;
    }, {});
};

export const generateSchemasMapping = ({
  apiKey,
  chainsResourceIds,
  environment,
  developmentUrl,
  productionUrl,
}: Omit<SubgraphConfig, "queriesDirectory">) => {
  const url = environment === "development" ? developmentUrl : productionUrl;

  if (!url) {
    throw new Error(`url must be defined for environment ${environment}`);
  }

  const parsedResourceIds = parseResourceIds(chainsResourceIds);

  return Object.fromEntries(
    Object.entries(parsedResourceIds).map(([subgraphId, chains]) => {
      return [
        subgraphId,
	Object.fromEntries(Object.entries(chains).map(([chainId, resourceId]) => {
          return [
            chainId,
	    url
	      .replace("[apiKey]", apiKey)
	      .replace("[subgraphId]", subgraphId)
	      .replace("[resourceId]", resourceId)
	  ];
	})
       ),
      ];
    })
  );
};

export const generateCodegenConfig = (config: SubgraphConfigs): any => {
  const generates: any = {};

  for (const subgraph of config.subgraphs) {
    const { queriesDirectory, ...subgraphConfig } = subgraph;
    const schemas = generateSchemasMapping(subgraphConfig);

    Object.entries(schemas).forEach(([subgraphId, chains]) => {
      generates[`./src/subgraphs/gql/${subgraphId}/`] = {
        preset: "client",
	schema: Object.values(chains)[0],
	documents: queriesDirectory
	  ? `${queriesDirectory}/${subgraphId}/**/*.ts`
	  : undefined,
      };
    });
  }

  return {
    generates,
    overwrite: true,
  };
};
