import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import Settings from "../models/settingsModel";
import Task, { ITask } from "../models/taskModel";
import { getUserLevel } from "./levelController";
import crypto from "crypto";
import { isValidObjectId } from "mongoose";

// Get All Users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find()
      .populate({
        path: "referred_by",
        select: "username _id telegram_id",
      })
      .populate({
        path: "task_done.task_id",
        select: "name link avatar_url gold_reward xp_reward",
      });
    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January)
  const day = now.getDate();

  let seasonStart, seasonEnd;

  if (month === 0 || month % 2 === 0) { // January, March, etc.
    if (day <= 14) {
      seasonStart = new Date(year, month, 1); // 1st of the month
      seasonEnd = new Date(year, month, 14); // 14th of the month
    } else {
      seasonStart = new Date(year, month, 15); // 15th of the month
      seasonEnd = new Date(year, month + 1, 0); // End of the month
    }
  } else { // February, April, etc.
    if (day <= 14) {
      seasonStart = new Date(year, month, 1); // 1st of the month
      seasonEnd = new Date(year, month, 14); // 14th of the month
    } else {
      seasonStart = new Date(year, month, 15); // 15th of the month
      seasonEnd = new Date(year, month + 1, 0); // End of the month
    }
  }

  return { seasonStart, seasonEnd };
}

