import { Request, Response } from "express";
import Settings from "../models/settingsModel";
import { decodeBase64Image } from "../utils/decodeBase64Image";
import mime from "mime-types";
import multer from "multer";
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
    return cb(new Error("Invalid file type") as any, false); 

  cb(null, true);  // File is valid
};
}


const upload = multer({
  fileFilter,
});

export const updateCurrencySettings = async (req: Request, res: Response) => {
  const { currency_name, currency_link, currency_img } = req.body;
  let imageUrl = "";

  if (currency_img) {
    try {
      const fileData = decodeBase64Image(currency_img);
      const mimeType = fileData.type;
      const fileExtension = mime.extension(mimeType);
      const uniqueFileName = `currency_image-${Date.now()}.${fileExtension}`;
      console.log("+++uniqueFileName+++", uniqueFileName);
      // Upload image to Cloudflare R2
      imageUrl = await uploadImageToR2(fileData.data, uniqueFileName);

    } catch (error) {
      return res.status(400).json({ message: "Invalid image format" });
    }
  }

  // Validate required fields
  if (!currency_name || !currency_img) {
    return res.status(400).json({ message: "Currency name and image URL are required" });
  }

  try {
    const updateFields = {
      "season_settings.currency_name": currency_name,
      "season_settings.currency_link": currency_link,
    };
    console.log("____IMage url___", imageUrl)
    if (currency_img) {
      (updateFields as any)["season_settings.currency_img"] = imageUrl;
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSettings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Get Settings
export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await Settings.findOne();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Settings
export const updateSettings = async (req: Request, res: Response) => {
  const { opening_chest_earning, referral_earning, daily_opening_chests_limit } = req.body;

  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          opening_chest_earning,
          referral_earning,
          daily_opening_chests_limit
        },
      },
      { new: true }
    );

    if (!updatedSettings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update Season Prizes
export const updateSeasonPrizes = async (req: Request, res: Response) => {
  const { prizes } = req.body;

  if (!Array.isArray(prizes)) {
    return res.status(400).json({ message: "Prizes must be an array of numbers" });
  }

  try {
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      {
        $set: {
          "season_settings.prizes": prizes
        }
      },
      { new: true }
    );

    if (!updatedSettings) {
      return res.status(404).json({ message: "Settings not found" });
    }

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const uploadCurrencyImage = upload.single("currency_img");
