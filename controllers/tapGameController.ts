import { Request, Response } from "express";
import multer, { MulterError } from "multer";
import mime from "mime-types";
import CryptoJS from "crypto-js";

import Level from "../models/levelModel";
import TapGameLevel from "../models/tapGameLevelModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";
import { uploadImageToR2 } from "../utils/uploadImageToR2";
import User from "../models/userModel";
import levelModel from "../models/levelModel";
import { JWT_SECRET } from "../config/config";
import tapGameLevelModel from "../models/tapGameLevelModel";
import { getUserLevel } from "./levelController";

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
    "image/tiff",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type");
    return cb(null, false);
  }

  cb(null, true);
};

const upload = multer({
  fileFilter,
});

// Function to decrypt data
function decryptData(encryptedData: string) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, JWT_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Decryption failed");
  }
}

export const getUserTapLevelByUserXp = async (userXp: number) => {
  try {
    // Use getUserLevel to get the user's level and the seconds for the next chest opening
    const { level } = getUserLevel(userXp);

    // Find the tap level associated with the user's level
    const userLevel = await levelModel.findOne({ level }).sort({ level: -1 });

    if (!userLevel) {
      throw new Error("User level not found");
    }

    // Find the tap level based on the user’s level
    const tapLevel = await tapGameLevelModel
      .findOne({ required_user_levels: userLevel._id })
      .sort({ tap_level: -1 });

    if (!tapLevel) {
      throw new Error("Tap level not found for user level");
    }

    return tapLevel; // Return the tap level and chest opening time
  } catch (error) {
    console.error("Error getting user tap level:", error);
    throw new Error(error + "Failed to get user tap level");
  }
};

