/** @format */

// Copyright (c) Alex Ellis 2017. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

import * as express from 'express'
import {ApolloServer} from 'apollo-server-express'
import {typeDefs} from './function/typeDefs'
import resolvers from './function/resolvers'
const app = express()
if (process.env.NODE_ENV === 'develope') {
  require('dotenv').config({path: './function/.env.dev'})
} else if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({path: './function/.env.prod'})
} else {
  throw new Error('no Process Enviromnet Variable defined')
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.applyMiddleware({app})

const port = process.env.http_port || 3000
console.log(process.env.http_port)

app.listen(port, () => {
  console.log(`OpenFaaS Node.js listening on port: ${port}`)
})
