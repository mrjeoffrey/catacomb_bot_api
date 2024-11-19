// controllers/bot.controller.ts
import TelegramBot from 'node-telegram-bot-api';
import { User } from '../models/user.model';
import { completeTask, openChest } from '../services/rewards.service';
import { handleReferral } from '../services/referral.service';

// Replace with your actual bot token from BotFather
const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true });

// Start command
bot.onText(/\/start/, async (msg) => {
    const userId = msg.chat.id.toString();

    // Check if the user exists in the database, if not, create a new user
    let user = await User.findOne({ telegramId: userId });
    if (!user) {
        user = new User({ telegramId: userId, gold: 0, xp: 0, level: 1, chestCooldown: 120, bonusReward: 0 });
        await user.save();
    }

    bot.sendMessage(userId, 'Welcome to the game! Use /task to complete a task, /chest to open a chest, or /referral to refer someone.');
});

// Handle task completion command
bot.onText(/\/task/, async (msg) => {
    const userId = msg.chat.id.toString();
    
    // Let's assume a task ID of 1 for now
    const taskId = 1;
    
    try {
        await completeTask(userId, taskId);
        bot.sendMessage(userId, 'Task completed! You earned gold and XP.');
    } catch (error) {
        bot.sendMessage(userId, `Error completing task: ${error.message}`);
    }
});

// Handle chest opening command
bot.onText(/\/chest/, async (msg) => {
    const userId = msg.chat.id.toString();
    
    try {
        await openChest(userId);
        bot.sendMessage(userId, 'You opened a chest and earned gold and XP!');
    } catch (error) {
        bot.sendMessage(userId, `Error opening chest: ${error.message}`);
    }
});

// Handle referral command
bot.onText(/\/referral (\d+)/, async (msg, match) => {
    const userId = msg.chat.id.toString();
    const referredBy = match?.[1]; // Telegram ID of the person referring

    try {
        await handleReferral(userId, referredBy);
        bot.sendMessage(userId, `You were referred by ${referredBy} and you earned a bonus!`);
    } catch (error) {
        bot.sendMessage(userId, `Error with referral: ${error.message}`);
    }
});

// Handle level command (to check user's level and XP)
bot.onText(/\/level/, async (msg) => {
    const userId = msg.chat.id.toString();

    const user = await User.findOne({ telegramId: userId });
    if (user) {
        bot.sendMessage(userId, `Your level: ${user.level}\nXP: ${user.xp}\nGold: ${user.gold}`);
    } else {
        bot.sendMessage(userId, 'User not found.');
    }
});

export function setupBot() {
    console.log('Bot is up and running!');
}
