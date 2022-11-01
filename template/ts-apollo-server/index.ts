// Copyright (c) Alex Ellis 2017. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import 'reflect-metadata';
import * as path from 'path';
import { exec } from 'child_process';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from './buildFederatedSchema';

import { context } from './function/context';
import { authChecker } from './function/auth';
import resolvers, { orphanedTypes, federationResolvers } from './function/resolvers';
import { getEnvironmentVariables } from './function/env-variables';

let vars: { [key: string]: any } = null;

const app = express();
const port = process.env?.PORT || 3000;
const requestSizeLimit = process.env?.REQUEST_SIZE_LIMIT || '50mb';
const debug = !!process.env?.APOLLO_DEBUG ? process.env?.APOLLO_DEBUG === 'true' : false;
const introspection = !!process.env?.APOLLO_INTROSPECTION ? process.env?.APOLLO_INTROSPECTION === 'true' : true;
const playground = !!process.env?.APOLLO_PLAYGROUND ? process.env?.APOLLO_PLAYGROUND === 'true' : false;
const debugSchemaPath = path.resolve(__dirname, 'schema.gql');

const loadEnvVariables = async () => {
  const hasFunction = typeof getEnvironmentVariables === 'function';
  if (hasFunction) {
    vars = await getEnvironmentVariables(process.env);
    return startServer();
  }
  vars = { ...process.env };
  return startServer();
};

const updateApolloStudioSubgraph = async () => {
  const apolloKey = vars?.APOLLO_KEY;
  const apolloGraphRef = vars?.APOLLO_GRAPH_REF;

  if (!!apolloKey) {
    const serviceName = vars?.OPENFAAS_SERVICE_NAME || null;
    const functionName = vars?.OPENFAAS_FUNCTION_NAME || null;
    if (!apolloGraphRef || !serviceName) {
      console.error(`You should provide the following in order to update the Apollo Studio subgraph:
        - the OpenFAAS function name
        - an Apollo Studio ref (APOLLO_GRAPH_REF)
      `);
      return;
    }
    const routingUrl = process.env?.APOLLO_ROUTING_URL || `http://${functionName}:8080/graphql`;
    const introspectionUrl = 'http://localhost:8080/graphql';
    console.log(`Uploading the GraphQL schema of the ${serviceName} service to Apollo Studio`);
    exec(
      `npx rover subgraph introspect ${introspectionUrl} | \
        APOLLO_KEY=${apolloKey} \
        npx rover subgraph publish ${apolloGraphRef} \
        --name ${serviceName} \
        --routing-url ${routingUrl} \
        --schema -`,
      (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err);
        } else {
          // the *entire* stdout and stderr (buffered)
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        }
      },
    );
    console.log(`Updated Apollo Studio schema!`, routingUrl, apolloGraphRef);
  } else {
    console.log(
      `The APOLLO_KEY environment variable was not defined, so the schema was not uploaded to Apollo Studio.`,
    );
    console.log('--- Defined environment variables:');
    console.dir(process.env, { depth: 4 });
    console.log('--- Defined variables:');
    console.dir(vars, { depth: 4 });
  }
};

const startServer = async () => {
  const schema = await buildFederatedSchema(
    {
      // @ts-ignore
      resolvers,
      authChecker,
      // automatically create `schema.gql` file with schema definition in current folder
      emitSchemaFile: debugSchemaPath,
      orphanedTypes,
    },
    {
      ...federationResolvers,
    },
  );

  const server = new ApolloServer({
    schema,
    cacheControl: false,
    tracing: false,
    introspection,
    context: async (ctx: any) => {
      if (typeof context === 'function') {
        return context(ctx);
      }
      return {};
    },
    playground,
    debug,
  });
  app.use(express.json({ limit: requestSizeLimit }));
  app.use(express.urlencoded({ limit: requestSizeLimit }));

  server.applyMiddleware({ app });

  app.listen(port, async () => {
    console.log(`🚀 OpenFaaS GraphQL listening on port: ${port}`);
    await updateApolloStudioSubgraph();
  });
};

loadEnvVariables().catch(error => console.log(error));
