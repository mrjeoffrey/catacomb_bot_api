import TelegramBot from "node-telegram-bot-api";

import { bot } from "../utils/telegramBot";

import {
  STAKING_APP_URL,
  TG_URL,
  WEBSITE_URL,
  TWITTER_URL,
  STONFI_URL,
} from "../config/config";

const MAIN_MENU_OPTIONS = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "✅ Start Now", url: STAKING_APP_URL }],
      [
        { text: "💳 Buy CATA", url: STONFI_URL },
        { text: "💬 Telegram group", url: TG_URL },
      ],
      [
        { text: "👉 Follow on X", url: TWITTER_URL },
        { text: "🌍 Website", url: WEBSITE_URL },
      ],
    ],
  },
};

const MENU_MESSAGE = `
Welcome to Catacomb 💎✨ $CATA is the native token of Catacomb, utilizing Telegram’s 1 billion-user network via our staking protocol in a Telegram mini app.

The concept is simple: the longer you stake, the higher your rewards with increasing APY.

Press /start to open the mini app 💰🤑

Need $CATA tokens?
💳 Swap @ app.ston.fi/swap?chartVisible=false&ft=TON&tt=EQBh4XMahI9T81bj2DbAd97ZLQDoHM2rv2U5B59DVZkVN1pl

Join our Telegram group
👉 t.me/catacombTON

Follow our X page
👉 x.com/catacombTON
`;

export const handleMenu = async (msg: TelegramBot.Message) => {
  await bot.sendMessage(msg.chat.id, MENU_MESSAGE, MAIN_MENU_OPTIONS);
};
