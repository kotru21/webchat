import mongoose from "mongoose";
import Message from "../Models/messageModel.js";

// aggregation pipeline
export const getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          isPrivate: true,
          isDeleted: { $ne: true },
          $or: [{ sender: userObjectId }, { receiver: userObjectId }],
        },
      },
      { $sort: { createdAt: -1 } },
      // otherUser и флаг непрочитанного
      {
        $addFields: {
          otherUser: {
            $cond: [{ $eq: ["$sender", userObjectId] }, "$receiver", "$sender"],
          },
          isUnreadForCurrentUser: {
            $cond: [
              {
                $and: [
                  { $ne: ["$sender", userObjectId] }, // сообщение не от нас
                  { $not: [{ $in: [userObjectId, "$readBy"] }] }, // мы не прочитали
                  { $ne: ["$isDeleted", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
      { $match: { otherUser: { $ne: userObjectId } } },
      {
        $group: {
          _id: "$otherUser",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: { $sum: "$isUnreadForCurrentUser" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          user: {
            _id: "$user._id",
            username: "$user.username",
            email: "$user.email",
            avatar: "$user.avatar",
            status: { $ifNull: ["$user.status", "offline"] },
          },
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            mediaUrl: "$lastMessage.mediaUrl",
            mediaType: "$lastMessage.mediaType",
            isDeleted: "$lastMessage.isDeleted",
            createdAt: "$lastMessage.createdAt",
            sender: "$lastMessage.sender",
            receiver: "$lastMessage.receiver",
            isPinned: "$lastMessage.isPinned",
          },
          unreadCount: 1,
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ];

    const chats = await Message.aggregate(pipeline).exec();
    res.json(chats);
  } catch (error) {
    console.error("Ошибка при получении списка чатов (agg):", error);
    res.status(500).json({ message: "Ошибка при получении списка чатов" });
  }
};
