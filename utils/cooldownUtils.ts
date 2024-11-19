export const isChestAvailable = (lastOpened: Date | null, cooldownSeconds: number): boolean => {
  if (!lastOpened) return true;
  const now = new Date();
  const nextAvailable = new Date(lastOpened.getTime() + cooldownSeconds * 1000);
  return now >= nextAvailable;
};
