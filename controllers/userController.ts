import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import Settings from "../models/settingsModel";
import Task, { ITask } from "../models/taskModel";
import { getUserLevel } from "./levelController";
import crypto from "crypto";
import { isValidObjectId } from "mongoose";
import levelModel from "../models/levelModel";
import { getCurrentSeason } from "../config/config";

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Fetch all users and populate necessary fields
    const users = await User.find()
      .populate({
        path: "referred_by",
        select: "username _id telegram_id",
      })
      .populate({
        path: "task_done.task_id",
        select: "name link avatar_url gold_reward xp_reward",
      });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "Users not found" });
    }

    // Add referred_by_count for each user
    const usersWithReferralCount = await Promise.all(
      users.map(async (user) => {
        const referralCount = await User.countDocuments({ referred_by: user._id });
        return {
          ...user.toObject(), // Convert Mongoose document to plain object
          referralCount,
        };
      })
    );

    res.json(usersWithReferralCount);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//Get Users By Pagination and filtering
export const getUsersByPaginationAndFiltering = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const size = parseInt(req.query.size as string, 10) || 30;
    const sortField = (req.query.sortField as string) || "created_at";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    // Search filter for username
    const searchValue = req.query.search_value as string;
    const searchFilter: any = {};
    if (searchValue && searchValue.trim() !== "") {
      searchFilter.username = { $regex: searchValue.trim(), $options: "i" }; // Case-insensitive regex match
    }

    let users: IUser[];

    if (sortField === "task_done_length") {
      // Sorting by array length requires aggregation
      users = await User.aggregate([
        {
          $match: searchFilter,
        },
        {
          $addFields: {
            task_done_length: { $size: "$task_done" },
          },
        },
        {
          $sort: { task_done_length: sortOrder },
        },
        { $skip: (page - 1) * size },
        { $limit: size },
      ]);
    } else {
      // Regular query with sorting and filtering
      users = await User.find(searchFilter)
        .populate({
          path: "referred_by",
          select: "username _id telegram_id",
        })
        .populate({
          path: "task_done.task_id",
          select: "name link avatar_url gold_reward xp_reward",
        })
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * size)
        .limit(size);
    }

    // Add referral count and other computed fields
    const usersWithReferralCount = await Promise.all(
      users.map(async (user) => {
        const referralCount = await User.countDocuments({
          referred_by: user._id,
        });
        const validatedTaskCount = user.task_done.filter(
          (task) => task.validation_status === "validated"
        ).length;

        return {
          ...user.toObject(),
          referralCount,
          validatedTaskCount,
        };
      })
    );

    const totalUsers = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalUsers / size);

    res.json({
      users: usersWithReferralCount,
      meta: {
        totalUsers,
        page,
        size,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};



const getRankings = async (current_user: IUser) => {
  // Retrieve all user rankings, comparing current_season_xp and current_season_gold
  const allRankings = await User.aggregate([
    { $match: { blocked: false } },
    {
      $project: {
        username: 1,
        telegram_id: 1,
        current_season_xp: 1,
        current_season_gold: 1,
      },
    },
    { $sort: { current_season_xp: -1, current_season_gold: -1 } }, // Sort by XP first, then by gold
  ]);

  // Add ranking numbers to all users
  allRankings.forEach((user, index) => {
    user.rank = index + 1;
  });

  // Find the current user's rank
  const currentUserRanking = allRankings.find(
    (user) => user.telegram_id === current_user?.telegram_id
  );

  // Get the top 15 rankings
  const topRankings = allRankings.slice(0, 15);

  return { rankings: topRankings, currentUserRank: currentUserRanking?.rank };
};

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
    const { rankings, currentUserRank } = await getRankings(user);

    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();

    // Add the season_xp, season_gold, totalSeasonXP, rank, and valid referrals
    const userInfo = {
      ...userPlainObject,
      season_xp: user.current_season_xp,
      season_gold: user.current_season_gold,
      level: level,
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingSeconds,
      rankings: rankings,
      rank: currentUserRank,
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

    const startDate = new Date("2024-12-24");
    const today = new Date();

    const chestOpenedThisPeriod = user.chest_opened_history.filter(
      (entry) => entry.time_opened >= startDate && entry.time_opened <= today
    );

    const totalChestXP = chestOpenedThisPeriod.reduce(
      (sum, entry) => sum + entry.xp,
      0
    );

    const totalChestGold = chestOpenedThisPeriod.reduce(
      (sum, entry) => sum + entry.gold,
      0
    );

    const tasksDoneThisPeriod = user.task_done.filter(
      (task) =>
        task.validation_status === "validated" &&
        task.completed_date >= startDate &&
        task.completed_date <= today
    );

    const tasksRewards = await Task.find({
      _id: { $in: tasksDoneThisPeriod.map((task) => task.task_id) },
    });

    const totalTaskXP = tasksRewards.reduce(
      (sum, task) => sum + task.xp_reward,
      0
    );

    const totalTaskGold = tasksRewards.reduce(
      (sum, task) => sum + task.gold_reward,
      0
    );

    // Combine XP and gold from chests and tasks
    const totalXP = totalChestXP + totalTaskXP;
    const totalGold = totalChestGold + totalTaskGold;

    // Calculate valid referrals this period (from 2024/12/24 to today)
    const validReferralsThisPeriod = user.valid_referrals.filter(
      (referral) =>
        referral.time_added >= startDate && referral.time_added <= today
    );

    const additionalXPFromReferrals = validReferralsThisPeriod.length * 50;

    // Total XP including referral XP
    const totalXPWithReferrals = totalXP + additionalXPFromReferrals;

    user.xp = totalXPWithReferrals;
    user.gold = totalGold;

    const { seasonStart, seasonEnd } = getCurrentSeason();
    // Calculate the user's season XP and gold from chest opened history
    const chestOpenedThisSeason = user.chest_opened_history.filter(
      (entry) =>
        entry.time_opened >= seasonStart && entry.time_opened <= seasonEnd
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

    const additionalXP = validReferralsThisMonth.length * 50;

    // Total season XP including referral XP
    const totalSeasonXP = seasonXP + additionalXP;

    user.current_season_xp = totalSeasonXP;
    user.current_season_gold = seasonGold;

    await user.save();
    // Calculate user level and chest opening time
    const { level, seconds_for_next_chest_opening } =
      getUserLevel(totalXPWithReferrals);
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

    const { rankings, currentUserRank } = await getRankings(user);
    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();
    // Add the season_xp, season_gold, totalSeasonXP, rank, and valid referrals
    const userInfo = {
      ...userPlainObject,
      season_xp: totalSeasonXP,
      season_gold: seasonGold,
      level: level,
      currentTime: new Date(),
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingSeconds,
      rank: currentUserRank,
      rankings: rankings,
      valid_referrals: validReferrals,
      seasonStart:seasonStart, seasonEnd: seasonEnd
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

    // Fetch user's level based on XP
    const level = await levelModel
      .findOne({ xp_required: { $lte: user.xp } })
      .sort({ level: -1 });
    if (!level) {
      return res.status(400).json({ message: "Level not found" });
    }

     // Get the current time
     const currentTime = new Date();

     // If limited_time exists, check if the 24-hour cooldown period is over
     if (user.limited_time) {
       const timeSinceCooldownStarted = (currentTime.getTime() - new Date(user.limited_time).getTime()) / 1000; // in seconds
 
       // If the cooldown is still active (within 24 hours)
       if (timeSinceCooldownStarted < 24 * 60 * 60) {
         const remainingTime = 24 * 60 * 60 - timeSinceCooldownStarted; // Remaining cooldown time in seconds
         const hours = Math.floor(remainingTime / 3600);
         const minutes = Math.floor((remainingTime % 3600) / 60);
         const seconds = Math.floor(remainingTime % 60);
 
         return res.status(400).json({
           message: "Daily limit reached",
           remainingTime: `${hours}:${minutes}:${seconds}`, // Display the countdown in HH:MM:SS format
           currentTime: currentTime,  // Current time as Date
           limitedTime: user.limited_time, // limited_time as Date
         });
       }
     }
 
     // Check if the user has opened `daily_opening_chests_limit` chests within the last 24 hours
     const chestsOpenedInLast24Hours = user.chest_opened_history.filter(
       (chest) => (currentTime.getTime() - new Date(chest.time_opened).getTime()) <= 24 * 60 * 60 * 1000 // 24 hours in milliseconds
     );
 
     // If the user has already opened the max number of chests within 24 hours, trigger the cooldown
     if (chestsOpenedInLast24Hours.length >= settings.daily_opening_chests_limit) {
       user.limited_time = currentTime; // Set the limited_time to the current time when the cooldown starts
       await user.save();
 
       const remainingTime = 24 * 60 * 60; // 24 hours cooldown
       const hours = Math.floor(remainingTime / 3600);
       const minutes = Math.floor((remainingTime % 3600) / 60);
       const seconds = Math.floor(remainingTime % 60);
 
       return res.status(400).json({
         message: "Daily limit reached",
         remainingTime: `${hours}:${minutes}:${seconds}`, // Display the countdown in HH:MM:SS format
         currentTime: currentTime,  // Current time as Date
         limitedTime: user.limited_time, // limited_time as Date
       });
     }

    // Rewards logic
    const golds = settings.opening_chest_earning.golds;
    const gold_reward = golds[Math.floor(Math.random() * golds.length)];
    const xp_reward = settings.opening_chest_earning.xp;

    // Add to chest opened history
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

export const handleReferralRewards = async (
  user: IUser,
  gold_reward: number
) => {
  if (user.referred_by) {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error("Settings not found");
    }

    const referrer = await User.findById(user.referred_by);
    if (referrer) {
      const isAlreadyValidReferral = referrer.valid_referrals.some((referral) =>
        referral.id.equals(user._id)
      );

      if (!isAlreadyValidReferral) {
        if (user.gold > 0) {
          referrer.valid_referrals.push({
            id: user._id,
            time_added: new Date(),
          });
        }
      }
      await referrer.save();
    }
  }
};
