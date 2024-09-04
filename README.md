# dAppBooster Subgraph Plugin

This package provides a flexible and reusable solution for generating GraphQL clients using @graphql-codegen/cli, integrated with @tanstack/react-query. It simplifies the process of setting up and managing GraphQL code generation for multiple subgraphs.

## Installation

This package uses pnpm as the preferred package manager. First, install the package along with other required dependencies:

```bash
pnpm add db-subgraph graphql graphql-request
```

Then, add the development dependencies:

```bash
pnpm add -D @graphql-codegen/cli @graphql-typed-document-node/core
```

This separation ensures that the runtime dependencies are installed in your main dependencies, while the code generation tools are kept in your development dependencies.

## Usage

### 1. Set Up CodeGen Configuration

Create a codegen file (e.g., `src/subgraphs/codegen.ts`) in your project:

```typescript
import { generateCodegenConfig } from "db-subgraph";
import { loadEnv } from "vite";

const env = loadEnv("subgraphs", process.cwd(), "");

export default generateCodegenConfig({
  subgraphs: [
    {
      apiKey: env.PUBLIC_SUBGRAPHS_API_KEY,
      chainsResourceIds: env.PUBLIC_SUBGRAPHS_CHAINS_RESOURCE_IDS,
      environment: "production",
      productionUrl: env.PUBLIC_SUBGRAPHS_PRODUCTION_URL,
    },
  ],
});
```

You can use environment variables, hard-coded values, or a combination of both. Adjust the configuration according to your project's needs.

This file uses the `generateCodegenConfig` function from our package to create the configuration for @graphql-codegen/cli.

### 2. Run CodeGen

Add a script to your `package.json` to run the code generation:

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config ./src/subgraphs/codegen.ts"
  }
}
```

Now you can generate your GraphQL clients by running:

```bash
pnpm run codegen
```

### 3. Consume the queries

You can see a how it's been used in the [dAppBooster Landing Page](https://github.com/BootNodeDev/dAppBoosterLandingPage).

And for further information refer to the [subgraph documentation](https://github.com/BootNodeDev/dAppBoosterLandingPage/blob/main/SUBGRAPHS.md).

## Configuration Options

The `PackageConfig` interface accepts the following options for each subgraph:

- `apiKey`: Your subgraph API key.
- `chainsResourceIds`: A string of comma-separated `<chainId>:<subgraphId>:<resourceId>`.
  - i.e.: `137:uniswap:BvYimJ6vCLkk63oWZy7WB5cVDTVVMugUAF35RAUZpQXE,8453:aave:GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF`
- `developmentUrl`: The URL for the development environment.
- `productionUrl`: The URL for the production environment.
- `environment`: Either 'development' or 'production'.
- `queriesDirectory`: The directory where your GraphQL queries are located.
  - default: `./src/subgraphs/queries`
- `destinationDirectory`: The directory where your typed queries will be generated.
  - defult: `./src/subgraphs/gql`

## Adding Multiple Subgraphs

You can configure multiple subgraphs by adding more objects to the `subgraphs` array in your configuration:

```typescript
export const graphqlConfig: PackageConfig = {
  subgraphs: [
    {
      // First subgraph configuration
    },
    {
      // Second subgraph configuration
    },
    // Add more as needed
  ],
};
```

## Generated Files

The package will generate GraphQL clients in the `src/subgraphs/gql/` directory, organized by subgraph ID.

## Customization

If you need to customize the generation process further, you can modify the `codegen.ts` file. The package is designed to be flexible, allowing you to define configurations in the way that best suits your project structure and requirements.
