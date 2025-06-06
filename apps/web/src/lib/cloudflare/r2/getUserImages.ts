export const getUserImages = async (env: CloudflareEnv, userId: string) => {
  const response = await env.R2_IMAGES.list({
    prefix: `${userId}/`,
  });

  return response.objects;
};
