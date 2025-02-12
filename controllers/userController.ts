import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import Settings from "../models/settingsModel";
import Task, { ITask } from "../models/taskModel";
import { getUserLevel } from "./levelController";
import crypto from "crypto";
import { isValidObjectId, Types } from "mongoose";
import { getCurrentSeason } from "../config/config";
import { calculateChestOpeningTime } from "./chestOpeningGameController";
import { canClaimAdTicketToday, getUserTapLevelByUserXp } from "./tapGameController";
import { TELEGRAM_BOT_TOKEN } from "../config/config";
import axios from "axios";

// Get All Users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Fetch all users and populate necessary fields
    const users = await User.find({ "task_done.task_id": { $ne: null } })
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

    const filteredUsers = users.map((user) => {
      const filteredTaskDone = user.task_done.filter(
        (task) => task.task_id !== null
      );
      return {
        ...user.toObject(), // Convert Mongoose document to plain object
        task_done: filteredTaskDone,
      };
    });

    // Add referred_by_count for each user
    const usersWithReferralCount = await Promise.all(
      filteredUsers.map(async (user) => {
        const referralCount = await User.countDocuments({ referred_by: user._id });
        return {
          ...user, // Convert Mongoose document to plain object
          referralCount,
        };
      })
    );

    res.json(usersWithReferralCount);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

//Get All Users Basic Infos
export const getAllUsersBasicInfo = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "username telegram_id gold xp referral_code blocked location IP_address created_at");

    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


export const recalcAllUserInfo = async () => {
  const users = await User.find()
  const usersWithDetails = await Promise.all(
    users.map(async (user) => {
      const { totalGold, totalXP } = await getTotalXpAndGoldByUser(user)

      user.xp = totalXP;
      user.gold = totalGold;
      const { seasonStart, seasonEnd } = getCurrentSeason();
      const { seasonGold, seasonXP } = await getSpecificSeasonXPAndGoldByUser(user, seasonStart, seasonEnd)

      user.current_season_xp = seasonXP;
      user.current_season_gold = seasonGold;
      console.log(user.username, user.current_season_xp);
      await user.save();
    }))
  return usersWithDetails;
}

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

  // Remove telegram_id from final rankings
  const topRankings = allRankings.slice(0, 15).map(({ telegram_id, ...rest }) => rest);

  return { rankings: topRankings, currentUserRank: currentUserRanking?.rank };
};

export const getSpecificSeasonXPAndGoldByUser = async (user: IUser, seasonStart: Date, seasonEnd: Date) => {

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

  // Calculate XP and gold from tap_game_history_per_day within the season
  const tapGameHistoryThisSeason = user.tap_game_history_per_day.filter(
    (entry) => entry.date >= seasonStart && entry.date <= seasonEnd
  );

  const tapGameSeasonXP = tapGameHistoryThisSeason.reduce(
    (sum, entry) => sum + entry.xp,
    0
  );

  const tapGameSeasonGold = tapGameHistoryThisSeason.reduce(
    (sum, entry) => sum + entry.gold,
    0
  );

  // Combine XP and gold from chests, tasks, and tap game history
  const seasonXP = chestSeasonXP + taskSeasonXP + tapGameSeasonXP;
  const seasonGold = chestSeasonGold + taskSeasonGold + tapGameSeasonGold;

  // Calculate valid referrals this month
  const validReferralsThisMonth = user.valid_referrals.filter(
    (referral) =>
      referral.time_added >= seasonStart && referral.time_added <= seasonEnd
  );

  const additionalXP = validReferralsThisMonth.length * 50;

  // Total season XP including referral XP
  const totalSeasonXP = seasonXP + additionalXP;

  return {
    seasonXP: totalSeasonXP,
    seasonGold: seasonGold,
    seasonStart,
    seasonEnd,
  };
};


