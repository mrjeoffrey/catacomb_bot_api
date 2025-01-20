import { Request, Response } from "express";
import multer, { MulterError } from "multer";
import mime from "mime-types";

import Level from "../models/levelModel";
import TapGameLevel from "../models/tapGameLevelModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";
import { uploadImageToR2 } from "../utils/uploadImageToR2";

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

export const getAllTapGameLevels = async (req: Request, res: Response) => {
  try {
    const tapGameLevels = await TapGameLevel.find();

    if (!tapGameLevels || tapGameLevels.length === 0) {
      return res.status(404).json({ message: "No TapGameLevels found." });
    }

    return res.status(200).json({ message: "TapGameLevels fetched successfully", data: tapGameLevels });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching TapGameLevels", error: err });
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

    return res.status(200).json({ message: "TapGameLevel fetched successfully", data: tapGameLevel });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching TapGameLevel", error: err });
  }
};


export const createTapGameLevel = async (req: Request, res: Response) => {
  try {
    const { level_index, required_user_levels, xp_earning_per_tap, gold_earning_per_tap, pyramid_image, tap_limit_per_ticket } = req.body;

    // Check if the required user levels exist
    const levels = await Level.find({ _id: { $in: required_user_levels } });
    if (levels.length !== required_user_levels.length) {
      return res.status(400).json({ message: "Some levels in required_user_levels do not exist." });
    }
    let pyramid_image_url = ""
      if (pyramid_image) {
        try {
          const fileData = decodeBase64Image(pyramid_image);
          const mimeType = fileData.type;
          const fileExtension = mime.extension(mimeType);
          const uniqueFileName = `tap_pyramid_image-${Date.now()}.${fileExtension}`;
          // Upload image to Cloudflare R2
          pyramid_image_url = await uploadImageToR2(fileData.data, uniqueFileName);
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
    return res.status(201).json({ message: 'TapGameLevel created successfully', data: newTapGameLevel });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error creating TapGameLevel', error: err });
  }
};

export const updateTapGameLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tap_level, required_user_levels, xp_earning_per_tap, gold_earning_per_tap, pyramid_image, tap_limit_per_ticket } = req.body;

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
      return res.status(400).json({ message: "Some levels in required_user_levels do not exist." });
    }

    // Update the TapGameLevel document
    tapGameLevel.tap_level = tap_level || tapGameLevel.tap_level;
    tapGameLevel.required_user_levels = required_user_levels || tapGameLevel.required_user_levels;
    tapGameLevel.xp_earning_per_tap = xp_earning_per_tap || tapGameLevel.xp_earning_per_tap;
    tapGameLevel.gold_earning_per_tap = gold_earning_per_tap || tapGameLevel.gold_earning_per_tap;
    tapGameLevel.pyramid_image_url = imageUrl || tapGameLevel.pyramid_image_url;
    tapGameLevel.tap_limit_per_ticket = tap_limit_per_ticket || tapGameLevel.tap_limit_per_ticket;

    await tapGameLevel.save();
    return res.status(200).json({ message: 'TapGameLevel updated successfully', data: tapGameLevel });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error updating TapGameLevel', error: err });
  }
};

export const deleteTapGameLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;  // Extract the id from the URL parameters

    // Check if the TapGameLevel exists
    const tapGameLevel = await TapGameLevel.findByIdAndDelete(id);
    if (!tapGameLevel) {
      return res.status(404).json({ message: "TapGameLevel not found." });
    }

    return res.status(200).json({ message: 'TapGameLevel deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error deleting TapGameLevel', error: err });
  }
};

export const uploadImage = upload.single("pyramid_image");