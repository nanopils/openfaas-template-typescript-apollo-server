import { GraphQLSchema, specifiedDirectives } from 'graphql';
import federationDirectives from '@apollo/federation/dist/directives';
import gql from 'graphql-tag';
import { printSchema, buildFederatedSchema as buildApolloFederationSchema } from '@apollo/federation';
import { addResolversToSchema, GraphQLResolverMap } from 'apollo-graphql';
import { buildSchema, BuildSchemaOptions, createResolversMap } from 'type-graphql';

export async function buildFederatedSchema(
  options: Omit<BuildSchemaOptions, 'skipCheck'>,
  referenceResolvers?: GraphQLResolverMap<any>,
): Promise<GraphQLSchema> {
  // @ts-ignore
  const directives = [...specifiedDirectives, ...federationDirectives, ...(options.directives || [])];
  // @ts-ignore
  const schema = await buildSchema({ ...options, directives, skipCheck: true });

  const federatedSchema = buildApolloFederationSchema({
    typeDefs: gql(printSchema(schema)),
    resolvers: createResolversMap(schema) as any,
  });

  if (referenceResolvers) {
    addResolversToSchema(federatedSchema, referenceResolvers);
  }
  return federatedSchema;
}
