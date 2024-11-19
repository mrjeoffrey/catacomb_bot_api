import { TelegramBotAPI } from 'node-telegram-bot-api';

export const bot = new TelegramBotAPI(process.env.TELEGRAM_TOKEN, { polling: true });

export function sendMessage(userId: string, message: string) {
    bot.sendMessage(userId, message);
}
