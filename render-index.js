const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { checkAdminPermissions } = require('./utils/permissions');
const { logActivity } = require('./utils/logger');
const { handleChannelCommands } = require('./commands/channelCommands');
const { handleMessageCommands } = require('./commands/messageCommands');
const express = require('express');
require('dotenv').config();

// Express server for health checks (keeps Render free tier alive)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    bot: client.user ? client.user.tag : 'Not logged in',
    servers: client.guilds ? client.guilds.cache.size : 0,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

// Bot ready event
client.once('ready', () => {
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Set bot activity
  client.user.setActivity('Server Management | !help', { type: 'WATCHING' });
  
  logActivity('BOT_STARTED', {
    botTag: client.user.tag,
    serverCount: client.guilds.cache.size
  });
});

// Message handling
client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  // Only process guild messages
  if (!message.guild) return;
  
  // Ensure member is cached
  if (!message.member) {
    try {
      await message.guild.members.fetch(message.author.id);
    } catch (error) {
      console.error('Failed to fetch member:', error);
      return;
    }
  }

  // Check if message starts with bot prefix
  if (!message.content.startsWith('!')) return;

  // Parse command and arguments
  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  // Check admin permissions
  if (!checkAdminPermissions(message.member)) {
    return message.reply("❌ You must be an administrator to use this bot.");
  }

  // Log command usage
  logActivity('COMMAND_USED', {
    command: command,
    user: message.author.tag,
    userId: message.author.id,
    guild: message.guild.name,
    guildId: message.guild.id
  });

  try {
    // Route commands to appropriate handlers
    if (['!createchannels', '!deletechannels', '!listchannels'].includes(command)) {
      await handleChannelCommands(message, command, args);
    } else if (['!bulkmessage', '!spammessage', '!announce'].includes(command)) {
      await handleMessageCommands(message, command, args);
    } else if (command === '!help') {
      await showHelp(message);
    } else {
      await message.reply("❓ Unknown command. Use `!help` to see available commands.");
    }
  } catch (error) {
    console.error(`Error handling command ${command}:`, error);
    await message.reply("❌ An error occurred while processing your command. Please try again.");
    
    logActivity('COMMAND_ERROR', {
      command: command,
      error: error.message,
      user: message.author.tag,
      guild: message.guild.name
    });
  }
});

// Help command
async function showHelp(message) {
  const helpEmbed = {
    color: 0x0099ff,
    title: '🤖 Discord Server Management Bot',
    description: 'Admin-only bot for mass channel operations and bulk messaging',
    fields: [
      {
        name: '📁 Channel Commands',
        value: '`!createchannels <name> <count>` - Create multiple channels (up to 300)\n' +
               '`!deletechannels <pattern>` - Delete channels matching pattern\n' +
               '`!listchannels [pattern]` - List channels (optionally filtered)',
        inline: false
      },
      {
        name: '📢 Message Commands',
        value: '`!bulkmessage <pattern> <message>` - Send message to matching channels (up to 4000 chars)\n' +
               '`!spammessage <pattern> <count> <message>` - Send multiple messages per channel (up to 300 per channel)\n' +
               '`!announce <message>` - Send announcement to all text channels (up to 4000 chars)',
        inline: false
      },
      {
        name: '🔧 Utility Commands',
        value: '`!help` - Show this help message',
        inline: false
      },
      {
        name: '⚠️ Safety Notes',
        value: '• Deletion commands require confirmation\n' +
               '• All operations are logged\n' +
               '• Rate limiting prevents API abuse\n' +
               '• Only administrators can use commands',
        inline: false
      }
    ],
    footer: {
      text: 'Use commands responsibly • Bot created for server management'
    },
    timestamp: new Date()
  };

  await message.reply({ embeds: [helpEmbed] });
}

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
  logActivity('CLIENT_ERROR', { error: error.message });
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
  logActivity('UNHANDLED_REJECTION', { error: error.message });
});

// Login with bot token
const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

client.login(token);