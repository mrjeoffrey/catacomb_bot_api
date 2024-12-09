import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import { getUserLevel } from "./levelController";
import crypto from "crypto";

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().populate({
      path: "referred_by",
      select: "username _id telegram_id",
    });
    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const {
    telegram_id,
    username,
    wallet_address,
    IP_address,
    referral_code,
    location,
  } = req.body;

  try {
    const existingUser = await User.findOne({ telegram_id });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let referrer: IUser | null = null;

    if (referral_code) {
      referrer = await User.findOne({ referral_code });
      if (!referrer) {
        console.warn(`Referral code ${referral_code} does not exist.`);
      }
    }

    const newReferralCode = crypto.randomBytes(6).toString("hex");

    const newUser = new User({
      telegram_id,
      username,
      wallet_address,
      IP_address,
      location,
      referral_code: newReferralCode,
      referred_by: referrer ? referrer._id : null,
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const calculateChestOpeningTime = (
  user: any,
  seconds_for_next_chest_opening: number
): number => {
  const now = Date.now();

  if (user.chest_opened_history && user.chest_opened_history.length > 0) {
    const lastChestOpened =
      user.chest_opened_history[user.chest_opened_history.length - 1];
    const lastOpenedTime = new Date(lastChestOpened.time_opened).getTime();

    const timeDifference = (now - lastOpenedTime) / 1000;

    if (timeDifference >= seconds_for_next_chest_opening) {
      return 0;
    } else {
      return Math.floor(seconds_for_next_chest_opening - timeDifference);
    }
  } else {
    const userJoinedTime = new Date(user.created_at).getTime();
    const timeDifference = (now - userJoinedTime) / 1000;
    if (timeDifference >= seconds_for_next_chest_opening) {
      return 0;
    } else {
      return Math.floor(seconds_for_next_chest_opening - timeDifference);
    }
  }
};

// Get User Info
export const getUserInfo = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    // Calculate the user's season XP and gold
    const chestOpenedThisSeason = user.chest_opened_history.filter(
      (entry) => entry.time_opened >= startOfMonth
    );

    const seasonXP = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.xp,
      0
    );

    const seasonGold = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.gold,
      0
    );

    // Calculate valid referrals validated this month
    const validReferralsThisMonth = user.valid_referrals.filter(
      (referral) => referral.time_added >= startOfMonth
    );

    const additionalXP = validReferralsThisMonth.length * 100;

    // Total season XP including referral XP
    const totalSeasonXP = seasonXP + additionalXP;

    // Calculate user level and chest opening time
    const { level, seconds_for_next_chest_opening } = getUserLevel(user.xp);
    const remainingSeconds = calculateChestOpeningTime(
      user,
      seconds_for_next_chest_opening
    );
    // Aggregate rankings for active users
    const rankings = await User.aggregate([
      { $match: { blocked: false } },
      {
        $project: {
          username: 1,
          telegram_id: 1,
          season_gold: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$chest_opened_history",
                    as: "entry",
                    cond: { $gte: ["$$entry.time_opened", startOfMonth] },
                  },
                },
                as: "entry",
                in: "$$entry.gold",
              },
            },
          },
          season_xp: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$chest_opened_history",
                    as: "entry",
                    cond: { $gte: ["$$entry.time_opened", startOfMonth] },
                  },
                },
                as: "entry",
                in: "$$entry.xp",
              },
            },
          },
        },
      },
      { $sort: { season_gold: -1, season_xp: -1 } },
    ]);

    const userRank =
      rankings.findIndex((r) => r.telegram_id === telegram_id) + 1;

    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();

    // Add the season_xp, season_gold, totalSeasonXP, and rank properties
    const userInfo = {
      ...userPlainObject,
      season_xp: totalSeasonXP,
      season_gold: seasonGold,
      level: level,
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingSeconds,
      rank: userRank,
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info with ranking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Complete Task
export const completeTask = async (req: Request, res: Response) => {
  const { telegram_id, task_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Logic to complete the task, add rewards, etc.
    user.task_done.push(task_id);
    user.gold += 300; // Example reward
    user.xp += 400; // Example reward
    await user.save();

    res.json({
      message: "Task completed successfully",
      gold_reward: 300,
      xp_reward: 400,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Open Chest
import Settings from "../models/settingsModel"; // Import the Settings model

export const openChest = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the settings
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(500).json({ message: "Settings not found" });
    }
    const golds = settings.opening_chest_earning.golds;
    const gold_reward = golds[Math.floor(Math.random() * golds.length)];
    const xp_reward = settings.opening_chest_earning.xp;
    user.gold += gold_reward;
    user.xp += xp_reward;

    user.chest_opened_history.push({
      time_opened: new Date(),
      xp: xp_reward,
      gold: gold_reward,
    });

    await user.save();

    // Handle referral logic
    if (user.referred_by) {
      const referrer = await User.findById(user.referred_by);
      if (referrer) {
        // Check if the referred user is already a valid referral
        const isAlreadyValidReferral = referrer.valid_referrals.some(
          (referral) => referral.id.equals(user._id)
        );

        if (!isAlreadyValidReferral) {
          if (user.gold > 0) {
            referrer.valid_referrals.push({
              id: user._id,
              time_added: new Date(),
            });
            referrer.xp += 100; // Reward referrer with 100 XP for valid referral
          }
        }
        const referralGoldReward = Math.floor(
          (settings.referral_earning.gold_percentage / 100) * gold_reward
        );
        referrer.gold += referralGoldReward;
        referrer.xp += settings.referral_earning.xp;

        await referrer.save();
      }
    }

    res.json({
      message: "Chest opened",
      gold: gold_reward,
      xp: xp_reward,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
