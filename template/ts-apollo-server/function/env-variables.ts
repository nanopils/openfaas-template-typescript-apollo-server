export const getEnvironmentVariables = async (vars = process.env) => ({
  ...vars,
});