export const getTotalXpAndGoldByUser = async (user: IUser) => {
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

  // Calculate total XP and gold from tap game history
  const totalTapGameXP = user.tap_game_history_per_day.reduce(
    (sum, entry) => sum + entry.xp,
    0
  );

  const totalTapGameGold = user.tap_game_history_per_day.reduce(
    (sum, entry) => sum + entry.gold,
    0
  );

  // Combine all sources of XP and gold
  const totalXP =
    totalChestXP + totalTaskXP + totalTapGameXP;
  const totalGold =
    totalChestGold + totalTaskGold + totalTapGameGold;


  // Calculate valid referrals this period (from 2024/12/24 to today)
  const validReferralsThisPeriod = user.valid_referrals.filter(
    (referral) =>
      referral.time_added >= startDate && referral.time_added <= today
  );

  const additionalXPFromReferrals = validReferralsThisPeriod.length * 50;

  // Total XP including referral XP
  const totalXPWithReferrals = totalXP + additionalXPFromReferrals;
  return {
    totalXP: totalXPWithReferrals,
    totalGold: totalGold,
  }
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

    // Calculate user level and chest opening time
    const { level, seconds_for_next_chest_opening } = getUserLevel(user.xp);
    const remainingChestOpeningSeconds = calculateChestOpeningTime(
      user,
      seconds_for_next_chest_opening
    );

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
    const all_referrals = getUsersReferredByUser(user._id)
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
      remainingSeconds: remainingChestOpeningSeconds,
      rankings: rankings,
      rank: currentUserRank,
      valid_referrals: validReferrals,
      all_referrals
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info with ranking:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const editUserFirstOrLastname = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;
  let { first_name, last_name } = req.body;

  first_name = first_name || "";
  last_name = last_name || "";

  try {
    const user = await User.findOneAndUpdate(
      { telegram_id },
      { $set: { first_name, last_name } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user });
  } catch (error: any) {
    console.error(error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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

  let { first_name, last_name } = req.body;

  first_name = first_name || "";
  last_name = last_name || "";

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
      first_name,
      last_name,
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

    const { totalGold, totalXP } = await getTotalXpAndGoldByUser(user)

    user.xp = totalXP;
    user.gold = totalGold;
    const { seasonStart, seasonEnd } = getCurrentSeason();
    const { seasonGold, seasonXP } = await getSpecificSeasonXPAndGoldByUser(user, seasonStart, seasonEnd)

    user.current_season_xp = seasonXP;
    user.current_season_gold = seasonGold;

    await user.save();
    // Calculate user level and chest opening time
    const { level, seconds_for_next_chest_opening, percentage_to_next_level } =
      getUserLevel(totalXP);

    const tapLevel = await getUserTapLevelByUserXp(totalXP);
    const remainingChestOpeningSeconds = calculateChestOpeningTime(
      user,
      seconds_for_next_chest_opening
    );

    // Fetch the valid referrals with additional user info
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
    const canClaim = canClaimAdTicketToday(user.tickets_getting_history);

    const claimableAdsgramTicket = canClaim;
    const AdsgarmMessage = canClaim
      ? "You can claim Adsgram tickets today."
      : "Adsgram tickets have already been claimed for today.";

    // Convert the Mongoose document to a plain JavaScript object
    const userPlainObject = user.toObject();
    // Add the season_xp, season_gold, totalSeasonXP, rank, and valid referrals
    const userInfo = {
      ...userPlainObject,
      season_xp: seasonXP,
      season_gold: seasonGold,
      level,
      percentage_to_next_level,
      currentTime: new Date(),
      seconds: seconds_for_next_chest_opening,
      remainingSeconds: remainingChestOpeningSeconds,
      rank: currentUserRank,
      rankings: rankings,
      valid_referrals: validReferrals,
      claimableAdsgramTicket,
      AdsgarmMessage,
      seasonStart: seasonStart, seasonEnd: seasonEnd,
      tapLevel: tapLevel,
    };

    res.json(userInfo);
  } catch (error) {
    console.error("Error fetching user info with ranking:", error);
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

// Function to get all users referred by a specific user
export const getUsersReferredByUser = async (userId: Types.ObjectId): Promise<IUser[]> => {
  try {
    const users = await User.find({ referred_by: userId })
      .populate({
        path: "referred_by",
        select: "username _id telegram_id",
      })
      .populate({
        path: "task_done.task_id",
        select: "name link avatar_url gold_reward xp_reward",
      });
    console.log(users, "_________________________")
    return users;
  } catch (error) {
    console.error("Error fetching users referred by user:", error);
    throw new Error("Server error");
  }
};

