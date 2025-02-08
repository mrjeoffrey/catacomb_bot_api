import Chat, { IChat } from "../models/chatModel";
import { Request, Response } from "express";
import User, { IUser } from "../models/userModel";
import axios from "axios";
import TelegramBot from 'node-telegram-bot-api';
import { oneDayInMs, TELEGRAM_BOT_TOKEN } from "../config/config";

const token = TELEGRAM_BOT_TOKEN
const bot = new TelegramBot(token, { polling: true });

export const saveChatHistory = async (telegram_id: number, message_id: number, text: string, date: Date, from_bot: boolean) => {
  try {
    // Check if the message already exists
    const existingChat = await Chat.findOne({ telegram_id, message_id });
    if (existingChat) {
      console.log("Message already exists in the database:", message_id);
      return;
    }

    const newChat = new Chat({
      telegram_id,
      message_id,
      text,
      date,
      from_bot,
    });

    await newChat.save();
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

export const saveChatMessage = async (telegram_id: number, message: string) => {
  try {
    const newChat = new Chat({
      telegram_id,
      message_id: Date.now(), // Use current timestamp as a unique message ID
      text: message,
      date: new Date(),
      from_bot: false,
    });

    await newChat.save();
  } catch (error) {
    console.error("Error saving chat message:", error);
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

export const sendTelegramMessage = async (telegram_id: number, message: string) => {
  try {
    const response = await bot.sendMessage(telegram_id, message);

    // Save the sent message to chat history
    await saveChatHistory(telegram_id, response.message_id, message, new Date(response.date * 1000), true);

    // Return the response data (chat_id, date, etc.)
    return response;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error; // rethrow the error to be handled by caller
  }
};

const sendTelegramMultiMessages = async (telegram_id: number, messages: string[]) => {
  try {
    // Sending messages in batches with a delay between each message
    const batchSize = 5; // Adjust the batch size as needed
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      // Create a list of promises to send messages
      const messagePromises = batch.map(message => sendTelegramMessage(telegram_id, message));
      
      // Wait for all promises in the batch to complete
      const responses = await Promise.all(messagePromises);

      // Process the responses (you can log the response data like date, chat_id, etc.)
      responses.forEach(response => {
        console.log("Message sent successfully:", response);
      });
      
      // Delay for the next batch (e.g., 1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Error sending Telegram messages:", error);
  }
};

export const checkUserActivityAndSendMessages = async () => {
  const users = await User.find();
  const now = new Date();

  for (const user of users) {
    const lastActivity = user.task_done.length > 0 ? user.task_done[user.task_done.length - 1].completed_date : user.created_at;
    const lastCheckIn = user.tickets_getting_history.length > 0 ? user.tickets_getting_history[user.tickets_getting_history.length - 1].date : user.created_at;
    const lastTapGame = user.tap_game_history_per_day.length > 0 ? user.tap_game_history_per_day[user.tap_game_history_per_day.length - 1].date : user.created_at;

    const messages = [] as string[];

    // 1. Player has opened the bot 24 hours ago but still has less than 100 XP.
    if (user.xp < 100 && (now.getTime() - user.created_at.getTime()) >= oneDayInMs) {
      messages.push("You have been using the bot for 24 hours but still have less than 100 XP. Start earning more XP now!");
    }

    // 2. Player has 1000 XP+ XP but hasn't played/earned anything for 7 days.
    if (user.xp >= 1000 && (now.getTime() - lastActivity.getTime()) >= 7 * oneDayInMs) {
      messages.push("You have over 1000 XP but haven't played or earned anything for 7 days. Come back and continue your journey!");
    }

    // 3. Player has 10000 XP+ XP but hasn't played/earned anything for 30 days.
    if (user.xp >= 10000 && (now.getTime() - lastActivity.getTime()) >= 30 * oneDayInMs) {
      messages.push("You have over 10000 XP but haven't played or earned anything for 30 days. Don't miss out on the fun!");
    }

    // 4. Player has checked-in 25 hours before and claimed his tickets but hasn't claimed the ones of the current day yet.
    if ((now.getTime() - lastCheckIn.getTime()) >= 25 * 60 * 60 * 1000 && !user.tickets_getting_history.some(entry => entry.date.toDateString() === now.toDateString())) {
      messages.push("You haven't claimed your tickets for today yet. Claim them now!");
    }

    // 5. Player has 5000 XP+, has played the tap game before, and now hasn't played the tap game for 72 hours.
    if (user.xp >= 5000 && user.tap_game_history_per_day.length > 0 && (now.getTime() - lastTapGame.getTime()) >= 72 * 60 * 60 * 1000) {
      messages.push("You have over 5000 XP but haven't played the tap game for 72 hours. Play now and earn more rewards!");
    }

    // 6. Player has reached 5 valid referrals.
    if (user.valid_referrals.length === 5) {
      messages.push("Congratulations! You have reached 5 valid referrals. Keep inviting more friends!");
    }

    // 7. Player has reached 20 valid referrals.
    if (user.valid_referrals.length === 20) {
      messages.push("Amazing! You have reached 20 valid referrals. You're a true champion!");
    }

    if (messages.length > 0) {
      await sendTelegramMultiMessages(user.telegram_id, messages);
    }
  }
};

export const sendMassMessage = async (req: Request, res: Response) => {
  const { batch, batch_size } = req.body;
  const range = parseInt(batch) * batch_size;
  const USER_INFO_API = 'https://bot-api.catacomb.fyi/api/user/basic-info';
  try {
    const userInfo = await axios.get(USER_INFO_API);
    const users = userInfo.data;
    const userIds = users.map((user: any) => user.telegram_id);

    const MESSAGE = `
Sample Message   
    `;

    const startIdx = batch_size * (parseInt(batch) - 1);
    const userBatch = userIds.slice(startIdx, range);

    for (const userId of userBatch) {
      try {
        await sendTelegramMultiMessages(userId, [MESSAGE]);
      } catch (err) {
        console.log(err);
      }
    }

    res.status(200).send("Success");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error sending mass message");
  }
};




