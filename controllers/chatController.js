
const { ObjectId } = require("mongodb");
const { getIO } = require("../socket/socket");
const { getCollection } = require("../utils/getCollection");


const sendMessages = async (req, res) => {
  const io = getIO();
  try {
    const { message, senderId } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    const messageCollection = getCollection("messages");
    const userCollection = getCollection("users");
    const user = await userCollection.findOne({ $or:[
     { _id: senderId },
     {_id:new ObjectId(senderId)}
    ]
  });

    const msgDoc = {
      senderId: senderId,
      receiverRole: "admin",
      message,
      userName: user.fullName,
      timeStamp: new Date(),
    };

    await messageCollection.insertOne(msgDoc);

    const admins = await userCollection.find({ role: "admin" }).toArray();
    admins.forEach((admin) => {
      io.to(admin._id.toString()).emit("receiveMessage", msgDoc);
    });

    return res.status(200).json({ success: true, message: msgDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};


const getMessages = async (req, res) => {
  try {
    const { userId } = req.query; 
    const messageCollection = getCollection("messages");

    const query = userId
      ? {
          $or: [
            { senderId: userId },     
            { receiverId: userId },   
          ],
        }
      : {};

    const messages = await messageCollection.find(query).sort({ timeStamp: 1 }).toArray();
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};
const replyMessages = async (req, res) => {
  const io = getIO();
  try {
    const { message, adminId, userId } = req.body; 

    if (!message) return res.status(400).json({ error: "Message required" });

    const messageCollection = getCollection("messages");
    const userCollection = getCollection("users");

    // Check if user has sent a message to this admin
    const userSentMsg = await messageCollection.findOne({
      senderId: userId,
      receiverRole: "admin"
    });

    if (!userSentMsg) {
      return res.status(403).json({ error: "You can only reply to users who contacted you first" });
    }

    const admin = await userCollection.findOne({ _id: adminId });

    const msgDoc = {
      senderId: adminId,
      receiverId: userId,
      message,
      userName: admin.fullName,
      timeStamp: new Date(),
    };

    await messageCollection.insertOne(msgDoc);

    io.to(userId.toString()).emit("receiveMessage", msgDoc);

    return res.status(200).json({ success: true, message: msgDoc });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to reply message" });
  }
};




module.exports = {sendMessages,getMessages,replyMessages}