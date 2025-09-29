const { ObjectId } = require("mongodb");
const { getIO } = require("../socket/socket");
const { getCollection } = require("../utils/getCollection");

const sendMessages = async (req, res) => {
    const io = getIO();
  try {
    const { message, userId } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    const messageCollection = getCollection("messages");
    const userCollection =getCollection("users")
    const user = await userCollection.findOne({_id:new ObjectId(userId)});
   
    const msgDoc = {
      senderId: userId,
      message,
      userName:user.fullName,
      timeStamp: new Date(),
    };
    await messageCollection.insertOne(msgDoc);
     const admins = await userCollection.find({role:"admin"}).toArray();
    admins.forEach((admin)=>{
        io.to(admin._id.tostring()).emit("receiveMessage",msgDoc)
    })
    io.emit("sendMessage", msgDoc);
    return res.status(200).json({ success: true, message: msgDoc });
  } catch (error) {
    return res.status(500).json({ error: "Failed to send message" });
  }
};

const getMessages = async(req,res)=>{
    try {
        const messageCollection = getCollection("messages");
        const messages = await messageCollection.find().sort({timeStamp:1}).toArray();
        res.json(messages)
    } catch (error) {
        res.status(500).json({ error: "Failed to load messages" });
    }
}

module.exports = {sendMessages,getMessages}