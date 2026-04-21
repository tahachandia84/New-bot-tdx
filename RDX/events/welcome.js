module.exports = {
  config: { credits: "SARDAR RDX",
    name: 'welcome',
    eventType: 'log:subscribe',
    description: 'Welcome new members'
  },
  
  async run({ api, event, send, Users, Threads, config }) {
    const { threadID, logMessageData } = event;
    const addedParticipants = logMessageData.addedParticipants || [];
    const botID = api.getCurrentUserID();
    
    // Fast check for anti-join without full settings fetch if possible
    const settings = await Threads.getSettings(threadID);
    if (settings.antijoin) {
      for (const participant of addedParticipants) {
        if (participant.userFbId === botID) continue;
        api.removeUserFromGroup(participant.userFbId, threadID).catch(() => {});
      }
      return;
    }
    
    const newMembers = addedParticipants.filter(p => p.userFbId !== botID);
    if (newMembers.length === 0) return;

    // Check for bot owner/admin
    const adminBots = config.ADMINBOT || [];
    for (const member of newMembers) {
      if (adminBots.includes(member.userFbId)) {
        const ownerMsg = `👑 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗠𝗬 𝗢𝗪𝗡𝗘𝗥 👑\n\n` +
          `🌹 ꧁ ${member.fullName || 'TAHA RDX'} ꧂ 🌹\n\n` +
          `📢 ASSLAM O ALAIKUM OWNER  AP KA WELCOME KRTI HO MA !\n` +
          `💖 AP KA BOT AP KA ANE PA BUHT HAPPY HY ..`;
        
        try {
          await api.sendMessage(ownerMsg, threadID);
        } catch (e) {
          console.log("Owner welcome error:", e.message);
        }
      }
    }

    // Start GIF fetch immediately in background
    const axios = require('axios');
    const GIF_URLS = [
      'https://i.ibb.co/WWRt2Vsy/2b3439f71d76.gif',
      'https://i.ibb.co/nNK2TX75/dc82e95aba67.gif',
      'https://i.ibb.co/tMK00Qct/a008ff0dca24.gif'
    ];
    const randomGifUrl = GIF_URLS[Math.floor(Math.random() * GIF_URLS.length)];
    const gifPromise = axios.get(randomGifUrl, { responseType: 'stream' }).catch(() => null);

    // Prepare message data quickly
    const moment = require('moment-timezone');
    const joinDate = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('DD/MM/YYYY');
    const joinTime = moment().tz(config.TIMEZONE || 'Asia/Karachi').format('hh:mm:ss A');

    let welcomeMsg = `╭──〔❨✧✧❩〕──╮
  ✨ 𝐀𝐃𝐃 𝐍𝐄𝐖 𝐌𝐄𝐌𝐁𝐄𝐑 ✨  
╰──〔❨✧✧❩〕──╯\n\n`;
    welcomeMsg += `🎊 New Member Alert 🎊\n${'⫘⫘'.repeat(5)}\n`;

    const dbOps = [];
    for (let i = 0; i < newMembers.length; i++) {
      const member = newMembers[i];
      const name = member.fullName || 'Amazing Member';
      welcomeMsg += `👑 ${i + 1}. ${name}\n`;
      dbOps.push(Users.create(member.userFbId, name));
    }

    welcomeMsg += `\n${'꘏'.repeat(18)}\n📊 Stats: 📅 ${joinDate} | 🕐 ${joinTime}\n\n💡 Try: ${config.PREFIX}help\n🎉 Enjoy your stay! 🎉`;

    // Finalize DB operations in background
    Promise.all(dbOps).catch(() => {});

    // Get the GIF and send
    const response = await gifPromise;
    if (response && response.data) {
      return api.sendMessage({
        body: welcomeMsg,
        attachment: response.data
      }, threadID);
    } else {
      return api.sendMessage(welcomeMsg, threadID);
    }
  }
};

