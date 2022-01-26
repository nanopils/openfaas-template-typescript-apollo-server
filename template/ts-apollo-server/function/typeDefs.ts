import 'reflect-metadata';
import { Field, ID, ObjectType } from 'type-graphql';
import { IUser } from './types';

@ObjectType()
export class User implements IUser {
  @Field() id: string;
  @Field({ nullable: true }) firstName: string;
  @Field({ nullable: true }) lastName: string;
}
