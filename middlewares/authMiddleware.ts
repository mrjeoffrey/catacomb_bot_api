import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import { JWT_SECRET } from "../config/config";
import adminModel from "../models/adminModel";

// Middleware to verify JWT token and ensure the admin exists
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };

    // Check if the admin exists in the database
    const admin = await adminModel.findOne({ email: decoded.email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid token: Admin not found" });
    }

    // Token is valid, proceed to the next middleware or route
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
