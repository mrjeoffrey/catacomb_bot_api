import { User } from '../models/user.model';

const levelThresholds = [
    { level: 1, xp: 0, cooldown: 120, bonus: 0 },
    { level: 2, xp: 5000, cooldown: 100, bonus: 500 },
    { level: 3, xp: 15000, cooldown: 80, bonus: 500 },
    { level: 4, xp: 45000, cooldown: 70, bonus: 500 },
    { level: 5, xp: 135000, cooldown: 60, bonus: 1000 },
    { level: 6, xp: 405000, cooldown: 50, bonus: 1000 },
    { level: 7, xp: 1215000, cooldown: 40, bonus: 1000 },
    { level: 8, xp: 3645000, cooldown: 30, bonus: 2000 },
    { level: 9, xp: 10935000, cooldown: 20, bonus: 5000 },
];

export async function levelUp(userId: string): Promise<void> {
    // Resolve the user document by ID
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }

    // Loop through the level thresholds to update the user level, cooldown, and bonus
    for (const threshold of levelThresholds) {
        if (user.xp >= threshold.xp) {
            user.level = threshold.level;
            user.chestCooldown = threshold.cooldown;
            user.bonusReward = threshold.bonus;
        }
    }

    // Save the updated user data
    await user.save();
}
