/** @format */

// Copyright (c) Alex Ellis 2017. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.
import 'reflect-metadata';
import * as path from 'path';
import * as express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildFederatedSchema } from './buildFederatedSchema';

import { authChecker } from './function/auth';
import resolvers, { orphanedTypes, resolveUserReference } from './function/resolvers';

const app = express();

const debug = !!process.env.APOLLO_DEBUG ? process.env.APOLLO_DEBUG === 'true' : false;
const introspection = !!process.env.APOLLO_INTROSPECTION ? process.env.APOLLO_INTROSPECTION === 'true' : true;
const playground = !!process.env.APOLLO_PLAYGROUND ? process.env.APOLLO_PLAYGROUND === 'true' : false;
const debugSchemaPath = path.resolve(__dirname, 'schema.gql');

if (process.env.NODE_ENV === 'develope') {
  require('dotenv').config({path: './function/.env.dev'});
} else if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({path: './function/.env.prod'});
} else {
  throw new Error('no Process Enviromnet Variable defined');
}

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
      User: { __resolveReference: resolveUserReference },
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

  const port = process.env.http_port || 3000;

  app.listen(port, () => {
    console.log(`🚀 OpenFaaS GraphQL listening on port: ${port}`);
  });
};

startServer().catch((error) => console.log(error));
