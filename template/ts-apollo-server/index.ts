/** @format */

// Copyright (c) Alex Ellis 2017. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import 'reflect-metadata';
import * as path from 'path';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from './buildFederatedSchema';

import { authChecker } from './function/auth';
import resolvers, { orphanedTypes, federationResolvers } from './function/resolvers';

const app = express();

const port = process.env.PORT || 3000;

const apolloKey = process.env.APOLLO_KEY;
const apolloSchemaConfigDeliveryEndpoint = process.env.APOLLO_SCHEMA_CONFIG_DELIVERY_ENDPOINT;

const debug = !!process.env.APOLLO_DEBUG ? process.env.APOLLO_DEBUG === 'true' : false;
const introspection = !!process.env.APOLLO_INTROSPECTION ? process.env.APOLLO_INTROSPECTION === 'true' : true;
const playground = !!process.env.APOLLO_PLAYGROUND ? process.env.APOLLO_PLAYGROUND === 'true' : false;
const debugSchemaPath = path.resolve(__dirname, 'schema.gql');

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

  server.applyMiddleware({app});

  app.listen(port, () => {
    console.log(`🚀 OpenFaaS GraphQL listening on port: ${port}`);
    if (!!apolloKey) {
      // ToDo: run rover with the new schema!
      console.log(`Updated Apollo Studio schema!`);
    }
  });
};

startServer().catch((error) => console.log(error));
