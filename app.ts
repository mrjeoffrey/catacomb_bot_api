import express from "express";
import dotenv from "dotenv";
import cors from "cors";
const bodyParser = require("body-parser");
// import crypto from "crypto";
import path from "path";

import connectDB from "./utils/database";
import adminRoutes from "./routes/adminRoutes";
import logRoutes from "./routes/logRoutes";
import userRoutes from "./routes/userRoutes";
import taskRoutes from "./routes/taskRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import levelRoutes from "./routes/levelRoutes";
import Level from "./models/levelModel";
import Settings from "./models/settingsModel";
// import User from "./models/userModel";
// import Admin from "./models/adminModel";
// import Task from "./models/taskModel";
import stakingRoutes from "./routes/stakingRoutes";
import tapGameRoutes from "./routes/tapGameRoutes";
import { PORT } from "./config/config";
// import { bot } from "./utils/telegramBot";
// import { handleMenu } from "./bot/handlers";
import { loadLevelsInMemory } from "./controllers/levelController";
import tapGameLevelModel from "./models/tapGameLevelModel";
import { removeUnnecessaryChestListInSpecificPeriod } from "./controllers/adminController";

declare module "cors";
dotenv.config();

const app = express();

// Enable CORS
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
// Middleware
app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Connect to Database
connectDB();

// Seed initial data
const seedInitialData = async () => {
  try {
    // Seed TapGameLevels (if not already seeded)
    const tapGameLevelCount = await tapGameLevelModel.countDocuments();
    if (tapGameLevelCount === 0) {
      const level1 = await Level.find({ level: { $in: [1, 2, 3] } }).exec();
      const level2 = await Level.find({ level: { $in: [4, 5, 6] } }).exec();
      const level3 = await Level.find({ level: { $in: [7, 8, 9] } }).exec();

      const initialTapGameLevels = [
        {
          tap_level: 1,
          required_user_levels: level1.map(level => level._id), // Level 1 includes user levels 1, 2, 3
          xp_earning_per_tap: 1,
          gold_earning_per_tap: 1,
          pyramid_image_url: "https://pub-eb157c13cf5f4c28845c2a603ed21192.r2.dev/Pyramid_01.png",
          tap_limit_per_ticket: 100,
          pyramid_name: "Sandstone Builder"
        },
        {
          tap_level: 2,
          required_user_levels: level2.map(level => level._id), // Level 2 includes user levels 4, 5, 6
          xp_earning_per_tap: 2,
          gold_earning_per_tap: 2,
          pyramid_image_url: "https://pub-eb157c13cf5f4c28845c2a603ed21192.r2.dev/Pyramid_02.png",
          tap_limit_per_ticket: 100,
          pyramid_name: "Granite Architect",
        },
        {
          tap_level: 3,
          required_user_levels: level3.map(level => level._id), // Level 3 includes user levels 7, 8, 9
          xp_earning_per_tap: 3,
          gold_earning_per_tap: 3,
          pyramid_image_url: "https://pub-eb157c13cf5f4c28845c2a603ed21192.r2.dev/Pyramid_03.png",
          tap_limit_per_ticket: 100,
          pyramid_name: "Pharaoh’s Visionary",
        }
      ];

      await tapGameLevelModel.insertMany(initialTapGameLevels);
      console.log("Initial TapGame levels seeded.");
    }
//     // Seed Levels
//     const levelCount = await Level.countDocuments();
//     if (levelCount === 0) {
//       const initialLevels = [
//         {
//           level: 1,
//           xp_required: 0,
//           seconds_for_next_chest_opening: 120,
//           one_time_bonus_rewards: "n/a",
//         },
//         {
//           level: 2,
//           xp_required: 5000,
//           seconds_for_next_chest_opening: 100,
//           one_time_bonus_rewards: 500,
//         },
//         {
//           level: 3,
//           xp_required: 15000,
//           seconds_for_next_chest_opening: 80,
//           one_time_bonus_rewards: 500,
//         },
//         {
//           level: 4,
//           xp_required: 45000,
//           seconds_for_next_chest_opening: 70,
//           one_time_bonus_rewards: 500,
//         },
//         {
//           level: 5,
//           xp_required: 135000,
//           seconds_for_next_chest_opening: 60,
//           one_time_bonus_rewards: 1000,
//         },
//         {
//           level: 6,
//           xp_required: 405000,
//           seconds_for_next_chest_opening: 50,
//           one_time_bonus_rewards: 1000,
//         },
//         {
//           level: 7,
//           xp_required: 1215000,
//           seconds_for_next_chest_opening: 40,
//           one_time_bonus_rewards: 1000,
//         },
//         {
//           level: 8,
//           xp_required: 3645000,
//           seconds_for_next_chest_opening: 30,
//           one_time_bonus_rewards: 2000,
//         },
//         {
//           level: 9,
//           xp_required: 10935000,
//           seconds_for_next_chest_opening: 20,
//           one_time_bonus_rewards: 5000,
//         },
//       ];
//       await Level.insertMany(initialLevels);
//       console.log("Initial levels seeded.");
//     }

//     // Seed Settings
//     const settingsCount = await Settings.countDocuments();
//     if (settingsCount === 0) {
//       const initialSettings = {
//         opening_chest_earning: {
//           golds: [75, 100, 125, 150],
//           xp: 0,
//         },
//         referral_earning: {
//           gold_percentage: 10,
//           xp: 0,
//         },
//       };
//       await Settings.create(initialSettings);
//       console.log("Initial settings seeded.");
//     }

//     // Seed Admins
//     const adminCount = await Admin.countDocuments();
//     if (adminCount === 0) {
//       const initialAdmins = [
//         {
//           name: "Admin One",
//           email: "admin1@example.com",
//           password: "password123",
//         },
//         {
//           name: "Admin Two",
//           email: "admin2@example.com",
//           password: "password123",
//         },
//       ];
//       await Admin.insertMany(initialAdmins);
//       console.log("Initial admins seeded.");
//     }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
};

// Call seeding function
seedInitialData();

loadLevelsInMemory();
removeUnnecessaryChestListInSpecificPeriod(1, "6430530130")

app.use("/api/logs", logRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/staking", stakingRoutes);
app.use("/api/tap_game", tapGameRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// bot.onText(/\/start/, handleMenu);
