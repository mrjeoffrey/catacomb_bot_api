import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  opening_chest_earning: { golds: number[]; xp: number };
  referral_earning: { gold_percentage: number; xp: number };
  daily_opening_chests_limit: number;
  season_settings: {
    currency_name: string;
    currency_link: string;
    currency_img_url: string;
    prizes: number[];
  };
}

const settingsSchema: Schema = new Schema({
  opening_chest_earning: {
    golds: { type: [Number], default: [75, 100, 125, 150] },
    xp: { type: Number, default: 0 },
  },
  referral_earning: {
    gold_percentage: { type: Number, default: 10 },
    xp: { type: Number, default: 0 },
  },
  daily_opening_chests_limit: { type: Number, default: 60 },
  season_settings: {
    currency_name: { type: String, required: true, default: "USDT" },
    currency_link: { type: String },
    currency_img_url: { type: String, required: true },
    prizes: {
      type: [Number],
      default: [200, 150, 120, 100, 90, 80, 70, 50, 40, 30, 25, 20, 10, 8, 7],
    },
  },
});

export default mongoose.model<ISettings>("Settings", settingsSchema);
