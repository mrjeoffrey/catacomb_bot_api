export const calculateLevel = (xp: number): number => {
  const levelThresholds = [5000, 15000, 45000, 135000, 405000, 1215000, 3645000, 10935000];
  let level = 1;

  for (let i = 0; i < levelThresholds.length; i++) {
    if (xp >= levelThresholds[i]) {
      level = i + 2;
    } else {
      break;
    }
  }
  return level;
};
