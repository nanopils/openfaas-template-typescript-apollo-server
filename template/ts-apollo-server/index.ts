/** @format */

// Copyright (c) Alex Ellis 2017. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import 'reflect-metadata';
import * as path from 'path';
import { exec } from 'child_process';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from './buildFederatedSchema';

import { authChecker } from './function/auth';
import resolvers, { orphanedTypes, federationResolvers, getEnvironmentVariables } from './function/resolvers';

const app = express();

const port = process.env?.PORT || 3000;

const debug = !!process.env?.APOLLO_DEBUG ? process.env?.APOLLO_DEBUG === 'true' : false;
const introspection = !!process.env?.APOLLO_INTROSPECTION ? process.env?.APOLLO_INTROSPECTION === 'true' : true;
const playground = !!process.env?.APOLLO_PLAYGROUND ? process.env?.APOLLO_PLAYGROUND === 'true' : false;
const debugSchemaPath = path.resolve(__dirname, 'schema.gql');

const updateApolloStudioSubgraph = async () => {
  const vars: { [key: string]: any } =
    typeof getEnvironmentVariables === 'function' ? await getEnvironmentVariables(process.env) : { ...process.env };
  const apolloKey = vars?.APOLLO_KEY;
  const apolloGraphVariant = vars?.APOLLO_GRAPH_VARIANT;
  const apolloSchemaReporting = vars?.APOLLO_SCHEMA_REPORTING;

  if (!!apolloKey) {
    const profile = vars?.APOLLO_GRAPH_VARIANT || null;
    const serviceName = vars?.OPENFAAS_SERVICE_NAME || null;
    const functionName = vars?.OPENFAAS_FUNCTION_NAME || null;
    const supergraphName = vars?.APOLLO_STUDIO_SUPERGRAPH_NAME || null;
    if (!profile || !serviceName || !supergraphName) {
      console.error(`You should provide the following in order to update the Apollo Studio subgraph:
        - the OpenFAAS function name
        - an Apollo Studio profile name
        - an Apollo Studio supergraph name
      `);
      return;
    }
    const routingUrl = `http://${functionName}:8080/graphql`;
    const graphRef = `${supergraphName}@${profile}`;
    console.log(`Uploading the GraphQL schema of the ${serviceName} service to Apollo Studio`);
    exec(
      `npx apollo service:push \
        --graph="${supergraphName}" \
        --key="${apolloKey}" \
        --variant="${apolloGraphVariant}" \
        --serviceName="${serviceName}" \
        --serviceURL="${routingUrl}" \
        --endpoint="http://localhost:8080/graphql"`,
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
    console.log(`Updated Apollo Studio schema!`, routingUrl, graphRef, apolloGraphVariant, apolloSchemaReporting);
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

async function startServer() {
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
    playground,
    debug,
  });

  server.applyMiddleware({ app });

  app.listen(port, async () => {
    console.log(`🚀 OpenFaaS GraphQL listening on port: ${port}`);
    await updateApolloStudioSubgraph();
  });
}

startServer().catch(error => console.log(error));
