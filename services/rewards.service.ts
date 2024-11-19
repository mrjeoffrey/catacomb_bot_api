import { User } from '../models/user.model';
import { levelUp } from './level-up.service';
import { Task } from '../models/task.model';

export async function completeTask(userId: string, taskId: number): Promise<void> {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    user.gold += task.rewardGold;
    user.xp += task.rewardXp;
    await user.save();

    levelUp(userId);
}

export async function openChest(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const goldReward = [75, 100, 125, 150][Math.floor(Math.random() * 4)];
    const xpReward = 25;

    user.gold += goldReward;
    user.xp += xpReward;
    await user.save();

    levelUp(userId);
}
