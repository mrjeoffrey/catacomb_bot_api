import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/telegram_game";
export const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export const STAKING_APP_URL = "t.me/CataStakingBot/catacomb";
export const WEBSITE_URL = "https://t.me/catacombseasonone_bot/CATACOMB";
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

export const CLOUDFLARE_R2_BUCKET = "catacomb";
export const CLOUDFLARE_R2_ACCESS_KEY_ID = "0c3f22991a3d7c597db8e0212b64abe2";
export const CLOUDFLARE_R2_SECRET_ACCESS_KEY = "281ae89a1f5dea7519aa663f1bfd7d8a96673676463bfc0ba9db1225ac8a8719";
export const CLOUDFLARE_R2_REGION = "WNAM";
export const CLOUDFLARE_R2_ENDPOINT = "https://fbd6e210caf3d534d6ed48a4bb97cf70.r2.cloudflarestorage.com";
export const CLOUDFLARE_R2_PUBLIC_ENDPOINT = "https://pub-eb157c13cf5f4c28845c2a603ed21192.r2.dev"

