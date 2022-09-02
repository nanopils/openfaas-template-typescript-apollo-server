export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface IEnvironmentVariables {
  APOLLO_GRAPH_REF: string;
  APOLLO_KEY: string;
  APOLLO_ROUTING_URL?: string;
  OPENFAAS_FUNCTION_NAME?: string;
  OPENFAAS_SERVICE_NAME: string;
}
