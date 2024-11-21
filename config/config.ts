import dotenv from 'dotenv';

dotenv.config();

export default {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/telegram_game',
    JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key',
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
};
