import { Arg, Query, Resolver } from 'type-graphql';
import { User } from './typeDefs';
import { IUser } from './types';

const mockUsers: IUser[] = [
  { id: '123', firstName: 'Bilbo', lastName: 'Baggins' },
  { id: '456', firstName: 'Gollum', lastName: 'Precious' },
  { id: '789', firstName: 'Lord', lastName: 'Sauron' },
];

export const findUserByID = async (id: string): Promise<IUser> => mockUsers.find(user => user.id === id) || null;

/**
 * Apollo Federation
 */
export const orphanedTypes = [User];

const resolveUserReference = async (reference: Pick<IUser, 'id'>): Promise<IUser> => findUserByID(reference.id);

export const federationResolvers = {
  User: { __resolveReference: resolveUserReference },
};

/**
 * Resolver
 */
@Resolver(() => User)
export class UserResolver {
  @Query(() => [User])
  async allUsers(): Promise<IUser[]> {
    return mockUsers;
  }
  @Query(() => User)
  async findUserById(@Arg('id') id: string): Promise<IUser> {
    return findUserByID(id);
  }
}

export default [UserResolver];
