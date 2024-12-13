import { Request, Response } from "express";

export const logging = async (req: Request, res: Response) => {
  try {
    console.log(req.body, "LOGS___");
    res.status(200).json({ message: "LOGS+++" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
