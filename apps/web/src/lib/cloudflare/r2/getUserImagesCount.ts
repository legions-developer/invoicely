/**
 * Get the number of images for a user
 * @param env - The Cloudflare environment
 * @param userId - The user ID
 * @returns The number of images for the user
 */
export const getUserImagesCount = async (env: CloudflareEnv, userId: string) => {
  const imageObjects = await env.R2_IMAGES.list({
    prefix: `${userId}/`,
  });

  return imageObjects.objects.length;
};
