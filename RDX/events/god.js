module.exports = {
  config: {
    name: "god",
    eventType: ["log:unsubscribe", "log:subscribe", "log:thread-name"],
    version: "1.0.2",
    credits: "SARDAR RDX",
    description: "Record bot activity notifications!"
  },

  async run({ api, event, Threads, Users }) {
    const moment = require("moment-timezone");
    const config = global.config || require("../../config.json");
    const NOTIFY_TID = config.NOTIFY_TID || "100085636015827";
    const botID = api.getCurrentUserID();
    
    // Ignore events from the bot itself to prevent loops or unnecessary logs
    if (event.author == botID && event.logMessageType !== "log:unsubscribe") return;

    let task = "";
    let isBotEvent = false;

    switch (event.logMessageType) {
      case "log:subscribe": {
        if (event.logMessageData.addedParticipants.some(i => i.userFbId == botID)) {
          task = "📥 Bot added to a new group!";
          isBotEvent = true;
        }
        break;
      }
      case "log:unsubscribe": {
        if (event.logMessageData.leftParticipantFbId == botID) {
          task = "📤 Bot kicked/removed from group!";
          isBotEvent = true;
        }
        break;
      }
      case "log:thread-name": {
        // Keeping thread name changes as they are usually important for bot tracking
        const newName = event.logMessageData.name || "None";
        task = `📝 Name Change: '${newName}'`;
        isBotEvent = true; 
        break;
      }
    }

    // Only send notification if it's a bot-related event
    if (!isBotEvent || !task) return;

    let threadName = "Unknown Group";
    let memberCount = 0;
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      threadName = threadInfo.threadName || "Unknown Group";
      memberCount = threadInfo.participantIDs.length;
    } catch (e) {
      console.log("God event thread info error:", e.message);
    }

    let authorName = "System";
    if (event.author) {
      try {
        authorName = await Users.getNameUser(event.author);
      } catch (e) {
        authorName = "Unknown User";
      }
    }

    const time = moment().tz(config.TIMEZONE || "Asia/Karachi").format("DD/MM/YYYY | hh:mm:ss A");
    
    const reportMsg = `╭──〔 🔔 𝐁𝐎𝐓 𝐋𝐎𝐆𝐒 🔔 〕──╮\n` +
                      `│\n` +
                      `│ 📌 Action: ${task}\n` +
                      `│ 👥 Group: ${threadName}\n` +
                      `│ 🆔 TID: ${event.threadID}\n` +
                      `│ 📊 Members: ${memberCount}\n` +
                      `│ 👤 Author: ${authorName}\n` +
                      `│ 🆔 UID: ${event.author || "System"}\n` +
                      `│\n` +
                      `├───────────────────\n` +
                      `│ ⏰ ${time}\n` +
                      `╰───────────────────╯`;

    return api.sendMessage(reportMsg, NOTIFY_TID).catch(err => console.log("God notification error:", err.message));
  }
};

