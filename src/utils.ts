import type {
  ParsedResourceIds,
  SchemaMappingConfig,
  SubgraphConfigs,
} from "./config";

/**
 * Parses a string of resource IDs and returns an object with the parsed values.
 *
 * @param resourceIds - The string of resource IDs to parse. Of the structure: `chainId:subgraphId:resourceId`.
 *
 *
 * @returns An object containing the parsed resource IDs.
 *
 * @example
 * ```ts
 * parseResourceIds('1:uniswap:3,10:uniswap:4,137:aave:5')
 * ```
 * Returns:
 * ```json
 * {
 *   "uniswap": {
 *      "1": "3",
 *      "10": "4"
 *   },
 *   "aave": {
 *      "137": "5"
 *   }
 * }
 * ```
 */
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

/**
 * Generates schemas for subgraphs based on parsed resource IDs.
 *
 * @param {SchemaMappingConfig} config - The configuration object.
 * @param {string} config.apiKey - The API key to use for the subgraph.
 * @param {string} config.chainsResourceIds - The resource IDs for the subgraph.
 * @param {string} config.environment - The environment to use.
 * @param {string} [config.developmentUrl] - The URL for the development environment.
 * @param {string} [config.productionUrl] - The URL for the production environment.
 *
 * @returns {Object} - The generated schemas.
 *
 * @example
 * ```ts
 * generateSchemas({
 *   apiKey: "MyApiKey",
 *   chainsResourceIds: "1:uniswap:3,10:uniswap:4,137:aave:5",
 *   environment: "development",
 *   developmentUrl: "https://api.studio.thegraph.com/query/[apiKey]/[subgraphId]/[resourceId]",
 * })
 * ```
 *
 * Returns:
 * ```json
 * {
 *    "uniswap": {
 *      "1": "https://api.studio.thegraph.com/query/MyApiKey/uniswap/3",
 *      "10": "https://api.studio.thegraph.com/query/MyApiKey/uniswap/4"
 *    },
 *    "aave": {
 *      "137": "https://api.studio.thegraph.com/query/MyApiKey/aave/5"
 *    }
 * }
 * ```
 */
export const generateSchemasMapping = ({
  apiKey,
  chainsResourceIds,
  environment,
  developmentUrl,
  productionUrl,
}: SchemaMappingConfig) => {
  const url = environment === "development" ? developmentUrl : productionUrl;

  if (!url) {
    throw new Error(`url must be defined for environment ${environment}`);
  }

  const parsedResourceIds = parseResourceIds(chainsResourceIds);

  return Object.fromEntries(
    Object.entries(parsedResourceIds).map(([subgraphId, chains]) => {
      return [
        subgraphId,
        Object.fromEntries(
          Object.entries(chains).map(([chainId, resourceId]) => {
            return [
              chainId,
              url
                .replace("[apiKey]", apiKey)
                .replace("[subgraphId]", subgraphId)
                .replace("[resourceId]", resourceId),
            ];
          })
        ),
      ];
    })
  );
};

/**
 * Generates a configuration object for the @graphql-codegen/cli package.
 *
 * @param {SubgraphConfigs} config - The configuration object.
 * @returns @graphql-codegen/cli configuration object.
 */
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
