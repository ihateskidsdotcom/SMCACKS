# Discord Bot Deployment Guide for Render

## Quick Setup Steps

### 1. Create Render Account
- Go to https://render.com
- Sign up for a free account
- Connect your GitHub account

### 2. Prepare Your Code
- Create a new GitHub repository
- Upload all the bot files to your repository
- Make sure `package.json` is in the root directory

### 3. Deploy on Render

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository with your bot code

2. **Configure Service**
   - **Name**: `discord-server-bot` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" (limited hours) or "Starter" ($7/month for 24/7)

3. **Add Environment Variable**
   - Go to "Environment" tab
   - Add: `DISCORD_BOT_TOKEN` = `your_bot_token_here`
   - **Important**: Use your actual Discord bot token

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (2-5 minutes)

### 4. Keep Bot Running (Free Tier Limitation Fix)

Since Render free tier sleeps after 15 minutes of inactivity, add this to keep it alive:

**Option A: Use Uptime Robot (Recommended)**
- Go to https://uptimerobot.com
- Create a monitor for your Render URL
- Set it to ping every 5 minutes

**Option B: Add Health Check Endpoint**
```javascript
// Add this to your index.js file
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Discord Bot is running!');
});

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});
```

## File Structure for Render

```
your-repo/
├── package.json
├── index.js
├── commands/
│   ├── channelCommands.js
│   └── messageCommands.js
├── utils/
│   ├── logger.js
│   ├── permissions.js
│   └── rateLimiter.js
└── README.md
```

## Cost Breakdown

**Free Tier:**
- 750 hours/month (enough for ~25 days)
- Sleeps after 15 minutes of inactivity
- Good for testing

**Starter Plan ($7/month):**
- Always on (24/7)
- No sleep limitations
- Recommended for production

## Environment Variables Needed

- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `PORT`: Automatically set by Render (don't add manually)

## Troubleshooting

**Bot keeps sleeping?**
- Upgrade to Starter plan ($7/month) for 24/7 uptime
- Or use Uptime Robot to ping every 5 minutes

**Deployment fails?**
- Check your `package.json` has correct dependencies
- Verify `start` script is set to `node index.js`
- Make sure all files are in your GitHub repo

**Bot doesn't respond?**
- Check environment variables are set correctly
- Verify bot token is valid
- Check bot has proper Discord permissions

## Alternative: Railway Deployment

If you prefer Railway over Render:
1. Go to https://railway.app
2. Connect GitHub repo
3. Add `DISCORD_BOT_TOKEN` environment variable
4. Deploy automatically

Railway offers $5/month of free usage which is often enough for Discord bots.