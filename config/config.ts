import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 80;
export const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/telegram_game";
export const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export const STAKING_APP_URL = "t.me/CataStakingBot/catacomb";
export const WEBSITE_URL = "https://t.me/catatTestbot/CATAFRONTTEST";
export const TG_URL = "https://t.me/catacombTON";
export const ANNOUNCEMENTS_URL = "https://t.me/catacombTON";
export const TWITTER_URL = "https://x.com/catacombTON";
export const EXPLORER_URL = "https://tonviewer.com/transaction/";
export const TONAPI_TX_URL = "https://tonapi.io/v2/traces/";
export const TONCENTER_API = "https://toncenter.com/api/v2/jsonRPC";
export const DURATIONS = [
  "30 days",
  "60 days",
  "90 days",
  "120 days",
  "360 days",
  "1000 days",
];
export const STONFI_URL =
  "https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=EQBh4XMahI9T81bj2DbAd97ZLQDoHM2rv2U5B59DVZkVN1pl";
export const CHART_URL =
  "https://www.geckoterminal.com/ton/pools/EQD41g3cdtqK2K9cwog6b8_LmxNbQJVHW0u4EdEE9c_hpr2k";
