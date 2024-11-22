import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config";

export const generateToken = (
  payload: object,
  expiresIn: string | number = "1h"
) => jwt.sign(payload, JWT_SECRET, { expiresIn });

export const verifyToken = (token: string) => jwt.verify(token, JWT_SECRET);
