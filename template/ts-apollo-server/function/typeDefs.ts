/** @format */

import {gql} from 'apollo-server-express'

export const typeDefs: any = gql`
  type Query {
    hello(text: String): String
  }
`
