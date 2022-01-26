export const context = async (ctx: any) => {
  const request = ctx?.req || null;
  return {
    headers: request?.headers || {},
  };
};
