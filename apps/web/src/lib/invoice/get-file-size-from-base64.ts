/**
 * Calculates the file size from a base64 string and returns it in a human-readable format
 * @param base64 - The base64 encoded string
 * @returns A number representing the file size in bytes
 */
export function getFileSizeFromBase64(base64?: string): number {
  if (!base64) {
    return 0;
  }

  // Remove the data URL prefix if present

  const base64Data = base64.includes("base64,") ? base64.split("base64,")[1] : base64;
  const cleanBase64Data = base64Data.replace(/\s/g, ""); // remove all whitespace
  // Calculate the size in bytes
  // Formula: (base64Length * 3) / 4 - (padding characters)
  const padding = cleanBase64Data.endsWith("==") ? 2 : cleanBase64Data.endsWith("=") ? 1 : 0;
  const sizeInBytes = (base64Data.length * 3) / 4 - padding;

  // return size in bytes
  return sizeInBytes;
}
