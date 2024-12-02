import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/database";
import adminRoutes from "./routes/adminRoutes";
import userRoutes from "./routes/userRoutes";
import taskRoutes from "./routes/taskRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import levelRoutes from "./routes/levelRoutes";
import Level from "./models/levelModel";
import Settings from "./models/settingsModel";
import User from "./models/userModel";
import Admin from "./models/adminModel";
import Task from "./models/taskModel";
import stakingRoutes from "./routes/stakingRoutes";
import { PORT } from "./config/config";
import { bot } from "./utils/telegramBot";
import { handleMenu } from "./bot/handlers";
import { loadLevelsInMemory } from "./controllers/levelController";
declare module "cors";
dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Middleware
app.use(express.json());

// Connect to Database
connectDB();

// Seed initial data
const seedInitialData = async () => {
  try {
    // Seed Levels
    const levelCount = await Level.countDocuments();
    if (levelCount === 0) {
      const initialLevels = [
        {
          level: 1,
          xp_required: 0,
          seconds_for_next_chest_opening: 120,
          one_time_bonus_rewards: "n/a",
        },
        {
          level: 2,
          xp_required: 5000,
          seconds_for_next_chest_opening: 100,
          one_time_bonus_rewards: 500,
        },
        {
          level: 3,
          xp_required: 15000,
          seconds_for_next_chest_opening: 80,
          one_time_bonus_rewards: 500,
        },
        {
          level: 4,
          xp_required: 45000,
          seconds_for_next_chest_opening: 70,
          one_time_bonus_rewards: 500,
        },
        {
          level: 5,
          xp_required: 135000,
          seconds_for_next_chest_opening: 60,
          one_time_bonus_rewards: 1000,
        },
        {
          level: 6,
          xp_required: 405000,
          seconds_for_next_chest_opening: 50,
          one_time_bonus_rewards: 1000,
        },
        {
          level: 7,
          xp_required: 1215000,
          seconds_for_next_chest_opening: 40,
          one_time_bonus_rewards: 1000,
        },
        {
          level: 8,
          xp_required: 3645000,
          seconds_for_next_chest_opening: 30,
          one_time_bonus_rewards: 2000,
        },
        {
          level: 9,
          xp_required: 10935000,
          seconds_for_next_chest_opening: 20,
          one_time_bonus_rewards: 5000,
        },
      ];
      await Level.insertMany(initialLevels);
      console.log("Initial levels seeded.");
    }

    // Seed Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      const initialSettings = {
        opening_chest_earning: {
          golds: [75, 100, 125, 150],
          xp: 0,
        },
        referral_earning: {
          gold_percentage: 10,
          xp: 0,
        },
      };
      await Settings.create(initialSettings);
      console.log("Initial settings seeded.");
    }

    // Seed Admins
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const initialAdmins = [
        {
          name: "Admin One",
          email: "admin1@example.com",
          password: "password123",
        },
        {
          name: "Admin Two",
          email: "admin2@example.com",
          password: "password123",
        },
      ];
      await Admin.insertMany(initialAdmins);
      console.log("Initial admins seeded.");
    }
    // Seed Tasks
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      const initialTasks = Array.from({ length: 10 }, (_, i) => ({
        name: `Task ${i + 1}`,
        description: `Complete Task ${i + 1} to earn rewards.`,
        gold_reward: Math.floor(Math.random() * 301) + 200, // Random number between 200 and 500
        xp_reward: Math.floor(Math.random() * 201) + 300, // Random number between 300 and 500
      }));
      await Task.insertMany(initialTasks);
      console.log("Initial tasks seeded.");
    }

    // Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      // Fetch all Task IDs
      const taskIds = (await Task.find({})).map((task) => task._id);

      // Create 20 new users
      const initialUsers = Array.from({ length: 20 }, (_, i) => ({
        telegram_id: 1000 + i,
        username: `@user_${i + 1}`, // Telegram-style usernames
        gold: Math.floor(Math.random() * 500),
        xp: Math.floor(Math.random() * 5000),
        wallet_address: `0x${Math.random().toString(36).substring(2, 15)}`,
        IP_address: `192.168.1.${i + 1}`, // Unique IP address
        referred_by: null, // Set initially to null
        task_done:
          Math.random() > 0.5 // 50% chance of having tasks done
            ? Array.from(
                { length: Math.floor(Math.random() * taskIds.length) + 1 },
                () => taskIds[Math.floor(Math.random() * taskIds.length)]
              ) // Select random task IDs
            : [], // Empty array
        opened: Array.from({ length: 3 }, (_, j) => ({
          chestId: j + 1,
          openedAt: new Date(Date.now() - j * 60000), // Chests opened earlier
        })),
      }));

      // Insert all users into the database
      const createdUsers = await User.insertMany(initialUsers);
      console.log("Initial users seeded.");

      // Update some users with a referred_by field referencing other users
      const userIds = createdUsers.map((user) => user._id); // Collect the ObjectIds of all created users

      // Randomly assign referred_by for some users
      const updates = createdUsers.map((user) => {
        if (Math.random() > 0.5) {
          // 50% chance of having a referred_by field
          const referred_by =
            userIds[Math.floor(Math.random() * userIds.length)]; // Randomly select a referrer
          if (referred_by !== user._id) {
            // Ensure user isn't referring to themselves
            return User.findByIdAndUpdate(
              user._id,
              { referred_by },
              { new: true }
            );
          }
        }
        return null;
      });

      // Execute all updates in parallel
      await Promise.all(updates.filter((update) => update !== null));
      console.log("User referred_by fields updated.");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
};

// Call seeding function
seedInitialData();

loadLevelsInMemory();

// Routes
// app.use((req, res, next) => {
//   console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
//   console.log("Headers:", req.headers);
//   if (Object.keys(req.body).length > 0) {
//     console.log("Body:", req.body);
//   }
//   next();
// });

app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/staking", stakingRoutes);
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

bot.onText(/\/start/, handleMenu);