export const tappingPyramid = async (req: Request, res: Response) => {
  const { telegram_id, number_clicked } = req.body;
  // Ensure telegram_id is present
  if (!telegram_id) {
    return res
      .status(400)
      .send({ status: "error", message: "telegram id is required" });
  }

  try {
    // Decrypt number_clicked
    const decryptedNumber = decryptData(number_clicked);

    // Check if the decrypted value is a valid number
    if (isNaN(decryptedNumber)) {
      return res.status(400).send({
        status: "error",
        message: "number_clicked must be a valid number",
      });
    }
    console.log("Decrypted Data:", { number_clicked: decryptedNumber });

    const user = await User.findOne({ telegram_id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.current_available_taps < 1) {
      return res
        .status(400)
        .json({ message: "There isnt available Taps, Buy more Tickets !" });
    }

    // Fetch user's level based on XP
    const tapLevel = await getUserTapLevelByUserXp(user.xp);

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Reset time to 00:00:00

    let xp_earning_at_this_tapping = Math.floor(decryptedNumber / 2);
    let gold_earning_at_this_tapping = Math.floor(decryptedNumber / 2);
    if (decryptedNumber === 1) {
      if (user.current_available_taps % 2 === 1) gold_earning_at_this_tapping++;
      else xp_earning_at_this_tapping++;
    } else if (decryptedNumber % 2 === 1) {
      if (user.current_available_taps % 2 === 1) gold_earning_at_this_tapping++;
      else xp_earning_at_this_tapping++;
    }
    // Check if today's history already exists
    const todayHistory = user.tap_game_history_per_day.find(
      (history) =>
        history.date.toISOString().slice(0, 10) ===
        startOfDay.toISOString().slice(0, 10)
    );
    user.current_available_taps -= Math.floor(decryptedNumber);
    if (todayHistory) {
      // If today's history exists, update it with the new xp and gold values
      todayHistory.xp +=
        xp_earning_at_this_tapping * tapLevel.xp_earning_per_tap; // Example: increase xp based on decrypted number
      todayHistory.gold +=
        gold_earning_at_this_tapping * tapLevel.gold_earning_per_tap; // Calculate gold earned per tap
      // Save the updated user document
      await user.save();
    } else {
      // If today's history does not exist, create a new history entry
      user.tap_game_history_per_day.push({
        date: new Date(),
        xp: xp_earning_at_this_tapping * tapLevel.xp_earning_per_tap, // Example: set xp based on decrypted number
        gold: gold_earning_at_this_tapping * tapLevel.gold_earning_per_tap, // Example: calculate gold
      });

      // Save the updated user document
      await user.save();
    }
    res.json({
      message: "Tapped Pyramid",
      tapGameHistoryPerDay: user.tap_game_history_per_day,
      availableTaps: user.current_available_taps,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to calculate claimable tickets based on constructive days
const getClaimableTickets = (
  lastClaimDate: Date | null = null,
  lastClaimTickets: number,
  lastResetStatus: boolean | null = false
) => {
  const currentDate = new Date();

  if (!lastClaimDate) {
    return {
      claimable: 1,
      resetted: true,
    }; // If no last claim date, return 1 ticket by default
  }

  const timeDifference =
    currentDate.getTime() - new Date(lastClaimDate).getTime();
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const twoDaysInMs = 48 * 60 * 60 * 1000;

  // If more than 48 hours have passed, reset to 1 ticket
  if (timeDifference >= twoDaysInMs) {
    return {
      claimable: 1,
      resetted: true,
    }; 
  }

  // If between 24 and 48 hours, calculate based on the number of tickets claimed last time
  if (timeDifference >= oneDayInMs) {
    if(lastResetStatus)  return  {
      claimable: 1,
      resetted: false,
    };
    return  {
      claimable: Math.min(lastClaimTickets + 1, 4),
      resetted: false,
    }; ; // Add 1 ticket up to a maximum of 4
  }

  return {claimable: 0,
    resetted: false,}; // Less than 24 hours, no tickets to claim
};

export const claimDailyTicket = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  const user = await User.findOne({ telegram_id });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const lastClaim = user.tickets_getting_history
    .filter((history) => history.due_to === "daily")
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Get the most recent daily claim

  const currentDate = new Date();

  const claimableTickets = lastClaim[0]
  ? getClaimableTickets(lastClaim[0].date, lastClaim[0].number_of_tickets, lastClaim[0]?.resetted)
  : getClaimableTickets(null, 0, null);

  if (claimableTickets.claimable === 0) {
    return res.status(200).json({ message: "Tickets already claimed for today" });
  }

  // Update user history and tickets
  user.tickets_getting_history.push({
    date: currentDate,
    number_of_tickets: claimableTickets.claimable,
    resetted: claimableTickets.resetted,
    due_to: "daily",
  });
  user.tickets_remaining += claimableTickets.claimable;
  await user.save();

  return res.status(200).json({
    message: `Claim ${claimableTickets.claimable} ticket(s)`,
    ticketsClaimed: claimableTickets.claimable,
    ticketsRemaining: user.tickets_remaining,
    resetted: claimableTickets.resetted,
  });

};

export const gettingTicketInfo = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;

  const user = await User.findOne({ telegram_id });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const lastClaim = user.tickets_getting_history
    .filter((history) => history.due_to === "daily")
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Get the most recent daily claim

  // If no previous claim, start fresh
  const claimableTickets = lastClaim[0]
  ? getClaimableTickets(lastClaim[0].date, lastClaim[0].number_of_tickets, lastClaim[0]?.resetted)
  : getClaimableTickets(null, 0, null);


  const message = claimableTickets.claimable === 0 
    ? "Tickets already claimed for today" 
    : `Claim ${claimableTickets.claimable} ticket(s)`;

  return res.status(200).json({
    message,
    claimableTickets,
    current_date: new Date(),
    ticketsRemaining: user.tickets_remaining,
    ticketsClaimingHistory: user.tickets_getting_history,
    resetted: claimableTickets.resetted
  });
}

export const ticketToTaps = async (req: Request, res: Response) => {
  const { telegram_id } = req.body;
  const user = await User.findOne({ telegram_id });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.tickets_remaining < 1) {
    return res.status(400).json({ message: "Not enough tickets" });
  }
  user.tickets_remaining--;
  const tapLevel = await getUserTapLevelByUserXp(user.xp);
  user.current_available_taps += tapLevel.tap_limit_per_ticket;
  await user.save();
};

export const getAllTapGameLevels = async (req: Request, res: Response) => {
  try {
    const tapGameLevels = await TapGameLevel.find();

    if (!tapGameLevels || tapGameLevels.length === 0) {
      return res.status(404).json({ message: "No TapGameLevels found." });
    }

    return res.status(200).json({
      message: "TapGameLevels fetched successfully",
      data: tapGameLevels,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error fetching TapGameLevels", error: err });
  }
};

export const getTapGameLevelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Extract the id from the URL parameters

    // Find the TapGameLevel by ID
    const tapGameLevel = await TapGameLevel.findById(id);

    if (!tapGameLevel) {
      return res.status(404).json({ message: "TapGameLevel not found." });
    }

    return res.status(200).json({
      message: "TapGameLevel fetched successfully",
      data: tapGameLevel,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error fetching TapGameLevel", error: err });
  }
};

export const createTapGameLevel = async (req: Request, res: Response) => {
  try {
    const {
      level_index,
      required_user_levels,
      xp_earning_per_tap,
      gold_earning_per_tap,
      pyramid_image,
      tap_limit_per_ticket,
    } = req.body;

    // Check if the required user levels exist
    const levels = await Level.find({ _id: { $in: required_user_levels } });
    if (levels.length !== required_user_levels.length) {
      return res
        .status(400)
        .json({ message: "Some levels in required_user_levels do not exist." });
    }
    let pyramid_image_url = "";
    if (pyramid_image) {
      try {
        const fileData = decodeBase64Image(pyramid_image);
        const mimeType = fileData.type;
        const fileExtension = mime.extension(mimeType);
        const uniqueFileName = `tap_pyramid_image-${Date.now()}.${fileExtension}`;
        // Upload image to Cloudflare R2
        pyramid_image_url = await uploadImageToR2(
          fileData.data,
          uniqueFileName
        );
      } catch (error) {
        return res.status(400).json({ message: "Invalid image format" });
      }
    }

    const newTapGameLevel = new TapGameLevel({
      level_index,
      required_user_levels,
      xp_earning_per_tap,
      gold_earning_per_tap,
      pyramid_image_url,
      tap_limit_per_ticket,
    });

    await newTapGameLevel.save();
    return res.status(201).json({
      message: "TapGameLevel created successfully",
      data: newTapGameLevel,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error creating TapGameLevel", error: err });
  }
};

export const updateTapGameLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      tap_level,
      required_user_levels,
      xp_earning_per_tap,
      gold_earning_per_tap,
      pyramid_image,
      tap_limit_per_ticket,
    } = req.body;

    // Check if the TapGameLevel exists
    const tapGameLevel = await TapGameLevel.findById(id);
    if (!tapGameLevel) {
      return res.status(404).json({ message: "TapGameLevel not found." });
    }

    let imageUrl = tapGameLevel?.pyramid_image_url;
    if (pyramid_image) {
      const fileData = decodeBase64Image(pyramid_image);
      const mimeType = fileData.type;
      const fileExtension = mime.extension(mimeType);
      const uniqueFileName = `tap_pyramid_image-${Date.now()}.${fileExtension}`;
      // Upload image to Cloudflare R2
      imageUrl = await uploadImageToR2(fileData.data, uniqueFileName);
    }

    // Check if the required user levels exist
    const levels = await Level.find({ _id: { $in: required_user_levels } });
    if (levels.length !== required_user_levels.length) {
      return res
        .status(400)
        .json({ message: "Some levels in required_user_levels do not exist." });
    }

    // Update the TapGameLevel document
    tapGameLevel.tap_level = tap_level || tapGameLevel.tap_level;
    tapGameLevel.required_user_levels =
      required_user_levels || tapGameLevel.required_user_levels;
    tapGameLevel.xp_earning_per_tap =
      xp_earning_per_tap || tapGameLevel.xp_earning_per_tap;
    tapGameLevel.gold_earning_per_tap =
      gold_earning_per_tap || tapGameLevel.gold_earning_per_tap;
    tapGameLevel.pyramid_image_url = imageUrl || tapGameLevel.pyramid_image_url;
    tapGameLevel.tap_limit_per_ticket =
      tap_limit_per_ticket || tapGameLevel.tap_limit_per_ticket;

    await tapGameLevel.save();
    return res.status(200).json({
      message: "TapGameLevel updated successfully",
      data: tapGameLevel,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error updating TapGameLevel", error: err });
  }
};

export const deleteTapGameLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // Extract the id from the URL parameters

    // Check if the TapGameLevel exists
    const tapGameLevel = await TapGameLevel.findByIdAndDelete(id);
    if (!tapGameLevel) {
      return res.status(404).json({ message: "TapGameLevel not found." });
    }

    return res
      .status(200)
      .json({ message: "TapGameLevel deleted successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "Error deleting TapGameLevel", error: err });
  }
};

export const uploadImage = upload.single("pyramid_image");
