import { Telegraf } from 'telegraf';

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
    throw new Error('Telegram Bot token is not provided in the environment variables');
}

export const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Welcome to the Telegram Bot!'));

export default bot;