// Get User Info
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.body;
  // Validate the ObjectId
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const user = await User.findById(id)
      .populate("referred_by", "username")
      .populate({
        path: "valid_referrals.id",
        select: "telegram_id username _id",
      })
      .populate({
        path: "task_done.task_id",
        select: "name link avatar_url gold_reward xp_reward",
      });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { seasonStart, seasonEnd } = getCurrentSeason();
    // Calculate the user's season XP and gold
    const chestOpenedThisSeason = user.chest_opened_history.filter(
      (entry) => entry.time_opened >= seasonStart && entry.time_opened <= seasonEnd
    );

    const seasonXP = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.xp,
      0
    );

    const seasonGold = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.gold,
      0
    );

    // Calculate valid referrals this month
    const validReferralsThisSeason = user.valid_referrals.filter(
      (referral) =>
        referral.time_added >= seasonStart && referral.time_added <= seasonEnd
    );
    const additionalXP = validReferralsThisSeason.length * 100;

    // Total season XP including referral XP
    const totalSeasonXP = seasonXP + additionalXP;

    // Calculate user level and chest opening time
    const { level, seconds_for_next_chest_opening } = getUserLevel(user.xp);
    const remainingSeconds = calculateChestOpeningTime(
      user,
      seconds_for_next_chest_opening
    );

    // Fetch the first 5 valid referrals with additional user info
    const validReferrals = user.valid_referrals
      .filter((referral) => referral.id)
      .sort(
        (a, b) =>
          new Date(b.time_added).getTime() - new Date(a.time_added).getTime()
      )
      .slice(0, 5)
      .map((referral) => {
        if (referral.id) {
          const referralData = referral.id as any;
          return {
            id: referralData.id,
            telegram_id: referralData.telegram_id,
            username: referralData.username,
            time_added: referral.time_added,
          };
        }
      });
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
                    cond: { 
                      $and: [
                        { $gte: ["$$entry.time_opened", seasonStart] },
                        { $lte: ["$$entry.time_opened", seasonEnd] }
                      ]
                    }
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
                    cond: { 
                      $and: [
                        { $gte: ["$$entry.time_opened", seasonStart] },
                        { $lte: ["$$entry.time_opened", seasonEnd] }
                      ]
                    }
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
      { $limit: 15 },
    ]);

    const userRank =
      rankings.findIndex((r) => r.telegram_id === user.telegram_id) + 1;

    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();

    // Add the season_xp, season_gold, totalSeasonXP, rank, and valid referrals
    const userInfo = {
      ...userPlainObject,
      season_xp: totalSeasonXP,
      season_gold: seasonGold,
      level: level,
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingSeconds,
      rank: userRank,
      valid_referrals: validReferrals,
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info with ranking:", error);
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
      referred_by: referrer ? referrer?._id : null,
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
    const user = await User.findOne({ telegram_id }).populate({
      path: "valid_referrals.id",
      select: "telegram_id username _id",
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { seasonStart, seasonEnd } = getCurrentSeason();
    // Calculate the user's season XP and gold from chest opened history
    const chestOpenedThisSeason = user.chest_opened_history.filter(
      (entry) => entry.time_opened >= seasonStart && entry.time_opened <= seasonEnd
    );

    const chestSeasonXP = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.xp,
      0
    );

    const chestSeasonGold = chestOpenedThisSeason.reduce(
      (sum, entry) => sum + entry.gold,
      0
    );

    // Calculate XP and gold from validated tasks done this season
    const tasksDoneThisSeason = user.task_done.filter(
      (task) =>
        task.validation_status === "validated" &&
        task.completed_date >= seasonStart &&
        task.completed_date <= seasonEnd
    );

    // Assuming task XP and gold are stored in the task model
    const tasksSeasonRewards = await Task.find({
      _id: { $in: tasksDoneThisSeason.map((task) => task.task_id) },
    });

    const taskSeasonXP = tasksSeasonRewards.reduce(
      (sum, task) => sum + task.xp_reward,
      0
    );

    const taskSeasonGold = tasksSeasonRewards.reduce(
      (sum, task) => sum + task.gold_reward,
      0
    );

    // Combine XP and gold from chests and tasks
    const seasonXP = chestSeasonXP + taskSeasonXP;
    const seasonGold = chestSeasonGold + taskSeasonGold;

    // Calculate valid referrals this month
    const validReferralsThisMonth = user.valid_referrals.filter(
      (referral) =>
        referral.time_added >= seasonStart && referral.time_added <= seasonEnd
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

    // Fetch the first 5 valid referrals with additional user info
    const validReferrals = user.valid_referrals
      .filter((referral) => referral.id)
      .sort(
        (a, b) =>
          new Date(b.time_added).getTime() - new Date(a.time_added).getTime()
      )
      .slice(0, 5)
      .map((referral) => {
        if (referral.id) {
          const referralData = referral.id as any;
          return {
            id: referralData.id,
            telegram_id: referralData.telegram_id,
            username: referralData.username,
            time_added: referral.time_added,
          };
        }
      });

    // Aggregate rankings for active users
    const rankings = await User.aggregate([
      { $match: { blocked: false } },
      {
        $lookup: {
          from: "tasks", // Name of the Task collection
          localField: "task_done.task_id",
          foreignField: "_id",
          as: "tasks_info",
        },
      },
      {
        $project: {
          username: 1,
          telegram_id: 1,
          season_gold: {
            $add: [
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$chest_opened_history",
                        as: "entry",
                        cond: { $gte: ["$$entry.time_opened", seasonStart], $lte: ["$$entry.time_opened", seasonEnd] },
                      },
                    },
                    as: "entry",
                    in: "$$entry.gold",
                  },
                },
              },
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$tasks_info",
                        as: "task",
                        cond: {
                          $and: [
                            { $gte: ["$$task.completed_date", seasonStart] },
                            { $lte: ["$$task.completed_date", seasonEnd] },
                            { $eq: ["$$task.validation_status", "validated"] },
                          ],
                        },
                      },
                    },
                    as: "task",
                    in: "$$task.gold_reward",
                  },
                },
              },
            ],
          },
          season_xp: {
            $add: [
              {
                $sum: {
                  $map: {
                    input: {
                      cond: {
                        $and: [
                          { $gte: ["$$task.completed_date", seasonStart] },
                          { $lte: ["$$task.completed_date", seasonEnd] },
                          { $eq: ["$$task.validation_status", "validated"] },
                        ],
                      },
                    },
                    as: "entry",
                    in: "$$entry.xp",
                  },
                },
              },
              {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: "$tasks_info",
                        as: "task",
                        cond: {
                          $and: [
                            { $gte: ["$$task.completed_date", seasonStart] },
                            { $lte: ["$$task.completed_date", seasonEnd] },
                            { $eq: ["$$task.validation_status", "validated"] },
                          ],
                        },
                      },
                    },
                    as: "task",
                    in: "$$task.xp_reward",
                  },
                },
              },
            ],
          },
        },
      },
      { $sort: { season_gold: -1, season_xp: -1 } },
    ]);

    const userRank =
      rankings.findIndex((r) => r.telegram_id === telegram_id) + 1;

    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();

    // Add the season_xp, season_gold, totalSeasonXP, rank, and valid referrals
    const userInfo = {
      ...userPlainObject,
      season_xp: totalSeasonXP,
      season_gold: seasonGold,
      level: level,
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingSeconds,
      rank: userRank,
      rankings: rankings,
      valid_referrals: validReferrals,
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info with ranking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Open Chest

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
    // Handle referral logic
    await handleReferralRewards(user, gold_reward);
    
    await user.save();
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

export const handleReferralRewards = async (user: IUser, gold_reward: number) => {
  if (user.referred_by) {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error("Settings not found");
    }

    const referrer = await User.findById(user.referred_by);
    if (referrer) {
      const isAlreadyValidReferral = referrer.valid_referrals.some(
        (referral) => referral.id.equals(user._id)
      );

      if (!isAlreadyValidReferral) {
        if (user.gold > 0) {
          referrer.valid_referrals.push({
            id: user._id,
            time_added: new Date(),
          });
          referrer.xp += 100;
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
};
