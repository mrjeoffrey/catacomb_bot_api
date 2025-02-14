import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel";
import User, { IUser } from "../models/userModel";
import Task from "../models/taskModel";
import Settings from "../models/settingsModel";
import Level from "../models/levelModel";
import { JWT_SECRET, SEASONS, TELEGRAM_BOT_TOKEN } from "../config/config";
import { isValidObjectId } from "mongoose";
import { getSpecificSeasonXPAndGoldByUser } from "./userController";
import axios from "axios";
import fs from "fs";
import path from "path";

// Register Admin
export const registerAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ email, password });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getSeasonsList = async (req: Request, res: Response) => {
  const now = new Date();
  const pastSeasons = SEASONS.filter(
    (season) => now >= season.seasonStart
  );

  res.status(200).json(pastSeasons);
};

async function getFullName(telegram_id: number) {
  try {
      const user = await User.findOne(
          { telegram_id },
        );
      if (!user) {
        return null;
      }
      if(user.first_name && user.first_name !== ""  && user.last_name && user.last_name !== "") {
        return user.first_name + " " + user.last_name;
      }
      else {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`, {
          params: { chat_id: telegram_id }
      });

      if (response.data.ok) {
          const chat = response.data.result;
          const fullName = chat.first_name + (chat.last_name ? ` ${chat.last_name}` : '');
          console.log('Full Name:', fullName);
          return fullName;
      } else {
          console.error('Error fetching user details:', response.data);
      }
      }
      
  } catch (error) {
      console.error('Error:', error);
  }
}

export const getRankingsInSpecificPeriod = async (req: Request, res: Response) => {
  const { season_number } = req.body;

  try {
    // Get the season from SEASONS array based on the season_number
    const season = SEASONS.find((s) => s.seasonNumber === season_number);

    if (!season) {
      return res.status(400).json({ error: `Season with number ${season_number} not found` });
    }

    const seasonStart = season.seasonStart;
    const seasonEnd = season.seasonEnd;

    const usersList = await User.find();
    const users = await Promise.all(
      usersList.map(async (user) => {
        const {seasonXP} = await getSpecificSeasonXPAndGoldByUser(user, seasonStart, seasonEnd)
        let username = user.username
        if (
          (user?.first_name && user?.first_name.trim() !== "") || 
          (user?.last_name && user?.last_name.trim() !== "")
        ) username = user.first_name + " " + user?.last_name;
        return {
          seasonXP: seasonXP,
          user: user.telegram_id,
          username
        };
      })
    );

    users.sort((a, b) => b.seasonXP - a.seasonXP);

    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

export const removeUnnecessaryChestListInSpecificPeriod = async (
  season_number: number,
  // telegram_id: string
) => {
  try {
    // Get the season from SEASONS array based on the season_number
    const season = SEASONS.find((s) => s.seasonNumber === season_number);
    if (!season) {
      throw new Error(`Season with number ${season_number} not found.`);
    }
    const usersList = await User.find();
    const users = await Promise.all(
      usersList.map(async (user) => {
        const seasonStart = new Date(season.seasonStart);
        const seasonEnd = new Date(season.seasonEnd);
    
        // Filter and aggregate chest entries within the season period
        let aggregatedXP = 0;
        let aggregatedGold = 0;
    
        const filteredHistory = [] as any[];
        let firstHistoryDate = null as null | Date;
    
        user.chest_opened_history.forEach((entry) => {
          const timeOpened = new Date(entry.time_opened);
    
          if (timeOpened >= seasonStart && timeOpened <= seasonEnd) {
            if (firstHistoryDate === null) firstHistoryDate = timeOpened;
            aggregatedXP += entry.xp;
            aggregatedGold += entry.gold;
          } else {
            filteredHistory.push(entry);
          }
        });
    
        // Add the aggregated chest entry for the season period
        if (aggregatedXP > 0 || aggregatedGold > 0) {
          filteredHistory.push({
            time_opened: firstHistoryDate?.toISOString() || seasonEnd.toISOString(),
            xp: aggregatedXP,
            gold: aggregatedGold,
          });
        }
    
        // Sort the history by time_opened
        filteredHistory.sort((a, b) => new Date(a.time_opened).getTime() - new Date(b.time_opened).getTime());
    
        // Update the user's chest_opened_history with the new filtered list
        user.chest_opened_history = filteredHistory;
        await user.save();
    
        console.log(`Chest list updated for user with telegram_id ${user.username}`);
      }))
  
  } catch (error) {
    console.error(`Error in removeUnnecessaryChestListInSpecificPeriod: ${error}`);
  }
};




// Register Moderator
export const registerMod = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({ email, password, role: "moderator" });
    await newAdmin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.log(error, "_____________")
    res.status(500).json({ message: "Server error" });
  }
};

export const getModerators = async (req: Request, res: Response) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({ users: admins });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Admin/Moderator Login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email: admin.email, role: admin.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, role: admin.role });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Remove Admin by ID
export const removeAdmin = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedAdmin = await Admin.findByIdAndDelete(id);

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ message: "Admin removed successfully" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to delete Admin" });
  }
};


// Remove User by ID
export const removeUser = async (req: Request, res: Response) => {
  const { id } = req.body;

  try {
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User removed successfully" });
  } catch (error: any) {
    console.error(error);
    res
      .status(500)
      .json({ message: error?.message || "Failed to delete User" });
  }
};

// Block User
export const blockUser = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { telegram_id },
      { blocked: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User blocked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Edit Task
export const editTask = async (req: Request, res: Response) => {
  const { task_id, name, gold_reward, xp_reward } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(
      task_id,
      { name, gold_reward, xp_reward },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Settings
export const updateSettings = async (req: Request, res: Response) => {
  const { opening_chest_earning, referral_earning } = req.body;

  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      { opening_chest_earning, referral_earning },
      { new: true, upsert: true }
    );

    res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Insert Level
export const insertLevel = async (req: Request, res: Response) => {
  const {
    level,
    xp_required,
    seconds_for_next_chest_opening,
    one_time_bonus_rewards,
  } = req.body;

  try {
    const newLevel = new Level({
      level,
      xp_required,
      seconds_for_next_chest_opening,
      one_time_bonus_rewards,
    });

    await newLevel.save();
    res
      .status(201)
      .json({ message: "Level added successfully", level: newLevel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Level
export const updateLevel = async (req: Request, res: Response) => {
  const {
    level,
    xp_required,
    seconds_for_next_chest_opening,
    one_time_bonus_rewards,
  } = req.body;

  try {
    const updatedLevel = await Level.findOneAndUpdate(
      { level },
      { xp_required, seconds_for_next_chest_opening, one_time_bonus_rewards },
      { new: true }
    );

    if (!updatedLevel) {
      return res.status(404).json({ message: "Level not found" });
    }

    res.json({ message: "Level updated successfully", level: updatedLevel });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const removeChestOpenedHistory = async (req: Request, res: Response) => {
  const { telegram_id, count } = req.body;
  console.log(telegram_id, count, "telegram_id, count");
  const parsedCount = parseInt(count, 10);
  
  if (isNaN(parsedCount) || parsedCount <= 0) {
    return res.status(400).json({ message: "Invalid parsedCount value" });
  }

  try {
     const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const sortedHistory = user.chest_opened_history
      .sort((a, b) => new Date(a.time_opened).getTime() - new Date(b.time_opened).getTime())
      .slice(-parsedCount);

    user.chest_opened_history = sortedHistory;
    await user.save();

    res.json({
      message: "Chest opened history updated successfully",
      remainingHistory: sortedHistory,
    });
  } catch (error) {
    console.error("Error removing chest opened history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUsersWithMoreThan10ReferralsSameIP = async () => {
  try {
    const users: IUser[] = await User.find();
    const userMap = new Map<number, any>();

    for (const user of users) {
      const referrals: IUser[] = await User.find({ referred_by: user._id });
      const ipCountMap = new Map<string, IUser[]>();

      for (const referral of referrals) {
        if (!ipCountMap.has(referral.IP_address)) {
          ipCountMap.set(referral.IP_address, []);
        }
        ipCountMap.get(referral.IP_address)!.push(referral);
      }

      for (const [ip, sameIpReferrals] of ipCountMap.entries()) {
        if (sameIpReferrals.length > 10) {
          userMap.set(user.telegram_id, {
            telegram_id: user.telegram_id,
            username: user.username,
            location: user.location,
            xp: user.xp,
            referral_count: sameIpReferrals.length,
            referrals: sameIpReferrals.map((referral: IUser) => ({
              telegram_id: referral.telegram_id,
              username: referral.username,
              IP_address: referral.IP_address,
              location: referral.location,
              xp: referral.xp
            }))
          });
          console.log(`Processed user: ${user.username}, Telegram ID: ${user.telegram_id}, IP Address: ${user.IP_address}, Referrals Processed: ${sameIpReferrals.length}`);
        }
      }
    }

    const result = Array.from(userMap.values());

    const filePath = path.join(__dirname, "../public/users_with_more_than_10_referrals_same_ip.html");
    const fileContent = `
      <html>
      <head>
        <title>Users with More Than 10 Referrals</title>
        <style>
          body { font-family: Arial, sans-serif; }
          .user { margin-bottom: 20px; }
          .referrals { margin-left: 20px; }
        </style>
      </head>
      <body>
        <h1>Users with More Than 10 Referrals</h1>
        ${result.map(user => `
          <div class="user">
            <h3>${user.username} (Telegram ID: ${user.telegram_id}, Location: ${user.location}, XP: ${user.xp})</h3>
            <p>Referral Count: ${user.referral_count}</p>
            <div class="referrals">
              <h4>Referrals:</h4>
              <ul>
                ${user.referrals.map((referral: any) => `
                  <li>${referral?.username} (Telegram ID: ${referral?.telegram_id}, IP Address: ${referral?.IP_address}, Location: ${referral?.location}, XP: ${referral?.xp})</li>
                `).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    fs.writeFileSync(filePath, fileContent);
    console.log("File saved successfully.");
  } catch (error) {
    console.error("Error fetching users with more than 10 referrals and same IP:", error);
  }
};

export const downloadUsersWithMoreThan10ReferralsSameIP = (req: Request, res: Response) => {
  const filePath = path.join(__dirname, "../public/users_with_more_than_10_referrals_same_ip.html");
  res.download(filePath, "users_with_more_than_10_referrals_same_ip.html", (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).json({ message: err });
    }
  });
};

