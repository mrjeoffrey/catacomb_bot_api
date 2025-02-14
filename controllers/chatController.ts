import Chat, { IChat } from "../models/chatModel";
import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import axios from "axios";
import {
  BOT_API_URL,
  oneDayInMs,
  oneHourInMs,
  oneMinuteInMs,
  oneSecondInMs,
} from "../config/config";

export const saveChatHistory = async (
  telegram_id: number,
  message_id: number,
  text: string,
  date: Date,
  from_bot: boolean,
  reason: string
) => {
  try {
    const newChat = new Chat({
      telegram_id,
      message_id,
      text,
      date,
      from_bot,
      reason,
    });

    await newChat.save();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  const { telegram_id } = req.params;

  try {
    const chatHistory = await Chat.find({ telegram_id }).sort({ date: -1 });
    res.status(200).json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const sendTelegramMessage = async (
  telegram_id: number,
  message: string,
  reason: string = "private message"
) => {
  try {
    const response = await axios.post(`${BOT_API_URL}/send-messages`, [
      { telegram_id, message },
    ]);
    // Save the sent message to chat history
    await saveChatHistory(
      telegram_id,
      response.data.message_id,
      message,
      new Date(),
      true,
      reason
    );

    return response.data;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
};

// Endpoint to send a private message
export const sendPrivateMessage = async (req: Request, res: Response) => {
  const { telegram_id, message, reason } = req.body;

  try {
    const response = await sendTelegramMessage(telegram_id, message, reason);
    res.status(200).json({ message: "Message sent successfully", response });
  } catch (error) {
    res.status(500).json({ message: "Failed to send message", error });
  }
};

const sendMessagesInBatches = async (messages: any[], batchSize: number, delay: number) => {
  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    try {
      await axios.post(`${BOT_API_URL}/send-messages`, batch);
      for (const { telegram_id, message, reason } of batch) {
        await saveChatHistory(telegram_id, Date.now(), message, new Date(), true, reason);
      }
    } catch (error) {
      console.error("Error sending batch messages:", error);
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

export const checkUserActivityAndSendMessages = async () => {
  const users = await User.find();
  const now = new Date();
  const messagesToSend = [] as any[];

  for (const user of users) {
    if ([6430530130, 403768635, 5988754753].includes(user.telegram_id)) {
      const lastTaskDone =
        user.task_done.length > 0
          ? user.task_done[user.task_done.length - 1].completed_date
          : null;
      const lastTapGame =
        user.tap_game_history_per_day.length > 0
          ? user.tap_game_history_per_day[
              user.tap_game_history_per_day.length - 1
            ].date
          : null;
      const lastChestOpened =
        user.chest_opened_history.length > 0
          ? user.chest_opened_history[
              user.chest_opened_history.length - 1
            ].time_opened
          : null;

      const lastActivity = [lastTaskDone, lastTapGame, lastChestOpened, user.created_at]
        .filter((date) => date !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      const lastCheckIn =
        user.tickets_getting_history.length > 0
          ? user.tickets_getting_history[
              user.tickets_getting_history.length - 1
            ].date
          : user.created_at;

      const messages = [] as { message: string; reason: string }[];

      if (
        user.xp < 100 &&
        now.getTime() - user.created_at.getTime() >= oneDayInMs
      ) {
        messages.push({
          message:
            `Oh no! 😱 You’ve been using Catacomb for 24 hours but still have less than 100 XP. Start earning more XP now! 🎮 Press /start to play, work your way up the leaderboards, and claim your slice of our massive $USDT prize pool. 💎✨`,
          reason: "Less than 100 XP in 24 hours",
        });
      }

      if (
        user.xp >= 1000 &&
        now.getTime() - lastActivity.getTime() >= ( 7 * oneDayInMs )
      ) {
        messages.push({
          message:
            `Where are you? 😯 You have over 1000 XP but haven’t played or earned anything in 7 days. Come back and continue your journey! 🎮 Press /start to play.`,
          reason: `1000+ XP but inactive for 7 days`,
        });
      }

      if (
        user.xp >= 10000 &&
        now.getTime() - lastActivity.getTime() >= ( 30 * oneDayInMs )
      ) {
        messages.push({
          message:
            `You have over 10,000 XP but haven’t played or earned anything in 30 days. Don’t miss out on the fun! 🎮 Press /start to play, climb the leaderboards, and claim your slice of our massive $USDT prize pool. 💎✨`,
          reason: `10000+ XP but inactive for 30 days`,
        });
      }

      if (
        now.getTime() - lastCheckIn.getTime() >= 
        (oneDayInMs + oneHourInMs) &&
        !user.tickets_getting_history.some(
          (entry) => entry.date.toDateString() === now.toDateString()
        )
      ) {
        messages.push({
          message:
            `Hey 👋 Are you around? You haven’t claimed your tickets for today yet! 🎟 Press /start and claim them now!`,
          reason: `Unclaimed tickets for today`,
        });
      }

      if (
        user.xp >= 5000 &&
        user.tap_game_history_per_day.length > 0 &&
        now.getTime() - (lastTapGame?lastTapGame.getTime():0) >= 3 * oneDayInMs
      ) {
        messages.push({
          message:
            `Where have you been? 🧐 You’ve got over 5,000 XP but haven’t played the tap game in 72 hours! 🎮 Don’t fall behind—press /start now, climb the leaderboards, and grab your share of our massive $USDT prize pool! 💎✨`,
          reason: `5000+ XP but inactive in tap game for 72 hours`,
        });
      }

      const chatHistory = await Chat.find({ telegram_id: user.telegram_id });

      if (
        user.valid_referrals.length >= 5 &&
        !chatHistory.some(
          (chat) => chat.reason === `Reached 5 valid referrals`
        )
      ) {
        messages.push({
          message:
            `Congratulations! 🥳 You’ve reached 5 valid referrals 🏆 Why stop now? Keep inviting friends and family, rack up XP, and earn 10% of their gold—for life! 🤑🤑 Press /start to play.`,
          reason: `Reached 5 valid referrals`,
        });
      }

      if (
        user.valid_referrals.length >= 20 &&
        !chatHistory.some(
          (chat) => chat.reason === `Reached 20 valid referrals`
        )
      ) {
        messages.push({
          message:
            `Boom! 👊💥 You’ve smashed 20 valid referrals! But why stop now? Keep bringing in friends, rack up insane XP, and pocket 10% of their gold—for life! 🤑🤑 Press /start and keep the streak going!`,
          reason: `Reached 20 valid referrals`,
        });
      }

      for (const { message, reason } of messages) {
        messagesToSend.push({ telegram_id: user.telegram_id, message, reason });
      }
    }
  }

  try {
    await sendMessagesInBatches(messagesToSend, 10, 1000);
  } catch (error) {
    console.error("Error sending messages:", error);
  }
};

export const sendMassMessage = async (req: Request, res: Response) => {
  const { message } = req.body;
  try {
    const users = await User.find({}, "telegram_id");
    const messagesToSend = users.map((user: IUser) => ({
      telegram_id: user.telegram_id,
      message,
      reason: "Mass message",
    }));
    
    await sendMessagesInBatches(messagesToSend, 10, 1000);

    res.status(200).send("Success");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error sending mass message");
  }
};
