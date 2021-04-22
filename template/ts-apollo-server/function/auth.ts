import { AuthChecker } from 'type-graphql';

export const authChecker: AuthChecker<any> = ({ root, args, context, info }, roles) => {
  console.log('---- backend aut checker: SUCCESS');
  return true;
};
