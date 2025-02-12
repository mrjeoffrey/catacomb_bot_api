import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/telegram_game";
export const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "7860048588:AAF9R8OzlL1qmHSWDx4LBUlRzTo6Tu9rHi4";

export const BOT_API_URL = "https://api.catacomb.fyi"
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

export const oneSecondInMs = 1000;
export const oneMinuteInMs = 60 * oneSecondInMs;
export const oneHourInMs = 60 * oneMinuteInMs;
export const oneDayInMs = 24 * oneHourInMs;
export const twoDaysInMs = oneDayInMs * 2;

export const SEASONS = [
  {
    seasonNumber: 1,
    seasonStart: new Date("2024-12-20"),
    seasonEnd: new Date("2025-01-14T23:59:59"),
  },
  {
    seasonNumber: 2,
    seasonStart: new Date("2025-01-15"),
    seasonEnd: new Date("2025-01-31T23:59:59"),
  },
  {
    seasonNumber: 3,
    seasonStart: new Date("2025-02-01"),
    seasonEnd: new Date("2025-02-14T23:59:59"),
  },
  {
    seasonNumber: 4,
    seasonStart: new Date("2025-02-15"),
    seasonEnd: new Date("2025-02-28T23:59:59"),
  },
  {
    seasonNumber: 5,
    seasonStart: new Date("2025-03-01"),
    seasonEnd: new Date("2025-03-14T23:59:59"),
  },
  {
    seasonNumber: 6,
    seasonStart: new Date("2025-03-15"),
    seasonEnd: new Date("2025-03-31T23:59:59"),
  },
  {
    seasonNumber: 7,
    seasonStart: new Date("2025-04-01"),
    seasonEnd: new Date("2025-04-14T23:59:59"),
  },
  {
    seasonNumber: 8,
    seasonStart: new Date("2025-04-15"),
    seasonEnd: new Date("2025-04-30T23:59:59"),
  },
  {
    seasonNumber: 9,
    seasonStart: new Date("2025-05-01"),
    seasonEnd: new Date("2025-05-14T23:59:59"),
  },
  {
    seasonNumber: 10,
    seasonStart: new Date("2025-05-15"),
    seasonEnd: new Date("2025-05-31T23:59:59"),
  },
  {
    seasonNumber: 11,
    seasonStart: new Date("2025-06-01"),
    seasonEnd: new Date("2025-06-14T23:59:59"),
  },
  {
    seasonNumber: 12,
    seasonStart: new Date("2025-06-15"),
    seasonEnd: new Date("2025-06-30T23:59:59"),
  },
  {
    seasonNumber: 13,
    seasonStart: new Date("2025-07-01"),
    seasonEnd: new Date("2025-07-14T23:59:59"),
  },
  {
    seasonNumber: 14,
    seasonStart: new Date("2025-07-15"),
    seasonEnd: new Date("2025-07-31T23:59:59"),
  },
  {
    seasonNumber: 15,
    seasonStart: new Date("2025-08-01"),
    seasonEnd: new Date("2025-08-14T23:59:59"),
  },
  {
    seasonNumber: 16,
    seasonStart: new Date("2025-08-15"),
    seasonEnd: new Date("2025-08-31T23:59:59"),
  },
  {
    seasonNumber: 17,
    seasonStart: new Date("2025-09-01"),
    seasonEnd: new Date("2025-09-14T23:59:59"),
  },
  {
    seasonNumber: 18,
    seasonStart: new Date("2025-09-15"),
    seasonEnd: new Date("2025-09-30T23:59:59"),
  },
  {
    seasonNumber: 19,
    seasonStart: new Date("2025-10-01"),
    seasonEnd: new Date("2025-10-14T23:59:59"),
  },
  {
    seasonNumber: 20,
    seasonStart: new Date("2025-10-15"),
    seasonEnd: new Date("2025-10-31T23:59:59"),
  },
  {
    seasonNumber: 21,
    seasonStart: new Date("2025-11-01"),
    seasonEnd: new Date("2025-11-14T23:59:59"),
  },
  {
    seasonNumber: 22,
    seasonStart: new Date("2025-11-15"),
    seasonEnd: new Date("2025-11-30T23:59:59"),
  },
  {
    seasonNumber: 23,
    seasonStart: new Date("2025-12-01"),
    seasonEnd: new Date("2025-12-14T23:59:59"),
  },
  {
    seasonNumber: 24,
    seasonStart: new Date("2025-12-15"),
    seasonEnd: new Date("2025-12-31T23:59:59"),
  },
  {
    seasonNumber: 25,
    seasonStart: new Date("2026-01-01"),
    seasonEnd: new Date("2026-01-14T23:59:59"),
  },
  {
    seasonNumber: 26,
    seasonStart: new Date("2026-01-15"),
    seasonEnd: new Date("2026-01-31T23:59:59"),
  },
  {
    seasonNumber: 27,
    seasonStart: new Date("2026-02-01"),
    seasonEnd: new Date("2026-02-14T23:59:59"),
  },
  {
    seasonNumber: 28,
    seasonStart: new Date("2026-02-15"),
    seasonEnd: new Date("2026-02-28T23:59:59"),
  },
  {
    seasonNumber: 29,
    seasonStart: new Date("2026-03-01"),
    seasonEnd: new Date("2026-03-14T23:59:59"),
  },
  {
    seasonNumber: 30,
    seasonStart: new Date("2026-03-15"),
    seasonEnd: new Date("2026-03-31T23:59:59"),
  },
  {
    seasonNumber: 31,
    seasonStart: new Date("2026-04-01"),
    seasonEnd: new Date("2026-04-14T23:59:59"),
  },
  {
    seasonNumber: 32,
    seasonStart: new Date("2026-04-15"),
    seasonEnd: new Date("2026-04-30T23:59:59"),
  },
  {
    seasonNumber: 33,
    seasonStart: new Date("2026-05-01"),
    seasonEnd: new Date("2026-05-14T23:59:59"),
  },
  {
    seasonNumber: 34,
    seasonStart: new Date("2026-05-15"),
    seasonEnd: new Date("2026-05-31T23:59:59"),
  },
  {
    seasonNumber: 35,
    seasonStart: new Date("2026-06-01"),
    seasonEnd: new Date("2026-06-14T23:59:59"),
  },
  {
    seasonNumber: 36,
    seasonStart: new Date("2026-06-15"),
    seasonEnd: new Date("2026-06-30T23:59:59"),
  },
  {
    seasonNumber: 37,
    seasonStart: new Date("2026-07-01"),
    seasonEnd: new Date("2026-07-14T23:59:59"),
  },
  {
    seasonNumber: 38,
    seasonStart: new Date("2026-07-15"),
    seasonEnd: new Date("2026-07-31T23:59:59"),
  },
  {
    seasonNumber: 39,
    seasonStart: new Date("2026-08-01"),
    seasonEnd: new Date("2026-08-14T23:59:59"),
  },
  {
    seasonNumber: 40,
    seasonStart: new Date("2026-08-15"),
    seasonEnd: new Date("2026-08-31T23:59:59"),
  },
  {
    seasonNumber: 41,
    seasonStart: new Date("2026-09-01"),
    seasonEnd: new Date("2026-09-14T23:59:59"),
  },
  {
    seasonNumber: 42,
    seasonStart: new Date("2026-09-15"),
    seasonEnd: new Date("2026-09-30T23:59:59"),
  },
  {
    seasonNumber: 43,
    seasonStart: new Date("2026-10-01"),
    seasonEnd: new Date("2026-10-14T23:59:59"),
  },
  {
    seasonNumber: 44,
    seasonStart: new Date("2026-10-15"),
    seasonEnd: new Date("2026-10-31T23:59:59"),
  },
  {
    seasonNumber: 45,
    seasonStart: new Date("2026-11-01"),
    seasonEnd: new Date("2026-11-14T23:59:59"),
  },
  {
    seasonNumber: 46,
    seasonStart: new Date("2026-11-15"),
    seasonEnd: new Date("2026-11-30T23:59:59"),
  },
  {
    seasonNumber: 47,
    seasonStart: new Date("2026-12-01"),
    seasonEnd: new Date("2026-12-14T23:59:59"),
  },
  {
    seasonNumber: 48,
    seasonStart: new Date("2026-12-15"),
    seasonEnd: new Date("2026-12-31T23:59:59"),
  },
  {
    seasonNumber: 49,
    seasonStart: new Date("2027-01-01"),
    seasonEnd: new Date("2027-01-14T23:59:59"),
  },
  {
    seasonNumber: 50,
    seasonStart: new Date("2027-01-15"),
    seasonEnd: new Date("2027-01-31T23:59:59"),
  },
  {
    seasonNumber: 51,
    seasonStart: new Date("2027-02-01"),
    seasonEnd: new Date("2027-02-14T23:59:59"),
  },
  {
    seasonNumber: 52,
    seasonStart: new Date("2027-02-15"),
    seasonEnd: new Date("2027-02-28T23:59:59"),
  },
  {
    seasonNumber: 53,
    seasonStart: new Date("2027-03-01"),
    seasonEnd: new Date("2027-03-14T23:59:59"),
  },
  {
    seasonNumber: 54,
    seasonStart: new Date("2027-03-15"),
    seasonEnd: new Date("2027-03-31T23:59:59"),
  },
  {
    seasonNumber: 55,
    seasonStart: new Date("2027-04-01"),
    seasonEnd: new Date("2027-04-14T23:59:59"),
  },
  {
    seasonNumber: 56,
    seasonStart: new Date("2027-04-15"),
    seasonEnd: new Date("2027-04-30T23:59:59"),
  },
  {
    seasonNumber: 57,
    seasonStart: new Date("2027-05-01"),
    seasonEnd: new Date("2027-05-14T23:59:59"),
  },
  {
    seasonNumber: 58,
    seasonStart: new Date("2027-05-15"),
    seasonEnd: new Date("2027-05-31T23:59:59"),
  },
  {
    seasonNumber: 59,
    seasonStart: new Date("2027-06-01"),
    seasonEnd: new Date("2027-06-14T23:59:59"),
  },
  {
    seasonNumber: 60,
    seasonStart: new Date("2027-06-15"),
    seasonEnd: new Date("2027-06-30T23:59:59"),
  },
  {
    seasonNumber: 61,
    seasonStart: new Date("2027-07-01"),
    seasonEnd: new Date("2027-07-14T23:59:59"),
  },
  {
    seasonNumber: 62,
    seasonStart: new Date("2027-07-15"),
    seasonEnd: new Date("2027-07-31T23:59:59"),
  },
  {
    seasonNumber: 63,
    seasonStart: new Date("2027-08-01"),
    seasonEnd: new Date("2027-08-14T23:59:59"),
  },
  {
    seasonNumber: 64,
    seasonStart: new Date("2027-08-15"),
    seasonEnd: new Date("2027-08-31T23:59:59"),
  },
  {
    seasonNumber: 65,
    seasonStart: new Date("2027-09-01"),
    seasonEnd: new Date("2027-09-14T23:59:59"),
  },
  {
    seasonNumber: 66,
    seasonStart: new Date("2027-09-15"),
    seasonEnd: new Date("2027-09-30T23:59:59"),
  },
  {
    seasonNumber: 67,
    seasonStart: new Date("2027-10-01"),
    seasonEnd: new Date("2027-10-14T23:59:59"),
  },
  {
    seasonNumber: 68,
    seasonStart: new Date("2027-10-15"),
    seasonEnd: new Date("2027-10-31T23:59:59"),
  },
  {
    seasonNumber: 69,
    seasonStart: new Date("2027-11-01"),
    seasonEnd: new Date("2027-11-14T23:59:59"),
  },
  {
    seasonNumber: 70,
    seasonStart: new Date("2027-11-15"),
    seasonEnd: new Date("2027-11-30T23:59:59"),
  },
  {
    seasonNumber: 71,
    seasonStart: new Date("2027-12-01"),
    seasonEnd: new Date("2027-12-14T23:59:59"),
  },
  {
    seasonNumber: 72,
    seasonStart: new Date("2027-12-15"),
    seasonEnd: new Date("2027-12-31T23:59:59"),
  },
  {
    seasonNumber: 73,
    seasonStart: new Date("2028-01-01"),
    seasonEnd: new Date("2028-01-14T23:59:59"),
  },
  {
    seasonNumber: 74,
    seasonStart: new Date("2028-01-15"),
    seasonEnd: new Date("2028-01-31T23:59:59"),
  },
  {
    seasonNumber: 75,
    seasonStart: new Date("2028-02-01"),
    seasonEnd: new Date("2028-02-14T23:59:59"),
  },
  {
    seasonNumber: 76,
    seasonStart: new Date("2028-02-15"),
    seasonEnd: new Date("2028-02-29T23:59:59"),
  },
  {
    seasonNumber: 77,
    seasonStart: new Date("2028-03-01"),
    seasonEnd: new Date("2028-03-14T23:59:59"),
  },
  {
    seasonNumber: 78,
    seasonStart: new Date("2028-03-15"),
    seasonEnd: new Date("2028-03-31T23:59:59"),
  },
  {
    seasonNumber: 79,
    seasonStart: new Date("2028-04-01"),
    seasonEnd: new Date("2028-04-14T23:59:59"),
  },
  {
    seasonNumber: 80,
    seasonStart: new Date("2028-04-15"),
    seasonEnd: new Date("2028-04-30T23:59:59"),
  },
  {
    seasonNumber: 81,
    seasonStart: new Date("2028-05-01"),
    seasonEnd: new Date("2028-05-14T23:59:59"),
  },
  {
    seasonNumber: 82,
    seasonStart: new Date("2028-05-15"),
    seasonEnd: new Date("2028-05-31T23:59:59"),
  },
  {
    seasonNumber: 83,
    seasonStart: new Date("2028-06-01"),
    seasonEnd: new Date("2028-06-14T23:59:59"),
  },
  {
    seasonNumber: 84,
    seasonStart: new Date("2028-06-15"),
    seasonEnd: new Date("2028-06-30T23:59:59"),
  },
  {
    seasonNumber: 85,
    seasonStart: new Date("2028-07-01"),
    seasonEnd: new Date("2028-07-14T23:59:59"),
  },
  {
    seasonNumber: 86,
    seasonStart: new Date("2028-07-15"),
    seasonEnd: new Date("2028-07-31T23:59:59"),
  },
  {
    seasonNumber: 87,
    seasonStart: new Date("2028-08-01"),
    seasonEnd: new Date("2028-08-14T23:59:59"),
  },
  {
    seasonNumber: 88,
    seasonStart: new Date("2028-08-15"),
    seasonEnd: new Date("2028-08-31T23:59:59"),
  },
  {
    seasonNumber: 89,
    seasonStart: new Date("2028-09-01"),
    seasonEnd: new Date("2028-09-14T23:59:59"),
  },
  {
    seasonNumber: 90,
    seasonStart: new Date("2028-09-15"),
    seasonEnd: new Date("2028-09-30T23:59:59"),
  },
  {
    seasonNumber: 91,
    seasonStart: new Date("2028-10-01"),
    seasonEnd: new Date("2028-10-14T23:59:59"),
  },
  {
    seasonNumber: 92,
    seasonStart: new Date("2028-10-15"),
    seasonEnd: new Date("2028-10-31T23:59:59"),
  },
  {
    seasonNumber: 93,
    seasonStart: new Date("2028-11-01"),
    seasonEnd: new Date("2028-11-14T23:59:59"),
  },
  {
    seasonNumber: 94,
    seasonStart: new Date("2028-11-15"),
    seasonEnd: new Date("2028-11-30T23:59:59"),
  },
  {
    seasonNumber: 95,
    seasonStart: new Date("2028-12-01"),
    seasonEnd: new Date("2028-12-14T23:59:59"),
  },
  {
    seasonNumber: 96,
    seasonStart: new Date("2028-12-15"),
    seasonEnd: new Date("2028-12-31T23:59:59"),
  },
  {
    seasonNumber: 97,
    seasonStart: new Date("2029-01-01"),
    seasonEnd: new Date("2029-01-14T23:59:59"),
  },
  {
    seasonNumber: 98,
    seasonStart: new Date("2029-01-15"),
    seasonEnd: new Date("2029-01-31T23:59:59"),
  },
  {
    seasonNumber: 99,
    seasonStart: new Date("2029-02-01"),
    seasonEnd: new Date("2029-02-14T23:59:59"),
  },
  {
    seasonNumber: 100,
    seasonStart: new Date("2029-02-15"),
    seasonEnd: new Date("2029-02-28T23:59:59"),
  },
];

export const getCurrentSeason = () => {
  const now = new Date();

  // Find the current season based on the current date
  const currentSeason = SEASONS.find((season) => now >= season.seasonStart && now <= season.seasonEnd);

  if (!currentSeason) {
    throw new Error('No current season found');
  }

  return { 
    seasonNumber: currentSeason.seasonNumber,
    seasonStart: currentSeason.seasonStart,
    seasonEnd: currentSeason.seasonEnd 
  };
};


