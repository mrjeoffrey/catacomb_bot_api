// Utility function to decode base64 strings
export const decodeBase64Image = (dataString: string) => {
  const matches = dataString.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string");
  }
  return { type: matches[1], data: Buffer.from(matches[2], "base64") };
};