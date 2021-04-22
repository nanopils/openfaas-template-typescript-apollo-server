import { Arg, Query, Resolver } from "type-graphql";
import { IUser, User } from "./typeDefs";

const mockUsers: IUser[] = [
  { id: '123', firstName: 'Bilbo', lastName: 'Baggins' },
  { id: '456', firstName: 'Gollum', lastName: 'Precious' },
  { id: '789', firstName: 'Lord', lastName: 'Sauron' },
];

export const findUserByID = async (id: string): Promise<IUser> => mockUsers.find((user) => user.id === id) || null;

/**
 * Apollo Federation
 */
export const orphanedTypes = [User];

export const resolveUserReference = async (reference: Pick<IUser, 'id'>): Promise<IUser> => findUserByID(reference.id);

/**
 * Resolver
 */
@Resolver(() => User)
export default class UserResolver {
  @Query(() => [User])
  async allUsers(): Promise<IUser[]> {
    return mockUsers;
  }
  @Query(() => User)
  async findUserById(@Arg('id') id: string): Promise<IUser> {
    return findUserByID(id);
  }
}
