const Message = require("../../Schema/message.js");
const Chat = require('../../Schema/Chat.js')
const User = require('../../Schema/User.js')

const allMessage = async (req, res) => {
 try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name image email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }


};

module.exports = allMessage ;


