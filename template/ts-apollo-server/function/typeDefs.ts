/** @format */

import 'reflect-metadata';
import { Field, ID, ObjectType } from 'type-graphql';

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
}

@ObjectType()
export class User implements IUser {
  @Field() id: string;
  @Field({ nullable: true }) firstName: string;
  @Field({ nullable: true }) lastName: string;
}
