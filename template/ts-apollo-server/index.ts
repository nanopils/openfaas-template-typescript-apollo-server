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
    // ToDo: run rover with the new schema!
    const ip = vars?.OPENFAAS_IP || null;
    const profile = vars?.APOLLO_STUDIO_PROFILE || null;
    const functionName = vars?.OPENFAAS_FUNCTION || null;
    const supergraphName = vars?.APOLLO_STUDIO_SUPERGRAPH_NAME || null;
    if (!ip || !profile || !functionName || !supergraphName) {
      console.error(`You should provide the following in order to update the Apollo Studio subgraph:
        - OpenFAAS public IP
        - the OpenFAAS function name
        - an Apollo Studio profile name
        - an Apollo Studio supergraph name
      `);
      return;
    }
    const routingUrl = `http://${ip}:8080/function/ecom-fn-graphql-${functionName}/graphql`;
    const graphRef = `${supergraphName}@${profile}`;

    // exec(
    //   `rover subgraph publish \
    //     --schema "schema.gql" \
    //     --name "${functionName}" \
    //     --profile "${profile}" \
    //     --routing-url "${routingUrl}" \
    //     "${graphRef}"`,
    //   (err, stdout, stderr) => {
    //     if (err) {
    //       //some err occurred
    //       console.error(err);
    //     } else {
    //       // the *entire* stdout and stderr (buffered)
    //       console.log(`stdout: ${stdout}`);
    //       console.log(`stderr: ${stderr}`);
    //     }
    //   },
    // );
    console.log(`Updated Apollo Studio schema!`, routingUrl, graphRef, apolloGraphVariant, apolloSchemaReporting);
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
