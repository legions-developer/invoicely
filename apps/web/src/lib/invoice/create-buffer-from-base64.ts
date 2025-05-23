export const createBufferFromBase64 = (base64: string) => {
  const [, base64String] = base64.split(",");
  return Buffer.from(base64String, "base64");
};
